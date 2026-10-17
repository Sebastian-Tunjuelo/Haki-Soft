'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ShieldCheck, Wallet } from 'lucide-react';
import { useEffect, useState } from 'react';
import { readActiveWallet, readSessionUser } from '@/src/lib/identity-contract';
import { formatUsd } from '@/src/lib/api-client';
import { useHomeTheme } from '@/src/lib/use-home-theme';
import type { HomeTheme } from '@/src/lib/home-theme';

function ThemeToggleButton({ theme, onToggle }: { theme: HomeTheme; onToggle: () => void }) {
  return (
    <button
      className="theme-toggle"
      type="button"
      aria-label={theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
      onClick={onToggle}
    >
      {theme === 'dark' ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        </svg>
      )}
    </button>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useHomeTheme();
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
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
        setIsAdmin(user?.platformRole === 'ADMIN');
        setSessionLoaded(true);
      })
      .catch(() => {
        if (!cancelled) {
          setSessionEmail(null);
          setIsAdmin(false);
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
    const pullWallet = () => {
      fetch('/api/v1/me/wallet')
        .then((res) => res.json())
        .then((data: unknown) => {
          const wallet = readActiveWallet(data);
          if (cancelled) return;
          setHasActiveWallet(Boolean(wallet?.isVerified && wallet.isActive));
          setDemoBalanceUSDInCents(
            wallet?.isVerified && wallet.isActive ? wallet.demoBalanceUSDInCents : null,
          );
        })
        .catch(() => {});
    };
    pullWallet();
    const poll = setInterval(pullWallet, 4_000);
    return () => {
      cancelled = true;
      clearInterval(poll);
    };
  }, [pathname, sessionLoaded, sessionEmail]);

  return (
    <header className="app-header">
      <div className="app-container">
        <div className="header-inner">
          <Link href="/" className="logo-group">
            <div className="logo-mark">TS</div>
            <div className="logo-title">
              <span>TaskStream</span>
              <span style={{ color: 'var(--brand-blue)', fontWeight: 700 }}>AI</span>
            </div>
          </Link>

          <nav className="nav-links">
            <Link
              href="/"
              className={`nav-link ${pathname === '/' ? 'active' : ''}`}
            >
              Inicio
            </Link>
            <Link
              href="/marketplace"
              className={`nav-link ${pathname?.startsWith('/marketplace') ? 'active' : ''}`}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <ShieldCheck size={15} />
              <span>Marketplace</span>
            </Link>
            {sessionEmail ? (
              <Link
                href="/activity"
                className={`nav-link ${pathname?.startsWith('/activity') ? 'active' : ''}`}
              >
                Actividad
              </Link>
            ) : null}
            {isAdmin ? (
              <Link
                href="/admin/disputes"
                className={`nav-link ${pathname?.startsWith('/admin') ? 'active' : ''}`}
              >
                Admin
              </Link>
            ) : null}
            <Link
              href="/onboarding/wallet"
              className={`nav-link ${pathname === '/onboarding/wallet' ? 'active' : ''}`}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Wallet size={15} />
              <span>Billetera</span>
              {hasActiveWallet && demoBalanceUSDInCents !== null ? (
                <span className="badge badge-verified" style={{ padding: '2px 6px', fontSize: 10 }}>
                  {formatUsd(demoBalanceUSDInCents)}
                </span>
              ) : hasActiveWallet ? (
                <span className="badge badge-verified" style={{ padding: '2px 6px', fontSize: 10 }}>
                  <span className="pulse-dot" /> Activa
                </span>
              ) : null}
            </Link>
          </nav>

          <div className="header-actions">
            {!sessionLoaded ? (
              <div className="header-auth-cluster">
                <ThemeToggleButton theme={theme} onToggle={toggleTheme} />
                <div style={{ width: 80, height: 32, background: 'var(--surface)', borderRadius: 'var(--radius-sm)' }} />
              </div>
            ) : sessionEmail ? (
              <div className="header-auth-cluster">
                <span
                  style={{
                    fontSize: 12,
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <ShieldCheck size={14} style={{ color: 'var(--status-verified)' }} />
                  {sessionEmail}
                </span>
                <ThemeToggleButton theme={theme} onToggle={toggleTheme} />
                <button
                  className="btn btn-outline btn-sm"
                  type="button"
                  onClick={() => {
                    void fetch('/api/v1/auth/logout', { method: 'POST' }).then(() => {
                      setSessionEmail(null);
                      router.refresh();
                    });
                  }}
                >
                  Salir
                </button>
              </div>
            ) : (
              <div className="header-auth-cluster">
                <ThemeToggleButton theme={theme} onToggle={toggleTheme} />
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
