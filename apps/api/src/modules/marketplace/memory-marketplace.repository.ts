import { randomUUID } from 'node:crypto';
import type {
  CreateGigInput,
  CreatePublicationInput,
  PageDocument,
  UpdateGigInput,
} from '@taskstream/shared-schemas';
import type {
  CategoryCounts,
  ListGigsFilter,
  ListPublicationsFilter,
  MarketplaceMediaEntityType,
  MarketplaceRepository,
  PublicationStatus,
  StoredGig,
  StoredMediaAsset,
  StoredProposal,
  StoredPublication,
  StoredReview,
  StoredSellerProfile,
  TaskCategory,
} from './marketplace.types';

interface MemoryState {
  sellers: Map<string, StoredSellerProfile>;
  gigs: StoredGig[];
  publications: StoredPublication[];
  proposals: StoredProposal[];
  media: StoredMediaAsset[];
  reviews: StoredReview[];
  eligibleReviewers: Set<string>;
}

function eligibilityKey(
  entityType: MarketplaceMediaEntityType,
  entityId: string,
  reviewerUserId: string,
): string {
  return `${entityType}:${entityId}:${reviewerUserId}`;
}

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

function cloneGig(gig: StoredGig): StoredGig {
  return {
    ...gig,
    defaultCriteria: [...gig.defaultCriteria],
    allowedExtensions: [...gig.allowedExtensions],
    pageDocument: structuredClone(gig.pageDocument),
  };
}

function clonePublication(publication: StoredPublication): StoredPublication {
  return {
    ...publication,
    preliminaryCriteria: [...publication.preliminaryCriteria],
    allowedExtensions: [...publication.allowedExtensions],
    pageDocument: structuredClone(publication.pageDocument),
  };
}

export class MemoryMarketplaceRepository implements MarketplaceRepository {
  private state: MemoryState = {
    sellers: new Map(),
    gigs: [],
    publications: [],
    proposals: [],
    media: [],
    reviews: [],
    eligibleReviewers: new Set(),
  };

  reset(): void {
    this.state = {
      sellers: new Map(),
      gigs: [],
      publications: [],
      proposals: [],
      media: [],
      reviews: [],
      eligibleReviewers: new Set(),
    };
  }

  async seedVerifiedSeller(input: {
    userId: string;
    displayName: string;
    walletAddressUrl: string;
    assetCode?: string;
    webMonetizationEnabled?: boolean;
  }): Promise<void> {
    this.state.sellers.set(input.userId, {
      userId: input.userId,
      displayName: input.displayName,
      headline: `${input.displayName} · Freelancer`,
      webMonetizationEnabled: input.webMonetizationEnabled ?? true,
      verifiedWalletAddressUrl: input.walletAddressUrl,
      targetCurrency: (input.assetCode ?? 'USD').slice(0, 3).toUpperCase(),
      hasVerifiedActiveWallet: true,
    });
  }

  async lockPublicationForTest(publicationId: string): Promise<void> {
    const publication = this.state.publications.find((item) => item.id === publicationId);
    if (publication) publication.status = 'AGREED_AND_LOCKED';
  }

  async addOpenProposalForTest(publicationId: string): Promise<void> {
    this.state.proposals.push({
      id: randomUUID(),
      publicationId,
      status: 'IN_NEGOTIATION',
      closedReason: null,
    });
  }

  async findSellerProfile(userId: string): Promise<StoredSellerProfile | null> {
    const seller = this.state.sellers.get(userId);
    return seller ? { ...seller } : null;
  }

  async ensureSellerProfile(userId: string, displayName: string): Promise<StoredSellerProfile> {
    const existing = this.state.sellers.get(userId);
    if (existing) return { ...existing };
    const created: StoredSellerProfile = {
      userId,
      displayName,
      headline: `${displayName} · Freelancer`,
      webMonetizationEnabled: true,
      verifiedWalletAddressUrl: null,
      targetCurrency: 'USD',
      hasVerifiedActiveWallet: false,
    };
    this.state.sellers.set(userId, created);
    return { ...created };
  }

  async createGig(sellerId: string, input: CreateGigInput, pageDocument: PageDocument): Promise<StoredGig> {
    const gig: StoredGig = {
      id: randomUUID(),
      sellerId,
      category: input.category,
      expectedMediaType: input.expectedMediaType,
      title: input.title,
      description: input.description,
      priceUSDInCents: input.priceUSDInCents,
      initialDeliveryDays: input.initialDeliveryDays,
      defaultCriteria: input.defaultCriteria,
      allowedExtensions: input.allowedExtensions,
      isActive: true,
      pageDocument: structuredClone(pageDocument),
      createdAt: new Date(),
    };
    this.state.gigs.push(gig);
    return cloneGig(gig);
  }

