import { Inject, Injectable } from '@nestjs/common';
import {
  AcceptProposalPath1InputSchema,
  CloseProposalPath2InputSchema,
  CreateNegotiationProposalInputSchema,
  ESCROW_WALLET_ADDRESS,
  HireFixedGigInputSchema,
  PLATFORM_OWNER_WALLET_ADDRESS,
  SendNegotiationMessageInputSchema,
  type AcceptPath1Result,
  type ClosePath2Result,
  type DeliverableMediaType,
  type HireFixedGigResult,
  type NegotiationInboxItem,
  type NegotiationMessageView,
  type NegotiationProposalDetail,
  type TaskCategory,
} from '@taskstream/shared-schemas';
import { EscrowService } from '../escrow/escrow.service';
import { DomainError } from '../identity/domain-error';
import { IDENTITY_REPOSITORY } from '../identity/identity.tokens';
import type { IdentityRepository } from '../identity/identity.types';
import { IdempotencyStore } from '../marketplace/idempotency.store';
import { MARKETPLACE_REPOSITORY } from '../marketplace/marketplace.tokens';
import type { MarketplaceRepository } from '../marketplace/marketplace.types';
import { NEGOTIATIONS_REPOSITORY } from './negotiations.tokens';
import type { NegotiationsRepository } from './negotiations.types';

@Injectable()
export class NegotiationsService {
  constructor(
    @Inject(NEGOTIATIONS_REPOSITORY) private readonly negotiations: NegotiationsRepository,
    @Inject(MARKETPLACE_REPOSITORY) private readonly marketplace: MarketplaceRepository,
    @Inject(IDENTITY_REPOSITORY) private readonly identity: IdentityRepository,
    @Inject(IdempotencyStore) private readonly idempotency: IdempotencyStore,
    @Inject(EscrowService) private readonly escrow: EscrowService,
  ) {}

  async createProposal(userId: string, body: unknown, idempotencyKey?: string) {
    const input = CreateNegotiationProposalInputSchema.safeParse(body);
    if (!input.success) throw new DomainError(400, 'VALIDATION_ERROR');

    const key = idempotencyKey ?? randomKey();
    const cached = this.idempotency.get(`neg:proposal:${userId}`, key);
    if (cached) return cached.response;

    const publication = await this.marketplace.findPublicationById(input.data.publicationId);
    if (!publication || publication.status !== 'OPEN_FOR_PROPOSALS') {
      throw new DomainError(409, 'PUBLICATION_NOT_OPEN');
    }
    if (publication.buyerId === userId) throw new DomainError(403, 'SELF_DEALING_FORBIDDEN');
    if (input.data.proposedBudgetUSDInCents > publication.initialBudgetUSDInCents) {
      throw new DomainError(400, 'OFFER_EXCEEDS_INITIAL_BUDGET');
    }

    const existing = await this.negotiations.findActiveProposalForFreelancer(publication.id, userId);
    if (existing) throw new DomainError(409, 'ACTIVE_PROPOSAL_ALREADY_EXISTS');

    const { proposal, message } = await this.negotiations.createProposal({
      publicationId: publication.id,
      buyerId: publication.buyerId,
      freelancerId: userId,
      initialBudgetUSDInCents: publication.initialBudgetUSDInCents,
      proposedBudgetUSDInCents: input.data.proposedBudgetUSDInCents,
      proposedDeliveryDays: input.data.proposedDeliveryDays,
      coverMessage: input.data.coverMessage,
    });

    const response = {
      proposalId: proposal.id,
      publicationId: proposal.publicationId,
      buyerUserId: proposal.buyerId,
      freelancerUserId: proposal.freelancerId,
      initialBudgetUSDInCents: proposal.initialBudgetUSDInCents,
      proposedBudgetUSDInCents: proposal.proposedBudgetUSDInCents,
      proposedDeliveryDays: proposal.proposedDeliveryDays,
      status: proposal.status,
      firstMessage: this.toMessageView(message),
    };
    this.idempotency.set(`neg:proposal:${userId}`, key, 201, response);
    return response;
  }

