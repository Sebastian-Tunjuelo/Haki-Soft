import { randomUUID } from 'node:crypto';
import { DomainError } from './domain-error';
import type {
  ActiveMode,
  IdentityRepository,
  LocalUserInput,
  StoredChallenge,
  StoredUser,
  StoredWallet,
} from './identity.types';

interface MemoryState {
  users: StoredUser[];
  passwords: Map<string, string>;
  wallets: StoredWallet[];
  challenges: StoredChallenge[];
}

export class MemoryIdentityRepository implements IdentityRepository {
  abortNextReplacement = false;
  private state: MemoryState = { users: [], passwords: new Map(), wallets: [], challenges: [] };

  walletsOf(userId: string): StoredWallet[] {
    return this.state.wallets.filter((wallet) => wallet.userId === userId).map((wallet) => ({ ...wallet }));
  }

  userCount(): number {
    return this.state.users.length;
  }

  async createLocalUser(input: LocalUserInput): Promise<StoredUser> {
    const emailOwner = this.state.users.find((user) => user.email === input.email);
    if (emailOwner) {
      throw new DomainError(409, 'EMAIL_ALREADY_REGISTERED');
    }
    const user: StoredUser = {
      id: randomUUID(),
      email: input.email,
      displayName: input.displayName,
      avatarUrl: null,
      countryCode: input.countryCode,
      activeMode: 'BUYER',
    };
    this.state.users.push(user);
    this.state.passwords.set(user.id, input.passwordHash);
    return { ...user };
  }

  async findUserByEmail(email: string): Promise<{ user: StoredUser; passwordHash: string } | null> {
    const user = this.state.users.find((item) => item.email === email);
    if (!user) return null;
    return { user: { ...user }, passwordHash: this.state.passwords.get(user.id) ?? '' };
  }

  async findUserById(userId: string): Promise<StoredUser | null> {
    const user = this.state.users.find((item) => item.id === userId);
    return user ? { ...user } : null;
  }

  async setActiveMode(userId: string, activeMode: ActiveMode): Promise<StoredUser | null> {
    const user = this.state.users.find((item) => item.id === userId);
    if (!user) return null;
    user.activeMode = activeMode;
    return { ...user };
  }

  async findActiveWallet(userId: string): Promise<StoredWallet | null> {
    const wallet = this.state.wallets.find((item) => item.userId === userId && item.isActive);
    return wallet ? { ...wallet } : null;
  }

  async hasVerifiedActiveWallet(userId: string): Promise<boolean> {
    return this.state.wallets.some((item) => item.userId === userId && item.isActive && item.isVerified);
  }

  async saveDiscoveredWallet(input: {
    userId: string;
    walletAddressUrl: string;
    assetCode: string;
    assetScale: number;
    authServerUrl: string;
    resourceServerUrl: string;
  }): Promise<{ ok: true; wallet: StoredWallet } | { ok: false; reason: 'WALLET_ADDRESS_IN_USE' }> {
    const existing = this.state.wallets.find((wallet) => wallet.walletAddressUrl === input.walletAddressUrl);
    if (existing && existing.userId !== input.userId) {
      return { ok: false, reason: 'WALLET_ADDRESS_IN_USE' };
    }
    if (existing) {
      existing.assetCode = input.assetCode;
      existing.assetScale = input.assetScale;
      existing.authServerUrl = input.authServerUrl;
      existing.resourceServerUrl = input.resourceServerUrl;
      return { ok: true, wallet: { ...existing } };
    }
    const wallet: StoredWallet = {
      id: randomUUID(),
      userId: input.userId,
      walletAddressUrl: input.walletAddressUrl,
      assetCode: input.assetCode,
      assetScale: input.assetScale,
      authServerUrl: input.authServerUrl,
      resourceServerUrl: input.resourceServerUrl,
      isVerified: false,
      isActive: false,
      verifiedAt: null,
    };
    this.state.wallets.push(wallet);
    return { ok: true, wallet: { ...wallet } };
  }

