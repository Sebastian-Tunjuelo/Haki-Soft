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
];

/** Heurística local; el modelo también puede marcar `promptInjectionDetected`. */
export function detectPromptInjectionSignals(text: string): boolean {
  if (!text.trim()) return false;
  return INJECTION_PATTERNS.some((pattern) => pattern.test(text));
}
