import { randomUUID } from 'node:crypto';
import {
  ESCROW_WALLET_ADDRESS,
  PLATFORM_OWNER_WALLET_ADDRESS,
  resolveMvpAiAuditableModality,
  splitSingleBlockEscrow,
  TaskOrderCardSchema,
  type TaskOrderCard,
} from '@taskstream/shared-schemas';
import type { MarketplaceRepository } from '../marketplace/marketplace.types';
import type {
  CreateOrderFromAgreementInput,
  CreateProposalRecordInput,
  NegotiationsRepository,
  StoredNegotiationMessage,
  StoredNegotiationProposal,
  StoredTaskOrderRecord,
} from './negotiations.types';

interface MemoryState {
  proposals: StoredNegotiationProposal[];
  messages: StoredNegotiationMessage[];
  orders: StoredTaskOrderRecord[];
}

export class MemoryNegotiationsRepository implements NegotiationsRepository {
  private state: MemoryState = { proposals: [], messages: [], orders: [] };

  constructor(private readonly marketplace: MarketplaceRepository) {}

  reset(): void {
    this.state = { proposals: [], messages: [], orders: [] };
  }

  async createProposal(input: CreateProposalRecordInput) {
    const proposal: StoredNegotiationProposal = {
      id: randomUUID(),
      publicationId: input.publicationId,
      buyerId: input.buyerId,
      freelancerId: input.freelancerId,
      initialBudgetUSDInCents: input.initialBudgetUSDInCents,
      proposedBudgetUSDInCents: input.proposedBudgetUSDInCents,
      proposedDeliveryDays: input.proposedDeliveryDays,
      status: 'IN_NEGOTIATION',
      closedReason: null,
      createdAt: new Date(),
      closedAt: null,
    };
    const message: StoredNegotiationMessage = {
      id: randomUUID(),
      proposalId: proposal.id,
      senderId: input.freelancerId,
      body: input.coverMessage,
      offeredAmountUSDInCents: input.proposedBudgetUSDInCents,
      offeredDeliveryDays: input.proposedDeliveryDays,
      createdAt: new Date(),
    };
    this.state.proposals.push(proposal);
    this.state.messages.push(message);
    await this.marketplace.upsertProposalStub({
      id: proposal.id,
      publicationId: proposal.publicationId,
      status: 'IN_NEGOTIATION',
    });
    return { proposal: { ...proposal }, message: { ...message } };
  }

  async findProposalById(proposalId: string) {
    const proposal = this.state.proposals.find((item) => item.id === proposalId);
    return proposal ? { ...proposal } : null;
  }

