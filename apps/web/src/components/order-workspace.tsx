'use client';

import { useCallback, useEffect, useRef, useState, type CSSProperties, type FormEvent } from 'react';
import Link from 'next/link';
import {
  OrderClockViewSchema,
  OrderWorkspaceViewSchema,
  type OrderClockView,
  type OrderWorkspaceView,
} from '@taskstream/shared-schemas';
import { api, formatUsd, humanError } from '@/src/lib/api-client';
import { formatCountdown } from '@/src/lib/format-countdown';

/**
 * Espacio de trabajo tras aceptar: chat, anexos, contador 7d y contexto de la solicitud.
 */
export function OrderWorkspace({ taskId }: { taskId: string }) {
  const [view, setView] = useState<OrderWorkspaceView | null>(null);
  const [clock, setClock] = useState<OrderClockView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [body, setBody] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const [result, clockResult] = await Promise.all([
      api(`/api/v1/orders/${taskId}/workspace`),
      api(`/api/v1/orders/${taskId}/clock`),
    ]);
    if (result.status !== 200) {
      setError(humanError(result.status, result.body));
      setView(null);
      return;
    }
    const parsed = OrderWorkspaceViewSchema.safeParse(result.body);
    if (!parsed.success) {
      setError('No pudimos cargar el espacio de trabajo.');
      return;
    }
    setView(parsed.data);
    if (clockResult.status === 200) {
      const c = OrderClockViewSchema.safeParse(clockResult.body);
      setClock(c.success ? c.data : null);
    } else {
      setClock(null);
    }
    setError(null);
  }, [taskId]);

  useEffect(() => {
    void load();
    const poll = setInterval(() => void load(), 4000);
    return () => clearInterval(poll);
  }, [load]);

  useEffect(() => {
    const tick = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [view?.messages.length]);

  async function send(e: FormEvent) {
    e.preventDefault();
    const text = body.trim();
    if (!text && !fileName) return;
    setBusy(true);
    setError(null);
    try {
      const result = await api(`/api/v1/orders/${taskId}/workspace/messages`, {
        method: 'POST',
        body: JSON.stringify({
          body: text || `Anexo: ${fileName}`,
          attachmentFileName: fileName ?? undefined,
        }),
      });
      if (result.status !== 200 && result.status !== 201) {
        setError(humanError(result.status, result.body));
        return;
      }
      const parsed = OrderWorkspaceViewSchema.safeParse(result.body);
      if (parsed.success) setView(parsed.data);
      setBody('');
      setFileName(null);
      if (fileRef.current) fileRef.current.value = '';
    } catch {
      setError(humanError(0, { code: 'API_UNREACHABLE' }));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px 48px', display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <Link href="/activity" style={{ color: 'var(--brand-blue)', fontSize: 14 }}>
          ← Actividad
        </Link>
        <Link href={`/orders/${taskId}/escrow`} style={{ color: 'var(--brand-blue)', fontSize: 14 }}>
          Custodia
        </Link>
        <Link href={`/orders/${taskId}/deliverables`} style={{ color: 'var(--brand-blue)', fontSize: 14 }}>
          Entregables
        </Link>
      </div>

      <header style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 13 }}>Espacio de trabajo</p>
          <h1 style={{ margin: '6px 0 0', fontSize: '1.55rem' }}>{view?.title ?? 'Encargo'}</h1>
          {view ? (
            <p style={{ margin: '8px 0 0', color: 'var(--text-secondary)', fontSize: 14 }}>
              {view.buyerDisplayName} ↔ {view.sellerDisplayName} · {formatUsd(view.totalAmountUSDInCents)}
            </p>
          ) : null}
        </div>
        <div style={timerCard}>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>
            {clock?.activeClockKind === 'DELIVERY_REVIEW_32H'
              ? 'Revisión 72h'
              : clock?.activeClockKind === 'INITIAL_DELIVERY_7D'
                ? `Entrega (${view?.initialDeliveryDays ?? 7} días)`
                : clock?.activeClockKind === 'FINAL_CLAIM_WINDOW_30M'
                  ? 'Ventana final 30m'
                  : `Entrega (${view?.initialDeliveryDays ?? 7} días)`}
          </p>
          <p style={{ margin: '4px 0 0', fontSize: '1.2rem', fontWeight: 700, color: 'var(--status-pending)' }}>
            {formatCountdown(
              clock?.activeDeadlineAt ?? view?.deliveryDeadlineAt ?? null,
              nowMs,
            )}
          </p>
        </div>
      </header>

      {error ? <p style={bannerError}>{error}</p> : null}

      <div style={layout}>
        <section style={panel}>
          <h2 style={{ margin: 0, fontSize: '1.05rem' }}>Contexto de la solicitud</h2>
          {view ? (
            <>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>Brief del contratador</p>
              <p style={{ margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.5, fontSize: 14 }}>
                {view.projectBrief ?? view.scopeDescription}
              </p>
              <details>
                <summary style={{ cursor: 'pointer', color: 'var(--brand-blue)', fontSize: 13 }}>
                  Ver alcance completo
                </summary>
                <p style={{ margin: '8px 0 0', whiteSpace: 'pre-wrap', fontSize: 13, color: 'var(--text-secondary)' }}>
                  {view.scopeDescription}
                </p>
              </details>
            </>
          ) : (
            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Cargando…</p>
          )}
        </section>

        <section style={{ ...panel, minHeight: 420, display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ margin: 0, fontSize: '1.05rem' }}>Chat en vivo</h2>
          <div style={chatLog}>
            {(view?.messages ?? []).map((msg) => (
              <article
                key={msg.messageId}
                style={{
                  ...bubble,
                  alignSelf: msg.senderRole === view?.viewerRole ? 'flex-end' : 'flex-start',
                  background:
                    msg.senderRole === view?.viewerRole ? 'rgba(59, 130, 246, 0.18)' : 'var(--surface-elevated)',
                }}
              >
                <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>
                  {msg.senderDisplayName} ·{' '}
                  {new Date(msg.createdAt).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                </p>
                <p style={{ margin: '4px 0 0', whiteSpace: 'pre-wrap', fontSize: 14 }}>{msg.body}</p>
                {msg.attachmentFileName ? (
                  <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--brand-blue)' }}>
                    📎 {msg.attachmentFileName}
                  </p>
                ) : null}
              </article>
            ))}
            {(view?.messages.length ?? 0) === 0 ? (
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 14 }}>
                Aún no hay mensajes. Coordina entregas y dudas aquí.
              </p>
            ) : null}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={(e) => void send(e)} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={3}
              placeholder="Escribe un mensaje…"
              style={textarea}
              disabled={busy || view?.lifecycleStatus !== 'ESCROW_LOCKED'}
            />
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <label className="btn btn-secondary" style={{ cursor: 'pointer', margin: 0 }}>
                Anexar archivo
                <input
                  ref={fileRef}
                  type="file"
                  hidden
                  onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
                  disabled={busy || view?.lifecycleStatus !== 'ESCROW_LOCKED'}
                />
              </label>
              {fileName ? (
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{fileName}</span>
              ) : (
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  (Nombre del anexo; la entrega formal va en Entregables)
                </span>
              )}
              <button
                type="submit"
                className="btn btn-primary"
                disabled={busy || (!body.trim() && !fileName) || view?.lifecycleStatus !== 'ESCROW_LOCKED'}
                style={{ marginLeft: 'auto' }}
              >
                {busy ? 'Enviando…' : 'Enviar'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}

const layout: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: 16,
};

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
  border: '1px solid rgba(245, 158, 11, 0.35)',
  background: 'rgba(245, 158, 11, 0.08)',
  borderRadius: 12,
  padding: '12px 16px',
  minWidth: 160,
};

const chatLog: CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  maxHeight: 360,
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  padding: '4px 2px',
};

const bubble: CSSProperties = {
  maxWidth: '85%',
  borderRadius: 12,
  padding: '8px 12px',
  border: '1px solid var(--border)',
};

const textarea: CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: 10,
  padding: '10px 12px',
  background: 'transparent',
  color: 'var(--text-primary)',
  fontFamily: 'inherit',
  resize: 'vertical',
};

const bannerError: CSSProperties = {
  margin: 0,
  padding: '12px 14px',
  borderRadius: 10,
  background: 'var(--status-failed-bg)',
  color: 'var(--status-failed)',
  fontSize: 14,
};
