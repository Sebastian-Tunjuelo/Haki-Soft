import { z } from 'zod';
import {
  MAX_MARKETPLACE_AMOUNT_USD_IN_CENTS,
  MIN_MARKETPLACE_AMOUNT_USD_IN_CENTS,
} from './money';
import { MarketplaceMediaAssetSchema, PageDocumentSchema } from './page-document';
import {
  AcceptanceCriterionSchema,
  DeliverableMediaTypeEnum,
  MvpAiAuditableModalityEnum,
  PublicationStatusEnum,
  TaskCategoryEnum,
} from './schemas';

/**
 * Matriz canónica inmutable: categoría ↔ medio ↔ extensiones ↔ modalidad IA (SPEC-04).
 */
export const CATEGORY_MEDIA_CONSTRAINTS_MAP = {
  DIGITAL_MARKETING: {
    expectedMediaType: 'DATA_CAMPAIGN',
    allowedExtensions: ['.pdf', '.csv', '.xlsx', '.json', '.zip'],
    aiAuditableModality: null,
  },
  GRAPHICS_AND_DESIGN: {
    expectedMediaType: 'IMAGE_RASTER_VECTOR',
    allowedExtensions: ['.png', '.jpg', '.jpeg', '.webp', '.pdf'],
    aiAuditableModality: 'IMAGE',
  },
  PROGRAMMING_AND_TECH: {
    expectedMediaType: 'CODE_ARCHIVE',
    allowedExtensions: ['.zip', '.tar.gz', '.tgz', '.json', '.sql'],
    aiAuditableModality: null,
  },
  TECHNICAL_WRITING_TRANS: {
    expectedMediaType: 'DOCUMENT_TEXT',
    allowedExtensions: ['.md', '.txt', '.docx', '.pdf'],
    aiAuditableModality: 'TEXT',
  },
  VIDEO_AND_ANIMATION: {
    expectedMediaType: 'VIDEO_STREAM',
    allowedExtensions: ['.mp4', '.webm', '.mov'],
    aiAuditableModality: null,
  },
  MUSIC_AND_AUDIO: {
    expectedMediaType: 'AUDIO_TRACK',
    allowedExtensions: ['.mp3', '.wav', '.flac', '.ogg'],
    aiAuditableModality: null,
  },
} as const;

export type MarketplaceCategory = keyof typeof CATEGORY_MEDIA_CONSTRAINTS_MAP;

const ExtensionSchema = z.string().regex(/^\.[a-z0-9.]+$/);

function refineCategoryMediaConstraints<
  T extends {
    category: z.infer<typeof TaskCategoryEnum>;
    expectedMediaType: z.infer<typeof DeliverableMediaTypeEnum>;
    allowedExtensions: string[];
  },
>(data: T, ctx: z.RefinementCtx): void {
  const canonical = CATEGORY_MEDIA_CONSTRAINTS_MAP[data.category];
  if (data.expectedMediaType !== canonical.expectedMediaType) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['expectedMediaType'],
      message: `La categoría ${data.category} exige el tipo de medio ${canonical.expectedMediaType}.`,
    });
  }
  const invalidExts = data.allowedExtensions.filter(
    (ext) => !(canonical.allowedExtensions as readonly string[]).includes(ext),
  );
  if (invalidExts.length > 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['allowedExtensions'],
      message: `Extensiones no permitidas para ${data.category}: ${invalidExts.join(', ')}.`,
    });
  }
}

export const CreateGigInputSchema = z
  .object({
    title: z.string().trim().min(10).max(120),
    description: z.string().trim().min(20).max(3000),
    category: TaskCategoryEnum,
    expectedMediaType: DeliverableMediaTypeEnum,
    priceUSDInCents: z
      .number()
      .int()
      .min(MIN_MARKETPLACE_AMOUNT_USD_IN_CENTS)
      .max(MAX_MARKETPLACE_AMOUNT_USD_IN_CENTS),
    initialDeliveryDays: z.number().int().min(1).max(7).default(7),
    defaultCriteria: z.array(AcceptanceCriterionSchema).min(1).max(10),
    allowedExtensions: z.array(ExtensionSchema).min(1).max(10),
  })
  .superRefine(refineCategoryMediaConstraints);

