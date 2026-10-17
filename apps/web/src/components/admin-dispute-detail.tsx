'use client';

import { useCallback, useEffect, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import { DisputeCaseDetailSchema, type DisputeCaseDetail } from '@taskstream/shared-schemas';
import { api, formatUsd, humanError } from '@/src/lib/api-client';

export function AdminDisputeDetail({ disputeId }: { disputeId: string }) {
  const [detail, setDetail] = useState<DisputeCaseDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [justification, setJustification] = useState('');
  const [busy, setBusy] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const result = await api(`/api/v1/admin/disputes/${disputeId}`);
      if (result.status !== 200) {
        setError(humanError(result.status, result.body));
        setDetail(null);
        return;
      }
      const parsed = DisputeCaseDetailSchema.safeParse(result.body);
      if (!parsed.success) {
        setError('No pudimos cargar el caso.');
        return;
      }
      setDetail(parsed.data);
      setError(null);
    } catch {
      setError(humanError(0, { code: 'API_UNREACHABLE' }));
      setDetail(null);
    }
  }, [disputeId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function resolve(decision: 'BUYER_FULL_REFUND' | 'FREELANCER_SPLIT_96_4') {
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      const result = await api(`/api/v1/admin/disputes/${disputeId}/resolve`, {
        method: 'POST',
        body: JSON.stringify({ decision, justification }),
      });
      if (result.status !== 200) {
        setError(humanError(result.status, result.body));
        return;
      }
      const parsed = DisputeCaseDetailSchema.safeParse(result.body);
      if (parsed.success) setDetail(parsed.data);
      setOk(
        decision === 'BUYER_FULL_REFUND'
          ? 'Reembolso 100 % al Buyer simulado.'
          : 'Liberación 96/4 al Freelancer simulada.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px 48px', display: 'flex', flexDirection: 'column', gap: 18 }}>
      <Link href="/admin/disputes" style={{ color: 'var(--brand-blue)', fontSize: 14 }}>
        ← Disputas
      </Link>

      <header>
        <h1 style={{ margin: 0, fontSize: '1.5rem' }}>{detail?.title ?? 'Caso'}</h1>
        {detail ? (
          <p style={{ margin: '8px 0 0', color: 'var(--text-secondary)', fontSize: 14 }}>
            {detail.buyerDisplayName} ↔ {detail.sellerDisplayName} · {formatUsd(detail.totalAmountUSDInCents)} ·{' '}
            {detail.status}
          </p>
        ) : null}
      </header>

      {error ? <p style={bannerError}>{error}</p> : null}
      {ok ? <p style={bannerOk}>{ok}</p> : null}

      {detail ? (
        <>
          <section style={panel}>
            <h2 style={{ margin: 0, fontSize: '1.05rem' }}>Motivo de reclamación</h2>
            <p style={{ margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.5, fontSize: 14 }}>{detail.claimReason}</p>
          </section>

          <section style={panel}>
            <h2 style={{ margin: 0, fontSize: '1.05rem' }}>Entregas</h2>
            {detail.deliverables.length === 0 ? (
              <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Sin entregas.</p>
            ) : (
              detail.deliverables.map((d) => (
                <div key={d.deliverableId} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                  <span>
                    Rev. {d.revisionNumber} · {d.fileName}
                  </span>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={d.previewStatus !== 'READY'}
                    onClick={() => setPreviewUrl(d.previewUrl)}
                  >
                    Preview
                  </button>
                </div>
              ))
            )}
          </section>

          <section style={panel}>
            <h2 style={{ margin: 0, fontSize: '1.05rem' }}>Mensajes del workspace</h2>
            {detail.messages.length === 0 ? (
              <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Sin mensajes.</p>
            ) : (
              detail.messages.map((m) => (
                <article key={m.messageId} style={{ fontSize: 13, lineHeight: 1.45 }}>
                  <strong>
                    {m.senderDisplayName} ({m.senderRole})
                  </strong>
                  <p style={{ margin: '4px 0 0', whiteSpace: 'pre-wrap' }}>{m.body}</p>
                </article>
              ))
            )}
          </section>

          {detail.status === 'OPEN' ? (
            <section style={panel}>
              <h2 style={{ margin: 0, fontSize: '1.05rem' }}>Resolución</h2>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
                Justificación (mín. 20 caracteres)
                <textarea
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  rows={4}
                  disabled={busy}
                  style={{ resize: 'vertical', padding: 10, borderRadius: 8, border: '1px solid var(--border)' }}
                />
              </label>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={busy || justification.trim().length < 20}
                  onClick={() => void resolve('BUYER_FULL_REFUND')}
                >
                  Reembolso 100 % Buyer
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={busy || justification.trim().length < 20}
                  onClick={() => void resolve('FREELANCER_SPLIT_96_4')}
                >
                  Liberar 96/4 Freelancer
                </button>
              </div>
            </section>
          ) : (
            <section style={panel}>
              <h2 style={{ margin: 0, fontSize: '1.05rem' }}>Ya resuelto</h2>
              <p style={{ margin: 0, fontSize: 14 }}>
                Decisión: {detail.decision ?? '—'}
              </p>
              <p style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: 14 }}>{detail.justification}</p>
            </section>
          )}
        </>
      ) : null}

      {previewUrl ? (
        <div role="dialog" aria-modal="true" style={modalOverlay} onClick={() => setPreviewUrl(null)}>
          <div style={modalPanel} onClick={(e) => e.stopPropagation()}>
            <button type="button" className="btn btn-secondary" onClick={() => setPreviewUrl(null)}>
              Cerrar
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="Preview entrega" style={{ width: '100%', maxHeight: '70vh', objectFit: 'contain' }} />
          </div>
        </div>
      ) : null}
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
  gap: 12,
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

const modalOverlay: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 80,
  background: 'rgba(2, 6, 23, 0.78)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 16,
};

const modalPanel: CSSProperties = {
  width: 'min(900px, 96vw)',
  maxHeight: '92vh',
  overflow: 'auto',
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 16,
  padding: 18,
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
};
