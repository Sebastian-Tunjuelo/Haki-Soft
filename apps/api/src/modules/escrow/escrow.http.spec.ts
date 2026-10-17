import { randomUUID } from 'node:crypto';
import { type INestApplication } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { escrowLockIdempotencyKey } from '@taskstream/shared-schemas';
import { AuthController } from '../identity/auth.controller';
import { DomainExceptionFilter } from '../identity/domain-exception.filter';
import { IdentityService } from '../identity/identity.service';
import { CLOCK, IDENTITY_REPOSITORY, WALLET_OWNERSHIP_GATEWAY } from '../identity/identity.tokens';
import type { Clock, WalletOwnershipGateway } from '../identity/identity.types';
import { MemoryIdentityRepository } from '../identity/memory-identity.repository';
import { SessionAuthGuard } from '../identity/session-auth.guard';
import { SystemClock } from '../identity/system-clock';
import { WalletCallbackController, WalletController } from '../identity/wallet.controller';
import { WalletService } from '../identity/wallet.service';
import { WalletVerifiedGuard } from '../identity/wallet-verified.guard';
import { PrismaService } from '../../prisma/prisma.service';
import { EscrowController } from './escrow.controller';
import { EscrowService } from './escrow.service';
import { ESCROW_PAYMENT_GATEWAY, ESCROW_REPOSITORY } from './escrow.tokens';
import { MemoryEscrowRepository } from './memory-escrow.repository';
import { OrderWorkspaceService } from './order-workspace.service';
import { SellerNotificationHub } from './seller-notification.hub';
import { SimulatedEscrowPaymentGateway } from './simulated-escrow-payment.gateway';

const WALLET_A = 'https://ilp.interledger-test.dev/buyer-escrow';
const HASH_OK = 'qGTLnLZ63o305Y2OVcIvdXJw96kSjJQ8dFtjGsH30N0=';

class MutableClock implements Clock {
  current = new Date('2026-10-17T12:00:00.000Z');
  now(): Date {
    return this.current;
  }
}

class FakeWalletOwnershipGateway implements WalletOwnershipGateway {
  async discover(walletAddress: string) {
    return {
      walletAddress,
      authServer: 'https://auth.example.test',
      resourceServer: 'https://ilp.example.test',
      assetCode: 'USD',
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
      expiresAt: new Date('2030-01-01T00:00:00.000Z'),
    };
  }
  async continueSubjectGrant(input: { walletAddress: string }) {
    return { subjectWalletAddress: input.walletAddress };
  }
}

