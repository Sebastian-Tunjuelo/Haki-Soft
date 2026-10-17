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
  FORBIDDEN_GIG_OWNERSHIP: 'Solo el dueño del Gig puede modificarlo o eliminarlo.',
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
  INSUFFICIENT_DEMO_BALANCE: 'Saldo insuficiente en la billetera demo para fondear este encargo.',
  OPEN_PAYMENTS_CLIENT_NOT_CONFIGURED:
    'Faltan credenciales Open Payments del cliente (wallet, keyId, private key).',
  OPEN_PAYMENTS_ESCROW_TOKEN_MISSING:
    'Falta OPEN_PAYMENTS_ESCROW_ACCESS_TOKEN: crea un grant outgoing de larga duración en la Test Wallet de custodia.',
  OPEN_PAYMENTS_ESCROW_TOKEN_INVALID:
    'El token de custodia no autoriza pagos desde la wallet escrow actual. Regenera OPEN_PAYMENTS_ESCROW_ACCESS_TOKEN con el script create-escrow-outgoing-grant.mjs (misma wallet que OPEN_PAYMENTS_ESCROW_WALLET_ADDRESS).',
  OPEN_PAYMENTS_UPSTREAM:
    'Open Payments / Test Wallet rechazó la operación (fondos insuficientes en custodia, asset distinto o grant inválido). Revisa saldos y que el token sea de la wallet escrow.',
  OPEN_PAYMENTS_GRANT_NOT_PENDING: 'Se esperaba un grant interactivo pendiente (autorización en Test Wallet).',
  OPEN_PAYMENTS_GRANT_NOT_FINALIZED: 'El grant de Open Payments no quedó finalizado.',
  GNAP_HASH_MISMATCH: 'El hash GNAP del callback no coincide. Vuelve a autorizar el pago.',
  SELLER_WALLET_UNAVAILABLE: 'El emprendedor no tiene billetera verificada para recibir el pago.',
  WORKSPACE_NOT_READY: 'El espacio de trabajo se abre cuando el emprendedor acepta y el pago entra a custodia.',
  WORKSPACE_CHAT_CLOSED: 'El chat solo está disponible mientras el encargo está en custodia.',
  NOT_ORDER_SELLER: 'Solo el emprendedor de esta orden puede subir la entrega.',
  EXTENSION_NOT_ALLOWED: 'Esa extensión no está permitida para este tipo de servicio.',
  EMPTY_DELIVERABLE: 'El archivo está vacío. Sube un archivo con contenido.',
  ORIGINAL_LOCKED: 'El original está bloqueado mientras la orden está en revisión.',
  DELIVERABLE_NOT_FOUND: 'No encontramos esa entrega.',
  ORDER_NOT_ACCEPTING_DELIVERABLES: 'Esta orden aún no admite entregas (falta custodia o ya no está abierta).',
  REVISION_ALREADY_SUBMITTED: 'Esa revisión ya fue entregada.',
  PREVIEW_NOT_READY: 'El preview aún no está listo.',
  PREVIEW_GENERATION_FAILED: 'No se pudo generar el preview. Reintenta completar la entrega.',
  ORDER_NOT_IN_REVIEW: 'La orden no está en revisión; no se puede abrir la ventana final.',
  NOT_IN_REVIEW: 'La orden no está en revisión (IN_REVIEW).',
  REPORT_FORBIDDEN: 'No puedes ver el informe de IA de esta orden.',
  NOT_ORDER_BUYER: 'Solo el contratador de esta orden puede realizar esa acción.',
  REVISION_LIMIT_REACHED: 'Ya usaste las 2 correcciones permitidas en esta orden.',
  DISPUTE_WINDOW_CLOSED: 'Ya no se puede abrir una disputa en este estado.',
  DISPUTE_ALREADY_OPEN: 'Ya hay una disputa abierta para esta orden.',
  DISPUTE_ALREADY_RESOLVED: 'Esta disputa ya fue resuelta.',
  DISPUTE_NOT_FOUND: 'No encontramos esa disputa.',
  ADMIN_ONLY: 'Solo un administrador puede acceder a esta consola.',
  ORDER_FORBIDDEN: 'No tienes acceso a esta orden.',
  DELIVERABLE_PERSISTENCE_FAILED: 'No se pudo registrar la entrega. Reintenta en un momento.',
  SERVER_ERROR: 'El servidor no pudo completar la acción. Reintenta.',
};

export function humanError(status: number, body: unknown, fallback = 'Algo salió mal. Inténtalo de nuevo.'): string {
  const code = errorCode(body);
  if (code && HUMAN_ERRORS[code]) return HUMAN_ERRORS[code];
  if (status === 0) return HUMAN_ERRORS.API_UNREACHABLE;
  if (status === 502 && code === 'API_UNREACHABLE') return HUMAN_ERRORS.API_UNREACHABLE;
  if (status >= 500) return HUMAN_ERRORS.SERVER_ERROR;
  if (status === 401) return HUMAN_ERRORS.UNAUTHENTICATED;
  if (status === 403 && code === 'ADMIN_ONLY') return HUMAN_ERRORS.ADMIN_ONLY;
  if (status === 403 && code === 'NOT_ORDER_BUYER') return HUMAN_ERRORS.NOT_ORDER_BUYER;
  if (status === 403 && code === 'ORIGINAL_LOCKED') return HUMAN_ERRORS.ORIGINAL_LOCKED;
  if (status === 403) return HUMAN_ERRORS.WALLET_NOT_VERIFIED;
  return fallback;
}

export function formatUsd(cents: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}
