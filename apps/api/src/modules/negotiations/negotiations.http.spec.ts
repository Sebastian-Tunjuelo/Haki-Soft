import { type INestApplication } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { gnapInteractHash } from '@taskstream/shared-schemas';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
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
import { IdempotencyStore } from '../marketplace/idempotency.store';
import { MarketplaceController } from '../marketplace/marketplace.controller';
import { MarketplaceService } from '../marketplace/marketplace.service';
import { MARKETPLACE_REPOSITORY } from '../marketplace/marketplace.tokens';
import { MemoryMarketplaceRepository } from '../marketplace/memory-marketplace.repository';
import { MemoryNegotiationsRepository } from './memory-negotiations.repository';
import { NegotiationsController } from './negotiations.controller';
import { NegotiationsService } from './negotiations.service';
import { NEGOTIATIONS_REPOSITORY } from './negotiations.tokens';

const WALLET_SELLER = 'https://ilp.interledger-test.dev/seller-ana';
const WALLET_BUYER = 'https://ilp.interledger-test.dev/buyer-bob';
const WALLET_F2 = 'https://ilp.interledger-test.dev/seller-cara';

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

function hashFor(interactRef: string): string {
  return gnapInteractHash({
    clientNonce: 'client-nonce-fixed',
    finishNonce: 'finish-nonce-fixed',
    interactRef,
    authServerUrl: 'https://auth.example.test',
  });
}

const criterion = {
  criterionId: 'c-01',
  description: 'Entregar mockups en alta resolución',
  isMandatory: true,
};

