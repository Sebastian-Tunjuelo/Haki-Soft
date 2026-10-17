export type ActiveMode = 'BUYER' | 'SELLER';
export type PlatformRole = 'USER' | 'ADMIN';

export type ChallengeStatus = 'PENDING_REDIRECT' | 'VERIFIED' | 'FAILED' | 'EXPIRED';

export interface StoredUser {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  countryCode: string;
  activeMode: ActiveMode;
  platformRole: PlatformRole;
}

export interface LocalUserInput {
  email: string;
  passwordHash: string;
  displayName: string;
  countryCode: string;
}

/** Saldo inicial demo ($1,000.00) al vincular billetera. */
export const DEMO_WALLET_STARTING_BALANCE_USD_IN_CENTS = 100_000;

export interface StoredWallet {
  id: string;
  userId: string;
  walletAddressUrl: string;
  assetCode: string;
  assetScale: number;
  authServerUrl: string;
  resourceServerUrl: string;
  isVerified: boolean;
  isActive: boolean;
  verifiedAt: Date | null;
  /** Centavos USD del ledger demo (fondeo/liberación simulados). */
  demoBalanceUSDInCents: number;
}

export interface StoredChallenge {
  id: string;
  walletId: string;
  userId: string;
  walletAddressUrl: string;
  authServerUrl: string;
  clientNonce: string;
  finishNonce: string;
  continueUri: string;
  continueAccessToken: string;
  interactRedirectUri: string;
  interactRef: string | null;
  receivedHash: string | null;
  status: ChallengeStatus;
  expiresAt: Date;
}

export interface IdentityRepository {
  createLocalUser(input: LocalUserInput): Promise<StoredUser>;
  findUserByEmail(email: string): Promise<{ user: StoredUser; passwordHash: string } | null>;
  findUserById(userId: string): Promise<StoredUser | null>;
  setActiveMode(userId: string, activeMode: ActiveMode): Promise<StoredUser | null>;
  findActiveWallet(userId: string): Promise<StoredWallet | null>;
  hasVerifiedActiveWallet(userId: string): Promise<boolean>;
  saveDiscoveredWallet(input: {
    userId: string;
    walletAddressUrl: string;
    assetCode: string;
    assetScale: number;
    authServerUrl: string;
    resourceServerUrl: string;
  }): Promise<{ ok: true; wallet: StoredWallet } | { ok: false; reason: 'WALLET_ADDRESS_IN_USE' }>;
  findWalletByUserAndUrl(userId: string, walletAddressUrl: string): Promise<StoredWallet | null>;
  findOpenChallenge(userId: string): Promise<StoredChallenge | null>;
  expireChallenge(challengeId: string): Promise<void>;
  insertChallenge(input: {
    id: string;
    walletId: string;
    clientNonce: string;
    finishNonce: string;
    continueUri: string;
    continueAccessToken: string;
    interactRedirectUri: string;
    expiresAt: Date;
  }): Promise<StoredChallenge>;
  findChallengeById(challengeId: string): Promise<StoredChallenge | null>;
  interactRefUsed(interactRef: string): Promise<boolean>;
  markChallengeFailed(challengeId: string, interactRef: string, receivedHash: string): Promise<void>;
  replaceWithVerifiedWallet(input: {
    userId: string;
    walletId: string;
    challengeId: string;
    interactRef: string;
    receivedHash: string;
    verifiedAt: Date;
  }): Promise<void>;
  /**
   * Ajusta el saldo demo de la wallet activa verificada.
   * `deltaCents` negativo = débito (fondeo); positivo = crédito (liberación/reembolso).
   */
  adjustDemoBalance(
    userId: string,
    deltaCents: number,
  ): Promise<'OK' | 'INSUFFICIENT' | 'NO_WALLET'>;
}

export interface WalletDiscovery {
  walletAddress: string;
  authServer: string;
  resourceServer: string;
  assetCode: string;
  assetScale: number;
}

export interface SubjectGrantSession {
  clientNonce: string;
  finishNonce: string;
  continueUri: string;
  continueAccessToken: string;
  interactRedirectUri: string;
  expiresAt: Date;
}

/**
 * Puerto hacia Open Payments. Lo implementa `OpenPaymentsService`:
 * descubrimiento público y Subject Grant firmado por el cliente de plataforma.
 */
export interface WalletOwnershipGateway {
  discover(walletAddress: string): Promise<WalletDiscovery>;
  beginSubjectGrant(input: {
    walletAddress: string;
    authServer: string;
    callbackUrl: string;
  }): Promise<SubjectGrantSession>;
  continueSubjectGrant(input: {
    continueUri: string;
    continueAccessToken: string;
    interactRef: string;
    walletAddress: string;
  }): Promise<{ subjectWalletAddress: string }>;
}

export interface Clock {
  now(): Date;
}
