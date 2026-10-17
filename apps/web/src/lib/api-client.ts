/** Fetch JSON hacia el BFF Next; nunca se muestra el cuerpo crudo en UI. */

export type ApiResult = { status: number; body: unknown };

export async function api(path: string, init?: RequestInit): Promise<ApiResult> {
  const res = await fetch(path, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  });
  if (res.status === 204) return { status: 204, body: { ok: true } };
  const text = await res.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { status: res.status, body };
}

export function errorCode(body: unknown): string | null {
  if (body && typeof body === 'object' && 'code' in body && typeof (body as { code: unknown }).code === 'string') {
    return (body as { code: string }).code;
  }
  return null;
}

const HUMAN_ERRORS: Record<string, string> = {
  UNAUTHENTICATED: 'Inicia sesión para continuar.',
  WALLET_NOT_VERIFIED: 'Necesitas una billetera Interledger verificada.',
  ESCROW_FORBIDDEN: 'No tienes permiso para esta orden.',
  ORDER_NOT_FOUND: 'No encontramos esa orden.',
  ESCROW_ALREADY_LOCKED: 'Los fondos ya están en custodia.',
  ESCROW_NOT_FUNDABLE: 'Esta orden ya no admite depósito.',
  ESCROW_NOT_LOCKED: 'Primero debes completar el depósito en custodia.',
  ESCROW_ALREADY_TERMINAL: 'Esta orden ya está cerrada.',
  ESCROW_LOCK_IN_PROGRESS: 'Hay un depósito en curso. Espera un momento.',
  ESCROW_LOCK_KEY_MISMATCH: 'No se pudo confirmar el depósito. Reintenta el fondeo.',
  VALIDATION_ERROR: 'Revisa los datos e inténtalo de nuevo.',
  RAFIKI_WEBHOOK_INVALID: 'No se pudo confirmar el pago.',
  API_UNREACHABLE: 'No pudimos contactar al servidor. ¿Está la API en marcha?',
  SELF_DEALING_FORBIDDEN: 'No puedes contratar tu propio servicio.',
  GIG_NOT_FOUND: 'Ese Gig no existe o ya no está activo.',
  PUBLICATION_NOT_FOUND: 'Esa publicación no está disponible.',
  PROPOSAL_NOT_FOUND: 'No encontramos esa oferta.',
  BUDGET_EXCEEDED: 'La oferta supera el presupuesto tope.',
  IDEMPOTENCY_CONFLICT: 'Esa acción ya se procesó. Actualiza la vista.',
  FORBIDDEN_PUBLICATION_INBOX: 'Solo el comprador de la publicación puede ver esta bandeja.',
  PROPOSAL_ACCESS_FORBIDDEN: 'No tienes acceso a esta oferta.',
  SELF_HIRE_FORBIDDEN: 'No puedes contratar tu propio Gig.',
  SELLER_CONFIRMATION_REQUIRED:
    'El emprendedor aún no ha aceptado. Hasta entonces el dinero no se envía al escrow.',
  REQUEST_NOT_CANCELLABLE: 'Esta solicitud ya no se puede cancelar o rechazar.',
  BUYER_WALLET_UNAVAILABLE: 'La billetera del contratador no está disponible para fondear.',
  WORKSPACE_NOT_READY: 'El espacio de trabajo se abre cuando el emprendedor acepta y el pago entra a custodia.',
  WORKSPACE_CHAT_CLOSED: 'El chat solo está disponible mientras el encargo está en custodia.',
};

export function humanError(status: number, body: unknown, fallback = 'Algo salió mal. Inténtalo de nuevo.'): string {
  const code = errorCode(body);
  if (code && HUMAN_ERRORS[code]) return HUMAN_ERRORS[code];
  if (status === 0 || status >= 500) return HUMAN_ERRORS.API_UNREACHABLE;
  if (status === 401) return HUMAN_ERRORS.UNAUTHENTICATED;
  if (status === 403) return HUMAN_ERRORS.WALLET_NOT_VERIFIED;
  return fallback;
}

export function formatUsd(cents: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}
