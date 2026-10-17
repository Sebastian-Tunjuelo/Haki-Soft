export type PageBlock =
  | { type: 'hero'; title: string }
  | { type: 'profile'; displayName: string; headline: string | null; avatarUrl: string | null }
  | { type: 'about'; html: string }
  | { type: 'serviceMeta' }
  | { type: 'gallery'; mediaIds: string[] }
  | { type: 'links'; items: Array<{ label: string; href: string }> }
  | { type: 'body'; html: string };

export type PageDocument = {
  version: 1;
  blocks: PageBlock[];
};

export type GalleryItem = {
  mediaId: string;
  mimeType: string;
  byteSize: number;
  sortOrder: number;
  url: string;
};

export type StorefrontGig = {
  gigId: string;
  title: string;
  description: string;
  category: string;
  priceUSDInCents: number;
  initialDeliveryDays: number;
  aiAuditableModality: 'IMAGE' | 'TEXT' | null;
  pageDocument: PageDocument;
  gallery: GalleryItem[];
  seller: {
    userId: string;
    displayName: string;
    headline: string | null;
    webMonetizationEnabled: boolean;
    verifiedWalletAddressUrl: string | null;
    targetCurrency: string;
  };
};

export type StorefrontPublication = {
  publicationId: string;
  buyerUserId: string;
  buyerDisplayName: string;
  title: string;
  description: string;
  category: string;
  initialBudgetUSDInCents: number;
  initialDeliveryDays: number;
  aiAuditableModality: 'IMAGE' | 'TEXT' | null;
  status: string;
  pageDocument: PageDocument;
  gallery: GalleryItem[];
};
