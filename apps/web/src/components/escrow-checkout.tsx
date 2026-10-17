'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  XCircle,
  MessageSquare,
} from 'lucide-react';
import { EscrowFundingViewSchema, type EscrowFundingView } from '@taskstream/shared-schemas';
import { api, formatUsd, humanError } from '@/src/lib/api-client';
import { PageReveal } from '@/src/components/page-reveal';
import { MeridiaPrismLogo, PrismActionIcon } from '@/src/components/brand/meridia-prism-logo';

const STATUS_LABEL: Record<EscrowFundingView['lifecycleStatus'], string> = {
  PENDING_ESCROW_FUNDING: 'Esperando respuesta del Freelancer (24h)',
  ESCROW_LOCKED: 'Fondos 100% en Custodia Activa',
  COMPLETED: 'Completado · 96% Liberado al Freelancer',
  REFUNDED: 'Reembolso 100% al Cliente',
  CANCELLED: 'Solicitud Cerrada · Sin movimiento de fondos',
};

/**
 * Flujo acordado en MERIDIA:
 * 1) Cliente confirma contratar (modal en storefront/negociaciones)
 * 2) Solicitud pendiente 24h — dinero NO se manda todavía
 * 3) Cliente cancela / Freelancer rechaza / timeout → sin pago
 * 4) Freelancer acepta → dinero a escrow al instante + timers (SPEC-09)
 */
