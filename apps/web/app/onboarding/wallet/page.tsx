import { WalletVerification } from '@/src/components/wallet-verification';
import { readActiveWallet, readApiCode } from '@/src/lib/identity-contract';
import { hasLocalSession, readMyJson } from '@/src/lib/identity-proxy';
import { Wallet, UserCheck, ShieldCheck, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export default async function WalletOnboardingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const status = typeof params.status === 'string' ? params.status : null;
  const code = typeof params.code === 'string' ? params.code : null;
  const walletParam = typeof params.wallet === 'string' ? params.wallet : null;

  const isAuthenticated = await hasLocalSession();

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
          <span>Onboarding financiero</span>
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#ffffff', marginBottom: 8 }}>
          Vinculación y verificación de billetera multimoneda
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          Puedes pegar la URL <code>https://ilp.interledger-test.dev/…</code> o el Payment Pointer{' '}
          <code>$ilp.interledger-test.dev/…</code> (el de la izquierda de Edit en la Test Wallet). Nunca compartas tu
          llave privada.
        </p>

        {isAuthenticated ? (
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--status-verified)' }}>
            <UserCheck size={14} />
            <span>Sesión activa</span>
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

      {status === 'verified' ? (
        <div
          style={{
            padding: '14px 16px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--status-verified-bg)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            display: 'flex',
            gap: 10,
            alignItems: 'flex-start',
          }}
        >
          <ShieldCheck size={18} style={{ color: 'var(--status-verified)', flexShrink: 0, marginTop: 2 }} />
          <div>
            <strong style={{ color: 'var(--text-primary)' }}>Billetera verificada</strong>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
              {walletParam
                ? `Titularidad confirmada para ${walletParam}. Ya puedes publicar Gigs y tareas.`
                : 'Titularidad confirmada. Ya puedes publicar Gigs y tareas.'}
            </p>
            <Link href="/marketplace" style={{ display: 'inline-block', marginTop: 8, color: 'var(--brand-blue)', fontSize: 13 }}>
              Ir al marketplace →
            </Link>
          </div>
        </div>
      ) : null}

      {status === 'error' ? (
        <div
          style={{
            padding: '14px 16px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--status-failed-bg)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            display: 'flex',
            gap: 10,
            alignItems: 'flex-start',
          }}
        >
          <ShieldAlert size={18} style={{ color: 'var(--status-failed)', flexShrink: 0, marginTop: 2 }} />
          <div>
            <strong style={{ color: 'var(--text-primary)' }}>No se pudo completar la verificación</strong>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
              {callbackMessage(code)}. Puedes reintentar el descubrimiento desde el formulario de abajo.
            </p>
          </div>
        </div>
      ) : null}

      {isAuthenticated ? (
        <WalletVerification initialWallet={initialWallet} serverCode={serverCode} />
      ) : null}
    </div>
  );
}

function callbackMessage(code: string | null): string {
  if (code === 'GNAP_HASH_MISMATCH') {
    return 'El hash GNAP no coincidió. Reinicia la verificación desde el formulario (un challenge no se reutiliza).';
  }
  if (code === 'WALLET_CHALLENGE_EXPIRED') return 'El reto de verificación expiró. Genera uno nuevo.';
  if (code === 'GNAP_INTERACT_ALREADY_USED') return 'Esa interacción ya se usó. Genera un reto nuevo.';
  if (code === 'GNAP_SUBJECT_NOT_CONFIRMED') return 'El proveedor no confirmó la titularidad de esa wallet.';
  if (code) return `Código: ${code}`;
  return 'Error desconocido en el callback';
}
