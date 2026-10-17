import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import {
  escrowLockIdempotencyKey,
  EscrowFundingViewSchema,
  gnapInteractHash,
  RafikiIncomingCompletedWebhookSchema,
  SellerActivityItemSchema,
  sellerConfirmationDeadlineIso,
  type EscrowFundingView,
  type SellerActivityItem,
} from '@taskstream/shared-schemas';
import { DomainError } from '../identity/domain-error';
import { IDENTITY_REPOSITORY } from '../identity/identity.tokens';
import type { IdentityRepository } from '../identity/identity.types';
import { EscrowPaymentService } from '../open-payments/escrow-payment.service';
import { ESCROW_PAYMENT_GATEWAY, ESCROW_REPOSITORY } from './escrow.tokens';
import { extractProjectBrief, type EscrowRepository, type StoredEscrowOrder } from './escrow.types';
import type { EscrowPaymentGateway } from './simulated-escrow-payment.gateway';
import { SellerNotificationHub } from './seller-notification.hub';

@Injectable()
export class EscrowService {
  constructor(
    @Inject(ESCROW_REPOSITORY) private readonly escrow: EscrowRepository,
    @Inject(ESCROW_PAYMENT_GATEWAY) private readonly payments: EscrowPaymentGateway,
    @Inject(EscrowPaymentService) private readonly openPaymentsEscrow: EscrowPaymentService,
    @Inject(IDENTITY_REPOSITORY) private readonly identity: IdentityRepository,
    @Inject(SellerNotificationHub) private readonly sellerHub: SellerNotificationHub,
  ) {}

  async getFundingView(userId: string, taskId: string): Promise<EscrowFundingView> {
    const order = await this.requireOrderAccess(userId, taskId);
    const lock = await this.escrow.findLatestLockTx(taskId);
    return this.toView(order, lock?.interactRedirectUri ?? null, userId);
  }

  async listSellerActivity(userId: string): Promise<SellerActivityItem[]> {
    const items = await this.escrow.listSellerActivity(userId);
    return items.flatMap((item) => {
      try {
        return [
          this.toActivityItem({
            ...item,
            viewerRole: item.viewerRole,
            buyerDisplayName: item.buyerDisplayName,
            sellerDisplayName: item.sellerDisplayName,
            projectBrief: item.projectBrief,
          }),
        ];
      } catch {
        return [];
      }
    });
  }

  notifySellerWorkRequest(sellerUserId: string, item: SellerActivityItem): void {
    this.sellerHub.publish(sellerUserId, SellerActivityItemSchema.parse(item));
  }

  async notifySellerIfConfirmationPending(taskId: string): Promise<void> {
    const order = await this.escrow.findOrder(taskId);
    if (!order || order.sellerConfirmedAt) return;
    if (order.lifecycleStatus !== 'PENDING_ESCROW_FUNDING') return;
    this.notifySellerWorkRequest(order.sellerId, this.buildActivityItemFromOrder(order));
  }

  buildActivityItemFromOrder(order: StoredEscrowOrder, viewerRole: 'buyer' | 'seller' = 'seller'): SellerActivityItem {
    return this.toActivityItem({
      taskId: order.taskId,
      title: order.title,
      totalAmountUSDInCents: order.totalAmountUSDInCents,
      lifecycleStatus: order.lifecycleStatus,
      sellerConfirmed: Boolean(order.sellerConfirmedAt),
      createdAt: order.createdAt,
      viewerRole,
      buyerDisplayName: order.buyerDisplayName,
      sellerDisplayName: order.sellerDisplayName,
      projectBrief: extractProjectBrief(order.scopeDescription),
    });
  }

  /** Job 24h: cancela solicitudes sin respuesta del emprendedor (dinero nunca se manda). */
  async expireStaleSellerConfirmations(): Promise<number> {
    const ids = await this.escrow.expireStaleSellerConfirmations();
    return ids.length;
  }

