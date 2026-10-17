import { Inject, Injectable } from '@nestjs/common';
import {
  CancelPublicationInputSchema,
  CATEGORY_MEDIA_CONSTRAINTS_MAP,
  CreateGigInputSchema,
  CreateMarketplaceReviewInputSchema,
  CreatePublicationInputSchema,
  MARKETPLACE_GALLERY_MAX,
  MARKETPLACE_MEDIA_MAX_BYTES,
  MARKETPLACE_MEDIA_MIME,
  MarketplaceListQuerySchema,
  UpdateGigInputSchema,
  UpdatePageDocumentInputSchema,
  UpdatePublicationInputSchema,
  defaultPageDocument,
  resolveMvpAiAuditableModality,
  type ClientTaskPublicationSummary,
  type GigCard,
  type MarketplaceCategoryCatalogItem,
  type MarketplaceMediaAsset,
  type MarketplaceReviewsPayload,
  type PageDocument,
} from '@taskstream/shared-schemas';
import { DomainError } from '../identity/domain-error';
import { IDENTITY_REPOSITORY } from '../identity/identity.tokens';
import type { IdentityRepository } from '../identity/identity.types';
import { readSessionUserId } from '../identity/session-token';
import { assertSafeMarketplaceContent, normalizeMarketplaceText } from './content-safety';
import { IdempotencyStore } from './idempotency.store';
import {
  deleteMarketplaceMediaFile,
  readMarketplaceMediaFile,
  writeMarketplaceMediaFile,
} from './media-storage';
import { MARKETPLACE_REPOSITORY } from './marketplace.tokens';
import type {
  MarketplaceMediaEntityType,
  MarketplaceRepository,
  StoredGig,
  StoredMediaAsset,
  StoredPublication,
  StoredSellerProfile,
} from './marketplace.types';

const UUID_V4_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Injectable()
export class MarketplaceService {
  constructor(
    @Inject(MARKETPLACE_REPOSITORY) private readonly marketplace: MarketplaceRepository,
    @Inject(IDENTITY_REPOSITORY) private readonly identity: IdentityRepository,
    @Inject(IdempotencyStore) private readonly idempotency: IdempotencyStore,
  ) {}

  async listCategories(): Promise<MarketplaceCategoryCatalogItem[]> {
    const counts = await this.marketplace.countByCategory();
    const byCategory = new Map(counts.map((item) => [item.category, item]));
    return (Object.keys(CATEGORY_MEDIA_CONSTRAINTS_MAP) as Array<keyof typeof CATEGORY_MEDIA_CONSTRAINTS_MAP>).map(
      (category) => {
        const canonical = CATEGORY_MEDIA_CONSTRAINTS_MAP[category];
        const tally = byCategory.get(category);
        return {
          category,
          expectedMediaType: canonical.expectedMediaType,
          allowedExtensions: [...canonical.allowedExtensions],
          aiAuditableModality: canonical.aiAuditableModality,
          activeGigCount: tally?.activeGigCount ?? 0,
          openPublicationCount: tally?.openPublicationCount ?? 0,
        };
      },
    );
  }

  async listGigs(query: unknown): Promise<{ items: GigCard[]; nextCursor: string | null }> {
    const parsed = MarketplaceListQuerySchema.safeParse(query);
    if (!parsed.success) {
      throw new DomainError(400, 'VALIDATION_ERROR');
    }
    const page = await this.marketplace.listActiveGigs({
      category: parsed.data.category,
      maxPriceCents: parsed.data.maxPriceCents,
      maxDays: parsed.data.maxDays,
      cursor: parsed.data.cursor,
      limit: parsed.data.limit,
    });
    const items: GigCard[] = [];
    for (const gig of page.items) {
      items.push(await this.toGigCard(gig));
    }
    return { items, nextCursor: page.nextCursor };
  }

  async getGig(gigId: string): Promise<GigCard> {
    const gig = await this.marketplace.findGigById(gigId);
    if (!gig || !gig.isActive) {
      throw new DomainError(404, 'GIG_NOT_FOUND');
    }
    return this.toGigCard(gig);
  }

