import { http, HttpResponse } from 'msw';
import {
  mockClientTaskPublication,
  mockTaskOrderCard,
  WalletLinkRequestSchema,
  ActiveModeSwitchSchema,
} from '@taskstream/shared-schemas';
import {
  discoverMockWallet,
  createMockChallenge,
  getMockActiveWallet,
  getMockUserMode,
  setMockUserMode,
  completeMockVerification,
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

  // Fase 1 (SPEC-02): Modo Activo
  http.get(`${api}/api/v1/me/mode`, () => {
    return HttpResponse.json({ activeMode: getMockUserMode() });
  }),
  http.post(`${api}/api/v1/me/mode`, async ({ request }) => {
    const body = await request.json();
    const parsed = ActiveModeSwitchSchema.safeParse(body);
    if (!parsed.success) {
      return HttpResponse.json(
        { code: 'ACTIVE_MODE_INVALID', errors: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const updated = setMockUserMode(parsed.data.activeMode);
    return HttpResponse.json({ activeMode: updated });
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
    return HttpResponse.json(challenge);
  }),

  // Fase 1 (SPEC-02): Consulta de Wallet Activa
  http.get(`${api}/api/v1/me/wallet`, () => {
    return HttpResponse.json(getMockActiveWallet());
  }),

  // Fase 1 (SPEC-02): Mock Callback / Verificación
  http.post(`${api}/api/v1/me/wallet`, async ({ request }) => {
    const body = (await request.json()) as { walletAddress: string; hash: string };
    const discovery = discoverMockWallet(body.walletAddress);
    const result = completeMockVerification(discovery, body.hash);
    if (!result.success) {
      return HttpResponse.json({ code: result.code }, { status: 400 });
    }
    return HttpResponse.json({ success: true, wallet: result.wallet });
  }),
];
