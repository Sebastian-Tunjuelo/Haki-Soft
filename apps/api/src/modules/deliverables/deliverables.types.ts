import type {
  AiAdvisorReport,
  DeliverableMediaType,
  TaskCategory,
} from '@taskstream/shared-schemas';

export type PreviewStatus = 'PENDING_PROCESSING' | 'READY' | 'FAILED';
export type ReviewDecision =
  | 'PENDING_REVIEW'
  | 'ACCEPTED_BY_BUYER'
  | 'ACCEPTED_BY_TIMEOUT'
  | 'REVISION_REQUESTED'
  | 'MEDIATION_REQUESTED';

export type OrderLifecycleForDeliverables =
  | 'PENDING_ESCROW_FUNDING'
  | 'ESCROW_LOCKED'
  | 'EXTENSION_REQUESTED'
  | 'ESCROW_EXTENDED'
  | 'IN_REVIEW'
  | 'REVISION_REQUESTED'
  | 'FINAL_CLAIM_WINDOW_30M'
  | 'DISPUTED'
  | 'COMPLETED'
  | 'REFUNDED'
  | 'CANCELLED'
  | string;

export interface StoredAcceptanceCriterion {
  criterionId: string;
  description: string;
  isMandatory: boolean;
}

export interface StoredOrderForDeliverable {
  taskId: string;
  buyerId: string;
  sellerId: string;
  lifecycleStatus: OrderLifecycleForDeliverables;
  expectedMediaType: DeliverableMediaType;
  category: TaskCategory;
  scopeDescription: string;
  acceptanceCriteria: StoredAcceptanceCriterion[];
  allowedExtensions: string[];
  title: string;
  buyerDisplayName: string;
  sellerDisplayName: string;
  totalAmountUSDInCents: number;
  fundsLockedAt: Date | null;
  initialDeliveryDays: number;
}

export interface StoredDeliverable {
  id: string;
  taskOrderId: string;
  revisionNumber: number;
  originalR2Key: string;
  previewR2Key: string | null;
  fileName: string;
  mimeType: string;
  fileExtension: string;
  fileSizeBytes: number;
  sha256Checksum: string;
  previewStatus: PreviewStatus;
  mediaType: DeliverableMediaType;
  contentUploaded: boolean;
  submittedAt: Date;
  reviewDecision: ReviewDecision;
  reviewDecidedAt: Date | null;
  buyerRevisionNotes: string | null;
}

export interface StoredDisputeCase {
  id: string;
  taskOrderId: string;
  claimReason: string;
  binaryResolution: 'PENDING' | 'BUYER_FULL_REFUND_100' | 'SELLER_RELEASE_96_4';
  resolutionJustification: string | null;
  openedAt: Date;
  resolvedAt: Date | null;
  adminReviewerId: string | null;
}

export interface DeliverablesRepository {
  findOrder(taskId: string): Promise<StoredOrderForDeliverable | null>;
  findDeliverable(deliverableId: string): Promise<StoredDeliverable | null>;
  findByTaskAndRevision(taskId: string, revisionNumber: number): Promise<StoredDeliverable | null>;
  listByTask(taskId: string): Promise<StoredDeliverable[]>;
  countRevisionsUsed(taskId: string): Promise<number>;
  createPending(input: Omit<
    StoredDeliverable,
    | 'previewR2Key'
    | 'previewStatus'
    | 'contentUploaded'
    | 'submittedAt'
    | 'reviewDecision'
    | 'reviewDecidedAt'
    | 'buyerRevisionNotes'
  > & {
    previewStatus?: PreviewStatus;
  }): Promise<StoredDeliverable>;
  markContentUploaded(input: {
    deliverableId: string;
    fileSizeBytes: number;
    sha256Checksum: string;
  }): Promise<StoredDeliverable | 'NOT_FOUND'>;
  markPreviewResult(input: {
    deliverableId: string;
    previewR2Key: string | null;
    previewStatus: PreviewStatus;
  }): Promise<StoredDeliverable | 'NOT_FOUND'>;
  markReviewDecision(input: {
    deliverableId: string;
    reviewDecision: ReviewDecision;
    buyerRevisionNotes?: string | null;
  }): Promise<StoredDeliverable | 'NOT_FOUND'>;
  setOrderLifecycle(
    taskId: string,
    lifecycleStatus: OrderLifecycleForDeliverables,
  ): Promise<'OK' | 'NOT_FOUND'>;
  createDispute(input: {
    id: string;
    taskOrderId: string;
    claimReason: string;
  }): Promise<StoredDisputeCase | 'ALREADY_OPEN' | 'ORDER_NOT_FOUND'>;
  listOpenDisputes(): Promise<
    Array<
      StoredDisputeCase & {
        title: string;
        buyerDisplayName: string;
        sellerDisplayName: string;
      }
    >
  >;
  findDispute(disputeId: string): Promise<
    | (StoredDisputeCase & {
        title: string;
        buyerDisplayName: string;
        sellerDisplayName: string;
        buyerId: string;
        sellerId: string;
        totalAmountUSDInCents: number;
        lifecycleStatus: OrderLifecycleForDeliverables;
      })
    | null
  >;
  resolveDispute(input: {
    disputeId: string;
    adminReviewerId: string;
    binaryResolution: 'BUYER_FULL_REFUND_100' | 'SELLER_RELEASE_96_4';
    justification: string;
  }): Promise<StoredDisputeCase | 'NOT_FOUND' | 'ALREADY_RESOLVED'>;
  listWorkspaceMessages(taskId: string): Promise<
    Array<{
      messageId: string;
      senderDisplayName: string;
      senderRole: 'buyer' | 'seller';
      body: string;
      createdAt: Date;
    }>
  >;
  findAiReport(deliverableId: string): Promise<AiAdvisorReport | null>;
  saveAiReport(report: AiAdvisorReport): Promise<'OK' | 'ALREADY_EXISTS' | 'NOT_FOUND'>;
}