  /** Soft-delete: el Gig deja de listarse y contratar; órdenes históricas no se tocan. */
  async deleteGig(userId: string, gigId: string): Promise<{ ok: true; gigId: string }> {
    const existing = await this.marketplace.findGigById(gigId);
    if (!existing) throw new DomainError(404, 'GIG_NOT_FOUND');
    if (existing.sellerId !== userId) throw new DomainError(403, 'FORBIDDEN_GIG_OWNERSHIP');
    if (!existing.isActive) return { ok: true, gigId };
    const result = await this.marketplace.updateGig(gigId, userId, { isActive: false });
    if (result === 'NOT_FOUND') throw new DomainError(404, 'GIG_NOT_FOUND');
    if (result === 'FORBIDDEN') throw new DomainError(403, 'FORBIDDEN_GIG_OWNERSHIP');
    return { ok: true, gigId };
  }

  async createGig(userId: string, body: unknown, idempotencyKey: string | undefined): Promise<GigCard> {
    const key = this.requireIdempotencyKey(idempotencyKey);
    const cached = this.idempotency.get(`gig:${userId}`, key);
    if (cached) return cached.response as GigCard;

    const input = this.parseCreateGig(body);
    this.assertSafeGigOrPublication({
      title: input.title,
      description: input.description,
      criteria: input.defaultCriteria.map((item) => item.description),
    });

    const user = await this.identity.findUserById(userId);
    if (!user) {
      throw new DomainError(401, 'UNAUTHENTICATED');
    }
    const seller = await this.marketplace.ensureSellerProfile(userId, user.displayName);
    const pageDocument = defaultPageDocument({
      title: normalizeMarketplaceText(input.title),
      displayName: user.displayName,
      headline: seller.headline,
    });
    const gig = await this.marketplace.createGig(
      userId,
      {
        ...input,
        title: normalizeMarketplaceText(input.title),
        description: normalizeMarketplaceText(input.description),
        defaultCriteria: input.defaultCriteria.map((criterion) => ({
          ...criterion,
          description: normalizeMarketplaceText(criterion.description),
        })),
      },
      pageDocument,
    );
    const card = await this.toGigCard(gig);
    this.idempotency.set(`gig:${userId}`, key, 201, card);
    return card;
  }

  async updateGig(userId: string, gigId: string, body: unknown): Promise<GigCard> {
    const parsed = UpdateGigInputSchema.safeParse(body);
    if (!parsed.success) {
      throw new DomainError(400, 'VALIDATION_ERROR');
    }
    const safetyFields: Record<string, string> = {};
    if (parsed.data.title) safetyFields.title = parsed.data.title;
    if (parsed.data.description) safetyFields.description = parsed.data.description;
    parsed.data.defaultCriteria?.forEach((criterion, index) => {
      safetyFields[`criterion_${index}`] = criterion.description;
    });
    if (Object.keys(safetyFields).length > 0) {
      assertSafeMarketplaceContent(safetyFields);
    }
    const categoryPatch =
      parsed.data.category !== undefined
        ? {
            category: parsed.data.category,
            expectedMediaType: CATEGORY_MEDIA_CONSTRAINTS_MAP[parsed.data.category].expectedMediaType,
            allowedExtensions: [...CATEGORY_MEDIA_CONSTRAINTS_MAP[parsed.data.category].allowedExtensions],
          }
        : {};
    const result = await this.marketplace.updateGig(gigId, userId, {
      ...parsed.data,
      ...categoryPatch,
      title: parsed.data.title ? normalizeMarketplaceText(parsed.data.title) : undefined,
      description: parsed.data.description ? normalizeMarketplaceText(parsed.data.description) : undefined,
      defaultCriteria: parsed.data.defaultCriteria?.map((criterion) => ({
        ...criterion,
        description: normalizeMarketplaceText(criterion.description),
      })),
    });
    if (result === 'NOT_FOUND') throw new DomainError(404, 'GIG_NOT_FOUND');
    if (result === 'FORBIDDEN') throw new DomainError(403, 'FORBIDDEN_GIG_OWNERSHIP');
    return this.toGigCard(result);
  }

