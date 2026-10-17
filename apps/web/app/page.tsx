import Link from 'next/link';
import {
  Wallet,
  ArrowRight,
  Star,
  CheckCircle2,
  Briefcase,
  FolderKanban,
  ShieldCheck,
  Compass,
} from 'lucide-react';
import { HeroWalletStage } from '@/src/components/home/hero-wallet-stage';
import { LandingAvatarStrip, LandingModules } from '@/src/components/home/landing-modules';
import { PageReveal } from '@/src/components/page-reveal';
import {
  MeridiaPrismLogo,
  PrismActionIcon,
} from '@/src/components/brand/meridia-prism-logo';

const FEATURED_HOME_ACTIVITIES = [
  {
    id: 'home-act-1',
    num: 1,
    title: 'Escena 3D Interactiva & Shaders WebGL FinTech',
    category: 'Diseño & Arte 3D',
    client: 'Estudio Andino 🇨🇴',
    clientAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80',
    budget: '$480 USD',
    deadline: '7 días',
    description:
      'Bóveda cristalina en Three.js con iluminación reactiva al scroll y optimización a 60fps.',
    image:
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'home-act-2',
    num: 2,
    title: 'Rediseño UX/UI Sistema Billetera Multimoneda',
    category: 'Desarrollo & WebGL',
    client: 'Nova Labs 🇲🇽',
    clientAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=160&q=80',
    budget: '$510 USD',
    deadline: '6 días',
    description:
      'Componentes accesibles en modo claro/oscuro, flujo de consentimiento GNAP y prototipo.',
    image:
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'home-act-3',
    num: 3,
    title: 'Documentación Técnica & Guías Open Payments',
    category: 'Redacción Técnica',
    client: 'PayLatam 🇧🇷',
    clientAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80',
    budget: '$240 USD',
    deadline: '5 días',
    description:
      'Manual técnico con diagramas de secuencia para Incoming/Outgoing Payments verificables.',
    image:
      'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=900&q=80',
  },
] as const;