  async updateGig(
    gigId: string,
    sellerId: string,
    input: UpdateGigInput & {
      expectedMediaType?: StoredGig['expectedMediaType'];
      allowedExtensions?: string[];
    },
  ): Promise<StoredGig | 'NOT_FOUND' | 'FORBIDDEN'> {
    const gig = this.state.gigs.find((item) => item.id === gigId);
    if (!gig) return 'NOT_FOUND';
    if (gig.sellerId !== sellerId) return 'FORBIDDEN';
    if (input.title !== undefined) gig.title = input.title;
    if (input.description !== undefined) gig.description = input.description;
    if (input.category !== undefined) gig.category = input.category;
    if (input.expectedMediaType !== undefined) gig.expectedMediaType = input.expectedMediaType;
    if (input.allowedExtensions !== undefined) gig.allowedExtensions = [...input.allowedExtensions];
    if (input.priceUSDInCents !== undefined) gig.priceUSDInCents = input.priceUSDInCents;
    if (input.initialDeliveryDays !== undefined) gig.initialDeliveryDays = input.initialDeliveryDays;
    if (input.defaultCriteria !== undefined) gig.defaultCriteria = input.defaultCriteria;
    if (input.isActive !== undefined) gig.isActive = input.isActive;
    return cloneGig(gig);
  }

  async updatePublication(
    publicationId: string,
    buyerId: string,
    input: import('@taskstream/shared-schemas').UpdatePublicationInput & {
      expectedMediaType?: string;
      allowedExtensions?: string[];
    },
  ): Promise<StoredPublication | 'NOT_FOUND' | 'FORBIDDEN' | 'NOT_OPEN'> {
    const publication = this.state.publications.find((item) => item.id === publicationId);
    if (!publication) return 'NOT_FOUND';
    if (publication.buyerId !== buyerId) return 'FORBIDDEN';
    if (publication.status !== 'OPEN_FOR_PROPOSALS') return 'NOT_OPEN';
    if (input.title !== undefined) publication.title = input.title;
    if (input.description !== undefined) publication.description = input.description;
    if (input.category !== undefined) publication.category = input.category;
    if (input.expectedMediaType !== undefined) publication.expectedMediaType = input.expectedMediaType;
    if (input.allowedExtensions !== undefined) publication.allowedExtensions = [...input.allowedExtensions];
    if (input.initialBudgetUSDInCents !== undefined) {
      publication.initialBudgetUSDInCents = input.initialBudgetUSDInCents;
    }
    return clonePublication(publication);
  }

  async updateGigPage(
    gigId: string,
    sellerId: string,
    pageDocument: PageDocument,
  ): Promise<StoredGig | 'NOT_FOUND' | 'FORBIDDEN'> {
    const gig = this.state.gigs.find((item) => item.id === gigId);
    if (!gig) return 'NOT_FOUND';
    if (gig.sellerId !== sellerId) return 'FORBIDDEN';
    gig.pageDocument = structuredClone(pageDocument);
    const hero = pageDocument.blocks.find((block) => block.type === 'hero');
    if (hero?.type === 'hero' && hero.title.length >= 10) {
      gig.title = hero.title;
    }
    return cloneGig(gig);
  }

  async findGigById(gigId: string): Promise<StoredGig | null> {
    const gig = this.state.gigs.find((item) => item.id === gigId);
    return gig ? cloneGig(gig) : null;
  }

