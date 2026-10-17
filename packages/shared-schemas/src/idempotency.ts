import { createHash } from 'crypto';

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

/** `SHA256(taskId + ":" + attemptNumber + ":ESCROW_LOCK")` — CONTEXT.md §5.4. */
export function escrowLockIdempotencyKey(taskId: string, attemptNumber: number): string {
  return sha256(`${taskId}:${attemptNumber}:ESCROW_LOCK`);
}

/** `SHA256(taskId + ":FREELANCER_PAYOUT_96")` — CONTEXT.md §5.4. */
export function freelancerPayoutIdempotencyKey(taskId: string): string {
  return sha256(`${taskId}:FREELANCER_PAYOUT_96`);
}

/** `SHA256(taskId + ":PLATFORM_FEE_PAYOUT_4")` — CONTEXT.md §5.4. */
export function platformFeePayoutIdempotencyKey(taskId: string): string {
  return sha256(`${taskId}:PLATFORM_FEE_PAYOUT_4`);
}

/** `SHA256(taskId + ":" + attemptNumber + ":BUYER_REFUND_100")` — CONTEXT.md §5.4. */
export function buyerRefundIdempotencyKey(taskId: string, attemptNumber: number): string {
  return sha256(`${taskId}:${attemptNumber}:BUYER_REFUND_100`);
}

/**
 * Hash de callback GNAP — CONTEXT.md §4.
 * `SHA-256(clientNonce + "\n" + finishNonce + "\n" + interact_ref + "\n" + authServerUrl)`.
 * La comparación criptográfica vive en `open-payments.service.ts` (autoría manual de BE-1).
 */
export function gnapInteractHash(input: {
  clientNonce: string;
  finishNonce: string;
  interactRef: string;
  authServerUrl: string;
}): string {
  const material = `${input.clientNonce}\n${input.finishNonce}\n${input.interactRef}\n${input.authServerUrl}`;
  return sha256(material);
}
