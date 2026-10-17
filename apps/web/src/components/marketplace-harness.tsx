'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SlidersHorizontal } from 'lucide-react';
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

type BudgetFilterRange = 'ALL' | 'UNDER_300' | '300_TO_500' | 'OVER_500';

type VisualShowcaseTask = {
  id: string;
  category: string;
  categoryLabel: string;
  title: string;
  description: string;
  clientName: string;
  clientFlag: string;
  clientMark: string;
  clientMarkBg: string;
  budgetAmountUSD: number;
  budgetUSD: string;
  deliveryDays: number;
  aiBadge: string;
  imageUrl: string;
  livePublicationId?: string;
  liveGigId?: string;
};

const CATEGORY_FILTERS: Array<{
  id: string;
  label: string;
  count: number;
}> = [
  { id: 'ALL', label: 'Todas (24)', count: 24 },
  { id: 'GRAPHICS_AND_DESIGN', label: 'Diseño & Arte 3D', count: 6 },
  { id: 'PROGRAMMING_AND_TECH', label: 'Desarrollo & WebGL', count: 5 },
  { id: 'TECHNICAL_WRITING_TRANS', label: 'Redacción Técnica & SEO', count: 4 },
  { id: 'VIDEO_AND_ANIMATION', label: 'Video & Motion', count: 3 },
  { id: 'MUSIC_AND_AUDIO', label: 'Audio & Producción', count: 3 },
  { id: 'DIGITAL_MARKETING', label: 'Datos & IA', count: 3 },
];

const BUDGET_RANGES: Array<{ id: BudgetFilterRange; label: string }> = [
  { id: 'ALL', label: 'Presupuesto: $100 - $1,500 USD' },
  { id: 'UNDER_300', label: 'Hasta $300 USD' },
  { id: '300_TO_500', label: '$300 - $500 USD' },
  { id: 'OVER_500', label: '$500 - $1,500 USD' },
];

const CURRENCY_OPTIONS = ['USD', 'COP', 'MXN', 'BRL'] as const;

