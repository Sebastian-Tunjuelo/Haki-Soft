'use client';

import { useCallback, useEffect, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SellerActivityItemSchema, type SellerActivityItem } from '@taskstream/shared-schemas';
import { api, formatUsd, humanError } from '@/src/lib/api-client';

/**
 * Bandeja del emprendedor: aceptar → dinero a escrow al instante; rechazar → sin pago.
 */
export function ActivityInbox() {
  const router = useRouter();
  const [items, setItems] = useState<SellerActivityItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const load = useCallback(async () => {
    const result = await api('/api/v1/orders/activity');
    if (result.status !== 200) {
      setError(humanError(result.status, result.body));
      setItems([]);
      return;
    }
    const parsed = Array.isArray(result.body)
      ? result.body
          .map((row) => SellerActivityItemSchema.safeParse(row))
          .filter((r) => r.success)
          .map((r) => r.data)
      : [];
    setItems(parsed);
    setError(null);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function accept(taskId: string) {
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      const result = await api(`/api/v1/orders/${taskId}/escrow/confirm`, { method: 'POST' });
      if (result.status !== 200 && result.status !== 201) {
        setError(humanError(result.status, result.body));
        return;
      }
      setOk('Aceptaste el encargo. El pago quedó en custodia. Abriendo el espacio de trabajo…');
      await load();
      router.push(`/orders/${taskId}/workspace`);
    } catch {
      setError(humanError(0, { code: 'API_UNREACHABLE' }));
    } finally {
      setBusy(false);
    }
  }

  async function reject(taskId: string) {
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      const result = await api(`/api/v1/orders/${taskId}/escrow/reject`, { method: 'POST' });
      if (result.status !== 200 && result.status !== 201) {
        setError(humanError(result.status, result.body));
        return;
      }
      setOk('Rechazaste la solicitud. El dinero del contratador no se envió.');
      await load();
    } catch {
      setError(humanError(0, { code: 'API_UNREACHABLE' }));
    } finally {
      setBusy(false);
    }
  }

  const pending = items.filter((item) => !item.sellerConfirmed && item.lifecycleStatus === 'PENDING_ESCROW_FUNDING');
  const rest = items.filter((item) => !pending.includes(item));

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px 48px', display: 'flex', flexDirection: 'column', gap: 22 }}>
      <Link href="/marketplace" style={{ color: 'var(--brand-blue)', fontSize: 14 }}>
        ← Marketplace
      </Link>

      <header>
        <h1 style={{ margin: 0, fontSize: '1.65rem' }}>Actividad</h1>
        <p style={{ margin: '8px 0 0', color: 'var(--text-secondary)' }}>
          Si aceptas, el pago entra a escrow al instante y quedan vinculadas las partes. Si rechazas, el dinero nunca se
          manda. Tienes 24 h para responder.
        </p>
      </header>

      {error ? <p style={bannerError}>{error}</p> : null}
      {ok ? <p style={bannerOk}>{ok}</p> : null}

      <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Pendientes de tu respuesta</h2>
        {pending.length === 0 ? (
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>No tienes solicitudes esperando.</p>
        ) : (
          pending.map((item) => (
            <article key={item.taskId} style={card}>
              <div>
                <strong>{item.title}</strong>
                <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: 14 }}>
                  {formatUsd(item.totalAmountUSDInCents)} · responde antes de{' '}
                  {new Date(item.sellerConfirmationDeadlineAt).toLocaleString('es', {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  })}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={busy}
                  onClick={() => void accept(item.taskId)}
                >
                  Aceptar
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={busy}
                  onClick={() => void reject(item.taskId)}
                >
                  Rechazar
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => router.push(`/orders/${item.taskId}/escrow`)}
                >
                  Ver detalle
                </button>
              </div>
            </article>
          ))
        )}
      </section>

      {rest.length > 0 ? (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Otros encargos</h2>
          {rest.map((item) => (
            <article key={item.taskId} style={card}>
              <div>
                <strong>{item.title}</strong>
                <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: 14 }}>
                  {formatUsd(item.totalAmountUSDInCents)} ·{' '}
                  {item.lifecycleStatus === 'PENDING_ESCROW_FUNDING'
                    ? 'Pendiente'
                    : item.lifecycleStatus === 'ESCROW_LOCKED'
                      ? 'Fondos en custodia'
                      : item.lifecycleStatus === 'COMPLETED'
                        ? 'Completado'
                        : item.lifecycleStatus === 'CANCELLED'
                          ? 'Cancelado · sin pago'
                          : 'Reembolsado'}
                </p>
              </div>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => router.push(`/orders/${item.taskId}/escrow`)}
              >
                Abrir
              </button>
            </article>
          ))}
        </section>
      ) : null}
    </div>
  );
}

const card: CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: 14,
  padding: 16,
  background: 'var(--surface)',
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  flexWrap: 'wrap',
  alignItems: 'center',
};

const bannerError: CSSProperties = {
  margin: 0,
  padding: '12px 14px',
  borderRadius: 10,
  background: 'var(--status-failed-bg)',
  color: 'var(--status-failed)',
  fontSize: 14,
};

const bannerOk: CSSProperties = {
  margin: 0,
  padding: '12px 14px',
  borderRadius: 10,
  background: 'var(--status-verified-bg)',
  color: 'var(--status-verified)',
  fontSize: 14,
};
