'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { readActiveWallet, readSessionUser } from '@/src/lib/identity-contract';
import { ThemeToggle } from '@/src/components/theme-toggle';
import { MeridiaPrismLogo } from '@/src/components/brand/meridia-prism-logo';

const SARA_PORTRAIT_URL =
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=240&q=85';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [sessionName, setSessionName] = useState<string | null>(null);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [hasActiveWallet, setHasActiveWallet] = useState<boolean>(false);
  const [demoBalanceUSDInCents, setDemoBalanceUSDInCents] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/v1/auth/session')
      .then((res) => res.json())
      .then((data: unknown) => {
        if (cancelled) return;
        const user = readSessionUser(data);
        setSessionEmail(user?.email ?? null);
        setSessionName(user?.displayName ?? null);
        setSessionLoaded(true);
      })
      .catch(() => {
        if (!cancelled) {
          setSessionEmail(null);
          setSessionName(null);
          setSessionLoaded(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  useEffect(() => {
    if (!sessionLoaded || !sessionEmail) {
      setHasActiveWallet(false);
      setDemoBalanceUSDInCents(null);
      return;
    }

    let cancelled = false;
    fetch('/api/v1/me/wallet')
      .then((res) => res.json())
      .then((data: unknown) => {
        const wallet = readActiveWallet(data);
        if (!cancelled) setHasActiveWallet(Boolean(wallet?.isVerified && wallet.isActive));
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      clearInterval(poll);
    };
  }, [pathname, sessionLoaded, sessionEmail]);

  const displayUserLabel = sessionName || (sessionEmail ? sessionEmail.split('@')[0] : 'Sara M.');

  return (
    <header className="app-header">
      <div className="app-container">
        <div className="header-inner">
          <Link href="/" className="logo-group" aria-label="MERIDIA — Inicio">
            <MeridiaPrismLogo size={40} showWordmark />
          </Link>

          <nav className="nav-links" aria-label="Navegación principal de Meridia">
            <Link
              href="/"
              className={`nav-link ${pathname === '/' ? 'active' : ''}`}
            >
              <span>Inicio</span>
            </Link>
            <Link
              href="/marketplace"
              className={`nav-link ${pathname?.startsWith('/marketplace') ? 'active' : ''}`}
            >
              <span>Marketplace</span>
            </Link>
            <Link
              href="/onboarding/wallet"
              className={`nav-link ${pathname === '/onboarding/wallet' ? 'active' : ''}`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              <span>Billetera</span>
              <span className="nav-wallet-active-pill">
                {hasActiveWallet ? 'Activa' : 'Activa'}
              </span>
            </Link>
            {sessionEmail ? (
              <Link
                href="/activity"
                className={`nav-link ${pathname?.startsWith('/activity') ? 'active' : ''}`}
              >
                <span>Actividad</span>
              </Link>
            ) : null}
          </nav>

          <div className="header-actions">
            {!sessionLoaded ? (
              <div style={{ width: 112, height: 40, background: 'var(--surface)', borderRadius: 'var(--radius-full)' }} />
            ) : sessionEmail ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="nav-user-pill" title={sessionEmail}>
                  <span className="nav-user-pill__name">{displayUserLabel}</span>
                  <img
                    src={SARA_PORTRAIT_URL}
                    alt={displayUserLabel}
                    className="nav-user-pill__photo"
                  />
                </span>
                <ThemeToggle />
                <button
                  className="btn btn-outline btn-sm"
                  type="button"
                  onClick={() => {
                    void fetch('/api/v1/auth/logout', { method: 'POST' }).then(() => {
                      setSessionEmail(null);
                      setSessionName(null);
                      router.refresh();
                    });
                  }}
                >
                  Salir
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Link href="/onboarding/wallet" className="nav-user-pill" title="Perfil unificado Cliente & Freelancer">
                  <span className="nav-user-pill__name">Sara M.</span>
                  <img
                    src={SARA_PORTRAIT_URL}
                    alt="Sara M."
                    className="nav-user-pill__photo"
                  />
                </Link>
                <Link href="/sign-in" className="btn btn-outline btn-sm">
                  Iniciar sesión
                </Link>
                <Link href="/sign-up" className="btn btn-primary btn-sm">
                  Registrarse
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
