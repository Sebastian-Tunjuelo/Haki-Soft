'use client';

import { useState, type CSSProperties } from 'react';
import Link from 'next/link';

async function api(path: string, init?: RequestInit): Promise<{ status: number; body: unknown }> {
  const res = await fetch(path, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  });
  const text = await res.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { status: res.status, body };
}

export function NegotiationsHarness() {
  const [publicationId, setPublicationId] = useState('');
  const [proposalId, setProposalId] = useState('');
  const [gigId, setGigId] = useState('');
  const [budget, setBudget] = useState('15000');
  const [days, setDays] = useState('4');
  const [log, setLog] = useState<string>('Listo. Usa IDs de marketplace (publicación / gig / propuesta).');
  const [busy, setBusy] = useState(false);

  function show(status: number, body: unknown) {
    setLog(`${status}\n${JSON.stringify(body, null, 2)}`);
  }

  async function run(action: () => Promise<void>) {
    setBusy(true);
    try {
      await action();
    } catch {
      setLog('API_UNREACHABLE');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ maxWidth: 880, margin: '0 auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Link href="/marketplace" style={{ color: 'var(--brand-blue)' }}>
        ← Marketplace
      </Link>
      <h1 style={{ margin: 0 }}>Harness SPEC-05 — Negociación</h1>
      <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
        Backend mínimo: postular, bandeja, Camino 1 (aceptar), Camino 2 (cerrar) y contratar Gig fijo.
        Requiere dos cuentas con wallet verificada (Buyer + Freelancer).
      </p>

      <section style={{ display: 'grid', gap: 10 }}>
        <h2 style={{ margin: 0, fontSize: '1.1rem' }}>IDs</h2>
        <input placeholder="publicationId" value={publicationId} onChange={(e) => setPublicationId(e.target.value)} style={field} />
        <input placeholder="proposalId" value={proposalId} onChange={(e) => setProposalId(e.target.value)} style={field} />
        <input placeholder="gigId" value={gigId} onChange={(e) => setGigId(e.target.value)} style={field} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <input placeholder="budget cents" value={budget} onChange={(e) => setBudget(e.target.value)} style={field} />
          <input placeholder="days 1-7" value={days} onChange={(e) => setDays(e.target.value)} style={field} />
        </div>
      </section>

      <section style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <button
          type="button"
          className="btn btn-primary"
          disabled={busy || !publicationId}
          onClick={() =>
            void run(async () => {
              const result = await api('/api/v1/negotiations/proposals', {
                method: 'POST',
                headers: { 'Idempotency-Key': crypto.randomUUID() },
                body: JSON.stringify({
                  publicationId,
                  proposedBudgetUSDInCents: Number(budget),
                  proposedDeliveryDays: Number(days),
                  coverMessage: 'Oferta de prueba desde harness SPEC-05 (mín. 15 chars).',
                }),
              });
              if (result.status === 201 && result.body && typeof result.body === 'object' && 'proposalId' in result.body) {
                setProposalId(String((result.body as { proposalId: string }).proposalId));
              }
              show(result.status, result.body);
            })
          }
        >
          Postular (Freelancer)
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          disabled={busy || !publicationId}
          onClick={() =>
            void run(async () => {
              const result = await api(`/api/v1/negotiations/publications/${publicationId}/proposals`);
              show(result.status, result.body);
            })
          }
        >
          Bandeja Buyer
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          disabled={busy || !proposalId}
          onClick={() =>
            void run(async () => {
              const result = await api(`/api/v1/negotiations/proposals/${proposalId}`);
              show(result.status, result.body);
            })
          }
        >
          Ver hilo
        </button>
        <button
          type="button"
          className="btn btn-primary"
          disabled={busy || !proposalId}
          onClick={() =>
            void run(async () => {
              const result = await api(`/api/v1/negotiations/proposals/${proposalId}/accept`, {
                method: 'POST',
                headers: { 'Idempotency-Key': crypto.randomUUID() },
                body: JSON.stringify({
                  proposalId,
                  expectedAmountUSDInCents: Number(budget),
                  expectedDeliveryDays: Number(days),
                  buyerAssumesDoubleFxConversion: true,
                }),
              });
              show(result.status, result.body);
            })
          }
        >
          Camino 1 — Aceptar
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          disabled={busy || !proposalId}
          onClick={() =>
            void run(async () => {
              const result = await api(`/api/v1/negotiations/proposals/${proposalId}/close`, {
                method: 'POST',
                body: JSON.stringify({
                  proposalId,
                  closedReason: 'No hay acuerdo en alcance (harness Camino 2)',
                }),
              });
              show(result.status, result.body);
            })
          }
        >
          Camino 2 — Cerrar
        </button>
        <button
          type="button"
          className="btn btn-primary"
          disabled={busy || !gigId}
          onClick={() =>
            void run(async () => {
              const result = await api(`/api/v1/negotiations/gigs/${gigId}/hire`, {
                method: 'POST',
                headers: { 'Idempotency-Key': crypto.randomUUID() },
                body: JSON.stringify({
                  gigId,
                  expectedPriceUSDInCents: Number(budget),
                  projectBrief: 'Brief de prueba para contratar Gig fijo desde harness SPEC-05.',
                  buyerAssumesDoubleFxConversion: true,
                }),
              });
              show(result.status, result.body);
            })
          }
        >
          Contratar Gig fijo
        </button>
      </section>

      <pre
        style={{
          margin: 0,
          padding: 16,
          borderRadius: 12,
          background: 'rgba(15,23,42,0.85)',
          color: '#e2e8f0',
          overflow: 'auto',
          fontSize: 13,
          minHeight: 220,
        }}
      >
        {log}
      </pre>
    </div>
  );
}

const field: CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: 8,
  padding: '8px 10px',
  background: 'transparent',
  color: 'var(--text-primary)',
};