  async listProposalsByPublication(publicationId: string) {
    return this.state.proposals
      .filter((item) => item.publicationId === publicationId)
      .map((item) => ({ ...item }))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async findActiveProposalForFreelancer(publicationId: string, freelancerId: string) {
    const proposal = this.state.proposals.find(
      (item) =>
        item.publicationId === publicationId &&
        item.freelancerId === freelancerId &&
        (item.status === 'IN_NEGOTIATION' || item.status === 'AGREED_PATH_1'),
    );
    return proposal ? { ...proposal } : null;
  }

  async listMessages(proposalId: string) {
    return this.state.messages
      .filter((item) => item.proposalId === proposalId)
      .map((item) => ({ ...item }))
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async addMessage(input: {
    proposalId: string;
    senderId: string;
    body: string;
    offeredAmountUSDInCents?: number;
    offeredDeliveryDays?: number;
  }) {
    const message: StoredNegotiationMessage = {
      id: randomUUID(),
      proposalId: input.proposalId,
      senderId: input.senderId,
      body: input.body,
      offeredAmountUSDInCents: input.offeredAmountUSDInCents ?? null,
      offeredDeliveryDays: input.offeredDeliveryDays ?? null,
      createdAt: new Date(),
    };
    this.state.messages.push(message);
    return { ...message };
  }

  async updateProposalOffer(
    proposalId: string,
    proposedBudgetUSDInCents: number,
    proposedDeliveryDays?: number,
  ) {
    const proposal = this.state.proposals.find((item) => item.id === proposalId);
    if (!proposal) return null;
    proposal.proposedBudgetUSDInCents = proposedBudgetUSDInCents;
    if (proposedDeliveryDays !== undefined) proposal.proposedDeliveryDays = proposedDeliveryDays;
    return { ...proposal };
  }

  async acceptPath1(input: {
    proposalId: string;
    actorUserId: string;
    expectedAmountUSDInCents: number;
    expectedDeliveryDays: number;
    order: CreateOrderFromAgreementInput;
  }) {
    const proposal = this.state.proposals.find((item) => item.id === input.proposalId);
    if (!proposal) return { ok: false as const, reason: 'PROPOSAL_NOT_FOUND' as const };
    if (proposal.buyerId !== input.actorUserId && proposal.freelancerId !== input.actorUserId) {
      return { ok: false as const, reason: 'FORBIDDEN' as const };
    }
    if (proposal.status !== 'IN_NEGOTIATION') {
      return { ok: false as const, reason: 'PROPOSAL_NOT_IN_NEGOTIATION' as const };
    }
    if (
      proposal.proposedBudgetUSDInCents !== input.expectedAmountUSDInCents ||
      proposal.proposedDeliveryDays !== input.expectedDeliveryDays
    ) {
      return { ok: false as const, reason: 'OFFER_TERMS_CHANGED_CONFLICT' as const };
    }

    const locked = await this.marketplace.markPublicationAgreedAndLocked(proposal.publicationId);
    if (locked === 'NOT_FOUND') return { ok: false as const, reason: 'PROPOSAL_NOT_FOUND' as const };
    if (locked === 'NOT_OPEN') return { ok: false as const, reason: 'PUBLICATION_ALREADY_LOCKED' as const };

    proposal.status = 'AGREED_PATH_1';
    proposal.closedAt = new Date();
    await this.marketplace.upsertProposalStub({
      id: proposal.id,
      publicationId: proposal.publicationId,
      status: 'AGREED_PATH_1',
    });

    for (const other of this.state.proposals) {
      if (
        other.publicationId === proposal.publicationId &&
        other.id !== proposal.id &&
        other.status === 'IN_NEGOTIATION'
      ) {
        other.status = 'DISCREPANCY_CLOSED_PATH_2';
        other.closedReason = 'OTHER_PROPOSAL_ACCEPTED';
        other.closedAt = new Date();
        await this.marketplace.upsertProposalStub({
          id: other.id,
          publicationId: other.publicationId,
          status: 'DISCREPANCY_CLOSED_PATH_2',
          closedReason: 'OTHER_PROPOSAL_ACCEPTED',
        });
      }
    }

    const order = this.buildOrder({
      ...input.order,
      proposalId: proposal.id,
      publicationId: proposal.publicationId,
      totalAmountUSDInCents: proposal.proposedBudgetUSDInCents,
      initialDeliveryDays: proposal.proposedDeliveryDays,
    });
    this.state.orders.push(order);
    return { ok: true as const, proposal: { ...proposal }, order };
  }

  async closePath2(input: { proposalId: string; actorUserId: string; closedReason: string }) {
    const proposal = this.state.proposals.find((item) => item.id === input.proposalId);
    if (!proposal) return { ok: false as const, reason: 'PROPOSAL_NOT_FOUND' as const };
    if (proposal.buyerId !== input.actorUserId && proposal.freelancerId !== input.actorUserId) {
      return { ok: false as const, reason: 'FORBIDDEN' as const };
    }
    if (proposal.status !== 'IN_NEGOTIATION') {
      return { ok: false as const, reason: 'PROPOSAL_ALREADY_RESOLVED' as const };
    }
    proposal.status = 'DISCREPANCY_CLOSED_PATH_2';
    proposal.closedReason = input.closedReason.slice(0, 250);
    proposal.closedAt = new Date();
    await this.marketplace.upsertProposalStub({
      id: proposal.id,
      publicationId: proposal.publicationId,
      status: 'DISCREPANCY_CLOSED_PATH_2',
      closedReason: proposal.closedReason,
    });
    const publication = await this.marketplace.findPublicationById(proposal.publicationId);
    return {
      ok: true as const,
      proposal: { ...proposal },
      publicationStatus: (publication?.status ?? 'OPEN_FOR_PROPOSALS') as
        | 'OPEN_FOR_PROPOSALS'
        | 'AGREED_AND_LOCKED'
        | 'CANCELLED',
    };
  }

  async hireFixedGig(input: CreateOrderFromAgreementInput & { gigId: string }) {
    const order = this.buildOrder({ ...input, gigId: input.gigId, proposalId: undefined });
    this.state.orders.push(order);
    return order;
  }

  async findOrderById(taskId: string) {
    const order = this.state.orders.find((item) => item.id === taskId);
    return order ? { ...order } : null;
  }

  toTaskOrderCard(order: StoredTaskOrderRecord): TaskOrderCard {
    const modality = resolveMvpAiAuditableModality(order.expectedMediaType);
    return TaskOrderCardSchema.parse({
      taskId: order.id,
      ...(order.gigId ? { gigId: order.gigId } : {}),
      ...(order.proposalId ? { proposalId: order.proposalId } : {}),
      ...(order.publicationId ? { publicationId: order.publicationId } : {}),
      title: order.title,
      category: order.category,
      expectedMediaType: order.expectedMediaType,
      ...(modality ? { aiAuditableModality: modality } : {}),
      lifecycleStatus: order.lifecycleStatus,
      buyer: {
        userId: order.buyerId,
        walletAddress: order.buyerWalletAddress,
        originCurrency: order.buyerOriginCurrency,
      },
      seller: {
        userId: order.sellerId,
        walletAddress: order.sellerWalletAddress,
        targetCurrency: order.sellerTargetCurrency,
      },
      paymentTerms: {
        paymentModality: 'SINGLE_BLOCK_ESCROW',
        escrowWalletAddress: order.escrowWalletAddress,
        platformOwnerWalletAddress: order.platformOwnerWalletAddress,
        totalAmountUSDInCents: order.totalAmountUSDInCents,
        freelancerPayoutUSDInCents: order.freelancerPayoutUSDInCents,
        platformFeeUSDInCents: order.platformFeeUSDInCents,
        buyerAssumesDoubleFxConversion: true,
        deliveryReviewHours: 32,
        finalClaimWindowMinutes: 30,
      },
      executionDeadlineTerms: {
        initialDeliveryDays: order.initialDeliveryDays,
        maxExtensionExtraDays: 7,
        maxExtensionsPerOrder: 1,
        extensionOnlyAllowedWhenInitialDeadlineExpires: true,
        buyerExtensionResponseWindowHours: 24,
        autoRefundIfNoExtensionRequestedOnExpiry: true,
        autoRefundOnExtensionResponseTimeout: true,
        autoRefundOnExtendedDeadlineMissed: true,
        refundTerminatesActivityAndUnbindsFreelancer: true,
      },
      revisionTerms: {
        maxRevisionsAllowed: 2,
        revisionsUsed: 0,
        arbitrationAuthorityOnDispute: 'PLATFORM_ADMIN',
        adminDecisionModality: 'STRICT_BINARY_JUSTIFIED',
      },
      acceptanceCriteria: order.acceptanceCriteria,
      technicalConstraints: {
        allowedExtensions: order.allowedExtensions,
        maxFileSizeBytes: null,
      },
    });
  }

  private buildOrder(input: CreateOrderFromAgreementInput): StoredTaskOrderRecord {
    const split = splitSingleBlockEscrow(input.totalAmountUSDInCents);
    return {
      id: randomUUID(),
      buyerId: input.buyerId,
      sellerId: input.sellerId,
      gigId: input.gigId ?? null,
      proposalId: input.proposalId ?? null,
      publicationId: input.publicationId ?? null,
      title: input.title,
      scopeDescription: input.scopeDescription,
      category: input.category,
      expectedMediaType: input.expectedMediaType,
      initialDeliveryDays: input.initialDeliveryDays,
      lifecycleStatus: 'PENDING_ESCROW_FUNDING',
      acceptanceCriteria: input.acceptanceCriteria.map((item) => ({ ...item })),
      allowedExtensions: [...input.allowedExtensions],
      totalAmountUSDInCents: input.totalAmountUSDInCents,
      platformFeeUSDInCents: split.platformFeeUSDInCents,
      freelancerPayoutUSDInCents: split.freelancerPayoutUSDInCents,
      buyerWalletAddress: input.buyerWallet.walletAddressUrl,
      buyerOriginCurrency: input.buyerWallet.assetCode.slice(0, 3).toUpperCase(),
      sellerWalletAddress: input.sellerWallet.walletAddressUrl,
      sellerTargetCurrency: input.sellerWallet.assetCode.slice(0, 3).toUpperCase(),
      escrowWalletAddress: ESCROW_WALLET_ADDRESS,
      platformOwnerWalletAddress: PLATFORM_OWNER_WALLET_ADDRESS,
      createdAt: new Date(),
    };
  }
}
