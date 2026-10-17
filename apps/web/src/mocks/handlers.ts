import { http, HttpResponse } from 'msw';
import {
  mockClientTaskPublication,
  mockTaskOrderCard,
  WalletLinkRequestSchema,
} from '@taskstream/shared-schemas';
import {
  discoverMockWallet,
  createMockChallenge,
  getMockActiveWallet,
} from '../lib/wallet-mock-store';

const api = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

/**
 * Adaptadores MSW de Fase 0 y Fase 1 (SPEC-02):
 * FE-1 y FE-2 consumen contratos reales y descubrimientos mientras BE-1 y BE-2 terminan sus módulos.
 */
export const handlers = [
  // Fase 0: Contratos de ejemplo
  http.get(`${api}/api/v1/contracts/sample-publication`, () => {
    return HttpResponse.json(mockClientTaskPublication());
  }),
  http.get(`${api}/api/v1/contracts/sample-order`, () => {
    return HttpResponse.json(mockTaskOrderCard());
  }),

  // Fase 1 (SPEC-02): Descubrimiento GNAP de Wallet
  http.post(`${api}/api/v1/me/wallet/discovery`, async ({ request }) => {
    const body = await request.json();
    const parsed = WalletLinkRequestSchema.safeParse(body);
    if (!parsed.success) {
      return HttpResponse.json(
        { code: 'WALLET_ADDRESS_INVALID', message: 'Debe ser una URL HTTPS válida' },
        { status: 400 },
      );
    }
    const discovery = discoverMockWallet(parsed.data.walletAddress);
    return HttpResponse.json(discovery);
  }),

  // Fase 1 (SPEC-02): Creación de Reto Subject Grant
  http.post(`${api}/api/v1/me/wallet/challenges`, async ({ request }) => {
    const body = await request.json();
    const parsed = WalletLinkRequestSchema.safeParse(body);
    if (!parsed.success) {
      return HttpResponse.json({ code: 'WALLET_ADDRESS_INVALID' }, { status: 400 });
    }
    const discovery = discoverMockWallet(parsed.data.walletAddress);
    const challenge = createMockChallenge(discovery);
    return HttpResponse.json({
      challengeId: challenge.challengeId,
      interactRedirectUri: challenge.interactRedirectUri,
      status: 'PENDING_REDIRECT' as const,
    });
  }),

  http.get(`${api}/api/v1/me/wallet`, () => {
    const stored = getMockActiveWallet();
    if (!stored.activeWallet) return HttpResponse.json({ wallet: null });
    const wallet = stored.activeWallet;
    return HttpResponse.json({
      wallet: {
        walletAddress: wallet.walletAddress,
        assetCode: wallet.assetCode,
        assetScale: wallet.assetScale,
        isVerified: wallet.isVerified,
        isActive: wallet.isActive,
      },
    });
  }),
];
