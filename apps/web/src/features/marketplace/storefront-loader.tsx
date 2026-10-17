'use client';

import { useEffect, useState } from 'react';
import { StorefrontPage } from './storefront-page';
import type { StorefrontGig, StorefrontPublication } from './storefront-types';
import { WebMonetizationHeadTag } from '@/src/features/web-monetization/web-monetization-head-tag';

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
      <div style={{ padding: 24 }}>
        <p>{error === 'NOT_FOUND' ? 'No encontrado.' : 'No se pudo cargar el storefront.'}</p>
      </div>
    );
  }

  if (!entity) {
    return <div style={{ padding: 24, color: 'var(--text-muted)' }}>Cargando storefront…</div>;
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
