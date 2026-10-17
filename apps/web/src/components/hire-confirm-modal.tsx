'use client';

import type { CSSProperties } from 'react';
import { formatUsd } from '@/src/lib/api-client';

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
      <div style={modal}>
        <h2 id="hire-confirm-title" style={{ margin: 0, fontSize: '1.25rem' }}>
          ¿Seguro que quieres contratar a {personName}?
        </h2>
        <p style={{ margin: '12px 0 0', color: 'var(--text-secondary)', lineHeight: 1.5, fontSize: 14 }}>
          Vas a enviar una solicitud por <strong style={{ color: 'var(--text-primary)' }}>{formatUsd(amountCents)}</strong>.
          El dinero <strong style={{ color: 'var(--text-primary)' }}>no se mueve todavía</strong>: queda en espera hasta
          que {personName} acepte (máx. 24 h). Si rechaza, tú cancelas o pasan las 24 h, el pago no se envía al escrow.
        </p>
        <div style={{ display: 'flex', gap: 10, marginTop: 22, flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-primary" disabled={busy} onClick={onConfirm}>
            {busy ? 'Enviando…' : 'Confirmar solicitud'}
          </button>
          <button type="button" className="btn btn-secondary" disabled={busy} onClick={onCancel}>
            Denegar
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
  background: 'rgba(2, 6, 23, 0.72)',
  display: 'grid',
  placeItems: 'center',
  padding: 20,
};

const modal: CSSProperties = {
  width: '100%',
  maxWidth: 460,
  borderRadius: 16,
  border: '1px solid var(--border)',
  background: 'var(--surface-elevated)',
  padding: 24,
  boxShadow: '0 24px 60px rgba(0,0,0,0.45)',
};
