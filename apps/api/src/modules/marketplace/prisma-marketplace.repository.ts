import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type {
  CreateGigInput,
  CreatePublicationInput,
  PageDocument,
  UpdateGigInput,
} from '@taskstream/shared-schemas';
import { PageDocumentSchema } from '@taskstream/shared-schemas';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  CategoryCounts,
  ListGigsFilter,
  ListPublicationsFilter,
  MarketplaceMediaEntityType,
  MarketplaceRepository,
  PublicationStatus,
  StoredGig,
  StoredMediaAsset,
  StoredPublication,
  StoredReview,
  StoredSellerProfile,
  TaskCategory,
} from './marketplace.types';

const REVIEW_ELIGIBLE_STATUSES = [
  'COMPLETED',
  'REFUNDED',
  'AUTO_REFUNDED_INITIAL_EXPIRED',
  'AUTO_REFUNDED_BY_TIMEOUT',
  'AUTO_REFUNDED_EXTENDED_EXPIRED',
] as const;

function encodeCursor(createdAt: Date, id: string): string {
  return Buffer.from(`${createdAt.toISOString()}|${id}`, 'utf8').toString('base64url');
}

function decodeCursor(cursor: string): { createdAt: Date; id: string } | null {
  try {
    const raw = Buffer.from(cursor, 'base64url').toString('utf8');
    const [iso, id] = raw.split('|');
    if (!iso || !id) return null;
    const createdAt = new Date(iso);
    if (Number.isNaN(createdAt.getTime())) return null;
    return { createdAt, id };
  } catch {
    return null;
  }
}

type CriteriaJson = CreateGigInput['defaultCriteria'];