  async updatePublication(userId: string, publicationId: string, body: unknown): Promise<ClientTaskPublicationSummary> {
    const parsed = UpdatePublicationInputSchema.safeParse(body);
    if (!parsed.success) {
      throw new DomainError(400, 'VALIDATION_ERROR');
    }
    const safetyFields: Record<string, string> = {};
    if (parsed.data.title) safetyFields.title = parsed.data.title;
    if (parsed.data.description) safetyFields.description = parsed.data.description;
    if (Object.keys(safetyFields).length > 0) {
      assertSafeMarketplaceContent(safetyFields);
    }
    const categoryPatch =
      parsed.data.category !== undefined
        ? {
            category: parsed.data.category,
            expectedMediaType: CATEGORY_MEDIA_CONSTRAINTS_MAP[parsed.data.category].expectedMediaType,
            allowedExtensions: [...CATEGORY_MEDIA_CONSTRAINTS_MAP[parsed.data.category].allowedExtensions],
          }
        : {};
    const result = await this.marketplace.updatePublication(publicationId, userId, {
      ...parsed.data,
      ...categoryPatch,
      title: parsed.data.title ? normalizeMarketplaceText(parsed.data.title) : undefined,
      description: parsed.data.description ? normalizeMarketplaceText(parsed.data.description) : undefined,
    });
    if (result === 'NOT_FOUND') throw new DomainError(404, 'PUBLICATION_NOT_FOUND');
    if (result === 'FORBIDDEN') throw new DomainError(403, 'FORBIDDEN_PUBLICATION_OWNERSHIP');
    if (result === 'NOT_OPEN') throw new DomainError(409, 'PUBLICATION_ALREADY_LOCKED');
    return this.toPublicationSummary(result);
  }

  async updateGigPage(userId: string, gigId: string, body: unknown): Promise<GigCard> {
    const pageDocument = await this.parsePageDocument(body, userId);
    const result = await this.marketplace.updateGigPage(gigId, userId, pageDocument);
    if (result === 'NOT_FOUND') throw new DomainError(404, 'GIG_NOT_FOUND');
    if (result === 'FORBIDDEN') throw new DomainError(403, 'FORBIDDEN_GIG_OWNERSHIP');
    return this.toGigCard(result);
  }

  async listPublications(query: unknown): Promise<{ items: ClientTaskPublicationSummary[]; nextCursor: string | null }> {
    const parsed = MarketplaceListQuerySchema.safeParse(query);
    if (!parsed.success) {
      throw new DomainError(400, 'VALIDATION_ERROR');
    }
    const page = await this.marketplace.listPublications({
      category: parsed.data.category,
      status: parsed.data.status,
      cursor: parsed.data.cursor,
      limit: parsed.data.limit,
    });
    const items: ClientTaskPublicationSummary[] = [];
    for (const publication of page.items) {
      items.push(await this.toPublicationSummary(publication));
    }
    return { items, nextCursor: page.nextCursor };
  }

  async getPublication(publicationId: string): Promise<ClientTaskPublicationSummary> {
    const publication = await this.marketplace.findPublicationById(publicationId);
    if (!publication) {
      throw new DomainError(404, 'PUBLICATION_NOT_FOUND');
    }
    return this.toPublicationSummary(publication);
  }

  async listReviews(
    entityType: MarketplaceMediaEntityType,
    entityId: string,
    authorizationHeader: string | undefined,
  ): Promise<MarketplaceReviewsPayload> {
    await this.requireStorefrontEntity(entityType, entityId);
    const viewerUserId = this.optionalUserId(authorizationHeader);
    return this.buildReviewsPayload(entityType, entityId, viewerUserId);
  }

  async createReview(
    userId: string,
    entityType: MarketplaceMediaEntityType,
    entityId: string,
    body: unknown,
  ): Promise<MarketplaceReviewsPayload> {
    const ownerUserId = await this.requireStorefrontEntity(entityType, entityId);
    if (ownerUserId === userId) {
      throw new DomainError(403, 'CANNOT_REVIEW_OWN_STOREFRONT');
    }
    const parsed = CreateMarketplaceReviewInputSchema.safeParse(body);
    if (!parsed.success) {
      throw new DomainError(400, 'VALIDATION_ERROR');
    }
    const eligible = await this.marketplace.hasEligibleClosedService(entityType, entityId, userId);
    if (!eligible) {
      throw new DomainError(403, 'REVIEW_REQUIRES_CLOSED_SERVICE');
    }
    const existing = await this.marketplace.findReviewByReviewer(entityType, entityId, userId);
    if (existing) {
      throw new DomainError(409, 'REVIEW_ALREADY_EXISTS');
    }
    assertSafeMarketplaceContent({ body: parsed.data.body });
    const created = await this.marketplace.createReview({
      entityType,
      entityId,
      reviewerUserId: userId,
      rating: parsed.data.rating,
      body: normalizeMarketplaceText(parsed.data.body),
    });
    if (created === 'DUPLICATE') {
      throw new DomainError(409, 'REVIEW_ALREADY_EXISTS');
    }
    return this.buildReviewsPayload(entityType, entityId, userId);
  }

