'use client';

import { useState } from 'react';
import { Star, Send } from 'lucide-react';

export type StorefrontReview = {
  reviewId: string;
  reviewerUserId: string;
  reviewerDisplayName: string;
  reviewerAvatarUrl: string | null;
  rating: number;
  body: string;
  createdAt: string;
};

export type ReviewsPayload = {
  averageRating: number | null;
  reviewCount: number;
  reviews: StorefrontReview[];
  canReview: boolean;
  alreadyReviewed: boolean;
};

const FALLBACK_PORTRAITS = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=160&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=160&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80',
] as const;

function Stars({ value, size = 16 }: { value: number; size?: number }) {
  const full = Math.round(value);
  return (
    <span aria-label={`${value} de 5 estrellas`} style={{ display: 'inline-flex', gap: 2, color: 'var(--volt)', fontSize: size }}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} style={{ opacity: i < full ? 1 : 0.25 }}>
          ★
        </span>
      ))}
    </span>
  );
}

export function ReviewsSection({
  reviews,
  onSubmit,
}: {
  reviews: ReviewsPayload;
  onSubmit?: (input: { rating: number; body: string }) => Promise<void>;
}) {
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <section
      className="card"
      style={{
        padding: '24px 26px',
        borderRadius: 24,
        border: '1px solid var(--border-hi)',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Star size={18} style={{ color: 'var(--volt)', fill: 'var(--volt)' }} />
          <h2 className="kinetic-heading" style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 700 }}>
            Reseñas Verificadas
          </h2>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', color: 'var(--text-secondary)', fontSize: 14 }}>
          {reviews.reviewCount > 0 && reviews.averageRating != null ? (
            <>
              <Stars value={reviews.averageRating} size={18} />
              <strong className="tabular-num" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)', fontSize: '1.15rem' }}>
                {reviews.averageRating.toFixed(1)}
              </strong>
              <span>({reviews.reviewCount})</span>
            </>
          ) : (
            <span className="badge badge-buyer">Abierto a primeras reseñas</span>
          )}
        </div>
      </div>

      {reviews.reviews.length === 0 ? (
        <div className="meridia-user-stat">
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 13.8 }}>
            Todavía no hay calificaciones públicas registradas para esta publicación. Las reseñas se habilitan al
            liquidar una orden en custodia Open Payments.
          </p>
        </div>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {reviews.reviews.map((review, idx) => (
            <li key={review.reviewId} className="meridia-user-stat" style={{ flexDirection: 'row', gap: 14, alignItems: 'flex-start' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={review.reviewerAvatarUrl ?? FALLBACK_PORTRAITS[idx % FALLBACK_PORTRAITS.length]}
                alt={review.reviewerDisplayName}
                className="ld-person-photo"
                style={{ width: 46, height: 46, borderRadius: 14 }}
              />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                  <strong style={{ fontFamily: 'var(--font-display)', fontSize: 14.5 }}>{review.reviewerDisplayName}</strong>
                  <Stars value={review.rating} />
                </div>
                <p style={{ margin: '6px 0 0', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', fontSize: 13.8 }}>
                  {review.body}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {reviews.canReview && onSubmit ? (
        <form
          style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 6 }}
          onSubmit={(event) => {
            event.preventDefault();
            setBusy(true);
            setError(null);
            void onSubmit({ rating, body: body.trim() })
              .catch((err: unknown) => {
                setError(err instanceof Error ? err.message : 'REVIEW_FAILED');
              })
              .finally(() => setBusy(false));
          }}
        >
          <h3 className="kinetic-heading" style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 15 }}>
            Publicar tu reseña verificada
          </h3>
          <div style={{ display: 'flex', gap: 6 }}>
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setRating(value)}
                style={{
                  border: 0,
                  background: 'transparent',
                  color: value <= rating ? 'var(--volt)' : 'var(--border-hi)',
                  fontSize: 28,
                  cursor: 'pointer',
                  lineHeight: 1,
                  padding: 0,
                }}
                aria-label={`${value} estrellas`}
              >
                ★
              </button>
            ))}
          </div>
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            required
            minLength={10}
            maxLength={1000}
            placeholder="Describe tu experiencia con esta entrega en MERIDIA (mín. 10 caracteres)…"
            rows={4}
            className="input"
          />
          {error ? <span style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</span> : null}
          <div>
            <button type="submit" className="btn btn-amber btn-sm" disabled={busy || body.trim().length < 10}>
              <Send size={14} />
              <span>{busy ? 'Enviando…' : 'Publicar reseña'}</span>
            </button>
          </div>
        </form>
      ) : null}

      {reviews.alreadyReviewed ? (
        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
          Ya publicaste tu reseña verificada para este servicio.
        </p>
      ) : null}
    </section>
  );
}