  async listInbox(userId: string, publicationId: string): Promise<NegotiationInboxItem[]> {
    const publication = await this.marketplace.findPublicationById(publicationId);
    if (!publication) throw new DomainError(404, 'PUBLICATION_NOT_FOUND');
    if (publication.buyerId !== userId) throw new DomainError(403, 'FORBIDDEN_PUBLICATION_INBOX');

    const proposals = await this.negotiations.listProposalsByPublication(publicationId);
    const items: NegotiationInboxItem[] = [];
    for (const proposal of proposals) {
      const seller = await this.marketplace.findSellerProfile(proposal.freelancerId);
      const user = await this.identity.findUserById(proposal.freelancerId);
      const wallet = await this.identity.findActiveWallet(proposal.freelancerId);
      items.push({
        proposalId: proposal.id,
        publicationId: proposal.publicationId,
        buyerUserId: proposal.buyerId,
        freelancerUserId: proposal.freelancerId,
        initialBudgetUSDInCents: proposal.initialBudgetUSDInCents,
        proposedBudgetUSDInCents: proposal.proposedBudgetUSDInCents,
        proposedDeliveryDays: proposal.proposedDeliveryDays,
        status: proposal.status,
        createdAt: proposal.createdAt.toISOString(),
        freelancerDisplayName: seller?.displayName ?? user?.displayName ?? 'Freelancer',
        freelancerHeadline: seller?.headline ?? null,
        freelancerTargetCurrency:
          seller?.targetCurrency ?? wallet?.assetCode?.slice(0, 3).toUpperCase() ?? 'USD',
        hasVerifiedWallet: Boolean(wallet?.isVerified && wallet.isActive),
      });
    }
    return items;
  }

  async getProposal(userId: string, proposalId: string): Promise<NegotiationProposalDetail> {
    const proposal = await this.negotiations.findProposalById(proposalId);
    if (!proposal) throw new DomainError(404, 'PROPOSAL_NOT_FOUND');
    if (proposal.buyerId !== userId && proposal.freelancerId !== userId) {
      throw new DomainError(403, 'PROPOSAL_ACCESS_FORBIDDEN');
    }
    const messages = await this.negotiations.listMessages(proposalId);
    const seller = await this.marketplace.findSellerProfile(proposal.freelancerId);
    return {
      proposalId: proposal.id,
      publicationId: proposal.publicationId,
      buyerUserId: proposal.buyerId,
      freelancerUserId: proposal.freelancerId,
      initialBudgetUSDInCents: proposal.initialBudgetUSDInCents,
      proposedBudgetUSDInCents: proposal.proposedBudgetUSDInCents,
      proposedDeliveryDays: proposal.proposedDeliveryDays,
      status: proposal.status,
      closedReason: proposal.closedReason,
      closedAt: proposal.closedAt?.toISOString() ?? null,
      createdAt: proposal.createdAt.toISOString(),
      messages: messages.map((item) => this.toMessageView(item)),
      freelancerDisplayName: seller?.displayName,
      freelancerHeadline: seller?.headline ?? null,
      freelancerTargetCurrency: seller?.targetCurrency,
    };
  }

  async sendMessage(userId: string, proposalId: string, body: unknown, idempotencyKey?: string) {
    const input = SendNegotiationMessageInputSchema.safeParse({
      ...(typeof body === 'object' && body ? body : {}),
      proposalId,
    });
    if (!input.success) throw new DomainError(400, 'VALIDATION_ERROR');

    const key = idempotencyKey ?? randomKey();
    const cached = this.idempotency.get(`neg:msg:${userId}`, key);
    if (cached) return cached.response;

    const proposal = await this.negotiations.findProposalById(proposalId);
    if (!proposal) throw new DomainError(404, 'PROPOSAL_NOT_FOUND');
    if (proposal.buyerId !== userId && proposal.freelancerId !== userId) {
      throw new DomainError(403, 'PROPOSAL_ACCESS_FORBIDDEN');
    }
    if (proposal.status !== 'IN_NEGOTIATION') {
      throw new DomainError(409, 'PROPOSAL_NOT_IN_NEGOTIATION');
    }

    if (
      input.data.offeredAmountUSDInCents !== undefined &&
      input.data.offeredAmountUSDInCents > proposal.initialBudgetUSDInCents
    ) {
      throw new DomainError(400, 'OFFER_EXCEEDS_INITIAL_BUDGET');
    }

    const message = await this.negotiations.addMessage({
      proposalId,
      senderId: userId,
      body: input.data.body,
      offeredAmountUSDInCents: input.data.offeredAmountUSDInCents,
      offeredDeliveryDays: input.data.offeredDeliveryDays,
    });

    if (input.data.offeredAmountUSDInCents !== undefined) {
      await this.negotiations.updateProposalOffer(
        proposalId,
        input.data.offeredAmountUSDInCents,
        input.data.offeredDeliveryDays,
      );
    }

    const response = this.toMessageView(message);
    this.idempotency.set(`neg:msg:${userId}`, key, 201, response);
    return response;
  }

