'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ShieldCheck, Wallet, ArrowLeftRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { readActiveMode, readActiveWallet, readSessionUser } from '@/src/lib/identity-contract';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [activeMode, setActiveMode] = useState<'BUYER' | 'SELLER'>('BUYER');
  const [hasActiveWallet, setHasActiveWallet] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/v1/auth/session')
      .then((res) => res.json())
      .then((data: unknown) => {
        if (cancelled) return;
        const user = readSessionUser(data);
        setSessionEmail(user?.email ?? null);
        if (user) setActiveMode(user.activeMode);
        setSessionLoaded(true);
      })
      .catch(() => {
        if (!cancelled) {
          setSessionEmail(null);
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
      return;
    }

    let cancelled = false;
    fetch('/api/v1/me/mode')
      .then((res) => res.json())
      .then((data: unknown) => {
        const mode = readActiveMode(data);
        if (!cancelled && mode) setActiveMode(mode);
      })
      .catch(() => {});

    fetch('/api/v1/me/wallet')
      .then((res) => res.json())
      .then((data: unknown) => {
        const wallet = readActiveWallet(data);
        if (!cancelled) setHasActiveWallet(Boolean(wallet?.isVerified && wallet.isActive));
      })
      .catch(() => {});

    return () => {
      cancelled = true;
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
              <span
                style={{
                  fontSize: 10,
                  background: 'var(--bg-subtle)',
                  padding: '2px 6px',
                  borderRadius: 4,
                  border: '1px solid var(--border)',
                  color: 'var(--text-muted)',
                }}
              >
                Fase 1 · SPEC-02
              </span>
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
              href="/onboarding/wallet"
              className={`nav-link ${pathname === '/onboarding/wallet' ? 'active' : ''}`}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Wallet size={15} />
              <span>Billetera</span>
              {hasActiveWallet && (
                <span className="badge badge-verified" style={{ padding: '2px 6px', fontSize: 10 }}>
                  <span className="pulse-dot" /> Activa
                </span>
              )}
            </Link>
            <Link
              href="/settings/mode"
              className={`nav-link ${pathname === '/settings/mode' ? 'active' : ''}`}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <ArrowLeftRight size={15} />
              <span>Modo</span>
              {sessionEmail && (
                <span
                  className={`badge ${activeMode === 'BUYER' ? 'badge-buyer' : 'badge-seller'}`}
                  style={{ padding: '2px 6px', fontSize: 10 }}
                >
                  {activeMode}
                </span>
              )}
            </Link>
          </nav>

          <div className="header-actions">
            {!sessionLoaded ? (
              <div style={{ width: 80, height: 32, background: 'var(--surface)', borderRadius: 'var(--radius-sm)' }} />
            ) : sessionEmail ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
