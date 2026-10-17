import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  extractProjectBrief,
  type EscrowLifecycle,
  type EscrowRepository,
  type LedgerStatus,
  type SellerActivityItemStored,
  type StoredEscrowOrder,
  type StoredOpTx,
} from './escrow.types';

@Injectable()
export class PrismaEscrowRepository implements EscrowRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  private db() {
    if (!this.prisma.client) throw new Error('PRISMA_UNAVAILABLE');
    return this.prisma.client;
  }

  async findOrder(taskId: string): Promise<StoredEscrowOrder | null> {
    const row = await this.db().taskOrder.findUnique({
      where: { id: taskId },
      include: {
        escrowLedger: true,
        buyer: { select: { displayName: true } },
        seller: { select: { displayName: true } },
      },
    });
    if (!row?.escrowLedger) return null;
    return this.toOrder(row, row.escrowLedger);
  }

  async findLatestLockTx(taskId: string): Promise<StoredOpTx | null> {
    const order = await this.db().taskOrder.findUnique({
      where: { id: taskId },
      include: { escrowLedger: true },
    });
    if (!order?.escrowLedger) return null;
    const tx = await this.db().openPaymentsTransaction.findFirst({
      where: { escrowLedgerId: order.escrowLedger.id, operationType: 'ESCROW_LOCK' },
      orderBy: { attemptNumber: 'desc' },
    });
    return tx ? this.toTx(tx, taskId) : null;
  }

  async listSellerActivity(userId: string): Promise<SellerActivityItemStored[]> {
    const rows = await this.db().taskOrder.findMany({
      where: { OR: [{ sellerId: userId }, { buyerId: userId }] },
      include: {
        escrowLedger: true,
        buyer: { select: { displayName: true } },
        seller: { select: { displayName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 80,
    });
    return rows
      .filter((row) => row.escrowLedger)
      .map((row) => ({
        taskId: row.id,
        title: row.title,
        totalAmountUSDInCents: row.escrowLedger!.totalAmountUSDInCents,
        lifecycleStatus: row.lifecycleStatus as EscrowLifecycle,
        sellerConfirmed: Boolean(row.sellerConfirmedAt),
        createdAt: row.createdAt,
        viewerRole: row.sellerId === userId ? ('seller' as const) : ('buyer' as const),
        buyerDisplayName: row.buyer.displayName,
        sellerDisplayName: row.seller.displayName,
        projectBrief: extractProjectBrief(row.scopeDescription),
      }));
  }

  async expireStaleSellerConfirmations(now = new Date()): Promise<string[]> {
    const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const stale = await this.db().taskOrder.findMany({
      where: {
        lifecycleStatus: 'PENDING_ESCROW_FUNDING',
        sellerConfirmedAt: null,
        createdAt: { lt: cutoff },
      },
      select: { id: true },
      take: 100,
    });
    if (stale.length === 0) return [];
    const ids = stale.map((row) => row.id);
    await this.db().taskOrder.updateMany({
      where: { id: { in: ids } },
      data: { lifecycleStatus: 'CANCELLED', closedAt: now },
    });
    return ids;
  }

  async confirmSeller(
    taskId: string,
    sellerId: string,
  ): Promise<'OK' | 'ORDER_NOT_FOUND' | 'FORBIDDEN' | 'ALREADY_CONFIRMED' | 'NOT_PENDING'> {
    const order = await this.db().taskOrder.findUnique({ where: { id: taskId } });
    if (!order) return 'ORDER_NOT_FOUND';
    if (order.sellerId !== sellerId) return 'FORBIDDEN';
    if (order.lifecycleStatus !== 'PENDING_ESCROW_FUNDING') return 'NOT_PENDING';
    if (order.sellerConfirmedAt) return 'ALREADY_CONFIRMED';
    await this.db().taskOrder.update({
      where: { id: taskId },
      data: { sellerConfirmedAt: new Date() },
    });
    return 'OK';
  }

  async cancelBeforeFunding(
    taskId: string,
    actorUserId: string,
    role: 'buyer' | 'seller',
  ): Promise<'OK' | 'ORDER_NOT_FOUND' | 'FORBIDDEN' | 'NOT_CANCELLABLE'> {
    const order = await this.db().taskOrder.findUnique({ where: { id: taskId } });
    if (!order) return 'ORDER_NOT_FOUND';
    if (role === 'buyer' && order.buyerId !== actorUserId) return 'FORBIDDEN';
    if (role === 'seller' && order.sellerId !== actorUserId) return 'FORBIDDEN';
    if (order.lifecycleStatus !== 'PENDING_ESCROW_FUNDING') return 'NOT_CANCELLABLE';
    await this.db().taskOrder.update({
      where: { id: taskId },
      data: { lifecycleStatus: 'CANCELLED', closedAt: new Date() },
    });
    return 'OK';
  }

  async beginLockAttempt(input: {
    taskId: string;
    idempotencyKey: string;
    interactRedirectUri: string;
    incomingPaymentUrl: string;
    quoteUrl?: string | null;
    grantContinueUri?: string | null;
    grantContinueToken?: string | null;
    clientNonce?: string | null;
    metadataJson?: Record<string, unknown> | null;
    receiveAssetCode?: string;
    receiveAssetScale?: number;
    receiveAmountValue?: string;
  }): Promise<
    StoredOpTx | 'ALREADY_LOCKED' | 'ORDER_NOT_FOUND' | 'DUPLICATE_KEY' | 'SELLER_NOT_CONFIRMED'
  > {
    const order = await this.db().taskOrder.findUnique({
      where: { id: input.taskId },
      include: { escrowLedger: true },
    });
    if (!order?.escrowLedger) return 'ORDER_NOT_FOUND';
    if (order.lifecycleStatus !== 'PENDING_ESCROW_FUNDING') return 'ALREADY_LOCKED';
    if (!order.sellerConfirmedAt) return 'SELLER_NOT_CONFIRMED';

    const byKey = await this.db().openPaymentsTransaction.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
    });
    if (byKey) return this.toTx(byKey, input.taskId);

    const attemptNumber =
      (await this.db().openPaymentsTransaction.count({
        where: { escrowLedgerId: order.escrowLedger.id, operationType: 'ESCROW_LOCK' },
      })) + 1;

    try {
      const created = await this.db().openPaymentsTransaction.create({
        data: {
          escrowLedgerId: order.escrowLedger.id,
          operationType: 'ESCROW_LOCK',
          attemptNumber,
          idempotencyKey: input.idempotencyKey,
          status: 'PENDING_INTERACTION',
          interactRedirectUri: input.interactRedirectUri,
          incomingPaymentUrl: input.incomingPaymentUrl,
          quoteUrl: input.quoteUrl ?? null,
          grantContinueUri: input.grantContinueUri ?? null,
          grantContinueToken: input.grantContinueToken ?? null,
          clientNonce: input.clientNonce ?? null,
          metadataJson: (input.metadataJson as Prisma.InputJsonValue) ?? undefined,
          receiveAmountValue:
            input.receiveAmountValue ?? String(order.escrowLedger.totalAmountUSDInCents),
          receiveAssetCode: input.receiveAssetCode ?? 'USD',
          receiveAssetScale: input.receiveAssetScale ?? 2,
        },
      });
      return this.toTx(created, input.taskId);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const again = await this.db().openPaymentsTransaction.findUnique({
          where: { idempotencyKey: input.idempotencyKey },
        });
        if (again) return this.toTx(again, input.taskId);
        return 'DUPLICATE_KEY';
      }
      throw error;
    }
  }

  async applyIncomingCompleted(input: {
    taskId: string;
    idempotencyKey: string;
    eventId: string;
    resourceUrl: string;
    payload: unknown;
  }): Promise<'LOCKED' | 'DUPLICATE_EVENT' | 'ORDER_NOT_FOUND' | 'KEY_MISMATCH' | 'ALREADY_LOCKED'> {
    try {
      return await this.db().$transaction(async (tx) => {
        const existingEvent = await tx.rafikiWebhookEvent.findUnique({ where: { eventId: input.eventId } });
        if (existingEvent) return 'DUPLICATE_EVENT' as const;

        const order = await tx.taskOrder.findUnique({
          where: { id: input.taskId },
          include: { escrowLedger: true },
        });
        if (!order?.escrowLedger) return 'ORDER_NOT_FOUND' as const;

        if (order.lifecycleStatus === 'ESCROW_LOCKED') {
          await tx.rafikiWebhookEvent.create({
            data: {
              eventId: input.eventId,
              eventType: 'incoming_payment.completed',
              resourceUrl: input.resourceUrl,
              payloadJson: input.payload as Prisma.InputJsonValue,
              processedAt: new Date(),
            },
          });
          return 'ALREADY_LOCKED' as const;
        }
        if (order.lifecycleStatus !== 'PENDING_ESCROW_FUNDING') return 'ALREADY_LOCKED' as const;

        const lockTx = await tx.openPaymentsTransaction.findUnique({
          where: { idempotencyKey: input.idempotencyKey },
        });
        if (!lockTx || lockTx.escrowLedgerId !== order.escrowLedger.id || lockTx.operationType !== 'ESCROW_LOCK') {
          return 'KEY_MISMATCH' as const;
        }

        await tx.openPaymentsTransaction.update({
          where: { id: lockTx.id },
          data: { status: 'COMPLETED', completedAt: new Date() },
        });
        await tx.escrowLedger.update({
          where: { id: order.escrowLedger.id },
          data: { status: 'FUNDS_LOCKED', fundsLockedAt: new Date() },
        });
        await tx.taskOrder.update({
          where: { id: order.id },
          data: { lifecycleStatus: 'ESCROW_LOCKED' },
        });
        await tx.rafikiWebhookEvent.create({
          data: {
            eventId: input.eventId,
            eventType: 'incoming_payment.completed',
            resourceUrl: input.resourceUrl,
            payloadJson: input.payload as Prisma.InputJsonValue,
            processedAt: new Date(),
          },
        });
        return 'LOCKED' as const;
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return 'DUPLICATE_EVENT';
      }
      throw error;
    }
  }

  async settleRelease96_4(
    taskId: string,
  ): Promise<'COMPLETED' | 'NOT_LOCKED' | 'ORDER_NOT_FOUND' | 'ALREADY_TERMINAL'> {
    return this.db().$transaction(async (tx) => {
      const order = await tx.taskOrder.findUnique({
        where: { id: taskId },
        include: { escrowLedger: true },
      });
      if (!order?.escrowLedger) return 'ORDER_NOT_FOUND' as const;
      if (order.lifecycleStatus === 'COMPLETED' || order.lifecycleStatus === 'REFUNDED') {
        return 'ALREADY_TERMINAL' as const;
      }
      if (order.escrowLedger.status !== 'FUNDS_LOCKED') return 'NOT_LOCKED' as const;
      if (!isSettlementEligibleLifecycle(order.lifecycleStatus)) return 'NOT_LOCKED' as const;

      await tx.openPaymentsTransaction.createMany({
        data: [
          {
            escrowLedgerId: order.escrowLedger.id,
            operationType: 'FREELANCER_PAYOUT_96',
            attemptNumber: 1,
            idempotencyKey: `sim-96-${taskId}`,
            status: 'COMPLETED',
            outgoingPaymentUrl: `https://ilp.interledger-test.dev/simulated/out/96/${taskId}`,
            debitAmountValue: String(order.escrowLedger.freelancerPayoutUSDInCents),
            debitAssetCode: 'USD',
            debitAssetScale: 2,
            completedAt: new Date(),
          },
          {
            escrowLedgerId: order.escrowLedger.id,
            operationType: 'PLATFORM_FEE_PAYOUT_4',
            attemptNumber: 1,
            idempotencyKey: `sim-4-${taskId}`,
            status: 'COMPLETED',
            outgoingPaymentUrl: `https://ilp.interledger-test.dev/simulated/out/4/${taskId}`,
            debitAmountValue: String(order.escrowLedger.platformFeeUSDInCents),
            debitAssetCode: 'USD',
            debitAssetScale: 2,
            completedAt: new Date(),
          },
        ],
      });
      await tx.escrowLedger.update({
        where: { id: order.escrowLedger.id },
        data: { status: 'RELEASED_96_4', settledAt: new Date() },
      });
      await tx.taskOrder.update({
        where: { id: taskId },
        data: { lifecycleStatus: 'COMPLETED', closedAt: new Date() },
      });
      return 'COMPLETED' as const;
    });
  }

  async settleRefund100(
    taskId: string,
  ): Promise<'REFUNDED' | 'NOT_LOCKED' | 'ORDER_NOT_FOUND' | 'ALREADY_TERMINAL'> {
    return this.db().$transaction(async (tx) => {
      const order = await tx.taskOrder.findUnique({
        where: { id: taskId },
        include: { escrowLedger: true },
      });
      if (!order?.escrowLedger) return 'ORDER_NOT_FOUND' as const;
      if (order.lifecycleStatus === 'COMPLETED' || order.lifecycleStatus === 'REFUNDED') {
        return 'ALREADY_TERMINAL' as const;
      }
      if (order.escrowLedger.status !== 'FUNDS_LOCKED') return 'NOT_LOCKED' as const;
      if (!isSettlementEligibleLifecycle(order.lifecycleStatus)) return 'NOT_LOCKED' as const;

      await tx.openPaymentsTransaction.create({
        data: {
          escrowLedgerId: order.escrowLedger.id,
          operationType: 'BUYER_REFUND_100',
          attemptNumber: 1,
          idempotencyKey: `sim-refund-${taskId}`,
          status: 'COMPLETED',
          outgoingPaymentUrl: `https://ilp.interledger-test.dev/simulated/out/refund/${taskId}`,
          debitAmountValue: String(order.escrowLedger.totalAmountUSDInCents),
          debitAssetCode: 'USD',
          debitAssetScale: 2,
          completedAt: new Date(),
        },
      });
      await tx.escrowLedger.update({
        where: { id: order.escrowLedger.id },
        data: { status: 'REFUNDED_100', settledAt: new Date() },
      });
      await tx.taskOrder.update({
        where: { id: taskId },
        data: { lifecycleStatus: 'REFUNDED', closedAt: new Date() },
      });
      return 'REFUNDED' as const;
    });
  }

  private toOrder(
    order: {
      id: string;
      buyerId: string;
      sellerId: string;
      title: string;
      scopeDescription: string;
      initialDeliveryDays: number;
      lifecycleStatus: string;
      sellerConfirmedAt: Date | null;
      createdAt: Date;
      buyer?: { displayName: string };
      seller?: { displayName: string };
    },
    ledger: {
      id: string;
      status: string;
      totalAmountUSDInCents: number;
      freelancerPayoutUSDInCents: number;
      platformFeeUSDInCents: number;
      fundsLockedAt: Date | null;
    },
  ): StoredEscrowOrder {
    return {
      taskId: order.id,
      buyerId: order.buyerId,
      sellerId: order.sellerId,
      title: order.title,
      scopeDescription: order.scopeDescription,
      lifecycleStatus: order.lifecycleStatus as EscrowLifecycle,
      totalAmountUSDInCents: ledger.totalAmountUSDInCents,
      freelancerPayoutUSDInCents: ledger.freelancerPayoutUSDInCents,
      platformFeeUSDInCents: ledger.platformFeeUSDInCents,
      ledgerId: ledger.id,
      ledgerStatus: ledger.status as LedgerStatus,
      sellerConfirmedAt: order.sellerConfirmedAt,
      createdAt: order.createdAt,
      initialDeliveryDays: order.initialDeliveryDays,
      fundsLockedAt: ledger.fundsLockedAt,
      buyerDisplayName: order.buyer?.displayName ?? 'Contratador',
      sellerDisplayName: order.seller?.displayName ?? 'Emprendedor',
    };
  }

  private toTx(
    row: {
      id: string;
      escrowLedgerId: string;
      operationType: string;
      attemptNumber: number;
      idempotencyKey: string;
      status: string;
      interactRedirectUri: string | null;
      incomingPaymentUrl: string | null;
      outgoingPaymentUrl: string | null;
      quoteUrl?: string | null;
      grantContinueUri?: string | null;
      grantContinueToken?: string | null;
      clientNonce?: string | null;
      metadataJson?: unknown;
      completedAt: Date | null;
    },
    taskId: string,
  ): StoredOpTx {
    return {
      id: row.id,
      escrowLedgerId: row.escrowLedgerId,
      taskId,
      operationType: row.operationType as StoredOpTx['operationType'],
      attemptNumber: row.attemptNumber,
      idempotencyKey: row.idempotencyKey,
      status: row.status as StoredOpTx['status'],
      interactRedirectUri: row.interactRedirectUri,
      incomingPaymentUrl: row.incomingPaymentUrl,
      outgoingPaymentUrl: row.outgoingPaymentUrl,
      quoteUrl: row.quoteUrl ?? null,
      grantContinueUri: row.grantContinueUri ?? null,
      grantContinueToken: row.grantContinueToken ?? null,
      clientNonce: row.clientNonce ?? null,
      metadataJson:
        row.metadataJson && typeof row.metadataJson === 'object' && !Array.isArray(row.metadataJson)
          ? (row.metadataJson as Record<string, unknown>)
          : null,
      completedAt: row.completedAt,
    };
  }
}

function isSettlementEligibleLifecycle(status: string): boolean {
  return (
    status === 'ESCROW_LOCKED' ||
    status === 'EXTENSION_REQUESTED' ||
    status === 'ESCROW_EXTENDED' ||
    status === 'IN_REVIEW' ||
    status === 'REVISION_REQUESTED' ||
    status === 'FINAL_CLAIM_WINDOW_30M' ||
    status === 'DISPUTED'
  );
}
