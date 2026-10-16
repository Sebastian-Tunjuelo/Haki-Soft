import Link from 'next/link';
import { mockTaskOrderCard, splitSingleBlockEscrow } from '@taskstream/shared-schemas';
import { Wallet, ArrowLeftRight, ShieldCheck, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';

export default function HomePage() {
  const order = mockTaskOrderCard();
  const split = splitSingleBlockEscrow(order.paymentTerms.totalAmountUSDInCents);

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* Hero Section */}
      <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--brand-blue)', fontSize: 13, marginBottom: 12 }}>
          <Sparkles size={16} />
          <span>Fase 1: Identidad Multimoneda en América y Motor 3D</span>
        </div>

        <h1 style={{ fontSize: 36, fontWeight: 700, color: '#ffffff', letterSpacing: '-0.02em', marginBottom: 12 }}>
          TaskStream AI · Protocolo de Confianza y Pagos en Escrow
        </h1>

        <p style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: 680 }}>
          Unificamos la identidad de contratantes (Buyers) y freelancers (Sellers) en el continente americano mediante Clerk v6 y verificación criptográfica de billetera sobre Open Payments.
        </p>

        {/* Action CTAs */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 24 }}>
          <Link href="/onboarding/wallet" className="btn btn-primary" style={{ padding: '12px 20px' }}>
            <Wallet size={17} />
            <span>Verificar Billetera Multimoneda</span>
            <ArrowRight size={15} />
          </Link>
          <Link href="/settings/mode" className="btn btn-secondary" style={{ padding: '12px 20px' }}>
            <ArrowLeftRight size={17} />
            <span>Alternar Modo Buyer / Seller</span>
          </Link>
          <Link href="/sign-in" className="btn btn-outline" style={{ padding: '12px 20px' }}>
            <ShieldCheck size={17} />
            <span>Inicio de Sesión Clerk</span>
          </Link>
        </div>
      </div>

      {/* Grid de Capacidades de SPEC-02 */}
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 600, color: '#ffffff', marginBottom: 16 }}>
          Capacidades Implementadas en SPEC-02 (Frontend FE-1 / FE-2)
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          {/* Card 1: Clerk */}
          <div className="card">
            <div style={{ color: 'var(--brand-blue)', marginBottom: 12 }}>
              <ShieldCheck size={24} />
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#ffffff', marginBottom: 6 }}>
              Identidad Clerk v6
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Autenticación segura con Google y GitHub. Rutas protegidas del lado del servidor con <code>await auth()</code> y middleware mínimo.
            </p>
            <div style={{ marginTop: 14 }}>
              <span className="badge badge-buyer">RF-01 · T-F1-FE1-01</span>
            </div>
          </div>

          {/* Card 2: Selector de Modo */}
          <div className="card">
            <div style={{ color: 'var(--brand-buyer)', marginBottom: 12 }}>
              <ArrowLeftRight size={24} />
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#ffffff', marginBottom: 6 }}>
              Selector de Modo Unificado
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Alterna entre <code>Buyer Mode</code> y <code>Seller Mode</code> persistiendo <code>User.activeMode</code> sin alterar las órdenes en curso.
            </p>
            <div style={{ marginTop: 14 }}>
              <span className="badge badge-buyer">RF-02 · T-F1-FE1-01</span>
            </div>
          </div>

          {/* Card 3: Wallet Verification */}
          <div className="card">
            <div style={{ color: 'var(--status-verified)', marginBottom: 12 }}>
              <Wallet size={24} />
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#ffffff', marginBottom: 6 }}>
              Verificación GNAP sin Pago
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Prueba de posesión con Subject Grant y hash SHA-256 en tiempo constante. Reemplazo atómico de la única billetera activa.
            </p>
            <div style={{ marginTop: 14 }}>
              <span className="badge badge-verified">RF-03 · T-F1-FE1-01</span>
            </div>
          </div>
        </div>
      </div>

      {/* Contratos Fundacionales (SPEC-01) */}
      <div className="card" style={{ background: 'var(--bg-subtle)' }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: '#ffffff', marginBottom: 10 }}>
          Contrato de Orden de Muestra y Reglas Financieras (SPEC-01)
        </h3>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14 }}>
          Una orden por <strong>{(order.paymentTerms.totalAmountUSDInCents / 100).toFixed(2)} USD</strong> se custodia en escrow y reparte al concluir:
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 16 }}>
          <div style={{ background: 'var(--surface)', padding: 12, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>96% para el Freelancer</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--status-verified)' }}>
              ${(split.freelancerPayoutUSDInCents / 100).toFixed(2)} USD
            </div>
          </div>
          <div style={{ background: 'var(--surface)', padding: 12, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>4% Comisión Plataforma</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--brand-blue)' }}>
              ${(split.platformFeeUSDInCents / 100).toFixed(2)} USD
            </div>
          </div>
          <div style={{ background: 'var(--surface)', padding: 12, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Relojes Independientes</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#cbd5e1' }}>
              7d · 24h · +7d · 32h · 30m
            </div>
          </div>
        </div>

        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
          <li style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <CheckCircle2 size={13} style={{ color: 'var(--status-verified)' }} /> Invariante: Máximo 2 correcciones globales (usadas: {order.revisionTerms.revisionsUsed}/{order.revisionTerms.maxRevisionsAllowed})
          </li>
          <li style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <CheckCircle2 size={13} style={{ color: 'var(--status-verified)' }} /> Invariante: Modalidad auditable exclusiva para {order.aiAuditableModality} en el MVP
          </li>
        </ul>
      </div>
    </div>
  );
}