describe('SPEC-05 negotiations HTTP', () => {
  let app: INestApplication;
  let identityRepo: MemoryIdentityRepository;
  let marketplaceRepo: MemoryMarketplaceRepository;
  let negotiationsRepo: MemoryNegotiationsRepository;

  let buyerToken = '';
  let buyerId = '';
  let sellerToken = '';
  let sellerId = '';
  let seller2Token = '';
  let seller2Id = '';

  async function verifyWallet(token: string, wallet: string, interactRef: string) {
    await request(app.getHttpServer())
      .post('/api/v1/me/wallet/discovery')
      .set('Authorization', `Bearer ${token}`)
      .send({ walletAddress: wallet })
      .expect(201);
    const challenge = await request(app.getHttpServer())
      .post('/api/v1/me/wallet/challenges')
      .set('Authorization', `Bearer ${token}`)
      .send({ walletAddress: wallet })
      .expect(201);
    await request(app.getHttpServer())
      .get('/api/v1/auth/wallet/callback')
      .query({
        challengeId: challenge.body.challengeId,
        interact_ref: interactRef,
        hash: hashFor(interactRef),
      })
      .expect(303);
  }

  beforeAll(async () => {
    process.env.PUBLIC_API_URL = 'http://localhost:3001';
    process.env.AUTH_SESSION_SECRET = 'test-session-secret-spec-05';
    identityRepo = new MemoryIdentityRepository();
    marketplaceRepo = new MemoryMarketplaceRepository();
    negotiationsRepo = new MemoryNegotiationsRepository(marketplaceRepo);
    const gateway = new FakeWalletOwnershipGateway();
    const clock = new MutableClock();

    const moduleRef = await Test.createTestingModule({
      controllers: [
        AuthController,
        WalletController,
        WalletCallbackController,
        MarketplaceController,
        NegotiationsController,
      ],
      providers: [
        IdentityService,
        WalletService,
        SystemClock,
        WalletVerifiedGuard,
        SessionAuthGuard,
        MarketplaceService,
        NegotiationsService,
        IdempotencyStore,
        { provide: CLOCK, useValue: clock },
        { provide: IDENTITY_REPOSITORY, useValue: identityRepo },
        { provide: WALLET_OWNERSHIP_GATEWAY, useValue: gateway },
        { provide: MARKETPLACE_REPOSITORY, useValue: marketplaceRepo },
        { provide: NEGOTIATIONS_REPOSITORY, useValue: negotiationsRepo },
        { provide: APP_FILTER, useClass: DomainExceptionFilter },
      ],
    }).compile();

    app = moduleRef.createNestApplication({ rawBody: true });
    app.setGlobalPrefix('api/v1');
    app.useGlobalFilters(new DomainExceptionFilter());
    await app.init();

    const seller = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: 'seller@spec05.test', password: 'password-ok', displayName: 'Ana Seller' })
      .expect(201);
    sellerToken = seller.body.token;
    sellerId = seller.body.user.id;
    await verifyWallet(sellerToken, WALLET_SELLER, 'interact-seller');
    await marketplaceRepo.seedVerifiedSeller!({
      userId: sellerId,
      displayName: 'Ana Seller',
      walletAddressUrl: WALLET_SELLER,
    });

    const buyer = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: 'buyer@spec05.test', password: 'password-ok', displayName: 'Bob Buyer' })
      .expect(201);
    buyerToken = buyer.body.token;
    buyerId = buyer.body.user.id;
    await verifyWallet(buyerToken, WALLET_BUYER, 'interact-buyer');

    const seller2 = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: 'seller2@spec05.test', password: 'password-ok', displayName: 'Cara Seller' })
      .expect(201);
    seller2Token = seller2.body.token;
    seller2Id = seller2.body.user.id;
    await verifyWallet(seller2Token, WALLET_F2, 'interact-seller2');
    await marketplaceRepo.seedVerifiedSeller!({
      userId: seller2Id,
      displayName: 'Cara Seller',
      walletAddressUrl: WALLET_F2,
    });
  });

  beforeEach(() => {
    marketplaceRepo.reset();
    negotiationsRepo.reset();
    void marketplaceRepo.seedVerifiedSeller!({
      userId: sellerId,
      displayName: 'Ana Seller',
      walletAddressUrl: WALLET_SELLER,
    });
    void marketplaceRepo.seedVerifiedSeller!({
      userId: seller2Id,
      displayName: 'Cara Seller',
      walletAddressUrl: WALLET_F2,
    });
  });

  afterAll(async () => {
    await app.close();
  });

  async function createPublication(budget = 20_000) {
    const res = await request(app.getHttpServer())
      .post('/api/v1/marketplace/publications')
      .set('Authorization', `Bearer ${buyerToken}`)
      .set('Idempotency-Key', crypto.randomUUID())
      .send({
        title: 'Artículo técnico SEO para SaaS',
        description: 'Necesito un artículo técnico de 1500 palabras sobre Open Payments.',
        category: 'TECHNICAL_WRITING_TRANS',
        expectedMediaType: 'DOCUMENT_TEXT',
        initialBudgetUSDInCents: budget,
        initialDeliveryDays: 7,
        preliminaryCriteria: [criterion],
        allowedExtensions: ['.md', '.docx'],
      })
      .expect(201);
    return res.body.publicationId as string;
  }

  it('RF-01: postulación válida y rechazo por encima del tope / self-dealing', async () => {
    const publicationId = await createPublication(20_000);

    const created = await request(app.getHttpServer())
      .post('/api/v1/negotiations/proposals')
      .set('Authorization', `Bearer ${sellerToken}`)
      .set('Idempotency-Key', crypto.randomUUID())
      .send({
        publicationId,
        proposedBudgetUSDInCents: 18_000,
        proposedDeliveryDays: 5,
        coverMessage: 'Puedo entregar el artículo con SEO técnico en 5 días.',
      })
      .expect(201);
    expect(created.body.status).toBe('IN_NEGOTIATION');
    expect(created.body.proposedBudgetUSDInCents).toBe(18_000);

    await request(app.getHttpServer())
      .post('/api/v1/negotiations/proposals')
      .set('Authorization', `Bearer ${sellerToken}`)
      .set('Idempotency-Key', crypto.randomUUID())
      .send({
        publicationId,
        proposedBudgetUSDInCents: 20_001,
        proposedDeliveryDays: 5,
        coverMessage: 'Oferta por encima del presupuesto tope del Buyer.',
      })
      .expect(400)
      .expect({ code: 'OFFER_EXCEEDS_INITIAL_BUDGET' });

    await request(app.getHttpServer())
      .post('/api/v1/negotiations/proposals')
      .set('Authorization', `Bearer ${buyerToken}`)
      .set('Idempotency-Key', crypto.randomUUID())
      .send({
        publicationId,
        proposedBudgetUSDInCents: 15_000,
        proposedDeliveryDays: 4,
        coverMessage: 'El buyer intenta postular a su propia publicación.',
      })
      .expect(403)
      .expect({ code: 'SELF_DEALING_FORBIDDEN' });

    await request(app.getHttpServer())
      .get(`/api/v1/negotiations/proposals/${created.body.proposalId}`)
      .set('Authorization', `Bearer ${seller2Token}`)
      .expect(403)
      .expect({ code: 'PROPOSAL_ACCESS_FORBIDDEN' });
  });

  it('RF-02: Camino 1 crea TaskOrder + EscrowLedger 96/4 y cierra competidoras', async () => {
    const publicationId = await createPublication(20_000);

    const p1 = await request(app.getHttpServer())
      .post('/api/v1/negotiations/proposals')
      .set('Authorization', `Bearer ${sellerToken}`)
      .set('Idempotency-Key', crypto.randomUUID())
      .send({
        publicationId,
        proposedBudgetUSDInCents: 15_000,
        proposedDeliveryDays: 4,
        coverMessage: 'Oferta competitiva del freelancer principal Ana.',
      })
      .expect(201);

    const p2 = await request(app.getHttpServer())
      .post('/api/v1/negotiations/proposals')
      .set('Authorization', `Bearer ${seller2Token}`)
      .set('Idempotency-Key', crypto.randomUUID())
      .send({
        publicationId,
        proposedBudgetUSDInCents: 17_500,
        proposedDeliveryDays: 5,
        coverMessage: 'Oferta alternativa del segundo freelancer Cara.',
      })
      .expect(201);

    const accepted = await request(app.getHttpServer())
      .post(`/api/v1/negotiations/proposals/${p1.body.proposalId}/accept`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .set('Idempotency-Key', crypto.randomUUID())
      .send({
        proposalId: p1.body.proposalId,
        expectedAmountUSDInCents: 15_000,
        expectedDeliveryDays: 4,
        buyerAssumesDoubleFxConversion: true,
      })
      .expect(201);

    expect(accepted.body.proposalStatus).toBe('AGREED_PATH_1');
    expect(accepted.body.publicationStatus).toBe('AGREED_AND_LOCKED');
    expect(accepted.body.taskOrder.lifecycleStatus).toBe('PENDING_ESCROW_FUNDING');
    expect(accepted.body.taskOrder.aiAuditableModality).toBe('TEXT');
    expect(accepted.body.taskOrder.paymentTerms.totalAmountUSDInCents).toBe(15_000);
    expect(accepted.body.taskOrder.paymentTerms.platformFeeUSDInCents).toBe(600);
    expect(accepted.body.taskOrder.paymentTerms.freelancerPayoutUSDInCents).toBe(14_400);
    expect(accepted.body.taskOrder.proposalId).toBe(p1.body.proposalId);

    const closed = await request(app.getHttpServer())
      .get(`/api/v1/negotiations/proposals/${p2.body.proposalId}`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .expect(200);
    expect(closed.body.status).toBe('DISCREPANCY_CLOSED_PATH_2');

    await request(app.getHttpServer())
      .post(`/api/v1/negotiations/proposals/${p1.body.proposalId}/accept`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .set('Idempotency-Key', crypto.randomUUID())
      .send({
        proposalId: p1.body.proposalId,
        expectedAmountUSDInCents: 15_000,
        expectedDeliveryDays: 4,
        buyerAssumesDoubleFxConversion: true,
      })
      .expect(409);
  });

  it('RF-02 anti-TOCTOU: expectedAmount distinto del vigente → 409', async () => {
    const publicationId = await createPublication(20_000);
    const p1 = await request(app.getHttpServer())
      .post('/api/v1/negotiations/proposals')
      .set('Authorization', `Bearer ${sellerToken}`)
      .set('Idempotency-Key', crypto.randomUUID())
      .send({
        publicationId,
        proposedBudgetUSDInCents: 15_000,
        proposedDeliveryDays: 4,
        coverMessage: 'Oferta inicial para probar bait-and-switch.',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/negotiations/proposals/${p1.body.proposalId}/accept`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .set('Idempotency-Key', crypto.randomUUID())
      .send({
        proposalId: p1.body.proposalId,
        expectedAmountUSDInCents: 16_500,
        expectedDeliveryDays: 4,
        buyerAssumesDoubleFxConversion: true,
      })
      .expect(409)
      .expect({ code: 'OFFER_TERMS_CHANGED_CONFLICT' });
  });

  it('RF-03: Camino 2 cierra solo esa propuesta y deja la publicación abierta', async () => {
    const publicationId = await createPublication(20_000);
    const p1 = await request(app.getHttpServer())
      .post('/api/v1/negotiations/proposals')
      .set('Authorization', `Bearer ${sellerToken}`)
      .set('Idempotency-Key', crypto.randomUUID())
      .send({
        publicationId,
        proposedBudgetUSDInCents: 15_000,
        proposedDeliveryDays: 4,
        coverMessage: 'Primera oferta que se descartará por discrepancia.',
      })
      .expect(201);
    const p2 = await request(app.getHttpServer())
      .post('/api/v1/negotiations/proposals')
      .set('Authorization', `Bearer ${seller2Token}`)
      .set('Idempotency-Key', crypto.randomUUID())
      .send({
        publicationId,
        proposedBudgetUSDInCents: 16_000,
        proposedDeliveryDays: 5,
        coverMessage: 'Segunda oferta que debe permanecer en negociación.',
      })
      .expect(201);

    const closed = await request(app.getHttpServer())
      .post(`/api/v1/negotiations/proposals/${p1.body.proposalId}/close`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        proposalId: p1.body.proposalId,
        closedReason: 'No hay acuerdo en el alcance de entregables',
      })
      .expect(200);
    expect(closed.body.proposalStatus).toBe('DISCREPANCY_CLOSED_PATH_2');
    expect(closed.body.publicationStatus).toBe('OPEN_FOR_PROPOSALS');

    const stillOpen = await request(app.getHttpServer())
      .get(`/api/v1/negotiations/proposals/${p2.body.proposalId}`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .expect(200);
    expect(stillOpen.body.status).toBe('IN_NEGOTIATION');

    await request(app.getHttpServer())
      .post(`/api/v1/negotiations/proposals/${p1.body.proposalId}/messages`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .set('Idempotency-Key', crypto.randomUUID())
      .send({ proposalId: p1.body.proposalId, body: 'mensaje tardío' })
      .expect(409)
      .expect({ code: 'PROPOSAL_NOT_IN_NEGOTIATION' });
  });

  it('RF-04: contratar Gig fijo crea orden PENDING_ESCROW_FUNDING con gigId', async () => {
    const gig = await request(app.getHttpServer())
      .post('/api/v1/marketplace/gigs')
      .set('Authorization', `Bearer ${sellerToken}`)
      .set('Idempotency-Key', crypto.randomUUID())
      .send({
        title: 'API NestJS con Open Payments',
        description: 'Implementación backend de integración Open Payments lista para demo.',
        category: 'PROGRAMMING_AND_TECH',
        expectedMediaType: 'CODE_ARCHIVE',
        priceUSDInCents: 30_000,
        initialDeliveryDays: 7,
        defaultCriteria: [criterion],
        allowedExtensions: ['.zip', '.tar.gz'],
      })
      .expect(201);

    const hired = await request(app.getHttpServer())
      .post(`/api/v1/negotiations/gigs/${gig.body.gigId}/hire`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .set('Idempotency-Key', crypto.randomUUID())
      .send({
        gigId: gig.body.gigId,
        expectedPriceUSDInCents: 30_000,
        projectBrief: 'Necesito endpoints de escrow y tests HTTP documentados.',
        buyerAssumesDoubleFxConversion: true,
      })
      .expect(201);

    expect(hired.body.taskOrder.gigId).toBe(gig.body.gigId);
    expect(hired.body.taskOrder.proposalId).toBeUndefined();
    expect(hired.body.taskOrder.aiAuditableModality).toBeUndefined();
    expect(hired.body.taskOrder.lifecycleStatus).toBe('PENDING_ESCROW_FUNDING');
    expect(hired.body.taskOrder.paymentTerms.platformFeeUSDInCents).toBe(1_200);
    expect(hired.body.taskOrder.paymentTerms.freelancerPayoutUSDInCents).toBe(28_800);

    await request(app.getHttpServer())
      .post(`/api/v1/negotiations/gigs/${gig.body.gigId}/hire`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .set('Idempotency-Key', crypto.randomUUID())
      .send({
        gigId: gig.body.gigId,
        expectedPriceUSDInCents: 25_000,
        projectBrief: 'Intento de alterar el precio fijo del Gig publicado.',
        buyerAssumesDoubleFxConversion: true,
      })
      .expect(409)
      .expect({ code: 'GIG_PRICE_CHANGED_OR_INACTIVE' });
  });
});
