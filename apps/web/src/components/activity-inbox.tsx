'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  Compass,
  FolderKanban,
  MessageSquare,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  XCircle,
} from 'lucide-react';
import { SellerActivityItemSchema, type SellerActivityItem } from '@taskstream/shared-schemas';
import { api, formatUsd, humanError } from '@/src/lib/api-client';
import { PageReveal } from '@/src/components/page-reveal';
import { MeridiaPrismLogo, PrismActionIcon } from '@/src/components/brand/meridia-prism-logo';

const CLIENT_PORTRAITS = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=160&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=160&q=80',
] as const;

/**
 * Bandeja de Actividad de MERIDIA: aceptar → dinero a escrow al instante; rechazar → sin pago.
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
    <PageReveal className="ts-page">
      {/* Barra superior de navegación */}
      <div className="ts-reveal" style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link href="/marketplace" className="btn btn-outline btn-sm">
            <ArrowLeft size={15} />
            <span>Marketplace</span>
          </Link>
          <Link href="/marketplace/negotiations" className="btn btn-outline btn-sm">
            <Compass size={15} />
            <span>Sala de Negociaciones</span>
          </Link>
        </div>
        <button type="button" className="btn btn-outline btn-sm" disabled={busy} onClick={() => void load()}>
          <RefreshCw size={14} />
          <span>Actualizar bandeja</span>
        </button>
      </div>

      {/* Cabecera MERIDIA */}
      <header className="ts-page__header ts-reveal">
        <p className="ts-eyebrow">
          <MeridiaPrismLogo size={20} />
          <span>MERIDIA · BANDEJA UNIFICADA DE ACTIVIDAD &amp; SOLICITUDES (24H)</span>
        </p>
        <h1 className="ts-title kinetic-heading">
          Actividad y encargos <span className="ts-title__accent">en tiempo real</span>
        </h1>
        <p className="ts-lead">
          Cuando un Cliente solicita tu servicio, dispones de <strong>24 horas</strong> para confirmar. Si aceptas, el{' '}
          <strong>100% del pago</strong> entra a custodia Open Payments al instante y se habilita el espacio de trabajo
          con plazo de 7 días. Si rechazas, el dinero nunca se envía.
        </p>
      </header>

      {/* Resumen de métricas de la bandeja */}
      <section className="ts-reveal" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        <article className="meridia-user-stat">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Pendientes de Confirmación (24h)
            </span>
            <Clock size={16} style={{ color: 'var(--volt)' }} />
          </div>
          <strong className="kinetic-heading tabular-num" style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', color: 'var(--volt)' }}>
            {pending.length} {pending.length === 1 ? 'Solicitud' : 'Solicitudes'}
          </strong>
          <span style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>
            Acepta para activar custodia 100% GNAP
          </span>
        </article>

        <article className="meridia-user-stat">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Encargos Activos e Historial
            </span>
            <FolderKanban size={16} style={{ color: 'var(--tide)' }} />
          </div>
          <strong className="kinetic-heading tabular-num" style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', color: 'var(--tide-ink)' }}>
            {rest.length} {rest.length === 1 ? 'Orden' : 'Órdenes'}
          </strong>
          <span style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>
            Liquidación atómica 96% Freelancer / 4% Meridia
          </span>
        </article>

        <article className="meridia-user-stat">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Protección del Protocolo
            </span>
            <ShieldCheck size={16} style={{ color: 'var(--tide)' }} />
          </div>
          <strong className="kinetic-heading" style={{ fontFamily: 'var(--font-display)', fontSize: '1.45rem', color: 'var(--text-primary)' }}>
            Visor + Consejero IA
          </strong>
          <span style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>
            Auditoría consultiva en imagen y texto
          </span>
        </article>
      </section>

      {error ? (
        <div className="alert alert-error ts-reveal" role="alert">
          <XCircle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
          <div>{error}</div>
        </div>
      ) : null}

      {ok ? (
        <div className="alert alert-success ts-reveal" role="status">
          <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: 2 }} />
          <div>{ok}</div>
        </div>
      ) : null}

      {/* SECCIÓN 1: Solicitudes pendientes de confirmación (24h) */}
      <section className="ts-reveal" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <h2 className="kinetic-heading" style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.35rem', fontWeight: 700 }}>
            Pendientes de tu respuesta ({pending.length})
          </h2>
          <span className="badge badge-pending">
            <span className="pulse-dot" /> Ventana determinista de 24 horas
          </span>
        </div>

        {pending.length === 0 ? (
          <div
            className="card"
            style={{
              padding: '28px 30px',
              borderRadius: 24,
              border: '1px solid var(--border-hi)',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
            }}
          >
            <div>
              <strong style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', display: 'block', marginBottom: 4 }}>
                No tienes solicitudes esperando confirmación en este momento
              </strong>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 14 }}>
                Explora los encargos abiertos en el Marketplace o publica tu propio servicio para recibir contrataciones
                directas.
              </p>
            </div>
            <Link href="/marketplace" className="btn btn-amber btn-sm">
              <PrismActionIcon size={16} />
              <span>Explorar el Marketplace</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          pending.map((item, idx) => (
            <article
              key={item.taskId}
              className="card"
              style={{
                padding: '22px 26px',
                borderRadius: 24,
                border: '1px solid rgba(var(--volt-rgb), 0.45)',
                background: 'linear-gradient(135deg, rgba(var(--volt-rgb), 0.1), transparent), var(--surface)',
                display: 'flex',
                justifyContent: 'space-between',
                gap: 18,
                flexWrap: 'wrap',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', flex: 1, minWidth: 260 }}>
                <img
                  src={CLIENT_PORTRAITS[idx % CLIENT_PORTRAITS.length]}
                  alt={item.buyerDisplayName ?? 'Cliente'}
                  className="ld-person-photo"
                  style={{ width: 48, height: 48, borderRadius: 14 }}
                />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                    <span className="badge badge-pending">NUEVA SOLICITUD · 24H</span>
                    {item.buyerDisplayName ? (
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-secondary)' }}>
                        Cliente: <strong style={{ color: 'var(--text-primary)' }}>{item.buyerDisplayName}</strong>
                      </span>
                    ) : null}
                  </div>
                  <h3 className="kinetic-heading" style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.18rem', fontWeight: 700 }}>
                    {item.title}
                  </h3>
                  {item.projectBrief ? (
                    <p style={{ margin: '6px 0 0', fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {item.projectBrief}
                    </p>
                  ) : null}
                  <p className="tabular-num" style={{ margin: '8px 0 0', color: 'var(--text-secondary)', fontSize: 13 }}>
                    Monto en custodia:{' '}
                    <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--volt)' }}>
                      {formatUsd(item.totalAmountUSDInCents)}
                    </strong>{' '}
                    · Responde antes de{' '}
                    {new Date(item.sellerConfirmationDeadlineAt).toLocaleString('es', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <button
                  type="button"
                  className="btn btn-emerald btn-sm"
                  disabled={busy}
                  onClick={() => void accept(item.taskId)}
                >
                  <CheckCircle2 size={15} />
                  <span>Aceptar encargo</span>
                </button>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  disabled={busy}
                  onClick={() => void reject(item.taskId)}
                >
                  <XCircle size={15} />
                  <span>Rechazar</span>
                </button>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => router.push(`/orders/${item.taskId}/escrow`)}
                >
                  <Sparkles size={14} />
                  <span>Ver detalle</span>
                </button>
              </div>
            </article>
          ))
        )}
      </section>

      {/* SECCIÓN 2: Otros encargos en curso o finalizados */}
      {rest.length > 0 ? (
        <section className="ts-reveal" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <h2 className="kinetic-heading" style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.35rem', fontWeight: 700 }}>
            Otros encargos y órdenes ({rest.length})
          </h2>
          {rest.map((item, idx) => (
            <article
              key={item.taskId}
              className="card"
              style={{
                padding: '20px 24px',
                borderRadius: 22,
                border: '1px solid var(--border-hi)',
                display: 'flex',
                justifyContent: 'space-between',
                gap: 16,
                flexWrap: 'wrap',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                <img
                  src={CLIENT_PORTRAITS[(idx + 1) % CLIENT_PORTRAITS.length]}
                  alt="Participante"
                  className="ld-person-photo"
                  style={{ width: 44, height: 44, borderRadius: 12 }}
                />
                <div>
                  <strong style={{ fontFamily: 'var(--font-display)', fontSize: '1.08rem', display: 'block' }}>
                    {item.title}
                  </strong>
                  <p className="tabular-num" style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: 13.5 }}>
                    <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--tide-ink)' }}>
                      {formatUsd(item.totalAmountUSDInCents)}
                    </strong>{' '}
                    ·{' '}
                    {item.lifecycleStatus === 'PENDING_ESCROW_FUNDING'
                      ? 'Pendiente de confirmación (24h)'
                      : item.lifecycleStatus === 'ESCROW_LOCKED'
                        ? 'Fondos 100% en custodia activa'
                        : item.lifecycleStatus === 'COMPLETED'
                          ? 'Completado · 96% liberado'
                          : item.lifecycleStatus === 'CANCELLED'
                            ? 'Cancelado · sin movimiento de fondos'
                            : 'Reembolsado 100% al Cliente'}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {item.lifecycleStatus === 'ESCROW_LOCKED' ? (
                  <button
                    type="button"
                    className="btn btn-amber btn-sm"
                    onClick={() => router.push(`/orders/${item.taskId}/workspace`)}
                  >
                    <MessageSquare size={14} />
                    <span>Espacio de trabajo</span>
                  </button>
                ) : null}
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => router.push(`/orders/${item.taskId}/escrow`)}
                >
                  <span>Abrir custodia</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </article>
          ))}
        </section>
      ) : null}
    </PageReveal>
  );
}

