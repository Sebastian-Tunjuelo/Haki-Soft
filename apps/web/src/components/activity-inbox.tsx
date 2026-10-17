'use client';

import { useCallback, useEffect, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  DeliverablePreviewViewSchema,
  OrderWorkspaceViewSchema,
  SellerActivityItemSchema,
  type DeliverablePreviewView,
  type OrderWorkspaceView,
  type SellerActivityItem,
} from '@taskstream/shared-schemas';
import { api, formatUsd, humanError } from '@/src/lib/api-client';

const ACTIVE = new Set([
  'ESCROW_LOCKED',
  'ESCROW_EXTENDED',
  'EXTENSION_REQUESTED',
  'IN_REVIEW',
  'REVISION_REQUESTED',
  'FINAL_CLAIM_WINDOW_30M',
  'DISPUTED',
]);

const HISTORY = new Set([
  'COMPLETED',
  'REFUNDED',
  'CANCELLED',
  'AUTO_REFUNDED_INITIAL_EXPIRED',
  'AUTO_REFUNDED_EXTENDED_EXPIRED',
  'AUTO_REFUNDED_BY_TIMEOUT',
]);

function statusLabel(status: SellerActivityItem['lifecycleStatus']): string {
  switch (status) {
    case 'PENDING_ESCROW_FUNDING':
      return 'Pendiente de aceptación';
    case 'ESCROW_LOCKED':
    case 'ESCROW_EXTENDED':
    case 'EXTENSION_REQUESTED':
      return 'Fondos en custodia';
    case 'IN_REVIEW':
      return 'Entrega en revisión (72 h · 3 días)';
    case 'REVISION_REQUESTED':
      return 'Corrección solicitada';
    case 'DISPUTED':
      return 'En disputa';
    case 'FINAL_CLAIM_WINDOW_30M':
      return 'Liberación en curso';
    case 'COMPLETED':
      return 'Completado · fondos liberados';
    case 'REFUNDED':
    case 'AUTO_REFUNDED_INITIAL_EXPIRED':
    case 'AUTO_REFUNDED_EXTENDED_EXPIRED':
    case 'AUTO_REFUNDED_BY_TIMEOUT':
      return 'Reembolsado / cerrado';
    case 'CANCELLED':
      return 'Cancelado · sin pago';
    default:
      return status;
  }
}

/**
 * Bandeja unificada: pendientes (seller), en curso (chat/workspace) e historia.
 */
