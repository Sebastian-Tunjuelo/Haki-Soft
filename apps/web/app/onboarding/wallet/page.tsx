import { auth } from '@clerk/nextjs/server';
import { WalletVerification } from '@/src/components/wallet-verification';
import { readActiveWallet, readApiCode } from '@/src/lib/identity-contract';
import { readMyJson } from '@/src/lib/identity-proxy';
import { Wallet, UserCheck } from 'lucide-react';
import Link from 'next/link';

export default async function WalletOnboardingPage() {
  let userId: string | null = null;
  try {
    const session = await auth();
    userId = session.userId;
  } catch {
    userId = null;
  }
  const isAuthenticated = Boolean(userId);

  let initialWallet = null;
  let serverCode: string | null = null;
  if (isAuthenticated) {
    const result = await readMyJson('/api/v1/me/wallet');
    initialWallet = readActiveWallet(result.body);
    if (result.status >= 400) serverCode = readApiCode(result.body);
  }

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--brand-blue)', fontSize: 13, marginBottom: 6 }}>
          <Wallet size={16} />
          <span>Onboarding financiero · SPEC-02</span>
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#ffffff', marginBottom: 8 }}>
          Vinculación y verificación de billetera multimoneda
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          Conecta tu billetera de Open Payments. La prueba de posesión la confirma el callback de la API; esta pantalla solo inicia el descubrimiento y abre el proveedor.
        </p>

        {isAuthenticated ? (
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--status-verified)' }}>
            <UserCheck size={14} />
            <span>Sesión Clerk activa</span>
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
            <span>Sin sesión no se muestra el formulario de billetera.</span>
            <Link href="/sign-in" className="btn btn-primary btn-sm" style={{ fontSize: 11, padding: '4px 10px' }}>
              Iniciar sesión
            </Link>
          </div>
        )}
      </div>

      {isAuthenticated ? (
        <WalletVerification
          isClerkAuthenticated
          initialWallet={initialWallet}
          serverCode={serverCode}
        />
      ) : null}
    </div>
  );
}
