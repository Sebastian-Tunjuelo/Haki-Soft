import { randomUUID } from 'node:crypto';
import {
  extractProjectBrief,
  type EscrowRepository,
  type SellerActivityItemStored,
  type StoredEscrowOrder,
  type StoredOpTx,
} from './escrow.types';

export class MemoryEscrowRepository implements EscrowRepository {
  private orders = new Map<string, StoredEscrowOrder>();
  private txs: StoredOpTx[] = [];
  private webhookIds = new Set<string>();

  reset(): void {
    this.orders.clear();
    this.txs = [];
    this.webhookIds.clear();
  }

  async seedPendingOrderForTest(order: StoredEscrowOrder): Promise<void> {
    this.orders.set(order.taskId, {
      ...order,
      title: order.title ?? 'Orden de prueba',
      scopeDescription: order.scopeDescription ?? 'Scope de prueba',
      sellerConfirmedAt: order.sellerConfirmedAt ?? new Date(),
      createdAt: order.createdAt ?? new Date(),
      initialDeliveryDays: order.initialDeliveryDays ?? 7,
      fundsLockedAt: order.fundsLockedAt ?? null,
      buyerDisplayName: order.buyerDisplayName ?? 'Buyer',
      sellerDisplayName: order.sellerDisplayName ?? 'Seller',
    });
  }

  async findOrder(taskId: string): Promise<StoredEscrowOrder | null> {
    const row = this.orders.get(taskId);
    return row ? { ...row } : null;
  }

  async findLatestLockTx(taskId: string): Promise<StoredOpTx | null> {
    const matches = this.txs
      .filter((tx) => tx.taskId === taskId && tx.operationType === 'ESCROW_LOCK')
      .sort((a, b) => b.attemptNumber - a.attemptNumber);
    return matches[0] ? { ...matches[0] } : null;
  }

  async listSellerActivity(sellerId: string): Promise<SellerActivityItemStored[]> {
    return [...this.orders.values()]
      .filter((order) => order.sellerId === sellerId && order.lifecycleStatus !== 'CANCELLED')
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map((order) => ({
        taskId: order.taskId,
        title: order.title,
        totalAmountUSDInCents: order.totalAmountUSDInCents,
        lifecycleStatus: order.lifecycleStatus,
        sellerConfirmed: Boolean(order.sellerConfirmedAt),
        createdAt: order.createdAt,
        buyerDisplayName: order.buyerDisplayName,
        projectBrief: extractProjectBrief(order.scopeDescription),
      }));
  }

  async expireStaleSellerConfirmations(now = new Date()): Promise<string[]> {
    const cutoff = now.getTime() - 24 * 60 * 60 * 1000;
    const expired: string[] = [];
    for (const order of this.orders.values()) {
      if (
        order.lifecycleStatus === 'PENDING_ESCROW_FUNDING' &&
        !order.sellerConfirmedAt &&
        order.createdAt.getTime() < cutoff
      ) {
        order.lifecycleStatus = 'CANCELLED';
        expired.push(order.taskId);
      }
    }
    return expired;
  }

  async confirmSeller(
    taskId: string,
    sellerId: string,
  ): Promise<'OK' | 'ORDER_NOT_FOUND' | 'FORBIDDEN' | 'ALREADY_CONFIRMED' | 'NOT_PENDING'> {
    const order = this.orders.get(taskId);
    if (!order) return 'ORDER_NOT_FOUND';
    if (order.sellerId !== sellerId) return 'FORBIDDEN';
    if (order.lifecycleStatus !== 'PENDING_ESCROW_FUNDING') return 'NOT_PENDING';
    if (order.sellerConfirmedAt) return 'ALREADY_CONFIRMED';
    order.sellerConfirmedAt = new Date();
    return 'OK';
  }

  async cancelBeforeFunding(
    taskId: string,
    actorUserId: string,
    role: 'buyer' | 'seller',
  ): Promise<'OK' | 'ORDER_NOT_FOUND' | 'FORBIDDEN' | 'NOT_CANCELLABLE'> {
    const order = this.orders.get(taskId);
    if (!order) return 'ORDER_NOT_FOUND';
    if (role === 'buyer' && order.buyerId !== actorUserId) return 'FORBIDDEN';
    if (role === 'seller' && order.sellerId !== actorUserId) return 'FORBIDDEN';
    if (order.lifecycleStatus !== 'PENDING_ESCROW_FUNDING') return 'NOT_CANCELLABLE';
    order.lifecycleStatus = 'CANCELLED';
    return 'OK';
  }

  async beginLockAttempt(input: {
    taskId: string;
    idempotencyKey: string;
    interactRedirectUri: string;
    incomingPaymentUrl: string;
  }): Promise<
    StoredOpTx | 'ALREADY_LOCKED' | 'ORDER_NOT_FOUND' | 'DUPLICATE_KEY' | 'SELLER_NOT_CONFIRMED'
  > {
    const order = this.orders.get(input.taskId);
    if (!order) return 'ORDER_NOT_FOUND';
    if (order.lifecycleStatus !== 'PENDING_ESCROW_FUNDING') return 'ALREADY_LOCKED';
    if (!order.sellerConfirmedAt) return 'SELLER_NOT_CONFIRMED';

    const existingKey = this.txs.find((tx) => tx.idempotencyKey === input.idempotencyKey);
    if (existingKey) return { ...existingKey };

    const attemptNumber =
      this.txs.filter((tx) => tx.taskId === input.taskId && tx.operationType === 'ESCROW_LOCK').length + 1;

    const tx: StoredOpTx = {
      id: randomUUID(),
      escrowLedgerId: order.ledgerId,
      taskId: input.taskId,
      operationType: 'ESCROW_LOCK',
      attemptNumber,
      idempotencyKey: input.idempotencyKey,
      status: 'PENDING_INTERACTION',
      interactRedirectUri: input.interactRedirectUri,
      incomingPaymentUrl: input.incomingPaymentUrl,
      outgoingPaymentUrl: null,
      completedAt: null,
    };
    this.txs.push(tx);
    return { ...tx };
  }

