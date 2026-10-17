import { describe, expect, it } from 'vitest';
import {
  CATEGORY_MEDIA_CONSTRAINTS_MAP,
  CreateGigInputSchema,
  CreatePublicationInputSchema,
  MarketplaceCategoryCatalogItemSchema,
} from './marketplace';
import { PageDocumentSchema, defaultPageDocument } from './page-document';

const validCriterion = {
  criterionId: 'c-01',
  description: 'Entregar mockups en alta resolución',
  isMandatory: true,
};

describe('SPEC-04 marketplace schemas', () => {
  it('RF-01: expone exactamente 6 categorías con cobertura IA correcta', () => {
    const categories = Object.keys(CATEGORY_MEDIA_CONSTRAINTS_MAP);
    expect(categories).toHaveLength(6);
    expect(CATEGORY_MEDIA_CONSTRAINTS_MAP.GRAPHICS_AND_DESIGN.aiAuditableModality).toBe('IMAGE');
    expect(CATEGORY_MEDIA_CONSTRAINTS_MAP.TECHNICAL_WRITING_TRANS.aiAuditableModality).toBe('TEXT');
    expect(CATEGORY_MEDIA_CONSTRAINTS_MAP.DIGITAL_MARKETING.aiAuditableModality).toBeNull();
    expect(CATEGORY_MEDIA_CONSTRAINTS_MAP.PROGRAMMING_AND_TECH.aiAuditableModality).toBeNull();
    expect(CATEGORY_MEDIA_CONSTRAINTS_MAP.VIDEO_AND_ANIMATION.aiAuditableModality).toBeNull();
    expect(CATEGORY_MEDIA_CONSTRAINTS_MAP.MUSIC_AND_AUDIO.aiAuditableModality).toBeNull();

    const item = MarketplaceCategoryCatalogItemSchema.safeParse({
      category: 'GRAPHICS_AND_DESIGN',
      expectedMediaType: 'IMAGE_RASTER_VECTOR',
      allowedExtensions: ['.png', '.webp'],
      aiAuditableModality: 'IMAGE',
      activeGigCount: 0,
      openPublicationCount: 0,
    });
    expect(item.success).toBe(true);
  });

  it('RF-02: acepta Gig coherente y rechaza medio/extensión/monto inválidos', () => {
    const ok = CreateGigInputSchema.safeParse({
      title: 'Diseño de logo profesional',
      description: 'Diseño de identidad visual completa para marca digital.',
      category: 'GRAPHICS_AND_DESIGN',
      expectedMediaType: 'IMAGE_RASTER_VECTOR',
      priceUSDInCents: 15_000,
      initialDeliveryDays: 5,
      defaultCriteria: [validCriterion],
      allowedExtensions: ['.png', '.webp'],
    });
    expect(ok.success).toBe(true);

    const mediaMismatch = CreateGigInputSchema.safeParse({
      title: 'Diseño de logo profesional',
      description: 'Diseño de identidad visual completa para marca digital.',
      category: 'GRAPHICS_AND_DESIGN',
      expectedMediaType: 'CODE_ARCHIVE',
      priceUSDInCents: 15_000,
      defaultCriteria: [validCriterion],
      allowedExtensions: ['.png'],
    });
    expect(mediaMismatch.success).toBe(false);

    const dangerousExt = CreateGigInputSchema.safeParse({
      title: 'Diseño de logo profesional',
      description: 'Diseño de identidad visual completa para marca digital.',
      category: 'GRAPHICS_AND_DESIGN',
      expectedMediaType: 'IMAGE_RASTER_VECTOR',
      priceUSDInCents: 15_000,
      defaultCriteria: [validCriterion],
      allowedExtensions: ['.exe', '.svg'],
    });
    expect(dangerousExt.success).toBe(false);

    const tooSmall = CreateGigInputSchema.safeParse({
      title: 'Diseño de logo profesional',
      description: 'Diseño de identidad visual completa para marca digital.',
      category: 'GRAPHICS_AND_DESIGN',
      expectedMediaType: 'IMAGE_RASTER_VECTOR',
      priceUSDInCents: 15,
      defaultCriteria: [validCriterion],
      allowedExtensions: ['.png'],
    });
    expect(tooSmall.success).toBe(false);
  });

  it('RF-03: acepta publicación con presupuesto tope válido', () => {
    const ok = CreatePublicationInputSchema.safeParse({
      title: 'Artículo técnico SEO para SaaS',
      description: 'Necesito un artículo técnico de 1500 palabras sobre Open Payments.',
      category: 'TECHNICAL_WRITING_TRANS',
      expectedMediaType: 'DOCUMENT_TEXT',
      initialBudgetUSDInCents: 25_000,
      initialDeliveryDays: 7,
      preliminaryCriteria: [validCriterion],
      allowedExtensions: ['.md', '.docx'],
      minWordCount: 1500,
    });
    expect(ok.success).toBe(true);
  });

  it('storefront: defaultPageDocument valida contra PageDocumentSchema', () => {
    const doc = defaultPageDocument({
      title: 'Diseño de logo profesional',
      displayName: 'Michael',
      headline: 'Freelancer',
    });
    expect(PageDocumentSchema.safeParse(doc).success).toBe(true);
  });
});