  private toActivityItem(item: {
    taskId: string;
    title: string;
    totalAmountUSDInCents: number;
    lifecycleStatus: StoredEscrowOrder['lifecycleStatus'];
    sellerConfirmed: boolean;
    createdAt: Date;
    viewerRole?: 'buyer' | 'seller';
    buyerDisplayName?: string;
    sellerDisplayName?: string;
    projectBrief?: string;
  }): SellerActivityItem {
    return SellerActivityItemSchema.parse({
      taskId: item.taskId,
      title: item.title,
      totalAmountUSDInCents: item.totalAmountUSDInCents,
      lifecycleStatus: item.lifecycleStatus,
      sellerConfirmed: item.sellerConfirmed,
      createdAt: item.createdAt.toISOString(),
      sellerConfirmationDeadlineAt: sellerConfirmationDeadlineIso(item.createdAt),
      viewerRole: item.viewerRole,
      buyerDisplayName: item.buyerDisplayName,
      sellerDisplayName: item.sellerDisplayName,
      projectBrief: item.projectBrief,
    });
  }

  /**
   * Emprendedor acepta → el dinero del contratador entra a escrow al instante (simulado)
   * y quedan vinculadas las partes. Aquí arrancarían los timers (SPEC-09).
   */
  async confirmAsSeller(userId: string, taskId: string): Promise<EscrowFundingView> {
    const result = await this.escrow.confirmSeller(taskId, userId);
    if (result === 'ORDER_NOT_FOUND') throw new DomainError(404, 'ORDER_NOT_FOUND');
    if (result === 'FORBIDDEN') throw new DomainError(403, 'ESCROW_FORBIDDEN');
    if (result === 'NOT_PENDING') throw new DomainError(409, 'ESCROW_NOT_FUNDABLE');

    const order = await this.escrow.findOrder(taskId);
    if (!order) throw new DomainError(404, 'ORDER_NOT_FOUND');
    if (order.lifecycleStatus === 'ESCROW_LOCKED') {
      return this.toView(order, null, userId);
    }

    return this.lockFundsImmediately(order, userId);
  }

  /** Buyer se arrepiente: el dinero nunca se manda. */
  async cancelByBuyer(userId: string, taskId: string): Promise<EscrowFundingView> {
    const result = await this.escrow.cancelBeforeFunding(taskId, userId, 'buyer');
    if (result === 'ORDER_NOT_FOUND') throw new DomainError(404, 'ORDER_NOT_FOUND');
    if (result === 'FORBIDDEN') throw new DomainError(403, 'ESCROW_FORBIDDEN');
    if (result === 'NOT_CANCELLABLE') throw new DomainError(409, 'REQUEST_NOT_CANCELLABLE');
    const order = await this.escrow.findOrder(taskId);
    if (!order) throw new DomainError(404, 'ORDER_NOT_FOUND');
    return this.toView(order, null, userId);
  }

  /** Emprendedor rechaza: el dinero nunca se manda. */
  async rejectBySeller(userId: string, taskId: string): Promise<EscrowFundingView> {
    const result = await this.escrow.cancelBeforeFunding(taskId, userId, 'seller');
    if (result === 'ORDER_NOT_FOUND') throw new DomainError(404, 'ORDER_NOT_FOUND');
    if (result === 'FORBIDDEN') throw new DomainError(403, 'ESCROW_FORBIDDEN');
    if (result === 'NOT_CANCELLABLE') throw new DomainError(409, 'REQUEST_NOT_CANCELLABLE');
    const order = await this.escrow.findOrder(taskId);
    if (!order) throw new DomainError(404, 'ORDER_NOT_FOUND');
    return this.toView(order, null, userId);
  }

  /**
   * Acuerdo mutuo ya cerrado (p. ej. Camino 1): fondea escrow al instante.
   * Seller ya quedó confirmado al crear la orden.
   */
  async lockEscrowAfterMutualAgreement(taskId: string): Promise<void> {
    const order = await this.escrow.findOrder(taskId);
    if (!order || order.lifecycleStatus !== 'PENDING_ESCROW_FUNDING') return;
    if (!order.sellerConfirmedAt) return;
    await this.lockFundsImmediately(order, order.buyerId);
  }