  async applyIncomingCompleted(input: {
    taskId: string;
    idempotencyKey: string;
    eventId: string;
    resourceUrl: string;
    payload: unknown;
  }): Promise<'LOCKED' | 'DUPLICATE_EVENT' | 'ORDER_NOT_FOUND' | 'KEY_MISMATCH' | 'ALREADY_LOCKED'> {
    void input.payload;
    void input.resourceUrl;
    if (this.webhookIds.has(input.eventId)) return 'DUPLICATE_EVENT';
    const order = this.orders.get(input.taskId);
    if (!order) return 'ORDER_NOT_FOUND';
    if (order.lifecycleStatus === 'ESCROW_LOCKED') {
      this.webhookIds.add(input.eventId);
      return 'ALREADY_LOCKED';
    }
    if (order.lifecycleStatus !== 'PENDING_ESCROW_FUNDING') return 'ALREADY_LOCKED';

    const tx = this.txs.find(
      (row) =>
        row.taskId === input.taskId &&
        row.operationType === 'ESCROW_LOCK' &&
        row.idempotencyKey === input.idempotencyKey,
    );
    if (!tx) return 'KEY_MISMATCH';

    tx.status = 'COMPLETED';
    tx.completedAt = new Date();
    order.lifecycleStatus = 'ESCROW_LOCKED';
    order.ledgerStatus = 'FUNDS_LOCKED';
    order.fundsLockedAt = new Date();
    this.webhookIds.add(input.eventId);
    return 'LOCKED';
  }

  async settleRelease96_4(
    taskId: string,
  ): Promise<'COMPLETED' | 'NOT_LOCKED' | 'ORDER_NOT_FOUND' | 'ALREADY_TERMINAL'> {
    const order = this.orders.get(taskId);
    if (!order) return 'ORDER_NOT_FOUND';
    if (order.lifecycleStatus === 'COMPLETED' || order.lifecycleStatus === 'REFUNDED') {
      return 'ALREADY_TERMINAL';
    }
    if (order.lifecycleStatus !== 'ESCROW_LOCKED') return 'NOT_LOCKED';

    this.txs.push(
      {
        id: randomUUID(),
        escrowLedgerId: order.ledgerId,
        taskId,
        operationType: 'FREELANCER_PAYOUT_96',
        attemptNumber: 1,
        idempotencyKey: `sim-96-${taskId}`,
        status: 'COMPLETED',
        interactRedirectUri: null,
        incomingPaymentUrl: null,
        outgoingPaymentUrl: `https://ilp.interledger-test.dev/simulated/out/96/${taskId}`,
        completedAt: new Date(),
      },
      {
        id: randomUUID(),
        escrowLedgerId: order.ledgerId,
        taskId,
        operationType: 'PLATFORM_FEE_PAYOUT_4',
        attemptNumber: 1,
        idempotencyKey: `sim-4-${taskId}`,
        status: 'COMPLETED',
        interactRedirectUri: null,
        incomingPaymentUrl: null,
        outgoingPaymentUrl: `https://ilp.interledger-test.dev/simulated/out/4/${taskId}`,
        completedAt: new Date(),
      },
    );
    order.lifecycleStatus = 'COMPLETED';
    order.ledgerStatus = 'RELEASED_96_4';
    return 'COMPLETED';
  }

  async settleRefund100(
    taskId: string,
  ): Promise<'REFUNDED' | 'NOT_LOCKED' | 'ORDER_NOT_FOUND' | 'ALREADY_TERMINAL'> {
    const order = this.orders.get(taskId);
    if (!order) return 'ORDER_NOT_FOUND';
    if (order.lifecycleStatus === 'COMPLETED' || order.lifecycleStatus === 'REFUNDED') {
      return 'ALREADY_TERMINAL';
    }
    if (order.lifecycleStatus !== 'ESCROW_LOCKED') return 'NOT_LOCKED';

    this.txs.push({
      id: randomUUID(),
      escrowLedgerId: order.ledgerId,
      taskId,
      operationType: 'BUYER_REFUND_100',
      attemptNumber: 1,
      idempotencyKey: `sim-refund-${taskId}`,
      status: 'COMPLETED',
      interactRedirectUri: null,
      incomingPaymentUrl: null,
      outgoingPaymentUrl: `https://ilp.interledger-test.dev/simulated/out/refund/${taskId}`,
      completedAt: new Date(),
    });
    order.lifecycleStatus = 'REFUNDED';
    order.ledgerStatus = 'REFUNDED_100';
    return 'REFUNDED';
  }
}