  async findWalletByUserAndUrl(userId: string, walletAddressUrl: string): Promise<StoredWallet | null> {
    const wallet = this.state.wallets.find(
      (item) => item.userId === userId && item.walletAddressUrl === walletAddressUrl,
    );
    return wallet ? { ...wallet } : null;
  }

  async findOpenChallenge(userId: string): Promise<StoredChallenge | null> {
    const challenge = this.state.challenges.find(
      (item) => item.userId === userId && item.status === 'PENDING_REDIRECT',
    );
    return challenge ? { ...challenge } : null;
  }

  async expireChallenge(challengeId: string): Promise<void> {
    const challenge = this.state.challenges.find((item) => item.id === challengeId);
    if (challenge && challenge.status === 'PENDING_REDIRECT') {
      challenge.status = 'EXPIRED';
    }
  }

  async insertChallenge(input: {
    id: string;
    walletId: string;
    clientNonce: string;
    finishNonce: string;
    continueUri: string;
    continueAccessToken: string;
    interactRedirectUri: string;
    expiresAt: Date;
  }): Promise<StoredChallenge> {
    const wallet = this.state.wallets.find((item) => item.id === input.walletId);
    if (!wallet) {
      throw new DomainError(404, 'WALLET_ADDRESS_NOT_FOUND');
    }
    const challenge: StoredChallenge = {
      id: input.id,
      walletId: wallet.id,
      userId: wallet.userId,
      walletAddressUrl: wallet.walletAddressUrl,
      authServerUrl: wallet.authServerUrl,
      clientNonce: input.clientNonce,
      finishNonce: input.finishNonce,
      continueUri: input.continueUri,
      continueAccessToken: input.continueAccessToken,
      interactRedirectUri: input.interactRedirectUri,
      interactRef: null,
      receivedHash: null,
      status: 'PENDING_REDIRECT',
      expiresAt: input.expiresAt,
    };
    this.state.challenges.push(challenge);
    return { ...challenge };
  }

  async findChallengeById(challengeId: string): Promise<StoredChallenge | null> {
    const challenge = this.state.challenges.find((item) => item.id === challengeId);
    return challenge ? { ...challenge } : null;
  }

  async interactRefUsed(interactRef: string): Promise<boolean> {
    return this.state.challenges.some((item) => item.interactRef === interactRef);
  }

  async markChallengeFailed(challengeId: string, interactRef: string, receivedHash: string): Promise<void> {
    const challenge = this.state.challenges.find((item) => item.id === challengeId);
    if (!challenge || challenge.status !== 'PENDING_REDIRECT') return;
    challenge.status = 'FAILED';
    challenge.interactRef = interactRef;
    challenge.receivedHash = receivedHash;
  }

  async replaceWithVerifiedWallet(input: {
    userId: string;
    walletId: string;
    challengeId: string;
    interactRef: string;
    receivedHash: string;
    verifiedAt: Date;
  }): Promise<void> {
    const snapshot = structuredClone(this.state);
    try {
      if (this.abortNextReplacement) {
        this.abortNextReplacement = false;
        throw new Error('forced-abort');
      }
      if (this.state.challenges.some((item) => item.interactRef === input.interactRef)) {
        throw new DomainError(409, 'GNAP_INTERACT_ALREADY_USED');
      }
      for (const wallet of this.state.wallets) {
        if (wallet.userId === input.userId && wallet.isActive) {
          wallet.isActive = false;
        }
      }
      const next = this.state.wallets.find((wallet) => wallet.id === input.walletId && wallet.userId === input.userId);
      const challenge = this.state.challenges.find((item) => item.id === input.challengeId);
      if (!next || !challenge) {
        throw new Error('missing-row');
      }
      next.isActive = true;
      next.isVerified = true;
      next.verifiedAt = input.verifiedAt;
      challenge.status = 'VERIFIED';
      challenge.interactRef = input.interactRef;
      challenge.receivedHash = input.receivedHash;
    } catch (error) {
      this.state = snapshot;
      if (error instanceof DomainError) throw error;
      throw new DomainError(500, 'ACTIVE_WALLET_REPLACEMENT_ABORTED');
    }
  }
}
