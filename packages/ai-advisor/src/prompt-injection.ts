const INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(all\s+)?(previous\s+|the\s+)?instructions?/i,
  /disregard\s+(all\s+)?(previous\s+|system\s+)?(instructions?|prompts?)/i,
  /override\s+(the\s+)?system/i,
  /you\s+are\s+now\s+(a|an|the)\s+/i,
  /aprueba(r)?\s+(el\s+)?pago/i,
  /approve\s+(the\s+)?payment/i,
  /release\s+(the\s+)?(escrow|funds?)/i,
  /ejecuta(r)?\s+(el\s+)?pago/i,
  /system\s*:\s*/i,
  /<\/?system>/i,
  // Español: ignorar instrucciones/reglas (no basta con mencionar "instrucciones" de forma descriptiva).
  /ignor[ae]\s+(todas\s+)?(las\s+)?(instrucciones?|reglas?)/i,
  // Español: revelar el (system) prompt.
  /revel[ae]\s+(el\s+)?(system\s+)?prompt/i,
  // Español: liberar escrow / fondos en custodia.
  /liber[ae]\s+(el\s+|los\s+)?(escrow|fondos?)/i,
];

/**
 * Heurística local por patrones; no es una defensa completa contra prompt injection.
 * El modelo también puede marcar `promptInjectionDetected`. Falsos negativos y positivos son posibles.
 */
export function detectPromptInjectionSignals(text: string): boolean {
  if (!text.trim()) return false;
  return INJECTION_PATTERNS.some((pattern) => pattern.test(text));
}