  async createPublication(
    userId: string,
    body: unknown,
    idempotencyKey: string | undefined,
  ): Promise<ClientTaskPublicationSummary> {
    const key = this.requireIdempotencyKey(idempotencyKey);
    const cached = this.idempotency.get(`publication:${userId}`, key);
    if (cached) return cached.response as ClientTaskPublicationSummary;

    const input = this.parseCreatePublication(body);
    this.assertSafeGigOrPublication({
      title: input.title,
      description: input.description,
      criteria: input.preliminaryCriteria.map((item) => item.description),
    });

    const user = await this.identity.findUserById(userId);
    if (!user) {
      throw new DomainError(401, 'UNAUTHENTICATED');
    }
    const pageDocument = defaultPageDocument({
      title: normalizeMarketplaceText(input.title),
      displayName: user.displayName,
      headline: null,
    });
    const publication = await this.marketplace.createPublication(
      userId,
      {
        ...input,
        title: normalizeMarketplaceText(input.title),
        description: normalizeMarketplaceText(input.description),
        preliminaryCriteria: input.preliminaryCriteria.map((criterion) => ({
          ...criterion,
          description: normalizeMarketplaceText(criterion.description),
        })),
      },
      pageDocument,
    );
    const summary = await this.toPublicationSummary(publication);
    this.idempotency.set(`publication:${userId}`, key, 201, summary);
    return summary;
  }

  async updatePublicationPage(
    userId: string,
    publicationId: string,
    body: unknown,
  ): Promise<ClientTaskPublicationSummary> {
    const pageDocument = await this.parsePageDocument(body, userId);
    const result = await this.marketplace.updatePublicationPage(publicationId, userId, pageDocument);
    if (result === 'NOT_FOUND') throw new DomainError(404, 'PUBLICATION_NOT_FOUND');
    if (result === 'FORBIDDEN') throw new DomainError(403, 'FORBIDDEN_PUBLICATION_OWNERSHIP');
    return this.toPublicationSummary(result);
  }

  async cancelPublication(
    userId: string,
    publicationId: string,
    body: unknown,
  ): Promise<ClientTaskPublicationSummary> {
    const parsed = CancelPublicationInputSchema.safeParse(body ?? {});
    if (!parsed.success) {
      throw new DomainError(400, 'VALIDATION_ERROR');
    }
    const result = await this.marketplace.cancelPublication(publicationId, userId, parsed.data.cancelReason);
    if (result.ok === false) {
      if (result.reason === 'NOT_FOUND') throw new DomainError(404, 'PUBLICATION_NOT_FOUND');
      if (result.reason === 'FORBIDDEN') throw new DomainError(403, 'FORBIDDEN_PUBLICATION_OWNERSHIP');
      throw new DomainError(409, 'PUBLICATION_ALREADY_LOCKED');
    }
    return this.toPublicationSummary(result.publication);
  }

