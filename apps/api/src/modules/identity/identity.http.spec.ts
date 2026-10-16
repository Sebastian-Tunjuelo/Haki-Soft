import { createHmac } from 'node:crypto';
import { Controller, Post, UseGuards, type CanActivate, type ExecutionContext, type INestApplication } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ClerkAuthGuard } from './clerk-auth.guard';
import { ClerkSvixWebhookVerifier } from './clerk-svix-webhook.verifier';
import { DomainError } from './domain-error';
import { DomainExceptionFilter } from './domain-exception.filter';
import { ClerkWebhookController, MeController } from './identity.controller';
import { IdentityService } from './identity.service';
import { CLOCK, CLERK_WEBHOOK_VERIFIER, IDENTITY_REPOSITORY, WALLET_OWNERSHIP_GATEWAY } from './identity.tokens';
import type { Clock, WalletOwnershipGateway } from './identity.types';
import { MemoryIdentityRepository } from './memory-identity.repository';
import { SystemClock } from './system-clock';
import { WalletCallbackController, WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { WalletVerifiedGuard } from './wallet-verified.guard';

const RAW_WEBHOOK_KEY = Buffer.from('taskstream-test-webhook-key');
const WEBHOOK_SECRET = `whsec_${RAW_WEBHOOK_KEY.toString('base64')}`;
const HASH_OK = 'a864cb9cb67ade8df4e58d8e55c22f757270f7a9128c943c745b631ac1f7d0dd';
const HASH_TWO = '5bc96aca7d4f1b849b81a9335014646d834df83082b112e3a3b8c087bcc95762';
const HASH_ABORT = '51b97e0191821aa0256c997c5872cc67d1c6d1aab9aca4a0e870f4bfb6907721';
const WALLET_A = 'https://ilp.interledger-test.dev/ada';
const WALLET_B = 'https://ilp.interledger-test.dev/grace';

class MutableClock implements Clock {
  current = new Date('2026-10-16T12:00:00.000Z');
  now(): Date {
    return this.current;
  }
}

class FakeWalletOwnershipGateway implements WalletOwnershipGateway {
  continueCalls = 0;
  missing = false;
  subjectOverride: string | null = null;
  nextExpiresAt = new Date('2030-01-01T00:00:00.000Z');

  async discover(walletAddress: string) {
    if (this.missing) {
      throw new DomainError(404, 'WALLET_ADDRESS_NOT_FOUND');
    }
    return {
      walletAddress,
      authServer: 'https://auth.example.test',
      resourceServer: 'https://ilp.example.test',
      assetCode: 'COP',
      assetScale: 2,
    };
  }

  async beginSubjectGrant() {
    return {
      clientNonce: 'client-nonce-fixed',
      finishNonce: 'finish-nonce-fixed',
      continueUri: 'https://auth.example.test/continue',
      continueAccessToken: 'continue-token-secret',
      interactRedirectUri: 'https://wallet.example.test/interact',
      expiresAt: this.nextExpiresAt,
    };
  }

  async continueSubjectGrant(input: { walletAddress: string }) {
    this.continueCalls += 1;
    return { subjectWalletAddress: this.subjectOverride ?? input.walletAddress };
  }
}

@Injectable()
class HeaderClerkAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<{ headers: Record<string, string | undefined>; clerkUserId?: string }>();
    const userId = req.headers['x-clerk-user-id'];
    if (!userId) {
      throw new DomainError(401, 'UNAUTHENTICATED');
    }
    req.clerkUserId = userId;
    return true;
  }
}

@Controller('commerce')
@UseGuards(ClerkAuthGuard, WalletVerifiedGuard)
class CommerceProbeController {
  @Post('publish')
  publish(): { allowed: true } {
    return { allowed: true };
  }
}

function clerkUserEvent(type: 'user.created' | 'user.updated', email = 'ada@example.com') {
  return {
    type,
    data: {
      id: 'user_ada',
      first_name: 'Ada',
      last_name: 'Lovelace',
      image_url: 'https://img.example/ada.png',
      primary_email_address_id: 'idn_1',
      email_addresses: [{ id: 'idn_1', email_address: email }],
      public_metadata: { countryCode: 'co' },
    },
  };
}

