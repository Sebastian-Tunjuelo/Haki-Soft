import type { GrantSession, JsonObject } from "./types.js";

const SECRET_KEYS = new Set([
  "access_token",
  "accessToken",
  "continueAccessToken",
  "continue_access_token",
  "token",
]);

export function sanitizeObject(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeObject(item));
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  const sanitized: JsonObject = {};
  for (const [key, child] of Object.entries(value)) {
    if (SECRET_KEYS.has(key)) {
      sanitized[key] = "[redacted]";
    } else {
      sanitized[key] = sanitizeObject(child);
    }
  }
  return sanitized;
}

export function sanitizeSession(session: GrantSession): JsonObject {
  return {
    id: session.id,
    status: session.status,
    authServer: session.authServer,
    access: sanitizeObject(session.access),
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    error: session.error,
    interactRedirectUrl: session.interactRedirectUrl,
    hasContinuation: Boolean(session.continueUri && session.continueAccessToken),
    hasAccessToken: Boolean(session.accessToken),
    hasInteractRef: Boolean(session.interactRef),
    hashVerified: session.hashVerified,
    outgoingPayment: sanitizeObject(session.outgoingPayment),
  };
}
