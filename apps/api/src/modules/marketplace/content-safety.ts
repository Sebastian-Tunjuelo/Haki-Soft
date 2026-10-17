import { DomainError } from '../identity/domain-error';

const CONTROL_AND_INVISIBLE = /[\u0000-\u001F\u007F\u200B-\u200F\u202A-\u202E\u2060\uFEFF]/g;

const UNSAFE_PATTERNS: RegExp[] = [
  /<\|\s*system\s*\|>/i,
  /<deliverable_untrusted_content>/i,
  /<\/deliverable_untrusted_content>/i,
  /<script\b/i,
  /<iframe\b/i,
  /javascript\s*:/i,
];

export function normalizeMarketplaceText(value: string): string {
  return value.normalize('NFC').replace(CONTROL_AND_INVISIBLE, '').trim();
}

export function assertSafeMarketplaceContent(fields: Record<string, string>): void {
  for (const [field, raw] of Object.entries(fields)) {
    const text = normalizeMarketplaceText(raw);
    if (UNSAFE_PATTERNS.some((pattern) => pattern.test(text))) {
      throw new DomainError(422, 'UNSAFE_CONTENT_DETECTED');
    }
    if (text.length === 0 && raw.trim().length > 0) {
      throw new DomainError(422, 'UNSAFE_CONTENT_DETECTED');
    }
    void field;
  }
}
