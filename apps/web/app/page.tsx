import Link from 'next/link';
import { mockTaskOrderCard, splitSingleBlockEscrow } from '@taskstream/shared-schemas';
import {
  Wallet,
  ArrowLeftRight,
  ArrowRight,
  Sparkles,
  Layers,
  Cpu,
  Clock,
  CheckCircle2,
  DollarSign,
} from 'lucide-react';
import { HeroWalletStage } from '@/src/components/home/hero-wallet-stage';
import { PageReveal } from '@/src/components/page-reveal';

export default function HomePage() {
  const order = mockTaskOrderCard();
  const split = splitSingleBlockEscrow(order.paymentTerms.totalAmountUSDInCents);

  return (
    <PageReveal className="ts-page">
      <section id="hero-section" className="ts-reveal" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 36, alignItems: 'center', paddingBottom: 8 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <p className="ts-eyebrow">
            <Sparkles size={16} />
            <span>TaskStream AI · custodia Open Payments</span>
          </p>

          <h1 className="ts-title">
            Gestiona tareas y cobros{' '}
            <span className="ts-title__accent">sin fricción</span>
          </h1>

          <p className="ts-lead">
            Publica, negocia y cobra con escrow Open Payments: seguridad GNAP, liberación automática y
            revisión IA — sin esperas de 14 días.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 4 }}>
            <Link href="/onboarding/wallet" className="btn btn-primary">
              <Wallet size={17} />
              <span>Verificar billetera</span>
              <ArrowRight size={15} />
            </Link>
            <Link href="/settings/mode" className="btn btn-secondary">
              <ArrowLeftRight size={17} />
              <span>Modo Buyer / Seller</span>
            </Link>
            <a href="#timeline-section" className="btn btn-outline">
              <Layers size={17} />
              <span>Ver ciclo de custodia</span>
            </a>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 4 }}>
            <span className="ts-metric">
              <span className="ts-metric__dot ts-metric__dot--volt" />
              Invariante 96% / 4%
            </span>
            <span className="ts-metric">
              <span className="ts-metric__dot" />
              Escrow Open Payments
            </span>
          </div>
        </div>

        <div className="ts-reveal" style={{ position: 'relative', width: '100%' }}>
          <HeroWalletStage />
        </div>
      </section>

      <section id="timeline-section" className="ts-section ts-reveal">
        <div className="ts-section__head">
          <p className="ts-eyebrow">
            <Clock size={16} />
            <span>Flujo de custodia</span>
          </p>
          <h2 className="ts-section__title">De la tarea al pago</h2>
          <p className="ts-lead">
            Bloqueo, entrega, revisión IA y liberación en un solo circuito, con plazos independientes.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          <article className="card ts-step ts-reveal">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="ts-step__num">1</div>
              <span className="badge badge-buyer">7 días</span>
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Depósito en escrow</h3>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              El Buyer bloquea el monto. Si vence sin entrega, reembolso automático del 100%.
            </p>
          </article>

          <article className="card ts-step ts-reveal">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="ts-step__num">2</div>
              <span className="badge badge-pending">72h</span>
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Revisión y preview</h3>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              Preview protegido y asesoría de IA en imagen y texto. Máximo 2 correcciones.
            </p>
          </article>

          <article className="card ts-step ts-reveal">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="ts-step__num ts-step__num--tide">3</div>
              <span className="badge badge-seller">30 min</span>
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Ventana final</h3>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              Tras aprobación o timeout, 30 minutos para reclamar. Si no hay disputa, liquidación.
            </p>
          </article>

          <article className="card ts-step ts-reveal">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="ts-step__num ts-step__num--tide">4</div>
              <span className="badge badge-verified">96% / 4%</span>
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Desembolso dual</h3>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              96% a la billetera del Seller; 4% a la plataforma. Sin extras.
            </p>
          </article>
        </div>
      </section>

      <section
        className="ts-reveal"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 20,
        }}
      >
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <p className="ts-eyebrow">
              <DollarSign size={16} />
              <span>Invariante financiera</span>
            </p>
            <h3 className="ts-section__title" style={{ fontSize: '1.15rem' }}>
              Desglose exacto
            </h3>
            <p className="ts-lead" style={{ fontSize: 13, marginBottom: 18 }}>
              Comisión con <code>Math.floor(total * 0.04)</code>; el remanente íntegro va al Seller.
            </p>

            <div className="ts-split">
              <div className="ts-split__row">
                <span>Total orden</span>
                <span className="ts-split__value">
                  ${(order.paymentTerms.totalAmountUSDInCents / 100).toFixed(2)}
                </span>
              </div>
              <div className="ts-split__row ts-split__row--tide">
                <span>Seller (96%)</span>
                <span className="ts-split__value">
                  ${(split.freelancerPayoutUSDInCents / 100).toFixed(2)}
                </span>
              </div>
              <div className="ts-split__row ts-split__row--volt">
                <span>Plataforma (4%)</span>
                <span className="ts-split__value">
                  ${(split.platformFeeUSDInCents / 100).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--mist)' }}>
            <CheckCircle2 size={15} style={{ color: 'var(--tide)' }} />
            <span>
              Verificado en <code>@taskstream/shared-schemas</code>
            </span>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <p className="ts-eyebrow">
              <Cpu size={16} />
              <span>Fase 1 · specs</span>
            </p>
            <h3 className="ts-section__title" style={{ fontSize: '1.15rem' }}>
              Base lista para especificar
            </h3>
            <p className="ts-lead" style={{ fontSize: 13, marginBottom: 18 }}>
              Misma identidad visual en login, home, billetera y modo. Listo para cerrar SPECs de producto.
            </p>

            <div className="ts-spec-list">
              <div className="ts-spec-row">
                <span>SPEC-00 · Estructura</span>
                <span className="badge badge-verified">TESTED</span>
              </div>
              <div className="ts-spec-row">
                <span>SPEC-01 · Contratos Zod</span>
                <span className="badge badge-verified">TESTED</span>
              </div>
              <div className="ts-spec-row ts-spec-row--active">
                <span>SPEC-02 · Identidad</span>
                <span className="badge">EN CURSO</span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 18, display: 'flex', justifyContent: 'flex-end' }}>
            <Link href="/onboarding/wallet" className="btn btn-secondary" style={{ fontSize: 13 }}>
              <span>Ir a billetera</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>
    </PageReveal>
  );
}
