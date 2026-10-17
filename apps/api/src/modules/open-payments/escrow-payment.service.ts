import { randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import {
  createAuthenticatedClient,
  isFinalizedGrantWithAccessToken,
  isPendingGrant,
  OpenPaymentsClientError,
  type AuthenticatedClient,
  type WalletAddress,
} from '@interledger/open-payments';
import {
  ESCROW_WALLET_ADDRESS,
  PLATFORM_OWNER_WALLET_ADDRESS,
} from '@taskstream/shared-schemas';
import { DomainError } from '../identity/domain-error';
import { readPlatformPrivateKey } from './open-payments.service';

export type FundingPending = {
  status: 'PENDING_INTERACTION';
  incomingPaymentUrl: string;
  quoteId: string;
  interactRedirectUri: string;
  continueUri: string;
  continueAccessToken: string;
  clientNonce: string;
  finishNonce: string;
  buyerAuthServerUrl: string;
  assetCode: string;
  assetScale: number;
  amountValue: string;
};

export type FundingCompleted = {
  status: 'COMPLETED';
  incomingPaymentUrl: string;
  outgoingPaymentUrl: string;
};

/**
 * Open Payments real para custodia (fondeo buyer→escrow) y desembolso 96/4.
 * Activar con `OPEN_PAYMENTS_REAL=1` y credenciales de Test Wallet.
 *
 * Nota de gobernanza: el usuario autorizó consumo real de la API para el demo;
 * este archivo es el puerto 🛡️ SPEC-06 (`T-F3-BE1-01`).
 */
@Injectable()
export class EscrowPaymentService {
  private clientPromise: Promise<AuthenticatedClient> | null = null;

  isRealEnabled(): boolean {
    const flag = (process.env.OPEN_PAYMENTS_REAL ?? '').trim().toLowerCase();
    if (flag === '1' || flag === 'true' || flag === 'yes') return true;
    // Auto: hay clave de cliente + se pidió explícitamente no simular.
    return false;
  }

  escrowWalletUrl(): string {
    return (
      process.env.OPEN_PAYMENTS_ESCROW_WALLET_ADDRESS?.trim() ||
      process.env.OPEN_PAYMENTS_CLIENT_WALLET_ADDRESS?.trim() ||
      ESCROW_WALLET_ADDRESS
    );
  }

  platformOwnerWalletUrl(): string {
    // Si no hay wallet dueño configurada, el 4 % vuelve a la misma custodia (demo testnet).
    return (
      process.env.OPEN_PAYMENTS_PLATFORM_OWNER_WALLET_ADDRESS?.trim() ||
      this.escrowWalletUrl() ||
      PLATFORM_OWNER_WALLET_ADDRESS
    );
  }

  escrowAccessToken(): string {
    return process.env.OPEN_PAYMENTS_ESCROW_ACCESS_TOKEN?.trim() ?? '';
  }

  private async client(): Promise<AuthenticatedClient> {
    if (!this.clientPromise) {
      const walletAddressUrl = process.env.OPEN_PAYMENTS_CLIENT_WALLET_ADDRESS?.trim() ?? '';
      const keyId = process.env.OPEN_PAYMENTS_KEY_ID?.trim() ?? '';
      const privateKey = readPlatformPrivateKey();
      if (!walletAddressUrl || !keyId || !privateKey) {
        throw new DomainError(503, 'OPEN_PAYMENTS_CLIENT_NOT_CONFIGURED');
      }
      this.clientPromise = createAuthenticatedClient({
        walletAddressUrl,
        keyId,
        privateKey,
        validateResponses: true,
        logLevel: 'silent',
      }).catch((err: unknown) => {
        this.clientPromise = null;
        throw err;
      });
    }
    return this.clientPromise;
  }

  private async getWallet(url: string): Promise<WalletAddress> {
    const client = await this.client();
    try {
      return await client.walletAddress.get({ url });
    } catch (error) {
      throw mapOpError(error);
    }
  }

  /**
   * Fondeo: IncomingPayment en escrow + Quote + grant interactivo de OutgoingPayment del buyer.
   * El contratador debe autorizar en la Test Wallet (redirect).
   *
   * `amountMinorUnits` = centavos USD de la orden. En testnet se mapean 1:1 a unidades
   * mayores del asset de custodia (p. ej. $10.00 → 10.00 EGG si scale=2 → value "1000").
   */
  async beginBuyerFunding(input: {
    taskId: string;
    buyerWalletUrl: string;
    amountMinorUnits: number;
    finishRedirectUri: string;
  }): Promise<FundingPending> {
    if (!Number.isInteger(input.amountMinorUnits) || input.amountMinorUnits < 1) {
      throw new DomainError(400, 'VALIDATION_ERROR');
    }

    try {
    const client = await this.client();
    const escrow = await this.getWallet(this.escrowWalletUrl());
    const buyer = await this.getWallet(input.buyerWalletUrl);
    const amountValue = usdCentsToAssetMinorValue(input.amountMinorUnits, escrow.assetScale);
    const assetCode = escrow.assetCode;
    const assetScale = escrow.assetScale;

    const incomingGrant = await client.grant.request(
      { url: escrow.authServer },
      {
        access_token: {
          access: [{ type: 'incoming-payment', actions: ['create', 'read', 'complete'] }],
        },
      },
    );
    if (!isFinalizedGrantWithAccessToken(incomingGrant)) {
      throw new DomainError(502, 'OPEN_PAYMENTS_GRANT_NOT_FINALIZED');
    }

    const incomingPayment = await client.incomingPayment.create(
      {
        url: escrow.resourceServer,
        accessToken: incomingGrant.access_token.value,
      },
      {
        walletAddress: escrow.id,
        incomingAmount: {
          value: amountValue,
          assetCode,
          assetScale,
        },
        metadata: { taskId: input.taskId, purpose: 'ESCROW_LOCK' },
      },
    );

    const quoteGrant = await client.grant.request(
      { url: buyer.authServer },
      {
        access_token: {
          access: [{ type: 'quote', actions: ['create', 'read'] }],
        },
      },
    );
    if (!isFinalizedGrantWithAccessToken(quoteGrant)) {
      throw new DomainError(502, 'OPEN_PAYMENTS_GRANT_NOT_FINALIZED');
    }

    const quote = await client.quote.create(
      {
        url: buyer.resourceServer,
        accessToken: quoteGrant.access_token.value,
      },
      {
        method: 'ilp',
        walletAddress: buyer.id,
        receiver: incomingPayment.id,
        receiveAmount: {
          value: amountValue,
          assetCode,
          assetScale,
        },
      },
    );

    const clientNonce = randomBytes(32).toString('base64url');
    const pendingOutgoing = await client.grant.request(
      { url: buyer.authServer },
      {
        access_token: {
          access: [
            {
              type: 'outgoing-payment',
              actions: ['create', 'read'],
              identifier: buyer.id,
              limits: {
                debitAmount: {
                  value: quote.debitAmount.value,
                  assetCode: quote.debitAmount.assetCode,
                  assetScale: quote.debitAmount.assetScale,
                },
              },
            },
          ],
        },
        interact: {
          start: ['redirect'],
          finish: {
            method: 'redirect',
            uri: input.finishRedirectUri,
            nonce: clientNonce,
          },
        },
      },
    );

    if (!isPendingGrant(pendingOutgoing)) {
      throw new DomainError(502, 'OPEN_PAYMENTS_GRANT_NOT_PENDING');
    }

    const finishNonce = readFinishNonce(pendingOutgoing.interact.finish);
    if (!finishNonce) {
      throw new DomainError(502, 'OPEN_PAYMENTS_FINISH_NONCE_MISSING');
    }

    return {
      status: 'PENDING_INTERACTION',
      incomingPaymentUrl: incomingPayment.id,
      quoteId: quote.id,
      interactRedirectUri: pendingOutgoing.interact.redirect,
      continueUri: pendingOutgoing.continue.uri,
      continueAccessToken: pendingOutgoing.continue.access_token.value,
      clientNonce,
      finishNonce,
      buyerAuthServerUrl: buyer.authServer,
      assetCode,
      assetScale,
      amountValue,
    };
    } catch (error) {
      throw mapOpError(error);
    }
  }

  /** Tras el redirect GNAP del buyer: continue grant + OutgoingPayment. */
  async finalizeBuyerFunding(input: {
    buyerWalletUrl: string;
    quoteId: string;
    continueUri: string;
    continueAccessToken: string;
    interactRef: string;
  }): Promise<FundingCompleted> {
    try {
      const client = await this.client();
      const buyer = await this.getWallet(input.buyerWalletUrl);

      const continued = await client.grant.continue(
        { url: input.continueUri, accessToken: input.continueAccessToken },
        { interact_ref: input.interactRef },
      );
      if (!isFinalizedGrantWithAccessToken(continued)) {
        throw new DomainError(400, 'GNAP_SUBJECT_NOT_CONFIRMED');
      }

      const outgoing = await client.outgoingPayment.create(
        {
          url: buyer.resourceServer,
          accessToken: continued.access_token.value,
        },
        {
          walletAddress: buyer.id,
          quoteId: input.quoteId,
        },
      );

      return {
        status: 'COMPLETED',
        incomingPaymentUrl: outgoing.receiver,
        outgoingPaymentUrl: outgoing.id,
      };
    } catch (error) {
      throw mapOpError(error);
    }
  }

  /**
   * Liberación 96/4 desde la wallet de custodia con token de larga duración.
   * Requiere `OPEN_PAYMENTS_ESCROW_ACCESS_TOKEN` (grant outgoing sobre la misma wallet de custodia).
   */
  async disburse96And4(input: {
    taskId: string;
    sellerWalletUrl: string;
    freelancerMinorUnits: number;
    platformFeeMinorUnits: number;
  }): Promise<{ freelancerOutgoingUrl: string; platformOutgoingUrl: string }> {
    const token = this.escrowAccessToken();
    if (!token) {
      throw new DomainError(503, 'OPEN_PAYMENTS_ESCROW_TOKEN_MISSING');
    }

    const freelancerOutgoingUrl = await this.payFromEscrowWithToken({
      taskId: input.taskId,
      receiverWalletUrl: input.sellerWalletUrl,
      amountUsdCents: input.freelancerMinorUnits,
      accessToken: token,
      purpose: 'FREELANCER_PAYOUT_96',
    });

    const escrowUrl = normalizeWalletUrl(this.escrowWalletUrl());
    const platformUrl = normalizeWalletUrl(this.platformOwnerWalletUrl());
    // Si el 4 % queda en la misma custodia, no hay OutgoingPayment circular.
    if (platformUrl === escrowUrl) {
      return {
        freelancerOutgoingUrl,
        platformOutgoingUrl: `${escrowUrl}#fee-retained-in-escrow`,
      };
    }

    const platformOutgoingUrl = await this.payFromEscrowWithToken({
      taskId: input.taskId,
      receiverWalletUrl: this.platformOwnerWalletUrl(),
      amountUsdCents: input.platformFeeMinorUnits,
      accessToken: token,
      purpose: 'PLATFORM_FEE_PAYOUT_4',
    });

    return { freelancerOutgoingUrl, platformOutgoingUrl };
  }

  async refund100ToBuyer(input: {
    taskId: string;
    buyerWalletUrl: string;
    amountMinorUnits: number;
  }): Promise<{ outgoingPaymentUrl: string }> {
    const token = this.escrowAccessToken();
    if (!token) {
      throw new DomainError(503, 'OPEN_PAYMENTS_ESCROW_TOKEN_MISSING');
    }
    const outgoingPaymentUrl = await this.payFromEscrowWithToken({
      taskId: input.taskId,
      receiverWalletUrl: input.buyerWalletUrl,
      amountUsdCents: input.amountMinorUnits,
      accessToken: token,
      purpose: 'BUYER_REFUND_100',
    });
    return { outgoingPaymentUrl };
  }

  private async payFromEscrowWithToken(input: {
    taskId: string;
    receiverWalletUrl: string;
    amountUsdCents: number;
    accessToken: string;
    purpose: string;
  }): Promise<string> {
    try {
      const client = await this.client();
      const escrow = await this.getWallet(this.escrowWalletUrl());
      const receiver = await this.getWallet(input.receiverWalletUrl);
      // Incoming en el asset del receptor; el quote convierte desde la custodia.
      const amountValue = usdCentsToAssetMinorValue(input.amountUsdCents, receiver.assetScale);

      const incomingGrant = await client.grant.request(
        { url: receiver.authServer },
        {
          access_token: {
            access: [{ type: 'incoming-payment', actions: ['create', 'read', 'complete'] }],
          },
        },
      );
      if (!isFinalizedGrantWithAccessToken(incomingGrant)) {
        throw new DomainError(502, 'OPEN_PAYMENTS_GRANT_NOT_FINALIZED');
      }

      const incomingPayment = await client.incomingPayment.create(
        {
          url: receiver.resourceServer,
          accessToken: incomingGrant.access_token.value,
        },
        {
          walletAddress: receiver.id,
          incomingAmount: {
            value: amountValue,
            assetCode: receiver.assetCode,
            assetScale: receiver.assetScale,
          },
          metadata: { taskId: input.taskId, purpose: input.purpose },
        },
      );

      const quoteGrant = await client.grant.request(
        { url: escrow.authServer },
        {
          access_token: {
            access: [{ type: 'quote', actions: ['create', 'read'] }],
          },
        },
      );
      if (!isFinalizedGrantWithAccessToken(quoteGrant)) {
        throw new DomainError(502, 'OPEN_PAYMENTS_GRANT_NOT_FINALIZED');
      }

      const quote = await client.quote.create(
        {
          url: escrow.resourceServer,
          accessToken: quoteGrant.access_token.value,
        },
        {
          method: 'ilp',
          walletAddress: escrow.id,
          receiver: incomingPayment.id,
          receiveAmount: {
            value: amountValue,
            assetCode: receiver.assetCode,
            assetScale: receiver.assetScale,
          },
        },
      );

      const outgoing = await client.outgoingPayment.create(
        {
          url: escrow.resourceServer,
          accessToken: input.accessToken,
        },
        {
          walletAddress: escrow.id,
          quoteId: quote.id,
        },
      );

      return outgoing.id;
    } catch (error) {
      throw mapOpError(error);
    }
  }
}

function readFinishNonce(finish: unknown): string | null {
  if (typeof finish === 'string' && finish.length > 0) return finish;
  if (finish && typeof finish === 'object' && 'nonce' in finish) {
    const nonce = (finish as { nonce?: unknown }).nonce;
    if (typeof nonce === 'string' && nonce.length > 0) return nonce;
  }
  return null;
}

/** Centavos USD de la app → `value` Open Payments (1:1 en unidades mayores del asset). */
export function usdCentsToAssetMinorValue(usdCents: number, assetScale: number): string {
  if (!Number.isInteger(usdCents) || usdCents < 1) {
    throw new DomainError(400, 'VALIDATION_ERROR');
  }
  if (!Number.isInteger(assetScale) || assetScale < 0 || assetScale > 18) {
    throw new DomainError(502, 'OPEN_PAYMENTS_UPSTREAM');
  }
  const major = usdCents / 100;
  const minor = Math.round(major * 10 ** assetScale);
  if (minor < 1) throw new DomainError(400, 'VALIDATION_ERROR');
  return String(minor);
}

function normalizeWalletUrl(url: string): string {
  return url.trim().replace(/\/$/, '').toLowerCase();
}

function mapOpError(error: unknown): never {
  if (error instanceof DomainError) throw error;
  if (error instanceof OpenPaymentsClientError) {
    const status = error.status ?? 0;
    const detail = [
      status || undefined,
      'code' in error ? String((error as { code?: unknown }).code ?? '') : '',
      'description' in error ? String((error as { description?: unknown }).description ?? '') : '',
      error.message,
    ]
      .filter((part) => part !== undefined && part !== '')
      .join(' | ');
    // eslint-disable-next-line no-console -- diagnóstico testnet sin filtrar secretos
    console.error('[OpenPayments]', detail);
    if (status === 404) throw new DomainError(404, 'WALLET_ADDRESS_NOT_FOUND');
    if (status === 401 || status === 403) {
      throw new DomainError(503, 'OPEN_PAYMENTS_ESCROW_TOKEN_INVALID');
    }
    throw new DomainError(502, 'OPEN_PAYMENTS_UPSTREAM');
  }
  throw new DomainError(502, 'OPEN_PAYMENTS_UPSTREAM');
}
