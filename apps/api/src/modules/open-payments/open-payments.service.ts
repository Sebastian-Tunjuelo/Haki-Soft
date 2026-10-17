import { randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { Inject, Injectable } from '@nestjs/common';
import {
  createAuthenticatedClient,
  createUnauthenticatedClient,
  isFinalizedGrantWithSubject,
  isPendingGrant,
  OpenPaymentsClientError,
  type AuthenticatedClient,
  type PendingGrant,
  type UnauthenticatedClient,
} from '@interledger/open-payments';
import { DomainError } from '../identity/domain-error';
import { CLOCK } from '../identity/identity.tokens';
import type { Clock, SubjectGrantSession, WalletDiscovery, WalletOwnershipGateway } from '../identity/identity.types';

/** El grant pendiente de OpenAPI 7.4.0 no trae caducidad. El reto local vive 10 minutos. */
export const SUBJECT_GRANT_TTL_MS = 10 * 60 * 1000;

export interface OpenPaymentsClientFactory {
  unauthenticated(): Promise<UnauthenticatedClient>;
  authenticated(): Promise<AuthenticatedClient>;
}

export const OPEN_PAYMENTS_CLIENT_FACTORY = Symbol('OPEN_PAYMENTS_CLIENT_FACTORY');

/**
 * `walletAddress.get` no firma. `grant.request` y `grant.continue` solo existen
 * en el cliente autenticado: el SDK inyecta `client` con la wallet de plataforma
 * y firma la petición HTTP. El cuerpo no pide `access_token` ni crea un pago.
 */
@Injectable()
export class SdkOpenPaymentsClientFactory implements OpenPaymentsClientFactory {
  private unauthenticatedClient: Promise<UnauthenticatedClient> | null = null;
  private authenticatedClient: Promise<AuthenticatedClient> | null = null;

  unauthenticated(): Promise<UnauthenticatedClient> {
    this.unauthenticatedClient ??= createUnauthenticatedClient({
      validateResponses: true,
      logLevel: 'silent',
    }).catch((error: unknown) => {
      this.unauthenticatedClient = null;
      throw error;
    });
    return this.unauthenticatedClient;
  }

  authenticated(): Promise<AuthenticatedClient> {
    const walletAddressUrl = process.env.OPEN_PAYMENTS_CLIENT_WALLET_ADDRESS?.trim() ?? '';
    const keyId = process.env.OPEN_PAYMENTS_KEY_ID?.trim() ?? '';
    const privateKey = readPlatformPrivateKey();
    if (!walletAddressUrl || !keyId || !privateKey) {
      return Promise.reject(new DomainError(503, 'OPEN_PAYMENTS_CLIENT_NOT_CONFIGURED'));
    }
    this.authenticatedClient ??= createAuthenticatedClient({
      walletAddressUrl,
      keyId,
      privateKey,
      validateResponses: true,
      logLevel: 'silent',
    }).catch((error: unknown) => {
      this.authenticatedClient = null;
      throw error;
    });
    return this.authenticatedClient;
  }
}

@Injectable()
export class OpenPaymentsService implements WalletOwnershipGateway {
  constructor(
    @Inject(OPEN_PAYMENTS_CLIENT_FACTORY) private readonly clients: OpenPaymentsClientFactory,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async discover(walletAddress: string): Promise<WalletDiscovery> {
    const client = await this.clients.unauthenticated();
    try {
      const found = await client.walletAddress.get({ url: walletAddress });
      return {
        walletAddress: found.id,
        authServer: found.authServer,
        resourceServer: found.resourceServer,
        assetCode: found.assetCode,
        assetScale: found.assetScale,
      };
    } catch (error) {
      throw mapOpenPaymentsError(error, 'discover');
    }
  }

  async beginSubjectGrant(input: {
    walletAddress: string;
    authServer: string;
    callbackUrl: string;
  }): Promise<SubjectGrantSession> {
    const client = await this.clients.authenticated();
    const clientNonce = randomBytes(32).toString('base64url');
    let grant: Awaited<ReturnType<AuthenticatedClient['grant']['request']>>;
    try {
      grant = await client.grant.request(
        { url: input.authServer },
        {
          subject: { sub_ids: [{ id: input.walletAddress, format: 'uri' }] },
          interact: {
            start: ['redirect'],
            finish: { method: 'redirect', uri: input.callbackUrl, nonce: clientNonce },
          },
        },
      );
    } catch (error) {
      throw mapOpenPaymentsError(error, 'grant');
    }
    if (!isPendingGrant(grant)) {
      throw new DomainError(502, 'OPEN_PAYMENTS_GRANT_NOT_PENDING');
    }
    const finishNonce = readFinishNonce(grant);
    if (!finishNonce) {
      throw new DomainError(502, 'OPEN_PAYMENTS_FINISH_NONCE_MISSING');
    }
    return {
      clientNonce,
      finishNonce,
      continueUri: grant.continue.uri,
      continueAccessToken: grant.continue.access_token.value,
      interactRedirectUri: grant.interact.redirect,
      expiresAt: new Date(this.clock.now().getTime() + SUBJECT_GRANT_TTL_MS),
    };
  }

  async continueSubjectGrant(input: {
    continueUri: string;
    continueAccessToken: string;
    interactRef: string;
    walletAddress: string;
  }): Promise<{ subjectWalletAddress: string }> {
    const client = await this.clients.authenticated();
    let continued: Awaited<ReturnType<AuthenticatedClient['grant']['continue']>>;
    try {
      continued = await client.grant.continue(
        { url: input.continueUri, accessToken: input.continueAccessToken },
        { interact_ref: input.interactRef },
      );
    } catch (error) {
      throw mapOpenPaymentsError(error, 'grant');
    }
    if (!isFinalizedGrantWithSubject(continued)) {
      throw new DomainError(400, 'GNAP_SUBJECT_NOT_CONFIRMED');
    }
    const subjectWalletAddress = continued.subject.sub_ids.find((item) => item.format === 'uri')?.id;
    if (!subjectWalletAddress) {
      throw new DomainError(400, 'GNAP_SUBJECT_NOT_CONFIRMED');
    }
    return { subjectWalletAddress };
  }
}

function readFinishNonce(grant: PendingGrant): string | null {
  const finish: unknown = grant.interact.finish;
  if (typeof finish === 'string' && finish.length > 0) return finish;
  if (finish && typeof finish === 'object' && 'nonce' in finish) {
    const nonce = (finish as { nonce?: unknown }).nonce;
    if (typeof nonce === 'string' && nonce.length > 0) return nonce;
  }
  return null;
}

/**
 * La clave solo firma la petición HTTP hacia la Test Wallet.
 * El grant y el pago los emite la API de Open Payments; no hay token ni PEM en el código.
 * Si existe `OPEN_PAYMENTS_PRIVATE_KEY_PATH`, ese archivo local gana sobre el valor en línea.
 */
export function readPlatformPrivateKey(env: NodeJS.ProcessEnv = process.env): string {
  const filePath = env.OPEN_PAYMENTS_PRIVATE_KEY_PATH?.trim() ?? '';
  if (filePath) {
    try {
      return normalizePrivateKey(readFileSync(filePath, 'utf8'));
    } catch {
      return '';
    }
  }
  return normalizePrivateKey(env.OPEN_PAYMENTS_PRIVATE_KEY ?? '');
}

function normalizePrivateKey(value: string): string {
  const trimmed = value.trim();
  if (trimmed.includes('\\n') && !trimmed.includes('\n')) {
    return trimmed.replace(/\\n/g, '\n');
  }
  return trimmed;
}

function mapOpenPaymentsError(error: unknown, stage: 'discover' | 'grant'): never {
  if (error instanceof DomainError) throw error;
  if (error instanceof OpenPaymentsClientError && stage === 'discover' && error.status === 404) {
    throw new DomainError(404, 'WALLET_ADDRESS_NOT_FOUND');
  }
  throw new DomainError(502, 'OPEN_PAYMENTS_UPSTREAM');
}