export const UpdateGigInputSchema = z
  .object({
    title: z.string().trim().min(10).max(120).optional(),
    description: z.string().trim().min(20).max(3000).optional(),
    category: TaskCategoryEnum.optional(),
    priceUSDInCents: z
      .number()
      .int()
      .min(MIN_MARKETPLACE_AMOUNT_USD_IN_CENTS)
      .max(MAX_MARKETPLACE_AMOUNT_USD_IN_CENTS)
      .optional(),
    initialDeliveryDays: z.number().int().min(1).max(7).optional(),
    defaultCriteria: z.array(AcceptanceCriterionSchema).min(1).max(10).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Debe enviarse al menos un campo editable.',
  });

/** Actualización de publicación abierta (categoría / presupuesto tope). */
export const UpdatePublicationInputSchema = z
  .object({
    title: z.string().trim().min(10).max(120).optional(),
    description: z.string().trim().min(20).max(3000).optional(),
    category: TaskCategoryEnum.optional(),
    initialBudgetUSDInCents: z
      .number()
      .int()
      .min(MIN_MARKETPLACE_AMOUNT_USD_IN_CENTS)
      .max(MAX_MARKETPLACE_AMOUNT_USD_IN_CENTS)
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Debe enviarse al menos un campo editable.',
  });

export const GigCardSchema = z.object({
  gigId: z.string().uuid(),
  seller: z.object({
    userId: z.string().uuid(),
    displayName: z.string(),
    headline: z.string().nullable(),
    webMonetizationEnabled: z.boolean(),
    verifiedWalletAddressUrl: z.string().url().startsWith('https://').nullable(),
    targetCurrency: z.string().length(3),
  }),
  title: z.string().min(10).max(120),
  description: z.string().min(20).max(3000),
  category: TaskCategoryEnum,
  expectedMediaType: DeliverableMediaTypeEnum,
  aiAuditableModality: MvpAiAuditableModalityEnum.nullable(),
  priceUSDInCents: z.number().int().positive(),
  initialDeliveryDays: z.number().int().min(1).max(7),
  defaultCriteria: z.array(AcceptanceCriterionSchema).min(1).max(10),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  pageDocument: PageDocumentSchema,
  gallery: z.array(MarketplaceMediaAssetSchema).max(6),
});

export const CreatePublicationInputSchema = z
  .object({
    title: z.string().trim().min(10).max(120),
    description: z.string().trim().min(20).max(3000),
    category: TaskCategoryEnum,
    expectedMediaType: DeliverableMediaTypeEnum,
    initialBudgetUSDInCents: z
      .number()
      .int()
      .min(MIN_MARKETPLACE_AMOUNT_USD_IN_CENTS)
      .max(MAX_MARKETPLACE_AMOUNT_USD_IN_CENTS),
    initialDeliveryDays: z.number().int().min(1).max(7).default(7),
    preliminaryCriteria: z.array(AcceptanceCriterionSchema).min(1).max(10),
    allowedExtensions: z.array(ExtensionSchema).min(1).max(10),
    minWordCount: z.number().int().min(50).max(100_000).optional(),
    minWidthPx: z.number().int().min(64).max(16_384).optional(),
    minHeightPx: z.number().int().min(64).max(16_384).optional(),
  })
  .superRefine(refineCategoryMediaConstraints);

export const MarketplaceCategoryCatalogItemSchema = z.object({
  category: TaskCategoryEnum,
  expectedMediaType: DeliverableMediaTypeEnum,
  allowedExtensions: z.array(z.string()).min(1),
  aiAuditableModality: MvpAiAuditableModalityEnum.nullable(),
  activeGigCount: z.number().int().nonnegative(),
  openPublicationCount: z.number().int().nonnegative(),
});

