import type { DeliverableMediaType, TaskCategory, TaskOrderCard } from '@taskstream/shared-schemas';

export type Criterion = {
  criterionId: string;
  description: string;
  isMandatory: boolean;
};

export type ProposalStatus = 'IN_NEGOTIATION' | 'AGREED_PATH_1' | 'DISCREPANCY_CLOSED_PATH_2';

export interface StoredNegotiationProposal {
  id: string;
  publicationId: string;
  buyerId: string;
  freelancerId: string;
  initialBudgetUSDInCents: number;
  proposedBudgetUSDInCents: number;
  proposedDeliveryDays: number;
  status: ProposalStatus;
  closedReason: string | null;
  createdAt: Date;
  closedAt: Date | null;
}

export interface StoredNegotiationMessage {
  id: string;
  proposalId: string;
  senderId: string;
  body: string;
  offeredAmountUSDInCents: number | null;
  offeredDeliveryDays: number | null;
  createdAt: Date;
}

export interface StoredTaskOrderRecord {
  id: string;
  buyerId: string;
  sellerId: string;
  gigId: string | null;
  proposalId: string | null;
  publicationId: string | null;
  title: string;
  scopeDescription: string;
  category: TaskCategory;
  expectedMediaType: DeliverableMediaType;
  initialDeliveryDays: number;
  lifecycleStatus: 'PENDING_ESCROW_FUNDING';
  acceptanceCriteria: Criterion[];
  allowedExtensions: string[];
  totalAmountUSDInCents: number;
  platformFeeUSDInCents: number;
  freelancerPayoutUSDInCents: number;
  buyerWalletAddress: string;
  buyerOriginCurrency: string;
  sellerWalletAddress: string;
  sellerTargetCurrency: string;
  escrowWalletAddress: string;
  platformOwnerWalletAddress: string;
  createdAt: Date;
}

export interface CreateProposalRecordInput {
  publicationId: string;
  buyerId: string;
  freelancerId: string;
  initialBudgetUSDInCents: number;
  proposedBudgetUSDInCents: number;
  proposedDeliveryDays: number;
  coverMessage: string;
}

export interface CreateOrderFromAgreementInput {
  buyerId: string;
  sellerId: string;
  gigId?: string;
  proposalId?: string;
  publicationId?: string;
  title: string;
  scopeDescription: string;
  category: TaskCategory;
  expectedMediaType: DeliverableMediaType;
  initialDeliveryDays: number;
  acceptanceCriteria: Criterion[];
  allowedExtensions: string[];
  totalAmountUSDInCents: number;
  buyerWallet: { id: string; walletAddressUrl: string; assetCode: string };
  sellerWallet: { id: string; walletAddressUrl: string; assetCode: string };
}

export interface NegotiationsRepository {
  createProposal(input: CreateProposalRecordInput): Promise<{
    proposal: StoredNegotiationProposal;
    message: StoredNegotiationMessage;
  }>;
  findProposalById(proposalId: string): Promise<StoredNegotiationProposal | null>;
  listProposalsByPublication(publicationId: string): Promise<StoredNegotiationProposal[]>;
  findActiveProposalForFreelancer(
    publicationId: string,
    freelancerId: string,
  ): Promise<StoredNegotiationProposal | null>;
  listMessages(proposalId: string): Promise<StoredNegotiationMessage[]>;
  addMessage(input: {
    proposalId: string;
    senderId: string;
    body: string;
    offeredAmountUSDInCents?: number;
    offeredDeliveryDays?: number;
  }): Promise<StoredNegotiationMessage>;
  updateProposalOffer(
    proposalId: string,
    proposedBudgetUSDInCents: number,
    proposedDeliveryDays?: number,
  ): Promise<StoredNegotiationProposal | null>;
  /**
   * Camino 1 atómico: bloquea publicación, acuerda propuesta, cierra competidoras, crea orden+ledger.
   * Retorna códigos de conflicto cuando aplica.
   */
  acceptPath1(input: {
    proposalId: string;
    actorUserId: string;
    expectedAmountUSDInCents: number;
    expectedDeliveryDays: number;
    order: CreateOrderFromAgreementInput;
  }): Promise<
    | { ok: true; proposal: StoredNegotiationProposal; order: StoredTaskOrderRecord }
    | {
        ok: false;
        reason:
          | 'PROPOSAL_NOT_FOUND'
          | 'PROPOSAL_NOT_IN_NEGOTIATION'
          | 'PUBLICATION_ALREADY_LOCKED'
          | 'OFFER_TERMS_CHANGED_CONFLICT'
          | 'FORBIDDEN';
      }
  >;
  closePath2(input: {
    proposalId: string;
    actorUserId: string;
    closedReason: string;
  }): Promise<
    | { ok: true; proposal: StoredNegotiationProposal; publicationStatus: 'OPEN_FOR_PROPOSALS' | 'AGREED_AND_LOCKED' | 'CANCELLED' }
    | { ok: false; reason: 'PROPOSAL_NOT_FOUND' | 'PROPOSAL_ALREADY_RESOLVED' | 'FORBIDDEN' }
  >;
  hireFixedGig(input: CreateOrderFromAgreementInput & { gigId: string }): Promise<StoredTaskOrderRecord>;
  findOrderById(taskId: string): Promise<StoredTaskOrderRecord | null>;
  toTaskOrderCard(order: StoredTaskOrderRecord): TaskOrderCard;
}