  async uploadMedia(
    userId: string,
    entityType: MarketplaceMediaEntityType,
    entityId: string,
    file: { buffer: Buffer; mimetype: string; size: number } | undefined,
  ): Promise<MarketplaceMediaAsset> {
    if (!file) throw new DomainError(400, 'VALIDATION_ERROR');
    if (!(MARKETPLACE_MEDIA_MIME as readonly string[]).includes(file.mimetype)) {
      throw new DomainError(400, 'MEDIA_MIME_UNSUPPORTED');
    }
    if (file.size <= 0 || file.size > MARKETPLACE_MEDIA_MAX_BYTES) {
      throw new DomainError(400, 'MEDIA_TOO_LARGE');
    }
    await this.assertEntityOwner(userId, entityType, entityId);
    const existing = await this.marketplace.listMedia(entityType, entityId);
    if (existing.length >= MARKETPLACE_GALLERY_MAX) {
      throw new DomainError(409, 'GALLERY_FULL');
    }
    const written = writeMarketplaceMediaFile({
      entityType,
      entityId,
      mimeType: file.mimetype,
      bytes: file.buffer,
    });
    const asset = await this.marketplace.addMedia({
      ownerUserId: userId,
      entityType,
      entityId,
      mimeType: file.mimetype as StoredMediaAsset['mimeType'],
      byteSize: file.size,
      storagePath: written.storagePath,
      sortOrder: existing.length,
      bytes: file.buffer,
    });
    await this.syncGalleryBlock(entityType, entityId, userId);
    return this.toMediaAsset(asset);
  }

  async deleteMedia(userId: string, mediaId: string): Promise<{ ok: true }> {
    const result = await this.marketplace.deleteMedia(mediaId, userId);
    if (result === 'NOT_FOUND') throw new DomainError(404, 'MEDIA_NOT_FOUND');
    if (result === 'FORBIDDEN') throw new DomainError(403, 'FORBIDDEN_MEDIA_OWNERSHIP');
    deleteMarketplaceMediaFile(result.storagePath);
    await this.syncGalleryBlock(result.entityType, result.entityId, userId);
    return { ok: true };
  }

  async readMediaFile(mediaId: string): Promise<{ mimeType: string; bytes: Buffer }> {
    const asset = await this.marketplace.findMediaById(mediaId);
    if (!asset) throw new DomainError(404, 'MEDIA_NOT_FOUND');
    if (asset.bytes) {
      return { mimeType: asset.mimeType, bytes: asset.bytes };
    }
    const fromDisk = readMarketplaceMediaFile(asset.storagePath);
    if (!fromDisk) throw new DomainError(404, 'MEDIA_NOT_FOUND');
    return { mimeType: asset.mimeType, bytes: fromDisk };
  }

  private async syncGalleryBlock(
    entityType: MarketplaceMediaEntityType,
    entityId: string,
    ownerUserId: string,
  ): Promise<void> {
    const media = await this.marketplace.listMedia(entityType, entityId);
    const mediaIds = media.map((item) => item.id);
    if (entityType === 'GIG') {
      const gig = await this.marketplace.findGigById(entityId);
      if (!gig || gig.sellerId !== ownerUserId) return;
      const pageDocument = withGalleryIds(gig.pageDocument, mediaIds);
      await this.marketplace.updateGigPage(entityId, ownerUserId, pageDocument);
      return;
    }
    const publication = await this.marketplace.findPublicationById(entityId);
    if (!publication || publication.buyerId !== ownerUserId) return;
    const pageDocument = withGalleryIds(publication.pageDocument, mediaIds);
    await this.marketplace.updatePublicationPage(entityId, ownerUserId, pageDocument);
  }

  private async assertEntityOwner(
    userId: string,
    entityType: MarketplaceMediaEntityType,
    entityId: string,
  ): Promise<void> {
    if (entityType === 'GIG') {
      const gig = await this.marketplace.findGigById(entityId);
      if (!gig) throw new DomainError(404, 'GIG_NOT_FOUND');
      if (gig.sellerId !== userId) throw new DomainError(403, 'FORBIDDEN_GIG_OWNERSHIP');
      return;
    }
    const publication = await this.marketplace.findPublicationById(entityId);
    if (!publication) throw new DomainError(404, 'PUBLICATION_NOT_FOUND');
    if (publication.buyerId !== userId) throw new DomainError(403, 'FORBIDDEN_PUBLICATION_OWNERSHIP');
  }

  private async parsePageDocument(body: unknown, userId: string): Promise<PageDocument> {
    const parsed = UpdatePageDocumentInputSchema.safeParse(body);
    if (!parsed.success) {
      throw new DomainError(400, 'VALIDATION_ERROR');
    }
    return this.lockProfileDisplayNameAsync(parsed.data.pageDocument, userId);
  }

