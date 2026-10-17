'use client';

import { useCallback, useEffect, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import { EscrowFundingViewSchema, type EscrowFundingView } from '@taskstream/shared-schemas';
import { api, formatUsd, humanError } from '@/src/lib/api-client';

const STATUS_LABEL: Partial<Record<EscrowFundingView['lifecycleStatus'], string>> = {
  PENDING_ESCROW_FUNDING: 'Esperando respuesta del emprendedor',
  ESCROW_LOCKED: 'Fondos en custodia',
  ESCROW_EXTENDED: 'Plazo extendido · fondos en custodia',
  IN_REVIEW: 'Entrega en revisión (72 h)',
  REVISION_REQUESTED: 'Corrección solicitada',
  FINAL_CLAIM_WINDOW_30M: 'Ventana final de reclamación',
  DISPUTED: 'En disputa administrativa',
  COMPLETED: 'Completado · 96 % liberado',
  REFUNDED: 'Reembolsado al comprador',
  CANCELLED: 'Solicitud cerrada · el dinero no se envió',
};

/**
 * Flujo acordado:
 * 1) Buyer confirma contratar (modal en storefront)
 * 2) Solicitud pendiente 24h — dinero NO se manda
 * 3) Buyer cancela / Seller rechaza / timeout → sin pago
 * 4) Seller acepta → dinero a escrow al instante + timers (SPEC-09)
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
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px 48px', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <Link href="/marketplace" style={{ color: 'var(--brand-blue)', fontSize: 14 }}>
          ← Marketplace
        </Link>
        <Link href="/activity" style={{ color: 'var(--brand-blue)', fontSize: 14 }}>
          Actividad
        </Link>
      </div>

      <header>
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 13 }}>Custodia en escrow</p>
        <h1 style={{ margin: '6px 0 0', fontSize: '1.65rem' }}>{view?.title ?? 'Solicitud de trabajo'}</h1>
        <p style={{ margin: '8px 0 0', color: 'var(--text-secondary)', fontSize: 15 }}>
          El pago solo entra a custodia cuando el emprendedor acepta. Si se cancela, se rechaza o pasan 24 h sin
          respuesta, el dinero no se manda.
        </p>
      </header>

      {!cancelled ? (
        <ol style={stepper}>
          {[
            { n: 1, label: 'Solicitud enviada' },
            { n: 2, label: 'Aceptación → escrow' },
            { n: 3, label: 'Cierre' },
          ].map((item) => (
            <li key={item.n} style={stepItem(step >= item.n)}>
              <span style={stepDot(step >= item.n)}>{item.n}</span>
              {item.label}
            </li>
          ))}
        </ol>
      ) : null}

      {error ? <p style={bannerError}>{error}</p> : null}
      {message ? <p style={bannerOk}>{message}</p> : null}

      {view ? (
        <section style={panel}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: '1.15rem' }}>Resumen</h2>
            <span style={badge(status!)}>{STATUS_LABEL[status!] ?? status}</span>
          </div>

          <dl style={moneyGrid}>
            <div>
              <dt style={dt}>Monto del encargo</dt>
              <dd style={dd}>{formatUsd(view.totalAmountUSDInCents)}</dd>
            </div>
            <div>
              <dt style={dt}>Si se libera: freelancer</dt>
              <dd style={dd}>{formatUsd(view.freelancerPayoutUSDInCents)}</dd>
            </div>
            <div>
              <dt style={dt}>Si se libera: plataforma</dt>
              <dd style={dd}>{formatUsd(view.platformFeeUSDInCents)}</dd>
            </div>
          </dl>
        </section>
      ) : !error ? (
        <p style={{ color: 'var(--text-secondary)' }}>Cargando…</p>
      ) : null}

      <section style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        {pending && isBuyer && view?.sellerConfirmed && view.interactRedirectUri ? (
          <div style={{ ...panel, width: '100%', background: 'rgba(34, 197, 94, 0.08)', borderColor: 'rgba(34, 197, 94, 0.35)' }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem' }}>Autoriza el pago en la Test Wallet</h3>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.5 }}>
              El emprendedor ya aceptó. Para mover fondos reales (p. ej. EGG) desde tu billetera a custodia, abre Interledger
              Test Wallet y confirma el grant. Al volver, el saldo de la testnet bajará.
            </p>
            <a className="btn btn-primary" href={view.interactRedirectUri}>
              Abrir autorización Open Payments
            </a>
          </div>
        ) : null}
        {pending && isBuyer && !view?.sellerConfirmed ? (
          <div style={{ ...panel, width: '100%', background: 'rgba(245, 158, 11, 0.08)', borderColor: 'rgba(245, 158, 11, 0.35)' }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem' }}>Tu solicitud fue enviada</h3>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.5 }}>
              El emprendedor tiene <strong style={{ color: 'var(--status-pending)' }}>24 horas</strong> para aceptar.
              Hasta entonces el dinero <strong>no se envía</strong> al escrow. Puedes arrepentirte y cancelar.
            </p>
            {view?.sellerConfirmationDeadlineAt ? (
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
                Límite:{' '}
                {new Date(view.sellerConfirmationDeadlineAt).toLocaleString('es', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </p>
            ) : null}
            <button type="button" className="btn btn-secondary" disabled={busy} onClick={() => void cancelAsBuyer()}>
              {busy ? 'Cancelando…' : 'Arrepentirme · cancelar solicitud'}
            </button>
          </div>
        ) : null}

        {pending && isSeller && view?.sellerConfirmed ? (
          <div style={{ ...panel, width: '100%' }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem' }}>Esperando fondeo del contratador</h3>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.5 }}>
              Ya aceptaste. El contratador debe autorizar el pago en la Test Wallet para que los fondos entren a custodia.
            </p>
          </div>
        ) : null}

        {pending && isSeller && !view?.sellerConfirmed ? (
          <div style={{ ...panel, width: '100%' }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem' }}>Nueva solicitud de trabajo</h3>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.5 }}>
              Si aceptas, el pago del contratador entra a custodia al instante y queda vinculado a este encargo. De lo
              contrario se realizara la devolución del dinero.
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button type="button" className="btn btn-primary" disabled={busy} onClick={() => void acceptAsSeller()}>
                {busy ? 'Procesando…' : 'Aceptar y recibir custodia'}
              </button>
              <button type="button" className="btn btn-secondary" disabled={busy} onClick={() => void rejectAsSeller()}>
                Rechazar
              </button>
            </div>
          </div>
        ) : null}

        {activeCustody ? (
          <>
            <p style={{ margin: 0, width: '100%', color: 'var(--status-verified)', fontSize: 14 }}>
              Fondos en escrow. Las partes ya están vinculadas. Usa el espacio de trabajo para chat, anexos y el
              contador de entrega.
            </p>
            <Link href={`/orders/${taskId}/workspace`} className="btn btn-primary">
              Abrir espacio de trabajo
            </Link>
          </>
        ) : null}

        {cancelled ? (
          <p style={{ margin: 0, width: '100%', color: 'var(--text-secondary)', fontSize: 14 }}>
            Esta solicitud se cerró sin enviar dinero (cancelación, rechazo o vencimiento de las 24 h sin respuesta del
            emprendedor).
          </p>
        ) : null}

        {terminal && !cancelled ? (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link href={`/orders/${taskId}/deliverables`} className="btn btn-secondary">
              Ver entregables
            </Link>
            <Link href="/activity" className="btn btn-primary">
              Ir a actividad
            </Link>
          </div>
        ) : null}

        {cancelled ? (
          <Link href="/marketplace" className="btn btn-primary">
            Ir al marketplace
          </Link>
        ) : null}
      </section>
    </div>
  );
}

const stepper: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 12,
  listStyle: 'none',
  margin: 0,
  padding: 0,
};

function stepItem(active: boolean): CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 13,
    color: active ? 'var(--text-primary)' : 'var(--text-muted)',
  };
}

function stepDot(active: boolean): CSSProperties {
  return {
    width: 28,
    height: 28,
    borderRadius: '50%',
    display: 'grid',
    placeItems: 'center',
    fontSize: 12,
    fontWeight: 700,
    background: active ? 'var(--brand-blue)' : 'var(--surface)',
    border: `1px solid ${active ? 'var(--brand-blue)' : 'var(--border)'}`,
    color: active ? '#fff' : 'var(--text-muted)',
  };
}

const panel: CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: 14,
  padding: 20,
  background: 'var(--surface)',
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
};

const moneyGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
  gap: 16,
  margin: 0,
};

const dt: CSSProperties = { margin: 0, fontSize: 12, color: 'var(--text-muted)' };
const dd: CSSProperties = { margin: '4px 0 0', fontSize: '1.25rem', fontWeight: 700 };

function badge(status: EscrowFundingView['lifecycleStatus']): CSSProperties {
  const tone =
    status === 'ESCROW_LOCKED' || status === 'COMPLETED'
      ? { bg: 'var(--status-verified-bg)', fg: 'var(--status-verified)' }
      : status === 'CANCELLED'
        ? { bg: 'var(--status-failed-bg)', fg: 'var(--status-failed)' }
        : { bg: 'var(--status-pending-bg)', fg: 'var(--status-pending)' };
  return {
    fontSize: 12,
    fontWeight: 600,
    padding: '4px 10px',
    borderRadius: 999,
    background: tone.bg,
    color: tone.fg,
  };
}

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
