'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Briefcase,
  CheckCircle2,
  Compass,
  FolderKanban,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  XCircle,
} from 'lucide-react';
import { HireConfirmModal } from '@/src/components/hire-confirm-modal';
import { api, formatUsd, humanError } from '@/src/lib/api-client';
import { PageReveal } from '@/src/components/page-reveal';
import { MeridiaPrismLogo, PrismActionIcon } from '@/src/components/brand/meridia-prism-logo';

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

const PEOPLE_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=160&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=160&q=80',
] as const;

export function NegotiationsWorkspace() {
  const router = useRouter();
  const [tab, setTab] = useState<'gigs' | 'publications'>('gigs');
  const [gigs, setGigs] = useState<GigCard[]>([]);
  const [publications, setPublications] = useState<Publication[]>([]);
  const [selectedGig, setSelectedGig] = useState<GigCard | null>(null);
  const [selectedPub, setSelectedPub] = useState<Publication | null>(null);
  const [inbox, setInbox] = useState<InboxItem[]>([]);
  const [hireConfirmOpen, setHireConfirmOpen] = useState(false);
  const [brief, setBrief] = useState(
    'Necesito este servicio con el alcance descrito en el Gig y entrega dentro del plazo acordado.',
  );
  const [offerUsd, setOfferUsd] = useState('');
  const [offerDays, setOfferDays] = useState('5');
  const [cover, setCover] = useState(
    'Hola, puedo entregar este trabajo con calidad profesional y dentro del plazo propuesto.',
  );
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
    <PageReveal className="ts-page">
      <HireConfirmModal
        open={hireConfirmOpen && Boolean(selectedGig)}
        personName={selectedGig?.seller.displayName ?? 'esta persona'}
        amountCents={selectedGig?.priceUSDInCents ?? 0}
        busy={busy}
        onConfirm={() => void hireGig()}
        onCancel={() => setHireConfirmOpen(false)}
      />

      {/* Navegación superior */}
      <div className="ts-reveal" style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link href="/marketplace" className="btn btn-outline btn-sm">
            <ArrowLeft size={15} />
            <span>Marketplace</span>
          </Link>
          <Link href="/activity" className="btn btn-outline btn-sm">
            <Sparkles size={15} />
            <span>Bandeja de Actividad</span>
          </Link>
        </div>
        <button type="button" className="btn btn-outline btn-sm" disabled={busy} onClick={() => void refreshLists()}>
          <RefreshCw size={14} />
          <span>Actualizar catálogo</span>
        </button>
      </div>

      {/* Cabecera MERIDIA */}
      <header className="ts-page__header ts-reveal">
        <p className="ts-eyebrow">
          <MeridiaPrismLogo size={20} />
          <span>MERIDIA · SALA DE NEGOCIACIONES Y CONTRATACIÓN DIRECTA</span>
        </p>
        <h1 className="ts-title kinetic-heading">
          Contratar servicios y <span className="ts-title__accent">negociar propuestas</span>
        </h1>
        <p className="ts-lead">
          Contrata un servicio a precio fijo o envía tu propuesta competitiva (<code>≤ presupuesto inicial</code>) sobre
          cualquier actividad abierta. Al cerrar el acuerdo, el flujo continúa directamente a la bóveda de custodia
          Open Payments.
        </p>
      </header>

      {/* Selector de pestaña con botones MERIDIA */}
      <div className="ts-reveal" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <button
          type="button"
          className={tab === 'gigs' ? 'btn btn-amber' : 'btn btn-outline'}
          onClick={() => setTab('gigs')}
        >
          <Briefcase size={16} />
          <span>Contratar Servicio a Precio Fijo ({gigs.length})</span>
        </button>
        <button
          type="button"
          className={tab === 'publications' ? 'btn btn-emerald' : 'btn btn-outline'}
          onClick={() => setTab('publications')}
        >
          <FolderKanban size={16} />
          <span>Actividades y Propuestas ({publications.length})</span>
        </button>
      </div>

      {error ? (
        <div className="alert alert-error ts-reveal" role="alert">
          <XCircle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
          <div>{error}</div>
        </div>
      ) : null}

      {ok ? (
        <div className="alert alert-success ts-reveal" role="status">
          <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: 2 }} />
          <div>{ok}</div>
        </div>
      ) : null}

      {tab === 'gigs' ? (
        <section className="ts-reveal" style={{ display: 'grid', gap: 18 }}>
          <div style={{ display: 'grid', gap: 12 }}>
            {gigs.map((gig, idx) => {
              const isSelected = selectedGig?.gigId === gig.gigId;
              return (
                <button
                  key={gig.gigId}
                  type="button"
                  onClick={() => {
                    setSelectedGig(gig);
                    setError(null);
                    setOk(null);
                  }}
                  className="card"
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '18px 22px',
                    borderRadius: 22,
                    border: isSelected ? '1.5px solid var(--volt)' : '1px solid var(--border-hi)',
                    background: isSelected
                      ? 'linear-gradient(135deg, rgba(var(--volt-rgb), 0.14), transparent), var(--surface)'
                      : 'var(--surface)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 16,
                    flexWrap: 'wrap',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <img
                      src={PEOPLE_AVATARS[idx % PEOPLE_AVATARS.length]}
                      alt={gig.seller.displayName}
                      className="ld-person-photo"
                      style={{ width: 46, height: 46, borderRadius: 14 }}
                    />
                    <div>
                      <strong
                        className="kinetic-heading"
                        style={{ fontFamily: 'var(--font-display)', fontSize: '1.08rem', display: 'block', color: 'var(--text-primary)' }}
                      >
                        {gig.title}
                      </strong>
                      <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                        Freelancer: <strong style={{ color: 'var(--text-primary)' }}>{gig.seller.displayName}</strong> · Plazo máx. 7 días
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span
                      className="tabular-num"
                      style={{ fontFamily: 'var(--font-mono)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--volt)' }}
                    >
                      {formatUsd(gig.priceUSDInCents)}
                    </span>
                    <span className={isSelected ? 'badge badge-verified' : 'badge badge-buyer'}>
                      {isSelected ? 'Seleccionado' : 'Elegir'}
                    </span>
                  </div>
                </button>
              );
            })}
            {gigs.length === 0 ? (
              <div className="card" style={{ padding: 24, borderRadius: 22, color: 'var(--text-secondary)' }}>
                No hay Gigs activos registrados en este momento. Explora el{' '}
                <Link href="/marketplace" style={{ color: 'var(--tide-ink)', fontWeight: 700 }}>
                  Marketplace
                </Link>{' '}
                para publicar un nuevo servicio.
              </div>
            ) : null}
          </div>

          {selectedGig ? (
            <div
              className="card"
              style={{
                padding: '26px 28px',
                borderRadius: 26,
                border: '1px solid var(--border-hi)',
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <h2 className="kinetic-heading" style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 700 }}>
                  Contratar: {selectedGig.title}
                </h2>
                <span className="badge badge-verified tabular-num" style={{ fontFamily: 'var(--font-mono)' }}>
                  {formatUsd(selectedGig.priceUSDInCents)} · 100% Custodia
                </span>
              </div>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 14 }}>
                Precio fijo <strong style={{ color: 'var(--text-primary)' }}>{formatUsd(selectedGig.priceUSDInCents)}</strong>. El dinero solo entra a
                escrow si <strong style={{ color: 'var(--text-primary)' }}>{selectedGig.seller.displayName}</strong> acepta dentro de las 24 horas.
              </p>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13.5, fontWeight: 600, color: 'var(--text-secondary)' }}>
                Brief del proyecto (mín. 15 caracteres)
                <textarea
                  value={brief}
                  onChange={(e) => setBrief(e.target.value)}
                  rows={4}
                  className="input"
                  minLength={15}
                />
              </label>
              <label style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 13, color: 'var(--text-secondary)' }}>
                <input type="checkbox" defaultChecked disabled />
                <span>
                  Asumo la doble conversión de divisa (FX) cuando el pago sí se envíe a la bóveda de custodia Open Payments.
                </span>
              </label>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12.5, color: 'var(--tide-ink)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <ShieldCheck size={15} /> Liquidación 96% Freelancer / 4% Meridia
                </span>
                <button
                  type="button"
                  className="btn btn-amber"
                  disabled={busy || brief.trim().length < 15}
                  onClick={() => setHireConfirmOpen(true)}
                >
                  <PrismActionIcon size={17} />
                  <span>Pagar / Contratar servicio</span>
                </button>
              </div>
            </div>
          ) : null}
        </section>
      ) : (
        <section className="ts-reveal" style={{ display: 'grid', gap: 18 }}>
          <div style={{ display: 'grid', gap: 12 }}>
            {publications.map((pub, idx) => {
              const isSelected = selectedPub?.publicationId === pub.publicationId;
              return (
                <button
                  key={pub.publicationId}
                  type="button"
                  onClick={() => {
                    setSelectedPub(pub);
                    setOfferUsd((pub.initialBudgetUSDInCents / 100).toFixed(2));
                    setError(null);
                    setOk(null);
                    void loadInbox(pub.publicationId);
                  }}
                  className="card"
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '18px 22px',
                    borderRadius: 22,
                    border: isSelected ? '1.5px solid var(--tide)' : '1px solid var(--border-hi)',
                    background: isSelected
                      ? 'linear-gradient(135deg, rgba(var(--tide-rgb), 0.14), transparent), var(--surface)'
                      : 'var(--surface)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 16,
                    flexWrap: 'wrap',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <img
                      src={PEOPLE_AVATARS[(idx + 1) % PEOPLE_AVATARS.length]}
                      alt={pub.title}
                      className="ld-person-photo"
                      style={{ width: 46, height: 46, borderRadius: 14 }}
                    />
                    <div>
                      <strong
                        className="kinetic-heading"
                        style={{ fontFamily: 'var(--font-display)', fontSize: '1.08rem', display: 'block', color: 'var(--text-primary)' }}
                      >
                        {pub.title}
                      </strong>
                      <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                        {pub.activeProposalCount} ofertas activas · Estado: <strong>{pub.status}</strong>
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span
                      className="tabular-num"
                      style={{ fontFamily: 'var(--font-mono)', fontSize: '1.2rem', fontWeight: 700, color: 'var(--tide-ink)' }}
                    >
                      Tope {formatUsd(pub.initialBudgetUSDInCents)}
                    </span>
                    <span className={isSelected ? 'badge badge-verified' : 'badge badge-buyer'}>
                      {isSelected ? 'Abierta' : 'Negociar'}
                    </span>
                  </div>
                </button>
              );
            })}
            {publications.length === 0 ? (
              <div className="card" style={{ padding: 24, borderRadius: 22, color: 'var(--text-secondary)' }}>
                No hay publicaciones abiertas en este momento. Puedes publicar una actividad desde el{' '}
                <Link href="/marketplace" style={{ color: 'var(--tide-ink)', fontWeight: 700 }}>
                  Marketplace
                </Link>
                .
              </div>
            ) : null}
          </div>

          {selectedPub ? (
            <div className="inicio-jpg-split" style={{ marginBottom: 0 }}>
              {/* Columna Izquierda: Enviar Oferta Competitiva */}
              <div
                className="card"
                style={{
                  padding: '24px 26px',
                  borderRadius: 24,
                  border: '1px solid var(--border-hi)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Compass size={18} style={{ color: 'var(--tide)' }} />
                  <h2 className="kinetic-heading" style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 700 }}>
                    Enviar propuesta competitiva
                  </h2>
                </div>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>
                  El presupuesto propuesto debe ser menor o igual al tope del Cliente (
                  <strong className="tabular-num" style={{ fontFamily: 'var(--font-mono)', color: 'var(--volt)' }}>
                    {formatUsd(selectedPub.initialBudgetUSDInCents)}
                  </strong>
                  ) y el plazo entre 1 y 7 días.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Tu Presupuesto (USD)
                    <input
                      type="number"
                      min={1}
                      step={0.01}
                      value={offerUsd}
                      onChange={(e) => setOfferUsd(e.target.value)}
                      className="input"
                    />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Días de entrega (1–7)
                    <input
                      type="number"
                      min={1}
                      max={7}
                      value={offerDays}
                      onChange={(e) => setOfferDays(e.target.value)}
                      className="input"
                    />
                  </label>
                </div>

                <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Mensaje de propuesta y alcance
                  <textarea value={cover} onChange={(e) => setCover(e.target.value)} rows={3} className="input" />
                </label>

                <button type="button" className="btn btn-emerald" disabled={busy} onClick={() => void submitOffer()}>
                  <Send size={15} />
                  <span>{busy ? 'Enviando propuesta…' : 'Postular al trabajo'}</span>
                </button>
              </div>

              {/* Columna Derecha: Bandeja de Propuestas Recibidas */}
              <div
                className="card"
                style={{
                  padding: '24px 26px',
                  borderRadius: 24,
                  border: '1px solid var(--border-hi)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <h2 className="kinetic-heading" style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 700 }}>
                    Propuestas recibidas ({inbox.length})
                  </h2>
                  <span className="badge badge-buyer">Evaluación del Cliente</span>
                </div>

                {inbox.length === 0 ? (
                  <div className="meridia-user-stat">
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 13.5 }}>
                      Todavía no hay ofertas registradas para esta publicación.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {inbox.map((item, idx) => (
                      <article key={item.proposalId} className="meridia-user-stat">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <img
                              src={PEOPLE_AVATARS[idx % PEOPLE_AVATARS.length]}
                              alt={item.freelancerDisplayName ?? 'Freelancer'}
                              style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }}
                            />
                            <div>
                              <strong className="tabular-num" style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', color: 'var(--volt)' }}>
                                {formatUsd(item.proposedBudgetUSDInCents)}
                              </strong>
                              <span style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)' }}>
                                {item.proposedDeliveryDays} días · {item.freelancerDisplayName ?? 'Talento Verificado'}
                              </span>
                            </div>
                          </div>
                          <span
                            className={`badge ${
                              item.status === 'AGREED_PATH_1'
                                ? 'badge-verified'
                                : item.status === 'DISCREPANCY_CLOSED_PATH_2'
                                  ? 'badge-failed'
                                  : 'badge-pending'
                            }`}
                          >
                            {item.status === 'IN_NEGOTIATION'
                              ? 'En negociación'
                              : item.status === 'AGREED_PATH_1'
                                ? 'Acordada'
                                : item.status === 'DISCREPANCY_CLOSED_PATH_2'
                                  ? 'Cerrada sin acuerdo'
                                  : item.status}
                          </span>
                        </div>

                        {item.coverMessage ? (
                          <p style={{ margin: '6px 0 0', fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                            {item.coverMessage}
                          </p>
                        ) : null}

                        {item.status === 'IN_NEGOTIATION' ? (
                          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 6 }}>
                            <button
                              type="button"
                              className="btn btn-amber btn-sm"
                              disabled={busy}
                              onClick={() => void acceptOffer(item)}
                            >
                              <CheckCircle2 size={14} />
                              <span>Aceptar y custodiar 100%</span>
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline btn-sm"
                              disabled={busy}
                              onClick={() => void closeOffer(item)}
                            >
                              <XCircle size={14} />
                              <span>Cerrar sin acuerdo</span>
                            </button>
                          </div>
                        ) : null}
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </section>
      )}
    </PageReveal>
  );
}

