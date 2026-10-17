export type EscrowLifecycle =
  | 'PENDING_ESCROW_FUNDING'
  | 'ESCROW_LOCKED'
  | 'COMPLETED'
  | 'REFUNDED'
  | 'CANCELLED';

export type LedgerStatus = 'AWAITING_FUNDS' | 'FUNDS_LOCKED' | 'RELEASED_96_4' | 'REFUNDED_100';

export type OpType =
  | 'ESCROW_LOCK'
  | 'FREELANCER_PAYOUT_96'
  | 'PLATFORM_FEE_PAYOUT_4'
  | 'BUYER_REFUND_100';

export type OpStatus = 'PENDING_INTERACTION' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface StoredEscrowOrder {
  taskId: string;
  buyerId: string;
  sellerId: string;
  title: string;
  scopeDescription: string;
  lifecycleStatus: EscrowLifecycle;
  totalAmountUSDInCents: number;
  freelancerPayoutUSDInCents: number;
  platformFeeUSDInCents: number;
  ledgerId: string;
  ledgerStatus: LedgerStatus;
  sellerConfirmedAt: Date | null;
  createdAt: Date;
  initialDeliveryDays: number;
  fundsLockedAt: Date | null;
  buyerDisplayName: string;
  sellerDisplayName: string;
}

export interface SellerActivityItemStored {
  taskId: string;
  title: string;
  totalAmountUSDInCents: number;
  lifecycleStatus: EscrowLifecycle;
  sellerConfirmed: boolean;
  createdAt: Date;
  viewerRole: 'buyer' | 'seller';
  buyerDisplayName: string;
  sellerDisplayName: string;
  projectBrief: string;
}

export interface StoredOpTx {
  id: string;
  escrowLedgerId: string;
  taskId: string;
  operationType: OpType;
  attemptNumber: number;
  idempotencyKey: string;
  status: OpStatus;
  interactRedirectUri: string | null;
  incomingPaymentUrl: string | null;
  outgoingPaymentUrl: string | null;
  quoteUrl: string | null;
  grantContinueUri: string | null;
  grantContinueToken: string | null;
  clientNonce: string | null;
  /** finish nonce GNAP + authServer del buyer (JSON en metadata si hace falta). */
  metadataJson: Record<string, unknown> | null;
  completedAt: Date | null;
}

export interface EscrowRepository {
  findOrder(taskId: string): Promise<StoredEscrowOrder | null>;
  findLatestLockTx(taskId: string): Promise<StoredOpTx | null>;
  /** Órdenes donde el usuario es buyer o seller (incluye cerradas para Historia). */
  listSellerActivity(userId: string): Promise<SellerActivityItemStored[]>;
  confirmSeller(taskId: string, sellerId: string): Promise<'OK' | 'ORDER_NOT_FOUND' | 'FORBIDDEN' | 'ALREADY_CONFIRMED' | 'NOT_PENDING'>;
  /** Cancela sin fondeo: Buyer se arrepiente o Seller rechaza. */
  cancelBeforeFunding(
    taskId: string,
    actorUserId: string,
    role: 'buyer' | 'seller',
  ): Promise<'OK' | 'ORDER_NOT_FOUND' | 'FORBIDDEN' | 'NOT_CANCELLABLE'>;
  beginLockAttempt(input: {
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
  }): Promise<StoredOpTx | 'ALREADY_LOCKED' | 'ORDER_NOT_FOUND' | 'DUPLICATE_KEY' | 'SELLER_NOT_CONFIRMED'>;
  applyIncomingCompleted(input: {
    taskId: string;
    idempotencyKey: string;
    eventId: string;
    resourceUrl: string;
    payload: unknown;
  }): Promise<'LOCKED' | 'DUPLICATE_EVENT' | 'ORDER_NOT_FOUND' | 'KEY_MISMATCH' | 'ALREADY_LOCKED'>;
  settleRelease96_4(taskId: string): Promise<'COMPLETED' | 'NOT_LOCKED' | 'ORDER_NOT_FOUND' | 'ALREADY_TERMINAL'>;
  settleRefund100(taskId: string): Promise<'REFUNDED' | 'NOT_LOCKED' | 'ORDER_NOT_FOUND' | 'ALREADY_TERMINAL'>;
  /** Cancela solicitudes PENDING sin respuesta del seller tras 24h. */
  expireStaleSellerConfirmations(now?: Date): Promise<string[]>;
  seedPendingOrderForTest?(order: StoredEscrowOrder): Promise<void>;
}

export function extractProjectBrief(scopeDescription: string): string {
  const marker = 'Brief del Buyer:\n';
  const idx = scopeDescription.indexOf(marker);
  if (idx >= 0) return scopeDescription.slice(idx + marker.length).trim() || scopeDescription.trim();
  return scopeDescription.trim();
}
