'use client';

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';
import { CoverBanner } from './cover-banner';
import { GalleryCarousel } from './gallery-carousel';
import { ReviewsSection, type ReviewsPayload } from './reviews-section';
import { RichTextField } from './rich-text-field';
import type {
  GalleryItem,
  PageDocument,
  StorefrontGig,
  StorefrontPublication,
} from './storefront-types';

type Kind = 'gig' | 'publication';

const CATEGORIES = [
  { value: 'DIGITAL_MARKETING', label: 'Digital Marketing' },
  { value: 'GRAPHICS_AND_DESIGN', label: 'Graphics & Design' },
  { value: 'PROGRAMMING_AND_TECH', label: 'Programming & Tech' },
  { value: 'TECHNICAL_WRITING_TRANS', label: 'Technical Writing / Translation' },
  { value: 'VIDEO_AND_ANIMATION', label: 'Video & Animation' },
  { value: 'MUSIC_AND_AUDIO', label: 'Music & Audio' },
] as const;

const MAX_DELIVERY_DAYS = 7;

export function StorefrontPage({
  kind,
  initial,
  viewerUserId,
}: {
  kind: Kind;
  initial: StorefrontGig | StorefrontPublication;
  viewerUserId: string | null;
}) {
  const ownerId = kind === 'gig' ? (initial as StorefrontGig).seller.userId : (initial as StorefrontPublication).buyerUserId;
  const isOwner = Boolean(viewerUserId && viewerUserId === ownerId);
  const [mode, setMode] = useState<'edit' | 'preview'>(isOwner ? 'edit' : 'preview');
  const [entity, setEntity] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Categoría elegida en UI; vacío = aún no seleccionada en edición. */
  const [categoryDraft, setCategoryDraft] = useState<string>(initial.category ?? '');
  const [moneyDraftUsd, setMoneyDraftUsd] = useState(() => {
    if (kind === 'gig') return String(((initial as StorefrontGig).priceUSDInCents / 100).toFixed(2));
    return String(((initial as StorefrontPublication).initialBudgetUSDInCents / 100).toFixed(2));
  });
  const [reviews, setReviews] = useState<ReviewsPayload>({
    averageRating: null,
    reviewCount: 0,
    reviews: [],
    canReview: false,
    alreadyReviewed: false,
  });

  const pageDocument = entity.pageDocument;
  const gallery = entity.gallery;
  const editable = isOwner && mode === 'edit';
  const cover = (gallery[0] as GalleryItem | undefined) ?? null;
  const entityId =
    kind === 'gig'
      ? (entity as StorefrontGig).gigId
      : (entity as StorefrontPublication).publicationId;
  const reviewsPath =
    kind === 'gig'
      ? `/api/v1/marketplace/gigs/${entityId}/reviews`
      : `/api/v1/marketplace/publications/${entityId}/reviews`;

  const loadReviews = useCallback(async () => {
    try {
      const res = await fetch(reviewsPath);
      if (!res.ok) return;
      const body = (await res.json()) as ReviewsPayload;
      setReviews(body);
    } catch {
      /* vacío hasta que exista el endpoint */
    }
  }, [reviewsPath]);

  useEffect(() => {
    void loadReviews();
  }, [loadReviews]);

  const meta = useMemo(() => {
    if (kind === 'gig') {
      const gig = entity as StorefrontGig;
      return {
        title: gig.title,
        displayName: gig.seller.displayName,
        headline: gig.seller.headline,
        category: gig.category,
        moneyCents: gig.priceUSDInCents,
        moneyLabel: `$${(gig.priceUSDInCents / 100).toFixed(2)} USD`,
      };
    }
    const publication = entity as StorefrontPublication;
    return {
      title: publication.title,
      displayName: publication.buyerDisplayName,
      headline: null as string | null,
      category: publication.category,
      moneyCents: publication.initialBudgetUSDInCents,
      moneyLabel: `Presupuesto tope $${(publication.initialBudgetUSDInCents / 100).toFixed(2)} USD`,
    };
  }, [entity, kind]);

  function updateBlock<T extends PageDocument['blocks'][number]['type']>(
    type: T,
    patch: Partial<Extract<PageDocument['blocks'][number], { type: T }>>,
  ) {
    setEntity((current) => ({
      ...current,
      pageDocument: {
        ...current.pageDocument,
        blocks: current.pageDocument.blocks.map((block) =>
          block.type === type ? ({ ...block, ...patch } as typeof block) : block,
        ),
      },
    }));
  }

  async function savePage() {
    setSaving(true);
    setError(null);
    if (!categoryDraft) {
      setError('Selecciona un tipo de servicio');
      setSaving(false);
      return;
    }
    const cents = Math.round(Number.parseFloat(moneyDraftUsd.replace(',', '.')) * 100);
    if (!Number.isFinite(cents) || cents < 100) {
      setError('Indica un presupuesto válido (mín. $1.00 USD)');
      setSaving(false);
      return;
    }

    const entityId =
      kind === 'gig'
        ? (entity as StorefrontGig).gigId
        : (entity as StorefrontPublication).publicationId;
    const metaPath =
      kind === 'gig'
        ? `/api/v1/marketplace/gigs/${entityId}`
        : `/api/v1/marketplace/publications/${entityId}`;
    const pagePath = `${metaPath}/page`;

    try {
      const metaBody =
        kind === 'gig'
          ? { category: categoryDraft, priceUSDInCents: cents, initialDeliveryDays: MAX_DELIVERY_DAYS }
          : { category: categoryDraft, initialBudgetUSDInCents: cents };

      const metaRes = await fetch(metaPath, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metaBody),
      });
      if (!metaRes.ok) {
        const body = await metaRes.json().catch(() => ({}));
        setError(typeof body?.code === 'string' ? body.code : 'SAVE_META_FAILED');
        return;
      }

      const pageRes = await fetch(pagePath, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageDocument: entity.pageDocument }),
      });
      const pageBody = await pageRes.json();
      if (!pageRes.ok) {
        setError(typeof pageBody?.code === 'string' ? pageBody.code : 'SAVE_FAILED');
        return;
      }
      setEntity(pageBody);
      setCategoryDraft(pageBody.category ?? categoryDraft);
      const nextCents =
        kind === 'gig' ? pageBody.priceUSDInCents : pageBody.initialBudgetUSDInCents;
      if (typeof nextCents === 'number') {
        setMoneyDraftUsd((nextCents / 100).toFixed(2));
      }
    } catch {
      setError('API_UNREACHABLE');
    } finally {
      setSaving(false);
    }
  }

  async function uploadCover(file: File) {
    setUploading(true);
    setError(null);
    const entityId =
      kind === 'gig'
        ? (entity as StorefrontGig).gigId
        : (entity as StorefrontPublication).publicationId;
    const path =
      kind === 'gig'
        ? `/api/v1/marketplace/gigs/${entityId}/media`
        : `/api/v1/marketplace/publications/${entityId}/media`;

    try {
      if (cover) {
        await fetch(`/api/v1/marketplace/media/${cover.mediaId}`, { method: 'DELETE' });
      }
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(path, { method: 'POST', body: form });
      const body = await res.json();
      if (!res.ok) {
        setError(typeof body?.code === 'string' ? body.code : 'UPLOAD_FAILED');
        return;
      }
      const detail = await fetch(
        kind === 'gig' ? `/api/v1/marketplace/gigs/${entityId}` : `/api/v1/marketplace/publications/${entityId}`,
      );
      if (detail.ok) setEntity(await detail.json());
    } catch {
      setError('API_UNREACHABLE');
    } finally {
      setUploading(false);
    }
  }

  async function removeMedia(mediaId: string) {
    setError(null);
    const res = await fetch(`/api/v1/marketplace/media/${mediaId}`, { method: 'DELETE' });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(typeof body?.code === 'string' ? body.code : 'DELETE_FAILED');
      return;
    }
    setEntity((current) => ({
      ...current,
      gallery: current.gallery.filter((item) => item.mediaId !== mediaId),
      pageDocument: {
        ...current.pageDocument,
        blocks: current.pageDocument.blocks.map((block) =>
          block.type === 'gallery'
            ? { ...block, mediaIds: block.mediaIds.filter((id) => id !== mediaId) }
            : block,
        ),
      },
    }));
  }

  async function uploadGallery(file: File) {
    setUploading(true);
    setError(null);
    const path =
      kind === 'gig'
        ? `/api/v1/marketplace/gigs/${entityId}/media`
        : `/api/v1/marketplace/publications/${entityId}/media`;
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(path, { method: 'POST', body: form });
      const body = await res.json();
      if (!res.ok) {
        setError(typeof body?.code === 'string' ? body.code : 'UPLOAD_FAILED');
        return;
      }
      const detail = await fetch(
        kind === 'gig' ? `/api/v1/marketplace/gigs/${entityId}` : `/api/v1/marketplace/publications/${entityId}`,
      );
      if (detail.ok) setEntity(await detail.json());
    } catch {
      setError('API_UNREACHABLE');
    } finally {
      setUploading(false);
    }
  }

  async function submitReview(input: { rating: number; body: string }) {
    const res = await fetch(reviewsPath, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(typeof payload?.code === 'string' ? payload.code : 'REVIEW_FAILED');
    }
    await loadReviews();
  }

  const about = pageDocument.blocks.find((b) => b.type === 'about');
  const body = pageDocument.blocks.find((b) => b.type === 'body');
  const links = pageDocument.blocks.find((b) => b.type === 'links');
  const hero = pageDocument.blocks.find((b) => b.type === 'hero');
  const profile = pageDocument.blocks.find((b) => b.type === 'profile');
  const categoryLabel =
    CATEGORIES.find((item) => item.value === (editable ? categoryDraft : meta.category))?.label ??
    (meta.category ? meta.category.replaceAll('_', ' ') : 'Sin categoría');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, paddingBottom: 48 }}>
      <CoverBanner
        cover={cover}
        editable={editable}
        uploading={uploading}
        onUpload={uploadCover}
        onRemove={removeMedia}
        topRight={
          isOwner ? (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', pointerEvents: 'auto' }}>
              <button
                type="button"
                className={mode === 'edit' ? 'btn btn-primary' : 'btn btn-secondary'}
                style={overlayControl}
                onClick={() => setMode('edit')}
              >
                Editar
              </button>
              <button
                type="button"
                className={mode === 'preview' ? 'btn btn-primary' : 'btn btn-secondary'}
                style={overlayControl}
                onClick={() => setMode('preview')}
              >
                Vista previa
              </button>
              {mode === 'edit' ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  style={overlayControl}
                  disabled={saving}
                  onClick={() => void savePage()}
                >
                  {saving ? 'Guardando…' : 'Guardar'}
                </button>
              ) : null}
            </div>
          ) : null
        }
      />

      {error ? (
        <p style={{ maxWidth: 960, margin: '12px auto 0', padding: '0 16px', color: '#f87171', fontSize: 13 }}>
          {error}
        </p>
      ) : null}

      <div
        style={{
          maxWidth: 960,
          margin: '0 auto',
          width: '100%',
          padding: '24px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 28,
        }}
      >
        <header style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 16,
              background: 'linear-gradient(145deg, #1d4ed8, #0ea5e9)',
              color: '#fff',
              display: 'grid',
              placeItems: 'center',
              fontWeight: 700,
              fontSize: 28,
              flexShrink: 0,
            }}
          >
            {(profile?.displayName ?? meta.displayName).slice(0, 1).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
              {profile?.displayName ?? meta.displayName}
              {editable ? ' · nombre fijo de la cuenta' : ''}
            </p>
            {editable ? (
              <input
                value={hero?.title ?? meta.title}
                onChange={(event) => updateBlock('hero', { title: event.target.value })}
                style={{
                  width: '100%',
                  fontSize: '1.85rem',
                  fontWeight: 700,
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  padding: '8px 10px',
                  background: 'var(--bg-elevated, transparent)',
                  color: 'var(--text-primary)',
                  marginTop: 6,
                }}
              />
            ) : (
              <h1 style={{ margin: '4px 0 0', fontSize: '1.85rem', lineHeight: 1.2 }}>{hero?.title ?? meta.title}</h1>
            )}
            <p style={{ margin: '8px 0 0', color: 'var(--text-secondary)' }}>
              {profile?.headline ?? meta.headline ?? 'Sin headline'}
            </p>
          </div>
        </header>

        <section>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)',
              gap: 16,
              alignItems: 'end',
            }}
          >
            <div>
              <h2 style={sectionTitle}>Tipo de servicio</h2>
              {editable ? (
                <select
                  value={categoryDraft}
                  onChange={(event) => setCategoryDraft(event.target.value)}
                  style={{ ...selectStyle, width: '100%' }}
                >
                  <option value="" disabled>
                    Selecciona una categoría
                  </option>
                  {CATEGORIES.map((item) => (
                    <option key={item.value} value={item.value} style={optionStyle}>
                      {item.label}
                    </option>
                  ))}
                </select>
              ) : (
                <p style={{ margin: 0 }}>{categoryLabel}</p>
              )}
            </div>
            <div>
              <h2 style={sectionTitle}>{kind === 'gig' ? 'Presupuesto' : 'Presupuesto tope'}</h2>
              {editable ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: 'var(--text-muted)' }}>$</span>
                  <input
                    type="number"
                    min={1}
                    step={0.01}
                    value={moneyDraftUsd}
                    onChange={(event) => setMoneyDraftUsd(event.target.value)}
                    style={{ ...fieldStyle, flex: 1 }}
                    placeholder="0.00"
                  />
                  <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>USD</span>
                </div>
              ) : (
                <p style={{ margin: 0 }}>{meta.moneyLabel}</p>
              )}
            </div>
          </div>
          <p style={{ margin: '12px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
            Plazo máximo de entrega: {MAX_DELIVERY_DAYS} días (si lo completas antes, es decisión del freelancer).
          </p>
        </section>

        <section>
          <h2 style={sectionTitle}>Sobre mí</h2>
          <RichTextField
            html={about?.html ?? '<p></p>'}
            editable={editable}
            onChange={(html) => updateBlock('about', { html })}
            placeholder="Cuenta quién eres y cómo trabajas…"
          />
        </section>

        <section>
          <h2 style={sectionTitle}>Más sobre mí / cuerpo libre</h2>
          <RichTextField
            html={body?.html ?? '<p></p>'}
            editable={editable}
            onChange={(html) => updateBlock('body', { html })}
          />
        </section>

        <section>
          <h2 style={sectionTitle}>Galería de trabajos</h2>
          <GalleryCarousel
            items={gallery}
            editable={editable}
            uploading={uploading}
            onUpload={uploadGallery}
            onRemove={removeMedia}
          />
        </section>

        <section>
          <h2 style={sectionTitle}>Enlaces / redes</h2>
          <LinksEditor
            items={links?.items ?? []}
            editable={editable}
            onChange={(items) => updateBlock('links', { items })}
          />
        </section>

        <ReviewsSection
          reviews={reviews}
          onSubmit={!isOwner && viewerUserId ? submitReview : undefined}
        />
      </div>
    </div>
  );
}

