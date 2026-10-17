'use client';

import { useState, type CSSProperties } from 'react';

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

function Stars({ value, size = 16 }: { value: number; size?: number }) {
  const full = Math.round(value);
  return (
    <span aria-label={`${value} de 5 estrellas`} style={{ display: 'inline-flex', gap: 2, color: '#fbbf24', fontSize: size }}>
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
    <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'baseline' }}>
        <h2 style={{ margin: 0, fontSize: '1.05rem' }}>Reseñas</h2>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', color: 'var(--text-secondary)', fontSize: 14 }}>
          {reviews.reviewCount > 0 && reviews.averageRating != null ? (
            <>
              <Stars value={reviews.averageRating} size={18} />
              <strong style={{ color: 'var(--text-primary)' }}>{reviews.averageRating.toFixed(1)}</strong>
              <span>({reviews.reviewCount})</span>
            </>
          ) : (
            <span>Sin reseñas aún</span>
          )}
        </div>
      </div>

      <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
        Solo puedes dejar una reseña si ya hubo un servicio acordado con esta persona (entrega o reembolso).
      </p>

      {reviews.reviews.length === 0 ? (
        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Todavía no hay calificaciones públicas.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {reviews.reviews.map((review) => (
            <li key={review.reviewId} style={card}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: 'linear-gradient(145deg, #334155, #1e293b)',
                  color: '#fff',
                  display: 'grid',
                  placeItems: 'center',
                  fontWeight: 700,
                  flexShrink: 0,
                  overflow: 'hidden',
                }}
              >
                {review.reviewerAvatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={review.reviewerAvatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  review.reviewerDisplayName.slice(0, 1).toUpperCase()
                )}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                  <strong>{review.reviewerDisplayName}</strong>
                  <Stars value={review.rating} />
                </div>
                <p style={{ margin: '6px 0 0', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>{review.body}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {reviews.canReview && onSubmit ? (
        <form
          style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}
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
          <h3 style={{ margin: 0, fontSize: 15 }}>Tu reseña</h3>
          <div style={{ display: 'flex', gap: 6 }}>
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setRating(value)}
                style={{
                  border: 0,
                  background: 'transparent',
                  color: value <= rating ? '#fbbf24' : 'rgba(248,250,252,0.25)',
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
            placeholder="Describe tu experiencia (mín. 10 caracteres)…"
            rows={4}
            style={{
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '10px 12px',
              background: 'var(--surface)',
              color: 'var(--text-primary)',
              resize: 'vertical',
            }}
          />
          {error ? <span style={{ color: '#f87171', fontSize: 13 }}>{error}</span> : null}
          <button type="submit" className="btn btn-primary" disabled={busy || body.trim().length < 10}>
            {busy ? 'Enviando…' : 'Publicar reseña'}
          </button>
        </form>
      ) : null}

      {reviews.alreadyReviewed ? (
        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>Ya publicaste tu reseña para este servicio.</p>
      ) : null}
    </section>
  );
}

const card: CSSProperties = {
  display: 'flex',
  gap: 12,
  padding: 14,
  borderRadius: 12,
  border: '1px solid var(--border)',
  background: 'var(--surface)',
};
