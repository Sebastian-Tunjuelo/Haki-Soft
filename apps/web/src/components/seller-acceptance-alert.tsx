'use client';

import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { SellerAcceptanceNoticeSchema, type SellerAcceptanceNotice } from '@taskstream/shared-schemas';
import { api, formatUsd } from '@/src/lib/api-client';

const DISMISS_KEY = 'ts-acceptance-notice-dismissed';

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

/**
 * Aviso emprendedor: el contratador aceptó el trabajo → ventana 30 m antes de liberar 96 %.
 */
export function SellerAcceptanceAlert() {
  const router = useRouter();
  const pathname = usePathname();
  const [sessionOk, setSessionOk] = useState(false);
  const [queue, setQueue] = useState<SellerAcceptanceNotice[]>([]);
  const [open, setOpen] = useState(false);
  const dismissedRef = useRef<Set<string>>(new Set());

  const current = queue[0] ?? null;

  const enqueue = useCallback((item: SellerAcceptanceNotice) => {
    if (dismissedRef.current.has(item.taskId)) return;
    setQueue((prev) => {
      if (prev.some((row) => row.taskId === item.taskId)) return prev;
      return [...prev, item];
    });
    setOpen(true);
  }, []);

  const pullPending = useCallback(async () => {
    const result = await api('/api/v1/me/acceptance-notices');
    if (result.status !== 200 || !Array.isArray(result.body)) return;
    for (const row of result.body) {
      const parsed = SellerAcceptanceNoticeSchema.safeParse(row);
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
    const poll = setInterval(() => void pullPending(), 2_500);
    return () => clearInterval(poll);
  }, [sessionOk, pullPending]);

  useEffect(() => {
    if (queue.length > 0) setOpen(true);
  }, [queue.length]);

  useEffect(() => {
    if (!current) return;
    window.dispatchEvent(
      new CustomEvent('ts:work-accepted', { detail: { taskId: current.taskId } }),
    );
  }, [current]);

  function dismissLater() {
    if (!current) return;
    dismissedRef.current.add(current.taskId);
    writeDismissed(dismissedRef.current);
    void api(`/api/v1/me/acceptance-notices/${current.taskId}`, { method: 'DELETE' });
    setQueue((prev) => prev.filter((row) => row.taskId !== current.taskId));
    setOpen(false);
  }

  function viewOrder() {
    if (!current) return;
    const taskId = current.taskId;
    dismissedRef.current.add(taskId);
    writeDismissed(dismissedRef.current);
    void api(`/api/v1/me/acceptance-notices/${taskId}`, { method: 'DELETE' });
    setQueue((prev) => prev.filter((row) => row.taskId !== taskId));
    setOpen(false);
    router.push(`/orders/${taskId}/deliverables`);
  }

  if (!open || !current) return null;

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="acceptance-notice-title" style={overlay}>
      <div style={modal}>
        <p style={{ margin: 0, fontSize: 12, color: 'var(--brand-blue)', fontWeight: 600 }}>Trabajo aceptado</p>
        <h2 id="acceptance-notice-title" style={{ margin: '8px 0 0', fontSize: '1.25rem', lineHeight: 1.35 }}>
          {current.buyerDisplayName} aceptó tu entrega de «{current.title}»
        </h2>
        <p style={{ margin: '12px 0 0', color: 'var(--text-secondary)', lineHeight: 1.55, fontSize: 14 }}>
          Se liberaron{' '}
          <strong style={{ color: 'var(--text-primary)' }}>{formatUsd(current.sellerPayoutUSDInCents)}</strong> a tu
          cuenta (96 % del encargo).
        </p>
        <div style={{ display: 'flex', gap: 10, marginTop: 22, flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-primary" onClick={viewOrder}>
            Ver entregas
          </button>
          <button type="button" className="btn btn-secondary" onClick={dismissLater}>
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}

const overlay: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 10001,
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
