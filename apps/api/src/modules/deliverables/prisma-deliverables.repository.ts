import { Inject, Injectable } from '@nestjs/common';
import {
  AiAdvisorReportSchema,
  MANDATORY_AI_DISCLAIMER,
  type AiAdvisorReport,
  type DeliverableMediaType,
  type TaskCategory,
} from '@taskstream/shared-schemas';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  DeliverablesRepository,
  OrderLifecycleForDeliverables,
  ReviewDecision,
  StoredDeliverable,
  StoredDisputeCase,
  StoredOrderForDeliverable,
} from './deliverables.types';

@Injectable()
export class PrismaDeliverablesRepository implements DeliverablesRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  private db() {
    if (!this.prisma.client) throw new Error('PRISMA_UNAVAILABLE');
    return this.prisma.client;
  }

  async findOrder(taskId: string): Promise<StoredOrderForDeliverable | null> {
    const row = await this.db().taskOrder.findUnique({
      where: { id: taskId },
      include: {
        technicalConstraint: true,
        acceptanceCriteria: { orderBy: { sortOrder: 'asc' } },
        buyer: { select: { displayName: true } },
        seller: { select: { displayName: true } },
        escrowLedger: { select: { fundsLockedAt: true, totalAmountUSDInCents: true } },
      },
    });
    if (!row) return null;
    return {
      taskId: row.id,
      buyerId: row.buyerId,
      sellerId: row.sellerId,
      lifecycleStatus: row.lifecycleStatus,
      expectedMediaType: row.expectedMediaType as DeliverableMediaType,
      category: row.category as TaskCategory,
      scopeDescription: row.scopeDescription,
      acceptanceCriteria: row.acceptanceCriteria.map((c) => ({
        criterionId: c.criterionCode,
        description: c.description,
        isMandatory: c.isMandatory,
      })),
      allowedExtensions: row.technicalConstraint?.allowedExtensions ?? [],
      title: row.title,
      buyerDisplayName: row.buyer.displayName,
      sellerDisplayName: row.seller.displayName,
      totalAmountUSDInCents: row.escrowLedger?.totalAmountUSDInCents ?? 0,
      fundsLockedAt: row.escrowLedger?.fundsLockedAt ?? null,
      initialDeliveryDays: row.initialDeliveryDays,
    };
  }

  async findDeliverable(deliverableId: string): Promise<StoredDeliverable | null> {
    const row = await this.db().taskDeliverable.findUnique({
      where: { id: deliverableId },
      include: { taskOrder: { select: { expectedMediaType: true } } },
    });
    if (!row) return null;
    return this.toStored(row);
  }

  async findByTaskAndRevision(taskId: string, revisionNumber: number): Promise<StoredDeliverable | null> {
    const row = await this.db().taskDeliverable.findUnique({
      where: { taskOrderId_revisionNumber: { taskOrderId: taskId, revisionNumber } },
      include: { taskOrder: { select: { expectedMediaType: true } } },
    });
    if (!row) return null;
    return this.toStored(row);
  }

  async listByTask(taskId: string): Promise<StoredDeliverable[]> {
    const rows = await this.db().taskDeliverable.findMany({
      where: { taskOrderId: taskId },
      include: { taskOrder: { select: { expectedMediaType: true } } },
      orderBy: { revisionNumber: 'asc' },
    });
    return rows.map((row) => this.toStored(row));
  }

  async countRevisionsUsed(taskId: string): Promise<number> {
    return this.db().taskDeliverable.count({
      where: { taskOrderId: taskId, reviewDecision: 'REVISION_REQUESTED' },
    });
  }

  async createPending(
    input: Omit<
      StoredDeliverable,
      'previewR2Key' | 'previewStatus' | 'contentUploaded' | 'submittedAt' | 'reviewDecision' | 'buyerRevisionNotes'
    > & { previewStatus?: StoredDeliverable['previewStatus'] },
  ): Promise<StoredDeliverable> {
    const created = await this.db().taskDeliverable.create({
      data: {
        id: input.id,
        taskOrderId: input.taskOrderId,
        revisionNumber: input.revisionNumber,
        originalR2Key: input.originalR2Key,
        fileName: input.fileName,
        mimeType: input.mimeType,
        fileExtension: input.fileExtension,
        fileSizeBytes: BigInt(input.fileSizeBytes),
        sha256Checksum: input.sha256Checksum,
        previewStatus: input.previewStatus ?? 'PENDING_PROCESSING',
      },
      include: { taskOrder: { select: { expectedMediaType: true } } },
    });
    return this.toStored(created);
  }

  async markContentUploaded(input: {
    deliverableId: string;
    fileSizeBytes: number;
    sha256Checksum: string;
  }): Promise<StoredDeliverable | 'NOT_FOUND'> {
    try {
      const updated = await this.db().taskDeliverable.update({
        where: { id: input.deliverableId },
        data: {
          fileSizeBytes: BigInt(input.fileSizeBytes),
          sha256Checksum: input.sha256Checksum,
        },
        include: { taskOrder: { select: { expectedMediaType: true } } },
      });
      return this.toStored(updated, true);
    } catch {
      return 'NOT_FOUND';
    }
  }

  async markPreviewResult(input: {
    deliverableId: string;
    previewR2Key: string | null;
    previewStatus: StoredDeliverable['previewStatus'];
  }): Promise<StoredDeliverable | 'NOT_FOUND'> {
    try {
      const updated = await this.db().taskDeliverable.update({
        where: { id: input.deliverableId },
        data: {
          previewR2Key: input.previewR2Key,
          previewStatus: input.previewStatus,
          submittedAt: new Date(),
        },
        include: { taskOrder: { select: { expectedMediaType: true } } },
      });
      return this.toStored(updated, true);
    } catch {
      return 'NOT_FOUND';
    }
  }

  async markReviewDecision(input: {
    deliverableId: string;
    reviewDecision: ReviewDecision;
    buyerRevisionNotes?: string | null;
  }): Promise<StoredDeliverable | 'NOT_FOUND'> {
    try {
      const updated = await this.db().taskDeliverable.update({
        where: { id: input.deliverableId },
        data: {
          reviewDecision: input.reviewDecision,
          buyerRevisionNotes: input.buyerRevisionNotes ?? undefined,
          reviewDecidedAt: new Date(),
        },
        include: { taskOrder: { select: { expectedMediaType: true } } },
      });
      return this.toStored(updated, true);
    } catch {
      return 'NOT_FOUND';
    }
  }

  async setOrderLifecycle(
    taskId: string,
    lifecycleStatus: OrderLifecycleForDeliverables,
  ): Promise<'OK' | 'NOT_FOUND'> {
    try {
      await this.db().taskOrder.update({
        where: { id: taskId },
        data: { lifecycleStatus: lifecycleStatus as never },
      });
      return 'OK';
    } catch {
      return 'NOT_FOUND';
    }
  }

  async createDispute(input: {
    id: string;
    taskOrderId: string;
    claimReason: string;
  }): Promise<StoredDisputeCase | 'ALREADY_OPEN' | 'ORDER_NOT_FOUND'> {
    const order = await this.db().taskOrder.findUnique({ where: { id: input.taskOrderId } });
    if (!order) return 'ORDER_NOT_FOUND';
    const existing = await this.db().disputeCase.findUnique({ where: { taskOrderId: input.taskOrderId } });
    if (existing) return 'ALREADY_OPEN';
    const created = await this.db().disputeCase.create({
      data: {
        id: input.id,
        taskOrderId: input.taskOrderId,
        originType: 'BUYER_MEDIATION_AFTER_2ND_REVISION',
        claimReason: input.claimReason,
      },
    });
    return this.toDispute(created);
  }

  async listOpenDisputes() {
    const rows = await this.db().disputeCase.findMany({
      where: { binaryResolution: 'PENDING' },
      include: {
        taskOrder: {
          include: {
            buyer: { select: { displayName: true } },
            seller: { select: { displayName: true } },
          },
        },
      },
      orderBy: { openedAt: 'desc' },
    });
    return rows.map((row) => ({
      ...this.toDispute(row),
      title: row.taskOrder.title,
      buyerDisplayName: row.taskOrder.buyer.displayName,
      sellerDisplayName: row.taskOrder.seller.displayName,
    }));
  }

  async findDispute(disputeId: string) {
    const row = await this.db().disputeCase.findUnique({
      where: { id: disputeId },
      include: {
        taskOrder: {
          include: {
            buyer: { select: { displayName: true } },
            seller: { select: { displayName: true } },
            escrowLedger: { select: { totalAmountUSDInCents: true } },
          },
        },
      },
    });
    if (!row) return null;
    return {
      ...this.toDispute(row),
      title: row.taskOrder.title,
      buyerDisplayName: row.taskOrder.buyer.displayName,
      sellerDisplayName: row.taskOrder.seller.displayName,
      buyerId: row.taskOrder.buyerId,
      sellerId: row.taskOrder.sellerId,
      totalAmountUSDInCents: row.taskOrder.escrowLedger?.totalAmountUSDInCents ?? 0,
      lifecycleStatus: row.taskOrder.lifecycleStatus,
    };
  }

  async resolveDispute(input: {
    disputeId: string;
    adminReviewerId: string;
    binaryResolution: 'BUYER_FULL_REFUND_100' | 'SELLER_RELEASE_96_4';
    justification: string;
  }): Promise<StoredDisputeCase | 'NOT_FOUND' | 'ALREADY_RESOLVED'> {
    const existing = await this.db().disputeCase.findUnique({ where: { id: input.disputeId } });
    if (!existing) return 'NOT_FOUND';
    if (existing.binaryResolution !== 'PENDING') return 'ALREADY_RESOLVED';
    const updated = await this.db().disputeCase.update({
      where: { id: input.disputeId },
      data: {
        binaryResolution: input.binaryResolution,
        resolutionJustification: input.justification,
        adminReviewerId: input.adminReviewerId,
        resolvedAt: new Date(),
      },
    });
    return this.toDispute(updated);
  }

  async listWorkspaceMessages(taskId: string) {
    const rows = await this.db().taskOrderChatMessage.findMany({
      where: { taskOrderId: taskId },
      include: { sender: { select: { displayName: true } } },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });
    const order = await this.db().taskOrder.findUnique({
      where: { id: taskId },
      select: { buyerId: true },
    });
    return rows.map((row) => ({
      messageId: row.id,
      senderDisplayName: row.sender.displayName,
      senderRole: (order?.buyerId === row.senderId ? 'buyer' : 'seller') as 'buyer' | 'seller',
      body: row.body,
      createdAt: row.createdAt,
    }));
  }

  private toDispute(row: {
    id: string;
    taskOrderId: string;
    claimReason: string;
    binaryResolution: string;
    resolutionJustification: string | null;
    openedAt: Date;
    resolvedAt: Date | null;
    adminReviewerId: string | null;
  }): StoredDisputeCase {
    return {
      id: row.id,
      taskOrderId: row.taskOrderId,
      claimReason: row.claimReason,
      binaryResolution: row.binaryResolution as StoredDisputeCase['binaryResolution'],
      resolutionJustification: row.resolutionJustification,
      openedAt: row.openedAt,
      resolvedAt: row.resolvedAt,
      adminReviewerId: row.adminReviewerId,
    };
  }

  async findAiReport(deliverableId: string): Promise<AiAdvisorReport | null> {
    const row = await this.db().aiAdvisorReport.findUnique({
      where: { deliverableId },
      include: {
        criteriaEvaluations: true,
        deliverable: { select: { taskOrderId: true, revisionNumber: true, taskOrder: { select: { expectedMediaType: true } } } },
      },
    });
    if (!row) return null;

    const modality =
      row.deliverable.taskOrder.expectedMediaType === 'IMAGE_RASTER_VECTOR'
        ? 'IMAGE'
        : row.deliverable.taskOrder.expectedMediaType === 'DOCUMENT_TEXT'
          ? 'TEXT'
          : null;
    if (!modality) return null;

    const criteria = await this.db().taskAcceptanceCriterion.findMany({
      where: { taskOrderId: row.deliverable.taskOrderId },
    });
    const codeById = new Map(criteria.map((c) => [c.id, c.criterionCode]));

    return AiAdvisorReportSchema.parse({
      taskId: row.deliverable.taskOrderId,
      deliverableId: row.deliverableId,
      revisionEvaluated: row.deliverable.revisionNumber,
      auditableModality: modality,
      advisoryScore: row.advisoryScore,
      advisoryLabel: row.advisoryLabel,
      executiveSummaryForBuyer: row.executiveSummaryForBuyer,
      suggestionsForFreelancer: row.suggestionsForFreelancer,
      criteriaEvaluation: row.criteriaEvaluations.map((ev) => ({
        criterionId: codeById.get(ev.criterionId) ?? ev.criterionId,
        status: ev.status,
        evidence: ev.evidence,
      })),
      securityAndIntegrityAudit: {
        promptInjectionDetected: row.promptInjectionDetected,
        emptyOrCorruptedFileDetected: row.emptyOrCorruptedFileDetected,
        deterministicCheckPassed: row.deterministicCheckPassed,
      },
      mandatoryDisclaimer: MANDATORY_AI_DISCLAIMER,
    });
  }

  async saveAiReport(report: AiAdvisorReport): Promise<'OK' | 'ALREADY_EXISTS' | 'NOT_FOUND'> {
    const deliverable = await this.db().taskDeliverable.findUnique({
      where: { id: report.deliverableId },
      select: { id: true, taskOrderId: true },
    });
    if (!deliverable) return 'NOT_FOUND';

    const existing = await this.db().aiAdvisorReport.findUnique({
      where: { deliverableId: report.deliverableId },
      select: { id: true },
    });
    if (existing) return 'ALREADY_EXISTS';

    const criteria = await this.db().taskAcceptanceCriterion.findMany({
      where: { taskOrderId: deliverable.taskOrderId },
    });
    const idByCode = new Map(criteria.map((c) => [c.criterionCode, c.id]));

    await this.db().aiAdvisorReport.create({
      data: {
        deliverableId: report.deliverableId,
        advisoryScore: report.advisoryScore,
        advisoryLabel: report.advisoryLabel,
        executiveSummaryForBuyer: report.executiveSummaryForBuyer,
        suggestionsForFreelancer: report.suggestionsForFreelancer,
        promptInjectionDetected: report.securityAndIntegrityAudit.promptInjectionDetected,
        emptyOrCorruptedFileDetected: report.securityAndIntegrityAudit.emptyOrCorruptedFileDetected,
        deterministicCheckPassed: report.securityAndIntegrityAudit.deterministicCheckPassed,
        criteriaEvaluations: {
          create: report.criteriaEvaluation
            .map((ev) => {
              const criterionId = idByCode.get(ev.criterionId);
              if (!criterionId) return null;
              return {
                criterionId,
                status: ev.status,
                evidence: ev.evidence.slice(0, 300),
              };
            })
            .filter((row): row is NonNullable<typeof row> => row !== null),
        },
      },
    });
    return 'OK';
  }

  private toStored(
    row: {
      id: string;
      taskOrderId: string;
      revisionNumber: number;
      originalR2Key: string;
      previewR2Key: string | null;
      fileName: string;
      mimeType: string;
      fileExtension: string;
      fileSizeBytes: bigint;
      sha256Checksum: string;
      previewStatus: string;
      submittedAt: Date;
      reviewDecision: string;
      reviewDecidedAt: Date | null;
      buyerRevisionNotes: string | null;
      taskOrder?: { expectedMediaType: string };
    },
    contentUploaded = Number(row.fileSizeBytes) > 0,
  ): StoredDeliverable {
    return {
      id: row.id,
      taskOrderId: row.taskOrderId,
      revisionNumber: row.revisionNumber,
      originalR2Key: row.originalR2Key,
      previewR2Key: row.previewR2Key,
      fileName: row.fileName,
      mimeType: row.mimeType,
      fileExtension: row.fileExtension,
      fileSizeBytes: Number(row.fileSizeBytes),
      sha256Checksum: row.sha256Checksum,
      previewStatus: row.previewStatus as StoredDeliverable['previewStatus'],
      mediaType: (row.taskOrder?.expectedMediaType ?? 'DOCUMENT_TEXT') as DeliverableMediaType,
      contentUploaded,
      submittedAt: row.submittedAt,
      reviewDecision: row.reviewDecision as ReviewDecision,
      reviewDecidedAt: row.reviewDecidedAt,
      buyerRevisionNotes: row.buyerRevisionNotes,
    };
  }
}
