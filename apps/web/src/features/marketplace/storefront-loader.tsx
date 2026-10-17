'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Compass } from 'lucide-react';
import { StorefrontPage } from './storefront-page';
import type { StorefrontGig, StorefrontPublication } from './storefront-types';
import { WebMonetizationHeadTag } from '@/src/features/web-monetization/web-monetization-head-tag';
import { PageReveal } from '@/src/components/page-reveal';
import { MeridiaPrismLogo } from '@/src/components/brand/meridia-prism-logo';

export function StorefrontLoader({
  kind,
  id,
}: {
  kind: 'gig' | 'publication';
  id: string;
}) {
  const [entity, setEntity] = useState<StorefrontGig | StorefrontPublication | null>(null);
  const [viewerUserId, setViewerUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const path =
        kind === 'gig' ? `/api/v1/marketplace/gigs/${id}` : `/api/v1/marketplace/publications/${id}`;
      const [detailRes, sessionRes] = await Promise.all([
        fetch(path, { cache: 'no-store' }),
        fetch('/api/v1/auth/session', { cache: 'no-store' }),
      ]);
      if (cancelled) return;
      if (!detailRes.ok) {
        setError('NOT_FOUND');
        return;
      }
      setEntity(await detailRes.json());
      if (sessionRes.ok) {
        const session = (await sessionRes.json()) as { user?: { id?: string } };
        setViewerUserId(session.user?.id ?? null);
      }
    }
    void load().catch(() => setError('API_UNREACHABLE'));
    return () => {
      cancelled = true;
    };
  }, [kind, id]);

  if (error) {
    return (
      <PageReveal className="ts-page">
        <div className="card ts-reveal" style={{ padding: '28px 30px', borderRadius: 24, border: '1px solid var(--border-hi)' }}>
          <p className="ts-eyebrow" style={{ marginBottom: 10 }}>
            <MeridiaPrismLogo size={18} />
            <span>MERIDIA · MARKETPLACE STOREFRONT</span>
          </p>
          <h1 className="ts-title kinetic-heading" style={{ fontSize: '1.65rem' }}>
            {error === 'NOT_FOUND' ? 'Actividad o servicio no encontrado' : 'No se pudo cargar el servicio'}
          </h1>
          <p style={{ margin: '8px 0 18px', color: 'var(--text-secondary)', fontSize: 14.5 }}>
            Verifica el identificador o regresa al catálogo principal del Marketplace para explorar las actividades activas.
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link href="/marketplace" className="btn btn-amber btn-sm">
              <ArrowLeft size={15} />
              <span>Volver al Marketplace</span>
            </Link>
            <Link href="/marketplace/negotiations" className="btn btn-outline btn-sm">
              <Compass size={15} />
              <span>Sala de Negociaciones</span>
            </Link>
          </div>
        </div>
      </PageReveal>
    );
  }

  if (!entity) {
    return (
      <PageReveal className="ts-page">
        <div className="card ts-reveal" style={{ padding: '28px 30px', borderRadius: 24, color: 'var(--text-secondary)' }}>
          Cargando perfil y vitrina interactiva de MERIDIA…
        </div>
      </PageReveal>
    );
  }

  const wm =
    kind === 'gig'
      ? {
          enabled: (entity as StorefrontGig).seller.webMonetizationEnabled,
          url: (entity as StorefrontGig).seller.verifiedWalletAddressUrl,
        }
      : { enabled: false, url: null };

  return (
    <>
      {kind === 'gig' ? (
        <WebMonetizationHeadTag webMonetizationEnabled={wm.enabled} verifiedWalletAddressUrl={wm.url} />
      ) : null}
      <StorefrontPage kind={kind} initial={entity} viewerUserId={viewerUserId} />
    </>
  );
}