  /** @deprecated El fondeo lo dispara la aceptación del Seller; se mantiene por compat tests. */
  async fundEscrow(userId: string, taskId: string): Promise<EscrowFundingView> {
    const order = await this.escrow.findOrder(taskId);
    if (!order) throw new DomainError(404, 'ORDER_NOT_FOUND');
    if (order.buyerId !== userId) throw new DomainError(403, 'ESCROW_FORBIDDEN');
    if (order.lifecycleStatus === 'ESCROW_LOCKED') {
      return this.toView(order, null, userId);
    }
    if (order.lifecycleStatus !== 'PENDING_ESCROW_FUNDING') {
      throw new DomainError(409, 'ESCROW_NOT_FUNDABLE');
    }
    if (!order.sellerConfirmedAt) {
      throw new DomainError(409, 'SELLER_CONFIRMATION_REQUIRED');
    }
    return this.lockFundsImmediately(order, userId);
  }

  async handleRafikiWebhook(body: unknown, authorizationHeader: string | undefined): Promise<void> {
    this.assertWebhookAuthorized(authorizationHeader);
    const parsed = RafikiIncomingCompletedWebhookSchema.safeParse(body);
    if (!parsed.success) throw new DomainError(400, 'VALIDATION_ERROR');

    const result = await this.escrow.applyIncomingCompleted({
      taskId: parsed.data.taskId,
      idempotencyKey: parsed.data.idempotencyKey,
      eventId: parsed.data.eventId,
      resourceUrl: parsed.data.resourceUrl ?? `https://ilp.interledger-test.dev/incoming/${parsed.data.taskId}`,
      payload: parsed.data,
    });

    if (result === 'ORDER_NOT_FOUND') throw new DomainError(404, 'ORDER_NOT_FOUND');
    if (result === 'KEY_MISMATCH') throw new DomainError(409, 'ESCROW_LOCK_KEY_MISMATCH');
  }

  async simulateRelease(userId: string, taskId: string): Promise<EscrowFundingView> {
    await this.requireOrderAccess(userId, taskId);
    const before = await this.escrow.findOrder(taskId);
    if (!before) throw new DomainError(404, 'ORDER_NOT_FOUND');

    if (this.openPaymentsEscrow.isRealEnabled()) {
      const sellerWallet = await this.identity.findActiveWallet(before.sellerId);
      if (!sellerWallet?.isVerified) throw new DomainError(422, 'SELLER_WALLET_UNAVAILABLE');
      await this.openPaymentsEscrow.disburse96And4({
        taskId,
        sellerWalletUrl: sellerWallet.walletAddressUrl,
        freelancerMinorUnits: before.freelancerPayoutUSDInCents,
        platformFeeMinorUnits: before.platformFeeUSDInCents,
      });
    }

    const result = await this.escrow.settleRelease96_4(taskId);
    if (result === 'ORDER_NOT_FOUND') throw new DomainError(404, 'ORDER_NOT_FOUND');
    if (result === 'NOT_LOCKED') throw new DomainError(409, 'ESCROW_NOT_LOCKED');
    if (result === 'ALREADY_TERMINAL') throw new DomainError(409, 'ESCROW_ALREADY_TERMINAL');

    await this.identity.adjustDemoBalance(before.sellerId, before.freelancerPayoutUSDInCents);

    const order = await this.escrow.findOrder(taskId);
    if (!order) throw new DomainError(404, 'ORDER_NOT_FOUND');
    return this.toView(order, null, userId);
  }

