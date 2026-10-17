/**
 * Normaliza Payment Pointer (`$host/path`) a wallet address HTTPS.
 * RFC 8905: `$example.com/bob` → `https://example.com/bob`
 *            `$example.com` → `https://example.com/.well-known/pay`
 */
export function normalizeWalletAddressInput(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith('$')) {
    const rest = trimmed.slice(1).replace(/^\/+/, '');
    if (!rest) return trimmed;
    if (!rest.includes('/')) {
      return `https://${rest}/.well-known/pay`;
    }
    return `https://${rest}`;
  }
  return trimmed;
}
