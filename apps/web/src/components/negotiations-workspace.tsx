'use client';

import { useCallback, useEffect, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { HireConfirmModal } from '@/src/components/hire-confirm-modal';
import { api, formatUsd, humanError } from '@/src/lib/api-client';

type GigCard = {
  gigId: string;
  title: string;
  priceUSDInCents: number;
  seller: { displayName: string };
};

type Publication = {
  publicationId: string;
  title: string;
  status: string;
  initialBudgetUSDInCents: number;
  activeProposalCount: number;
};

type InboxItem = {
  proposalId: string;
  publicationId: string;
  proposedBudgetUSDInCents: number;
  proposedDeliveryDays: number;
  status: string;
  coverMessage?: string;
  freelancerDisplayName?: string;
};

export function NegotiationsWorkspace() {
  const router = useRouter();
  const [tab, setTab] = useState<'gigs' | 'publications'>('gigs');
  const [gigs, setGigs] = useState<GigCard[]>([]);
  const [publications, setPublications] = useState<Publication[]>([]);
  const [selectedGig, setSelectedGig] = useState<GigCard | null>(null);
  const [selectedPub, setSelectedPub] = useState<Publication | null>(null);
  const [inbox, setInbox] = useState<InboxItem[]>([]);
  const [hireConfirmOpen, setHireConfirmOpen] = useState(false);
  const [brief, setBrief] = useState('Necesito este servicio con el alcance descrito en el Gig y entrega dentro del plazo acordado.');
  const [offerUsd, setOfferUsd] = useState('');
  const [offerDays, setOfferDays] = useState('5');
  const [cover, setCover] = useState('Hola, puedo entregar este trabajo con calidad profesional y dentro del plazo propuesto.');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const refreshLists = useCallback(async () => {
    const [gigList, pubList] = await Promise.all([
      api('/api/v1/marketplace/gigs'),
      api('/api/v1/marketplace/publications'),
    ]);
    if (gigList.status === 200 && gigList.body && typeof gigList.body === 'object') {
      setGigs(((gigList.body as { items?: GigCard[] }).items ?? []) as GigCard[]);
    }
    if (pubList.status === 200 && pubList.body && typeof pubList.body === 'object') {
      setPublications(((pubList.body as { items?: Publication[] }).items ?? []) as Publication[]);
    }
  }, []);

  useEffect(() => {
    void refreshLists();
  }, [refreshLists]);

  async function loadInbox(publicationId: string) {
    const result = await api(`/api/v1/negotiations/publications/${publicationId}/proposals`);
    if (result.status !== 200) {
      setError(humanError(result.status, result.body));
      setInbox([]);
      return;
    }
    const items = Array.isArray(result.body)
      ? (result.body as InboxItem[])
      : ((result.body as { items?: InboxItem[] })?.items ?? []);
    setInbox(items);
  }

  async function hireGig() {
    if (!selectedGig) return;
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      const result = await api(`/api/v1/negotiations/gigs/${selectedGig.gigId}/hire`, {
        method: 'POST',
        headers: { 'Idempotency-Key': crypto.randomUUID() },
        body: JSON.stringify({
          gigId: selectedGig.gigId,
          expectedPriceUSDInCents: selectedGig.priceUSDInCents,
          projectBrief: brief.trim(),
          buyerAssumesDoubleFxConversion: true,
        }),
      });
      if (result.status !== 201 && result.status !== 200) {
        setError(humanError(result.status, result.body));
        return;
      }
      const taskId =
        result.body &&
        typeof result.body === 'object' &&
        'taskOrder' in result.body &&
        (result.body as { taskOrder?: { taskId?: string } }).taskOrder?.taskId;
      if (!taskId) {
        setError('La orden se creó pero no pudimos abrir el checkout.');
        return;
      }
      setHireConfirmOpen(false);
      setOk('Solicitud enviada. El dinero no se mueve hasta que el emprendedor acepte (máx. 24 h).');
      router.push(`/orders/${taskId}/escrow`);
    } catch {
      setError(humanError(0, { code: 'API_UNREACHABLE' }));
    } finally {
      setBusy(false);
    }
  }

  async function submitOffer() {
    if (!selectedPub) return;
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      const cents = Math.round(Number(offerUsd) * 100);
      const result = await api('/api/v1/negotiations/proposals', {
        method: 'POST',
        headers: { 'Idempotency-Key': crypto.randomUUID() },
        body: JSON.stringify({
          publicationId: selectedPub.publicationId,
          proposedBudgetUSDInCents: cents,
          proposedDeliveryDays: Number(offerDays),
          coverMessage: cover.trim(),
        }),
      });
      if (result.status !== 201 && result.status !== 200) {
        setError(humanError(result.status, result.body));
        return;
      }
      setOk('Oferta enviada. El comprador la verá en su bandeja.');
      await loadInbox(selectedPub.publicationId);
      await refreshLists();
    } catch {
      setError(humanError(0, { code: 'API_UNREACHABLE' }));
    } finally {
      setBusy(false);
    }
  }

  async function acceptOffer(item: InboxItem) {
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      const result = await api(`/api/v1/negotiations/proposals/${item.proposalId}/accept`, {
        method: 'POST',
        headers: { 'Idempotency-Key': crypto.randomUUID() },
        body: JSON.stringify({
          proposalId: item.proposalId,
          expectedAmountUSDInCents: item.proposedBudgetUSDInCents,
          expectedDeliveryDays: item.proposedDeliveryDays,
          buyerAssumesDoubleFxConversion: true,
        }),
      });
      if (result.status !== 201 && result.status !== 200) {
        setError(humanError(result.status, result.body));
        return;
      }
      const taskId =
        result.body &&
        typeof result.body === 'object' &&
        'taskOrder' in result.body &&
        (result.body as { taskOrder?: { taskId?: string } }).taskOrder?.taskId;
      if (taskId) {
        setOk('Acuerdo cerrado. Abriendo custodia…');
        router.push(`/orders/${taskId}/escrow`);
        return;
      }
      setOk('Acuerdo cerrado. Continúa en el checkout de escrow.');
    } catch {
      setError(humanError(0, { code: 'API_UNREACHABLE' }));
    } finally {
      setBusy(false);
    }
  }

  async function closeOffer(item: InboxItem) {
    setBusy(true);
    setError(null);
    try {
      const result = await api(`/api/v1/negotiations/proposals/${item.proposalId}/close`, {
        method: 'POST',
        body: JSON.stringify({
          proposalId: item.proposalId,
          closedReason: 'No hay acuerdo en alcance o presupuesto.',
        }),
      });
      if (result.status !== 200 && result.status !== 201) {
        setError(humanError(result.status, result.body));
        return;
      }
      setOk('Oferta cerrada. La publicación sigue abierta a otras propuestas.');
      if (selectedPub) await loadInbox(selectedPub.publicationId);
    } catch {
      setError(humanError(0, { code: 'API_UNREACHABLE' }));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ maxWidth: 880, margin: '0 auto', padding: '24px 16px 48px', display: 'flex', flexDirection: 'column', gap: 22 }}>
      <HireConfirmModal
        open={hireConfirmOpen && Boolean(selectedGig)}
        personName={selectedGig?.seller.displayName ?? 'esta persona'}
        amountCents={selectedGig?.priceUSDInCents ?? 0}
        busy={busy}
        onConfirm={() => void hireGig()}
        onCancel={() => setHireConfirmOpen(false)}
      />
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <Link href="/marketplace" style={{ color: 'var(--brand-blue)', fontSize: 14 }}>
          ← Marketplace
        </Link>
        <Link href="/activity" style={{ color: 'var(--brand-blue)', fontSize: 14 }}>
          Actividad (freelancer)
        </Link>
      </div>

      <header>
        <h1 style={{ margin: 0, fontSize: '1.65rem' }}>Contratar y negociar</h1>
        <p style={{ margin: '8px 0 0', color: 'var(--text-secondary)' }}>
          Contrata un Gig a precio fijo o gestiona ofertas sobre una publicación. Al acordar, pasas al depósito en
          custodia.
        </p>
      </header>

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          type="button"
          className={tab === 'gigs' ? 'btn btn-primary' : 'btn btn-secondary'}
          onClick={() => setTab('gigs')}
        >
          Contratar Gig
        </button>
        <button
          type="button"
          className={tab === 'publications' ? 'btn btn-primary' : 'btn btn-secondary'}
          onClick={() => setTab('publications')}
        >
          Publicaciones y ofertas
        </button>
      </div>

      {error ? <p style={bannerError}>{error}</p> : null}
      {ok ? <p style={bannerOk}>{ok}</p> : null}

      {tab === 'gigs' ? (
        <section style={{ display: 'grid', gap: 16 }}>
          <ul style={list}>
            {gigs.map((gig) => (
              <li key={gig.gigId}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedGig(gig);
                    setError(null);
                    setOk(null);
                  }}
                  style={listBtn(selectedGig?.gigId === gig.gigId)}
                >
                  <strong>{gig.title}</strong>
                  <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                    {formatUsd(gig.priceUSDInCents)} · {gig.seller.displayName}
                  </span>
                </button>
              </li>
            ))}
            {gigs.length === 0 ? <li style={{ color: 'var(--text-secondary)' }}>No hay Gigs activos.</li> : null}
          </ul>

          {selectedGig ? (
            <div style={panel}>
              <h2 style={{ margin: 0, fontSize: '1.1rem' }}>{selectedGig.title}</h2>
              <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                Precio fijo {formatUsd(selectedGig.priceUSDInCents)}. El dinero solo entra a escrow si{' '}
                {selectedGig.seller.displayName} acepta (máx. 24 h).
              </p>
              <label style={label}>
                Brief del proyecto
                <textarea
                  value={brief}
                  onChange={(e) => setBrief(e.target.value)}
                  rows={4}
                  style={textarea}
                  minLength={15}
                />
              </label>
              <label style={checkLabel}>
                <input type="checkbox" defaultChecked disabled />
                Asumo la doble conversión de divisa (FX) cuando el pago sí se envíe al escrow.
              </label>
              <button
                type="button"
                className="btn btn-primary"
                disabled={busy || brief.trim().length < 15}
                onClick={() => setHireConfirmOpen(true)}
              >
                Pagar / Contratar
              </button>
            </div>
          ) : null}
        </section>
      ) : (
        <section style={{ display: 'grid', gap: 16 }}>
          <ul style={list}>
            {publications.map((pub) => (
              <li key={pub.publicationId}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPub(pub);
                    setOfferUsd((pub.initialBudgetUSDInCents / 100).toFixed(2));
                    setError(null);
                    setOk(null);
                    void loadInbox(pub.publicationId);
                  }}
                  style={listBtn(selectedPub?.publicationId === pub.publicationId)}
                >
                  <strong>{pub.title}</strong>
                  <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                    Tope {formatUsd(pub.initialBudgetUSDInCents)} · {pub.activeProposalCount} ofertas · {pub.status}
                  </span>
                </button>
              </li>
            ))}
            {publications.length === 0 ? (
              <li style={{ color: 'var(--text-secondary)' }}>No hay publicaciones abiertas.</li>
            ) : null}
          </ul>

          {selectedPub ? (
            <>
              <div style={panel}>
                <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Enviar oferta (Freelancer)</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <label style={label}>
                    Presupuesto (USD)
                    <input
                      type="number"
                      min={1}
                      step={0.01}
                      value={offerUsd}
                      onChange={(e) => setOfferUsd(e.target.value)}
                      style={input}
                    />
                  </label>
                  <label style={label}>
                    Días de entrega
                    <input
                      type="number"
                      min={1}
                      max={7}
                      value={offerDays}
                      onChange={(e) => setOfferDays(e.target.value)}
                      style={input}
                    />
                  </label>
                </div>
                <label style={label}>
                  Mensaje de cobertura
                  <textarea value={cover} onChange={(e) => setCover(e.target.value)} rows={3} style={textarea} />
                </label>
                <button type="button" className="btn btn-primary" disabled={busy} onClick={() => void submitOffer()}>
                  {busy ? 'Enviando…' : 'Postular'}
                </button>
              </div>

              <div style={panel}>
                <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Bandeja del comprador</h2>
                {inbox.length === 0 ? (
                  <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Sin ofertas todavía.</p>
                ) : (
                  <ul style={{ ...list, gap: 12 }}>
                    {inbox.map((item) => (
                      <li key={item.proposalId} style={{ ...panel, padding: 14 }}>
                        <strong>{formatUsd(item.proposedBudgetUSDInCents)}</strong>
                        <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                          {item.proposedDeliveryDays} días ·{' '}
                          {item.status === 'IN_NEGOTIATION'
                            ? 'En negociación'
                            : item.status === 'AGREED_PATH_1'
                              ? 'Acordada'
                              : item.status === 'DISCREPANCY_CLOSED_PATH_2'
                                ? 'Cerrada sin acuerdo'
                                : item.status}
                          {item.freelancerDisplayName ? ` · ${item.freelancerDisplayName}` : ''}
                        </span>
                        {item.coverMessage ? (
                          <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)' }}>{item.coverMessage}</p>
                        ) : null}
                        {item.status === 'IN_NEGOTIATION' ? (
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              className="btn btn-primary"
                              disabled={busy}
                              onClick={() => void acceptOffer(item)}
                            >
                              Aceptar y custodiar
                            </button>
                            <button
                              type="button"
                              className="btn btn-secondary"
                              disabled={busy}
                              onClick={() => void closeOffer(item)}
                            >
                              Cerrar sin acuerdo
                            </button>
                          </div>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          ) : null}
        </section>
      )}
    </div>
  );
}

const list: CSSProperties = { display: 'grid', gap: 8, padding: 0, margin: 0, listStyle: 'none' };

function listBtn(selected: boolean): CSSProperties {
  return {
    width: '100%',
    textAlign: 'left',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    padding: '12px 14px',
    borderRadius: 12,
    border: `1px solid ${selected ? 'var(--brand-blue)' : 'var(--border)'}`,
    background: selected ? 'rgba(59,130,246,0.08)' : 'var(--surface)',
    color: 'inherit',
    cursor: 'pointer',
  };
}

const panel: CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: 14,
  padding: 18,
  background: 'var(--surface)',
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
};

const label: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: 'var(--text-secondary)' };
const checkLabel: CSSProperties = { display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 13, color: 'var(--text-secondary)' };
const input: CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: 8,
  padding: '8px 10px',
  background: 'transparent',
  color: 'var(--text-primary)',
};
const textarea: CSSProperties = { ...input, resize: 'vertical', fontFamily: 'inherit' };

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