export function ActivityInbox() {
  const router = useRouter();
  const [items, setItems] = useState<SellerActivityItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<{
    workspace: OrderWorkspaceView | null;
    deliverables: DeliverablePreviewView[];
    note: string | null;
  } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

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
    const poll = setInterval(() => void load(), 2_500);
    const onReady = () => void load();
    window.addEventListener('ts:delivery-ready', onReady);
    window.addEventListener('ts:work-accepted', onReady);
    return () => {
      clearInterval(poll);
      window.removeEventListener('ts:delivery-ready', onReady);
      window.removeEventListener('ts:work-accepted', onReady);
    };
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

  async function toggleHistory(taskId: string) {
    if (expandedId === taskId) {
      setExpandedId(null);
      setDetail(null);
      return;
    }
    setExpandedId(taskId);
    setDetailLoading(true);
    setDetail(null);
    try {
      const [ws, dels] = await Promise.all([
        api(`/api/v1/orders/${taskId}/workspace`),
        api(`/api/v1/orders/${taskId}/deliverables`),
      ]);
      const workspace =
        ws.status === 200 ? OrderWorkspaceViewSchema.safeParse(ws.body).data ?? null : null;
      const deliverables =
        dels.status === 200 && Array.isArray(dels.body)
          ? dels.body
              .map((row) => DeliverablePreviewViewSchema.safeParse(row))
              .filter((r) => r.success)
              .map((r) => r.data)
          : [];
      const note =
        ws.status === 409
          ? 'Este encargo se cerró antes de abrir el espacio de trabajo (sin chat ni entregas).'
          : ws.status !== 200 && dels.status !== 200
            ? humanError(ws.status, ws.body)
            : null;
      setDetail({ workspace, deliverables, note });
    } catch {
      setDetail({ workspace: null, deliverables: [], note: humanError(0, { code: 'API_UNREACHABLE' }) });
    } finally {
      setDetailLoading(false);
    }
  }

  const pending = items.filter(
    (item) =>
      item.viewerRole !== 'buyer' &&
      !item.sellerConfirmed &&
      item.lifecycleStatus === 'PENDING_ESCROW_FUNDING',
  );
  const waitingAsBuyer = items.filter(
    (item) => item.viewerRole === 'buyer' && item.lifecycleStatus === 'PENDING_ESCROW_FUNDING',
  );
  const active = items.filter((item) => ACTIVE.has(item.lifecycleStatus));
  const history = items.filter((item) => HISTORY.has(item.lifecycleStatus));

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px 48px', display: 'flex', flexDirection: 'column', gap: 22 }}>
      <Link href="/marketplace" style={{ color: 'var(--brand-blue)', fontSize: 14 }}>
        ← Marketplace
      </Link>

      <header>
        <h1 style={{ margin: 0, fontSize: '1.65rem' }}>Actividad</h1>
        <p style={{ margin: '8px 0 0', color: 'var(--text-secondary)' }}>
          Solicitudes pendientes, encargos en curso (chat y entregas) e historial de lo ya cerrado.
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
                  {item.buyerDisplayName ? `${item.buyerDisplayName} · ` : ''}
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

      {waitingAsBuyer.length > 0 ? (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Esperando al emprendedor</h2>
          {waitingAsBuyer.map((item) => (
            <article key={item.taskId} style={card}>
              <div>
                <strong>{item.title}</strong>
                <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: 14 }}>
                  {item.sellerDisplayName ? `${item.sellerDisplayName} · ` : ''}
                  {formatUsd(item.totalAmountUSDInCents)} · {statusLabel(item.lifecycleStatus)}
                </p>
              </div>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => router.push(`/orders/${item.taskId}/escrow`)}
              >
                Ver solicitud
              </button>
            </article>
          ))}
        </section>
      ) : null}

      <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h2 style={{ margin: 0, fontSize: '1.1rem' }}>En curso</h2>
        {active.length === 0 ? (
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>No tienes encargos abiertos.</p>
        ) : (
          active.map((item) => (
            <article key={item.taskId} style={card}>
              <div>
                <strong>{item.title}</strong>
                <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: 14 }}>
                  {item.viewerRole === 'buyer'
                    ? item.sellerDisplayName
                      ? `Con ${item.sellerDisplayName} · `
                      : ''
                    : item.buyerDisplayName
                      ? `Con ${item.buyerDisplayName} · `
                      : ''}
                  {formatUsd(item.totalAmountUSDInCents)} · {statusLabel(item.lifecycleStatus)}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => router.push(`/orders/${item.taskId}/workspace`)}
                >
                  Abrir chat
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => router.push(`/orders/${item.taskId}/deliverables`)}
                >
                  Entregables
                </button>
              </div>
            </article>
          ))
        )}
      </section>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Historia</h2>
        {history.length === 0 ? (
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Aún no hay encargos finalizados.</p>
        ) : (
          history.map((item) => (
            <article key={item.taskId} style={{ ...card, flexDirection: 'column', alignItems: 'stretch' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                <div>
                  <strong>{item.title}</strong>
                  <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: 14 }}>
                    {formatUsd(item.totalAmountUSDInCents)} · {statusLabel(item.lifecycleStatus)} ·{' '}
                    {new Date(item.createdAt).toLocaleDateString('es')}
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => void toggleHistory(item.taskId)}
                >
                  {expandedId === item.taskId ? 'Ocultar' : 'Ver contenido'}
                </button>
              </div>
              {expandedId === item.taskId ? (
                <div style={historyDetail}>
                  {detailLoading ? <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Cargando…</p> : null}
                  {detail?.note ? <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 14 }}>{detail.note}</p> : null}
                  {detail?.workspace ? (
                    <>
                      <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
                        {detail.workspace.buyerDisplayName} ↔ {detail.workspace.sellerDisplayName}
                      </p>
                      <h3 style={{ margin: 0, fontSize: '0.95rem' }}>Mensajes</h3>
                      {detail.workspace.messages.length === 0 ? (
                        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>Sin mensajes.</p>
                      ) : (
                        detail.workspace.messages.map((m) => (
                          <div key={m.messageId} style={{ fontSize: 13, lineHeight: 1.45 }}>
                            <strong>
                              {m.senderDisplayName} ({m.senderRole})
                            </strong>
                            <p style={{ margin: '2px 0 0', whiteSpace: 'pre-wrap' }}>{m.body}</p>
                          </div>
                        ))
                      )}
                    </>
                  ) : null}
                  {detail && !detailLoading ? (
                    <>
                      <h3 style={{ margin: 0, fontSize: '0.95rem' }}>Entregables</h3>
                      {detail.deliverables.length === 0 ? (
                        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>Sin entregas.</p>
                      ) : (
                        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13 }}>
                          {detail.deliverables.map((d) => (
                            <li key={d.deliverableId}>
                              Rev. {d.revisionNumber} · {d.fileName} ({d.previewStatus})
                            </li>
                          ))}
                        </ul>
                      )}
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <Link href={`/orders/${item.taskId}/deliverables`} className="btn btn-secondary">
                          Abrir entregables
                        </Link>
                        {detail.workspace ? (
                          <Link href={`/orders/${item.taskId}/workspace`} className="btn btn-secondary">
                            Abrir workspace
                          </Link>
                        ) : null}
                      </div>
                    </>
                  ) : null}
                </div>
              ) : null}
            </article>
          ))
        )}
      </section>
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

const historyDetail: CSSProperties = {
  borderTop: '1px solid var(--border)',
  paddingTop: 12,
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

const bannerOk: CSSProperties = {
  margin: 0,
  padding: '12px 14px',
  borderRadius: 10,
  background: 'var(--status-verified-bg)',
  color: 'var(--status-verified)',
  fontSize: 14,
};
