'use client';

import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';
import type { GalleryItem } from './storefront-types';

/**
 * Portada horizontal full-bleed desde debajo del navbar (rompe el padding de `main`).
 */
export function CoverBanner({
  cover,
  editable,
  uploading,
  onUpload,
  onRemove,
  topLeft,
  topRight,
}: {
  cover: GalleryItem | null;
  editable?: boolean;
  uploading?: boolean;
  onUpload?: (file: File) => Promise<void>;
  onRemove?: (mediaId: string) => Promise<void>;
  topLeft?: ReactNode;
  topRight?: ReactNode;
}) {
  return (
    <section style={bleedFromMain}>
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: 'clamp(220px, 38vw, 420px)',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 55%, #334155 100%)',
          overflow: 'hidden',
        }}
      >
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover.url}
            alt="Portada del servicio"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div
            style={{
              height: '100%',
              display: 'grid',
              placeItems: 'center',
              color: 'rgba(255,255,255,0.72)',
              fontSize: 14,
              padding: 24,
              textAlign: 'center',
            }}
          >
            {editable ? 'Sube una imagen de portada horizontal' : 'Sin imagen de portada'}
          </div>
        )}

        <div style={overlayBar}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {topLeft ?? (
              <Link href="/marketplace" className="btn btn-secondary" style={overlayBtn}>
                ← Marketplace
              </Link>
            )}
          </div>
          <div
            style={{
              display: 'flex',
              gap: 8,
              alignItems: 'center',
              flexWrap: 'wrap',
              justifyContent: 'flex-end',
              pointerEvents: 'auto',
            }}
          >
            {topRight}
          </div>
        </div>
      </div>

      {editable ? (
        <div style={{ maxWidth: 960, margin: '12px auto 0', padding: '0 16px', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <label className="btn btn-secondary" style={{ cursor: uploading ? 'not-allowed' : 'pointer' }}>
            {uploading ? 'Subiendo…' : cover ? 'Cambiar portada' : 'Subir portada'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              hidden
              disabled={uploading || !onUpload}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file && onUpload) void onUpload(file);
                event.target.value = '';
              }}
            />
          </label>
          {cover && onRemove ? (
            <button type="button" className="btn btn-secondary" onClick={() => void onRemove(cover.mediaId)}>
              Quitar portada
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

/** Compensa `main` padding 32px 20px para pegar la portada al navbar. */
const bleedFromMain: CSSProperties = {
  width: 'calc(100% + 40px)',
  marginLeft: -20,
  marginRight: -20,
  marginTop: -32,
  marginBottom: 0,
  position: 'relative',
};

const overlayBar: CSSProperties = {
  position: 'absolute',
  inset: '0 0 auto 0',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 12,
  padding: '14px 16px',
  pointerEvents: 'none',
  background: 'linear-gradient(180deg, rgba(15,23,42,0.55) 0%, rgba(15,23,42,0) 100%)',
};

const overlayBtn: CSSProperties = {
  pointerEvents: 'auto',
  boxShadow: '0 2px 10px rgba(0,0,0,0.25)',
};