function signPayload(payload: string, key = RAW_WEBHOOK_KEY) {
  const id = 'msg_spec02';
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = createHmac('sha256', key).update(`${id}.${timestamp}.${payload}`).digest('base64');
  return {
    'svix-id': id,
    'svix-timestamp': timestamp,
    'svix-signature': `v1,${signature}`,
  };
}

describe('SPEC-02 backend identity', () => {
  let app: INestApplication;
  const repository = new MemoryIdentityRepository();
  const gateway = new FakeWalletOwnershipGateway();
  const clock = new MutableClock();

  beforeAll(async () => {
    process.env.CLERK_WEBHOOK_SIGNING_SECRET = WEBHOOK_SECRET;
    process.env.PUBLIC_API_URL = 'http://localhost:3001';
    const moduleRef = await Test.createTestingModule({
      controllers: [
        ClerkWebhookController,
        MeController,
        WalletController,
        WalletCallbackController,
        CommerceProbeController,
      ],
      providers: [
        IdentityService,
        WalletService,
        SystemClock,
        WalletVerifiedGuard,
        ClerkAuthGuard,
        { provide: CLOCK, useValue: clock },
        { provide: IDENTITY_REPOSITORY, useValue: repository },
        { provide: WALLET_OWNERSHIP_GATEWAY, useValue: gateway },
        { provide: CLERK_WEBHOOK_VERIFIER, useClass: ClerkSvixWebhookVerifier },
        { provide: APP_FILTER, useClass: DomainExceptionFilter },
      ],
    })
      .overrideGuard(ClerkAuthGuard)
      .useClass(HeaderClerkAuthGuard)
      .compile();

    app = moduleRef.createNestApplication({ rawBody: true });
    app.setGlobalPrefix('api/v1');
    app.useGlobalFilters(new DomainExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  async function postWebhook(payload: string, headers = signPayload(payload)) {
    return request(app.getHttpServer())
      .post('/api/v1/webhooks/clerk')
      .set('content-type', 'application/json')
      .set(headers)
      .send(payload);
  }

  it('RF-07 rejects an invalid Svix signature and writes nothing', async () => {
    const payload = JSON.stringify(clerkUserEvent('user.created'));
    const response = await postWebhook(payload, signPayload(payload, Buffer.from('wrong-webhook-key')));
    expect(response.status).toBe(401);
    expect(response.body).toEqual({ code: 'CLERK_WEBHOOK_INVALID_SIGNATURE' });
    expect(repository.userCount()).toBe(0);
  });

  it('RF-07 upserts a Clerk user as BUYER and stays idempotent', async () => {
    const created = JSON.stringify(clerkUserEvent('user.created'));
    const first = await postWebhook(created);
    expect(first.status).toBe(200);
    expect(first.body).toEqual({ code: 'CLERK_USER_SYNCED', clerkId: 'user_ada', activeMode: 'BUYER' });

    const updated = JSON.stringify(clerkUserEvent('user.updated', 'ada.updated@example.com'));
    const second = await postWebhook(updated);
    expect(second.status).toBe(200);
    expect(second.body).toEqual({ code: 'CLERK_USER_ALREADY_SYNCED', clerkId: 'user_ada' });
    expect(repository.userCount()).toBe(1);
    const user = await repository.findUserByClerkId('user_ada');
    expect(user?.email).toBe('ada.updated@example.com');
    expect(user?.countryCode).toBe('CO');
    expect(user?.activeMode).toBe('BUYER');
  });

  it('RF-02 persists Seller mode for the same user', async () => {
    const before = await repository.findUserByClerkId('user_ada');
    const unauthenticated = await request(app.getHttpServer()).post('/api/v1/me/mode').send({ activeMode: 'SELLER' });
    expect(unauthenticated.status).toBe(401);
    expect(unauthenticated.body).toEqual({ code: 'UNAUTHENTICATED' });

    const switched = await request(app.getHttpServer())
      .post('/api/v1/me/mode')
      .set('x-clerk-user-id', 'user_ada')
      .send({ activeMode: 'SELLER' });
    expect(switched.status).toBe(201);
    expect(switched.body).toEqual({ activeMode: 'SELLER' });

    const read = await request(app.getHttpServer()).get('/api/v1/me/mode').set('x-clerk-user-id', 'user_ada');
    expect(read.status).toBe(200);
    expect(read.body).toEqual({ activeMode: 'SELLER' });
    const after = await repository.findUserByClerkId('user_ada');
    expect(after?.id).toBe(before?.id);
  });

  it('RF-04 rejects a non-https wallet and stores discovery metadata', async () => {
    const invalid = await request(app.getHttpServer())
      .post('/api/v1/me/wallet/discovery')
      .set('x-clerk-user-id', 'user_ada')
      .send({ walletAddress: 'http://ilp.interledger-test.dev/ada' });
    expect(invalid.status).toBe(400);
    expect(invalid.body).toEqual({ code: 'WALLET_ADDRESS_INVALID' });

    const discovered = await request(app.getHttpServer())
      .post('/api/v1/me/wallet/discovery')
      .set('x-clerk-user-id', 'user_ada')
      .send({ walletAddress: WALLET_A });
    expect(discovered.status).toBe(201);
    expect(discovered.body).toEqual({
      walletAddress: WALLET_A,
      authServer: 'https://auth.example.test',
      resourceServer: 'https://ilp.example.test',
      assetCode: 'COP',
      assetScale: 2,
    });
  });

  it('RF-08 blocks publish until a wallet is verified and active', async () => {
    const blocked = await request(app.getHttpServer())
      .post('/api/v1/commerce/publish')
      .set('x-clerk-user-id', 'user_ada');
    expect(blocked.status).toBe(403);
    expect(blocked.body).toEqual({ code: 'WALLET_NOT_VERIFIED' });
  });

  it('RF-05 fails the challenge on a bad hash and does not continue the grant', async () => {
    const started = await request(app.getHttpServer())
      .post('/api/v1/me/wallet/challenges')
      .set('x-clerk-user-id', 'user_ada')
      .send({ walletAddress: WALLET_A });
    expect(started.status).toBe(201);
    expect(started.body.status).toBe('PENDING_REDIRECT');
    expect(JSON.stringify(started.body)).not.toContain('continue-token-secret');
    expect(JSON.stringify(started.body)).not.toContain('client-nonce-fixed');

    const again = await request(app.getHttpServer())
      .post('/api/v1/me/wallet/challenges')
      .set('x-clerk-user-id', 'user_ada')
      .send({ walletAddress: WALLET_A });
    expect(again.status).toBe(409);
    expect(again.body).toEqual({ code: 'ACTIVE_WALLET_CHALLENGE_PENDING' });

    const mismatch = await request(app.getHttpServer()).get('/api/v1/auth/wallet/callback').query({
      challengeId: started.body.challengeId,
      interact_ref: 'interact-ref-bad',
      hash: '0'.repeat(64),
    });
    expect(mismatch.status).toBe(400);
    expect(mismatch.body).toEqual({ code: 'GNAP_HASH_MISMATCH' });
    expect(gateway.continueCalls).toBe(0);
    expect(repository.walletsOf((await repository.findUserByClerkId('user_ada'))!.id).some((wallet) => wallet.isVerified)).toBe(
      false,
    );
  });

  it('RF-05 and RF-06 verify one wallet and replace it with the next in one step', async () => {
    const user = (await repository.findUserByClerkId('user_ada'))!;
    const failed = repository.walletsOf(user.id)[0];
    const restarted = await request(app.getHttpServer())
      .post('/api/v1/me/wallet/challenges')
      .set('x-clerk-user-id', 'user_ada')
      .send({ walletAddress: WALLET_A });
    expect(restarted.status).toBe(201);

    const verified = await request(app.getHttpServer()).get('/api/v1/auth/wallet/callback').query({
      challengeId: restarted.body.challengeId,
      interact_ref: 'interact-ref-ok',
      hash: HASH_OK,
    });
    expect(verified.status).toBe(200);
    expect(verified.body).toEqual({ status: 'VERIFIED', walletAddress: WALLET_A });
    expect(gateway.continueCalls).toBe(1);

    const allowed = await request(app.getHttpServer())
      .post('/api/v1/commerce/publish')
      .set('x-clerk-user-id', 'user_ada');
    expect(allowed.status).toBe(201);
    expect(allowed.body).toEqual({ allowed: true });

    const reused = await request(app.getHttpServer()).get('/api/v1/auth/wallet/callback').query({
      challengeId: restarted.body.challengeId,
      interact_ref: 'interact-ref-ok',
      hash: HASH_OK,
    });
    expect(reused.status).toBe(409);
    expect(reused.body).toEqual({ code: 'GNAP_INTERACT_ALREADY_USED' });

    await request(app.getHttpServer())
      .post('/api/v1/me/wallet/discovery')
      .set('x-clerk-user-id', 'user_ada')
      .send({ walletAddress: WALLET_B })
      .expect(201);
    gateway.nextExpiresAt = new Date('2020-01-01T00:00:00.000Z');
    const expiring = await request(app.getHttpServer())
      .post('/api/v1/me/wallet/challenges')
      .set('x-clerk-user-id', 'user_ada')
      .send({ walletAddress: WALLET_B });
    const expired = await request(app.getHttpServer()).get('/api/v1/auth/wallet/callback').query({
      challengeId: expiring.body.challengeId,
      interact_ref: 'interact-ref-expired',
      hash: HASH_TWO,
    });
    expect(expired.status).toBe(410);
    expect(expired.body).toEqual({ code: 'WALLET_CHALLENGE_EXPIRED' });
    expect(repository.walletsOf(user.id).filter((wallet) => wallet.isActive)).toEqual([
      expect.objectContaining({ walletAddressUrl: WALLET_A, isVerified: true, isActive: true }),
    ]);

    gateway.nextExpiresAt = new Date('2030-01-01T00:00:00.000Z');
    const replacement = await request(app.getHttpServer())
      .post('/api/v1/me/wallet/challenges')
      .set('x-clerk-user-id', 'user_ada')
      .send({ walletAddress: WALLET_B });
    const replaced = await request(app.getHttpServer()).get('/api/v1/auth/wallet/callback').query({
      challengeId: replacement.body.challengeId,
      interact_ref: 'interact-ref-two',
      hash: HASH_TWO,
    });
    expect(replaced.status).toBe(200);
    const active = repository.walletsOf(user.id).filter((wallet) => wallet.isActive);
    expect(active).toHaveLength(1);
    expect(active[0]?.walletAddressUrl).toBe(WALLET_B);
    expect(repository.walletsOf(user.id).find((wallet) => wallet.id === failed.id)?.isActive).toBe(false);

    repository.abortNextReplacement = true;
    const third = await request(app.getHttpServer())
      .post('/api/v1/me/wallet/discovery')
      .set('x-clerk-user-id', 'user_ada')
      .send({ walletAddress: 'https://ilp.interledger-test.dev/rollback' });
    expect(third.status).toBe(201);
    const pendingRollback = await request(app.getHttpServer())
      .post('/api/v1/me/wallet/challenges')
      .set('x-clerk-user-id', 'user_ada')
      .send({ walletAddress: 'https://ilp.interledger-test.dev/rollback' });
    const aborted = await request(app.getHttpServer()).get('/api/v1/auth/wallet/callback').query({
      challengeId: pendingRollback.body.challengeId,
      interact_ref: 'interact-ref-abort',
      hash: HASH_ABORT,
    });
    expect(aborted.status).toBe(500);
    expect(aborted.body).toEqual({ code: 'ACTIVE_WALLET_REPLACEMENT_ABORTED' });
    expect(repository.walletsOf(user.id).filter((wallet) => wallet.isActive)).toEqual([
      expect.objectContaining({ walletAddressUrl: WALLET_B, isActive: true }),
    ]);
  });
});
