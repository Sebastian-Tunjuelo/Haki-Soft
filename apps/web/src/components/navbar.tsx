'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs';
import { ShieldCheck, Wallet, ArrowLeftRight } from 'lucide-react';
import { useEffect, useState } from 'react';

export function Navbar() {
  const pathname = usePathname();
  const { isSignedIn, isLoaded } = useAuth();
  const [activeMode, setActiveMode] = useState<'BUYER' | 'SELLER'>('BUYER');
  const [hasActiveWallet, setHasActiveWallet] = useState<boolean>(false);

  useEffect(() => {
    // Sincronizar modo y estado de wallet
    fetch('/api/v1/me/mode')
      .then((res) => res.json())
      .then((data) => {
        if (data?.activeMode) setActiveMode(data.activeMode);
      })
      .catch(() => {});

    fetch('/api/v1/me/wallet')
      .then((res) => res.json())
      .then((data) => {
        if (data?.activeWallet) setHasActiveWallet(true);
      })
      .catch(() => {});
  }, [pathname]);

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
              <span
                className={`badge ${activeMode === 'BUYER' ? 'badge-buyer' : 'badge-seller'}`}
                style={{ padding: '2px 6px', fontSize: 10 }}
              >
                {activeMode}
              </span>
            </Link>
          </nav>

          <div className="header-actions">
            {!isLoaded ? (
              <div style={{ width: 80, height: 32, background: 'var(--surface)', borderRadius: 'var(--radius-sm)' }} />
            ) : isSignedIn ? (
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
                  Clerk v6
                </span>
                <UserButton
                  appearance={{
                    elements: {
                      userButtonAvatarBox: { width: 32, height: 32 },
                    },
                  }}
                />
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <SignInButton mode="modal">
                  <button className="btn btn-outline btn-sm">Iniciar Sesión</button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="btn btn-primary btn-sm">Registrarse</button>
                </SignUpButton>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
