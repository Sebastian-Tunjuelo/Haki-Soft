import { randomUUID, timingSafeEqual } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { gnapInteractHash, WalletLinkRequestSchema } from '@taskstream/shared-schemas';
import { DomainError } from './domain-error';
import { CLOCK, IDENTITY_REPOSITORY, WALLET_OWNERSHIP_GATEWAY } from './identity.tokens';
import type { Clock, IdentityRepository, WalletOwnershipGateway } from './identity.types';
import { IdentityService } from './identity.service';

@Injectable()
export class WalletService {
  constructor(
    @Inject(IDENTITY_REPOSITORY) private readonly repository: IdentityRepository,
    @Inject(WALLET_OWNERSHIP_GATEWAY) private readonly gateway: WalletOwnershipGateway,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(IdentityService) private readonly identity: IdentityService,
  ) {}

  async discover(userId: string, body: unknown) {
    const walletAddress = this.parseWalletAddress(body);
    const user = await this.identity.requireUser(userId);
    const discovered = await this.gateway.discover(walletAddress);
    const saved = await this.repository.saveDiscoveredWallet({
      userId: user.id,
      walletAddressUrl: walletAddress,
      assetCode: discovered.assetCode,
      assetScale: discovered.assetScale,
      authServerUrl: discovered.authServer,
      resourceServerUrl: discovered.resourceServer,
    });
    if (!saved.ok) {
      throw new DomainError(409, 'WALLET_ADDRESS_IN_USE');
    }
    return {
      walletAddress: saved.wallet.walletAddressUrl,
      authServer: saved.wallet.authServerUrl,
      resourceServer: saved.wallet.resourceServerUrl,
      assetCode: saved.wallet.assetCode,
      assetScale: saved.wallet.assetScale,
    };
  }

  async startChallenge(userId: string, body: unknown) {
    const walletAddress = this.parseWalletAddress(body);
    const user = await this.identity.requireUser(userId);
    const pending = await this.repository.findOpenChallenge(user.id);
    if (pending) {
      if (pending.expiresAt.getTime() <= this.clock.now().getTime()) {
        await this.repository.expireChallenge(pending.id);
      } else {
        throw new DomainError(409, 'ACTIVE_WALLET_CHALLENGE_PENDING');
      }
    }
    const wallet = await this.repository.findWalletByUserAndUrl(user.id, walletAddress);
    if (!wallet) {
      throw new DomainError(404, 'WALLET_ADDRESS_NOT_FOUND');
    }
    const challengeId = randomUUID();
    const session = await this.gateway.beginSubjectGrant({
      walletAddress: wallet.walletAddressUrl,
      authServer: wallet.authServerUrl,
      callbackUrl: `${publicApiUrl()}/api/v1/auth/wallet/callback?challengeId=${challengeId}`,
    });
    await this.repository.insertChallenge({
      id: challengeId,
      walletId: wallet.id,
      clientNonce: session.clientNonce,
      finishNonce: session.finishNonce,
      continueUri: session.continueUri,
      continueAccessToken: session.continueAccessToken,
      interactRedirectUri: session.interactRedirectUri,
      expiresAt: session.expiresAt,
    });
    return {
      challengeId,
      interactRedirectUri: session.interactRedirectUri,
      status: 'PENDING_REDIRECT' as const,
    };
  }

  async readActive(userId: string) {
    const user = await this.identity.requireUser(userId);
    const wallet = await this.repository.findActiveWallet(user.id);
    if (!wallet) return { wallet: null };
    return {
      wallet: {
        walletAddress: wallet.walletAddressUrl,
        assetCode: wallet.assetCode,
        assetScale: wallet.assetScale,
        isVerified: wallet.isVerified,
        isActive: wallet.isActive,
        demoBalanceUSDInCents: wallet.demoBalanceUSDInCents,
      },
    };
  }

  async completeCallback(query: Record<string, unknown>) {
    const challengeId = typeof query.challengeId === 'string' ? query.challengeId : '';
    const interactRef = typeof query.interact_ref === 'string' ? query.interact_ref : '';
    const receivedHash = typeof query.hash === 'string' ? query.hash : '';
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(challengeId) || !interactRef || !receivedHash) {
      throw new DomainError(400, 'WALLET_CALLBACK_QUERY_INVALID');
    }
    const challenge = await this.repository.findChallengeById(challengeId);
    if (!challenge) {
      throw new DomainError(404, 'WALLET_CHALLENGE_NOT_FOUND');
    }
    if (challenge.status !== 'PENDING_REDIRECT' || challenge.interactRef) {
      throw new DomainError(409, 'GNAP_INTERACT_ALREADY_USED');
    }
    if (challenge.expiresAt.getTime() <= this.clock.now().getTime()) {
      await this.repository.expireChallenge(challenge.id);
      throw new DomainError(410, 'WALLET_CHALLENGE_EXPIRED');
    }
    if (await this.repository.interactRefUsed(interactRef)) {
      throw new DomainError(409, 'GNAP_INTERACT_ALREADY_USED');
    }
    const expected = gnapInteractHash({
      clientNonce: challenge.clientNonce,
      finishNonce: challenge.finishNonce,
      interactRef,
      authServerUrl: challenge.authServerUrl,
    });
    if (!hashesMatch(expected, receivedHash)) {
      await this.repository.markChallengeFailed(challenge.id, interactRef, receivedHash);
      throw new DomainError(400, 'GNAP_HASH_MISMATCH');
    }
    let continued: { subjectWalletAddress: string };
    try {
      continued = await this.gateway.continueSubjectGrant({
        continueUri: challenge.continueUri,
        continueAccessToken: challenge.continueAccessToken,
        interactRef,
        walletAddress: challenge.walletAddressUrl,
      });
    } catch (error) {
      if (error instanceof DomainError && error.code === 'GNAP_SUBJECT_NOT_CONFIRMED') {
        await this.repository.markChallengeFailed(challenge.id, interactRef, receivedHash);
      }
      throw error;
    }
    if (continued.subjectWalletAddress !== challenge.walletAddressUrl) {
      await this.repository.markChallengeFailed(challenge.id, interactRef, receivedHash);
      throw new DomainError(400, 'GNAP_SUBJECT_NOT_CONFIRMED');
    }
    await this.repository.replaceWithVerifiedWallet({
      userId: challenge.userId,
      walletId: challenge.walletId,
      challengeId: challenge.id,
      interactRef,
      receivedHash,
      verifiedAt: this.clock.now(),
    });
    return { status: 'VERIFIED' as const, walletAddress: challenge.walletAddressUrl };
  }

  private parseWalletAddress(body: unknown): string {
    const parsed = WalletLinkRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new DomainError(400, 'WALLET_ADDRESS_INVALID');
    }
    return parsed.data.walletAddress;
  }
}

function publicApiUrl(): string {
  return (process.env.PUBLIC_API_URL ?? 'http://localhost:3001').replace(/\/$/, '');
}

/**
 * Rafiki mete el hash en query string. Algunos parsers tratan `+` como espacio;
 * restauramos `+` antes de comparar. Base64 es case-sensitive.
 */
function normalizeReceivedGnapHash(value: string): string {
  return value.replace(/ /g, '+');
}

function hashesMatch(expected: string, received: string): boolean {
  const left = Buffer.from(expected);
  const right = Buffer.from(normalizeReceivedGnapHash(received));
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}
