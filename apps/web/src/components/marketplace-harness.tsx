'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthGateModal } from '@/src/components/auth-gate-modal';
import { WelcomeWalletModal } from '@/src/components/welcome-wallet-modal';

type Category = {
  category: string;
  expectedMediaType: string;
  allowedExtensions: string[];
  aiAuditableModality: 'IMAGE' | 'TEXT' | null;
  activeGigCount: number;
  openPublicationCount: number;
};

type GigCard = {
  gigId: string;
  title: string;
  priceUSDInCents: number;
  category: string;
  aiAuditableModality: 'IMAGE' | 'TEXT' | null;
  seller: {
    displayName: string;
    webMonetizationEnabled: boolean;
    verifiedWalletAddressUrl: string | null;
    targetCurrency: string;
  };
};

type Publication = {
  publicationId: string;
  title: string;
  status: string;
  initialBudgetUSDInCents: number;
  category: string;
  aiAuditableModality: 'IMAGE' | 'TEXT' | null;
  activeProposalCount: number;
};

type PendingAction = 'create-gig' | 'create-publication' | { type: 'cancel'; publicationId: string };

function newIdempotencyKey(): string {
  return crypto.randomUUID();
}

function isUnauthenticated(status: number, body: unknown): boolean {
  if (status !== 401) return false;
  if (body && typeof body === 'object' && 'code' in body && (body as { code: unknown }).code === 'UNAUTHENTICATED') {
    return true;
  }
  return status === 401;
}

function isWalletNotVerified(status: number, body: unknown): boolean {
  return (
    status === 403 &&
    body !== null &&
    typeof body === 'object' &&
    'code' in body &&
    (body as { code: unknown }).code === 'WALLET_NOT_VERIFIED'
  );
}

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

const GIG_BODY = {
  title: 'Diseño de logo profesional',
  description: 'Diseño de identidad visual completa para marca digital.',
  category: 'GRAPHICS_AND_DESIGN',
  expectedMediaType: 'IMAGE_RASTER_VECTOR',
  priceUSDInCents: 15000,
  initialDeliveryDays: 5,
  defaultCriteria: [
    { criterionId: 'c-01', description: 'Entregar mockups en alta resolución', isMandatory: true },
  ],
  allowedExtensions: ['.png', '.webp'],
};

const PUBLICATION_BODY = {
  title: 'Artículo técnico SEO para SaaS',
  description: 'Necesito un artículo técnico de 1500 palabras sobre Open Payments.',
  category: 'TECHNICAL_WRITING_TRANS',
  expectedMediaType: 'DOCUMENT_TEXT',
  initialBudgetUSDInCents: 25000,
  initialDeliveryDays: 7,
  preliminaryCriteria: [
    { criterionId: 'c-01', description: 'Texto original con fuentes citadas', isMandatory: true },
  ],
  allowedExtensions: ['.md', '.docx'],
};