  async simulateRefund(userId: string, taskId: string): Promise<EscrowFundingView> {
    await this.requireOrderAccess(userId, taskId);
    const before = await this.escrow.findOrder(taskId);
    if (!before) throw new DomainError(404, 'ORDER_NOT_FOUND');

    if (this.openPaymentsEscrow.isRealEnabled()) {
      const buyerWallet = await this.identity.findActiveWallet(before.buyerId);
      if (!buyerWallet?.isVerified) throw new DomainError(422, 'BUYER_WALLET_UNAVAILABLE');
      await this.openPaymentsEscrow.refund100ToBuyer({
        taskId,
        buyerWalletUrl: buyerWallet.walletAddressUrl,
        amountMinorUnits: before.totalAmountUSDInCents,
      });
    }

    const result = await this.escrow.settleRefund100(taskId);
    if (result === 'ORDER_NOT_FOUND') throw new DomainError(404, 'ORDER_NOT_FOUND');
    if (result === 'NOT_LOCKED') throw new DomainError(409, 'ESCROW_NOT_LOCKED');
    if (result === 'ALREADY_TERMINAL') throw new DomainError(409, 'ESCROW_ALREADY_TERMINAL');

    await this.identity.adjustDemoBalance(before.buyerId, before.totalAmountUSDInCents);

    const order = await this.escrow.findOrder(taskId);
    if (!order) throw new DomainError(404, 'ORDER_NOT_FOUND');
    return this.toView(order, null, userId);
  }

  /**
   * Callback GNAP tras autorizar el fondeo en Test Wallet.
   * Completa OutgoingPayment del buyer y marca ESCROW_LOCKED.
   */
  async completeFundingCallback(
    taskId: string,
    query: Record<string, unknown>,
  ): Promise<{ redirectTo: string }> {
    const interactRef = typeof query.interact_ref === 'string' ? query.interact_ref : '';
    const receivedHash = typeof query.hash === 'string' ? query.hash : '';
    if (!interactRef || !receivedHash) {
      throw new DomainError(400, 'WALLET_CALLBACK_QUERY_INVALID');
    }

    const order = await this.escrow.findOrder(taskId);
    if (!order) throw new DomainError(404, 'ORDER_NOT_FOUND');
    if (order.lifecycleStatus === 'ESCROW_LOCKED') {
      return { redirectTo: this.webEscrowUrl(taskId, 'already-locked') };
    }

    const lockTx = await this.escrow.findLatestLockTx(taskId);
    if (!lockTx || lockTx.status !== 'PENDING_INTERACTION') {
      throw new DomainError(409, 'ESCROW_LOCK_IN_PROGRESS');
    }
    if (
      !lockTx.grantContinueUri ||
      !lockTx.grantContinueToken ||
      !lockTx.quoteUrl ||
      !lockTx.clientNonce
    ) {
      throw new DomainError(409, 'ESCROW_LOCK_IN_PROGRESS');
    }

    const meta = lockTx.metadataJson ?? {};
    const finishNonce = typeof meta.finishNonce === 'string' ? meta.finishNonce : '';
    const buyerAuthServerUrl =
      typeof meta.buyerAuthServerUrl === 'string' ? meta.buyerAuthServerUrl : '';
    if (!finishNonce || !buyerAuthServerUrl) {
      throw new DomainError(409, 'ESCROW_LOCK_IN_PROGRESS');
    }

    const expected = gnapInteractHash({
      clientNonce: lockTx.clientNonce,
      finishNonce,
      interactRef,
      authServerUrl: buyerAuthServerUrl,
    });
    if (expected !== receivedHash) {
      throw new DomainError(400, 'GNAP_HASH_MISMATCH');
    }

    const buyerWallet = await this.identity.findActiveWallet(order.buyerId);
    if (!buyerWallet?.isVerified) throw new DomainError(422, 'BUYER_WALLET_UNAVAILABLE');

    const finalized = await this.openPaymentsEscrow.finalizeBuyerFunding({
      buyerWalletUrl: buyerWallet.walletAddressUrl,
      quoteId: lockTx.quoteUrl,
      continueUri: lockTx.grantContinueUri,
      continueAccessToken: lockTx.grantContinueToken,
      interactRef,
    });

    await this.escrow.applyIncomingCompleted({
      taskId,
      idempotencyKey: lockTx.idempotencyKey,
      eventId: randomUUID(),
      resourceUrl: finalized.incomingPaymentUrl || lockTx.incomingPaymentUrl || finalized.outgoingPaymentUrl,
      payload: { openPaymentsOutgoing: finalized.outgoingPaymentUrl },
    });

    await this.identity.adjustDemoBalance(order.buyerId, -order.totalAmountUSDInCents);

    return { redirectTo: this.webEscrowUrl(taskId, 'funded') };
  }

