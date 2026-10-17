import { ModeSwitcher } from '@/src/components/mode-switcher';
import { PageReveal } from '@/src/components/page-reveal';
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
    <PageReveal className="ts-page ts-page__narrow">
      <header className="ts-reveal" style={{ borderBottom: '1px solid rgba(236, 235, 230, 0.1)', paddingBottom: 20 }}>
        <p className="ts-eyebrow">
          <ArrowLeftRight size={16} />
          <span>Cuenta · modo activo</span>
        </p>
        <h1 className="ts-title" style={{ fontSize: 'clamp(1.5rem, 2.5vw, 1.9rem)' }}>
          Buyer o Seller
        </h1>
        <p className="ts-lead">
          El modo vigente se lee de la API autenticada. Cambiarlo no mueve órdenes que ya están en curso.
        </p>

        {isAuthenticated ? (
          <p className="ts-session-ok">
            <UserCheck size={14} />
            <span>Sesión activa</span>
          </p>
        ) : (
          <div className="ts-callout">
            <span>Sin sesión no se muestra el selector de modo.</span>
            <Link href="/sign-in" className="btn btn-primary btn-sm">
              Iniciar sesión
            </Link>
          </div>
        )}
      </header>

      {isAuthenticated ? (
        <div className="ts-reveal">
          <ModeSwitcher initialMode={initialMode} serverCode={serverCode} />
        </div>
      ) : null}
    </PageReveal>
  );
}