function LinksEditor({
  items,
  editable,
  onChange,
}: {
  items: Array<{ label: string; href: string }>;
  editable: boolean;
  onChange: (items: Array<{ label: string; href: string }>) => void;
}) {
  if (!editable) {
    if (items.length === 0) return <p style={{ color: 'var(--text-muted)', margin: 0 }}>Sin enlaces públicos.</p>;
    return (
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map((item) => (
          <li key={`${item.label}-${item.href}`}>
            <a href={item.href} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--brand-blue)' }}>
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {items.map((item, index) => (
        <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr auto', gap: 8 }}>
          <input
            value={item.label}
            placeholder="Texto del enlace"
            onChange={(event) => {
              const next = [...items];
              next[index] = { ...item, label: event.target.value };
              onChange(next);
            }}
            style={fieldStyle}
          />
          <input
            value={item.href}
            placeholder="https://…"
            onChange={(event) => {
              const next = [...items];
              next[index] = { ...item, href: event.target.value };
              onChange(next);
            }}
            style={fieldStyle}
          />
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => onChange(items.filter((_, i) => i !== index))}
          >
            Quitar
          </button>
        </div>
      ))}
      <button
        type="button"
        className="btn btn-secondary"
        disabled={items.length >= 12}
        onClick={() => onChange([...items, { label: 'Mi LinkedIn', href: 'https://' }])}
      >
        Añadir enlace
      </button>
    </div>
  );
}

const sectionTitle: CSSProperties = {
  margin: '0 0 10px',
  fontSize: '1.05rem',
};

const fieldStyle: CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: 8,
  padding: '8px 10px',
  background: 'var(--surface)',
  color: 'var(--text-primary)',
};

/** Contraste explícito: evita texto blanco sobre fondo blanco nativo del OS. */
const selectStyle: CSSProperties = {
  ...fieldStyle,
  colorScheme: 'dark',
  appearance: 'auto',
};

const optionStyle: CSSProperties = {
  background: '#111827',
  color: '#f8fafc',
};

const overlayControl: CSSProperties = {
  boxShadow: '0 2px 10px rgba(0,0,0,0.25)',
};