  async acceptPath1(
    userId: string,
    proposalId: string,
    body: unknown,
    idempotencyKey?: string,
  ): Promise<AcceptPath1Result> {
    const input = AcceptProposalPath1InputSchema.safeParse({
      ...(typeof body === 'object' && body ? body : {}),
      proposalId,
    });
    if (!input.success) throw new DomainError(400, 'VALIDATION_ERROR');

    const key = idempotencyKey ?? randomKey();
    const cached = this.idempotency.get(`neg:accept:${userId}`, key);
    if (cached) return cached.response as AcceptPath1Result;

    const proposal = await this.negotiations.findProposalById(proposalId);
    if (!proposal) throw new DomainError(404, 'PROPOSAL_NOT_FOUND');
    if (proposal.buyerId !== userId) throw new DomainError(403, 'FORBIDDEN_PROPOSAL_ACCEPTANCE');
    if (proposal.status !== 'IN_NEGOTIATION') {
      throw new DomainError(409, 'PROPOSAL_NOT_IN_NEGOTIATION');
    }

    const publication = await this.marketplace.findPublicationById(proposal.publicationId);
    if (!publication) throw new DomainError(404, 'PUBLICATION_NOT_FOUND');

    const buyerWallet = await this.requireVerifiedWallet(proposal.buyerId);
    const sellerWallet = await this.requireVerifiedWallet(proposal.freelancerId);
    this.assertNoWalletCollision(buyerWallet.walletAddressUrl, sellerWallet.walletAddressUrl);

    const result = await this.negotiations.acceptPath1({
      proposalId,
      actorUserId: userId,
      expectedAmountUSDInCents: input.data.expectedAmountUSDInCents,
      expectedDeliveryDays: input.data.expectedDeliveryDays,
      order: {
        buyerId: proposal.buyerId,
        sellerId: proposal.freelancerId,
        proposalId: proposal.id,
        publicationId: proposal.publicationId,
        title: publication.title,
        scopeDescription: publication.description,
        category: publication.category as TaskCategory,
        expectedMediaType: publication.expectedMediaType as DeliverableMediaType,
        initialDeliveryDays: proposal.proposedDeliveryDays,
        acceptanceCriteria: publication.preliminaryCriteria,
        allowedExtensions: publication.allowedExtensions,
        totalAmountUSDInCents: proposal.proposedBudgetUSDInCents,
        buyerWallet,
        sellerWallet,
      },
    });

    if (!result.ok) {
      if (result.reason === 'OFFER_TERMS_CHANGED_CONFLICT') {
        throw new DomainError(409, 'OFFER_TERMS_CHANGED_CONFLICT');
      }
      if (result.reason === 'PUBLICATION_ALREADY_LOCKED') {
        throw new DomainError(409, 'PUBLICATION_ALREADY_LOCKED');
      }
      if (result.reason === 'FORBIDDEN') throw new DomainError(403, 'FORBIDDEN_PROPOSAL_ACCEPTANCE');
      throw new DomainError(409, 'PROPOSAL_NOT_IN_NEGOTIATION');
    }

    const response: AcceptPath1Result = {
      proposalStatus: 'AGREED_PATH_1',
      publicationStatus: 'AGREED_AND_LOCKED',
      taskOrder: this.negotiations.toTaskOrderCard(result.order),
    };
    this.idempotency.set(`neg:accept:${userId}`, key, 201, response);
    // Camino 1: acuerdo mutuo ya cerrado → dinero a escrow al instante.
    void this.escrow.lockEscrowAfterMutualAgreement(result.order.id);
    return response;
  }

  async closePath2(userId: string, proposalId: string, body: unknown): Promise<ClosePath2Result> {
    const input = CloseProposalPath2InputSchema.safeParse({
      ...(typeof body === 'object' && body ? body : {}),
      proposalId,
    });
    if (!input.success) throw new DomainError(400, 'VALIDATION_ERROR');

    const result = await this.negotiations.closePath2({
      proposalId,
      actorUserId: userId,
      closedReason: input.data.closedReason,
    });
    if (!result.ok) {
      if (result.reason === 'FORBIDDEN') throw new DomainError(403, 'PROPOSAL_ACCESS_FORBIDDEN');
      if (result.reason === 'PROPOSAL_ALREADY_RESOLVED') {
        throw new DomainError(409, 'PROPOSAL_ALREADY_RESOLVED');
      }
      throw new DomainError(404, 'PROPOSAL_NOT_FOUND');
    }

    return {
      proposalStatus: 'DISCREPANCY_CLOSED_PATH_2',
      publicationStatus: result.publicationStatus,
    };
  }

