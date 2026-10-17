import { describe, expect, it } from 'vitest';
import { gnapInteractHash } from './idempotency';
import { WalletLinkRequestSchema } from './schemas';
import { normalizeWalletAddressInput } from './wallet-address';

describe('wallet address + GNAP hash', () => {
  it('normaliza Payment Pointer $host/path a https', () => {
    expect(normalizeWalletAddressInput('$ilp.interledger-test.dev/dolarsito')).toBe(
      'https://ilp.interledger-test.dev/dolarsito',
    );
    expect(normalizeWalletAddressInput('  $ilp.interledger-test.dev/dolarsito  ')).toBe(
      'https://ilp.interledger-test.dev/dolarsito',
    );
    expect(normalizeWalletAddressInput('$example.com')).toBe('https://example.com/.well-known/pay');
  });

  it('acepta $… en WalletLinkRequestSchema', () => {
    const parsed = WalletLinkRequestSchema.safeParse({
      walletAddress: '$ilp.interledger-test.dev/dolarsito',
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.walletAddress).toBe('https://ilp.interledger-test.dev/dolarsito');
    }
  });

  it('emite hash GNAP en Base64 estándar con padding (formato Rafiki)', () => {
    const hash = gnapInteractHash({
      clientNonce: 'client-nonce-fixed',
      finishNonce: 'finish-nonce-fixed',
      interactRef: 'interact-ref-ok',
      authServerUrl: 'https://auth.example.test',
    });
    expect(hash).toBe('qGTLnLZ63o305Y2OVcIvdXJw96kSjJQ8dFtjGsH30N0=');
    expect(hash).toMatch(/=$/);
    expect(hash).not.toMatch(/^[0-9a-f]{64}$/);
  });
});
