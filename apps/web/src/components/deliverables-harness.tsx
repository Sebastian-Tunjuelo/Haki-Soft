'use client';

import { useCallback, useEffect, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import {
  DeliverablePreviewViewSchema,
  OrderClockViewSchema,
  type DeliverablePreviewView,
  type OrderClockView,
} from '@taskstream/shared-schemas';
import { api, humanError } from '@/src/lib/api-client';
import { formatCountdown } from '@/src/lib/format-countdown';
import { AiAdvisorPanel } from '@/src/components/ai-advisor-panel';

/**
 * Harness SPEC-07 + SPEC-08 + SPEC-09 beta: Seller sube; Buyer revisa (IA + aceptar / auditar / reembolsar).
 */
export function DeliverablesHarness({ taskId }: { taskId: string }) {
  const [items, setItems] = useState<DeliverablePreviewView[]>([]);
  const [clock, setClock] = useState<OrderClockView | null>(null);
  const [viewerRole, setViewerRole] = useState<'buyer' | 'seller' | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [revisionNotes, setRevisionNotes] = useState('');
  const [disputeReason, setDisputeReason] = useState('');
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [previewModal, setPreviewModal] = useState<{
    url: string;
    fileName: string;
    revisionNumber: number;
  } | null>(null);

  const load = useCallback(async () => {
    try {
      const [listResult, clockResult] = await Promise.all([
        api(`/api/v1/orders/${taskId}/deliverables`),
        api(`/api/v1/orders/${taskId}/clock`),
      ]);
      if (listResult.status !== 200) {
        setError(humanError(listResult.status, listResult.body));
        setItems([]);
        return;
      }
      const parsed = Array.isArray(listResult.body)
        ? listResult.body
            .map((row) => DeliverablePreviewViewSchema.safeParse(row))
            .filter((r) => r.success)
            .map((r) => r.data)
        : [];
      setItems(parsed);

      if (clockResult.status === 200) {
        const c = OrderClockViewSchema.safeParse(clockResult.body);
        if (c.success) {
          setClock(c.data);
          setViewerRole(c.data.viewerRole);
        }
      }
      setError(null);
    } catch {
      setError(humanError(0, { code: 'API_UNREACHABLE' }));
      setItems([]);
    }
  }, [taskId]);

  useEffect(() => {
    void load();
    const poll = setInterval(() => void load(), 2_500);
    const onReady = (ev: Event) => {
      const detail = (ev as CustomEvent<{ taskId?: string }>).detail;
      if (!detail?.taskId || detail.taskId === taskId) void load();
    };
    window.addEventListener('ts:delivery-ready', onReady);
    window.addEventListener('ts:work-accepted', onReady);
    return () => {
      clearInterval(poll);
      window.removeEventListener('ts:delivery-ready', onReady);
      window.removeEventListener('ts:work-accepted', onReady);
    };
  }, [load, taskId]);

  useEffect(() => {
    const tick = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    if (!previewModal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPreviewModal(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [previewModal]);

  const isSeller = viewerRole === 'seller';
  const isBuyer = viewerRole === 'buyer';
  const inReview = clock?.lifecycleStatus === 'IN_REVIEW';
  const latest = items.length > 0 ? items[items.length - 1] : null;
  const canSellerUpload =
    isSeller &&
    (clock?.lifecycleStatus === 'ESCROW_LOCKED' ||
      clock?.lifecycleStatus === 'ESCROW_EXTENDED' ||
      clock?.lifecycleStatus === 'REVISION_REQUESTED');

  async function submitDelivery() {
    if (!file || !isSeller) return;
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      const ext = file.name.includes('.') ? `.${file.name.split('.').pop()!.toLowerCase()}` : '.bin';
      const begun = await api(`/api/v1/orders/${taskId}/deliverables/uploads`, {
        method: 'POST',
        body: JSON.stringify({
          revisionNumber: items.length,
          fileName: file.name,
          mimeType: file.type || 'application/octet-stream',
          fileExtension: ext,
        }),
      });
      if (begun.status !== 201) {
        setError(humanError(begun.status, begun.body));
        return;
      }
      const deliverableId =
        begun.body && typeof begun.body === 'object' && 'deliverableId' in begun.body
          ? String((begun.body as { deliverableId: string }).deliverableId)
          : '';
      const uploadUrl =
        begun.body && typeof begun.body === 'object' && 'uploadUrl' in begun.body
          ? String((begun.body as { uploadUrl: string }).uploadUrl)
          : '';

      const form = new FormData();
      form.append('file', file);
      const uploaded = await fetch(uploadUrl, { method: 'POST', body: form });
      if (!uploaded.ok) {
        const payload = await uploaded.json().catch(() => ({}));
        setError(humanError(uploaded.status, payload));
        return;
      }

      const completed = await api(`/api/v1/orders/${taskId}/deliverables/${deliverableId}/complete`, {
        method: 'POST',
      });
      if (completed.status !== 202 && completed.status !== 200) {
        setError(humanError(completed.status, completed.body));
        return;
      }
      const uploadedName = file.name;
      const revisionNumber = items.length;
      setOk('Entrega completada. El contratador tiene 72 h (3 días) para revisar.');
      setFile(null);
      await load();
      if (deliverableId) {
        setPreviewModal({
          url: `/api/v1/orders/${taskId}/deliverables/${deliverableId}/preview/content`,
          fileName: uploadedName,
          revisionNumber,
        });
      }
    } catch {
      setError(humanError(0, { code: 'API_UNREACHABLE' }));
    } finally {
      setBusy(false);
    }
  }

  async function tryOriginal(deliverableId: string) {
    if (!isBuyer) return;
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      const result = await api(`/api/v1/orders/${taskId}/deliverables/${deliverableId}/original`);
      if (result.status === 403) {
        setError(
          'El archivo original sigue protegido. Cuando aceptes la entrega («¡Es lo que quería!»), podrás descargarlo sin marca de agua.',
        );
        return;
      }
      if (result.status !== 200) {
        setError(humanError(result.status, result.body));
        return;
      }
      const url =
        result.body && typeof result.body === 'object' && 'downloadUrl' in result.body
          ? String((result.body as { downloadUrl: string }).downloadUrl)
          : '';
      setOk('Original disponible.');
      window.open(url, '_blank');
    } finally {
      setBusy(false);
    }
  }

  async function acceptDelivery() {
    if (!latest || !isBuyer) return;
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      const result = await api(`/api/v1/orders/${taskId}/deliverables/${latest.deliverableId}/accept`, {
        method: 'POST',
      });
      if (result.status !== 200) {
        setError(humanError(result.status, result.body));
        return;
      }
      setOk('¡Aceptado! Fondos liberados al emprendedor (96 %) y original desbloqueado.');
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function requestRevision() {
    if (!latest || !isBuyer) return;
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      const result = await api(`/api/v1/orders/${taskId}/revisions`, {
        method: 'POST',
        body: JSON.stringify({ deliverableId: latest.deliverableId, notes: revisionNotes }),
      });
      if (result.status !== 200) {
        setError(humanError(result.status, result.body));
        return;
      }
      setOk('Corrección solicitada. El emprendedor puede volver a subir.');
      setRevisionNotes('');
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function openDispute() {
    if (!isBuyer) return;
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      const result = await api(`/api/v1/orders/${taskId}/disputes`, {
        method: 'POST',
        body: JSON.stringify({ reason: disputeReason }),
      });
      if (result.status !== 201) {
        setError(humanError(result.status, result.body));
        return;
      }
      setOk('Reembolso solicitado. Un administrador revisará el caso.');
      setDisputeReason('');
      await load();
    } finally {
      setBusy(false);
    }
  }

  const isCompleted = clock?.lifecycleStatus === 'COMPLETED';
  const clockLabel =
    clock?.activeClockKind === 'DELIVERY_REVIEW_32H'
      ? 'Revisión Buyer (72 h)'
      : clock?.activeClockKind === 'INITIAL_DELIVERY_7D'
        ? 'Entrega inicial (7 d)'
        : 'Sin reloj activo';

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px 48px', display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        <Link href={`/orders/${taskId}/workspace`} style={{ color: 'var(--brand-blue)', fontSize: 14 }}>
          ← Workspace
        </Link>
        <Link href={`/orders/${taskId}/escrow`} style={{ color: 'var(--brand-blue)', fontSize: 14 }}>
          Custodia
        </Link>
      </div>

      <header style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Entregables</h1>
          <p style={{ margin: '8px 0 0', color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.5 }}>
            {isCompleted
              ? 'Encargo completado. Fondos liberados al emprendedor; el original está disponible.'
              : isSeller
                ? 'Sube el original. Tras completar, el contratador revisa con preview con marca de agua.'
                : isBuyer
                  ? 'Revisa el preview. Acepta, pide corrección (máx. 2) o solicita reembolso para mediación admin.'
                  : 'Cargando rol…'}
          </p>
        </div>
        {!isCompleted ? (
          <div style={timerCard}>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>{clockLabel}</p>
            <p style={{ margin: '4px 0 0', fontSize: '1.15rem', fontWeight: 700, color: 'var(--status-pending)' }}>
              {formatCountdown(clock?.activeDeadlineAt ?? null, nowMs)}
            </p>
            {clock ? (
              <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>
                Correcciones {clock.revisionsUsed}/{clock.maxRevisions} · {clock.lifecycleStatus}
              </p>
            ) : null}
          </div>
        ) : null}
      </header>

      {error ? <p style={bannerError}>{error}</p> : null}
      {ok ? <p style={bannerOk}>{ok}</p> : null}

      {canSellerUpload ? (
        <section style={panel}>
          <h2 style={{ margin: 0, fontSize: '1.05rem' }}>Subir entrega</h2>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,.png,.jpg,.jpeg,.webp,.gif"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            disabled={busy}
          />
          <button
            type="button"
            className="btn btn-primary"
            disabled={busy || !file}
            onClick={() => void submitDelivery()}
          >
            {busy ? 'Procesando…' : 'Subir y completar entrega'}
          </button>
        </section>
      ) : null}

      {!isCompleted && latest && latest.previewStatus === 'READY' ? (
        <AiAdvisorPanel taskId={taskId} deliverableId={latest.deliverableId} />
      ) : null}

      {isBuyer && inReview && latest ? (
        <section style={panel}>
          <h2 style={{ margin: 0, fontSize: '1.05rem' }}>Tu decisión</h2>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-primary" disabled={busy} onClick={() => void acceptDelivery()}>
              ¡Es lo que quería!
            </button>
          </div>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
            Auditar entrega (notas, mín. 10)
            <textarea
              value={revisionNotes}
              onChange={(e) => setRevisionNotes(e.target.value)}
              rows={3}
              disabled={busy}
              style={{ resize: 'vertical', padding: 10, borderRadius: 8, border: '1px solid var(--border)' }}
            />
          </label>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={busy || revisionNotes.trim().length < 10}
            onClick={() => void requestRevision()}
          >
            Auditar entrega
          </button>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
            Reembolsar / mediación (motivo, mín. 10)
            <textarea
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              rows={3}
              disabled={busy}
              style={{ resize: 'vertical', padding: 10, borderRadius: 8, border: '1px solid var(--border)' }}
            />
          </label>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={busy || disputeReason.trim().length < 10}
            onClick={() => void openDispute()}
          >
            Reembolsar
          </button>
        </section>
      ) : null}

      <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h2 style={{ margin: 0, fontSize: '1.05rem' }}>Entregas</h2>
        {items.length === 0 ? (
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Aún no hay entregas.</p>
        ) : (
          items.map((item) => (
            <article key={item.deliverableId} style={panel}>
              <strong>
                Rev. {item.revisionNumber} · {item.fileName}
              </strong>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>
                Preview: {item.previewStatus} · Original: {item.originalAvailable ? 'disponible' : 'bloqueado'}
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={busy || item.previewStatus !== 'READY'}
                  onClick={() =>
                    setPreviewModal({
                      url: item.previewUrl,
                      fileName: item.fileName,
                      revisionNumber: item.revisionNumber,
                    })
                  }
                >
                  Ver preview
                </button>
                {isBuyer ? (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={busy}
                    onClick={() => void tryOriginal(item.deliverableId)}
                  >
                    Pedir original
                  </button>
                ) : null}
              </div>
            </article>
          ))
        )}
      </section>

      {previewModal ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Preview: ${previewModal.fileName}`}
          style={modalOverlay}
          onClick={() => setPreviewModal(null)}
        >
          <div style={modalPanel} onClick={(e) => e.stopPropagation()}>
            <div style={modalHeader}>
              <div>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>Protected Preview</p>
                <h2 style={{ margin: '4px 0 0', fontSize: '1.15rem' }}>
                  Rev. {previewModal.revisionNumber} · {previewModal.fileName}
                </h2>
              </div>
              <button type="button" className="btn btn-secondary" onClick={() => setPreviewModal(null)}>
                Cerrar
              </button>
            </div>
            <div style={modalBody}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewModal.url}
                alt={`Preview con marca de agua: ${previewModal.fileName}`}
                style={modalImage}
              />
            </div>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.45 }}>
              Preview con marca de agua. El original se desbloquea al aceptar la entrega.
            </p>
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

const timerCard: CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: 12,
  padding: '12px 16px',
  background: 'var(--surface)',
  minWidth: 160,
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
  width: 'min(1100px, 96vw)',
  maxHeight: '92vh',
  overflow: 'auto',
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 16,
  padding: 18,
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
  boxShadow: '0 24px 64px rgba(0,0,0,0.45)',
};

const modalHeader: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 12,
};

const modalBody: CSSProperties = {
  width: '100%',
  minHeight: 'min(70vh, 640px)',
  background: '#0b1220',
  borderRadius: 12,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
};

const modalImage: CSSProperties = {
  width: '100%',
  maxHeight: 'min(78vh, 720px)',
  objectFit: 'contain',
  display: 'block',
};
