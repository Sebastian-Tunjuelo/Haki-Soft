import type {
  CreateGigInput,
  CreatePublicationInput,
  GigCard,
  ClientTaskPublicationSummary,
  PageDocument,
  UpdateGigInput,
  UpdatePublicationInput,
} from '@taskstream/shared-schemas';

export type PublicationStatus = 'OPEN_FOR_PROPOSALS' | 'AGREED_AND_LOCKED' | 'CANCELLED';
export type TaskCategory =
  | 'DIGITAL_MARKETING'
  | 'GRAPHICS_AND_DESIGN'
  | 'PROGRAMMING_AND_TECH'
  | 'TECHNICAL_WRITING_TRANS'
  | 'VIDEO_AND_ANIMATION'
  | 'MUSIC_AND_AUDIO';

export type MarketplaceMediaEntityType = 'GIG' | 'PUBLICATION';

export interface StoredSellerProfile {
  userId: string;
  displayName: string;
  headline: string | null;
  webMonetizationEnabled: boolean;
  verifiedWalletAddressUrl: string | null;
  targetCurrency: string;
  hasVerifiedActiveWallet: boolean;
}

export interface StoredGig {
  id: string;
  sellerId: string;
  category: TaskCategory;
  expectedMediaType: string;
  title: string;
  description: string;
  priceUSDInCents: number;
  initialDeliveryDays: number;
  defaultCriteria: CreateGigInput['defaultCriteria'];
  allowedExtensions: string[];
  isActive: boolean;
  pageDocument: PageDocument;
  createdAt: Date;
}

export interface StoredPublication {
  id: string;
  buyerId: string;
  category: TaskCategory;
  expectedMediaType: string;
  title: string;
  description: string;
  initialBudgetUSDInCents: number;
  initialDeliveryDays: number;
  preliminaryCriteria: CreatePublicationInput['preliminaryCriteria'];
  allowedExtensions: string[];
  minWordCount?: number;
  minWidthPx?: number;
  minHeightPx?: number;
  status: PublicationStatus;
  cancelReason?: string;
  pageDocument: PageDocument;
  createdAt: Date;
}

export interface StoredMediaAsset {
  id: string;
  ownerUserId: string;
  entityType: MarketplaceMediaEntityType;
  entityId: string;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  byteSize: number;
  storagePath: string;
  sortOrder: number;
  /** Solo memoria/tests: bytes del archivo. */
  bytes?: Buffer;
}

export interface StoredReview {
  id: string;
  entityType: MarketplaceMediaEntityType;
  entityId: string;
  reviewerUserId: string;
  rating: number;
  body: string;
  createdAt: Date;
}

export interface StoredProposal {
  id: string;
  publicationId: string;
  status: 'IN_NEGOTIATION' | 'AGREED_PATH_1' | 'DISCREPANCY_CLOSED_PATH_2';
  closedReason: string | null;
}

export interface ListGigsFilter {
  category?: TaskCategory;
  maxPriceCents?: number;
  maxDays?: number;
  cursor?: string;
  limit: number;
}

export interface ListPublicationsFilter {
  category?: TaskCategory;
  status?: PublicationStatus;
  cursor?: string;
  limit: number;
}

export interface CategoryCounts {
  category: TaskCategory;
  activeGigCount: number;
  openPublicationCount: number;
}