export function EscrowCheckout({ taskId }: { taskId: string }) {
  const [view, setView] = useState<EscrowFundingView | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const result = await api(`/api/v1/orders/${taskId}/escrow`);
    if (result.status !== 200) {
      setError(humanError(result.status, result.body));
      setView(null);
      return;
    }
    const parsed = EscrowFundingViewSchema.safeParse(result.body);
    if (!parsed.success) {
      setError('No pudimos leer el estado de la custodia.');
      return;
    }
    setView(parsed.data);
    setError(null);
  }, [taskId]);

  useEffect(() => {
    void load();
  }, [load]);

  // Mientras espera aceptación del emprendedor, refrescar solo para que el contratador
  // vea el paso a custodia sin pulsar «Actualizar».
  useEffect(() => {
    if (view?.lifecycleStatus !== 'PENDING_ESCROW_FUNDING') return;
    const poll = setInterval(() => void load(), 3000);
    return () => clearInterval(poll);
  }, [view?.lifecycleStatus, load]);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await action();
    } catch {
      setError(humanError(0, { code: 'API_UNREACHABLE' }));
    } finally {
      setBusy(false);
    }
  }

  async function acceptAsSeller() {
    await run(async () => {
      const result = await api(`/api/v1/orders/${taskId}/escrow/confirm`, { method: 'POST' });
      if (result.status !== 200 && result.status !== 201) {
        setError(humanError(result.status, result.body));
        return;
      }
      const parsed = EscrowFundingViewSchema.safeParse(result.body);
      if (parsed.success) setView(parsed.data);
      if (parsed.success && parsed.data.interactRedirectUri && parsed.data.lifecycleStatus === 'PENDING_ESCROW_FUNDING') {
        setMessage(
          'Aceptaste el encargo. El contratador debe autorizar el pago real en la Test Wallet para entrar a custodia.',
        );
        window.location.assign(`/orders/${taskId}/workspace`);
        return;
      }
      setMessage('Aceptaste el encargo. El pago quedó en custodia. Abriendo el espacio de trabajo…');
      window.location.assign(`/orders/${taskId}/workspace`);
    });
  }

  async function rejectAsSeller() {
    await run(async () => {
      const result = await api(`/api/v1/orders/${taskId}/escrow/reject`, { method: 'POST' });
      if (result.status !== 200 && result.status !== 201) {
        setError(humanError(result.status, result.body));
        return;
      }
      const parsed = EscrowFundingViewSchema.safeParse(result.body);
      if (parsed.success) setView(parsed.data);
      setMessage('Rechazaste la solicitud. El dinero del contratador no se envió.');
    });
  }

  async function cancelAsBuyer() {
    await run(async () => {
      const result = await api(`/api/v1/orders/${taskId}/escrow/cancel`, { method: 'POST' });
      if (result.status !== 200 && result.status !== 201) {
        setError(humanError(result.status, result.body));
        return;
      }
      const parsed = EscrowFundingViewSchema.safeParse(result.body);
      if (parsed.success) setView(parsed.data);
      setMessage('Cancelaste la solicitud. El dinero no se envió al escrow.');
    });
  }

  const status = view?.lifecycleStatus ?? null;
  const pending = status === 'PENDING_ESCROW_FUNDING';
  const activeCustody =
    status === 'ESCROW_LOCKED' ||
    status === 'ESCROW_EXTENDED' ||
    status === 'EXTENSION_REQUESTED' ||
    status === 'IN_REVIEW' ||
    status === 'REVISION_REQUESTED' ||
    status === 'FINAL_CLAIM_WINDOW_30M' ||
    status === 'DISPUTED';
  const cancelled = status === 'CANCELLED';
  const terminal =
    status === 'COMPLETED' ||
    status === 'REFUNDED' ||
    status === 'AUTO_REFUNDED_INITIAL_EXPIRED' ||
    status === 'AUTO_REFUNDED_EXTENDED_EXPIRED' ||
    status === 'AUTO_REFUNDED_BY_TIMEOUT' ||
    cancelled;
  const isBuyer = view?.viewerRole === 'buyer';
  const isSeller = view?.viewerRole === 'seller';

  const step = cancelled ? 0 : pending ? 1 : activeCustody ? 2 : terminal ? 3 : 1;

  return (
    <PageReveal className="ts-page">
      {/* Navegación contextual */}
      <div className="ts-reveal" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <Link href="/marketplace" className="btn btn-outline btn-sm">
          <ArrowLeft size={15} />
          <span>Marketplace</span>
        </Link>
        <Link href="/activity" className="btn btn-outline btn-sm">
          <Sparkles size={15} />
          <span>Bandeja de Actividad</span>
        </Link>
        {locked ? (
          <Link href={`/orders/${taskId}/workspace`} className="btn btn-emerald btn-sm">
            <MessageSquare size={15} />
            <span>Espacio de Trabajo</span>
          </Link>
        ) : null}
      </div>

      {/* Cabecera */}
      <header className="ts-page__header ts-reveal">
        <p className="ts-eyebrow">
          <MeridiaPrismLogo size={20} />
          <span>MERIDIA · CUSTODIA EN ESCROW · OPEN PAYMENTS</span>
        </p>
        <h1 className="ts-title kinetic-heading">
          {view?.title ?? 'Solicitud de trabajo en custodia'}
        </h1>
        <p className="ts-lead">
          El pago solo entra a custodia cuando el Freelancer acepta el encargo. Si se cancela, se rechaza o vencen las{' '}
          <strong>24 horas</strong> sin respuesta, los fondos no se debitan.
        </p>
      </header>

      {/* Stepper Horizontal 1 — 2 — 3 coherente con Billetera */}
      {!cancelled ? (
        <section className="ts-reveal card" style={{ padding: '20px 26px', borderRadius: 22 }}>
          <div className="wallet-jpg-stepper" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }}>
            {[
              { n: 1, label: 'Solicitud enviada (24h)' },
              { n: 2, label: 'Aceptación → Custodia 100%' },
              { n: 3, label: 'Liquidación 96% / 4%' },
            ].map((item, idx) => (
              <div key={item.n} style={{ display: 'contents' }}>
                <div className={`wallet-jpg-step ${step >= item.n ? 'is-active' : ''}`}>
                  <span className="wallet-jpg-step__circle">{item.n}</span>
                  <span className="wallet-jpg-step__text">{item.label}</span>
                </div>
                {idx < 2 ? <span className={`wallet-jpg-step__line ${step > item.n ? 'is-active' : ''}`} /> : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {error ? (
        <div className="alert alert-error ts-reveal" role="alert">
          <XCircle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
          <div>{error}</div>
        </div>
      ) : null}

      {message ? (
        <div className="alert alert-success ts-reveal" role="status">
          <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: 2 }} />
          <div>{message}</div>
        </div>
      ) : null}

      {/* Resumen Financiero 100% -> 96% / 4% */}
      {view ? (
        <section className="ts-reveal card" style={{ padding: '26px 28px', borderRadius: 26, border: '1px solid var(--border-hi)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <ShieldCheck size={20} style={{ color: 'var(--tide)' }} />
              <h2 className="kinetic-heading" style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700 }}>
                Resumen de Bóveda &amp; Reparto Invariante
              </h2>
            </div>
            <span
              className={`badge ${
                status === 'ESCROW_LOCKED' || status === 'COMPLETED'
                  ? 'badge-verified'
                  : status === 'CANCELLED'
                    ? 'badge-failed'
                    : 'badge-pending'
              }`}
            >
              <span className="pulse-dot" />
              {STATUS_LABEL[status!]}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
            <article className="meridia-user-stat">
              <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Monto Total del Encargo (100%)
              </span>
              <strong className="tabular-num kinetic-heading" style={{ fontFamily: 'var(--font-mono)', fontSize: '1.7rem', color: 'var(--volt)' }}>
                {formatUsd(view.totalAmountUSDInCents)}
              </strong>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                Custodia única bloqueada vía GNAP
              </span>
            </article>

            <article className="meridia-user-stat">
              <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Si se libera · Freelancer (96%)
              </span>
              <strong className="tabular-num kinetic-heading" style={{ fontFamily: 'var(--font-mono)', fontSize: '1.7rem', color: 'var(--tide-ink)' }}>
                {formatUsd(view.freelancerPayoutUSDInCents)}
              </strong>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                Desembolso directo a billetera ILP
              </span>
            </article>

            <article className="meridia-user-stat">
              <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Si se libera · Protocolo MERIDIA (4%)
              </span>
              <strong className="tabular-num kinetic-heading" style={{ fontFamily: 'var(--font-mono)', fontSize: '1.7rem', color: 'var(--text-primary)' }}>
                {formatUsd(view.platformFeeUSDInCents)}
              </strong>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                Comisión invariante del protocolo
              </span>
            </article>
          </div>
        </section>
      ) : !error ? (
        <div className="card ts-reveal" style={{ padding: 24, borderRadius: 22, color: 'var(--text-secondary)' }}>
          Sincronizando estado de la custodia Open Payments…
        </div>
      ) : null}

      {/* Paneles de Acción según estado y rol */}
      <section className="ts-reveal" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {pending && isBuyer ? (
          <div
            className="card"
            style={{
              padding: '24px 28px',
              borderRadius: 24,
              border: '1px solid rgba(var(--volt-rgb), 0.45)',
              background: 'linear-gradient(135deg, rgba(var(--volt-rgb), 0.12), transparent), var(--surface)',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Clock size={19} style={{ color: 'var(--volt)' }} />
              <h3 className="kinetic-heading" style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.18rem', fontWeight: 700 }}>
                Tu solicitud fue enviada al Freelancer
              </h3>
            </div>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.55 }}>
              El Freelancer tiene <strong style={{ color: 'var(--volt)' }}>24 horas</strong> para aceptar. Hasta
              entonces el dinero <strong>no se envía</strong> al escrow. Puedes arrepentirte y cancelar sin ningún
              cargo.
            </p>
            {view?.sellerConfirmationDeadlineAt ? (
              <p className="tabular-num" style={{ margin: 0, fontSize: 12.5, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                Límite de confirmación:{' '}
                {new Date(view.sellerConfirmationDeadlineAt).toLocaleString('es', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </p>
            ) : null}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 4 }}>
              <button type="button" className="btn btn-outline" disabled={busy} onClick={() => void cancelAsBuyer()}>
                <XCircle size={16} />
                <span>{busy ? 'Cancelando…' : 'Arrepentirme · cancelar solicitud'}</span>
              </button>
            </div>
          </div>
        ) : null}

        {pending && isSeller ? (
          <div
            className="card"
            style={{
              padding: '24px 28px',
              borderRadius: 24,
              border: '1px solid var(--border-hi)',
              background: 'linear-gradient(135deg, rgba(var(--tide-rgb), 0.12), transparent), var(--surface)',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            <h3 className="kinetic-heading" style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 700 }}>
              Nueva solicitud de trabajo lista para tu confirmación
            </h3>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.55 }}>
              Si aceptas, el pago del Cliente entra al instante al 100% en custodia y se abre el espacio de trabajo con
              el reloj de 7 días. Si rechazas, el dinero nunca se mueve.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button type="button" className="btn btn-emerald" disabled={busy} onClick={() => void acceptAsSeller()}>
                <CheckCircle2 size={17} />
                <span>{busy ? 'Procesando…' : 'Aceptar y recibir custodia 100%'}</span>
              </button>
              <button type="button" className="btn btn-outline" disabled={busy} onClick={() => void rejectAsSeller()}>
                <XCircle size={16} />
                <span>Rechazar solicitud</span>
              </button>
            </div>
          </div>
        ) : null}

        {locked ? (
          <div
            className="card"
            style={{
              padding: '24px 28px',
              borderRadius: 24,
              border: '1px solid var(--border-hi)',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <CheckCircle2 size={20} style={{ color: 'var(--tide)' }} />
              <p style={{ margin: 0, color: 'var(--tide-ink)', fontSize: 14.5, fontWeight: 700 }}>
                Fondos en custodia activa. Las partes están vinculadas: usa el espacio de trabajo para chat en vivo,
                anexos y el contador de entrega de 7 días.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <Link href={`/orders/${taskId}/workspace`} className="btn btn-amber">
                <PrismActionIcon size={17} />
                <span>Abrir espacio de trabajo</span>
                <ArrowRight size={15} />
              </Link>
              <button type="button" className="btn btn-emerald" disabled={busy} onClick={() => void release()}>
                <CheckCircle2 size={16} />
                <span>Liberar 96 % / 4 %</span>
              </button>
              <button type="button" className="btn btn-outline" disabled={busy} onClick={() => void refund()}>
                <span>Reembolsar 100 %</span>
              </button>
            </div>
          </div>
        ) : null}

        {cancelled ? (
          <div className="card" style={{ padding: '22px 26px', borderRadius: 22 }}>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 14.5 }}>
              Esta solicitud se cerró sin enviar dinero (cancelación del Cliente, rechazo del Freelancer o vencimiento
              de las 24 h sin respuesta).
            </p>
          </div>
        ) : null}

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          {terminal ? (
            <Link href="/marketplace" className="btn btn-amber">
              <PrismActionIcon size={16} />
              <span>Ir al Marketplace</span>
              <ArrowRight size={15} />
            </Link>
          ) : null}
          <button type="button" className="btn btn-outline btn-sm" disabled={busy} onClick={() => void load()}>
            <RefreshCw size={14} />
            <span>Actualizar estado</span>
          </button>
        </div>
      </section>
    </PageReveal>
  );
}

