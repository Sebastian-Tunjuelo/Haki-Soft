import { auth } from '@clerk/nextjs/server';
import { WalletVerification } from '@/src/components/wallet-verification';
import { Wallet, ShieldCheck, UserCheck } from 'lucide-react';
import Link from 'next/link';

export default async function WalletOnboardingPage() {
  const { userId } = await auth();
  const isAuthenticated = Boolean(userId);

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header de la Vista */}
      <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--brand-blue)', fontSize: 13, marginBottom: 6 }}>
          <Wallet size={16} />
          <span>Onboarding Financiero · SPEC-02 §6.1</span>
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#ffffff', marginBottom: 8 }}>
          Vinculación y Verificación de Billetera Multimoneda
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          Conecta tu billetera de Open Payments en cualquier país de América (USD, COP, CAD, BRL, MXN). La prueba de posesión se valida criptográficamente mediante una concesión GNAP Subject Grant y comparación SHA-256 en tiempo constante, sin mover dinero.
        </p>

        {isAuthenticated ? (
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--status-verified)' }}>
            <UserCheck size={14} />
            <span>Identidad Clerk vinculada: <code>{userId}</code></span>
          </div>
        ) : (
          <div
            style={{
              marginTop: 12,
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: 12,
              color: 'var(--text-muted)',
            }}
          >
            <span>Sesión anónima (previsualización de adaptador MSW para desarrollo de FE-1).</span>
            <Link href="/sign-in" className="btn btn-primary btn-sm" style={{ fontSize: 11, padding: '4px 10px' }}>
              Iniciar Sesión con Google/GitHub
            </Link>
          </div>
        )}
      </div>

      {/* Componente Interactivo de Verificación FE-1 / FE-2 */}
      <WalletVerification isClerkAuthenticated={isAuthenticated} />
    </div>
  );
}
