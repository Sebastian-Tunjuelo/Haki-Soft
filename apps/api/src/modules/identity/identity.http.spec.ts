import { Controller, Post, UseGuards, type INestApplication } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AuthController } from './auth.controller';
import { DomainError } from './domain-error';
import { DomainExceptionFilter } from './domain-exception.filter';
import { MeController } from './identity.controller';
import { IdentityService } from './identity.service';
import { CLOCK, IDENTITY_REPOSITORY, WALLET_OWNERSHIP_GATEWAY } from './identity.tokens';
import type { Clock, WalletOwnershipGateway } from './identity.types';
import { MemoryIdentityRepository } from './memory-identity.repository';
import { SessionAuthGuard } from './session-auth.guard';
import { SystemClock } from './system-clock';
import { WalletCallbackController, WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { WalletVerifiedGuard } from './wallet-verified.guard';

/** Digests Base64 con padding (Rafiki) para client-nonce-fixed + finish-nonce-fixed + auth.example.test */
const HASH_OK = 'qGTLnLZ63o305Y2OVcIvdXJw96kSjJQ8dFtjGsH30N0=';
const HASH_TWO = 'W8lqyn1PG4SbgakzUBRkbYNN+DCCsRLjo7jAh7zJV2I=';
const HASH_ABORT = 'Ubl+AZGCGqAlbJl8WHLMZ9HG0aq5rKSg6HD0v7aQdyE=';
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

@Controller('commerce')
@UseGuards(SessionAuthGuard, WalletVerifiedGuard)
class CommerceProbeController {
  @Post('publish')
  publish(): { allowed: true } {
    return { allowed: true };
  }
}

describe('SPEC-02 backend identity', () => {
  let app: INestApplication;
  let token = '';
  const repository = new MemoryIdentityRepository();
  const gateway = new FakeWalletOwnershipGateway();
  const clock = new MutableClock();

  beforeAll(async () => {
    process.env.PUBLIC_API_URL = 'http://localhost:3001';
    const moduleRef = await Test.createTestingModule({
      controllers: [
        AuthController,
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
        SessionAuthGuard,
        { provide: CLOCK, useValue: clock },
        { provide: IDENTITY_REPOSITORY, useValue: repository },
        { provide: WALLET_OWNERSHIP_GATEWAY, useValue: gateway },
        { provide: APP_FILTER, useClass: DomainExceptionFilter },
      ],
    }).compile();

    app = moduleRef.createNestApplication({ rawBody: true });
    app.setGlobalPrefix('api/v1');
    app.useGlobalFilters(new DomainExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('registers a local buyer and rejects a duplicate or a bad password', async () => {
    const missing = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: 'ada@example.com', displayName: 'Ada' });
    expect(missing.status).toBe(400);
    expect(missing.body).toEqual({ code: 'AUTH_INPUT_INVALID' });
    expect(repository.userCount()).toBe(0);

    const first = await request(app.getHttpServer()).post('/api/v1/auth/register').send({
      email: 'Ada@Example.com',
      password: 'password-ada',
      displayName: 'Ada Lovelace',
      countryCode: 'co',
    });
    expect(first.status).toBe(201);
    expect(first.body.user).toMatchObject({
      email: 'ada@example.com',
      displayName: 'Ada Lovelace',
      countryCode: 'CO',
      activeMode: 'BUYER',
    });
    expect(first.body.user.passwordHash).toBeUndefined();
    expect(typeof first.body.token).toBe('string');
    token = first.body.token;

    const duplicate = await request(app.getHttpServer()).post('/api/v1/auth/register').send({
      email: 'ada@example.com',
      password: 'password-ada',
      displayName: 'Otra Ada',
    });
    expect(duplicate.status).toBe(409);
    expect(duplicate.body).toEqual({ code: 'EMAIL_ALREADY_REGISTERED' });
    expect(repository.userCount()).toBe(1);

    const badPassword = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'ada@example.com', password: 'not-the-password' });
    expect(badPassword.status).toBe(401);
    expect(badPassword.body).toEqual({ code: 'INVALID_CREDENTIALS' });

    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'ada@example.com', password: 'password-ada' });
    expect(login.status).toBe(200);
    expect(login.body.user.email).toBe('ada@example.com');
    token = login.body.token;
  });

  it('RF-02 persists Seller mode for the same user', async () => {
    const before = (await repository.findUserByEmail('ada@example.com'))?.user;
    const unauthenticated = await request(app.getHttpServer()).post('/api/v1/me/mode').send({ activeMode: 'SELLER' });
    expect(unauthenticated.status).toBe(401);
    expect(unauthenticated.body).toEqual({ code: 'UNAUTHENTICATED' });

    const switched = await request(app.getHttpServer())
      .post('/api/v1/me/mode')
      .set('Authorization', `Bearer ${token}`)
      .send({ activeMode: 'SELLER' });
    expect(switched.status).toBe(201);
    expect(switched.body).toEqual({ activeMode: 'SELLER' });

    const read = await request(app.getHttpServer()).get('/api/v1/me/mode').set('Authorization', `Bearer ${token}`);
    expect(read.status).toBe(200);
    expect(read.body).toEqual({ activeMode: 'SELLER' });
    const after = (await repository.findUserByEmail('ada@example.com'))?.user;
    expect(after?.id).toBe(before?.id);
  });

  it('RF-04 rejects a non-https wallet and stores discovery metadata', async () => {
    const invalid = await request(app.getHttpServer())
      .post('/api/v1/me/wallet/discovery')
      .set('Authorization', `Bearer ${token}`)
      .send({ walletAddress: 'http://ilp.interledger-test.dev/ada' });
    expect(invalid.status).toBe(400);
    expect(invalid.body).toEqual({ code: 'WALLET_ADDRESS_INVALID' });

    const discovered = await request(app.getHttpServer())
      .post('/api/v1/me/wallet/discovery')
      .set('Authorization', `Bearer ${token}`)
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
      .set('Authorization', `Bearer ${token}`);
    expect(blocked.status).toBe(403);
    expect(blocked.body).toEqual({ code: 'WALLET_NOT_VERIFIED' });
  });

  it('RF-05 fails the challenge on a bad hash and does not continue the grant', async () => {
    const started = await request(app.getHttpServer())
      .post('/api/v1/me/wallet/challenges')
      .set('Authorization', `Bearer ${token}`)
      .send({ walletAddress: WALLET_A });
    expect(started.status).toBe(201);
    expect(started.body.status).toBe('PENDING_REDIRECT');
    expect(JSON.stringify(started.body)).not.toContain('continue-token-secret');
    expect(JSON.stringify(started.body)).not.toContain('client-nonce-fixed');

    const again = await request(app.getHttpServer())
      .post('/api/v1/me/wallet/challenges')
      .set('Authorization', `Bearer ${token}`)
      .send({ walletAddress: WALLET_A });
    expect(again.status).toBe(409);
    expect(again.body).toEqual({ code: 'ACTIVE_WALLET_CHALLENGE_PENDING' });

    const mismatch = await request(app.getHttpServer()).get('/api/v1/auth/wallet/callback').query({
      challengeId: started.body.challengeId,
      interact_ref: 'interact-ref-bad',
      hash: '0'.repeat(64),
    });
    expect(mismatch.status).toBe(303);
    expect(String(mismatch.headers.location)).toContain('code=GNAP_HASH_MISMATCH');
    expect(gateway.continueCalls).toBe(0);
    expect(repository.walletsOf((await repository.findUserByEmail('ada@example.com'))!.user.id).some((wallet) => wallet.isVerified)).toBe(
      false,
    );
  });

  it('RF-05 and RF-06 verify one wallet and replace it with the next in one step', async () => {
    const user = (await repository.findUserByEmail('ada@example.com'))!.user;
    const failed = repository.walletsOf(user.id)[0];
    const restarted = await request(app.getHttpServer())
      .post('/api/v1/me/wallet/challenges')
      .set('Authorization', `Bearer ${token}`)
      .send({ walletAddress: WALLET_A });
    expect(restarted.status).toBe(201);

    const verified = await request(app.getHttpServer()).get('/api/v1/auth/wallet/callback').query({
      challengeId: restarted.body.challengeId,
      interact_ref: 'interact-ref-ok',
      hash: HASH_OK,
    });
    expect(verified.status).toBe(303);
    expect(String(verified.headers.location)).toContain('status=verified');
    expect(String(verified.headers.location)).toContain(encodeURIComponent(WALLET_A));
    expect(gateway.continueCalls).toBe(1);

    const allowed = await request(app.getHttpServer())
      .post('/api/v1/commerce/publish')
      .set('Authorization', `Bearer ${token}`);
    expect(allowed.status).toBe(201);
    expect(allowed.body).toEqual({ allowed: true });

    const reused = await request(app.getHttpServer()).get('/api/v1/auth/wallet/callback').query({
      challengeId: restarted.body.challengeId,
      interact_ref: 'interact-ref-ok',
      hash: HASH_OK,
    });
    expect(reused.status).toBe(303);
    expect(String(reused.headers.location)).toContain('code=GNAP_INTERACT_ALREADY_USED');

    await request(app.getHttpServer())
      .post('/api/v1/me/wallet/discovery')
      .set('Authorization', `Bearer ${token}`)
      .send({ walletAddress: WALLET_B })
      .expect(201);
    gateway.nextExpiresAt = new Date('2020-01-01T00:00:00.000Z');
    const expiring = await request(app.getHttpServer())
      .post('/api/v1/me/wallet/challenges')
      .set('Authorization', `Bearer ${token}`)
      .send({ walletAddress: WALLET_B });
    const expired = await request(app.getHttpServer()).get('/api/v1/auth/wallet/callback').query({
      challengeId: expiring.body.challengeId,
      interact_ref: 'interact-ref-expired',
      hash: HASH_TWO,
    });
    expect(expired.status).toBe(303);
    expect(String(expired.headers.location)).toContain('code=WALLET_CHALLENGE_EXPIRED');
    expect(repository.walletsOf(user.id).filter((wallet) => wallet.isActive)).toEqual([
      expect.objectContaining({ walletAddressUrl: WALLET_A, isVerified: true, isActive: true }),
    ]);

    gateway.nextExpiresAt = new Date('2030-01-01T00:00:00.000Z');
    const replacement = await request(app.getHttpServer())
      .post('/api/v1/me/wallet/challenges')
      .set('Authorization', `Bearer ${token}`)
      .send({ walletAddress: WALLET_B });
    const replaced = await request(app.getHttpServer()).get('/api/v1/auth/wallet/callback').query({
      challengeId: replacement.body.challengeId,
      interact_ref: 'interact-ref-two',
      hash: HASH_TWO,
    });
    expect(replaced.status).toBe(303);
    expect(String(replaced.headers.location)).toContain('status=verified');
    const active = repository.walletsOf(user.id).filter((wallet) => wallet.isActive);
    expect(active).toHaveLength(1);
    expect(active[0]?.walletAddressUrl).toBe(WALLET_B);
    expect(repository.walletsOf(user.id).find((wallet) => wallet.id === failed.id)?.isActive).toBe(false);

    repository.abortNextReplacement = true;
    const third = await request(app.getHttpServer())
      .post('/api/v1/me/wallet/discovery')
      .set('Authorization', `Bearer ${token}`)
      .send({ walletAddress: 'https://ilp.interledger-test.dev/rollback' });
    expect(third.status).toBe(201);
    const pendingRollback = await request(app.getHttpServer())
      .post('/api/v1/me/wallet/challenges')
      .set('Authorization', `Bearer ${token}`)
      .send({ walletAddress: 'https://ilp.interledger-test.dev/rollback' });
    const aborted = await request(app.getHttpServer()).get('/api/v1/auth/wallet/callback').query({
      challengeId: pendingRollback.body.challengeId,
      interact_ref: 'interact-ref-abort',
      hash: HASH_ABORT,
    });
    expect(aborted.status).toBe(303);
    expect(String(aborted.headers.location)).toContain('code=ACTIVE_WALLET_REPLACEMENT_ABORTED');
    expect(repository.walletsOf(user.id).filter((wallet) => wallet.isActive)).toEqual([
      expect.objectContaining({ walletAddressUrl: WALLET_B, isActive: true }),
    ]);
  });
});
