import { ModeSwitcher } from '@/src/components/mode-switcher';
import { readActiveMode, readApiCode } from '@/src/lib/identity-contract';
import { hasLocalSession, readMyJson } from '@/src/lib/identity-proxy';
import { ArrowLeftRight, UserCheck } from 'lucide-react';
import Link from 'next/link';

export default async function ModeSettingsPage() {
  const isAuthenticated = await hasLocalSession();

  let initialMode: 'BUYER' | 'SELLER' = 'BUYER';
  let serverCode: string | null = null;
  if (isAuthenticated) {
    const result = await readMyJson('/api/v1/me/mode');
    initialMode = readActiveMode(result.body) ?? 'BUYER';
    if (result.status >= 400) serverCode = readApiCode(result.body);
  }

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--brand-blue)', fontSize: 13, marginBottom: 6 }}>
          <ArrowLeftRight size={16} />
          <span>Configuración de cuenta</span>
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#ffffff', marginBottom: 8 }}>
          Selector de modo: Buyer Mode / Seller Mode
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          El modo vigente se lee de la API autenticada. Cambiarlo no transfiere órdenes que ya están en curso.
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
            <span>Sin sesión no se muestra el selector de modo.</span>
            <Link href="/sign-in" className="btn btn-primary btn-sm" style={{ fontSize: 11, padding: '4px 10px' }}>
              Iniciar sesión
            </Link>
          </div>
        )}
      </div>

      {isAuthenticated ? (
        <ModeSwitcher initialMode={initialMode} serverCode={serverCode} />
      ) : null}
    </div>
  );
}
