import { createHash, randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import {
  AcceptDeliverableResultSchema,
  AiAdvisorReportSchema,
  assertDeliverablePrecheck,
  BuyerDeliveryNoticeSchema,
  CreateDeliverableUploadResultSchema,
  CreateDeliverableUploadSchema,
  DeliverableCompleteResultSchema,
  DeliverableOriginalViewSchema,
  DeliverablePreviewViewSchema,
  DisputeCaseDetailSchema,
  DisputeCaseListItemSchema,
  finalClaimDeadlineIso,
  MAX_REVISIONS_PER_ORDER,
  OpenDisputeInputSchema,
  OpenDisputeResultSchema,
  OrderClockViewSchema,
  RequestRevisionInputSchema,
  RequestRevisionResultSchema,
  ResolveDisputeInputSchema,
  resolveMvpAiAuditableModality,
  reviewDeadlineIso,
  SellerAcceptanceNoticeSchema,
  splitSingleBlockEscrow,
  type AcceptDeliverableResult,
  type AiAdvisorReport,
  type BuyerDeliveryNotice,
  type CreateDeliverableUploadResult,
  type DeliverableCompleteResult,
  type DeliverableOriginalView,
  type DeliverablePreviewView,
  type DisputeCaseDetail,
  type DisputeCaseListItem,
  type OpenDisputeResult,
  type OrderClockView,
  type RequestRevisionResult,
  type SellerAcceptanceNotice,
} from '@taskstream/shared-schemas';
import { DomainError } from '../identity/domain-error';
import { IdentityService } from '../identity/identity.service';
import { EscrowService } from '../escrow/escrow.service';
import { runAdviseForDeliverable } from './ai-advisor.runner';
import { BuyerNotificationHub } from './buyer-notification.hub';
import { SellerAcceptanceHub } from './seller-acceptance.hub';
import { DELIVERABLES_REPOSITORY } from './deliverables.tokens';
import type { DeliverablesRepository, StoredDeliverable } from './deliverables.types';
import {
  buildOriginalKey,
  buildPreviewKey,
  buildWatermarkedSvgPreview,
  readObject,
  sha256Hex,
  writeObject,
} from './object-storage';

const UPLOADABLE = new Set(['ESCROW_LOCKED', 'ESCROW_EXTENDED', 'REVISION_REQUESTED']);
const ORIGINAL_UNLOCKED = new Set(['FINAL_CLAIM_WINDOW_30M', 'COMPLETED']);
const ORIGINAL_LOCKED = new Set([
  'IN_REVIEW',
  'REVISION_REQUESTED',
  'ESCROW_LOCKED',
  'ESCROW_EXTENDED',
  'DISPUTED',
]);

@Injectable()
export class DeliverablesService {
  constructor(
    @Inject(DELIVERABLES_REPOSITORY) private readonly repo: DeliverablesRepository,
    @Inject(EscrowService) private readonly escrow: EscrowService,
    @Inject(BuyerNotificationHub) private readonly buyerHub: BuyerNotificationHub,
    @Inject(SellerAcceptanceHub) private readonly sellerAcceptanceHub: SellerAcceptanceHub,
    @Inject(IdentityService) private readonly identity: IdentityService,
  ) {}

  async beginUpload(
    userId: string,
    taskId: string,
    body: unknown,
  ): Promise<CreateDeliverableUploadResult> {
    const parsed = CreateDeliverableUploadSchema.safeParse({
      ...(typeof body === 'object' && body ? body : {}),
      taskId,
    });
    if (!parsed.success) throw new DomainError(400, 'VALIDATION_ERROR');

    const order = await this.requireOrderParty(userId, taskId);
    if (order.sellerId !== userId) throw new DomainError(403, 'NOT_ORDER_SELLER');
    if (!UPLOADABLE.has(order.lifecycleStatus)) {
      throw new DomainError(409, 'ORDER_NOT_ACCEPTING_DELIVERABLES');
    }

    const ext = normalizeExt(parsed.data.fileExtension);
    const allowed = order.allowedExtensions.map(normalizeExt);
    const precheck = assertDeliverablePrecheck({
      fileSizeBytes: 1,
      extensionAllowed: allowed.length === 0 || allowed.includes(ext),
    });
    if (!precheck.extensionAllowed) throw new DomainError(400, 'EXTENSION_NOT_ALLOWED');

    const existing = await this.repo.findByTaskAndRevision(taskId, parsed.data.revisionNumber);
    if (existing?.previewStatus === 'READY') {
      throw new DomainError(409, 'REVISION_ALREADY_SUBMITTED');
    }
    // Reanudar upload/complete pendiente (contenido faltante o preview fallido/en curso).
    if (existing) {
      return CreateDeliverableUploadResultSchema.parse({
        deliverableId: existing.id,
        uploadUrl: `/api/v1/orders/${taskId}/deliverables/${existing.id}/content`,
        originalObjectKey: existing.originalR2Key,
        revisionNumber: existing.revisionNumber,
      });
    }

    const deliverableId = randomUUID();
    const originalKey = buildOriginalKey(taskId, parsed.data.revisionNumber, ext);
    const pendingChecksum = createHash('sha256').update(`pending:${deliverableId}`).digest('hex');

    try {
      await this.repo.createPending({
        id: deliverableId,
        taskOrderId: taskId,
        revisionNumber: parsed.data.revisionNumber,
        originalR2Key: originalKey,
        fileName: parsed.data.fileName,
        mimeType: parsed.data.mimeType,
        fileExtension: ext,
        fileSizeBytes: 0,
        sha256Checksum: pendingChecksum,
        mediaType: order.expectedMediaType,
      });
    } catch {
      throw new DomainError(500, 'DELIVERABLE_PERSISTENCE_FAILED');
    }

    return CreateDeliverableUploadResultSchema.parse({
      deliverableId,
      uploadUrl: `/api/v1/orders/${taskId}/deliverables/${deliverableId}/content`,
      originalObjectKey: originalKey,
      revisionNumber: parsed.data.revisionNumber,
    });
  }

  async putContent(
    userId: string,
    taskId: string,
    deliverableId: string,
    bytes: Buffer,
  ): Promise<{ ok: true; bytesReceived: number }> {
    const order = await this.requireOrderParty(userId, taskId);
    if (order.sellerId !== userId) throw new DomainError(403, 'NOT_ORDER_SELLER');

    const deliverable = await this.requireDeliverable(taskId, deliverableId);
    if (bytes.length === 0) throw new DomainError(400, 'EMPTY_DELIVERABLE');

    writeObject(deliverable.originalR2Key, bytes);
    const updated = await this.repo.markContentUploaded({
      deliverableId,
      fileSizeBytes: bytes.length,
      sha256Checksum: sha256Hex(bytes),
    });
    if (updated === 'NOT_FOUND') throw new DomainError(404, 'DELIVERABLE_NOT_FOUND');
    return { ok: true, bytesReceived: bytes.length };
  }

  async complete(
    userId: string,
    taskId: string,
    deliverableId: string,
  ): Promise<DeliverableCompleteResult> {
    const order = await this.requireOrderParty(userId, taskId);
    if (order.sellerId !== userId) throw new DomainError(403, 'NOT_ORDER_SELLER');

    const deliverable = await this.requireDeliverable(taskId, deliverableId);
    if (deliverable.previewStatus === 'READY' && deliverable.previewR2Key) {
      return DeliverableCompleteResultSchema.parse({
        deliverableId,
        previewStatus: 'READY',
        lifecycleStatus: order.lifecycleStatus,
      });
    }

    const original = readObject(deliverable.originalR2Key);
    const size = original?.length ?? deliverable.fileSizeBytes;
    const precheck = assertDeliverablePrecheck({
      fileSizeBytes: size,
      extensionAllowed: true,
    });
    if (!precheck.nonEmptyFile) throw new DomainError(400, 'EMPTY_DELIVERABLE');

    const previewKey = buildPreviewKey(taskId, deliverable.revisionNumber);
    try {
      const svg = buildWatermarkedSvgPreview({
        fileName: deliverable.fileName,
        mediaType: deliverable.mediaType,
        revisionNumber: deliverable.revisionNumber,
        originalBytes: original,
        mimeType: deliverable.mimeType,
      });
      writeObject(previewKey, svg);
      await this.repo.markPreviewResult({
        deliverableId,
        previewR2Key: previewKey,
        previewStatus: 'READY',
      });
    } catch {
      await this.repo.markPreviewResult({
        deliverableId,
        previewR2Key: null,
        previewStatus: 'FAILED',
      });
      throw new DomainError(500, 'PREVIEW_GENERATION_FAILED');
    }

    // Entrega → IN_REVIEW (reloj 72h); deja de correr el 7d en la UI.
    if (
      order.lifecycleStatus === 'ESCROW_LOCKED' ||
      order.lifecycleStatus === 'ESCROW_EXTENDED' ||
      order.lifecycleStatus === 'REVISION_REQUESTED'
    ) {
      await this.repo.setOrderLifecycle(taskId, 'IN_REVIEW');
    }

    const fresh = await this.repo.findOrder(taskId);
    if (fresh) {
      this.buyerHub.publish(
        fresh.buyerId,
        BuyerDeliveryNoticeSchema.parse({
          type: 'DELIVERY_READY',
          taskId,
          deliverableId,
          title: fresh.title,
          sellerDisplayName: fresh.sellerDisplayName,
          createdAt: new Date().toISOString(),
        }),
      );

      // SPEC-08: informe consultivo solo para IMAGE/TEXT (no bloquea la entrega).
      await this.maybeGenerateAiReport(fresh, deliverableId);
    }

    return DeliverableCompleteResultSchema.parse({
      deliverableId,
      previewStatus: 'READY',
      lifecycleStatus: fresh?.lifecycleStatus ?? 'IN_REVIEW',
    });
  }

  /**
   * GET informe IA. `null` si la modalidad no es auditable en el MVP.
   */
  async getAiReport(
    userId: string,
    taskId: string,
    deliverableId: string,
  ): Promise<AiAdvisorReport | null> {
    const order = await this.requireOrderParty(userId, taskId);
    await this.requireDeliverable(taskId, deliverableId);

    if (!resolveMvpAiAuditableModality(order.expectedMediaType)) {
      return null;
    }

    const existing = await this.repo.findAiReport(deliverableId);
    if (existing) return AiAdvisorReportSchema.parse(existing);

    // Lazy: si el complete falló al generar, reintentar una vez al leer.
    await this.maybeGenerateAiReport(order, deliverableId);
    const again = await this.repo.findAiReport(deliverableId);
    return again ? AiAdvisorReportSchema.parse(again) : null;
  }

  private async maybeGenerateAiReport(
    order: Awaited<ReturnType<DeliverablesRepository['findOrder']>>,
    deliverableId: string,
  ): Promise<void> {
    if (!order) return;
    if (!resolveMvpAiAuditableModality(order.expectedMediaType)) return;
    const existing = await this.repo.findAiReport(deliverableId);
    if (existing) return;

    const deliverable = await this.repo.findDeliverable(deliverableId);
    if (!deliverable || deliverable.previewStatus !== 'READY') return;

    try {
      const report = await runAdviseForDeliverable({ order, deliverable });
      if (!report) return;
      await this.repo.saveAiReport(report);
    } catch {
      // El preview y la revisión siguen disponibles aunque falle el proveedor.
    }
  }

  async getPreview(
    userId: string,
    taskId: string,
    deliverableId: string,
  ): Promise<DeliverablePreviewView> {
    const order = await this.requireOrderParty(userId, taskId);
    const deliverable = await this.requireDeliverable(taskId, deliverableId);
    const originalAvailable = this.isOriginalAvailable(order.lifecycleStatus);

    return DeliverablePreviewViewSchema.parse({
      deliverableId: deliverable.id,
      revisionNumber: deliverable.revisionNumber,
      previewUrl: `/api/v1/orders/${taskId}/deliverables/${deliverableId}/preview/content`,
      originalAvailable,
      mediaType: deliverable.mediaType,
      previewStatus: deliverable.previewStatus,
      fileName: deliverable.fileName,
    });
  }

  async getOriginal(
    userId: string,
    taskId: string,
    deliverableId: string,
  ): Promise<DeliverableOriginalView> {
    const order = await this.requireOrderParty(userId, taskId);
    await this.requireDeliverable(taskId, deliverableId);

    if (!this.isOriginalAvailable(order.lifecycleStatus)) {
      throw new DomainError(403, 'ORIGINAL_LOCKED');
    }

    return DeliverableOriginalViewSchema.parse({
      deliverableId,
      downloadUrl: `/api/v1/orders/${taskId}/deliverables/${deliverableId}/original/content`,
      fileName: (await this.repo.findDeliverable(deliverableId))!.fileName,
      mimeType: (await this.repo.findDeliverable(deliverableId))!.mimeType,
    });
  }

  async readPreviewBytes(
    userId: string,
    taskId: string,
    deliverableId: string,
  ): Promise<{ bytes: Buffer; mimeType: string }> {
    await this.requireOrderParty(userId, taskId);
    const deliverable = await this.requireDeliverable(taskId, deliverableId);
    if (!deliverable.previewR2Key || deliverable.previewStatus !== 'READY') {
      throw new DomainError(409, 'PREVIEW_NOT_READY');
    }
    const bytes = readObject(deliverable.previewR2Key);
    if (!bytes) throw new DomainError(404, 'DELIVERABLE_NOT_FOUND');
    return { bytes, mimeType: 'image/svg+xml' };
  }

  async readOriginalBytes(
    userId: string,
    taskId: string,
    deliverableId: string,
  ): Promise<{ bytes: Buffer; mimeType: string; fileName: string }> {
    const order = await this.requireOrderParty(userId, taskId);
    const deliverable = await this.requireDeliverable(taskId, deliverableId);
    if (!this.isOriginalAvailable(order.lifecycleStatus)) {
      throw new DomainError(403, 'ORIGINAL_LOCKED');
    }
    const bytes = readObject(deliverable.originalR2Key);
    if (!bytes) throw new DomainError(404, 'ORIGINAL_OBJECT_MISSING');
    return { bytes, mimeType: deliverable.mimeType, fileName: deliverable.fileName };
  }

  async list(userId: string, taskId: string): Promise<DeliverablePreviewView[]> {
    await this.requireOrderParty(userId, taskId);
    const order = await this.repo.findOrder(taskId);
    const items = await this.repo.listByTask(taskId);
    return items.map((item) =>
      DeliverablePreviewViewSchema.parse({
        deliverableId: item.id,
        revisionNumber: item.revisionNumber,
        previewUrl: `/api/v1/orders/${taskId}/deliverables/${item.id}/preview/content`,
        originalAvailable: this.isOriginalAvailable(order!.lifecycleStatus),
        mediaType: item.mediaType,
        previewStatus: item.previewStatus,
        fileName: item.fileName,
      }),
    );
  }

  async getClock(userId: string, taskId: string): Promise<OrderClockView> {
    await this.maybeExpireClaimWindow(taskId);
    const order = await this.requireOrderParty(userId, taskId);
    const revisionsUsed = await this.repo.countRevisionsUsed(taskId);
    const items = await this.repo.listByTask(taskId);
    const latestReady = [...items].reverse().find((d) => d.previewStatus === 'READY');
    const latestAccepted = [...items]
      .reverse()
      .find((d) => d.reviewDecision === 'ACCEPTED_BY_BUYER' && d.reviewDecidedAt);
    const viewerRole = order.buyerId === userId ? 'buyer' : 'seller';

    let activeClockKind: OrderClockView['activeClockKind'] = null;
    let activeDeadlineAt: string | null = null;

    if (order.lifecycleStatus === 'IN_REVIEW' && latestReady) {
      activeClockKind = 'DELIVERY_REVIEW_32H';
      activeDeadlineAt = reviewDeadlineIso(latestReady.submittedAt);
    } else if (
      (order.lifecycleStatus === 'ESCROW_LOCKED' || order.lifecycleStatus === 'ESCROW_EXTENDED') &&
      order.fundsLockedAt
    ) {
      activeClockKind = 'INITIAL_DELIVERY_7D';
      const days = order.initialDeliveryDays || 7;
      activeDeadlineAt = new Date(
        order.fundsLockedAt.getTime() + days * 24 * 60 * 60 * 1000,
      ).toISOString();
    } else if (order.lifecycleStatus === 'FINAL_CLAIM_WINDOW_30M' && latestAccepted?.reviewDecidedAt) {
      activeClockKind = 'FINAL_CLAIM_WINDOW_30M';
      activeDeadlineAt = finalClaimDeadlineIso(latestAccepted.reviewDecidedAt);
    }

    return OrderClockViewSchema.parse({
      taskId,
      lifecycleStatus: order.lifecycleStatus,
      revisionsUsed: Math.min(revisionsUsed, MAX_REVISIONS_PER_ORDER),
      maxRevisions: 2,
      activeDeadlineAt,
      activeClockKind,
      viewerRole,
    });
  }

  /**
   * Buyer: ¡Es lo que quería! → libera 96/4 de inmediato (demo de flujo de dinero).
   * Notifica al Seller el monto acreditado. La ventana contractual de 30 m no se aplica aquí.
   */
  async acceptDeliverable(
    userId: string,
    taskId: string,
    deliverableId: string,
  ): Promise<AcceptDeliverableResult> {
    const order = await this.requireOrderParty(userId, taskId);
    if (order.buyerId !== userId) throw new DomainError(403, 'NOT_ORDER_BUYER');
    if (order.lifecycleStatus !== 'IN_REVIEW') throw new DomainError(409, 'NOT_IN_REVIEW');
    await this.requireDeliverable(taskId, deliverableId);

    const decided = await this.repo.markReviewDecision({
      deliverableId,
      reviewDecision: 'ACCEPTED_BY_BUYER',
    });
    if (decided === 'NOT_FOUND') throw new DomainError(404, 'DELIVERABLE_NOT_FOUND');

    this.buyerHub.clear(userId, taskId);

    await this.escrow.simulateRelease(userId, taskId);
    await this.repo.setOrderLifecycle(taskId, 'COMPLETED');
    const split = splitSingleBlockEscrow(Math.max(100, order.totalAmountUSDInCents));

    this.sellerAcceptanceHub.publish(
      order.sellerId,
      SellerAcceptanceNoticeSchema.parse({
        type: 'WORK_ACCEPTED_FUNDS_RELEASED',
        taskId,
        title: order.title,
        buyerDisplayName: order.buyerDisplayName,
        sellerPayoutUSDInCents: split.freelancerPayoutUSDInCents,
        createdAt: new Date().toISOString(),
      }),
    );

    return AcceptDeliverableResultSchema.parse({
      taskId,
      deliverableId,
      lifecycleStatus: 'COMPLETED',
      ledgerStatus: 'RELEASED_96_4',
      originalAvailable: true,
      sellerPayoutUSDInCents: split.freelancerPayoutUSDInCents,
    });
  }

  async requestRevision(userId: string, taskId: string, body: unknown): Promise<RequestRevisionResult> {
    const parsed = RequestRevisionInputSchema.safeParse(body);
    if (!parsed.success) throw new DomainError(400, 'VALIDATION_ERROR');

    const order = await this.requireOrderParty(userId, taskId);
    if (order.buyerId !== userId) throw new DomainError(403, 'NOT_ORDER_BUYER');
    if (order.lifecycleStatus !== 'IN_REVIEW') throw new DomainError(409, 'NOT_IN_REVIEW');

    const used = await this.repo.countRevisionsUsed(taskId);
    if (used >= MAX_REVISIONS_PER_ORDER) throw new DomainError(409, 'REVISION_LIMIT_REACHED');

    await this.requireDeliverable(taskId, parsed.data.deliverableId);
    await this.repo.markReviewDecision({
      deliverableId: parsed.data.deliverableId,
      reviewDecision: 'REVISION_REQUESTED',
      buyerRevisionNotes: parsed.data.notes,
    });
    await this.repo.setOrderLifecycle(taskId, 'REVISION_REQUESTED');
    this.buyerHub.clear(userId, taskId);

    return RequestRevisionResultSchema.parse({
      taskId,
      deliverableId: parsed.data.deliverableId,
      lifecycleStatus: 'REVISION_REQUESTED',
      revisionsUsed: used + 1,
    });
  }

  async openDispute(userId: string, taskId: string, body: unknown): Promise<OpenDisputeResult> {
    const parsed = OpenDisputeInputSchema.safeParse(body);
    if (!parsed.success) throw new DomainError(400, 'VALIDATION_ERROR');

    const order = await this.requireOrderParty(userId, taskId);
    if (order.buyerId !== userId) throw new DomainError(403, 'NOT_ORDER_BUYER');
    if (
      order.lifecycleStatus !== 'IN_REVIEW' &&
      order.lifecycleStatus !== 'FINAL_CLAIM_WINDOW_30M' &&
      order.lifecycleStatus !== 'REVISION_REQUESTED'
    ) {
      throw new DomainError(409, 'DISPUTE_WINDOW_CLOSED');
    }

    const disputeId = randomUUID();
    const created = await this.repo.createDispute({
      id: disputeId,
      taskOrderId: taskId,
      claimReason: parsed.data.reason,
    });
    if (created === 'ORDER_NOT_FOUND') throw new DomainError(404, 'ORDER_NOT_FOUND');
    if (created === 'ALREADY_OPEN') throw new DomainError(409, 'DISPUTE_ALREADY_OPEN');

    await this.repo.setOrderLifecycle(taskId, 'DISPUTED');
    this.buyerHub.clear(userId, taskId);

    return OpenDisputeResultSchema.parse({
      disputeId: created.id,
      taskId,
      status: 'OPEN',
      lifecycleStatus: 'DISPUTED',
    });
  }

  listBuyerNotices(userId: string): BuyerDeliveryNotice[] {
    return this.buyerHub.listPending(userId);
  }

  dismissBuyerNotice(userId: string, taskId: string): void {
    this.buyerHub.clear(userId, taskId);
  }

  listSellerAcceptanceNotices(userId: string): SellerAcceptanceNotice[] {
    return this.sellerAcceptanceHub.listPending(userId);
  }

  dismissSellerAcceptanceNotice(userId: string, taskId: string): void {
    this.sellerAcceptanceHub.clear(userId, taskId);
  }

  /** Si la ventana 30 m venció sin disputa → libera 96/4. */
  private async maybeExpireClaimWindow(taskId: string): Promise<void> {
    const order = await this.repo.findOrder(taskId);
    if (!order || order.lifecycleStatus !== 'FINAL_CLAIM_WINDOW_30M') return;

    const items = await this.repo.listByTask(taskId);
    const accepted = [...items]
      .reverse()
      .find((d) => d.reviewDecision === 'ACCEPTED_BY_BUYER' && d.reviewDecidedAt);
    if (!accepted?.reviewDecidedAt) return;

    const deadline = new Date(finalClaimDeadlineIso(accepted.reviewDecidedAt));
    if (Date.now() < deadline.getTime()) return;

    try {
      await this.escrow.simulateRelease(order.buyerId, taskId);
      this.sellerAcceptanceHub.clear(order.sellerId, taskId);
    } catch {
      /* escrow puede fallar si ya liberó; no tumbar getClock */
    }
  }

  async listAdminDisputes(userId: string): Promise<DisputeCaseListItem[]> {
    await this.requireAdmin(userId);
    const rows = await this.repo.listOpenDisputes();
    return rows.map((row) =>
      DisputeCaseListItemSchema.parse({
        disputeId: row.id,
        taskId: row.taskOrderId,
        title: row.title,
        claimReason: row.claimReason,
        openedAt: row.openedAt.toISOString(),
        buyerDisplayName: row.buyerDisplayName,
        sellerDisplayName: row.sellerDisplayName,
        status: 'OPEN',
      }),
    );
  }

  async getAdminDispute(userId: string, disputeId: string): Promise<DisputeCaseDetail> {
    await this.requireAdmin(userId);
    const row = await this.repo.findDispute(disputeId);
    if (!row) throw new DomainError(404, 'DISPUTE_NOT_FOUND');

    const deliverables = await this.repo.listByTask(row.taskOrderId);
    const messages = await this.repo.listWorkspaceMessages(row.taskOrderId);
    const decision =
      row.binaryResolution === 'BUYER_FULL_REFUND_100'
        ? 'BUYER_FULL_REFUND'
        : row.binaryResolution === 'SELLER_RELEASE_96_4'
          ? 'FREELANCER_SPLIT_96_4'
          : null;

    return DisputeCaseDetailSchema.parse({
      disputeId: row.id,
      taskId: row.taskOrderId,
      status: row.binaryResolution === 'PENDING' ? 'OPEN' : 'RESOLVED',
      decision,
      justification: row.resolutionJustification,
      claimReason: row.claimReason,
      openedAt: row.openedAt.toISOString(),
      resolvedAt: row.resolvedAt?.toISOString() ?? null,
      title: row.title,
      buyerDisplayName: row.buyerDisplayName,
      sellerDisplayName: row.sellerDisplayName,
      totalAmountUSDInCents: row.totalAmountUSDInCents,
      lifecycleStatus: row.lifecycleStatus,
      deliverables: deliverables.map((d) => ({
        deliverableId: d.id,
        revisionNumber: d.revisionNumber,
        fileName: d.fileName,
        previewUrl: `/api/v1/orders/${row.taskOrderId}/deliverables/${d.id}/preview/content`,
        previewStatus: d.previewStatus,
      })),
      messages: messages.map((m) => ({
        messageId: m.messageId,
        senderDisplayName: m.senderDisplayName,
        senderRole: m.senderRole,
        body: m.body,
        createdAt: m.createdAt.toISOString(),
      })),
    });
  }

  async resolveAdminDispute(userId: string, disputeId: string, body: unknown) {
    await this.requireAdmin(userId);
    const parsed = ResolveDisputeInputSchema.safeParse(body);
    if (!parsed.success) throw new DomainError(400, 'VALIDATION_ERROR');

    const row = await this.repo.findDispute(disputeId);
    if (!row) throw new DomainError(404, 'DISPUTE_NOT_FOUND');
    if (row.binaryResolution !== 'PENDING') throw new DomainError(409, 'DISPUTE_ALREADY_RESOLVED');

    const binaryResolution =
      parsed.data.decision === 'BUYER_FULL_REFUND' ? 'BUYER_FULL_REFUND_100' : 'SELLER_RELEASE_96_4';

    const resolved = await this.repo.resolveDispute({
      disputeId,
      adminReviewerId: userId,
      binaryResolution,
      justification: parsed.data.justification,
    });
    if (resolved === 'NOT_FOUND') throw new DomainError(404, 'DISPUTE_NOT_FOUND');
    if (resolved === 'ALREADY_RESOLVED') throw new DomainError(409, 'DISPUTE_ALREADY_RESOLVED');

    if (parsed.data.decision === 'BUYER_FULL_REFUND') {
      await this.escrow.simulateRefund(row.buyerId, row.taskOrderId);
    } else {
      await this.escrow.simulateRelease(row.sellerId, row.taskOrderId);
    }

    return this.getAdminDispute(userId, disputeId);
  }

  private async requireAdmin(userId: string): Promise<void> {
    const user = await this.identity.requireUser(userId);
    if (user.platformRole !== 'ADMIN') throw new DomainError(403, 'ADMIN_ONLY');
  }

  private isOriginalAvailable(lifecycle: string): boolean {
    if (ORIGINAL_UNLOCKED.has(lifecycle)) return true;
    if (ORIGINAL_LOCKED.has(lifecycle)) return false;
    if (lifecycle.startsWith('REFUNDED') || lifecycle.startsWith('AUTO_REFUNDED') || lifecycle === 'CANCELLED') {
      return false;
    }
    return false;
  }

  private async requireOrderParty(userId: string, taskId: string) {
    const order = await this.repo.findOrder(taskId);
    if (!order) throw new DomainError(404, 'ORDER_NOT_FOUND');
    if (order.buyerId !== userId && order.sellerId !== userId) {
      throw new DomainError(403, 'ORDER_FORBIDDEN');
    }
    return order;
  }

  private async requireDeliverable(taskId: string, deliverableId: string): Promise<StoredDeliverable> {
    const deliverable = await this.repo.findDeliverable(deliverableId);
    if (!deliverable || deliverable.taskOrderId !== taskId) {
      throw new DomainError(404, 'DELIVERABLE_NOT_FOUND');
    }
    return deliverable;
  }
}

function normalizeExt(ext: string): string {
  const trimmed = ext.trim().toLowerCase();
  return trimmed.startsWith('.') ? trimmed : `.${trimmed}`;
}
