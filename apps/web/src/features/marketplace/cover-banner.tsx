'use client';

import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';
import { ArrowLeft, ImagePlus, Trash2 } from 'lucide-react';
import type { GalleryItem } from './storefront-types';

const DEFAULT_COVER_URL =
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1600&q=80';

/**
 * Portada horizontal full-bleed desde debajo del navbar con estética MERIDIA.
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
          height: 'clamp(220px, 34vw, 380px)',
          background: 'linear-gradient(135deg, #0b0f17 0%, #111827 55%, #1e293b 100%)',
          overflow: 'hidden',
          borderBottom: '1px solid var(--border-hi)',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={cover?.url ?? DEFAULT_COVER_URL}
          alt="Portada del servicio"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            opacity: cover ? 1 : 0.72,
          }}
        />

        <div style={overlayBar}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {topLeft ?? (
              <Link href="/marketplace" className="btn btn-outline btn-sm" style={overlayBtn}>
                <ArrowLeft size={14} />
                <span>Marketplace</span>
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
        <div style={{ maxWidth: 960, margin: '14px auto 0', padding: '0 16px', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <label className="btn btn-outline btn-sm" style={{ cursor: uploading ? 'not-allowed' : 'pointer' }}>
            <ImagePlus size={15} />
            <span>{uploading ? 'Subiendo…' : cover ? 'Cambiar portada' : 'Subir portada'}</span>
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
            <button type="button" className="btn btn-outline btn-sm" onClick={() => void onRemove(cover.mediaId)}>
              <Trash2 size={14} />
              <span>Quitar portada</span>
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
  padding: '16px 20px',
  pointerEvents: 'none',
  background: 'linear-gradient(180deg, rgba(11,15,23,0.68) 0%, rgba(11,15,23,0) 100%)',
};

const overlayBtn: CSSProperties = {
  pointerEvents: 'auto',
  background: 'rgba(15, 23, 42, 0.78)',
  color: '#f8fafc',
  borderColor: 'rgba(255,255,255,0.22)',
  backdropFilter: 'blur(8px)',
};

