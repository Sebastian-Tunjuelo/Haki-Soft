import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import {
  escrowLockIdempotencyKey,
  EscrowFundingViewSchema,
  RafikiIncomingCompletedWebhookSchema,
  SellerActivityItemSchema,
  sellerConfirmationDeadlineIso,
  type EscrowFundingView,
  type SellerActivityItem,
} from '@taskstream/shared-schemas';
import { DomainError } from '../identity/domain-error';
import { IDENTITY_REPOSITORY } from '../identity/identity.tokens';
import type { IdentityRepository } from '../identity/identity.types';
import { ESCROW_PAYMENT_GATEWAY, ESCROW_REPOSITORY } from './escrow.tokens';
import { extractProjectBrief, type EscrowRepository, type StoredEscrowOrder } from './escrow.types';
import type { EscrowPaymentGateway } from './simulated-escrow-payment.gateway';
import { SellerNotificationHub } from './seller-notification.hub';

@Injectable()
export class EscrowService {
  constructor(
    @Inject(ESCROW_REPOSITORY) private readonly escrow: EscrowRepository,
    @Inject(ESCROW_PAYMENT_GATEWAY) private readonly payments: EscrowPaymentGateway,
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
    return items.map((item) => this.toActivityItem(item));
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

  buildActivityItemFromOrder(order: StoredEscrowOrder): SellerActivityItem {
    return this.toActivityItem({
      taskId: order.taskId,
      title: order.title,
      totalAmountUSDInCents: order.totalAmountUSDInCents,
      lifecycleStatus: order.lifecycleStatus,
      sellerConfirmed: Boolean(order.sellerConfirmedAt),
      createdAt: order.createdAt,
      buyerDisplayName: order.buyerDisplayName,
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
    buyerDisplayName?: string;
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
      buyerDisplayName: item.buyerDisplayName,
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
    const result = await this.escrow.settleRelease96_4(taskId);
    if (result === 'ORDER_NOT_FOUND') throw new DomainError(404, 'ORDER_NOT_FOUND');
    if (result === 'NOT_LOCKED') throw new DomainError(409, 'ESCROW_NOT_LOCKED');
    if (result === 'ALREADY_TERMINAL') throw new DomainError(409, 'ESCROW_ALREADY_TERMINAL');
    const order = await this.escrow.findOrder(taskId);
    if (!order) throw new DomainError(404, 'ORDER_NOT_FOUND');
    return this.toView(order, null, userId);
  }

  async simulateRefund(userId: string, taskId: string): Promise<EscrowFundingView> {
    await this.requireOrderAccess(userId, taskId);
    const result = await this.escrow.settleRefund100(taskId);
    if (result === 'ORDER_NOT_FOUND') throw new DomainError(404, 'ORDER_NOT_FOUND');
    if (result === 'NOT_LOCKED') throw new DomainError(409, 'ESCROW_NOT_LOCKED');
    if (result === 'ALREADY_TERMINAL') throw new DomainError(409, 'ESCROW_ALREADY_TERMINAL');
    const order = await this.escrow.findOrder(taskId);
    if (!order) throw new DomainError(404, 'ORDER_NOT_FOUND');
    return this.toView(order, null, userId);
  }

  private async lockFundsImmediately(
    order: StoredEscrowOrder,
    viewerUserId: string,
  ): Promise<EscrowFundingView> {
    const buyerWallet = await this.identity.findActiveWallet(order.buyerId);
    if (!buyerWallet?.isVerified || !buyerWallet.isActive) {
      throw new DomainError(422, 'BUYER_WALLET_UNAVAILABLE');
    }

    const attempt = ((await this.escrow.findLatestLockTx(order.taskId))?.attemptNumber ?? 0) + 1;
    const idempotencyKey = escrowLockIdempotencyKey(order.taskId, attempt);
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
