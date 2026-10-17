import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  readActiveMode,
  readActiveWallet,
  readApiCode,
  readWalletChallenge,
  readWalletDiscovery,
} from '@/src/lib/identity-contract';

const webRoot = path.resolve(__dirname, '../..');

function source(relativePath: string): string {
  return fs.readFileSync(path.join(webRoot, relativePath), 'utf8');
}

describe('SPEC-02: contrato público entre el front y la API', () => {
  it('lee el modo y la billetera activa con la forma de Nest', () => {
    expect(readActiveMode({ activeMode: 'SELLER' })).toBe('SELLER');
    expect(readActiveMode({ activeMode: 'ADMIN' })).toBeNull();
    expect(readApiCode({ code: 'USER_NOT_SYNCED' })).toBe('USER_NOT_SYNCED');

    expect(
      readWalletDiscovery({
        walletAddress: 'https://ilp.interledger-test.dev/ada',
        authServer: 'https://auth.example.test',
        resourceServer: 'https://ilp.example.test',
        assetCode: 'COP',
        assetScale: 2,
      })?.assetCode,
    ).toBe('COP');

    const wallet = readActiveWallet({
      wallet: {
        walletAddress: 'https://ilp.interledger-test.dev/ada',
        assetCode: 'COP',
        assetScale: 2,
        isVerified: true,
        isActive: true,
      },
    });
    expect(wallet?.isActive).toBe(true);
    expect(readActiveWallet({ wallet: null })).toBeNull();
    expect(readActiveWallet({ activeWallet: { walletAddress: 'https://example.com' } })).toBeNull();
  });

  it('el reto público no conserva nonces ni el hash esperado', () => {
    const challenge = readWalletChallenge({
      challengeId: '7d6c6b4a-6e2a-4c1b-9f4a-1b2c3d4e5f60',
      interactRedirectUri: 'https://wallet.example.test/interact',
      status: 'PENDING_REDIRECT',
      clientNonce: 'client-nonce-fixed',
      finishNonce: 'finish-nonce-fixed',
      expectedHash: 'a'.repeat(64),
      continueAccessToken: 'continue-token-secret',
    });

    expect(challenge).toEqual({
      challengeId: '7d6c6b4a-6e2a-4c1b-9f4a-1b2c3d4e5f60',
      interactRedirectUri: 'https://wallet.example.test/interact',
      status: 'PENDING_REDIRECT',
    });
    expect(JSON.stringify(challenge)).not.toContain('client-nonce-fixed');
    expect(JSON.stringify(challenge)).not.toContain('continue-token-secret');
  });

  it('las rutas de Next reenvían a Nest y no usan el almacén mock', () => {
    for (const route of [
      'app/api/v1/me/wallet/route.ts',
      'app/api/v1/me/wallet/discovery/route.ts',
      'app/api/v1/me/wallet/challenges/route.ts',
    ]) {
      const text = source(route);
      expect(text).toContain('proxyIdentity');
      expect(text).not.toContain('wallet-mock-store');
    }
    expect(source('app/api/v1/me/wallet/route.ts')).not.toContain('POST');
  });

  it('sin sesión la página no monta el formulario y el reto abre interactRedirectUri', () => {
    const page = source('app/onboarding/wallet/page.tsx');
    expect(page).toContain('isAuthenticated ? (');
    expect(page).toContain('<WalletVerification');
    expect(page).toContain('Sin sesión no se muestra el formulario');

    const form = source('src/components/wallet-verification.tsx');
    expect(form).toContain('interactRedirectUri');
    expect(form).toContain("window.location.assign(challenge.interactRedirectUri)");
    expect(form).not.toContain('expectedHash');
    expect(form).not.toContain('clientNonce');
    expect(form).not.toContain('finishNonce');
    expect(form).not.toContain("'/api/v1/me/wallet',");
    expect(page).not.toContain('@clerk');
    expect(source('src/lib/identity-proxy.ts')).not.toContain('@clerk');
    expect(source('app/layout.tsx')).not.toContain('@clerk');
  });
});