  private async lockProfileDisplayNameAsync(doc: PageDocument, userId: string): Promise<PageDocument> {
    const user = await this.identity.findUserById(userId);
    const displayName = user?.displayName ?? 'Usuario';
    return {
      ...doc,
      blocks: doc.blocks.map((block) =>
        block.type === 'profile' ? { ...block, displayName } : block,
      ),
    };
  }

  private requireIdempotencyKey(raw: string | undefined): string {
    if (!raw || !UUID_V4_RE.test(raw)) {
      throw new DomainError(400, 'VALIDATION_ERROR');
    }
    return raw;
  }

  private parseCreateGig(body: unknown) {
    const parsed = CreateGigInputSchema.safeParse(body);
    if (!parsed.success) {
      throw this.mapCreateValidationError(parsed.error.issues);
    }
    return parsed.data;
  }

  private parseCreatePublication(body: unknown) {
    const parsed = CreatePublicationInputSchema.safeParse(body);
    if (!parsed.success) {
      throw this.mapCreateValidationError(parsed.error.issues);
    }
    return parsed.data;
  }

  private mapCreateValidationError(
    issues: Array<{ path: PropertyKey[]; message: string }>,
  ): DomainError {
    const mismatch = issues.some(
      (issue) =>
        issue.path.includes('expectedMediaType') ||
        issue.path.includes('allowedExtensions') ||
        issue.message.includes('exige el tipo') ||
        issue.message.includes('Extensiones no permitidas'),
    );
    return new DomainError(
      mismatch ? 422 : 400,
      mismatch ? 'CATEGORY_MEDIA_TYPE_MISMATCH' : 'VALIDATION_ERROR',
    );
  }

  private assertSafeGigOrPublication(input: {
    title: string;
    description: string;
    criteria: string[];
  }): void {
    const fields: Record<string, string> = {
      title: input.title,
      description: input.description,
    };
    input.criteria.forEach((description, index) => {
      fields[`criterion_${index}`] = description;
    });
    assertSafeMarketplaceContent(fields);
  }

  private async requireSellerCard(userId: string): Promise<StoredSellerProfile> {
    const seller = await this.marketplace.findSellerProfile(userId);
    if (seller) return seller;
    const user = await this.identity.findUserById(userId);
    const wallet = await this.identity.findActiveWallet(userId);
    return {
      userId,
      displayName: user?.displayName ?? 'Seller',
      headline: null,
      webMonetizationEnabled: false,
      verifiedWalletAddressUrl: wallet?.isVerified && wallet.isActive ? wallet.walletAddressUrl : null,
      targetCurrency: wallet?.assetCode?.slice(0, 3).toUpperCase() ?? 'USD',
      hasVerifiedActiveWallet: Boolean(wallet?.isVerified && wallet.isActive),
    };
  }

  private async toGigCard(gig: StoredGig): Promise<GigCard> {
    const seller = await this.requireSellerCard(gig.sellerId);
    const galleryRows = await this.marketplace.listMedia('GIG', gig.id);
    const monetizationUrl =
      seller.webMonetizationEnabled && seller.verifiedWalletAddressUrl?.startsWith('https://')
        ? seller.verifiedWalletAddressUrl
        : null;
    const pageDocument = await this.lockProfileDisplayNameAsync(gig.pageDocument, gig.sellerId);
    return {
      gigId: gig.id,
      seller: {
        userId: seller.userId,
        displayName: seller.displayName,
        headline: seller.headline,
        webMonetizationEnabled: seller.webMonetizationEnabled,
        verifiedWalletAddressUrl: monetizationUrl,
        targetCurrency: seller.targetCurrency,
      },
      title: gig.title,
      description: gig.description,
      category: gig.category,
      expectedMediaType: gig.expectedMediaType as GigCard['expectedMediaType'],
      aiAuditableModality: resolveMvpAiAuditableModality(gig.expectedMediaType),
      priceUSDInCents: gig.priceUSDInCents,
      initialDeliveryDays: gig.initialDeliveryDays,
      defaultCriteria: gig.defaultCriteria,
      isActive: gig.isActive,
      createdAt: gig.createdAt.toISOString(),
      pageDocument,
      gallery: galleryRows.map((item) => this.toMediaAsset(item)),
    };
  }

