import { randomUUID } from 'node:crypto';
import { type INestApplication } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { Test } from '@nestjs/testing';
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
import { PrismaService } from '../../prisma/prisma.service';
import { EscrowService } from '../escrow/escrow.service';
import { BuyerNotificationHub } from './buyer-notification.hub';
import { SellerAcceptanceHub } from './seller-acceptance.hub';
import { DeliverablesController } from './deliverables.controller';
import { DeliverablesService } from './deliverables.service';
import { DELIVERABLES_REPOSITORY } from './deliverables.tokens';
import { MemoryDeliverablesRepository } from './memory-deliverables.repository';

const WALLET = 'https://ilp.interledger-test.dev/seller-deliverables';
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

describe('SPEC-07 deliverables HTTP', () => {
  let app: INestApplication;
  let identityRepo: MemoryIdentityRepository;
  let deliverablesRepo: MemoryDeliverablesRepository;
  let sellerToken = '';
  let buyerToken = '';
  let sellerUserId = '';
  let buyerUserId = '';
  let taskId = '';

  beforeAll(async () => {
    process.env.PUBLIC_API_URL = 'http://localhost:3001';
    process.env.PUBLIC_WEB_URL = 'http://localhost:3000';
    process.env.AUTH_SESSION_SECRET = 'test-session-secret-spec-07';
    // Tests SPEC-08 deben ser deterministas (sin llamar a Groq real).
    delete process.env.GROQ_API_KEY;
    delete process.env.AI_GATEWAY_API_KEY;

    identityRepo = new MemoryIdentityRepository();
    deliverablesRepo = new MemoryDeliverablesRepository();
    const gateway = new FakeWalletOwnershipGateway();
    const clock = new MutableClock();

    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController, WalletController, WalletCallbackController, DeliverablesController],
      providers: [
        IdentityService,
        WalletService,
        SystemClock,
        WalletVerifiedGuard,
        SessionAuthGuard,
        DeliverablesService,
        BuyerNotificationHub,
        SellerAcceptanceHub,
        {
          provide: EscrowService,
          useValue: {
            simulateRelease: async (_uid: string, taskId: string) => {
              await deliverablesRepo.setOrderLifecycle(taskId, 'COMPLETED');
              return { lifecycleStatus: 'COMPLETED', ledgerStatus: 'RELEASED_96_4' };
            },
            simulateRefund: async (_uid: string, taskId: string) => {
              await deliverablesRepo.setOrderLifecycle(taskId, 'REFUNDED');
              return { lifecycleStatus: 'REFUNDED', ledgerStatus: 'REFUNDED_100' };
            },
          },
        },
        { provide: CLOCK, useValue: clock },
        { provide: IDENTITY_REPOSITORY, useValue: identityRepo },
        { provide: WALLET_OWNERSHIP_GATEWAY, useValue: gateway },
        { provide: DELIVERABLES_REPOSITORY, useValue: deliverablesRepo },
        { provide: PrismaService, useValue: { client: null } },
        { provide: APP_FILTER, useClass: DomainExceptionFilter },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalFilters(new DomainExceptionFilter());
    await app.init();

    const seller = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: 'seller-deliv@example.test', password: 'password-ok', displayName: 'Seller Deliv' })
      .expect(201);
    sellerToken = seller.body.token;
    sellerUserId = seller.body.user.id;

    const buyer = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: 'buyer-deliv@example.test', password: 'password-ok', displayName: 'Buyer Deliv' })
      .expect(201);
    buyerToken = buyer.body.token;
    buyerUserId = buyer.body.user.id;

    await request(app.getHttpServer())
      .post('/api/v1/me/wallet/discovery')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ walletAddress: WALLET })
      .expect(201);
    const challenge = await request(app.getHttpServer())
      .post('/api/v1/me/wallet/challenges')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ walletAddress: WALLET })
      .expect(201);
    await request(app.getHttpServer())
      .get('/api/v1/auth/wallet/callback')
      .query({
        challengeId: challenge.body.challengeId,
        interact_ref: 'interact-ref-ok',
        hash: HASH_OK,
      })
      .expect(303);
  });

  beforeEach(() => {
    deliverablesRepo.reset();
    taskId = randomUUID();
    deliverablesRepo.seedOrder({
      taskId,
      buyerId: buyerUserId,
      sellerId: sellerUserId,
      lifecycleStatus: 'ESCROW_LOCKED',
      expectedMediaType: 'IMAGE_RASTER_VECTOR',
      allowedExtensions: ['.png', '.jpg'],
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('RF-01 / RF-02: upload + complete genera preview READY e IN_REVIEW', async () => {
    const begun = await request(app.getHttpServer())
      .post(`/api/v1/orders/${taskId}/deliverables/uploads`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({
        revisionNumber: 0,
        fileName: 'logo.png',
        mimeType: 'image/png',
        fileExtension: '.png',
      })
      .expect(201);

    expect(begun.body.deliverableId).toBeTruthy();
    expect(begun.body.uploadUrl).toContain('/content');
    expect(begun.body.originalObjectKey).toContain(`originals/${taskId}/0/`);

    await request(app.getHttpServer())
      .post(begun.body.uploadUrl.replace(/^\/api\/v1/, '/api/v1'))
      .set('Authorization', `Bearer ${sellerToken}`)
      .attach('file', Buffer.from('fake-png-bytes-not-empty'), {
        filename: 'logo.png',
        contentType: 'image/png',
      })
      .expect(200);

    const completed = await request(app.getHttpServer())
      .post(`/api/v1/orders/${taskId}/deliverables/${begun.body.deliverableId}/complete`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .expect(202);

    expect(completed.body.previewStatus).toBe('READY');
    expect(completed.body.lifecycleStatus).toBe('IN_REVIEW');

    const preview = await request(app.getHttpServer())
      .get(`/api/v1/orders/${taskId}/deliverables/${begun.body.deliverableId}/preview`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .expect(200);

    expect(preview.body.originalAvailable).toBe(false);
    expect(preview.body.previewStatus).toBe('READY');

    const svg = await request(app.getHttpServer())
      .get(`/api/v1/orders/${taskId}/deliverables/${begun.body.deliverableId}/preview/content`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .buffer(true)
      .parse((res, cb) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => cb(null, Buffer.concat(chunks)));
      })
      .expect(200);
    const svgText = Buffer.isBuffer(svg.body) ? svg.body.toString('utf8') : String(svg.body ?? svg.text ?? '');
    expect(svgText).toContain('TaskStream AI');
    expect(svgText).toContain('data:image/png;base64,');
  });

  it('RF-03 / SPEC-09: original bloqueado en IN_REVIEW; accept libera', async () => {
    const begun = await request(app.getHttpServer())
      .post(`/api/v1/orders/${taskId}/deliverables/uploads`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({
        revisionNumber: 0,
        fileName: 'logo.png',
        mimeType: 'image/png',
        fileExtension: '.png',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/orders/${taskId}/deliverables/${begun.body.deliverableId}/content`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .attach('file', Buffer.from('png-bytes'), { filename: 'logo.png', contentType: 'image/png' })
      .expect(200);

    await request(app.getHttpServer())
      .post(`/api/v1/orders/${taskId}/deliverables/${begun.body.deliverableId}/complete`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .expect(202);

    await request(app.getHttpServer())
      .get(`/api/v1/orders/${taskId}/deliverables/${begun.body.deliverableId}/original`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .expect(403)
      .expect({ code: 'ORIGINAL_LOCKED' });

    const notices = await request(app.getHttpServer())
      .get('/api/v1/me/delivery-notices')
      .set('Authorization', `Bearer ${buyerToken}`)
      .expect(200);
    expect(notices.body[0]?.type).toBe('DELIVERY_READY');

    const accepted = await request(app.getHttpServer())
      .post(`/api/v1/orders/${taskId}/deliverables/${begun.body.deliverableId}/accept`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .expect(200);
    expect(accepted.body.lifecycleStatus).toBe('COMPLETED');
    expect(accepted.body.ledgerStatus).toBe('RELEASED_96_4');
    expect(accepted.body.sellerPayoutUSDInCents).toBeGreaterThan(0);

    const sellerNotices = await request(app.getHttpServer())
      .get('/api/v1/me/acceptance-notices')
      .set('Authorization', `Bearer ${sellerToken}`)
      .expect(200);
    expect(sellerNotices.body[0]?.type).toBe('WORK_ACCEPTED_FUNDS_RELEASED');

    const unlocked = await request(app.getHttpServer())
      .get(`/api/v1/orders/${taskId}/deliverables/${begun.body.deliverableId}/original`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .expect(200);
    expect(unlocked.body.downloadUrl).toContain('/original/content');
  });

  it('rechaza extensión no permitida', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/orders/${taskId}/deliverables/uploads`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({
        revisionNumber: 0,
        fileName: 'song.mp3',
        mimeType: 'audio/mpeg',
        fileExtension: '.mp3',
      })
      .expect(400)
      .expect({ code: 'EXTENSION_NOT_ALLOWED' });
  });

  async function uploadAndComplete(revisionNumber: number, fileName: string) {
    const begun = await request(app.getHttpServer())
      .post(`/api/v1/orders/${taskId}/deliverables/uploads`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({
        revisionNumber,
        fileName,
        mimeType: 'image/png',
        fileExtension: '.png',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/orders/${taskId}/deliverables/${begun.body.deliverableId}/content`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .attach('file', Buffer.from(`png-${revisionNumber}`), { filename: fileName, contentType: 'image/png' })
      .expect(200);

    await request(app.getHttpServer())
      .post(`/api/v1/orders/${taskId}/deliverables/${begun.body.deliverableId}/complete`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .expect(202);

    return begun.body.deliverableId as string;
  }

  it('SPEC-09: revision limita a 2; clock 72h en IN_REVIEW', async () => {
    const d0 = await uploadAndComplete(0, 'v0.png');

    const clock = await request(app.getHttpServer())
      .get(`/api/v1/orders/${taskId}/clock`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .expect(200);
    expect(clock.body.activeClockKind).toBe('DELIVERY_REVIEW_32H');
    expect(clock.body.lifecycleStatus).toBe('IN_REVIEW');

    await request(app.getHttpServer())
      .post(`/api/v1/orders/${taskId}/revisions`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ deliverableId: d0, notes: 'Necesito más contraste en el logo.' })
      .expect(200)
      .expect((res) => {
        expect(res.body.revisionsUsed).toBe(1);
        expect(res.body.lifecycleStatus).toBe('REVISION_REQUESTED');
      });

    const d1 = await uploadAndComplete(1, 'v1.png');
    await request(app.getHttpServer())
      .post(`/api/v1/orders/${taskId}/revisions`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ deliverableId: d1, notes: 'Todavía no cumple el brief acordado.' })
      .expect(200)
      .expect((res) => expect(res.body.revisionsUsed).toBe(2));

    const d2 = await uploadAndComplete(2, 'v2.png');
    await request(app.getHttpServer())
      .post(`/api/v1/orders/${taskId}/revisions`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ deliverableId: d2, notes: 'Tercera corrección no debería pasar.' })
      .expect(409)
      .expect({ code: 'REVISION_LIMIT_REACHED' });
  });

  it('SPEC-10 beta: dispute + admin resolve + non-admin 403', async () => {
    const admin = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: 'admin-deliv@example.test', password: 'password-ok', displayName: 'Admin Deliv' })
      .expect(201);
    const adminToken = admin.body.token as string;
    const adminUserId = admin.body.user.id as string;
    identityRepo.setPlatformRole(adminUserId, 'ADMIN');

    await uploadAndComplete(0, 'dispute.png');

    await request(app.getHttpServer())
      .get('/api/v1/admin/disputes')
      .set('Authorization', `Bearer ${buyerToken}`)
      .expect(403)
      .expect({ code: 'ADMIN_ONLY' });

    const opened = await request(app.getHttpServer())
      .post(`/api/v1/orders/${taskId}/disputes`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ reason: 'No cumple el alcance pactado en el brief.' })
      .expect(201);
    expect(opened.body.status).toBe('OPEN');
    expect(opened.body.lifecycleStatus).toBe('DISPUTED');

    const list = await request(app.getHttpServer())
      .get('/api/v1/admin/disputes')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(list.body.some((row: { disputeId: string }) => row.disputeId === opened.body.disputeId)).toBe(true);

    const resolved = await request(app.getHttpServer())
      .post(`/api/v1/admin/disputes/${opened.body.disputeId}/resolve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        decision: 'BUYER_FULL_REFUND',
        justification: 'Evidencia suficiente: la entrega no cubre el brief.',
      })
      .expect(200);
    expect(resolved.body.status).toBe('RESOLVED');
    expect(resolved.body.decision).toBe('BUYER_FULL_REFUND');

    // Segundo caso: liberación 96/4
    const taskId2 = randomUUID();
    deliverablesRepo.seedOrder({
      taskId: taskId2,
      buyerId: buyerUserId,
      sellerId: sellerUserId,
      lifecycleStatus: 'ESCROW_LOCKED',
      expectedMediaType: 'IMAGE_RASTER_VECTOR',
      allowedExtensions: ['.png', '.jpg'],
      title: 'Orden disputa 96/4',
    });
    const begun = await request(app.getHttpServer())
      .post(`/api/v1/orders/${taskId2}/deliverables/uploads`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({
        revisionNumber: 0,
        fileName: 'ok.png',
        mimeType: 'image/png',
        fileExtension: '.png',
      })
      .expect(201);
    await request(app.getHttpServer())
      .post(`/api/v1/orders/${taskId2}/deliverables/${begun.body.deliverableId}/content`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .attach('file', Buffer.from('png-ok'), { filename: 'ok.png', contentType: 'image/png' })
      .expect(200);
    await request(app.getHttpServer())
      .post(`/api/v1/orders/${taskId2}/deliverables/${begun.body.deliverableId}/complete`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .expect(202);

    const opened2 = await request(app.getHttpServer())
      .post(`/api/v1/orders/${taskId2}/disputes`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ reason: 'Quiero mediación aunque la entrega parece completa.' })
      .expect(201);

    const resolved2 = await request(app.getHttpServer())
      .post(`/api/v1/admin/disputes/${opened2.body.disputeId}/resolve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        decision: 'FREELANCER_SPLIT_96_4',
        justification: 'La entrega cumple el alcance; se libera al emprendedor.',
      })
      .expect(200);
    expect(resolved2.body.decision).toBe('FREELANCER_SPLIT_96_4');
  });

  it('SPEC-08 RF-01: complete IMAGE genera informe consultivo vía GET ai-report', async () => {
    const begun = await request(app.getHttpServer())
      .post(`/api/v1/orders/${taskId}/deliverables/uploads`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({
        revisionNumber: 0,
        fileName: 'logo.png',
        mimeType: 'image/png',
        fileExtension: '.png',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/orders/${taskId}/deliverables/${begun.body.deliverableId}/content`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .attach('file', Buffer.from('fake-png-bytes'), { filename: 'logo.png', contentType: 'image/png' })
      .expect(200);

    await request(app.getHttpServer())
      .post(`/api/v1/orders/${taskId}/deliverables/${begun.body.deliverableId}/complete`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .expect(202);

    const report = await request(app.getHttpServer())
      .get(`/api/v1/orders/${taskId}/deliverables/${begun.body.deliverableId}/ai-report`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .expect(200);

    expect(report.body).toBeTruthy();
    expect(report.body.auditableModality).toBe('IMAGE');
    expect(report.body.advisoryLabel).toMatch(/COMPLIANCE/);
    expect(report.body.mandatoryDisclaimer).toContain('consultivo');
  });

  it('SPEC-08 RF-03: VIDEO_STREAM → GET ai-report responde null', async () => {
    const videoTask = randomUUID();
    deliverablesRepo.seedOrder({
      taskId: videoTask,
      buyerId: buyerUserId,
      sellerId: sellerUserId,
      lifecycleStatus: 'ESCROW_LOCKED',
      expectedMediaType: 'VIDEO_STREAM',
      allowedExtensions: ['.mp4'],
    });

    const begun = await request(app.getHttpServer())
      .post(`/api/v1/orders/${videoTask}/deliverables/uploads`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({
        revisionNumber: 0,
        fileName: 'clip.mp4',
        mimeType: 'video/mp4',
        fileExtension: '.mp4',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/orders/${videoTask}/deliverables/${begun.body.deliverableId}/content`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .attach('file', Buffer.from('fake-video-bytes'), { filename: 'clip.mp4', contentType: 'video/mp4' })
      .expect(200);

    await request(app.getHttpServer())
      .post(`/api/v1/orders/${videoTask}/deliverables/${begun.body.deliverableId}/complete`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .expect(202);

    const report = await request(app.getHttpServer())
      .get(`/api/v1/orders/${videoTask}/deliverables/${begun.body.deliverableId}/ai-report`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .expect(200);

    expect(report.body).toBeNull();
  });
});
