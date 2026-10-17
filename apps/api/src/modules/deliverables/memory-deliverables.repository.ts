import type { AiAdvisorReport, TaskCategory } from '@taskstream/shared-schemas';
import type {
  DeliverablesRepository,
  OrderLifecycleForDeliverables,
  ReviewDecision,
  StoredDeliverable,
  StoredDisputeCase,
  StoredOrderForDeliverable,
} from './deliverables.types';

function categoryForMedia(media: StoredOrderForDeliverable['expectedMediaType']): TaskCategory {
  switch (media) {
    case 'IMAGE_RASTER_VECTOR':
      return 'GRAPHICS_AND_DESIGN';
    case 'DOCUMENT_TEXT':
      return 'TECHNICAL_WRITING_TRANS';
    case 'VIDEO_STREAM':
      return 'VIDEO_AND_ANIMATION';
    case 'AUDIO_TRACK':
      return 'MUSIC_AND_AUDIO';
    case 'CODE_ARCHIVE':
      return 'PROGRAMMING_AND_TECH';
    case 'DATA_CAMPAIGN':
      return 'DIGITAL_MARKETING';
    default:
      return 'GRAPHICS_AND_DESIGN';
  }
}

export class MemoryDeliverablesRepository implements DeliverablesRepository {
  private orders = new Map<string, StoredOrderForDeliverable>();
  private deliverables = new Map<string, StoredDeliverable>();
  private disputes = new Map<string, StoredDisputeCase>();
  private aiReports = new Map<string, AiAdvisorReport>();
  private messages = new Map<
    string,
    Array<{
      messageId: string;
      senderDisplayName: string;
      senderRole: 'buyer' | 'seller';
      body: string;
      createdAt: Date;
    }>
  >();

  reset(): void {
    this.orders.clear();
    this.deliverables.clear();
    this.disputes.clear();
    this.aiReports.clear();
    this.messages.clear();
  }

  seedOrder(order: Partial<StoredOrderForDeliverable> & Pick<StoredOrderForDeliverable, 'taskId' | 'buyerId' | 'sellerId' | 'lifecycleStatus' | 'expectedMediaType' | 'allowedExtensions'>): void {
    this.orders.set(order.taskId, {
      title: order.title ?? 'Orden',
      buyerDisplayName: order.buyerDisplayName ?? 'Buyer',
      sellerDisplayName: order.sellerDisplayName ?? 'Seller',
      totalAmountUSDInCents: order.totalAmountUSDInCents ?? 1000,
      fundsLockedAt: order.fundsLockedAt ?? new Date(),
      initialDeliveryDays: order.initialDeliveryDays ?? 7,
      taskId: order.taskId,
      buyerId: order.buyerId,
      sellerId: order.sellerId,
      lifecycleStatus: order.lifecycleStatus,
      expectedMediaType: order.expectedMediaType,
      category: order.category ?? categoryForMedia(order.expectedMediaType),
      scopeDescription: order.scopeDescription ?? 'Entregar el trabajo acordado con calidad profesional.',
      acceptanceCriteria: order.acceptanceCriteria ?? [
        {
          criterionId: 'scope-default',
          description: 'Cumplir el alcance acordado en la orden de trabajo.',
          isMandatory: true,
        },
      ],
      allowedExtensions: order.allowedExtensions,
    });
  }

  async findOrder(taskId: string): Promise<StoredOrderForDeliverable | null> {
    const row = this.orders.get(taskId);
    return row ? { ...row } : null;
  }

  async findDeliverable(deliverableId: string): Promise<StoredDeliverable | null> {
    const row = this.deliverables.get(deliverableId);
    return row ? { ...row } : null;
  }

  async findByTaskAndRevision(taskId: string, revisionNumber: number): Promise<StoredDeliverable | null> {
    for (const row of this.deliverables.values()) {
      if (row.taskOrderId === taskId && row.revisionNumber === revisionNumber) return { ...row };
    }
    return null;
  }

  async listByTask(taskId: string): Promise<StoredDeliverable[]> {
    return [...this.deliverables.values()]
      .filter((row) => row.taskOrderId === taskId)
      .sort((a, b) => a.revisionNumber - b.revisionNumber)
      .map((row) => ({ ...row }));
  }

  async countRevisionsUsed(taskId: string): Promise<number> {
    return [...this.deliverables.values()].filter(
      (row) => row.taskOrderId === taskId && row.reviewDecision === 'REVISION_REQUESTED',
    ).length;
  }

  async createPending(
    input: Omit<
      StoredDeliverable,
      | 'previewR2Key'
      | 'previewStatus'
      | 'contentUploaded'
      | 'submittedAt'
      | 'reviewDecision'
      | 'reviewDecidedAt'
      | 'buyerRevisionNotes'
    > & { previewStatus?: StoredDeliverable['previewStatus'] },
  ): Promise<StoredDeliverable> {
    const row: StoredDeliverable = {
      ...input,
      previewR2Key: null,
      previewStatus: input.previewStatus ?? 'PENDING_PROCESSING',
      contentUploaded: false,
      submittedAt: new Date(),
      reviewDecision: 'PENDING_REVIEW',
      reviewDecidedAt: null,
      buyerRevisionNotes: null,
    };
    this.deliverables.set(row.id, row);
    return { ...row };
  }

