import Link from 'next/link';
import { mockTaskOrderCard, splitSingleBlockEscrow } from '@taskstream/shared-schemas';
import {
  Wallet,
  ArrowLeftRight,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Layers,
  Cpu,
  Clock,
  Lock,
  CheckCircle2,
  Zap,
  DollarSign,
} from 'lucide-react';
import HeroSceneLoader from '@/app/scenes/hero-scene-loader';

export default function HomePage() {
  const order = mockTaskOrderCard();
  const split = splitSingleBlockEscrow(order.paymentTerms.totalAmountUSDInCents);

  return (
    <div style={{ maxWidth: 1080, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 56 }}>
      {/* SECTION 1: HERO PINNED / INTERACTIVE 3D SECTION */}
      <section
        id="hero-section"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: 36,
          alignItems: 'center',
          paddingBottom: 40,
          borderBottom: '1px solid var(--border)',
        }}
      >
        {/* Left Column: Semantic Headline and Copy (FE-1) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--brand-blue)', fontSize: 13, fontWeight: 500 }}>
            <Sparkles size={16} />
            <span>Fase 1 · SPEC-03: Motor 3D y Scroll Suave</span>
          </div>

          <h1
            style={{
              fontSize: 'clamp(2rem, 3.5vw, 2.75rem)',
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: '-0.03em',
              lineHeight: 1.15,
              margin: 0,
            }}
          >
            Custodia inteligente con{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #38bdf8 0%, #00f0ff 50%, #10b981 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Open Payments
            </span>{' '}
            y arquitectura 3D.
          </h1>

          <p style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
            TaskStream AI sincroniza el scroll suave de <strong style={{ color: '#fff' }}>Lenis</strong> con la cámara de{' '}
            <strong style={{ color: '#fff' }}>Three.js</strong> vía <strong style={{ color: '#fff' }}>GSAP ScrollTrigger</strong> a 60–120 FPS sin
            re-renders de React. Garantía de custodia al 100% con plazos independientes y liquidación automatizada.
          </p>

          {/* Action CTAs */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 8 }}>
            <Link href="/onboarding/wallet" className="btn btn-primary" style={{ padding: '12px 22px' }}>
              <Wallet size={17} />
              <span>Verificar Billetera</span>
              <ArrowRight size={15} />
            </Link>
            <Link href="/settings/mode" className="btn btn-secondary" style={{ padding: '12px 22px' }}>
              <ArrowLeftRight size={17} />
              <span>Alternar Modo Buyer / Seller</span>
            </Link>
            <a href="#timeline-section" className="btn btn-outline" style={{ padding: '12px 20px' }}>
              <Layers size={17} />
              <span>Explorar Línea de Tiempo</span>
            </a>
          </div>

          {/* Key Metric Pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#10b981' }} />
              <span>Invariante 96% / 4% Activa</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#00f0ff' }} />
              <span>Zero-setState en Scroll</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#a855f7' }} />
              <span>Dynamic Import (SSR False)</span>
            </div>
          </div>
        </div>

        {/* Right Column: 3D WebGL Canvas Scene (FE-2) */}
        <div style={{ position: 'relative', width: '100%' }}>
          <HeroSceneLoader containerId="hero-vault-3d" />
        </div>
      </section>

      {/* SECTION 2: TIMELINE DE ESTADOS DEL ESCROW (Scroll-Driven Workflow) */}
      <section id="timeline-section" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--brand-blue)', fontSize: 13, marginBottom: 8 }}>
            <Clock size={16} />
            <span>Flujo Cronológico y Plazos Inmutables</span>
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#ffffff', letterSpacing: '-0.02em', margin: 0 }}>
            Ciclo de Vida de la Custodia Financiera
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 6, margin: 0 }}>
            Cada fase está respaldada por contratos de reloj BullMQ independientes sin solapamiento de plazos.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          {/* Step 1 */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(56, 189, 248, 0.1)',
                  color: 'var(--brand-blue)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: 14,
                }}
              >
                1
              </div>
              <span className="badge badge-buyer">7 Días Iniciales</span>
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#ffffff', margin: 0 }}>
              Depósito 100% en Escrow
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              El Buyer bloquea el monto acordado en Open Payments. Se activa el reloj de 7 días. Si vence sin entrega, se genera reembolso
              automático del 100%.
            </p>
          </div>

          {/* Step 2 */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(245, 158, 11, 0.1)',
                  color: '#f59e0b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: 14,
                }}
              >
                2
              </div>
              <span className="badge" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                32h por Entrega
              </span>
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#ffffff', margin: 0 }}>
              Revisión & Protected Preview
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              El Buyer inspecciona marcas de agua en el visor protegido. Máximo 2 correcciones globales. El informe de IA asesora en imagen
              y texto.
            </p>
          </div>

          {/* Step 3 */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(168, 85, 247, 0.1)',
                  color: '#a855f7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: 14,
                }}
              >
                3
              </div>
              <span className="badge" style={{ backgroundColor: 'rgba(168, 85, 247, 0.1)', color: '#a855f7' }}>
                30 Minutos Finales
              </span>
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#ffffff', margin: 0 }}>
              Ventana Final de Reclamación
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              Tras la aprobación del entregable o el timeout de 32h, corre una ventana de 30m. Si no se solicita mediación, se ejecuta la
              liquidación irreversible.
            </p>
          </div>

          {/* Step 4 */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  color: 'var(--status-verified)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: 14,
                }}
              >
                4
              </div>
              <span className="badge badge-verified">Split 96% / 4%</span>
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#ffffff', margin: 0 }}>
              Desembolso Dual Automático
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              El 96% se acredita de forma directa e inmediata a la billetera activa del Freelancer, y el 4% se dirige a la billetera de la
              plataforma.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 3: INVARIANTE FINANCIERA & AUDITORÍA EN TIEMPO REAL */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 24,
          alignItems: 'stretch',
        }}
      >
        {/* Card: Desglose Matemático */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--brand-blue)', fontSize: 13, marginBottom: 8 }}>
              <DollarSign size={16} />
              <span>Matemática Inmutable del Escrow (SPEC-01 §2)</span>
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#ffffff', marginBottom: 12 }}>
              Desglose Exacto sin Redondeo Flotante
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 20 }}>
              La comisión de la plataforma se redondea con <code>Math.floor(total * 0.04)</code> y el remanente íntegro va al freelancer,
              evitando discrepancias de céntimos.
            </p>

            <div style={{ background: 'rgba(0, 0, 0, 0.3)', borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Monto Total de Orden (USD):</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#ffffff' }}>
                  ${(order.paymentTerms.totalAmountUSDInCents / 100).toFixed(2)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                <span style={{ fontSize: 13, color: 'var(--status-verified)' }}>Pago Freelancer (96% exacto):</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--status-verified)' }}>
                  ${(split.freelancerPayoutUSDInCents / 100).toFixed(2)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                <span style={{ fontSize: 13, color: 'var(--brand-blue)' }}>Comisión Plataforma (4% exacto):</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--brand-blue)' }}>
                  ${(split.platformFeeUSDInCents / 100).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
            <CheckCircle2 size={15} style={{ color: 'var(--status-verified)' }} />
            <span>Verificado por suite Zod en <code>@taskstream/shared-schemas</code></span>
          </div>
        </div>

        {/* Card: Gobernanza y Especificaciones del Monorepo */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--brand-buyer)', fontSize: 13, marginBottom: 8 }}>
              <Cpu size={16} />
              <span>Gobernanza SDD Evolutivo + BDD</span>
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#ffffff', marginBottom: 12 }}>
              Progreso de Fase 1 (FE-1 / FE-2)
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 20 }}>
              Implementación paralela desacoplada. FE-1 construye las vistas, layouts e interactividad; FE-2 provee el motor WebGL 3D,
              Lenis y ScrollTrigger.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 8 }}>
                <span style={{ fontSize: 13, color: '#ffffff' }}>SPEC-00: Estructura & README</span>
                <span className="badge badge-verified">TESTED</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 8 }}>
                <span style={{ fontSize: 13, color: '#ffffff' }}>SPEC-01: Contratos Globales Zod</span>
                <span className="badge badge-verified">TESTED</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 8 }}>
                <span style={{ fontSize: 13, color: '#ffffff' }}>SPEC-02: Identidad Clerk & Wallet</span>
                <span className="badge badge-buyer">IMPLEMENTED (FE)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(56, 189, 248, 0.08)', borderRadius: 8, border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                <span style={{ fontSize: 13, color: 'var(--brand-blue)', fontWeight: 600 }}>SPEC-03: Motor 3D & Lenis</span>
                <span className="badge badge-verified">IMPLEMENTED</span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
            <Link href="/onboarding/wallet" className="btn btn-secondary" style={{ fontSize: 13 }}>
              <span>Ir a Verificación GNAP</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