export interface MarketplaceRepository {
  findSellerProfile(userId: string): Promise<StoredSellerProfile | null>;
  ensureSellerProfile(userId: string, displayName: string): Promise<StoredSellerProfile>;
  createGig(sellerId: string, input: CreateGigInput, pageDocument: PageDocument): Promise<StoredGig>;
  updateGig(
    gigId: string,
    sellerId: string,
    input: UpdateGigInput & {
      expectedMediaType?: StoredGig['expectedMediaType'];
      allowedExtensions?: string[];
    },
  ): Promise<StoredGig | 'NOT_FOUND' | 'FORBIDDEN'>;
  updatePublication(
    publicationId: string,
    buyerId: string,
    input: UpdatePublicationInput & {
      expectedMediaType?: string;
      allowedExtensions?: string[];
    },
  ): Promise<StoredPublication | 'NOT_FOUND' | 'FORBIDDEN' | 'NOT_OPEN'>;
  findGigById(gigId: string): Promise<StoredGig | null>;
  listActiveGigs(filter: ListGigsFilter): Promise<{ items: StoredGig[]; nextCursor: string | null }>;
  updateGigPage(
    gigId: string,
    sellerId: string,
    pageDocument: PageDocument,
  ): Promise<StoredGig | 'NOT_FOUND' | 'FORBIDDEN'>;
  createPublication(
    buyerId: string,
    input: CreatePublicationInput,
    pageDocument: PageDocument,
  ): Promise<StoredPublication>;
  findPublicationById(publicationId: string): Promise<StoredPublication | null>;
  listPublications(filter: ListPublicationsFilter): Promise<{ items: StoredPublication[]; nextCursor: string | null }>;
  updatePublicationPage(
    publicationId: string,
    buyerId: string,
    pageDocument: PageDocument,
  ): Promise<StoredPublication | 'NOT_FOUND' | 'FORBIDDEN'>;
  countActiveProposals(publicationId: string): Promise<number>;
  /** SPEC-05 Camino 1: bloquea publicación OPEN → AGREED_AND_LOCKED. */
  markPublicationAgreedAndLocked(
    publicationId: string,
  ): Promise<StoredPublication | 'NOT_FOUND' | 'NOT_OPEN'>;
  /** SPEC-05: sincroniza stub de propuesta para el contador del marketplace. */
  upsertProposalStub(input: {
    id: string;
    publicationId: string;
    status: 'IN_NEGOTIATION' | 'AGREED_PATH_1' | 'DISCREPANCY_CLOSED_PATH_2';
    closedReason?: string | null;
  }): Promise<void>;
  cancelPublication(
    publicationId: string,
    buyerId: string,
    cancelReason?: string,
  ): Promise<
    | { ok: true; publication: StoredPublication }
    | { ok: false; reason: 'NOT_FOUND' | 'FORBIDDEN' | 'ALREADY_LOCKED' }
  >;
  countByCategory(): Promise<CategoryCounts[]>;
  listMedia(entityType: MarketplaceMediaEntityType, entityId: string): Promise<StoredMediaAsset[]>;
  findMediaById(mediaId: string): Promise<StoredMediaAsset | null>;
  addMedia(input: {
    ownerUserId: string;
    entityType: MarketplaceMediaEntityType;
    entityId: string;
    mimeType: StoredMediaAsset['mimeType'];
    byteSize: number;
    storagePath: string;
    sortOrder: number;
    bytes?: Buffer;
  }): Promise<StoredMediaAsset>;
  deleteMedia(
    mediaId: string,
    ownerUserId: string,
  ): Promise<StoredMediaAsset | 'NOT_FOUND' | 'FORBIDDEN'>;
  listReviews(entityType: MarketplaceMediaEntityType, entityId: string): Promise<StoredReview[]>;
  findReviewByReviewer(
    entityType: MarketplaceMediaEntityType,
    entityId: string,
    reviewerUserId: string,
  ): Promise<StoredReview | null>;
  createReview(input: {
    entityType: MarketplaceMediaEntityType;
    entityId: string;
    reviewerUserId: string;
    rating: number;
    body: string;
  }): Promise<StoredReview | 'DUPLICATE'>;
  /** True si hubo orden cerrada (entrega o reembolso) entre reviewer y el storefront. */
  hasEligibleClosedService(
    entityType: MarketplaceMediaEntityType,
    entityId: string,
    reviewerUserId: string,
  ): Promise<boolean>;
  /** Solo tests: fuerza wallet verificada y perfil seller. */
  seedVerifiedSeller?(input: {
    userId: string;
    displayName: string;
    walletAddressUrl: string;
    assetCode?: string;
    webMonetizationEnabled?: boolean;
  }): Promise<void>;
  /** Solo tests: marca una publicación como AGREED_AND_LOCKED. */
  lockPublicationForTest?(publicationId: string): Promise<void>;
  /** Solo tests: añade propuesta IN_NEGOTIATION. */
  addOpenProposalForTest?(publicationId: string): Promise<void>;
  /** Solo tests: habilita reseña sin TaskOrder real. */
  seedEligibleReviewerForTest?(input: {
    entityType: MarketplaceMediaEntityType;
    entityId: string;
    reviewerUserId: string;
  }): Promise<void>;
}

export type {
  GigCard,
  ClientTaskPublicationSummary,
  CreateGigInput,
  CreatePublicationInput,
  UpdateGigInput,
  UpdatePublicationInput,
};
