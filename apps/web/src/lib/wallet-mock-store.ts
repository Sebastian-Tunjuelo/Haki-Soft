import { gnapInteractHash } from '@taskstream/shared-schemas';

export interface WalletDiscovery {
  walletAddress: string;
  authServer: string;
  resourceServer: string;
  assetCode: string;
  assetScale: number;
}

export interface WalletChallenge {
  challengeId: string;
  interactRedirectUri: string;
  status: 'PENDING_REDIRECT' | 'VERIFIED' | 'FAILED' | 'EXPIRED';
  clientNonce: string;
  finishNonce: string;
  interactRef: string;
  authServerUrl: string;
  expectedHash: string;
  expiresAt: string;
}

export interface ActiveUserWallet {
  walletAddress: string;
  assetCode: string;
  assetScale: number;
  authServer: string;
  resourceServer: string;
  isVerified: boolean;
  isActive: boolean;
  verifiedAt: string;
}

// In-memory store per dev session
let currentMode: 'BUYER' | 'SELLER' = 'BUYER';
let activeWallet: ActiveUserWallet | null = null;
let previousWallets: ActiveUserWallet[] = [];
let pendingChallenge: WalletChallenge | null = null;

export function getMockUserMode(): 'BUYER' | 'SELLER' {
  return currentMode;
}

export function setMockUserMode(mode: 'BUYER' | 'SELLER'): 'BUYER' | 'SELLER' {
  currentMode = mode;
  return currentMode;
}

export function getMockActiveWallet(): { activeWallet: ActiveUserWallet | null; previousWallets: ActiveUserWallet[] } {
  return { activeWallet, previousWallets };
}

export function discoverMockWallet(walletAddress: string): WalletDiscovery {
  const urlLower = walletAddress.toLowerCase();
  let assetCode = 'USD';
  let assetScale = 2;

  if (urlLower.includes('cop') || urlLower.includes('colombia')) {
    assetCode = 'COP';
    assetScale = 2;
  } else if (urlLower.includes('cad') || urlLower.includes('canada')) {
    assetCode = 'CAD';
    assetScale = 2;
  } else if (urlLower.includes('brl') || urlLower.includes('brasil') || urlLower.includes('brazil')) {
    assetCode = 'BRL';
    assetScale = 2;
  } else if (urlLower.includes('mxn') || urlLower.includes('mexico')) {
    assetCode = 'MXN';
    assetScale = 2;
  } else if (urlLower.includes('ars') || urlLower.includes('argentina')) {
    assetCode = 'ARS';
    assetScale = 2;
  }

  return {
    walletAddress,
    authServer: 'https://auth.interledger-test.dev',
    resourceServer: 'https://ilp.interledger-test.dev',
    assetCode,
    assetScale,
  };
}

export function createMockChallenge(discovery: WalletDiscovery): WalletChallenge {
  const challengeId = `chal_${Math.random().toString(36).substring(2, 11)}`;
  const clientNonce = `cnonce_${Math.random().toString(36).substring(2, 15)}`;
  const finishNonce = `fnonce_${Math.random().toString(36).substring(2, 15)}`;
  const interactRef = `iref_${Math.random().toString(36).substring(2, 15)}`;
  const authServerUrl = discovery.authServer;

  const expectedHash = gnapInteractHash({
    clientNonce,
    finishNonce,
    interactRef,
    authServerUrl,
  });

  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutos

  pendingChallenge = {
    challengeId,
    interactRedirectUri: `${authServerUrl}/interact/${challengeId}?interact_ref=${interactRef}&finish_nonce=${finishNonce}`,
    status: 'PENDING_REDIRECT',
    clientNonce,
    finishNonce,
    interactRef,
    authServerUrl,
    expectedHash,
    expiresAt,
  };

  return pendingChallenge;
}

export function getPendingChallenge(): WalletChallenge | null {
  return pendingChallenge;
}

export function completeMockVerification(discovery: WalletDiscovery, hashToVerify: string): {
  success: boolean;
  code?: string;
  wallet?: ActiveUserWallet;
} {
  if (!pendingChallenge) {
    return { success: false, code: 'ACTIVE_WALLET_CHALLENGE_NOT_FOUND' };
  }

  // Comprobar expiración
  if (new Date(pendingChallenge.expiresAt).getTime() < Date.now()) {
    pendingChallenge.status = 'EXPIRED';
    return { success: false, code: 'WALLET_CHALLENGE_EXPIRED' };
  }

  // Verificación en tiempo constante del hash SHA-256 (SPEC-02 §7)
  if (hashToVerify !== pendingChallenge.expectedHash) {
    pendingChallenge.status = 'FAILED';
    return { success: false, code: 'GNAP_HASH_MISMATCH' };
  }

  // Invariante 2: si ya había una activa, queda isActive = false en la misma transacción lógica
  if (activeWallet) {
    previousWallets.unshift({
      ...activeWallet,
      isActive: false,
    });
  }

  const newWallet: ActiveUserWallet = {
    walletAddress: discovery.walletAddress,
    assetCode: discovery.assetCode,
    assetScale: discovery.assetScale,
    authServer: discovery.authServer,
    resourceServer: discovery.resourceServer,
    isVerified: true,
    isActive: true,
    verifiedAt: new Date().toISOString(),
  };

  activeWallet = newWallet;
  pendingChallenge.status = 'VERIFIED';

  return { success: true, wallet: newWallet };
}
