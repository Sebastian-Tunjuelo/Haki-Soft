export type ActiveMode = 'BUYER' | 'SELLER';

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
}

export interface ActiveWallet {
  walletAddress: string;
  assetCode: string;
  assetScale: number;
  isVerified: boolean;
  isActive: boolean;
}

const CHALLENGE_STATUSES = new Set<WalletChallenge['status']>([
  'PENDING_REDIRECT',
  'VERIFIED',
  'FAILED',
  'EXPIRED',
]);

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

export function readApiCode(body: unknown): string | null {
  if (!body || typeof body !== 'object' || !('code' in body)) return null;
  const code = (body as { code?: unknown }).code;
  return typeof code === 'string' && code.length > 0 ? code : null;
}

export function readActiveMode(body: unknown): ActiveMode | null {
  if (!body || typeof body !== 'object' || !('activeMode' in body)) return null;
  const mode = (body as { activeMode?: unknown }).activeMode;
  return mode === 'BUYER' || mode === 'SELLER' ? mode : null;
}

export function readWalletDiscovery(body: unknown): WalletDiscovery | null {
  if (!body || typeof body !== 'object') return null;
  const row = body as Record<string, unknown>;
  if (typeof row.walletAddress !== 'string' || !row.walletAddress.startsWith('https://')) return null;
  if (typeof row.authServer !== 'string' || !isHttpUrl(row.authServer)) return null;
  if (typeof row.resourceServer !== 'string' || !isHttpUrl(row.resourceServer)) return null;
  if (typeof row.assetCode !== 'string' || row.assetCode.length === 0) return null;
  if (typeof row.assetScale !== 'number' || !Number.isInteger(row.assetScale) || row.assetScale < 0) return null;
  return {
    walletAddress: row.walletAddress,
    authServer: row.authServer,
    resourceServer: row.resourceServer,
    assetCode: row.assetCode,
    assetScale: row.assetScale,
  };
}

/** Solo los tres campos públicos de SPEC-02 §4.1. Ignora nonces y hashes si el cuerpo los trae. */
export function readWalletChallenge(body: unknown): WalletChallenge | null {
  if (!body || typeof body !== 'object') return null;
  const row = body as Record<string, unknown>;
  if (typeof row.challengeId !== 'string' || row.challengeId.length === 0) return null;
  if (typeof row.interactRedirectUri !== 'string' || !isHttpUrl(row.interactRedirectUri)) return null;
  if (typeof row.status !== 'string' || !CHALLENGE_STATUSES.has(row.status as WalletChallenge['status'])) {
    return null;
  }
  return {
    challengeId: row.challengeId,
    interactRedirectUri: row.interactRedirectUri,
    status: row.status as WalletChallenge['status'],
  };
}

export interface SessionUser {
  id: string;
  email: string;
  displayName: string;
  activeMode: ActiveMode;
}

export function readSessionUser(body: unknown): SessionUser | null {
  if (!body || typeof body !== 'object' || !('user' in body)) return null;
  const user = (body as { user?: unknown }).user;
  if (!user || typeof user !== 'object') return null;
  const row = user as Record<string, unknown>;
  if (typeof row.id !== 'string' || typeof row.email !== 'string' || typeof row.displayName !== 'string') {
    return null;
  }
  if (row.activeMode !== 'BUYER' && row.activeMode !== 'SELLER') return null;
  return {
    id: row.id,
    email: row.email,
    displayName: row.displayName,
    activeMode: row.activeMode,
  };
}

export function readActiveWallet(body: unknown): ActiveWallet | null {
  if (!body || typeof body !== 'object' || !('wallet' in body)) return null;
  const wallet = (body as { wallet?: unknown }).wallet;
  if (!wallet || typeof wallet !== 'object') return null;
  const row = wallet as Record<string, unknown>;
  if (typeof row.walletAddress !== 'string' || !row.walletAddress.startsWith('https://')) return null;
  if (typeof row.assetCode !== 'string' || row.assetCode.length === 0) return null;
  if (typeof row.assetScale !== 'number' || !Number.isInteger(row.assetScale) || row.assetScale < 0) return null;
  if (typeof row.isVerified !== 'boolean' || typeof row.isActive !== 'boolean') return null;
  return {
    walletAddress: row.walletAddress,
    assetCode: row.assetCode,
    assetScale: row.assetScale,
    isVerified: row.isVerified,
    isActive: row.isActive,
  };
}