  private webEscrowUrl(taskId: string, flag: string): string {
    const web = (process.env.PUBLIC_WEB_URL ?? 'http://localhost:3000').replace(/\/$/, '');
    return `${web}/orders/${taskId}/escrow?op=${flag}`;
  }

  private async lockFundsImmediately(
    order: StoredEscrowOrder,
    viewerUserId: string,
  ): Promise<EscrowFundingView> {
    const buyerWallet = await this.identity.findActiveWallet(order.buyerId);
    if (!buyerWallet?.isVerified || !buyerWallet.isActive) {
      throw new DomainError(422, 'BUYER_WALLET_UNAVAILABLE');
    }
    if (buyerWallet.demoBalanceUSDInCents < order.totalAmountUSDInCents) {
      throw new DomainError(422, 'INSUFFICIENT_DEMO_BALANCE');
    }

    const attempt = ((await this.escrow.findLatestLockTx(order.taskId))?.attemptNumber ?? 0) + 1;
    const idempotencyKey = escrowLockIdempotencyKey(order.taskId, attempt);

    if (this.openPaymentsEscrow.isRealEnabled()) {
      const apiBase = (process.env.PUBLIC_API_URL ?? 'http://localhost:3001').replace(/\/$/, '');
      const finishRedirectUri = `${apiBase}/api/v1/orders/${order.taskId}/escrow/funding/callback`;
      const funding = await this.openPaymentsEscrow.beginBuyerFunding({
        taskId: order.taskId,
        buyerWalletUrl: buyerWallet.walletAddressUrl,
        amountMinorUnits: order.totalAmountUSDInCents,
        finishRedirectUri,
      });

      const tx = await this.escrow.beginLockAttempt({
        taskId: order.taskId,
        idempotencyKey,
        interactRedirectUri: funding.interactRedirectUri,
        incomingPaymentUrl: funding.incomingPaymentUrl,
        quoteUrl: funding.quoteId,
        grantContinueUri: funding.continueUri,
        grantContinueToken: funding.continueAccessToken,
        clientNonce: funding.clientNonce,
        metadataJson: {
          finishNonce: funding.finishNonce,
          buyerAuthServerUrl: funding.buyerAuthServerUrl,
        },
        receiveAssetCode: funding.assetCode,
        receiveAssetScale: funding.assetScale,
        receiveAmountValue: funding.amountValue,
      });
      if (tx === 'ORDER_NOT_FOUND') throw new DomainError(404, 'ORDER_NOT_FOUND');
      if (tx === 'ALREADY_LOCKED') {
        const locked = await this.escrow.findOrder(order.taskId);
        if (!locked) throw new DomainError(404, 'ORDER_NOT_FOUND');
        return this.toView(locked, null, viewerUserId);
      }
      if (tx === 'DUPLICATE_KEY') throw new DomainError(409, 'ESCROW_LOCK_IN_PROGRESS');
      if (tx === 'SELLER_NOT_CONFIRMED') throw new DomainError(409, 'SELLER_CONFIRMATION_REQUIRED');

      // No se marca ESCROW_LOCKED hasta que el buyer autorice en Test Wallet.
      const pending = await this.escrow.findOrder(order.taskId);
      if (!pending) throw new DomainError(404, 'ORDER_NOT_FOUND');
      return this.toView(pending, funding.interactRedirectUri, viewerUserId);
    }

    const begun = await this.payments.beginEscrowLock({
      taskId: order.taskId,
      totalAmountUSDInCents: order.totalAmountUSDInCents,
      buyerWalletAddressUrl: buyerWallet.walletAddressUrl,
    });

    const tx = await this.escrow.beginLockAttempt({
      taskId: order.taskId,
      idempotencyKey,
      interactRedirectUri: begun.interactRedirectUri,
      incomingPaymentUrl: begun.incomingPaymentUrl,
    });
    if (tx === 'ORDER_NOT_FOUND') throw new DomainError(404, 'ORDER_NOT_FOUND');
    if (tx === 'ALREADY_LOCKED') {
      const locked = await this.escrow.findOrder(order.taskId);
      if (!locked) throw new DomainError(404, 'ORDER_NOT_FOUND');
      return this.toView(locked, null, viewerUserId);
    }
    if (tx === 'DUPLICATE_KEY') throw new DomainError(409, 'ESCROW_LOCK_IN_PROGRESS');
    if (tx === 'SELLER_NOT_CONFIRMED') throw new DomainError(409, 'SELLER_CONFIRMATION_REQUIRED');

    await this.escrow.applyIncomingCompleted({
      taskId: order.taskId,
      idempotencyKey: tx.idempotencyKey,
      eventId: randomUUID(),
      resourceUrl: begun.incomingPaymentUrl,
      payload: { autoLockedOnSellerAccept: true },
    });

    const debit = await this.identity.adjustDemoBalance(order.buyerId, -order.totalAmountUSDInCents);
    if (debit === 'INSUFFICIENT') throw new DomainError(422, 'INSUFFICIENT_DEMO_BALANCE');
    if (debit === 'NO_WALLET') throw new DomainError(422, 'BUYER_WALLET_UNAVAILABLE');

    const fresh = await this.escrow.findOrder(order.taskId);
    if (!fresh) throw new DomainError(404, 'ORDER_NOT_FOUND');
    return this.toView(fresh, null, viewerUserId);
  }

