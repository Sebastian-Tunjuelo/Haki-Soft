'use client';

import { useCallback, useEffect, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import { DisputeCaseListItemSchema, type DisputeCaseListItem } from '@taskstream/shared-schemas';
import { api, humanError } from '@/src/lib/api-client';

export function AdminDisputesList() {
  const [items, setItems] = useState<DisputeCaseListItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api('/api/v1/admin/disputes');
      if (result.status === 403) {
        setError(humanError(result.status, result.body));
        setItems([]);
        return;
      }
      if (result.status !== 200) {
        setError(humanError(result.status, result.body));
        setItems([]);
        return;
      }
      const parsed = Array.isArray(result.body)
        ? result.body
            .map((row) => DisputeCaseListItemSchema.safeParse(row))
            .filter((r) => r.success)
            .map((r) => r.data)
        : [];
      setItems(parsed);
      setError(null);
    } catch {
      setError(humanError(0, { code: 'API_UNREACHABLE' }));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px 48px', display: 'flex', flexDirection: 'column', gap: 18 }}>
      <header>
        <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Disputas abiertas</h1>
        <p style={{ margin: '8px 0 0', color: 'var(--text-secondary)', fontSize: 14 }}>
          Revisa disputas abiertas y decide reembolso 100 % al contratador o liberación 96/4 al emprendedor.
        </p>
      </header>

      {error ? <p style={bannerError}>{error}</p> : null}
      {loading ? <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Cargando…</p> : null}

      {!loading && items.length === 0 && !error ? (
        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>No hay disputas abiertas.</p>
      ) : null}

      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {items.map((item) => (
          <li key={item.disputeId} style={panel}>
            <strong>{item.title}</strong>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>
              {item.buyerDisplayName} ↔ {item.sellerDisplayName}
            </p>
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.45 }}>{item.claimReason}</p>
            <Link href={`/admin/disputes/${item.disputeId}`} className="btn btn-secondary" style={{ alignSelf: 'flex-start' }}>
              Revisar caso
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

const panel: CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: 14,
  padding: 16,
  background: 'var(--surface)',
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
};

const bannerError: CSSProperties = {
  margin: 0,
  padding: '12px 14px',
  borderRadius: 10,
  background: 'var(--status-failed-bg)',
  color: 'var(--status-failed)',
  fontSize: 14,
};