export function MarketplaceHarness() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [gigs, setGigs] = useState<GigCard[]>([]);
  const [publications, setPublications] = useState<Publication[]>([]);
  const [log, setLog] = useState<string>('Listo para probar SPEC-04.');
  const [selectedGig, setSelectedGig] = useState<GigCard | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authReason, setAuthReason] = useState('Necesitas una sesión activa para continuar.');
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [welcomeWalletOpen, setWelcomeWalletOpen] = useState(false);
  const [welcomeName, setWelcomeName] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const [cats, gigList, pubList] = await Promise.all([
      api('/api/v1/marketplace/categories'),
      api('/api/v1/marketplace/gigs'),
      api('/api/v1/marketplace/publications'),
    ]);
    if (cats.status === 200 && Array.isArray(cats.body)) setCategories(cats.body as Category[]);
    if (gigList.status === 200 && gigList.body && typeof gigList.body === 'object') {
      setGigs(((gigList.body as { items?: GigCard[] }).items ?? []) as GigCard[]);
    }
    if (pubList.status === 200 && pubList.body && typeof pubList.body === 'object') {
      setPublications(((pubList.body as { items?: Publication[] }).items ?? []) as Publication[]);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  function requireAuth(reason: string, action: PendingAction): boolean {
    setAuthReason(reason);
    setPendingAction(action);
    setAuthOpen(true);
    setLog(`Sesión requerida → se abre el acceso sobre el marketplace (sin cambiar de página).`);
    return true;
  }

  function openWalletGate(reasonLog: string) {
    setLog(reasonLog);
    setWelcomeWalletOpen(true);
  }

  async function createGig(fromResume = false) {
    const result = await api('/api/v1/marketplace/gigs', {
      method: 'POST',
      headers: { 'Idempotency-Key': newIdempotencyKey() },
      body: JSON.stringify(GIG_BODY),
    });
    if (isUnauthenticated(result.status, result.body)) {
      requireAuth('Inicia sesión o crea una cuenta para publicar un Gig.', 'create-gig');
      return;
    }
    if (isWalletNotVerified(result.status, result.body)) {
      setPendingAction('create-gig');
      openWalletGate('Falta wallet verificada → se abre el paso de vinculación.');
      return;
    }
    setLog(`POST gigs → ${result.status} ${JSON.stringify(result.body)}`);
    if (fromResume) setPendingAction(null);
    if (result.status === 201 && result.body && typeof result.body === 'object' && 'gigId' in result.body) {
      router.push(`/marketplace/gigs/${(result.body as GigCard).gigId}`);
      return;
    }
    await refresh();
  }

  async function createPublication(fromResume = false) {
    const result = await api('/api/v1/marketplace/publications', {
      method: 'POST',
      headers: { 'Idempotency-Key': newIdempotencyKey() },
      body: JSON.stringify(PUBLICATION_BODY),
    });
    if (isUnauthenticated(result.status, result.body)) {
      requireAuth('Inicia sesión o crea una cuenta para publicar una tarea.', 'create-publication');
      return;
    }
    if (isWalletNotVerified(result.status, result.body)) {
      setPendingAction('create-publication');
      openWalletGate('Falta wallet verificada → se abre el paso de vinculación.');
      return;
    }
    setLog(`POST publications → ${result.status} ${JSON.stringify(result.body)}`);
    if (fromResume) setPendingAction(null);
    if (
      result.status === 201 &&
      result.body &&
      typeof result.body === 'object' &&
      'publicationId' in result.body
    ) {
      router.push(`/marketplace/publications/${(result.body as Publication).publicationId}`);
      return;
    }
    await refresh();
  }

  async function cancelPublication(publicationId: string, fromResume = false) {
    const result = await api(`/api/v1/marketplace/publications/${publicationId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ cancelReason: 'Prueba de cancelación SPEC-04' }),
    });
    if (isUnauthenticated(result.status, result.body)) {
      requireAuth('Inicia sesión para cancelar tu publicación.', { type: 'cancel', publicationId });
      return;
    }
    setLog(`POST cancel → ${result.status} ${JSON.stringify(result.body)}`);
    if (fromResume) setPendingAction(null);
    await refresh();
  }

  async function openGig(gigId: string) {
    router.push(`/marketplace/gigs/${gigId}`);
  }

  function openPublication(publicationId: string) {
    router.push(`/marketplace/publications/${publicationId}`);
  }

  async function resumePendingAction() {
    const action = pendingAction;
    if (!action) {
      await refresh();
      return;
    }
    if (action === 'create-gig') {
      await createGig(true);
      return;
    }
    if (action === 'create-publication') {
      await createPublication(true);
      return;
    }
    await cancelPublication(action.publicationId, true);
  }

  async function handleAuthenticated(result: { mode: 'login' | 'register'; displayName?: string }) {
    setAuthOpen(false);
    if (result.mode === 'register') {
      setWelcomeName(result.displayName ?? null);
      setWelcomeWalletOpen(true);
      setLog('Cuenta creada → bienvenida y vínculo de wallet.');
      return;
    }
    setLog('Sesión iniciada. Reintentando la acción pendiente…');
    await resumePendingAction();
  }

  async function handleWalletStepDone() {
    setWelcomeWalletOpen(false);
    setLog('Paso de wallet cerrado. Si ya verificaste, puedes reintentar la acción.');
    await resumePendingAction();
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28, maxWidth: 960 }}>
      <header>
        <p style={{ color: 'var(--brand-blue)', fontSize: 13, margin: '0 0 8px' }}>SPEC-04 · Harness mínimo de prueba</p>
        <h1 style={{ margin: 0, fontSize: '1.75rem' }}>Marketplace (backend)</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>
          UI mínima para validar categorías, Gigs a precio fijo, publicaciones con tope y Web Monetization.
          Sin sesión, las mutaciones abren un panel de acceso sobre esta misma vista.
        </p>
      </header>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        <button type="button" className="btn btn-primary" onClick={() => void createGig()}>
          Crear Gig (Seller)
        </button>
        <button type="button" className="btn btn-secondary" onClick={() => void createPublication()}>
          Crear publicación (Buyer)
        </button>
        <button type="button" className="btn btn-secondary" onClick={() => void refresh()}>
          Refrescar
        </button>
      </div>

      <pre
        style={{
          margin: 0,
          padding: 14,
          background: 'rgba(15,23,42,0.7)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          whiteSpace: 'pre-wrap',
          fontSize: 13,
        }}
      >
        {log}
      </pre>

      <section>
        <h2 style={{ fontSize: '1.1rem' }}>6 categorías</h2>
        <ul style={{ display: 'grid', gap: 8, padding: 0, listStyle: 'none' }}>
          {categories.map((item) => (
            <li
              key={item.category}
              style={{
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: '10px 12px',
                display: 'flex',
                justifyContent: 'space-between',
                gap: 12,
                flexWrap: 'wrap',
              }}
            >
              <span>
                <strong>{item.category}</strong> · {item.expectedMediaType}
              </span>
              <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                IA: {item.aiAuditableModality ?? 'Determinista + humano'} · Gigs {item.activeGigCount} · Pubs{' '}
                {item.openPublicationCount}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 style={{ fontSize: '1.1rem' }}>Gigs activos</h2>
        <ul style={{ display: 'grid', gap: 8, padding: 0, listStyle: 'none' }}>
          {gigs.map((gig) => (
            <li
              key={gig.gigId}
              style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px' }}
            >
              <button
                type="button"
                onClick={() => void openGig(gig.gigId)}
                style={{ background: 'none', border: 0, color: 'inherit', cursor: 'pointer', padding: 0, textAlign: 'left' }}
              >
                <strong>{gig.title}</strong>
              </button>
              <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>
                ${(gig.priceUSDInCents / 100).toFixed(2)} USD · {gig.seller.displayName} · IA:{' '}
                {gig.aiAuditableModality ?? 'n/a'}
              </div>
            </li>
          ))}
          {gigs.length === 0 ? <li style={{ color: 'var(--text-secondary)' }}>Sin gigs aún.</li> : null}
        </ul>
      </section>

      {selectedGig ? (
        <section style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 14 }}>
          <h2 style={{ fontSize: '1.1rem', marginTop: 0 }}>Detalle Gig / Web Monetization</h2>
          <p style={{ margin: '0 0 8px' }}>{selectedGig.title}</p>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>
            WM enabled: {String(selectedGig.seller.webMonetizationEnabled)} · href:{' '}
            {selectedGig.seller.verifiedWalletAddressUrl ?? 'null (sin etiqueta monetization)'}
          </p>
        </section>
      ) : null}

      <section>
        <h2 style={{ fontSize: '1.1rem' }}>Publicaciones abiertas</h2>
        <ul style={{ display: 'grid', gap: 8, padding: 0, listStyle: 'none' }}>
          {publications.map((publication) => (
            <li
              key={publication.publicationId}
              style={{
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: '10px 12px',
                display: 'flex',
                justifyContent: 'space-between',
                gap: 12,
                alignItems: 'center',
                flexWrap: 'wrap',
              }}
            >
              <button
                type="button"
                onClick={() => openPublication(publication.publicationId)}
                style={{
                  background: 'transparent',
                  border: 0,
                  color: 'inherit',
                  textAlign: 'left',
                  cursor: 'pointer',
                  padding: 0,
                  flex: 1,
                }}
              >
                <strong>{publication.title}</strong>
                <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                  ${(publication.initialBudgetUSDInCents / 100).toFixed(2)} tope · {publication.status} · propuestas{' '}
                  {publication.activeProposalCount}
                </div>
              </button>
              {publication.status === 'OPEN_FOR_PROPOSALS' ? (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => void cancelPublication(publication.publicationId)}
                >
                  Cancelar
                </button>
              ) : null}
            </li>
          ))}
          {publications.length === 0 ? (
            <li style={{ color: 'var(--text-secondary)' }}>Sin publicaciones abiertas.</li>
          ) : null}
        </ul>
      </section>

      <AuthGateModal
        open={authOpen}
        reason={authReason}
        onClose={() => {
          setAuthOpen(false);
          setPendingAction(null);
        }}
        onAuthenticated={(result) => void handleAuthenticated(result)}
      />

      <WelcomeWalletModal
        open={welcomeWalletOpen}
        displayName={welcomeName}
        onClose={() => setWelcomeWalletOpen(false)}
        onDone={() => void handleWalletStepDone()}
      />
    </div>
  );
}
