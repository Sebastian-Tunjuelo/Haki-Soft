export const ESCROW_REPOSITORY = Symbol('ESCROW_REPOSITORY');
/** Gateway de pago: en local/tests = simulador; producción real = 🛡️ escrow-payment.service (manual). */
export const ESCROW_PAYMENT_GATEWAY = Symbol('ESCROW_PAYMENT_GATEWAY');
