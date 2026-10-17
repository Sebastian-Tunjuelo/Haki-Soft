import { z } from 'zod';

export const MARKETPLACE_GALLERY_MAX = 6;
export const MARKETPLACE_MEDIA_MAX_BYTES = 2 * 1024 * 1024;
export const MARKETPLACE_MEDIA_MIME = ['image/jpeg', 'image/png', 'image/webp'] as const;

const HtmlSnippetSchema = z.string().max(20_000);
const HttpUrlSchema = z.string().url().refine((value) => /^https?:\/\//i.test(value), {
  message: 'Solo http(s)',
});

export const PageBlockHeroSchema = z.object({
  type: z.literal('hero'),
  title: z.string().trim().min(1).max(120),
});

export const PageBlockProfileSchema = z.object({
  type: z.literal('profile'),
  displayName: z.string().min(1).max(120),
  headline: z.string().max(140).nullable(),
  avatarUrl: z.string().url().nullable(),
});

export const PageBlockAboutSchema = z.object({
  type: z.literal('about'),
  html: HtmlSnippetSchema,
});

export const PageBlockServiceMetaSchema = z.object({
  type: z.literal('serviceMeta'),
});

export const PageBlockGallerySchema = z.object({
  type: z.literal('gallery'),
  mediaIds: z.array(z.string().uuid()).max(MARKETPLACE_GALLERY_MAX),
});

export const PageBlockLinksSchema = z.object({
  type: z.literal('links'),
  items: z
    .array(
      z.object({
        label: z.string().trim().min(1).max(80),
        href: HttpUrlSchema,
      }),
    )
    .max(12),
});

export const PageBlockBodySchema = z.object({
  type: z.literal('body'),
  html: HtmlSnippetSchema,
});

export const PageBlockSchema = z.discriminatedUnion('type', [
  PageBlockHeroSchema,
  PageBlockProfileSchema,
  PageBlockAboutSchema,
  PageBlockServiceMetaSchema,
  PageBlockGallerySchema,
  PageBlockLinksSchema,
  PageBlockBodySchema,
]);

export const PageDocumentSchema = z.object({
  version: z.literal(1),
  blocks: z.array(PageBlockSchema).min(1).max(24),
});

export const UpdatePageDocumentInputSchema = z.object({
  pageDocument: PageDocumentSchema,
});

export const MarketplaceMediaAssetSchema = z.object({
  mediaId: z.string().uuid(),
  mimeType: z.enum(MARKETPLACE_MEDIA_MIME),
  byteSize: z.number().int().positive().max(MARKETPLACE_MEDIA_MAX_BYTES),
  sortOrder: z.number().int().min(0).max(MARKETPLACE_GALLERY_MAX - 1),
  url: z.string().min(1),
});

export type PageDocument = z.infer<typeof PageDocumentSchema>;
export type MarketplaceMediaAsset = z.infer<typeof MarketplaceMediaAssetSchema>;
export type UpdatePageDocumentInput = z.infer<typeof UpdatePageDocumentInputSchema>;

/** Documento mínimo al crear Gig/Publicación. `displayName` queda fijado en el bloque profile. */
export function defaultPageDocument(input: {
  title: string;
  displayName: string;
  headline?: string | null;
}): PageDocument {
  return {
    version: 1,
    blocks: [
      { type: 'hero', title: input.title },
      {
        type: 'profile',
        displayName: input.displayName,
        headline: input.headline ?? null,
        avatarUrl: null,
      },
      { type: 'about', html: '<p></p>' },
      { type: 'serviceMeta' },
      { type: 'gallery', mediaIds: [] },
      { type: 'links', items: [] },
      { type: 'body', html: '<p></p>' },
    ],
  };
}
