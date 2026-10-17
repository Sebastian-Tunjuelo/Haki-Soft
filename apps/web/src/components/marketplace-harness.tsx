'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
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
  const [notice, setNotice] = useState<string | null>(null);
  const [noticeError, setNoticeError] = useState<string | null>(null);
  const [selectedGig, setSelectedGig] = useState<GigCard | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authReason, setAuthReason] = useState('Necesitas una sesión activa para continuar.');
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [welcomeWalletOpen, setWelcomeWalletOpen] = useState(false);
  const [welcomeName, setWelcomeName] = useState<string | null>(null);
  const [mutating, setMutating] = useState(false);
  const mutatingRef = useRef(false);

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
    setNotice('Inicia sesión para continuar. El acceso se abre sobre esta misma página.');
    setNoticeError(null);
    return true;
  }

  function openWalletGate(_reasonLog: string) {
    setNotice('Vincula y verifica tu billetera Interledger para publicar.');
    setNoticeError(null);
    setWelcomeWalletOpen(true);
  }

  async function withSingleFlight(action: () => Promise<void>): Promise<void> {
    if (mutatingRef.current) return;
    mutatingRef.current = true;
    setMutating(true);
    try {
      await action();
    } finally {
      mutatingRef.current = false;
      setMutating(false);
    }
  }

  async function createGig(fromResume = false) {
    await withSingleFlight(async () => {
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
      if (fromResume) setPendingAction(null);
      if (result.status === 201 && result.body && typeof result.body === 'object' && 'gigId' in result.body) {
        setNotice('Gig creado. Abriendo tu vitrina…');
        setNoticeError(null);
        router.push(`/marketplace/gigs/${(result.body as GigCard).gigId}`);
        return;
      }
      setNoticeError('No se pudo crear el Gig. Revisa sesión y wallet.');
      setNotice(null);
      await refresh();
    });
  }

  async function createPublication(fromResume = false) {
    await withSingleFlight(async () => {
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
      if (fromResume) setPendingAction(null);
      if (
        result.status === 201 &&
        result.body &&
        typeof result.body === 'object' &&
        'publicationId' in result.body
      ) {
        setNotice('Publicación creada. Abriendo tu vitrina…');
        setNoticeError(null);
        router.push(`/marketplace/publications/${(result.body as Publication).publicationId}`);
        return;
      }
      setNoticeError('No se pudo crear la publicación. Revisa sesión y wallet.');
      setNotice(null);
      await refresh();
    });
  }

  async function cancelPublication(publicationId: string, fromResume = false) {
    await withSingleFlight(async () => {
      const result = await api(`/api/v1/marketplace/publications/${publicationId}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ cancelReason: 'Cancelación de prueba' }),
      });
      if (isUnauthenticated(result.status, result.body)) {
        requireAuth('Inicia sesión para cancelar tu publicación.', { type: 'cancel', publicationId });
        return;
      }
      if (result.status >= 200 && result.status < 300) {
        setNotice('Publicación cancelada.');
        setNoticeError(null);
      } else {
        setNoticeError('No se pudo cancelar la publicación.');
        setNotice(null);
      }
      if (fromResume) setPendingAction(null);
      await refresh();
    });
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
      setNotice('Cuenta creada. Vincula tu billetera para publicar.');
      setNoticeError(null);
      return;
    }
    setNotice('Sesión iniciada. Continuamos con tu acción…');
    setNoticeError(null);
    await resumePendingAction();
  }

  async function handleWalletStepDone() {
    setWelcomeWalletOpen(false);
    setNotice('Si ya verificaste la billetera, reintentamos tu publicación.');
    setNoticeError(null);
    await resumePendingAction();
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28, maxWidth: 960 }}>
      <header>
        <h1 style={{ margin: 0, fontSize: '1.75rem' }}>Marketplace</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>
          Explora categorías, Gigs a precio fijo y publicaciones con presupuesto tope. Sin sesión, las acciones
          protegidas abren el acceso en esta misma vista.
        </p>
      </header>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
        <button
          type="button"
          className="btn btn-primary"
          disabled={mutating}
          onClick={() => void createGig()}
        >
          {mutating ? 'Creando…' : 'Crear Gig'}
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          disabled={mutating}
          onClick={() => void createPublication()}
        >
          {mutating ? 'Creando…' : 'Crear publicación'}
        </button>
        <a href="/marketplace/negotiations" className="btn btn-secondary">
          Contratar / negociar
        </a>
        <a href="/activity" className="btn btn-secondary">
          Actividad
        </a>
        <button type="button" className="btn btn-secondary" disabled={mutating} onClick={() => void refresh()}>
          Actualizar
        </button>
      </div>

      {noticeError ? (
        <p
          style={{
            margin: 0,
            padding: '12px 14px',
            borderRadius: 10,
            background: 'var(--status-failed-bg)',
            color: 'var(--status-failed)',
            fontSize: 14,
          }}
        >
          {noticeError}
        </p>
      ) : null}
      {notice ? (
        <p
          style={{
            margin: 0,
            padding: '12px 14px',
            borderRadius: 10,
            background: 'var(--status-verified-bg)',
            color: 'var(--status-verified)',
            fontSize: 14,
          }}
        >
          {notice}
        </p>
      ) : null}

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