export const ClientTaskPublicationSummarySchema = z.object({
  publicationId: z.string().uuid(),
  buyerUserId: z.string().uuid(),
  title: z.string().min(10).max(120),
  description: z.string().min(20).max(3000),
  category: TaskCategoryEnum,
  expectedMediaType: DeliverableMediaTypeEnum,
  aiAuditableModality: MvpAiAuditableModalityEnum.nullable(),
  initialBudgetUSDInCents: z
    .number()
    .int()
    .min(MIN_MARKETPLACE_AMOUNT_USD_IN_CENTS)
    .max(MAX_MARKETPLACE_AMOUNT_USD_IN_CENTS),
  initialDeliveryDays: z.number().int().min(1).max(7),
  preliminaryCriteria: z.array(AcceptanceCriterionSchema).min(1).max(10),
  allowedExtensions: z.array(z.string()).min(1),
  status: PublicationStatusEnum,
  activeProposalCount: z.number().int().nonnegative(),
  createdAt: z.string().datetime(),
  pageDocument: PageDocumentSchema,
  gallery: z.array(MarketplaceMediaAssetSchema).max(6),
  buyerDisplayName: z.string().min(1).max(120),
});

export const CancelPublicationInputSchema = z.object({
  cancelReason: z.string().trim().min(3).max(250).optional(),
});

/** Reseña 1–5 estrellas; una por persona tras servicio acordado (entrega o reembolso). */
export const CreateMarketplaceReviewInputSchema = z.object({
  rating: z.number().int().min(1).max(5),
  body: z.string().trim().min(10).max(1000),
});

export const MarketplaceReviewCardSchema = z.object({
  reviewId: z.string().uuid(),
  reviewerUserId: z.string().uuid(),
  reviewerDisplayName: z.string().min(1).max(120),
  reviewerAvatarUrl: z.string().nullable(),
  rating: z.number().int().min(1).max(5),
  body: z.string().min(10).max(1000),
  createdAt: z.string().datetime(),
});

export const MarketplaceReviewsPayloadSchema = z.object({
  averageRating: z.number().min(1).max(5).nullable(),
  reviewCount: z.number().int().nonnegative(),
  reviews: z.array(MarketplaceReviewCardSchema),
  canReview: z.boolean(),
  alreadyReviewed: z.boolean(),
});

export const MarketplaceListQuerySchema = z.object({
  category: TaskCategoryEnum.optional(),
  maxPriceCents: z.coerce.number().int().positive().optional(),
  maxDays: z.coerce.number().int().min(1).max(7).optional(),
  status: PublicationStatusEnum.optional(),
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(24).default(12),
});

export type CreateGigInput = z.infer<typeof CreateGigInputSchema>;
export type UpdateGigInput = z.infer<typeof UpdateGigInputSchema>;
export type UpdatePublicationInput = z.infer<typeof UpdatePublicationInputSchema>;
export type GigCard = z.infer<typeof GigCardSchema>;
export type CreatePublicationInput = z.infer<typeof CreatePublicationInputSchema>;
export type CreateMarketplaceReviewInput = z.infer<typeof CreateMarketplaceReviewInputSchema>;
export type MarketplaceReviewCard = z.infer<typeof MarketplaceReviewCardSchema>;
export type MarketplaceReviewsPayload = z.infer<typeof MarketplaceReviewsPayloadSchema>;
export type MarketplaceCategoryCatalogItem = z.infer<typeof MarketplaceCategoryCatalogItemSchema>;
export type ClientTaskPublicationSummary = z.infer<typeof ClientTaskPublicationSummarySchema>;
export type CancelPublicationInput = z.infer<typeof CancelPublicationInputSchema>;
