'use client';

import type { CSSProperties } from 'react';
import { CheckCircle2, ShieldCheck, XCircle } from 'lucide-react';
import { formatUsd } from '@/src/lib/api-client';
import { MeridiaPrismLogo } from '@/src/components/brand/meridia-prism-logo';

export function HireConfirmModal({
  open,
  personName,
  amountCents,
  busy,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  personName: string;
  amountCents: number;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="hire-confirm-title" style={overlay}>
      <div className="card" style={modal}>
        <p className="ts-eyebrow" style={{ marginBottom: 10 }}>
          <MeridiaPrismLogo size={18} />
          <span>MERIDIA · CONFIRMACIÓN DE CONTRATACIÓN</span>
        </p>
        <h2
          id="hire-confirm-title"
          className="kinetic-heading"
          style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.35rem', fontWeight: 700 }}
        >
          ¿Seguro que quieres contratar a {personName}?
        </h2>
        <p style={{ margin: '12px 0 0', color: 'var(--text-secondary)', lineHeight: 1.55, fontSize: 14 }}>
          Vas a enviar una solicitud por{' '}
          <strong className="tabular-num" style={{ color: 'var(--volt)', fontFamily: 'var(--font-mono)' }}>
            {formatUsd(amountCents)}
          </strong>
          . El dinero <strong style={{ color: 'var(--text-primary)' }}>no se mueve todavía</strong>: queda en espera
          hasta que <strong style={{ color: 'var(--text-primary)' }}>{personName}</strong> acepte (máx. 24 h). Si
          rechaza, tú cancelas o vencen las 24 h, el pago nunca se envía al escrow.
        </p>

        <div className="meridia-user-stat" style={{ marginTop: 14, padding: '10px 14px' }}>
          <span style={{ fontSize: 12, color: 'var(--tide-ink)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <ShieldCheck size={15} /> Al aceptar: 100% Custodia GNAP · 96% Freelancer / 4% Meridia
          </span>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 22, flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-amber" disabled={busy} onClick={onConfirm}>
            <CheckCircle2 size={16} />
            <span>{busy ? 'Enviando…' : 'Confirmar solicitud'}</span>
          </button>
          <button type="button" className="btn btn-outline" disabled={busy} onClick={onCancel}>
            <XCircle size={16} />
            <span>Denegar</span>
          </button>
        </div>
      </div>
    </div>
  );
}

const overlay: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 10000,
  background: 'rgba(6, 10, 18, 0.76)',
  backdropFilter: 'blur(10px)',
  display: 'grid',
  placeItems: 'center',
  padding: 20,
};

const modal: CSSProperties = {
  width: '100%',
  maxWidth: 480,
  borderRadius: 24,
  border: '1px solid var(--border-hi)',
  background: 'var(--surface-solid)',
  padding: 26,
  boxShadow: 'var(--shadow-lg)',
};

