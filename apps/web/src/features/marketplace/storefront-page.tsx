'use client';

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { CoverBanner } from './cover-banner';
import { GalleryCarousel } from './gallery-carousel';
import { ReviewsSection, type ReviewsPayload } from './reviews-section';
import { RichTextField } from './rich-text-field';
import { HireConfirmModal } from '@/src/components/hire-confirm-modal';
import { PageReveal } from '@/src/components/page-reveal';
import { humanError } from '@/src/lib/api-client';
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
  const router = useRouter();
  const ownerId = kind === 'gig' ? (initial as StorefrontGig).seller.userId : (initial as StorefrontPublication).buyerUserId;
  const isOwner = Boolean(viewerUserId && viewerUserId === ownerId);
  const [mode, setMode] = useState<'edit' | 'preview'>(isOwner ? 'edit' : 'preview');
  const [entity, setEntity] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [hiring, setHiring] = useState(false);
  const [hireConfirmOpen, setHireConfirmOpen] = useState(false);
  const [hireBrief, setHireBrief] = useState(
    'Quiero contratar este Gig con el alcance publicado y entrega dentro del plazo máximo.',
  );
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

  async function hireGig() {
    if (kind !== 'gig' || isOwner) return;
    const gig = entity as StorefrontGig;
    setHiring(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/negotiations/gigs/${gig.gigId}/hire`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': crypto.randomUUID(),
        },
        body: JSON.stringify({
          gigId: gig.gigId,
          expectedPriceUSDInCents: gig.priceUSDInCents,
          projectBrief: hireBrief.trim(),
          buyerAssumesDoubleFxConversion: true,
        }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(humanError(res.status, payload));
        return;
      }
      const taskId = payload?.taskOrder?.taskId as string | undefined;
      if (!taskId) {
        setError('La orden se creó pero no pudimos abrir el checkout.');
        return;
      }
      setHireConfirmOpen(false);
      // Solicitud pendiente: el dinero no se manda hasta que el emprendedor acepte.
      router.push(`/orders/${taskId}/escrow`);
    } catch {
      setError(humanError(0, { code: 'API_UNREACHABLE' }));
    } finally {
      setHiring(false);
    }
  }

  const about = pageDocument.blocks.find((b) => b.type === 'about');
  const body = pageDocument.blocks.find((b) => b.type === 'body');
  const links = pageDocument.blocks.find((b) => b.type === 'links');
  const hero = pageDocument.blocks.find((b) => b.type === 'hero');
  const profile = pageDocument.blocks.find((b) => b.type === 'profile');
  const categoryLabel =
    CATEGORIES.find((item) => item.value === (editable ? categoryDraft : meta.category))?.label ??
    (meta.category ? meta.category.replaceAll('_', ' ') : 'Sin categoría');

  const hirePersonName =
    kind === 'gig' ? (entity as StorefrontGig).seller.displayName : 'esta persona';
  const hireAmountCents = kind === 'gig' ? (entity as StorefrontGig).priceUSDInCents : 0;

  return (
    <PageReveal>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0, paddingBottom: 48 }}>
        <HireConfirmModal
          open={hireConfirmOpen}
          personName={hirePersonName}
          amountCents={hireAmountCents}
          busy={hiring}
          onConfirm={() => void hireGig()}
          onCancel={() => setHireConfirmOpen(false)}
        />
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
                  className={mode === 'edit' ? 'btn btn-amber btn-sm' : 'btn btn-outline btn-sm'}
                  style={overlayControl}
                  onClick={() => setMode('edit')}
                >
                  Editar
                </button>
                <button
                  type="button"
                  className={mode === 'preview' ? 'btn btn-emerald btn-sm' : 'btn btn-outline btn-sm'}
                  style={overlayControl}
                  onClick={() => setMode('preview')}
                >
                  Vista previa
                </button>
                {mode === 'edit' ? (
                  <button
                    type="button"
                    className="btn btn-amber btn-sm"
                    style={overlayControl}
                    disabled={saving}
                    onClick={() => void savePage()}
                  >
                    {saving ? 'Guardando…' : 'Guardar cambios'}
                  </button>
                ) : null}
              </div>
            ) : null
          }
        />

        {error ? (
          <div style={{ maxWidth: 960, margin: '16px auto 0', width: '100%', padding: '0 16px' }}>
            <div className="alert alert-error" role="alert">
              {error}
            </div>
          </div>
        ) : null}

        <div
          style={{
            maxWidth: 960,
            margin: '0 auto',
            width: '100%',
            padding: '26px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
          }}
        >
          {/* Cabecera del perfil / servicio en tarjeta MERIDIA */}
          <header
            className="card ts-reveal"
            style={{
              padding: '24px 28px',
              borderRadius: 26,
              border: '1px solid var(--border-hi)',
              display: 'flex',
              gap: 18,
              alignItems: 'flex-start',
              flexWrap: 'wrap',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={
                kind === 'gig'
                  ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=240&q=80'
                  : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=240&q=80'
              }
              alt={profile?.displayName ?? meta.displayName}
              className="ld-person-photo"
              style={{
                width: 74,
                height: 74,
                borderRadius: 20,
                border: '2px solid var(--tide)',
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1, minWidth: 240 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                <span className="badge badge-verified">
                  <span className="pulse-dot" />
                  {kind === 'gig' ? 'MERIDIA · Servicio a Precio Fijo' : 'MERIDIA · Encargo Abierto'}
                </span>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>
                  {profile?.displayName ?? meta.displayName}
                  {editable ? ' · cuenta verificada' : ''}
                </span>
              </div>

              {editable ? (
                <input
                  value={hero?.title ?? meta.title}
                  onChange={(event) => updateBlock('hero', { title: event.target.value })}
                  className="input"
                  style={{
                    width: '100%',
                    fontSize: '1.65rem',
                    fontFamily: 'var(--font-display)',
                    fontWeight: 700,
                    marginTop: 4,
                  }}
                />
              ) : (
                <h1
                  className="ts-title kinetic-heading"
                  style={{ margin: '4px 0 0', fontSize: 'clamp(1.6rem, 3vw, 2.25rem)', lineHeight: 1.18 }}
                >
                  {hero?.title ?? meta.title}
                </h1>
              )}
              <p style={{ margin: '8px 0 0', color: 'var(--text-secondary)', fontSize: 14.5 }}>
                {profile?.headline ?? meta.headline ?? 'Talento y contratación protegida con custodia 100% Open Payments'}
              </p>
            </div>
          </header>

          {/* Categoría, Presupuesto y Plazo */}
          <section
            className="card ts-reveal"
            style={{
              padding: '22px 26px',
              borderRadius: 24,
              border: '1px solid var(--border-hi)',
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 16,
                alignItems: 'end',
              }}
            >
              <div className="meridia-user-stat">
                <h2 style={sectionTitle}>Categoría de actividad</h2>
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
                  <strong style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: 'var(--tide-ink)' }}>
                    {categoryLabel}
                  </strong>
                )}
              </div>

              <div className="meridia-user-stat">
                <h2 style={sectionTitle}>{kind === 'gig' ? 'Presupuesto Fijo' : 'Presupuesto Inicial Tope'}</h2>
                {editable ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 700 }}>$</span>
                    <input
                      type="number"
                      min={1}
                      step={0.01}
                      value={moneyDraftUsd}
                      onChange={(event) => setMoneyDraftUsd(event.target.value)}
                      style={{ ...fieldStyle, flex: 1 }}
                      placeholder="0.00"
                    />
                    <span style={{ color: 'var(--text-muted)', fontSize: 13, fontWeight: 700 }}>USD</span>
                  </div>
                ) : (
                  <strong
                    className="tabular-num kinetic-heading"
                    style={{ fontFamily: 'var(--font-mono)', fontSize: '1.45rem', color: 'var(--volt)' }}
                  >
                    {meta.moneyLabel}
                  </strong>
                )}
              </div>

              <div className="meridia-user-stat">
                <h2 style={sectionTitle}>Plazo Determinista</h2>
                <strong style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: 'var(--text-primary)' }}>
                  Máx. {MAX_DELIVERY_DAYS} días
                </strong>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  Custodia 100% GNAP · Liquidación 96% / 4%
                </span>
              </div>
            </div>
          </section>

          {/* Módulo de contratación directa cuando es Gig */}
          {kind === 'gig' && !isOwner ? (
            <section
              className="card ts-reveal"
              style={{
                border: '1px solid rgba(var(--volt-rgb), 0.45)',
                borderRadius: 24,
                padding: '24px 28px',
                background:
                  'linear-gradient(135deg, rgba(var(--volt-rgb), 0.12) 0%, rgba(var(--tide-rgb), 0.1) 100%), var(--surface)',
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <h2 className="kinetic-heading" style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700 }}>
                  Contratar este servicio con custodia 100%
                </h2>
                <span className="badge badge-verified tabular-num" style={{ fontFamily: 'var(--font-mono)' }}>
                  {meta.moneyLabel}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)' }}>
                Precio fijo <strong style={{ color: 'var(--text-primary)' }}>{meta.moneyLabel}</strong>. El dinero solo
                entra a escrow si <strong style={{ color: 'var(--text-primary)' }}>{hirePersonName}</strong> acepta dentro
                de las 24 horas.
              </p>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
                Brief del proyecto (mín. 15 caracteres)
                <textarea
                  value={hireBrief}
                  onChange={(e) => setHireBrief(e.target.value)}
                  rows={3}
                  className="input"
                />
              </label>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>
                Al continuar confirmas que asumes la doble conversión de divisa (FX) cuando el pago sí se envíe a la bóveda.
              </p>
              <div>
                <button
                  type="button"
                  className="btn btn-amber"
                  disabled={hiring || hireBrief.trim().length < 15 || !viewerUserId}
                  onClick={() => setHireConfirmOpen(true)}
                >
                  <span>{!viewerUserId ? 'Inicia sesión para contratar' : 'Pagar / Contratar servicio'}</span>
                </button>
              </div>
            </section>
          ) : null}

          <section className="card ts-reveal" style={{ padding: '24px 26px', borderRadius: 24, border: '1px solid var(--border-hi)' }}>
            <h2 className="kinetic-heading" style={sectionTitle}>Sobre el servicio y metodología</h2>
            <RichTextField
              html={about?.html ?? '<p></p>'}
              editable={editable}
              onChange={(html) => updateBlock('about', { html })}
              placeholder="Cuenta quién eres, qué incluye el entregable y cómo trabajas…"
            />
          </section>

          <section className="card ts-reveal" style={{ padding: '24px 26px', borderRadius: 24, border: '1px solid var(--border-hi)' }}>
            <h2 className="kinetic-heading" style={sectionTitle}>Alcance detallado y criterios</h2>
            <RichTextField
              html={body?.html ?? '<p></p>'}
              editable={editable}
              onChange={(html) => updateBlock('body', { html })}
            />
          </section>

          <section className="card ts-reveal" style={{ padding: '24px 26px', borderRadius: 24, border: '1px solid var(--border-hi)' }}>
            <h2 className="kinetic-heading" style={sectionTitle}>Galería visual de trabajos</h2>
            <GalleryCarousel
              items={gallery}
              editable={editable}
              uploading={uploading}
              onUpload={uploadGallery}
              onRemove={removeMedia}
            />
          </section>

          <section className="card ts-reveal" style={{ padding: '24px 26px', borderRadius: 24, border: '1px solid var(--border-hi)' }}>
            <h2 className="kinetic-heading" style={sectionTitle}>Enlaces y portafolio verificable</h2>
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
    </PageReveal>
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
    if (items.length === 0) return <p style={{ color: 'var(--text-muted)', margin: 0 }}>Sin enlaces públicos registrados.</p>;
    return (
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        {items.map((item) => (
          <li key={`${item.label}-${item.href}`}>
            <a
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline btn-sm"
            >
              <span>{item.label}</span>
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
            className="btn btn-outline btn-sm"
            onClick={() => onChange(items.filter((_, i) => i !== index))}
          >
            Quitar
          </button>
        </div>
      ))}
      <div>
        <button
          type="button"
          className="btn btn-outline btn-sm"
          disabled={items.length >= 12}
          onClick={() => onChange([...items, { label: 'Mi Portafolio', href: 'https://' }])}
        >
          + Añadir enlace
        </button>
      </div>
    </div>
  );
}

const sectionTitle: CSSProperties = {
  margin: '0 0 10px',
  fontFamily: 'var(--font-display)',
  fontSize: '1.08rem',
  fontWeight: 700,
};

const fieldStyle: CSSProperties = {
  border: '1px solid var(--border-hi)',
  borderRadius: 12,
  padding: '9px 12px',
  background: 'var(--surface-solid)',
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
  boxShadow: '0 4px 14px rgba(0,0,0,0.32)',
};