  private async requireOrderAccess(userId: string, taskId: string) {
    const order = await this.escrow.findOrder(taskId);
    if (!order) throw new DomainError(404, 'ORDER_NOT_FOUND');
    if (order.buyerId !== userId && order.sellerId !== userId) {
      throw new DomainError(403, 'ESCROW_FORBIDDEN');
    }
    return order;
  }

  private assertWebhookAuthorized(authorizationHeader: string | undefined): void {
    const expected = process.env.RAFIKI_WEBHOOK_SHARED_SECRET?.trim();
    if (!expected) {
      if (process.env.NODE_ENV === 'production') {
        throw new DomainError(401, 'RAFIKI_WEBHOOK_INVALID');
      }
      return;
    }
    const token = authorizationHeader?.startsWith('Bearer ')
      ? authorizationHeader.slice('Bearer '.length).trim()
      : (authorizationHeader?.trim() ?? '');
    if (token !== expected) throw new DomainError(401, 'RAFIKI_WEBHOOK_INVALID');
  }

  private toView(
    order: StoredEscrowOrder,
    interactRedirectUri: string | null,
    userId: string,
  ): EscrowFundingView {
    const viewerRole =
      order.buyerId === userId ? 'buyer' : order.sellerId === userId ? 'seller' : 'other';
    const sellerConfirmed = Boolean(order.sellerConfirmedAt);
    return EscrowFundingViewSchema.parse({
      taskId: order.taskId,
      title: order.title,
      lifecycleStatus: order.lifecycleStatus,
      totalAmountUSDInCents: order.totalAmountUSDInCents,
      freelancerPayoutUSDInCents: order.freelancerPayoutUSDInCents,
      platformFeeUSDInCents: order.platformFeeUSDInCents,
      interactRedirectUri,
      ledgerStatus: order.ledgerStatus,
      sellerConfirmed,
      viewerRole,
      createdAt: order.createdAt.toISOString(),
      sellerConfirmationDeadlineAt:
        sellerConfirmed || order.lifecycleStatus === 'CANCELLED'
          ? null
          : sellerConfirmationDeadlineIso(order.createdAt),
    });
  }
}
