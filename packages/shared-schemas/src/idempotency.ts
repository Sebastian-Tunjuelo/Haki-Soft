import { createHash } from 'crypto';

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

/**
 * Base64 estándar (con `+`/`/` y padding `=`).
 * Rafiki (Test Wallet) usa exactamente `createHash('sha-256').update(data).digest('base64')`
 * al redirigir al finish URI — no Base64URL.
 * @see https://github.com/interledger/rafiki/blob/main/packages/auth/src/interaction/routes.ts
 */
function sha256Base64(value: string): string {
  return createHash('sha256').update(value, 'ascii').digest('base64');
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
 * Hash de callback GNAP (alineado con Rafiki Test Wallet).
 * Material: `clientNonce + "\n" + asNonce + "\n" + interact_ref + "\n" + grantRequestUrl`
 * Digest: **Base64 estándar con padding** (como Rafiki; no hex ni Base64URL).
 * `authServerUrl` debe ser la URI exacta del grant request (p. ej. discovery `authServer`,
 * que ya incluye tenantId: `https://auth.interledger-test.dev/{tenantId}`).
 */
export function gnapInteractHash(input: {
  clientNonce: string;
  finishNonce: string;
  interactRef: string;
  authServerUrl: string;
}): string {
  const material = `${input.clientNonce}\n${input.finishNonce}\n${input.interactRef}\n${input.authServerUrl}`;
  return sha256Base64(material);
}