const VISUAL_MARKETPLACE_TASKS: VisualShowcaseTask[] = [
  {
    id: 'meridia-task-01',
    category: 'PROGRAMMING_AND_TECH',
    categoryLabel: 'Desarrollo & WebGL',
    title: 'Escena 3D Interactiva & UI para Plataforma Web',
    description:
      'Construcción de bóveda interactiva y dashboard FinTech en Three.js / React Three Fiber con shaders optimizados a 60fps y soporte claro/oscuro.',
    clientName: 'Estudio Andino',
    clientFlag: '🇨🇴',
    clientMark: '🇨🇴',
    clientMarkBg: '#fef3c7',
    budgetAmountUSD: 480,
    budgetUSD: '$480.00 USD',
    deliveryDays: 7,
    aiBadge: 'Auditoría IA Imagen + Custodia 100%',
    imageUrl:
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=960&q=85',
  },
  {
    id: 'meridia-task-02',
    category: 'GRAPHICS_AND_DESIGN',
    categoryLabel: 'Diseño & Arte 3D',
    title: 'Identidad Visual & Sistema Tipográfico Completo',
    description:
      'Manual de marca editorial, sistema tipográfico, packaging y kit de componentes visuales de alta resolución verificables.',
    clientName: 'Nova Labs',
    clientFlag: '🇲🇽',
    clientMark: 'N',
    clientMarkBg: '#0b0f17',
    budgetAmountUSD: 350,
    budgetUSD: '$350.00 USD',
    deliveryDays: 7,
    aiBadge: 'Auditoría IA Imagen (.png / .webp)',
    imageUrl:
      'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=960&q=85',
  },
  {
    id: 'meridia-task-03',
    category: 'TECHNICAL_WRITING_TRANS',
    categoryLabel: 'Redacción Técnica & SEO',
    title: 'Documentación Técnica & Guías Open Payments',
    description:
      'Guía arquitectónica sobre flujos GNAP, quotes ILP y liquidación atómica 96/4 con diagramas y ejemplos ejecutables.',
    clientName: 'PayLatam',
    clientFlag: '🇧🇷',
    clientMark: 'P',
    clientMarkBg: '#065f46',
    budgetAmountUSD: 240,
    budgetUSD: '$240.00 USD',
    deliveryDays: 7,
    aiBadge: 'Auditoría IA Texto (.md / .pdf)',
    imageUrl:
      'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=960&q=85',
  },
  {
    id: 'meridia-task-04',
    category: 'VIDEO_AND_ANIMATION',
    categoryLabel: 'Video & Motion',
    title: 'Keyframes & Animación 3D de Producto',
    description:
      'Secuencia cinemática y renderizado 3D de hardware y bóveda digital con iluminación de estudio y entrega en alta definición.',
    clientName: 'Vértice Studio',
    clientFlag: '🇦🇷',
    clientMark: 'V',
    clientMarkBg: '#1e293b',
    budgetAmountUSD: 620,
    budgetUSD: '$620.00 USD',
    deliveryDays: 7,
    aiBadge: 'Custodia 100% + Visor Protegido',
    imageUrl:
      'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=960&q=85',
  },
  {
    id: 'meridia-task-05',
    category: 'GRAPHICS_AND_DESIGN',
    categoryLabel: 'Diseño & Arte 3D',
    title: 'Rediseño UX/UI Billetera Multimoneda',
    description:
      'Diseño de pantallas móviles para billetera Interledger con conversión de divisas en vivo, estados de custodia y modo claro/oscuro.',
    clientName: 'Andes FinTech',
    clientFlag: '🇨🇱',
    clientMark: 'A',
    clientMarkBg: '#0f766e',
    budgetAmountUSD: 510,
    budgetUSD: '$510.00 USD',
    deliveryDays: 7,
    aiBadge: 'Auditoría IA Imagen (.png / .webp)',
    imageUrl:
      'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=960&q=85',
  },
  {
    id: 'meridia-task-06',
    category: 'DIGITAL_MARKETING',
    categoryLabel: 'Datos & IA',
    title: 'Auditoría Técnica & Prompts Estructurados',
    description:
      'Estructuración de criterios verificables, visualización de métricas y optimización de flujos de evaluación para tareas digitales.',
    clientName: 'Norte AI',
    clientFlag: '🇨🇦',
    clientMark: 'AI',
    clientMarkBg: '#1d4ed8',
    budgetAmountUSD: 290,
    budgetUSD: '$290.00 USD',
    deliveryDays: 7,
    aiBadge: 'Auditoría IA Texto + Datos',
    imageUrl:
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=960&q=85',
  },
  {
    id: 'meridia-task-07',
    category: 'MUSIC_AND_AUDIO',
    categoryLabel: 'Audio & Producción',
    title: 'Diseño Sonoro UI & Identidad Acústica FinTech',
    description:
      'Paquete de micro-sonidos para notificaciones de custodia bloqueada, liberación 96/4 y confirmación de billetera GNAP.',
    clientName: 'Sonora Lab',
    clientFlag: '🇲🇽',
    clientMark: 'S',
    clientMarkBg: '#78520a',
    budgetAmountUSD: 190,
    budgetUSD: '$190.00 USD',
    deliveryDays: 7,
    aiBadge: 'Custodia 100% + Visor Protegido',
    imageUrl:
      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=960&q=85',
  },
];

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
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [budgetRange, setBudgetRange] = useState<BudgetFilterRange>('ALL');
  const [maxBudgetSlider, setMaxBudgetSlider] = useState<number>(1500);
  const [budgetMenuOpen, setBudgetMenuOpen] = useState<boolean>(false);
  const [activeCurrency, setActiveCurrency] = useState<(typeof CURRENCY_OPTIONS)[number]>('USD');
  const [activeApplyTask, setActiveApplyTask] = useState<VisualShowcaseTask | null>(null);
  const [appliedTaskIds, setAppliedTaskIds] = useState<string[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [noticeError, setNoticeError] = useState<string | null>(null);
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

  function openWalletGate() {
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
        requireAuth('Inicia sesión o crea una cuenta para agregar un servicio.', 'create-gig');
        return;
      }
      if (isWalletNotVerified(result.status, result.body)) {
        setPendingAction('create-gig');
        openWalletGate();
        return;
      }
      if (fromResume) setPendingAction(null);
      if (result.status === 201 && result.body && typeof result.body === 'object' && 'gigId' in result.body) {
        setNotice('Servicio creado. Abriendo tu vitrina…');
        setNoticeError(null);
        router.push(`/marketplace/gigs/${(result.body as GigCard).gigId}`);
        return;
      }
      setNoticeError('No se pudo agregar el servicio. Revisa sesión y billetera.');
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
        requireAuth('Inicia sesión o crea una cuenta para publicar una tarea o trabajo.', 'create-publication');
        return;
      }
      if (isWalletNotVerified(result.status, result.body)) {
        setPendingAction('create-publication');
        openWalletGate();
        return;
      }
      if (fromResume) setPendingAction(null);
      if (
        result.status === 201 &&
        result.body &&
        typeof result.body === 'object' &&
        'publicationId' in result.body
      ) {
        setNotice('Tarea publicada. Abriendo tu vitrina…');
        setNoticeError(null);
        router.push(`/marketplace/publications/${(result.body as Publication).publicationId}`);
        return;
      }
      setNoticeError('No se pudo crear la publicación. Revisa sesión y billetera.');
      setNotice(null);
      await refresh();
    });
  }

  async function cancelPublication(publicationId: string, fromResume = false) {
    await withSingleFlight(async () => {
      const result = await api(`/api/v1/marketplace/publications/${publicationId}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ cancelReason: 'Cancelación solicitada por el Cliente' }),
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

  function handleApplyToPanel(task: VisualShowcaseTask) {
    if (task.livePublicationId) {
      router.push(`/marketplace/publications/${task.livePublicationId}`);
      return;
    }
    if (task.liveGigId) {
      router.push(`/marketplace/gigs/${task.liveGigId}`);
      return;
    }
    const matchingOpenPub = publications.find((p) => p.status === 'OPEN_FOR_PROPOSALS');
    if (matchingOpenPub) {
      router.push(`/marketplace/publications/${matchingOpenPub.publicationId}`);
      return;
    }
    setActiveApplyTask(task);
    if (!appliedTaskIds.includes(task.id)) {
      setAppliedTaskIds((prev) => [...prev, task.id]);
    }
    setNotice(
      `Propuesta preparada para "${task.title}" (${task.budgetUSD} · Plazo 7d). Puedes abrir la sala de negociación o publicar tu propio servicio.`
    );
    setNoticeError(null);
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

  // Unificar paneles del boceto JPG con las publicaciones y servicios en vivo en la misma lista de paneles horizontales
  const allHorizontalPanels = useMemo<VisualShowcaseTask[]>(() => {
    const livePubPanels: VisualShowcaseTask[] = publications.map((pub, idx) => {
      const usd = Math.round(pub.initialBudgetUSDInCents / 100);
      return {
        id: `live-pub-${pub.publicationId}`,
        category: pub.category,
        categoryLabel:
          CATEGORY_FILTERS.find((c) => c.id === pub.category)?.label ?? 'Actividad en Vivo',
        title: pub.title,
        description: `Encargo publicado en vivo (${pub.status}) · ${pub.activeProposalCount} propuestas recibidas · Custodia 100% Open Payments.`,
        clientName: 'Cliente Verificado',
        clientFlag: '🌎',
        clientMark: 'C',
        clientMarkBg: '#d99b26',
        budgetAmountUSD: usd,
        budgetUSD: `$${(pub.initialBudgetUSDInCents / 100).toFixed(2)} USD`,
        deliveryDays: 7,
        aiBadge: pub.aiAuditableModality ? `Auditoría IA ${pub.aiAuditableModality}` : 'Custodia 100%',
        imageUrl:
          VISUAL_MARKETPLACE_TASKS[idx % VISUAL_MARKETPLACE_TASKS.length]?.imageUrl ??
          VISUAL_MARKETPLACE_TASKS[0].imageUrl,
        livePublicationId: pub.publicationId,
      };
    });

    const liveGigPanels: VisualShowcaseTask[] = gigs.map((gig, idx) => {
      const usd = Math.round(gig.priceUSDInCents / 100);
      return {
        id: `live-gig-${gig.gigId}`,
        category: gig.category,
        categoryLabel:
          CATEGORY_FILTERS.find((c) => c.id === gig.category)?.label ?? 'Servicio Freelancer',
        title: gig.title,
        description: `Servicio ofrecido por ${gig.seller.displayName} (${gig.seller.targetCurrency}) · Contratación directa con custodia 96% / 4%.`,
        clientName: gig.seller.displayName,
        clientFlag: '⚡',
        clientMark: gig.seller.displayName.slice(0, 1).toUpperCase(),
        clientMarkBg: '#0d9488',
        budgetAmountUSD: usd,
        budgetUSD: `$${(gig.priceUSDInCents / 100).toFixed(2)} USD`,
        deliveryDays: 5,
        aiBadge: gig.aiAuditableModality ? `Auditoría IA ${gig.aiAuditableModality}` : 'Servicio Verificado',
        imageUrl:
          VISUAL_MARKETPLACE_TASKS[(idx + 2) % VISUAL_MARKETPLACE_TASKS.length]?.imageUrl ??
          VISUAL_MARKETPLACE_TASKS[1].imageUrl,
        liveGigId: gig.gigId,
      };
    });

    return [...livePubPanels, ...liveGigPanels, ...VISUAL_MARKETPLACE_TASKS];
  }, [publications, gigs]);

  const filteredHorizontalPanels = useMemo(() => {
    return allHorizontalPanels.filter((task) => {
      const matchesCategory = selectedCategory === 'ALL' || task.category === selectedCategory;
      if (!matchesCategory) return false;

      if (task.budgetAmountUSD > maxBudgetSlider) return false;

      if (budgetRange === 'UNDER_300') return task.budgetAmountUSD <= 300;
      if (budgetRange === '300_TO_500') return task.budgetAmountUSD >= 300 && task.budgetAmountUSD <= 500;
      if (budgetRange === 'OVER_500') return task.budgetAmountUSD > 500;
      return true;
    });
  }, [allHorizontalPanels, selectedCategory, budgetRange, maxBudgetSlider]);

  const activeBudgetLabel =
    BUDGET_RANGES.find((b) => b.id === budgetRange)?.label ?? 'Presupuesto: $100 - $1,500 USD';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22, maxWidth: 1180, margin: '0 auto' }}>
      {/* Barra Superior de Botones de Acción Fiel a meridia-marketplace-light/dark.jpg */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <a href="/marketplace/negotiations" className="filter-pill" style={{ textDecoration: 'none' }}>
            Sala de propuestas
          </a>
          <a href="/activity" className="filter-pill" style={{ textDecoration: 'none' }}>
            Actividad en vivo
          </a>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-emerald"
            style={{ borderRadius: 999, padding: '11px 22px', fontSize: '0.95rem' }}
            disabled={mutating}
            onClick={() => void createGig()}
          >
            {mutating ? 'Procesando…' : '+ Agregar servicio'}
          </button>
          <button
            type="button"
            className="btn btn-amber"
            style={{ borderRadius: 999, padding: '11px 22px', fontSize: '0.95rem' }}
            disabled={mutating}
            onClick={() => void createPublication()}
          >
            {mutating ? 'Publicando…' : '+ Publicar tarea / trabajo'}
          </button>
        </div>
      </div>

      {/* Cabecera MARKETPLACE + Filtro de Presupuesto y Moneda Fiel al JPG */}
      <div className="mp-jpg-header-bar">
        <h1 className="mp-jpg-title">MARKETPLACE</h1>

        <div className="mp-jpg-top-filters">
          {/* Cápsula Interactiva de Filtro por Presupuesto */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              className="mp-jpg-pill-box"
              onClick={() => setBudgetMenuOpen((prev) => !prev)}
              style={{ cursor: 'pointer' }}
              aria-expanded={budgetMenuOpen}
            >
              <SlidersHorizontal size={15} style={{ color: 'var(--tide)' }} />
              <span>
                {maxBudgetSlider < 1500
                  ? `Presupuesto: $100 - $${maxBudgetSlider} USD`
                  : activeBudgetLabel}
              </span>
            </button>

            {budgetMenuOpen ? (
              <div
                className="card"
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 'calc(100% + 8px)',
                  zIndex: 35,
                  width: 300,
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>
                  Filtrar por rango de presupuesto
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {BUDGET_RANGES.map((range) => (
                    <button
                      key={range.id}
                      type="button"
                      className={`filter-pill ${budgetRange === range.id ? 'is-active' : ''}`}
                      style={{ justifyContent: 'space-between', width: '100%' }}
                      onClick={() => {
                        setBudgetRange(range.id);
                        setMaxBudgetSlider(1500);
                        setBudgetMenuOpen(false);
                      }}
                    >
                      <span>{range.label}</span>
                    </button>
                  ))}
                </div>
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
                    <span>Tope máximo:</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--tide-ink)' }}>
                      ${maxBudgetSlider} USD
                    </span>
                  </div>
                  <input
                    type="range"
                    min={150}
                    max={1500}
                    step={50}
                    value={maxBudgetSlider}
                    onChange={(e) => {
                      setBudgetRange('ALL');
                      setMaxBudgetSlider(Number(e.target.value));
                    }}
                    style={{ width: '100%', accentColor: 'var(--tide)' }}
                  />
                </div>
              </div>
            ) : null}
          </div>

          {/* Cápsula de Divisas (USD · COP · MXN · BRL) Fiel al JPG */}
          <div className="mp-jpg-pill-box" aria-label="Divisa de referencia">
            {CURRENCY_OPTIONS.map((curr, idx) => (
              <span key={curr} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <button
                  type="button"
                  onClick={() => setActiveCurrency(curr)}
                  className={`mp-currency-btn ${activeCurrency === curr ? 'is-active' : ''}`}
                >
                  {curr}
                </button>
                {idx < CURRENCY_OPTIONS.length - 1 ? (
                  <span style={{ color: 'var(--text-muted)' }}>·</span>
                ) : null}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Fila de Píldoras de Categorías de Trabajo/Actividad Fiel al JPG */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 10,
          paddingBottom: 6,
        }}
        role="tablist"
        aria-label="Filtrar por categoría de trabajo o actividad"
      >
        {CATEGORY_FILTERS.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          const liveCat = categories.find((c) => c.category === cat.id);
          const extraLive = liveCat ? liveCat.openPublicationCount + liveCat.activeGigCount : 0;
          const labelText =
            cat.id === 'ALL'
              ? `Todas (${24 + publications.length + gigs.length})`
              : extraLive > 0
                ? `${cat.label} (${cat.count + extraLive})`
                : cat.label;

          return (
            <button
              key={cat.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              className={`filter-pill ${isSelected ? 'is-active' : ''}`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              <span>{labelText}</span>
            </button>
          );
        })}

        {(selectedCategory !== 'ALL' || budgetRange !== 'ALL' || maxBudgetSlider < 1500) ? (
          <button
            type="button"
            className="filter-pill"
            style={{ fontSize: 12, color: 'var(--volt-ink)' }}
            onClick={() => {
              setSelectedCategory('ALL');
              setBudgetRange('ALL');
              setMaxBudgetSlider(1500);
            }}
          >
            Limpiar filtros ×
          </button>
        ) : null}
      </div>

      {noticeError ? (
        <p
          style={{
            margin: 0,
            padding: '12px 16px',
            borderRadius: 12,
            background: 'var(--status-failed-bg)',
            color: 'var(--status-failed)',
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          {noticeError}
        </p>
      ) : null}

      {notice ? (
        <div
          style={{
            margin: 0,
            padding: '14px 18px',
            borderRadius: 14,
            background: 'var(--status-verified-bg)',
            color: 'var(--status-verified)',
            fontSize: 14,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <span>{notice}</span>
          {activeApplyTask ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <a href="/marketplace/negotiations" className="btn btn-emerald btn-sm">
                Ir a sala de negociación →
              </a>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => {
                  setActiveApplyTask(null);
                  setNotice(null);
                }}
              >
                Cerrar
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* LISTA DE PANELES HORIZONTALES FIEL AL DISEÑO DEL JPG */}
      <section className="mp-horizontal-list" aria-label="Lista de paneles horizontales de actividades y trabajos">
        {filteredHorizontalPanels.map((task) => {
          const isApplied = appliedTaskIds.includes(task.id);
          return (
            <article key={task.id} className="mp-horizontal-panel">
              {/* Imagen Panorámica Protagonista a la Izquierda */}
              <div className="mp-horizontal-panel__media">
                <img
                  src={task.imageUrl}
                  alt={task.title}
                  className="mp-horizontal-panel__img"
                  loading="lazy"
                />
              </div>

              {/* Contenido Central del Panel Horizontal */}
              <div className="mp-horizontal-panel__content">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span
                    style={{
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      padding: '3px 10px',
                      borderRadius: 999,
                      background: 'var(--soft)',
                      border: '1px solid var(--border-hi)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {task.categoryLabel}
                  </span>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--tide-ink)',
                      fontWeight: 600,
                    }}
                  >
                    {task.aiBadge} · Plazo {task.deliveryDays}d
                  </span>
                </div>

                <h2 className="mp-horizontal-panel__title">{task.title}</h2>
                <p className="mp-horizontal-panel__desc">{task.description}</p>

                <div className="mp-horizontal-panel__client">
                  <span
                    className="mp-horizontal-panel__client-dot"
                    style={{
                      background: task.clientMarkBg,
                      color: task.clientMarkBg === '#fef3c7' ? '#0b0f17' : '#ffffff',
                    }}
                  >
                    {task.clientMark}
                  </span>
                  <span>{task.clientName}</span>
                  <span>{task.clientFlag}</span>
                </div>
              </div>

              {/* Columna Derecha del Panel Horizontal: Presupuesto Inicial + Botón Píldora Fiel al JPG */}
              <div className="mp-horizontal-panel__aside">
                <div>
                  <span className="mp-horizontal-panel__budget-label">Presupuesto Inicial:</span>
                  <strong className="mp-horizontal-panel__budget-value tabular-num">
                    {task.budgetUSD}
                  </strong>
                  {activeCurrency !== 'USD' ? (
                    <span
                      style={{
                        display: 'block',
                        fontSize: '0.75rem',
                        color: 'var(--tide-ink)',
                        fontFamily: 'var(--font-mono)',
                        marginTop: 2,
                      }}
                    >
                      Liquidación {activeCurrency} vía ILP
                    </span>
                  ) : null}
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="mp-jpg-apply-btn"
                    onClick={() => handleApplyToPanel(task)}
                  >
                    {isApplied ? 'Propuesta lista ✓' : 'Aplicar al trabajo'}
                  </button>

                  {task.livePublicationId ? (
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => void cancelPublication(task.livePublicationId!)}
                    >
                      Cancelar
                    </button>
                  ) : null}
                </div>
              </div>
            </article>
          );
        })}

        {filteredHorizontalPanels.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 36 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', margin: '0 0 8px' }}>
              No hay actividades con ese filtro de presupuesto o categoría
            </h3>
            <p style={{ color: 'var(--text-secondary)', margin: '0 0 16px', fontSize: 14 }}>
              Amplía el rango de presupuesto o selecciona «Todas» para ver todos los paneles horizontales disponibles.
            </p>
            <button
              type="button"
              className="btn btn-emerald"
              onClick={() => {
                setSelectedCategory('ALL');
                setBudgetRange('ALL');
                setMaxBudgetSlider(1500);
              }}
            >
              Mostrar todas las actividades
            </button>
          </div>
        ) : null}
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
