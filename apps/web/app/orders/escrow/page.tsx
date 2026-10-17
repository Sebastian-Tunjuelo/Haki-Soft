import Link from 'next/link';
import { ArrowRight, ShieldCheck, Compass, Sparkles } from 'lucide-react';
import { PageReveal } from '@/src/components/page-reveal';
import { MeridiaPrismLogo, PrismActionIcon } from '@/src/components/brand/meridia-prism-logo';

/** Entrada sin orden: guía visual de custodia en MERIDIA hacia el flujo de contratación. */
export default function EscrowEntryPage() {
  return (
    <PageReveal className="ts-page">
      <header className="ts-page__header ts-reveal">
        <p className="ts-eyebrow">
          <MeridiaPrismLogo size={20} />
          <span>MERIDIA · BÓVEDA DE CUSTODIA OPEN PAYMENTS · GNAP</span>
        </p>
        <h1 className="ts-title kinetic-heading">
          Custodia en bloque único <span className="ts-title__accent">100% garantizada</span>
        </h1>
        <p className="ts-lead">
          Primero selecciona una actividad en el Marketplace o cierra un acuerdo en la sala de negociación. Una vez que
          el Freelancer confirme dentro de las 24 horas, el 100% del presupuesto entra a custodia con liquidación
          atómica <strong>96% Freelancer / 4% Meridia</strong>.
        </p>
      </header>

      <section className="ts-reveal card" style={{ padding: '28px 30px', borderRadius: 26, border: '1px solid var(--border-hi)' }}>
        <div className="wallet-jpg-stepper" style={{ marginTop: 0, marginBottom: 24, paddingTop: 0, borderTop: 'none' }}>
          <div className="wallet-jpg-step is-active">
            <span className="wallet-jpg-step__circle">1</span>
            <span className="wallet-jpg-step__text">Acuerdo en Marketplace</span>
          </div>
          <span className="wallet-jpg-step__line" />
          <div className="wallet-jpg-step">
            <span className="wallet-jpg-step__circle">2</span>
            <span className="wallet-jpg-step__text">Confirmación 24h → Custodia 100%</span>
          </div>
          <span className="wallet-jpg-step__line" />
          <div className="wallet-jpg-step">
            <span className="wallet-jpg-step__circle">3</span>
            <span className="wallet-jpg-step__text">Entrega &amp; Desembolso 96% / 4%</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 24 }}>
          <div className="meridia-user-stat">
            <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Garantía Total
            </span>
            <strong className="kinetic-heading tabular-num" style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--volt)' }}>
              100% en Escrow
            </strong>
            <span style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>
              Reembolso íntegro si no hay entrega en el plazo de 7 días.
            </span>
          </div>
          <div className="meridia-user-stat">
            <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Pago al Talento
            </span>
            <strong className="kinetic-heading tabular-num" style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--tide-ink)' }}>
              96% Neto Directo
            </strong>
            <span style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>
              Liquidación en segundos vía Open Payments tras aprobarse.
            </span>
          </div>
          <div className="meridia-user-stat">
            <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Comisión Protocolo
            </span>
            <strong className="kinetic-heading tabular-num" style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--text-primary)' }}>
              4% Tarifa Plana
            </strong>
            <span style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>
              Incluye Visor Protegido y Consejero IA de Imagen y Texto.
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <Link href="/marketplace/negotiations" className="btn btn-amber">
            <PrismActionIcon size={17} />
            <span>Contratar o negociar</span>
            <ArrowRight size={15} />
          </Link>
          <Link href="/marketplace" className="btn btn-emerald">
            <Compass size={17} />
            <span>Explorar el Marketplace</span>
          </Link>
          <Link href="/activity" className="btn btn-outline">
            <Sparkles size={16} />
            <span>Ver mi Bandeja de Actividad</span>
          </Link>
          <span style={{ marginLeft: 'auto', fontSize: 12.5, color: 'var(--tide-ink)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <ShieldCheck size={16} /> Concesión interactiva GNAP
          </span>
        </div>
      </section>
    </PageReveal>
  );
}

