/** Rango de montos que aceptan Gig, publicación, propuesta y escrow (CHECK SQL espejo). */
export const MIN_MARKETPLACE_AMOUNT_USD_IN_CENTS = 100;
export const MAX_MARKETPLACE_AMOUNT_USD_IN_CENTS = 50_000_000;

/**
 * Regla 8 de `planning/taskboard.md` §3: fee = floor(total * 4 / 100), payout = total - fee.
 * Aritmética entera para coincidir bit a bit con chk_escrow_exact_96_4_split.
 */
export function splitSingleBlockEscrow(totalAmountUSDInCents: number): {
  platformFeeUSDInCents: number;
  freelancerPayoutUSDInCents: number;
} {
  if (
    !Number.isInteger(totalAmountUSDInCents) ||
    totalAmountUSDInCents < MIN_MARKETPLACE_AMOUNT_USD_IN_CENTS ||
    totalAmountUSDInCents > MAX_MARKETPLACE_AMOUNT_USD_IN_CENTS
  ) {
    throw new Error('INVALID_TOTAL_AMOUNT');
  }
  const platformFeeUSDInCents = Math.floor((totalAmountUSDInCents * 4) / 100);
  const freelancerPayoutUSDInCents = totalAmountUSDInCents - platformFeeUSDInCents;
  return { platformFeeUSDInCents, freelancerPayoutUSDInCents };
}

export const ESCROW_WALLET_ADDRESS = 'https://ilp.interledger-test.dev/taskstream-escrow';

/** Wallet del dueño/plataforma que recibe el 4 % (distinta del escrow). */
export const PLATFORM_OWNER_WALLET_ADDRESS = 'https://ilp.interledger-test.dev/taskstream-owner';

export const MANDATORY_AI_DISCLAIMER =
  'Este informe es estrictamente consultivo para tareas de imagen y texto. El Consejero de IA nunca aprueba ni ejecuta pagos.';

const HOUR_MS = 60 * 60 * 1000;

/** Ventana fija de 24 horas para que el Buyer responda a la extensión única. */
export function buyerExtensionDecisionDeadline(requestedAtIso: string): string {
  const requestedAt = new Date(requestedAtIso);
  if (Number.isNaN(requestedAt.getTime())) {
    throw new Error('INVALID_REQUESTED_AT');
  }
  return new Date(requestedAt.getTime() + 24 * HOUR_MS).toISOString();
}