  private async toPublicationSummary(publication: StoredPublication): Promise<ClientTaskPublicationSummary> {
    const activeProposalCount = await this.marketplace.countActiveProposals(publication.id);
    const buyer = await this.identity.findUserById(publication.buyerId);
    const galleryRows = await this.marketplace.listMedia('PUBLICATION', publication.id);
    const pageDocument = await this.lockProfileDisplayNameAsync(publication.pageDocument, publication.buyerId);
    return {
      publicationId: publication.id,
      buyerUserId: publication.buyerId,
      buyerDisplayName: buyer?.displayName ?? 'Buyer',
      title: publication.title,
      description: publication.description,
      category: publication.category,
      expectedMediaType: publication.expectedMediaType as ClientTaskPublicationSummary['expectedMediaType'],
      aiAuditableModality: resolveMvpAiAuditableModality(publication.expectedMediaType),
      initialBudgetUSDInCents: publication.initialBudgetUSDInCents,
      initialDeliveryDays: publication.initialDeliveryDays,
      preliminaryCriteria: publication.preliminaryCriteria,
      allowedExtensions: publication.allowedExtensions,
      status: publication.status,
      activeProposalCount,
      createdAt: publication.createdAt.toISOString(),
      pageDocument,
      gallery: galleryRows.map((item) => this.toMediaAsset(item)),
    };
  }

  private toMediaAsset(asset: StoredMediaAsset): MarketplaceMediaAsset {
    return {
      mediaId: asset.id,
      mimeType: asset.mimeType,
      byteSize: asset.byteSize,
      sortOrder: asset.sortOrder,
      url: `/api/v1/marketplace/media/${asset.id}`,
    };
  }

  private optionalUserId(authorizationHeader: string | undefined): string | null {
    const header = authorizationHeader ?? '';
    const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length).trim() : '';
    return token ? readSessionUserId(token) : null;
  }

  private async requireStorefrontEntity(
    entityType: MarketplaceMediaEntityType,
    entityId: string,
  ): Promise<string> {
    if (entityType === 'GIG') {
      const gig = await this.marketplace.findGigById(entityId);
      if (!gig) throw new DomainError(404, 'GIG_NOT_FOUND');
      return gig.sellerId;
    }
    const publication = await this.marketplace.findPublicationById(entityId);
    if (!publication) throw new DomainError(404, 'PUBLICATION_NOT_FOUND');
    return publication.buyerId;
  }

  private async buildReviewsPayload(
    entityType: MarketplaceMediaEntityType,
    entityId: string,
    viewerUserId: string | null,
  ): Promise<MarketplaceReviewsPayload> {
    const rows = await this.marketplace.listReviews(entityType, entityId);
    const reviews = [];
    for (const row of rows) {
      const reviewer = await this.identity.findUserById(row.reviewerUserId);
      reviews.push({
        reviewId: row.id,
        reviewerUserId: row.reviewerUserId,
        reviewerDisplayName: reviewer?.displayName ?? 'Usuario',
        reviewerAvatarUrl: reviewer?.avatarUrl ?? null,
        rating: row.rating,
        body: row.body,
        createdAt: row.createdAt.toISOString(),
      });
    }
    const reviewCount = reviews.length;
    const averageRating =
      reviewCount === 0
        ? null
        : Math.round((reviews.reduce((sum, item) => sum + item.rating, 0) / reviewCount) * 10) / 10;

    let alreadyReviewed = false;
    let canReview = false;
    if (viewerUserId) {
      const ownerUserId = await this.requireStorefrontEntity(entityType, entityId);
      alreadyReviewed = Boolean(
        await this.marketplace.findReviewByReviewer(entityType, entityId, viewerUserId),
      );
      if (!alreadyReviewed && ownerUserId !== viewerUserId) {
        canReview = await this.marketplace.hasEligibleClosedService(entityType, entityId, viewerUserId);
      }
    }

    return {
      averageRating,
      reviewCount,
      reviews,
      canReview,
      alreadyReviewed,
    };
  }
}

function withGalleryIds(doc: PageDocument, mediaIds: string[]): PageDocument {
  return {
    ...doc,
    blocks: doc.blocks.map((block) =>
      block.type === 'gallery' ? { ...block, mediaIds: mediaIds.slice(0, MARKETPLACE_GALLERY_MAX) } : block,
    ),
  };
}
