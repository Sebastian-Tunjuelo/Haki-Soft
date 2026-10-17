'use client';

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Clock,
  FileText,
  MessageSquare,
  Paperclip,
  Send,
  ShieldCheck,
  Sparkles,
  XCircle,
} from 'lucide-react';
import { OrderWorkspaceViewSchema, type OrderWorkspaceView } from '@taskstream/shared-schemas';
import { api, formatUsd, humanError } from '@/src/lib/api-client';
import { PageReveal } from '@/src/components/page-reveal';
import { MeridiaPrismLogo } from '@/src/components/brand/meridia-prism-logo';

function formatCountdown(deadlineIso: string | null, nowMs: number): string {
  if (!deadlineIso) return 'Plazo pendiente de inicio';
  const ms = new Date(deadlineIso).getTime() - nowMs;
  if (ms <= 0) return 'Plazo vencido';
  const totalSec = Math.floor(ms / 1000);
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (d > 0) return `${d}d ${h}h ${m}m ${s}s`;
  return `${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
}

/**
 * Espacio de trabajo de MERIDIA tras aceptar: chat en vivo, anexos, contador determinista de 7 días y contexto de la orden.
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
    <PageReveal className="ts-page">
      {/* Navegación superior */}
      <div className="ts-reveal" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <Link href="/activity" className="btn btn-outline btn-sm">
          <ArrowLeft size={15} />
          <span>Bandeja de Actividad</span>
        </Link>
        <Link href={`/orders/${taskId}/escrow`} className="btn btn-outline btn-sm">
          <ShieldCheck size={15} />
          <span>Estado de Custodia</span>
        </Link>
        <Link href="/marketplace" className="btn btn-outline btn-sm">
          <Sparkles size={15} />
          <span>Marketplace</span>
        </Link>
        <Link href={`/orders/${taskId}/deliverables`} style={{ color: 'var(--brand-blue)', fontSize: 14 }}>
          Entregables
        </Link>
      </div>

      {/* Cabecera con Reloj Determinista de 7 Días */}
      <header
        className="ts-reveal card"
        style={{
          padding: '24px 28px',
          borderRadius: 26,
          border: '1px solid var(--border-hi)',
          display: 'flex',
          justifyContent: 'space-between',
          gap: 20,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <div style={{ flex: 1, minWidth: 260 }}>
          <p className="ts-eyebrow" style={{ marginBottom: 8 }}>
            <MeridiaPrismLogo size={20} />
            <span>MERIDIA · ESPACIO DE TRABAJO VINCULADO EN CUSTODIA</span>
          </p>
          <h1 className="ts-title kinetic-heading" style={{ fontSize: 'clamp(1.6rem, 3vw, 2.35rem)' }}>
            {view?.title ?? 'Encargo en ejecución'}
          </h1>
          {view ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginTop: 10 }}>
              <div className="ld-person-badge">
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=140&q=80"
                  alt={view.buyerDisplayName}
                  className="ld-person-photo"
                  style={{ width: 30, height: 30 }}
                />
                <div className="ld-person-info">
                  <strong>{view.buyerDisplayName}</strong>
                  <span>Cliente</span>
                </div>
              </div>
              <span style={{ color: 'var(--text-muted)', fontWeight: 700 }}>↔</span>
              <div className="ld-person-badge">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=140&q=80"
                  alt={view.sellerDisplayName}
                  className="ld-person-photo"
                  style={{ width: 30, height: 30 }}
                />
                <div className="ld-person-info">
                  <strong>{view.sellerDisplayName}</strong>
                  <span>Freelancer</span>
                </div>
              </div>
              <span className="badge badge-verified tabular-num" style={{ fontFamily: 'var(--font-mono)' }}>
                {formatUsd(view.totalAmountUSDInCents)} en Custodia 100%
              </span>
            </div>
          ) : null}
        </div>

        {/* Reloj de Entrega 7 Días */}
        <div
          className="meridia-user-stat"
          style={{
            minWidth: 220,
            border: '1px solid rgba(var(--volt-rgb), 0.45)',
            background: 'linear-gradient(135deg, rgba(var(--volt-rgb), 0.14), rgba(var(--tide-rgb), 0.08))',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Reloj de Entrega ({view?.initialDeliveryDays ?? 7} días)
            </span>
            <Clock size={16} style={{ color: 'var(--volt)' }} />
          </div>
          <strong
            className="tabular-num kinetic-heading"
            style={{ fontFamily: 'var(--font-mono)', fontSize: '1.55rem', color: 'var(--volt)' }}
          >
            {formatCountdown(view?.deliveryDeadlineAt ?? null, nowMs)}
          </strong>
          <span style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
            1 extensión única de +7d disponible bajo acuerdo
          </span>
        </div>
      </header>

      {error ? (
        <div className="alert alert-error ts-reveal" role="alert">
          <XCircle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
          <div>{error}</div>
        </div>
      ) : null}

      {/* Layout Split 2 Columnas: Contexto de la Solicitud (Izquierda) + Chat en Vivo y Entregas (Derecha) */}
      <div className="ts-reveal inicio-jpg-split" style={{ marginBottom: 0 }}>
        {/* Columna Izquierda: Contexto y Alcance */}
        <section className="card" style={{ padding: '24px 26px', borderRadius: 24, border: '1px solid var(--border-hi)', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={18} style={{ color: 'var(--tide)' }} />
            <h2 className="kinetic-heading" style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.18rem', fontWeight: 700 }}>
              Contexto de la solicitud
            </h2>
          </div>

          {view ? (
            <>
              <div className="meridia-user-stat">
                <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                  Brief del Cliente
                </span>
                <p style={{ margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.55, fontSize: 13.8, color: 'var(--text-primary)' }}>
                  {view.projectBrief ?? view.scopeDescription}
                </p>
              </div>

              <details className="ld-details" style={{ marginTop: 4 }}>
                <summary>Ver alcance técnico completo</summary>
                <p style={{ whiteSpace: 'pre-wrap' }}>{view.scopeDescription}</p>
              </details>

              <div className="meridia-user-stat" style={{ marginTop: 'auto' }}>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--tide-ink)', textTransform: 'uppercase' }}>
                  Garantía Open Payments
                </span>
                <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Los archivos anexados pasan por el Visor Protegido y el Consejero IA (Imagen y Texto) antes de liberar
                  el <strong>96% al Freelancer</strong> y <strong>4% al protocolo MERIDIA</strong>.
                </p>
              </div>
            </>
          ) : (
            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Sincronizando contexto del encargo…</p>
          )}
        </section>

        {/* Columna Derecha: Chat en Vivo + Anexos */}
        <section
          className="card"
          style={{
            padding: '24px 26px',
            borderRadius: 24,
            border: '1px solid var(--border-hi)',
            minHeight: 460,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <MessageSquare size={18} style={{ color: 'var(--volt)' }} />
              <h2 className="kinetic-heading" style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.18rem', fontWeight: 700 }}>
                Chat en vivo y entrega de anexos
              </h2>
            </div>
            <span className="badge badge-verified">Canal Cifrado Activo</span>
          </div>

          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              maxHeight: 360,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              padding: '8px 4px',
            }}
          >
            {(view?.messages ?? []).map((msg) => {
              const isMine = msg.senderRole === view?.viewerRole;
              return (
                <article
                  key={msg.messageId}
                  style={{
                    maxWidth: '84%',
                    alignSelf: isMine ? 'flex-end' : 'flex-start',
                    borderRadius: 16,
                    padding: '10px 14px',
                    border: isMine ? '1px solid rgba(var(--tide-rgb), 0.45)' : '1px solid var(--border-hi)',
                    background: isMine
                      ? 'linear-gradient(135deg, rgba(var(--tide-rgb), 0.18), rgba(var(--volt-rgb), 0.08))'
                      : 'var(--surface-raised)',
                  }}
                >
                  <p style={{ margin: 0, fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary)' }}>
                    {msg.senderDisplayName} ·{' '}
                    <span className="tabular-num" style={{ fontFamily: 'var(--font-mono)', fontWeight: 500 }}>
                      {new Date(msg.createdAt).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </p>
                  <p style={{ margin: '5px 0 0', whiteSpace: 'pre-wrap', fontSize: 14, color: 'var(--text-primary)' }}>
                    {msg.body}
                  </p>
                  {msg.attachmentFileName ? (
                    <p
                      style={{
                        margin: '8px 0 0',
                        fontSize: 12,
                        fontWeight: 700,
                        color: 'var(--tide-ink)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                      }}
                    >
                      <Paperclip size={13} /> {msg.attachmentFileName}
                    </p>
                  ) : null}
                </article>
              );
            })}
            {(view?.messages.length ?? 0) === 0 ? (
              <div className="meridia-user-stat" style={{ textAlign: 'center', padding: 24 }}>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 14 }}>
                  Aún no hay mensajes en esta orden. Coordina avances, dudas y entregables desde aquí.
                </p>
              </div>
            ) : null}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={(e) => void send(e)} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={3}
              placeholder="Escribe un mensaje o nota de entrega para la contraparte…"
              className="input"
              disabled={busy || view?.lifecycleStatus !== 'ESCROW_LOCKED'}
            />
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <label className="btn btn-outline btn-sm" style={{ cursor: 'pointer', margin: 0 }}>
                <Paperclip size={15} />
                <span>Anexar entregable</span>
                <input
                  ref={fileRef}
                  type="file"
                  hidden
                  onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
                  disabled={busy || view?.lifecycleStatus !== 'ESCROW_LOCKED'}
                />
              </label>
              {fileName ? (
                <span className="badge badge-verified">{fileName}</span>
              ) : (
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Visor Protegido &amp; metadato R2 (SPEC-07)
                </span>
              )}
              <button
                type="submit"
                className="btn btn-amber btn-sm"
                disabled={busy || (!body.trim() && !fileName) || view?.lifecycleStatus !== 'ESCROW_LOCKED'}
                style={{ marginLeft: 'auto' }}
              >
                <Send size={14} />
                <span>{busy ? 'Enviando…' : 'Enviar mensaje'}</span>
              </button>
            </div>
          </form>
        </section>
      </div>
    </PageReveal>
  );
}

