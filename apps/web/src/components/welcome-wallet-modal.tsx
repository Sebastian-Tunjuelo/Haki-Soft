'use client';

import { useEffect, useId, useState, type FormEvent } from 'react';
import { WalletLinkRequestSchema } from '@taskstream/shared-schemas';
import { ExternalLink, ShieldAlert, Wallet } from 'lucide-react';
import { readApiCode, readWalletChallenge, readWalletDiscovery } from '@/src/lib/identity-contract';

/** Portal oficial para crear/obtener la wallet address pública (nunca la clave privada). */
export const INTERLEDGER_TEST_WALLET_URL = 'https://wallet.interledger-test.dev/';
export const INTERLEDGER_WALLET_DOCS_URL = 'https://openpayments.dev/es/overview/getting-started/';

interface WelcomeWalletModalProps {
  open: boolean;
  displayName?: string | null;
  onClose: () => void;
  /** Tras iniciar el challenge o si el usuario omite por ahora. */
  onDone: () => void;
}

/**
 * Overlay post-registro (opción 1): da la bienvenida y pide la wallet pública
 * con acceso directo a Interledger Test Wallet.
 */
export function WelcomeWalletModal({ open, displayName, onClose, onDone }: WelcomeWalletModalProps) {
  const titleId = useId();
  const [walletUrl, setWalletUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [redirectUri, setRedirectUri] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      setWalletUrl('');
      setError(null);
      setRedirectUri(null);
      setPending(false);
    }
  }, [open]);

  if (!open) return null;

  const greeting = displayName?.trim() ? `, ${displayName.trim().split(/\s+/)[0]}` : '';

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const parsed = WalletLinkRequestSchema.safeParse({ walletAddress: walletUrl.trim() });
    if (!parsed.success) {
      setError('Usa una URL https válida de wallet (ej. https://ilp.interledger-test.dev/tu-usuario).');
      return;
    }

    setPending(true);
    try {
      const discoveryRes = await fetch('/api/v1/me/wallet/discovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: parsed.data.walletAddress }),
      });
      const discoveryBody: unknown = await discoveryRes.json().catch(() => null);
      if (!discoveryRes.ok) {
        setError(messageFor(readApiCode(discoveryBody) ?? 'OPEN_PAYMENTS_UPSTREAM'));
        return;
      }
      if (!readWalletDiscovery(discoveryBody)) {
        setError('No se pudo leer los metadatos de la billetera.');
        return;
      }

      const challengeRes = await fetch('/api/v1/me/wallet/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: parsed.data.walletAddress }),
      });
      const challengeBody: unknown = await challengeRes.json().catch(() => null);
      if (!challengeRes.ok) {
        setError(messageFor(readApiCode(challengeBody) ?? 'OPEN_PAYMENTS_UPSTREAM'));
        return;
      }
      const challenge = readWalletChallenge(challengeBody);
      if (!challenge || challenge.status !== 'PENDING_REDIRECT') {
        setError('No se pudo iniciar la verificación de titularidad.');
        return;
      }
      setRedirectUri(challenge.interactRedirectUri);
    } catch {
      setError('No se pudo contactar la API. Revisa que el backend esté en marcha.');
    } finally {
      setPending(false);
    }
  }

  function continueToProvider() {
    if (!redirectUri) return;
    window.location.assign(redirectUri);
  }

  return (
    <div
      role="presentation"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 90,
        background: 'rgba(2, 6, 23, 0.74)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 460,
          maxHeight: 'min(90vh, 720px)',
          overflow: 'auto',
          background: 'var(--surface-elevated)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
          padding: 22,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 'var(--radius-md)',
                background: 'rgba(59, 130, 246, 0.15)',
                color: 'var(--brand-blue)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Wallet size={20} />
            </div>
            <div>
              <h2 id={titleId} style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
                Bienvenido{greeting} a TaskStream AI
              </h2>
              <p style={{ margin: '8px 0 0', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                Nos alegra tenerte aquí. Estás a un paso de publicar Gigs, ofertar y contratar: solo falta vincular
                tu <strong style={{ color: 'var(--text-primary)' }}>wallet address pública</strong> de Open Payments.
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar" style={iconCloseStyle}>
            ×
          </button>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 10,
            alignItems: 'flex-start',
            padding: '12px 14px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--status-failed-bg)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
          }}
        >
          <ShieldAlert size={18} style={{ color: 'var(--status-failed)', flexShrink: 0, marginTop: 2 }} />
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            <strong style={{ color: 'var(--text-primary)' }}>Importante:</strong> pega solo tu dirección pública (
            <code style={{ fontSize: 12 }}>https://…</code>). Nunca copies ni compartas tu llave privada, seed phrase
            ni archivos <code style={{ fontSize: 12 }}>.key</code>.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>
            ¿Aún no tienes una? Créala en la Interledger Test Wallet y copia la URL pública de tu cuenta:
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <a
              href={INTERLEDGER_TEST_WALLET_URL}
              target="_blank"
              rel="noreferrer"
              className="btn btn-primary"
              style={{ fontSize: 13, padding: '8px 12px' }}
            >
              <ExternalLink size={14} />
              Abrir Test Wallet
            </a>
            <a
              href={INTERLEDGER_WALLET_DOCS_URL}
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary"
              style={{ fontSize: 13, padding: '8px 12px' }}
            >
              Guía Open Payments
            </a>
          </div>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.45 }}>
            En &quot;Wallet Address list&quot;, copia el valor a la izquierda de Edit (Payment Pointer), p. ej.{' '}
            <code>$ilp.interledger-test.dev/dolarsito</code>. Equivale a{' '}
            <code>https://ilp.interledger-test.dev/dolarsito</code>. No necesitas &quot;Register POS&quot; solo para
            vincular en TaskStream.
          </p>
        </div>

        {redirectUri ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ margin: 0, fontSize: 14, color: 'var(--status-verified)' }}>
              Billetera descubierta. Confirma la titularidad en el proveedor (Subject Grant).
            </p>
            <button type="button" className="btn btn-primary" onClick={continueToProvider}>
              Continuar en el proveedor de billetera
            </button>
            <button type="button" onClick={onDone} style={textLinkStyle}>
              Lo haré más tarde
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
              Wallet address pública / Payment Pointer
              <input
                required
                type="text"
                value={walletUrl}
                onChange={(event) => setWalletUrl(event.target.value)}
                placeholder="$ilp.interledger-test.dev/tu-usuario"
                autoComplete="off"
                style={fieldStyle}
              />
            </label>
            {error ? <p style={{ margin: 0, color: '#f87171', fontSize: 13 }}>{error}</p> : null}
            <button className="btn btn-primary" type="submit" disabled={pending}>
              {pending ? 'Verificando…' : 'Vincular y verificar wallet'}
            </button>
            <button type="button" onClick={onDone} style={textLinkStyle}>
              Continuar sin wallet por ahora
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function messageFor(code: string): string {
  if (code === 'WALLET_ADDRESS_INVALID') return 'La dirección de wallet no es válida (debe ser https://).';
  if (code === 'WALLET_ADDRESS_IN_USE') return 'Esa wallet ya está vinculada a otra cuenta.';
  if (code === 'WALLET_ADDRESS_NOT_FOUND') return 'No encontramos esa wallet. Revisa la URL o créala en la Test Wallet.';
  if (code === 'ACTIVE_WALLET_CHALLENGE_PENDING') return 'Ya hay una verificación en curso. Termínala o espera a que expire.';
  if (code === 'UNAUTHENTICATED') return 'Tu sesión expiró. Vuelve a iniciar sesión.';
  if (code === 'API_UNREACHABLE') return 'No se pudo contactar la API.';
  return `No se pudo vincular la wallet (${code}).`;
}

const fieldStyle = {
  background: 'var(--bg-subtle)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--text-primary)',
  padding: '10px 12px',
  fontSize: 14,
};

const iconCloseStyle = {
  background: 'transparent',
  border: '1px solid var(--border)',
  color: 'var(--text-secondary)',
  borderRadius: 'var(--radius-sm)',
  width: 32,
  height: 32,
  cursor: 'pointer',
  flexShrink: 0,
};

const textLinkStyle = {
  background: 'transparent',
  border: 0,
  color: 'var(--text-muted)',
  cursor: 'pointer',
  fontSize: 13,
  textAlign: 'left' as const,
  padding: 0,
};
