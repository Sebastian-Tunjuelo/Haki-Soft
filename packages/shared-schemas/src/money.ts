/** Regla 8 de `planning/taskboard.md` §3. Centavos enteros, truncado hacia abajo. */
export function splitSingleBlockEscrow(totalAmountUSDInCents: number): {
  platformFeeUSDInCents: number;
  freelancerPayoutUSDInCents: number;
} {
  if (!Number.isInteger(totalAmountUSDInCents) || totalAmountUSDInCents <= 0) {
    throw new Error('INVALID_TOTAL_AMOUNT');
  }
  const platformFeeUSDInCents = Math.floor(totalAmountUSDInCents * 0.04);
  const freelancerPayoutUSDInCents = totalAmountUSDInCents - platformFeeUSDInCents;
  return { platformFeeUSDInCents, freelancerPayoutUSDInCents };
}

export const ESCROW_WALLET_ADDRESS = 'https://ilp.interledger-test.dev/taskstream-escrow';

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
