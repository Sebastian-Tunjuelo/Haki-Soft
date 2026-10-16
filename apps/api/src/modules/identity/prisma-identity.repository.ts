import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DomainError } from './domain-error';
import type {
  ActiveMode,
  ClerkUserSyncInput,
  IdentityRepository,
  StoredChallenge,
  StoredUser,
  StoredWallet,
} from './identity.types';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PrismaIdentityRepository implements IdentityRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async upsertClerkUser(input: ClerkUserSyncInput): Promise<{ user: StoredUser; created: boolean }> {
    const db = this.db();
    try {
      const existing = await db.user.findUnique({ where: { clerkId: input.clerkId } });
      if (!existing) {
        const created = await db.user.create({
          data: {
            clerkId: input.clerkId,
            email: input.email,
            displayName: input.displayName,
            avatarUrl: input.avatarUrl,
            countryCode: input.countryCode ?? 'ZZ',
            activeMode: 'BUYER',
          },
        });
        return { user: this.toUser(created), created: true };
      }
      const updated = await db.user.update({
        where: { clerkId: input.clerkId },
        data: {
          email: input.email,
          displayName: input.displayName,
          avatarUrl: input.avatarUrl,
          ...(input.countryCode ? { countryCode: input.countryCode } : {}),
        },
      });
      return { user: this.toUser(updated), created: false };
    } catch (error) {
      this.rethrowEmailConflict(error);
    }
  }

  async findUserByClerkId(clerkId: string): Promise<StoredUser | null> {
    const user = await this.db().user.findUnique({ where: { clerkId } });
    return user ? this.toUser(user) : null;
  }

  async setActiveMode(clerkId: string, activeMode: ActiveMode): Promise<StoredUser | null> {
    const db = this.db();
    const existing = await db.user.findUnique({ where: { clerkId } });
    if (!existing) return null;
    const updated = await db.user.update({ where: { clerkId }, data: { activeMode } });
    return this.toUser(updated);
  }

  async findActiveWallet(userId: string): Promise<StoredWallet | null> {
    const wallet = await this.db().userWallet.findFirst({ where: { userId, isActive: true } });
    return wallet ? this.toWallet(wallet) : null;
  }

  async hasVerifiedActiveWallet(userId: string): Promise<boolean> {
    const wallet = await this.db().userWallet.findFirst({
      where: { userId, isActive: true, isVerified: true },
      select: { id: true },
    });
    return wallet !== null;
  }

  async saveDiscoveredWallet(input: {
    userId: string;
    walletAddressUrl: string;
    assetCode: string;
    assetScale: number;
    authServerUrl: string;
    resourceServerUrl: string;
  }): Promise<{ ok: true; wallet: StoredWallet } | { ok: false; reason: 'WALLET_ADDRESS_IN_USE' }> {
    const db = this.db();
    const existing = await db.userWallet.findUnique({ where: { walletAddressUrl: input.walletAddressUrl } });
    if (existing && existing.userId !== input.userId) {
      return { ok: false, reason: 'WALLET_ADDRESS_IN_USE' };
    }
    if (existing) {
      const updated = await db.userWallet.update({
        where: { id: existing.id },
        data: {
          assetCode: input.assetCode,
          assetScale: input.assetScale,
          authServerUrl: input.authServerUrl,
          resourceServerUrl: input.resourceServerUrl,
        },
      });
      return { ok: true, wallet: this.toWallet(updated) };
    }
    const created = await db.userWallet.create({
      data: {
        userId: input.userId,
        walletAddressUrl: input.walletAddressUrl,
        assetCode: input.assetCode,
        assetScale: input.assetScale,
        authServerUrl: input.authServerUrl,
        resourceServerUrl: input.resourceServerUrl,
        isVerified: false,
        isActive: false,
      },
    });
    return { ok: true, wallet: this.toWallet(created) };
  }

  async findWalletByUserAndUrl(userId: string, walletAddressUrl: string): Promise<StoredWallet | null> {
    const wallet = await this.db().userWallet.findFirst({ where: { userId, walletAddressUrl } });
    return wallet ? this.toWallet(wallet) : null;
  }

  async findOpenChallenge(userId: string): Promise<StoredChallenge | null> {
    const challenge = await this.db().walletVerificationChallenge.findFirst({
      where: { status: 'PENDING_REDIRECT', wallet: { userId } },
      include: { wallet: true },
      orderBy: { createdAt: 'desc' },
    });
    return challenge ? this.toChallenge(challenge) : null;
  }

  async expireChallenge(challengeId: string): Promise<void> {
    await this.db().walletVerificationChallenge.updateMany({
      where: { id: challengeId, status: 'PENDING_REDIRECT' },
      data: { status: 'EXPIRED' },
    });
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
    const challenge = await this.db().walletVerificationChallenge.create({
      data: {
        id: input.id,
        walletId: input.walletId,
        clientNonce: input.clientNonce,
        finishNonce: input.finishNonce,
        continueUri: input.continueUri,
        continueAccessToken: input.continueAccessToken,
        interactRedirectUri: input.interactRedirectUri,
        expiresAt: input.expiresAt,
        status: 'PENDING_REDIRECT',
      },
      include: { wallet: true },
    });
    return this.toChallenge(challenge);
  }

  async findChallengeById(challengeId: string): Promise<StoredChallenge | null> {
    const challenge = await this.db().walletVerificationChallenge.findUnique({
      where: { id: challengeId },
      include: { wallet: true },
    });
    return challenge ? this.toChallenge(challenge) : null;
  }

  async interactRefUsed(interactRef: string): Promise<boolean> {
    const existing = await this.db().walletVerificationChallenge.findFirst({
      where: { interactRef },
      select: { id: true },
    });
    return existing !== null;
  }

  async markChallengeFailed(challengeId: string, interactRef: string, receivedHash: string): Promise<void> {
    await this.db().walletVerificationChallenge.updateMany({
      where: { id: challengeId, status: 'PENDING_REDIRECT' },
      data: { status: 'FAILED', interactRef, receivedHash, completedAt: new Date() },
    });
  }

  async replaceWithVerifiedWallet(input: {
    userId: string;
    walletId: string;
    challengeId: string;
    interactRef: string;
    receivedHash: string;
    verifiedAt: Date;
  }): Promise<void> {
    const db = this.db();
    try {
      await db.$transaction(async (tx) => {
        const used = await tx.walletVerificationChallenge.findFirst({
          where: { interactRef: input.interactRef },
          select: { id: true },
        });
        if (used) {
          throw new DomainError(409, 'GNAP_INTERACT_ALREADY_USED');
        }
        await tx.userWallet.updateMany({
          where: { userId: input.userId, isActive: true },
          data: { isActive: false },
        });
        await tx.userWallet.update({
          where: { id: input.walletId },
          data: { isActive: true, isVerified: true, verifiedAt: input.verifiedAt },
        });
        await tx.walletVerificationChallenge.update({
          where: { id: input.challengeId },
          data: {
            status: 'VERIFIED',
            interactRef: input.interactRef,
            receivedHash: input.receivedHash,
            completedAt: input.verifiedAt,
          },
        });
      });
    } catch (error) {
      if (error instanceof DomainError) throw error;
      throw new DomainError(500, 'ACTIVE_WALLET_REPLACEMENT_ABORTED');
    }
  }

  private db() {
    const client = this.prisma.client;
    if (!client) {
      throw new DomainError(503, 'DATABASE_NOT_CONFIGURED');
    }
    return client;
  }

  private rethrowEmailConflict(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new DomainError(409, 'CLERK_EMAIL_CONFLICT');
    }
    throw error;
  }

  private toUser(user: {
    id: string;
    clerkId: string;
    email: string;
    displayName: string;
    avatarUrl: string | null;
    countryCode: string;
    activeMode: ActiveMode;
  }): StoredUser {
    return {
      id: user.id,
      clerkId: user.clerkId,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      countryCode: user.countryCode.trim(),
      activeMode: user.activeMode,
    };
  }

  private toWallet(wallet: {
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
  }): StoredWallet {
    return {
      id: wallet.id,
      userId: wallet.userId,
      walletAddressUrl: wallet.walletAddressUrl,
      assetCode: wallet.assetCode,
      assetScale: wallet.assetScale,
      authServerUrl: wallet.authServerUrl,
      resourceServerUrl: wallet.resourceServerUrl,
      isVerified: wallet.isVerified,
      isActive: wallet.isActive,
      verifiedAt: wallet.verifiedAt,
    };
  }

  private toChallenge(challenge: {
    id: string;
    walletId: string;
    clientNonce: string;
    finishNonce: string;
    continueUri: string;
    continueAccessToken: string;
    interactRedirectUri: string;
    interactRef: string | null;
    receivedHash: string | null;
    status: StoredChallenge['status'];
    expiresAt: Date;
    wallet: { userId: string; walletAddressUrl: string; authServerUrl: string };
  }): StoredChallenge {
    return {
      id: challenge.id,
      walletId: challenge.walletId,
      userId: challenge.wallet.userId,
      walletAddressUrl: challenge.wallet.walletAddressUrl,
      authServerUrl: challenge.wallet.authServerUrl,
      clientNonce: challenge.clientNonce,
      finishNonce: challenge.finishNonce,
      continueUri: challenge.continueUri,
      continueAccessToken: challenge.continueAccessToken,
      interactRedirectUri: challenge.interactRedirectUri,
      interactRef: challenge.interactRef,
      receivedHash: challenge.receivedHash,
      status: challenge.status,
      expiresAt: challenge.expiresAt,
    };
  }
}