  async listActiveGigs(filter: ListGigsFilter): Promise<{ items: StoredGig[]; nextCursor: string | null }> {
    let rows = this.state.gigs.filter((gig) => {
      if (!gig.isActive) return false;
      const seller = this.state.sellers.get(gig.sellerId);
      if (!seller?.hasVerifiedActiveWallet) return false;
      if (filter.category && gig.category !== filter.category) return false;
      if (filter.maxPriceCents !== undefined && gig.priceUSDInCents > filter.maxPriceCents) return false;
      if (filter.maxDays !== undefined && gig.initialDeliveryDays > filter.maxDays) return false;
      return true;
    });
    rows = rows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime() || b.id.localeCompare(a.id));
    if (filter.cursor) {
      const decoded = decodeCursor(filter.cursor);
      if (decoded) {
        rows = rows.filter(
          (gig) =>
            gig.createdAt.getTime() < decoded.createdAt.getTime() ||
            (gig.createdAt.getTime() === decoded.createdAt.getTime() && gig.id < decoded.id),
        );
      }
    }
    const page = rows.slice(0, filter.limit);
    const next = rows.length > filter.limit ? page[page.length - 1] : null;
    return {
      items: page.map(cloneGig),
      nextCursor: next ? encodeCursor(next.createdAt, next.id) : null,
    };
  }

  async createPublication(
    buyerId: string,
    input: CreatePublicationInput,
    pageDocument: PageDocument,
  ): Promise<StoredPublication> {
    const publication: StoredPublication = {
      id: randomUUID(),
      buyerId,
      category: input.category,
      expectedMediaType: input.expectedMediaType,
      title: input.title,
      description: input.description,
      initialBudgetUSDInCents: input.initialBudgetUSDInCents,
      initialDeliveryDays: input.initialDeliveryDays,
      preliminaryCriteria: input.preliminaryCriteria,
      allowedExtensions: input.allowedExtensions,
      minWordCount: input.minWordCount,
      minWidthPx: input.minWidthPx,
      minHeightPx: input.minHeightPx,
      status: 'OPEN_FOR_PROPOSALS',
      pageDocument: structuredClone(pageDocument),
      createdAt: new Date(),
    };
    this.state.publications.push(publication);
    return clonePublication(publication);
  }

  async updatePublicationPage(
    publicationId: string,
    buyerId: string,
    pageDocument: PageDocument,
  ): Promise<StoredPublication | 'NOT_FOUND' | 'FORBIDDEN'> {
    const publication = this.state.publications.find((item) => item.id === publicationId);
    if (!publication) return 'NOT_FOUND';
    if (publication.buyerId !== buyerId) return 'FORBIDDEN';
    publication.pageDocument = structuredClone(pageDocument);
    const hero = pageDocument.blocks.find((block) => block.type === 'hero');
    if (hero?.type === 'hero' && hero.title.length >= 10) {
      publication.title = hero.title;
    }
    return clonePublication(publication);
  }

  async findPublicationById(publicationId: string): Promise<StoredPublication | null> {
    const publication = this.state.publications.find((item) => item.id === publicationId);
    return publication ? clonePublication(publication) : null;
  }

  async listPublications(
    filter: ListPublicationsFilter,
  ): Promise<{ items: StoredPublication[]; nextCursor: string | null }> {
    const status: PublicationStatus = filter.status ?? 'OPEN_FOR_PROPOSALS';
    let rows = this.state.publications.filter((publication) => {
      if (publication.status !== status) return false;
      if (filter.category && publication.category !== filter.category) return false;
      return true;
    });
    rows = rows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime() || b.id.localeCompare(a.id));
    if (filter.cursor) {
      const decoded = decodeCursor(filter.cursor);
      if (decoded) {
        rows = rows.filter(
          (publication) =>
            publication.createdAt.getTime() < decoded.createdAt.getTime() ||
            (publication.createdAt.getTime() === decoded.createdAt.getTime() &&
              publication.id < decoded.id),
        );
      }
    }
    const page = rows.slice(0, filter.limit);
    const next = rows.length > filter.limit ? page[page.length - 1] : null;
    return {
      items: page.map(clonePublication),
      nextCursor: next ? encodeCursor(next.createdAt, next.id) : null,
    };
  }

  async countActiveProposals(publicationId: string): Promise<number> {
    return this.state.proposals.filter(
      (proposal) => proposal.publicationId === publicationId && proposal.status === 'IN_NEGOTIATION',
    ).length;
  }

  async markPublicationAgreedAndLocked(
    publicationId: string,
  ): Promise<StoredPublication | 'NOT_FOUND' | 'NOT_OPEN'> {
    const publication = this.state.publications.find((item) => item.id === publicationId);
    if (!publication) return 'NOT_FOUND';
    if (publication.status !== 'OPEN_FOR_PROPOSALS') return 'NOT_OPEN';
    publication.status = 'AGREED_AND_LOCKED';
    return clonePublication(publication);
  }

  async upsertProposalStub(input: {
    id: string;
    publicationId: string;
    status: 'IN_NEGOTIATION' | 'AGREED_PATH_1' | 'DISCREPANCY_CLOSED_PATH_2';
    closedReason?: string | null;
  }): Promise<void> {
    const existing = this.state.proposals.find((item) => item.id === input.id);
    if (existing) {
      existing.status = input.status;
      existing.closedReason = input.closedReason ?? existing.closedReason;
      return;
    }
    this.state.proposals.push({
      id: input.id,
      publicationId: input.publicationId,
      status: input.status,
      closedReason: input.closedReason ?? null,
    });
  }

  async cancelPublication(
    publicationId: string,
    buyerId: string,
    cancelReason?: string,
  ): Promise<
    | { ok: true; publication: StoredPublication }
    | { ok: false; reason: 'NOT_FOUND' | 'FORBIDDEN' | 'ALREADY_LOCKED' }
  > {
    const publication = this.state.publications.find((item) => item.id === publicationId);
    if (!publication) return { ok: false, reason: 'NOT_FOUND' };
    if (publication.buyerId !== buyerId) return { ok: false, reason: 'FORBIDDEN' };
    if (publication.status === 'AGREED_AND_LOCKED') return { ok: false, reason: 'ALREADY_LOCKED' };
    if (publication.status === 'OPEN_FOR_PROPOSALS') {
      publication.status = 'CANCELLED';
      publication.cancelReason = cancelReason;
      for (const proposal of this.state.proposals) {
        if (proposal.publicationId === publicationId && proposal.status === 'IN_NEGOTIATION') {
          proposal.status = 'DISCREPANCY_CLOSED_PATH_2';
          proposal.closedReason = 'PUBLICATION_CANCELLED_BY_BUYER';
        }
      }
    }
    return { ok: true, publication: clonePublication(publication) };
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
    return categories.map((category) => ({
      category,
      activeGigCount: this.state.gigs.filter((gig) => {
        if (!gig.isActive || gig.category !== category) return false;
        const seller = this.state.sellers.get(gig.sellerId);
        return Boolean(seller?.hasVerifiedActiveWallet);
      }).length,
      openPublicationCount: this.state.publications.filter(
        (publication) => publication.category === category && publication.status === 'OPEN_FOR_PROPOSALS',
      ).length,
    }));
  }

  async listMedia(entityType: MarketplaceMediaEntityType, entityId: string): Promise<StoredMediaAsset[]> {
    return this.state.media
      .filter((item) => item.entityType === entityType && item.entityId === entityId)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((item) => ({ ...item, bytes: item.bytes ? Buffer.from(item.bytes) : undefined }));
  }

  async findMediaById(mediaId: string): Promise<StoredMediaAsset | null> {
    const item = this.state.media.find((row) => row.id === mediaId);
    return item ? { ...item, bytes: item.bytes ? Buffer.from(item.bytes) : undefined } : null;
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
    const asset: StoredMediaAsset = {
      id: randomUUID(),
      ownerUserId: input.ownerUserId,
      entityType: input.entityType,
      entityId: input.entityId,
      mimeType: input.mimeType,
      byteSize: input.byteSize,
      storagePath: input.storagePath,
      sortOrder: input.sortOrder,
      bytes: input.bytes ? Buffer.from(input.bytes) : undefined,
    };
    this.state.media.push(asset);
    return { ...asset, bytes: asset.bytes ? Buffer.from(asset.bytes) : undefined };
  }

  async deleteMedia(
    mediaId: string,
    ownerUserId: string,
  ): Promise<StoredMediaAsset | 'NOT_FOUND' | 'FORBIDDEN'> {
    const index = this.state.media.findIndex((item) => item.id === mediaId);
    if (index < 0) return 'NOT_FOUND';
    const item = this.state.media[index]!;
    if (item.ownerUserId !== ownerUserId) return 'FORBIDDEN';
    this.state.media.splice(index, 1);
    return { ...item };
  }

  async listReviews(entityType: MarketplaceMediaEntityType, entityId: string): Promise<StoredReview[]> {
    return this.state.reviews
      .filter((item) => item.entityType === entityType && item.entityId === entityId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map((item) => ({ ...item }));
  }

  async findReviewByReviewer(
    entityType: MarketplaceMediaEntityType,
    entityId: string,
    reviewerUserId: string,
  ): Promise<StoredReview | null> {
    return (
      this.state.reviews.find(
        (item) =>
          item.entityType === entityType &&
          item.entityId === entityId &&
          item.reviewerUserId === reviewerUserId,
      ) ?? null
    );
  }

  async createReview(input: {
    entityType: MarketplaceMediaEntityType;
    entityId: string;
    reviewerUserId: string;
    rating: number;
    body: string;
  }): Promise<StoredReview | 'DUPLICATE'> {
    const existing = await this.findReviewByReviewer(input.entityType, input.entityId, input.reviewerUserId);
    if (existing) return 'DUPLICATE';
    const review: StoredReview = {
      id: randomUUID(),
      entityType: input.entityType,
      entityId: input.entityId,
      reviewerUserId: input.reviewerUserId,
      rating: input.rating,
      body: input.body,
      createdAt: new Date(),
    };
    this.state.reviews.push(review);
    return { ...review };
  }

  async hasEligibleClosedService(
    entityType: MarketplaceMediaEntityType,
    entityId: string,
    reviewerUserId: string,
  ): Promise<boolean> {
    return this.state.eligibleReviewers.has(eligibilityKey(entityType, entityId, reviewerUserId));
  }

  async seedEligibleReviewerForTest(input: {
    entityType: MarketplaceMediaEntityType;
    entityId: string;
    reviewerUserId: string;
  }): Promise<void> {
    this.state.eligibleReviewers.add(eligibilityKey(input.entityType, input.entityId, input.reviewerUserId));
  }
}