  async markContentUploaded(input: {
    deliverableId: string;
    fileSizeBytes: number;
    sha256Checksum: string;
  }): Promise<StoredDeliverable | 'NOT_FOUND'> {
    const row = this.deliverables.get(input.deliverableId);
    if (!row) return 'NOT_FOUND';
    row.fileSizeBytes = input.fileSizeBytes;
    row.sha256Checksum = input.sha256Checksum;
    row.contentUploaded = true;
    return { ...row };
  }

  async markPreviewResult(input: {
    deliverableId: string;
    previewR2Key: string | null;
    previewStatus: StoredDeliverable['previewStatus'];
  }): Promise<StoredDeliverable | 'NOT_FOUND'> {
    const row = this.deliverables.get(input.deliverableId);
    if (!row) return 'NOT_FOUND';
    row.previewR2Key = input.previewR2Key;
    row.previewStatus = input.previewStatus;
    row.submittedAt = new Date();
    return { ...row };
  }

  async markReviewDecision(input: {
    deliverableId: string;
    reviewDecision: ReviewDecision;
    buyerRevisionNotes?: string | null;
  }): Promise<StoredDeliverable | 'NOT_FOUND'> {
    const row = this.deliverables.get(input.deliverableId);
    if (!row) return 'NOT_FOUND';
    row.reviewDecision = input.reviewDecision;
    row.reviewDecidedAt = new Date();
    if (input.buyerRevisionNotes !== undefined) row.buyerRevisionNotes = input.buyerRevisionNotes;
    return { ...row };
  }

  async setOrderLifecycle(
    taskId: string,
    lifecycleStatus: OrderLifecycleForDeliverables,
  ): Promise<'OK' | 'NOT_FOUND'> {
    const order = this.orders.get(taskId);
    if (!order) return 'NOT_FOUND';
    order.lifecycleStatus = lifecycleStatus;
    return 'OK';
  }

  async createDispute(input: {
    id: string;
    taskOrderId: string;
    claimReason: string;
  }): Promise<StoredDisputeCase | 'ALREADY_OPEN' | 'ORDER_NOT_FOUND'> {
    if (!this.orders.has(input.taskOrderId)) return 'ORDER_NOT_FOUND';
    for (const d of this.disputes.values()) {
      if (d.taskOrderId === input.taskOrderId && d.binaryResolution === 'PENDING') return 'ALREADY_OPEN';
    }
    const row: StoredDisputeCase = {
      id: input.id,
      taskOrderId: input.taskOrderId,
      claimReason: input.claimReason,
      binaryResolution: 'PENDING',
      resolutionJustification: null,
      openedAt: new Date(),
      resolvedAt: null,
      adminReviewerId: null,
    };
    this.disputes.set(row.id, row);
    return { ...row };
  }

  async listOpenDisputes() {
    return [...this.disputes.values()]
      .filter((d) => d.binaryResolution === 'PENDING')
      .map((d) => {
        const order = this.orders.get(d.taskOrderId)!;
        return {
          ...d,
          title: order.title,
          buyerDisplayName: order.buyerDisplayName,
          sellerDisplayName: order.sellerDisplayName,
        };
      });
  }

  async findDispute(disputeId: string) {
    const d = this.disputes.get(disputeId);
    if (!d) return null;
    const order = this.orders.get(d.taskOrderId);
    if (!order) return null;
    return {
      ...d,
      title: order.title,
      buyerDisplayName: order.buyerDisplayName,
      sellerDisplayName: order.sellerDisplayName,
      buyerId: order.buyerId,
      sellerId: order.sellerId,
      totalAmountUSDInCents: order.totalAmountUSDInCents,
      lifecycleStatus: order.lifecycleStatus,
    };
  }

  async resolveDispute(input: {
    disputeId: string;
    adminReviewerId: string;
    binaryResolution: 'BUYER_FULL_REFUND_100' | 'SELLER_RELEASE_96_4';
    justification: string;
  }): Promise<StoredDisputeCase | 'NOT_FOUND' | 'ALREADY_RESOLVED'> {
    const d = this.disputes.get(input.disputeId);
    if (!d) return 'NOT_FOUND';
    if (d.binaryResolution !== 'PENDING') return 'ALREADY_RESOLVED';
    d.binaryResolution = input.binaryResolution;
    d.resolutionJustification = input.justification;
    d.adminReviewerId = input.adminReviewerId;
    d.resolvedAt = new Date();
    return { ...d };
  }

  async listWorkspaceMessages(taskId: string) {
    return [...(this.messages.get(taskId) ?? [])];
  }

  async findAiReport(deliverableId: string): Promise<AiAdvisorReport | null> {
    const row = this.aiReports.get(deliverableId);
    return row ? { ...row } : null;
  }

  async saveAiReport(report: AiAdvisorReport): Promise<'OK' | 'ALREADY_EXISTS' | 'NOT_FOUND'> {
    if (!this.deliverables.has(report.deliverableId)) return 'NOT_FOUND';
    if (this.aiReports.has(report.deliverableId)) return 'ALREADY_EXISTS';
    this.aiReports.set(report.deliverableId, { ...report });
    return 'OK';
  }
}
