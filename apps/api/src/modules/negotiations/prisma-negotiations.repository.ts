import { randomUUID } from 'node:crypto';
import {
  ESCROW_WALLET_ADDRESS,
  PLATFORM_OWNER_WALLET_ADDRESS,
  resolveMvpAiAuditableModality,
  splitSingleBlockEscrow,
  TaskOrderCardSchema,
  type TaskOrderCard,
} from '@taskstream/shared-schemas';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  CreateOrderFromAgreementInput,
  CreateProposalRecordInput,
  NegotiationsRepository,
  StoredNegotiationMessage,
  StoredNegotiationProposal,
  StoredTaskOrderRecord,
} from './negotiations.types';

export class PrismaNegotiationsRepository implements NegotiationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  private db() {
    const client = this.prisma.client;
    if (!client) throw new Error('PRISMA_UNAVAILABLE');
    return client;
  }

  async createProposal(input: CreateProposalRecordInput) {
    const created = await this.db().$transaction(async (tx) => {
      const proposal = await tx.negotiationProposal.create({
        data: {
          publicationId: input.publicationId,
          buyerId: input.buyerId,
          initialBudgetUSDInCents: input.initialBudgetUSDInCents,
          freelancerId: input.freelancerId,
          proposedBudgetUSDInCents: input.proposedBudgetUSDInCents,
          proposedDeliveryDays: input.proposedDeliveryDays,
          status: 'IN_NEGOTIATION',
        },
      });
      const message = await tx.negotiationMessage.create({
        data: {
          proposalId: proposal.id,
          senderId: input.freelancerId,
          messageText: input.coverMessage,
          offeredAmountUSDInCents: input.proposedBudgetUSDInCents,
          offeredDeliveryDays: input.proposedDeliveryDays,
        },
      });
      return { proposal, message };
    });
    return {
      proposal: this.toProposal(created.proposal),
      message: this.toMessage(created.message),
    };
  }

  async findProposalById(proposalId: string) {
    const row = await this.db().negotiationProposal.findUnique({ where: { id: proposalId } });
    return row ? this.toProposal(row) : null;
  }

  async listProposalsByPublication(publicationId: string) {
    const rows = await this.db().negotiationProposal.findMany({
      where: { publicationId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => this.toProposal(row));
  }

  async findActiveProposalForFreelancer(publicationId: string, freelancerId: string) {
    const row = await this.db().negotiationProposal.findFirst({
      where: {
        publicationId,
        freelancerId,
        status: { in: ['IN_NEGOTIATION', 'AGREED_PATH_1'] },
      },
    });
    return row ? this.toProposal(row) : null;
  }

  async listMessages(proposalId: string) {
    const rows = await this.db().negotiationMessage.findMany({
      where: { proposalId },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((row) => this.toMessage(row));
  }

  async addMessage(input: {
    proposalId: string;
    senderId: string;
    body: string;
    offeredAmountUSDInCents?: number;
    offeredDeliveryDays?: number;
  }) {
    const row = await this.db().negotiationMessage.create({
      data: {
        proposalId: input.proposalId,
        senderId: input.senderId,
        messageText: input.body,
        offeredAmountUSDInCents: input.offeredAmountUSDInCents,
        offeredDeliveryDays: input.offeredDeliveryDays,
      },
    });
    return this.toMessage(row);
  }

  async updateProposalOffer(
    proposalId: string,
    proposedBudgetUSDInCents: number,
    proposedDeliveryDays?: number,
  ) {
    const row = await this.db().negotiationProposal.update({
      where: { id: proposalId },
      data: {
        proposedBudgetUSDInCents,
        ...(proposedDeliveryDays !== undefined ? { proposedDeliveryDays } : {}),
      },
    });
    return this.toProposal(row);
  }

  async acceptPath1(input: {
    proposalId: string;
    actorUserId: string;
    expectedAmountUSDInCents: number;
    expectedDeliveryDays: number;
    order: CreateOrderFromAgreementInput;
  }) {
    await this.ensurePlatformWallets();
    try {
      const result = await this.db().$transaction(async (tx) => {
        const pubRows = await tx.$queryRaw<Array<{ id: string; status: string }>>`
          SELECT p.id, p.status
          FROM negotiation_proposals np
          JOIN client_task_publications p ON p.id = np.publication_id
          WHERE np.id = ${input.proposalId}::uuid
          FOR UPDATE OF p, np
        `;
        const pub = pubRows[0];
        if (!pub) return { ok: false as const, reason: 'PROPOSAL_NOT_FOUND' as const };

        const proposal = await tx.negotiationProposal.findUnique({ where: { id: input.proposalId } });
        if (!proposal) return { ok: false as const, reason: 'PROPOSAL_NOT_FOUND' as const };
        if (proposal.buyerId !== input.actorUserId && proposal.freelancerId !== input.actorUserId) {
          return { ok: false as const, reason: 'FORBIDDEN' as const };
        }
        if (proposal.status !== 'IN_NEGOTIATION') {
          return { ok: false as const, reason: 'PROPOSAL_NOT_IN_NEGOTIATION' as const };
        }
        if (pub.status !== 'OPEN_FOR_PROPOSALS') {
          return { ok: false as const, reason: 'PUBLICATION_ALREADY_LOCKED' as const };
        }
        if (
          proposal.proposedBudgetUSDInCents !== input.expectedAmountUSDInCents ||
          proposal.proposedDeliveryDays !== input.expectedDeliveryDays
        ) {
          return { ok: false as const, reason: 'OFFER_TERMS_CHANGED_CONFLICT' as const };
        }

        await tx.clientTaskPublication.update({
          where: { id: proposal.publicationId },
          data: { status: 'AGREED_AND_LOCKED' },
        });
        const agreed = await tx.negotiationProposal.update({
          where: { id: proposal.id },
          data: { status: 'AGREED_PATH_1', closedAt: new Date() },
        });
        await tx.negotiationProposal.updateMany({
          where: {
            publicationId: proposal.publicationId,
            id: { not: proposal.id },
            status: 'IN_NEGOTIATION',
          },
          data: {
            status: 'DISCREPANCY_CLOSED_PATH_2',
            closedReason: 'OTHER_PROPOSAL_ACCEPTED',
            closedAt: new Date(),
          },
        });

        const order = await this.insertOrder(tx, {
          ...input.order,
          proposalId: proposal.id,
          publicationId: proposal.publicationId,
          totalAmountUSDInCents: proposal.proposedBudgetUSDInCents,
          initialDeliveryDays: proposal.proposedDeliveryDays,
          gigId: undefined,
        });

        return { ok: true as const, proposal: this.toProposal(agreed), order };
      });
      return result;
    } catch (error) {
      if (isUniqueViolation(error)) {
        return { ok: false as const, reason: 'PUBLICATION_ALREADY_LOCKED' as const };
      }
      throw error;
    }
  }

  async closePath2(input: { proposalId: string; actorUserId: string; closedReason: string }) {
    const proposal = await this.db().negotiationProposal.findUnique({ where: { id: input.proposalId } });
    if (!proposal) return { ok: false as const, reason: 'PROPOSAL_NOT_FOUND' as const };
    if (proposal.buyerId !== input.actorUserId && proposal.freelancerId !== input.actorUserId) {
      return { ok: false as const, reason: 'FORBIDDEN' as const };
    }
    if (proposal.status !== 'IN_NEGOTIATION') {
      return { ok: false as const, reason: 'PROPOSAL_ALREADY_RESOLVED' as const };
    }
    const updated = await this.db().negotiationProposal.update({
      where: { id: proposal.id },
      data: {
        status: 'DISCREPANCY_CLOSED_PATH_2',
        closedReason: input.closedReason.slice(0, 250),
        closedAt: new Date(),
      },
    });
    const publication = await this.db().clientTaskPublication.findUnique({
      where: { id: proposal.publicationId },
    });
    return {
      ok: true as const,
      proposal: this.toProposal(updated),
      publicationStatus: (publication?.status ?? 'OPEN_FOR_PROPOSALS') as
        | 'OPEN_FOR_PROPOSALS'
        | 'AGREED_AND_LOCKED'
        | 'CANCELLED',
    };
  }

  async hireFixedGig(input: CreateOrderFromAgreementInput & { gigId: string }) {
    await this.ensurePlatformWallets();
    return this.db().$transaction(async (tx) =>
      this.insertOrder(tx, { ...input, gigId: input.gigId, proposalId: undefined }),
    );
  }

  async findOrderById(taskId: string) {
    const row = await this.db().taskOrder.findUnique({
      where: { id: taskId },
      include: {
        acceptanceCriteria: { orderBy: { sortOrder: 'asc' } },
        technicalConstraint: true,
        escrowLedger: {
          include: {
            buyerWallet: true,
            sellerWallet: true,
            custodyWallet: true,
            ownerFeeWallet: true,
          },
        },
      },
    });
    if (!row || !row.escrowLedger || !row.technicalConstraint) return null;
    return this.toOrderRecord(row);
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async insertOrder(tx: any, input: CreateOrderFromAgreementInput): Promise<StoredTaskOrderRecord> {
    const split = splitSingleBlockEscrow(input.totalAmountUSDInCents);
    const custody = await tx.platformWallet.findFirst({
      where: { role: 'ESCROW_CUSTODY', isActive: true },
    });
    const ownerFee = await tx.platformWallet.findFirst({
      where: { role: 'OWNER_FEE_COLLECTION', isActive: true },
    });
    if (!custody || !ownerFee) throw new Error('PLATFORM_WALLETS_MISSING');

    const order = await tx.taskOrder.create({
      data: {
        buyerId: input.buyerId,
        sellerId: input.sellerId,
        gigId: input.gigId ?? null,
        proposalId: input.proposalId ?? null,
        title: input.title.slice(0, 120),
        scopeDescription: input.scopeDescription,
        category: input.category,
        expectedMediaType: input.expectedMediaType,
        initialDeliveryDays: input.initialDeliveryDays,
        lifecycleStatus: 'PENDING_ESCROW_FUNDING',
      },
    });

    await tx.taskAcceptanceCriterion.createMany({
      data: input.acceptanceCriteria.map((criterion, index) => ({
        taskOrderId: order.id,
        criterionCode: criterion.criterionId.slice(0, 32),
        description: criterion.description.slice(0, 350),
        isMandatory: criterion.isMandatory,
        sortOrder: index,
      })),
    });

    await tx.taskTechnicalConstraint.create({
      data: {
        taskOrderId: order.id,
        allowedExtensions: input.allowedExtensions,
        maxFileSizeBytes: null,
      },
    });

    await tx.escrowLedger.create({
      data: {
        taskOrderId: order.id,
        buyerWalletId: input.buyerWallet.id,
        sellerWalletId: input.sellerWallet.id,
        custodyWalletId: custody.id,
        ownerFeeWalletId: ownerFee.id,
        totalAmountUSDInCents: input.totalAmountUSDInCents,
        platformFeeUSDInCents: split.platformFeeUSDInCents,
        freelancerPayoutUSDInCents: split.freelancerPayoutUSDInCents,
        status: 'AWAITING_FUNDS',
      },
    });

    let publicationId = input.publicationId ?? null;
    if (!publicationId && input.proposalId) {
      const proposal = await tx.negotiationProposal.findUnique({ where: { id: input.proposalId } });
      publicationId = proposal?.publicationId ?? null;
    }

    return {
      id: order.id as string,
      buyerId: input.buyerId,
      sellerId: input.sellerId,
      gigId: input.gigId ?? null,
      proposalId: input.proposalId ?? null,
      publicationId,
      title: input.title.slice(0, 120),
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
      escrowWalletAddress: custody.walletAddressUrl,
      platformOwnerWalletAddress: ownerFee.walletAddressUrl,
      createdAt: new Date(),
    };
  }

  private async ensurePlatformWallets(): Promise<void> {
    const db = this.db();
    const custody = await db.platformWallet.findFirst({
      where: { role: 'ESCROW_CUSTODY', isActive: true },
    });
    if (!custody) {
      await db.platformWallet.create({
        data: {
          id: randomUUID(),
          role: 'ESCROW_CUSTODY',
          walletAddressUrl: ESCROW_WALLET_ADDRESS,
          assetCode: 'USD',
          assetScale: 2,
          isActive: true,
        },
      });
    }
    const owner = await db.platformWallet.findFirst({
      where: { role: 'OWNER_FEE_COLLECTION', isActive: true },
    });
    if (!owner) {
      await db.platformWallet.create({
        data: {
          id: randomUUID(),
          role: 'OWNER_FEE_COLLECTION',
          walletAddressUrl: PLATFORM_OWNER_WALLET_ADDRESS,
          assetCode: 'USD',
          assetScale: 2,
          isActive: true,
        },
      });
    }
  }

  private toProposal(row: {
    id: string;
    publicationId: string;
    buyerId: string;
    freelancerId: string;
    initialBudgetUSDInCents: number;
    proposedBudgetUSDInCents: number;
    proposedDeliveryDays: number;
    status: StoredNegotiationProposal['status'];
    closedReason: string | null;
    createdAt: Date;
    closedAt: Date | null;
  }): StoredNegotiationProposal {
    return {
      id: row.id,
      publicationId: row.publicationId,
      buyerId: row.buyerId,
      freelancerId: row.freelancerId,
      initialBudgetUSDInCents: row.initialBudgetUSDInCents,
      proposedBudgetUSDInCents: row.proposedBudgetUSDInCents,
      proposedDeliveryDays: row.proposedDeliveryDays,
      status: row.status,
      closedReason: row.closedReason,
      createdAt: row.createdAt,
      closedAt: row.closedAt,
    };
  }

  private toMessage(row: {
    id: string;
    proposalId: string;
    senderId: string;
    messageText: string;
    offeredAmountUSDInCents: number | null;
    offeredDeliveryDays: number | null;
    createdAt: Date;
  }): StoredNegotiationMessage {
    return {
      id: row.id,
      proposalId: row.proposalId,
      senderId: row.senderId,
      body: row.messageText,
      offeredAmountUSDInCents: row.offeredAmountUSDInCents,
      offeredDeliveryDays: row.offeredDeliveryDays,
      createdAt: row.createdAt,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private toOrderRecord(row: any): StoredTaskOrderRecord {
    return {
      id: row.id,
      buyerId: row.buyerId,
      sellerId: row.sellerId,
      gigId: row.gigId,
      proposalId: row.proposalId,
      publicationId: row.proposal?.publicationId ?? null,
      title: row.title,
      scopeDescription: row.scopeDescription,
      category: row.category,
      expectedMediaType: row.expectedMediaType,
      initialDeliveryDays: row.initialDeliveryDays,
      lifecycleStatus: 'PENDING_ESCROW_FUNDING',
      acceptanceCriteria: (row.acceptanceCriteria as Array<{
        criterionCode: string;
        description: string;
        isMandatory: boolean;
      }>).map((item) => ({
        criterionId: item.criterionCode,
        description: item.description,
        isMandatory: item.isMandatory,
      })),
      allowedExtensions: (row.technicalConstraint as { allowedExtensions: string[] }).allowedExtensions,
      totalAmountUSDInCents: row.escrowLedger.totalAmountUSDInCents,
      platformFeeUSDInCents: row.escrowLedger.platformFeeUSDInCents,
      freelancerPayoutUSDInCents: row.escrowLedger.freelancerPayoutUSDInCents,
      buyerWalletAddress: row.escrowLedger.buyerWallet.walletAddressUrl,
      buyerOriginCurrency: row.escrowLedger.buyerWallet.assetCode.slice(0, 3).toUpperCase(),
      sellerWalletAddress: row.escrowLedger.sellerWallet.walletAddressUrl,
      sellerTargetCurrency: row.escrowLedger.sellerWallet.assetCode.slice(0, 3).toUpperCase(),
      escrowWalletAddress: row.escrowLedger.custodyWallet.walletAddressUrl,
      platformOwnerWalletAddress: row.escrowLedger.ownerFeeWallet.walletAddressUrl,
      createdAt: row.createdAt,
    };
  }
}

function isUniqueViolation(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code: string }).code === 'P2002',
  );
}