export default function HomePage() {
  return (
    <PageReveal className="ts-page ts-page--landing">
      {/* HERO PRINCIPAL MERIDIA — Fiel a meridia-inicio-light.jpg y meridia-inicio-dark.jpg */}
      <header className="ld-hero ts-reveal">
        <div className="ld-hero__grid">
          <div className="ld-hero__copy">
            <div className="ld-stars">
              <i>★★★★★</i>
              <b>MERIDIA · Open Payments</b>
              <span className="ld-muted">· Custodia 100% · GNAP · 96% Freelancer / 4% Protocolo</span>
            </div>

            <p className="ts-eyebrow" style={{ marginTop: 6 }}>
              <MeridiaPrismLogo size={22} />
              <span>MERIDIA · El Prisma Meridiano de Pagos Abiertos</span>
            </p>

            <h1 className="ts-title kinetic-heading">
              Impulsa proyectos y talento en toda América con{' '}
              <span className="ts-title__accent">Open Payments</span>
            </h1>

            <p className="ts-lead">
              Con una única cuenta unificada puedes publicar encargos como <strong>Cliente</strong> y prestar tus
              servicios como <strong>Freelancer</strong> con custodia en bloque único: liberación inmediata 96% / 4%,
              visor protegido y consejero de IA en imagen y texto.
            </p>

            <div className="ld-checks">
              <span>Custodia 100% garantizada</span>
              <span>Liquidación en 4 segundos</span>
              <span>Reembolso 100% si no hay entrega</span>
            </div>

            <div className="ld-cta" style={{ marginTop: 8 }}>
              <Link href="/marketplace" className="btn btn-amber">
                <PrismActionIcon size={18} />
                <span>Publica ya tu actividad</span>
                <ArrowRight size={15} />
              </Link>
              <Link href="/marketplace" className="btn btn-emerald">
                <Compass size={18} />
                <span>Explorar oportunidades</span>
              </Link>
              <Link href="/onboarding/wallet" className="btn btn-outline">
                <Wallet size={17} />
                <span>Reconocer mi billetera</span>
              </Link>
            </div>

            <LandingAvatarStrip />
          </div>

          <div className="ts-reveal ld-hero__stage">
            <HeroWalletStage />
          </div>
        </div>
      </header>

      {/* SECCIÓN SPLIT 2 COLUMNAS FIEL AL BOCETO JPG: Panel General del Usuario (Izquierda) + Actividades Destacadas (Derecha) */}
      <section className="ts-reveal inicio-jpg-split" aria-label="Panel general del usuario y actividades destacadas">
        {/* COLUMNA IZQUIERDA: Panel General del Usuario */}
        <div className="meridia-user-bento" style={{ margin: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <span className="ld-eyebrow" style={{ margin: 0 }}>Panel General del Usuario</span>
              <span className="badge badge-verified">
                <span className="pulse-dot" /> Cuenta Unificada Activa
              </span>
            </div>

            <div className="meridia-user-bento__identity" style={{ marginBottom: 18 }}>
              <div className="meridia-user-bento__avatar">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=240&q=80"
                  alt="Sara M."
                  className="meridia-user-bento__avatar-photo"
                />
              </div>
              <div>
                <h2
                  className="kinetic-heading"
                  style={{ fontFamily: 'var(--font-display)', fontSize: '1.24rem', fontWeight: 700, margin: 0 }}
                >
                  Sara M. · Directora UI &amp; Especialista WebGL
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                  Bogotá, CO 🇨🇴 · <code>$ilp.interledger-test.dev/sara-estudio</code>
                </p>
              </div>
            </div>

            {/* Combinación de Reseñas + Último Trabajo + Actividades Publicadas */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <article className="meridia-user-stat">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Combinación de Reseñas
                  </span>
                  <Star size={15} style={{ color: 'var(--volt)', fill: 'var(--volt)' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span className="tabular-num kinetic-heading" style={{ fontFamily: 'var(--font-display)', fontSize: '1.65rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    4.9 ★
                  </span>
                  <span style={{ fontSize: 12.5, color: 'var(--tide-ink)', fontWeight: 700 }}>
                    (38 reseñas verificadas)
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                  <img
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80"
                    alt="Carlos V."
                    style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    &ldquo;Entrega impecable y 98% en revisión IA.&rdquo; — <strong>Carlos V. 🇲🇽</strong>
                  </span>
                </div>
              </article>

              <article className="meridia-user-stat">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Último Trabajo Completado
                  </span>
                  <CheckCircle2 size={15} style={{ color: 'var(--tide)' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <img
                    src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=240&q=80"
                    alt="Vista previa de Sistema Design Tokens FinTech"
                    style={{ width: 48, height: 48, borderRadius: 11, objectFit: 'cover', border: '1px solid var(--border-hi)', flexShrink: 0 }}
                  />
                  <div>
                    <strong style={{ fontSize: 13.5, display: 'block', color: 'var(--text-primary)' }}>
                      Sistema Design Tokens FinTech
                    </strong>
                    <span className="tabular-num" style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--tide-ink)', fontFamily: 'var(--font-mono)' }}>
                      $480.00 USD liquidados (96%)
                    </span>
                  </div>
                </div>
              </article>

              <article className="meridia-user-stat">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Actividades Publicadas &amp; Contratadas
                  </span>
                  <FolderKanban size={15} style={{ color: 'var(--volt)' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
                  <span className="tabular-num kinetic-heading" style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    14 Actividades Publicadas
                  </span>
                  <span className="badge badge-buyer" style={{ fontSize: 11 }}>
                    2 en custodia
                  </span>
                </div>
              </article>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
            <Link href="/onboarding/wallet" className="btn btn-outline btn-sm" style={{ flex: 1 }}>
              <Wallet size={15} /> Mi Billetera ILP
            </Link>
            <Link href="/marketplace" className="btn btn-amber btn-sm" style={{ flex: 1 }}>
              <PrismActionIcon size={15} /> Publica ya tu actividad
            </Link>
          </div>
        </div>

        {/* COLUMNA DERECHA: Actividades y encargos que te pueden interesar (Tarjetas 1, 2, 3 + Barra inferior CTA) */}
        <div
          className="card"
          style={{
            padding: '24px 26px',
            borderRadius: 26,
            border: '1px solid var(--border-hi)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 18,
          }}
        >
          <div>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div>
                <span className="ld-eyebrow" style={{ margin: 0 }}>Marketplace Activo · Custodia 100%</span>
                <h2
                  className="kinetic-heading"
                  style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.25rem, 2.2vw, 1.6rem)', fontWeight: 700, margin: '4px 0 0' }}
                >
                  Actividades y encargos que te pueden interesar
                </h2>
              </div>
              <Link href="/marketplace" className="btn btn-outline btn-sm">
                <span>Ver todas las actividades</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            <div className="inicio-jpg-cards-3">
              {FEATURED_HOME_ACTIVITIES.map((item) => (
                <article key={item.id} className="inicio-jpg-mini-card">
                  <div className="inicio-jpg-mini-card__media">
                    <img src={item.image} alt={item.title} loading="lazy" />
                    <span className="inicio-jpg-mini-card__num">{item.num}</span>
                  </div>
                  <div className="inicio-jpg-mini-card__body">
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                        <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--tide-ink)', textTransform: 'uppercase' }}>
                          {item.category}
                        </span>
                        <span
                          className="tabular-num"
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 12,
                            fontWeight: 700,
                            color: 'var(--volt)',
                            background: 'rgba(var(--volt-rgb), 0.14)',
                            padding: '2px 8px',
                            borderRadius: 999,
                          }}
                        >
                          {item.budget}
                        </span>
                      </div>
                      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.96rem', fontWeight: 700, margin: '0 0 6px', lineHeight: 1.3 }}>
                        {item.title}
                      </h3>
                      <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
                        {item.description}
                      </p>
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 8, marginBottom: 10 }}>
                        <img
                          src={item.clientAvatar}
                          alt={item.client}
                          style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover' }}
                        />
                        <span style={{ fontSize: 11.5, color: 'var(--text-secondary)', fontWeight: 600 }}>
                          {item.client} · {item.deadline}
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 11, color: 'var(--tide-ink)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <ShieldCheck size={13} /> GNAP
                        </span>
                        <Link href="/marketplace" className="btn-apply" style={{ padding: '6px 11px', fontSize: 11.5 }}>
                          <Briefcase size={12} />
                          <span>Aplicar</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          {/* Barra inferior de conversión fiel a meridia-inicio-light/dark.jpg */}
          <div
            style={{
              padding: '16px 20px',
              borderRadius: 18,
              border: '1px solid var(--border-hi)',
              background:
                'linear-gradient(135deg, rgba(var(--volt-rgb), 0.14) 0%, rgba(var(--tide-rgb), 0.14) 100%), var(--surface-raised)',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 14,
            }}
          >
            <div>
              <strong style={{ fontFamily: 'var(--font-display)', fontSize: '1.02rem', display: 'block', color: 'var(--text-primary)' }}>
                ¿Necesitas un servicio? Publica hoy tu encargo con custodia 100% garantizada
              </strong>
              <span style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>
                Recibe propuestas competitivas o publica tu propio servicio con liquidación atómica 96% / 4%.
              </span>
            </div>
            <Link href="/marketplace" className="btn btn-amber btn-sm">
              <PrismActionIcon size={16} />
              <span>Publica ya tu actividad</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      <LandingModules />
    </PageReveal>
  );
}

