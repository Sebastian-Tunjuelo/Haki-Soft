'use client';

import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  SellerActivityItemSchema,
  SellerWorkRequestEventSchema,
  type SellerActivityItem,
} from '@taskstream/shared-schemas';
import { api } from '@/src/lib/api-client';
import { MeridiaPrismLogo } from '@/src/components/brand/meridia-prism-logo';


const DISMISS_KEY = 'ts-work-req-dismissed';

function readDismissed(): Set<string> {
  try {
    const raw = sessionStorage.getItem(DISMISS_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? new Set(parsed.filter((x) => typeof x === 'string')) : new Set();
  } catch {
    return new Set();
  }
}

function writeDismissed(ids: Set<string>) {
  try {
    sessionStorage.setItem(DISMISS_KEY, JSON.stringify([...ids]));
  } catch {
    /* private mode */
  }
}

function formatRemaining(deadlineIso: string, nowMs: number): string {
  const ms = Math.max(0, new Date(deadlineIso).getTime() - nowMs);
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h} h ${String(m).padStart(2, '0')} min ${String(s).padStart(2, '0')} s`;
  if (m > 0) return `${m} min ${String(s).padStart(2, '0')} s`;
  return `${s} s`;
}

/**
 * Popup forzado para el emprendedor: nueva solicitud de trabajo.
 */
export function WorkRequestAlert() {
  const router = useRouter();
  const pathname = usePathname();
  const [sessionOk, setSessionOk] = useState(false);
  const [queue, setQueue] = useState<SellerActivityItem[]>([]);
  const [open, setOpen] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const dismissedRef = useRef<Set<string>>(new Set());

  const current = queue[0] ?? null;

  const enqueue = useCallback((item: SellerActivityItem) => {
    if (item.sellerConfirmed || item.lifecycleStatus !== 'PENDING_ESCROW_FUNDING') return;
    if (dismissedRef.current.has(item.taskId)) return;
    setQueue((prev) => {
      if (prev.some((row) => row.taskId === item.taskId)) return prev;
      return [...prev, item];
    });
    setOpen(true);
  }, []);

  const pullPending = useCallback(async () => {
    const result = await api('/api/v1/orders/activity');
    if (result.status !== 200 || !Array.isArray(result.body)) return;
    for (const row of result.body) {
      const parsed = SellerActivityItemSchema.safeParse(row);
      if (parsed.success) enqueue(parsed.data);
    }
  }, [enqueue]);

  useEffect(() => {
    dismissedRef.current = readDismissed();
    let cancelled = false;
    fetch('/api/v1/auth/session', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data: { user?: { id?: string } }) => {
        if (cancelled) return;
        setSessionOk(Boolean(data?.user?.id));
      })
      .catch(() => {
        if (!cancelled) setSessionOk(false);
      });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  useEffect(() => {
    if (!sessionOk) return;

    void pullPending();

    const poll = setInterval(() => {
      void pullPending();
    }, 12_000);

    let source: EventSource | null = null;
    try {
      source = new EventSource('/api/v1/orders/activity/stream');
      source.onmessage = (event) => {
        try {
          const raw = JSON.parse(event.data as string) as unknown;
          if (raw && typeof raw === 'object' && 'type' in raw && (raw as { type: string }).type === 'ping') {
            return;
          }
          const parsed = SellerWorkRequestEventSchema.safeParse(raw);
          if (parsed.success) enqueue(parsed.data.item);
          else {
            const itemOnly = SellerActivityItemSchema.safeParse(
              raw && typeof raw === 'object' && 'item' in raw ? (raw as { item: unknown }).item : raw,
            );
            if (itemOnly.success) enqueue(itemOnly.data);
          }
        } catch {
          /* ignore malformed */
        }
      };
    } catch {
      /* EventSource no disponible → solo poll */
    }

    return () => {
      clearInterval(poll);
      source?.close();
    };
  }, [sessionOk, pullPending, enqueue]);

  useEffect(() => {
    if (queue.length > 0) setOpen(true);
  }, [queue.length]);

  useEffect(() => {
    if (!open || !current) return;
    const tick = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(tick);
  }, [open, current?.taskId]);

  function dismissLater() {
    if (!current) return;
    dismissedRef.current.add(current.taskId);
    writeDismissed(dismissedRef.current);
    setQueue((prev) => prev.filter((row) => row.taskId !== current.taskId));
    setOpen(false);
  }

  function viewRequest() {
    if (!current) return;
    const taskId = current.taskId;
    dismissedRef.current.add(taskId);
    writeDismissed(dismissedRef.current);
    setQueue((prev) => prev.filter((row) => row.taskId !== taskId));
    setOpen(false);
    router.push(`/orders/${taskId}/escrow`);
  }

  if (!open || !current) return null;

  const buyer = current.buyerDisplayName ?? 'Un contratador';
  const brief = current.projectBrief?.trim() || 'Ver el detalle de la solicitud para conocer el alcance.';
  const remaining = formatRemaining(current.sellerConfirmationDeadlineAt, nowMs);
  const expired = new Date(current.sellerConfirmationDeadlineAt).getTime() <= nowMs;

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="work-req-title" style={overlay}>
      <div className="card" style={modal}>
        <p className="ts-eyebrow" style={{ marginBottom: 10 }}>
          <MeridiaPrismLogo size={18} />
          <span>MERIDIA · NUEVA SOLICITUD DE TRABAJO (24H)</span>
        </p>
        <h2
          id="work-req-title"
          className="kinetic-heading"
          style={{ margin: '4px 0 0', fontFamily: 'var(--font-display)', fontSize: '1.3rem', lineHeight: 1.35 }}
        >
          {buyer} está interesado en tu publicación «{current.title}»
        </h2>
        <p style={{ margin: '12px 0 0', color: 'var(--text-secondary)', lineHeight: 1.55, fontSize: 14 }}>
          Y desea realizar: <strong style={{ color: 'var(--text-primary)' }}>{brief}</strong>
        </p>
        <div
          className="meridia-user-stat"
          style={{
            marginTop: 14,
            border: '1px solid rgba(var(--volt-rgb), 0.4)',
            background: 'rgba(var(--volt-rgb), 0.1)',
          }}
        >
          <p className="tabular-num" style={{ margin: 0, fontSize: 13, color: 'var(--volt)', fontWeight: 700, lineHeight: 1.45 }}>
            {expired
              ? 'La ventana de 24 h venció. Se avisará al contratador de que no estás interesado.'
              : `Tienes aproximadamente ${remaining} para aceptar el servicio; de lo contrario se le avisará al usuario que no estás interesado.`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 22, flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-amber" onClick={viewRequest}>
            <span>Ver solicitud y custodia</span>
          </button>
          <button type="button" className="btn btn-outline" onClick={dismissLater}>
            <span>Más tarde</span>
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