@Injectable()
export class PrismaMarketplaceRepository implements MarketplaceRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  private db() {
    if (!this.prisma.client) {
      throw new Error('DATABASE_URL_REQUIRED');
    }
    return this.prisma.client;
  }

  async findSellerProfile(userId: string): Promise<StoredSellerProfile | null> {
    const user = await this.db().user.findUnique({
      where: { id: userId },
      include: {
        sellerProfile: true,
        wallets: { where: { isActive: true, isVerified: true }, take: 1 },
      },
    });
    if (!user) return null;
    const wallet = user.wallets[0] ?? null;
    return {
      userId: user.id,
      displayName: user.displayName,
      headline: user.sellerProfile?.headline ?? null,
      webMonetizationEnabled: user.sellerProfile?.webMonetizationEnabled ?? false,
      verifiedWalletAddressUrl: wallet?.walletAddressUrl ?? null,
      targetCurrency: wallet?.assetCode?.slice(0, 3).toUpperCase() ?? 'USD',
      hasVerifiedActiveWallet: Boolean(wallet),
    };
  }

  async ensureSellerProfile(userId: string, displayName: string): Promise<StoredSellerProfile> {
    await this.db().sellerProfile.upsert({
      where: { userId },
      create: {
        userId,
        headline: `${displayName} · Freelancer`.slice(0, 140),
        bio: 'Perfil de vendedor creado automáticamente al publicar el primer Gig.',
        skills: [],
        languages: ['es'],
        webMonetizationEnabled: true,
      },
      update: {},
    });
    const profile = await this.findSellerProfile(userId);
    if (!profile) {
      throw new Error('SELLER_PROFILE_MISSING');
    }
    return profile;
  }

  async createGig(sellerId: string, input: CreateGigInput, pageDocument: PageDocument): Promise<StoredGig> {
    const created = await this.db().gig.create({
      data: {
        sellerId,
        category: input.category,
        expectedMediaType: input.expectedMediaType,
        title: input.title,
        description: input.description,
        priceUSDInCents: input.priceUSDInCents,
        initialDeliveryDays: input.initialDeliveryDays,
        defaultCriteriaJson: input.defaultCriteria as Prisma.InputJsonValue,
        pageDocumentJson: pageDocument as unknown as Prisma.InputJsonValue,
        allowedExtensions: input.allowedExtensions,
        isActive: true,
      },
    });
    return this.toGig(created);
  }

  async updateGig(
    gigId: string,
    sellerId: string,
    input: UpdateGigInput & {
      expectedMediaType?: StoredGig['expectedMediaType'];
      allowedExtensions?: string[];
    },
  ): Promise<StoredGig | 'NOT_FOUND' | 'FORBIDDEN'> {
    const existing = await this.db().gig.findUnique({ where: { id: gigId } });
    if (!existing) return 'NOT_FOUND';
    if (existing.sellerId !== sellerId) return 'FORBIDDEN';
    const updated = await this.db().gig.update({
      where: { id: gigId },
      data: {
        title: input.title,
        description: input.description,
        category: input.category,
        ...(input.expectedMediaType
          ? { expectedMediaType: input.expectedMediaType as never }
          : {}),
        allowedExtensions: input.allowedExtensions,
        priceUSDInCents: input.priceUSDInCents,
        initialDeliveryDays: input.initialDeliveryDays,
        defaultCriteriaJson:
          input.defaultCriteria !== undefined
            ? (input.defaultCriteria as Prisma.InputJsonValue)
            : undefined,
        isActive: input.isActive,
      },
    });
    return this.toGig(updated);
  }

  async updatePublication(
    publicationId: string,
    buyerId: string,
    input: import('@taskstream/shared-schemas').UpdatePublicationInput & {
      expectedMediaType?: StoredGig['expectedMediaType'];
      allowedExtensions?: string[];
    },
  ): Promise<StoredPublication | 'NOT_FOUND' | 'FORBIDDEN' | 'NOT_OPEN'> {
    const existing = await this.db().clientTaskPublication.findUnique({ where: { id: publicationId } });
    if (!existing) return 'NOT_FOUND';
    if (existing.buyerId !== buyerId) return 'FORBIDDEN';
    if (existing.status !== 'OPEN_FOR_PROPOSALS') return 'NOT_OPEN';
    const updated = await this.db().clientTaskPublication.update({
      where: { id: publicationId },
      data: {
        title: input.title,
        description: input.description,
        category: input.category,
        ...(input.expectedMediaType
          ? { expectedMediaType: input.expectedMediaType as never }
          : {}),
        allowedExtensions: input.allowedExtensions,
        initialBudgetUSDInCents: input.initialBudgetUSDInCents,
      },
    });
    return this.toPublication(updated);
  }

  async findGigById(gigId: string): Promise<StoredGig | null> {
    const gig = await this.db().gig.findUnique({ where: { id: gigId } });
    return gig ? this.toGig(gig) : null;
  }

  async listActiveGigs(filter: ListGigsFilter): Promise<{ items: StoredGig[]; nextCursor: string | null }> {
    const where: Prisma.GigWhereInput = {
      isActive: true,
      seller: { wallets: { some: { isActive: true, isVerified: true } } },
      ...(filter.category ? { category: filter.category } : {}),
      ...(filter.maxPriceCents !== undefined ? { priceUSDInCents: { lte: filter.maxPriceCents } } : {}),
      ...(filter.maxDays !== undefined ? { initialDeliveryDays: { lte: filter.maxDays } } : {}),
    };
    const decoded = filter.cursor ? decodeCursor(filter.cursor) : null;
    if (decoded) {
      where.OR = [
        { createdAt: { lt: decoded.createdAt } },
        { createdAt: decoded.createdAt, id: { lt: decoded.id } },
      ];
    }
    const rows = await this.db().gig.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: filter.limit + 1,
    });
    const page = rows.slice(0, filter.limit);
    const extra = rows[filter.limit];
    return {
      items: page.map((row) => this.toGig(row)),
      nextCursor: extra ? encodeCursor(page[page.length - 1]!.createdAt, page[page.length - 1]!.id) : null,
    };
  }

  async updateGigPage(
    gigId: string,
    sellerId: string,
    pageDocument: PageDocument,
  ): Promise<StoredGig | 'NOT_FOUND' | 'FORBIDDEN'> {
    const existing = await this.db().gig.findUnique({ where: { id: gigId } });
    if (!existing) return 'NOT_FOUND';
    if (existing.sellerId !== sellerId) return 'FORBIDDEN';
    const hero = pageDocument.blocks.find((block) => block.type === 'hero');
    const updated = await this.db().gig.update({
      where: { id: gigId },
      data: {
        pageDocumentJson: pageDocument as unknown as Prisma.InputJsonValue,
        ...(hero?.type === 'hero' && hero.title.length >= 10 ? { title: hero.title } : {}),
      },
    });
    return this.toGig(updated);
  }

  async createPublication(
    buyerId: string,
    input: CreatePublicationInput,
    pageDocument: PageDocument,
  ): Promise<StoredPublication> {
    const created = await this.db().clientTaskPublication.create({
      data: {
        buyerId,
        category: input.category,
        expectedMediaType: input.expectedMediaType,
        title: input.title,
        description: input.description,
        initialBudgetUSDInCents: input.initialBudgetUSDInCents,
        initialDeliveryDays: input.initialDeliveryDays,
        preliminaryCriteriaJson: {
          criteria: input.preliminaryCriteria,
          minWordCount: input.minWordCount,
          minWidthPx: input.minWidthPx,
          minHeightPx: input.minHeightPx,
        } as Prisma.InputJsonValue,
        pageDocumentJson: pageDocument as unknown as Prisma.InputJsonValue,
        allowedExtensions: input.allowedExtensions,
        status: 'OPEN_FOR_PROPOSALS',
      },
    });
    return this.toPublication(created);
  }

  async updatePublicationPage(
    publicationId: string,
    buyerId: string,
    pageDocument: PageDocument,
  ): Promise<StoredPublication | 'NOT_FOUND' | 'FORBIDDEN'> {
    const existing = await this.db().clientTaskPublication.findUnique({ where: { id: publicationId } });
    if (!existing) return 'NOT_FOUND';
    if (existing.buyerId !== buyerId) return 'FORBIDDEN';
    const hero = pageDocument.blocks.find((block) => block.type === 'hero');
    const updated = await this.db().clientTaskPublication.update({
      where: { id: publicationId },
      data: {
        pageDocumentJson: pageDocument as unknown as Prisma.InputJsonValue,
        ...(hero?.type === 'hero' && hero.title.length >= 10 ? { title: hero.title } : {}),
      },
    });
    return this.toPublication(updated);
  }

  async findPublicationById(publicationId: string): Promise<StoredPublication | null> {
    const publication = await this.db().clientTaskPublication.findUnique({ where: { id: publicationId } });
    return publication ? this.toPublication(publication) : null;
  }

  async listPublications(
    filter: ListPublicationsFilter,
  ): Promise<{ items: StoredPublication[]; nextCursor: string | null }> {
    const status = filter.status ?? 'OPEN_FOR_PROPOSALS';
    const where: Prisma.ClientTaskPublicationWhereInput = {
      status,
      ...(filter.category ? { category: filter.category } : {}),
    };
    const decoded = filter.cursor ? decodeCursor(filter.cursor) : null;
    if (decoded) {
      where.OR = [
        { createdAt: { lt: decoded.createdAt } },
        { createdAt: decoded.createdAt, id: { lt: decoded.id } },
      ];
    }
    const rows = await this.db().clientTaskPublication.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: filter.limit + 1,
    });
    const page = rows.slice(0, filter.limit);
    const extra = rows[filter.limit];
    return {
      items: page.map((row) => this.toPublication(row)),
      nextCursor: extra ? encodeCursor(page[page.length - 1]!.createdAt, page[page.length - 1]!.id) : null,
    };
  }

  async countActiveProposals(publicationId: string): Promise<number> {
    return this.db().negotiationProposal.count({
      where: { publicationId, status: 'IN_NEGOTIATION' },
    });
  }

  async markPublicationAgreedAndLocked(
    publicationId: string,
  ): Promise<StoredPublication | 'NOT_FOUND' | 'NOT_OPEN'> {
    const rows = await this.db().$queryRaw<Array<{ id: string; status: PublicationStatus }>>`
      SELECT id, status FROM client_task_publications WHERE id = ${publicationId}::uuid FOR UPDATE
    `;
    const row = rows[0];
    if (!row) return 'NOT_FOUND';
    if (row.status !== 'OPEN_FOR_PROPOSALS') return 'NOT_OPEN';
    const updated = await this.db().clientTaskPublication.update({
      where: { id: publicationId },
      data: { status: 'AGREED_AND_LOCKED' },
    });
    return this.toPublication(updated);
  }

  async upsertProposalStub(_input: {
    id: string;
    publicationId: string;
    status: 'IN_NEGOTIATION' | 'AGREED_PATH_1' | 'DISCREPANCY_CLOSED_PATH_2';
    closedReason?: string | null;
  }): Promise<void> {
    // En Prisma el contador lee negotiation_proposals reales (SPEC-05).
  }

  async cancelPublication(
    publicationId: string,
    buyerId: string,
    cancelReason?: string,
  ): Promise<
    | { ok: true; publication: StoredPublication }
    | { ok: false; reason: 'NOT_FOUND' | 'FORBIDDEN' | 'ALREADY_LOCKED' }
  > {
    return this.db().$transaction(async (tx) => {
      const rows = await tx.$queryRaw<
        Array<{ id: string; buyer_id: string; status: PublicationStatus }>
      >`SELECT id, buyer_id, status FROM client_task_publications WHERE id = ${publicationId}::uuid FOR UPDATE`;
      const row = rows[0];
      if (!row) return { ok: false as const, reason: 'NOT_FOUND' as const };
      if (row.buyer_id !== buyerId) return { ok: false as const, reason: 'FORBIDDEN' as const };
      if (row.status === 'AGREED_AND_LOCKED') {
        return { ok: false as const, reason: 'ALREADY_LOCKED' as const };
      }
      if (row.status === 'OPEN_FOR_PROPOSALS') {
        await tx.clientTaskPublication.update({
          where: { id: publicationId },
          data: { status: 'CANCELLED' },
        });
        await tx.negotiationProposal.updateMany({
          where: { publicationId, status: 'IN_NEGOTIATION' },
          data: {
            status: 'DISCREPANCY_CLOSED_PATH_2',
            closedReason: cancelReason
              ? `PUBLICATION_CANCELLED_BY_BUYER:${cancelReason}`.slice(0, 250)
              : 'PUBLICATION_CANCELLED_BY_BUYER',
            closedAt: new Date(),
          },
        });
      }
      const publication = await tx.clientTaskPublication.findUniqueOrThrow({ where: { id: publicationId } });
      return { ok: true as const, publication: this.toPublication(publication) };
    });
  }

  async countByCategory(): Promise<CategoryCounts[]> {
    const categories = Object.keys({
      DIGITAL_MARKETING: true,
      GRAPHICS_AND_DESIGN: true,
      PROGRAMMING_AND_TECH: true,
      TECHNICAL_WRITING_TRANS: true,
      VIDEO_AND_ANIMATION: true,
      MUSIC_AND_AUDIO: true,
    }) as TaskCategory[];
    const result: CategoryCounts[] = [];
    for (const category of categories) {
      const [activeGigCount, openPublicationCount] = await Promise.all([
        this.db().gig.count({
          where: {
            category,
            isActive: true,
            seller: { wallets: { some: { isActive: true, isVerified: true } } },
          },
        }),
        this.db().clientTaskPublication.count({
          where: { category, status: 'OPEN_FOR_PROPOSALS' },
        }),
      ]);
      result.push({ category, activeGigCount, openPublicationCount });
    }
    return result;
  }

  async listMedia(entityType: MarketplaceMediaEntityType, entityId: string): Promise<StoredMediaAsset[]> {
    const rows = await this.db().marketplaceMediaAsset.findMany({
      where: { entityType, entityId },
      orderBy: { sortOrder: 'asc' },
    });
    return rows.map((row) => this.toMedia(row));
  }

  async findMediaById(mediaId: string): Promise<StoredMediaAsset | null> {
    const row = await this.db().marketplaceMediaAsset.findUnique({ where: { id: mediaId } });
    return row ? this.toMedia(row) : null;
  }

  async addMedia(input: {
    ownerUserId: string;
    entityType: MarketplaceMediaEntityType;
    entityId: string;
    mimeType: StoredMediaAsset['mimeType'];
    byteSize: number;
    storagePath: string;
    sortOrder: number;
    bytes?: Buffer;
  }): Promise<StoredMediaAsset> {
    const created = await this.db().marketplaceMediaAsset.create({
      data: {
        ownerUserId: input.ownerUserId,
        entityType: input.entityType,
        entityId: input.entityId,
        mimeType: input.mimeType,
        byteSize: input.byteSize,
        storagePath: input.storagePath,
        sortOrder: input.sortOrder,
      },
    });
    return this.toMedia(created);
  }

  async deleteMedia(
    mediaId: string,
    ownerUserId: string,
  ): Promise<StoredMediaAsset | 'NOT_FOUND' | 'FORBIDDEN'> {
    const existing = await this.db().marketplaceMediaAsset.findUnique({ where: { id: mediaId } });
    if (!existing) return 'NOT_FOUND';
    if (existing.ownerUserId !== ownerUserId) return 'FORBIDDEN';
    await this.db().marketplaceMediaAsset.delete({ where: { id: mediaId } });
    return this.toMedia(existing);
  }

  async listReviews(entityType: MarketplaceMediaEntityType, entityId: string): Promise<StoredReview[]> {
    const rows = await this.db().marketplaceReview.findMany({
      where: { entityType, entityId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => this.toReview(row));
  }

  async findReviewByReviewer(
    entityType: MarketplaceMediaEntityType,
    entityId: string,
    reviewerUserId: string,
  ): Promise<StoredReview | null> {
    const row = await this.db().marketplaceReview.findUnique({
      where: {
        entityType_entityId_reviewerUserId: { entityType, entityId, reviewerUserId },
      },
    });
    return row ? this.toReview(row) : null;
  }

  async createReview(input: {
    entityType: MarketplaceMediaEntityType;
    entityId: string;
    reviewerUserId: string;
    rating: number;
    body: string;
  }): Promise<StoredReview | 'DUPLICATE'> {
    try {
      const created = await this.db().marketplaceReview.create({
        data: {
          entityType: input.entityType,
          entityId: input.entityId,
          reviewerUserId: input.reviewerUserId,
          rating: input.rating,
          body: input.body,
        },
      });
      return this.toReview(created);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return 'DUPLICATE';
      }
      throw error;
    }
  }

  async hasEligibleClosedService(
    entityType: MarketplaceMediaEntityType,
    entityId: string,
    reviewerUserId: string,
  ): Promise<boolean> {
    if (entityType === 'GIG') {
      const count = await this.db().taskOrder.count({
        where: {
          gigId: entityId,
          buyerId: reviewerUserId,
          lifecycleStatus: { in: [...REVIEW_ELIGIBLE_STATUSES] },
        },
      });
      return count > 0;
    }
    const count = await this.db().taskOrder.count({
      where: {
        sellerId: reviewerUserId,
        lifecycleStatus: { in: [...REVIEW_ELIGIBLE_STATUSES] },
        proposal: { publicationId: entityId },
      },
    });
    return count > 0;
  }

  private toReview(row: {
    id: string;
    entityType: MarketplaceMediaEntityType;
    entityId: string;
    reviewerUserId: string;
    rating: number;
    body: string;
    createdAt: Date;
  }): StoredReview {
    return {
      id: row.id,
      entityType: row.entityType,
      entityId: row.entityId,
      reviewerUserId: row.reviewerUserId,
      rating: row.rating,
      body: row.body,
      createdAt: row.createdAt,
    };
  }

  private toMedia(row: {
    id: string;
    ownerUserId: string;
    entityType: MarketplaceMediaEntityType;
    entityId: string;
    mimeType: string;
    byteSize: number;
    storagePath: string;
    sortOrder: number;
  }): StoredMediaAsset {
    return {
      id: row.id,
      ownerUserId: row.ownerUserId,
      entityType: row.entityType,
      entityId: row.entityId,
      mimeType: row.mimeType as StoredMediaAsset['mimeType'],
      byteSize: row.byteSize,
      storagePath: row.storagePath,
      sortOrder: row.sortOrder,
    };
  }

  private toGig(row: {
    id: string;
    sellerId: string;
    category: TaskCategory;
    expectedMediaType: string;
    title: string;
    description: string;
    priceUSDInCents: number;
    initialDeliveryDays: number;
    defaultCriteriaJson: Prisma.JsonValue;
    pageDocumentJson: Prisma.JsonValue;
    allowedExtensions: string[];
    isActive: boolean;
    createdAt: Date;
  }): StoredGig {
    return {
      id: row.id,
      sellerId: row.sellerId,
      category: row.category,
      expectedMediaType: row.expectedMediaType,
      title: row.title,
      description: row.description,
      priceUSDInCents: row.priceUSDInCents,
      initialDeliveryDays: row.initialDeliveryDays,
      defaultCriteria: row.defaultCriteriaJson as CriteriaJson,
      allowedExtensions: row.allowedExtensions,
      isActive: row.isActive,
      pageDocument: parsePageDocument(row.pageDocumentJson, row.title),
      createdAt: row.createdAt,
    };
  }

  private toPublication(row: {
    id: string;
    buyerId: string;
    category: TaskCategory;
    expectedMediaType: string;
    title: string;
    description: string;
    initialBudgetUSDInCents: number;
    initialDeliveryDays: number;
    preliminaryCriteriaJson: Prisma.JsonValue;
    pageDocumentJson: Prisma.JsonValue;
    allowedExtensions: string[];
    status: PublicationStatus;
    createdAt: Date;
  }): StoredPublication {
    const blob = row.preliminaryCriteriaJson as {
      criteria?: CreatePublicationInput['preliminaryCriteria'];
      minWordCount?: number;
      minWidthPx?: number;
      minHeightPx?: number;
    };
    const criteria = Array.isArray(blob)
      ? (blob as CreatePublicationInput['preliminaryCriteria'])
      : (blob.criteria ?? []);
    return {
      id: row.id,
      buyerId: row.buyerId,
      category: row.category,
      expectedMediaType: row.expectedMediaType,
      title: row.title,
      description: row.description,
      initialBudgetUSDInCents: row.initialBudgetUSDInCents,
      initialDeliveryDays: row.initialDeliveryDays,
      preliminaryCriteria: criteria,
      allowedExtensions: row.allowedExtensions,
      minWordCount: Array.isArray(blob) ? undefined : blob.minWordCount,
      minWidthPx: Array.isArray(blob) ? undefined : blob.minWidthPx,
      minHeightPx: Array.isArray(blob) ? undefined : blob.minHeightPx,
      status: row.status,
      pageDocument: parsePageDocument(row.pageDocumentJson, row.title),
      createdAt: row.createdAt,
    };
  }
}

function parsePageDocument(raw: Prisma.JsonValue, title: string): PageDocument {
  const parsed = PageDocumentSchema.safeParse(raw);
  if (parsed.success) return parsed.data;
  return {
    version: 1,
    blocks: [
      { type: 'hero', title },
      { type: 'profile', displayName: 'Usuario', headline: null, avatarUrl: null },
      { type: 'about', html: '<p></p>' },
      { type: 'serviceMeta' },
      { type: 'gallery', mediaIds: [] },
      { type: 'links', items: [] },
      { type: 'body', html: '<p></p>' },
    ],
  };
}