  async hireFixedGig(
    userId: string,
    gigId: string,
    body: unknown,
    idempotencyKey?: string,
  ): Promise<HireFixedGigResult> {
    const input = HireFixedGigInputSchema.safeParse({
      ...(typeof body === 'object' && body ? body : {}),
      gigId,
    });
    if (!input.success) throw new DomainError(400, 'VALIDATION_ERROR');

    const key = idempotencyKey ?? randomKey();
    const cached = this.idempotency.get(`neg:hire:${userId}`, key);
    if (cached) return cached.response as HireFixedGigResult;

    const gig = await this.marketplace.findGigById(gigId);
    if (!gig || !gig.isActive) throw new DomainError(409, 'GIG_PRICE_CHANGED_OR_INACTIVE');
    if (gig.sellerId === userId) throw new DomainError(403, 'SELF_DEALING_FORBIDDEN');
    if (gig.priceUSDInCents !== input.data.expectedPriceUSDInCents) {
      throw new DomainError(409, 'GIG_PRICE_CHANGED_OR_INACTIVE');
    }

    const buyerWallet = await this.requireVerifiedWallet(userId);
    const sellerWallet = await this.requireVerifiedWallet(gig.sellerId);
    this.assertNoWalletCollision(buyerWallet.walletAddressUrl, sellerWallet.walletAddressUrl);

    const order = await this.negotiations.hireFixedGig({
      buyerId: userId,
      sellerId: gig.sellerId,
      gigId: gig.id,
      title: gig.title,
      scopeDescription: `${gig.description}\n\nBrief del Buyer:\n${input.data.projectBrief}`,
      category: gig.category,
      expectedMediaType: gig.expectedMediaType as DeliverableMediaType,
      initialDeliveryDays: gig.initialDeliveryDays,
      acceptanceCriteria: gig.defaultCriteria,
      allowedExtensions: gig.allowedExtensions,
      totalAmountUSDInCents: gig.priceUSDInCents,
      buyerWallet,
      sellerWallet,
    });

    const response: HireFixedGigResult = { taskOrder: this.negotiations.toTaskOrderCard(order) };
    this.idempotency.set(`neg:hire:${userId}`, key, 201, response);
    // Push inmediato al Freelancer (SSE) si está en la plataforma.
    void this.escrow.notifySellerIfConfirmationPending(order.id);
    return response;
  }

  private async requireVerifiedWallet(userId: string) {
    const wallet = await this.identity.findActiveWallet(userId);
    if (!wallet || !wallet.isVerified || !wallet.isActive) {
      throw new DomainError(422, 'COUNTERPARTY_WALLET_INACTIVE');
    }
    return wallet;
  }

  private assertNoWalletCollision(buyerUrl: string, sellerUrl: string) {
    if (buyerUrl === sellerUrl) throw new DomainError(422, 'WALLET_COLLISION_DETECTED');
    if (
      buyerUrl === ESCROW_WALLET_ADDRESS ||
      sellerUrl === ESCROW_WALLET_ADDRESS ||
      buyerUrl === PLATFORM_OWNER_WALLET_ADDRESS ||
      sellerUrl === PLATFORM_OWNER_WALLET_ADDRESS
    ) {
      throw new DomainError(422, 'WALLET_COLLISION_DETECTED');
    }
  }

  private toMessageView(message: {
    id: string;
    proposalId: string;
    senderId: string;
    body: string;
    offeredAmountUSDInCents: number | null;
    offeredDeliveryDays: number | null;
    createdAt: Date;
  }): NegotiationMessageView {
    return {
      messageId: message.id,
      proposalId: message.proposalId,
      senderUserId: message.senderId,
      body: message.body,
      offeredAmountUSDInCents: message.offeredAmountUSDInCents,
      offeredDeliveryDays: message.offeredDeliveryDays,
      createdAt: message.createdAt.toISOString(),
    };
  }
}

function randomKey(): string {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