describe('SPEC-06 escrow HTTP', () => {
  let app: INestApplication;
  let identityRepo: MemoryIdentityRepository;
  let escrowRepo: MemoryEscrowRepository;
  let buyerToken = '';
  let buyerUserId = '';
  let sellerUserId = '';
  let taskId = '';

  beforeAll(async () => {
    process.env.PUBLIC_API_URL = 'http://localhost:3001';
    process.env.PUBLIC_WEB_URL = 'http://localhost:3000';
    process.env.AUTH_SESSION_SECRET = 'test-session-secret-spec-06';
    delete process.env.RAFIKI_WEBHOOK_SHARED_SECRET;

    identityRepo = new MemoryIdentityRepository();
    escrowRepo = new MemoryEscrowRepository();
    const gateway = new FakeWalletOwnershipGateway();
    const clock = new MutableClock();

    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController, WalletController, WalletCallbackController, EscrowController],
      providers: [
        IdentityService,
        WalletService,
        SystemClock,
        WalletVerifiedGuard,
        SessionAuthGuard,
        EscrowService,
        OrderWorkspaceService,
        SellerNotificationHub,
        SimulatedEscrowPaymentGateway,
        { provide: CLOCK, useValue: clock },
        { provide: IDENTITY_REPOSITORY, useValue: identityRepo },
        { provide: WALLET_OWNERSHIP_GATEWAY, useValue: gateway },
        { provide: ESCROW_REPOSITORY, useValue: escrowRepo },
        { provide: ESCROW_PAYMENT_GATEWAY, useClass: SimulatedEscrowPaymentGateway },
        { provide: PrismaService, useValue: { client: null } },
        { provide: APP_FILTER, useClass: DomainExceptionFilter },
      ],
    }).compile();

    app = moduleRef.createNestApplication({ rawBody: true });
    app.setGlobalPrefix('api/v1');
    app.useGlobalFilters(new DomainExceptionFilter());
    await app.init();

    const buyer = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: 'buyer-escrow@example.test', password: 'password-ok', displayName: 'Buyer Escrow' })
      .expect(201);
    buyerToken = buyer.body.token;
    buyerUserId = buyer.body.user.id;

    await request(app.getHttpServer())
      .post('/api/v1/me/wallet/discovery')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ walletAddress: WALLET_A })
      .expect(201);
    const challenge = await request(app.getHttpServer())
      .post('/api/v1/me/wallet/challenges')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ walletAddress: WALLET_A })
      .expect(201);
    await request(app.getHttpServer())
      .get('/api/v1/auth/wallet/callback')
      .query({
        challengeId: challenge.body.challengeId,
        interact_ref: 'interact-ref-ok',
        hash: HASH_OK,
      })
      .expect(303);

    const seller = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: 'seller-escrow@example.test', password: 'password-ok', displayName: 'Seller Escrow' })
      .expect(201);
    sellerUserId = seller.body.user.id;
  });

  beforeEach(async () => {
    escrowRepo.reset();
    taskId = randomUUID();
    await escrowRepo.seedPendingOrderForTest!({
      taskId,
      buyerId: buyerUserId,
      sellerId: sellerUserId,
      title: 'Orden escrow test',
      scopeDescription: 'Scope de prueba\n\nBrief del Buyer:\nNecesito el trabajo pronto.',
      lifecycleStatus: 'PENDING_ESCROW_FUNDING',
      totalAmountUSDInCents: 15_000,
      freelancerPayoutUSDInCents: 14_400,
      platformFeeUSDInCents: 600,
      ledgerId: randomUUID(),
      ledgerStatus: 'AWAITING_FUNDS',
      sellerConfirmedAt: new Date(),
      createdAt: new Date(),
      initialDeliveryDays: 7,
      fundsLockedAt: null,
      buyerDisplayName: 'Buyer Test',
      sellerDisplayName: 'Seller Test',
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('RF-01: fondeo con seller confirmado bloquea escrow al instante; webhook repetido es 204', async () => {
    const funded = await request(app.getHttpServer())
      .post(`/api/v1/orders/${taskId}/escrow/fund`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .expect(202);

    expect(funded.body.lifecycleStatus).toBe('ESCROW_LOCKED');
    expect(funded.body.totalAmountUSDInCents).toBe(15_000);
    expect(funded.body.platformFeeUSDInCents).toBe(600);
    expect(funded.body.freelancerPayoutUSDInCents).toBe(14_400);

    const lock = await escrowRepo.findLatestLockTx(taskId);
    expect(lock?.idempotencyKey).toBe(escrowLockIdempotencyKey(taskId, 1));
    expect(lock?.status).toBe('COMPLETED');

    const eventId = randomUUID();
    await request(app.getHttpServer())
      .post('/api/v1/webhooks/rafiki')
      .send({
        eventId,
        eventType: 'incoming_payment.completed',
        taskId,
        idempotencyKey: lock!.idempotencyKey,
      })
      .expect(204);

    const view = await request(app.getHttpServer())
      .get(`/api/v1/orders/${taskId}/escrow`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .expect(200);
    expect(view.body.lifecycleStatus).toBe('ESCROW_LOCKED');
    expect(view.body.ledgerStatus).toBe('FUNDS_LOCKED');

    await request(app.getHttpServer())
      .post('/api/v1/webhooks/rafiki')
      .send({
        eventId,
        eventType: 'incoming_payment.completed',
        taskId,
        idempotencyKey: lock!.idempotencyKey,
      })
      .expect(204);

    const again = await request(app.getHttpServer())
      .post(`/api/v1/orders/${taskId}/escrow/fund`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .expect(202);
    expect(again.body.lifecycleStatus).toBe('ESCROW_LOCKED');
  });

  it('RF-02 / RF-03 (simulado): release 96/4 y refund 100 desde ESCROW_LOCKED', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/orders/${taskId}/escrow/fund`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .expect(202);

    const released = await request(app.getHttpServer())
      .post(`/api/v1/orders/${taskId}/escrow/simulate-release`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .expect(201);
    expect(released.body.lifecycleStatus).toBe('COMPLETED');
    expect(released.body.ledgerStatus).toBe('RELEASED_96_4');
  });

  it('RF-03 (simulado): reembolso 100 % deja REFUNDED', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/orders/${taskId}/escrow/fund`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .expect(202);

    const refunded = await request(app.getHttpServer())
      .post(`/api/v1/orders/${taskId}/escrow/simulate-refund`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .expect(201);
    expect(refunded.body.lifecycleStatus).toBe('REFUNDED');
    expect(refunded.body.ledgerStatus).toBe('REFUNDED_100');
  });
});
