'use client';

import React, { useState } from 'react';
import { WalletLinkRequestSchema } from '@taskstream/shared-schemas';
import {
  readActiveWallet,
  readApiCode,
  readWalletChallenge,
  readWalletDiscovery,
  type ActiveWallet,
  type WalletChallenge,
  type WalletDiscovery,
} from '@/src/lib/identity-contract';
import {
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  RefreshCw,
  Clock,
  AlertTriangle,
} from 'lucide-react';

interface WalletVerificationProps {
  initialWallet?: ActiveWallet | null;
  serverCode?: string | null;
}

type VerificationStep = 'EMPTY' | 'DISCOVERING' | 'PENDING_REDIRECT' | 'VERIFIED' | 'FAILED_HASH' | 'EXPIRED';

const PAN_AMERICAN_PRESETS = [
  { country: '🇨🇴 Colombia (COP)', url: 'https://ilp.interledger-test.dev/colombia-contractor-cop' },
  { country: '🇺🇸 Estados Unidos (USD)', url: 'https://ilp.interledger-test.dev/us-freelancer-usd' },
  { country: '🇨🇦 Canadá (CAD)', url: 'https://ilp.interledger-test.dev/canada-studio-cad' },
  { country: '🇧🇷 Brasil (BRL)', url: 'https://ilp.interledger-test.dev/brasil-dev-brl' },
  { country: '🇲🇽 México (MXN)', url: 'https://ilp.interledger-test.dev/mexico-agency-mxn' },
];

function initialStep(wallet: ActiveWallet | null | undefined): VerificationStep {
  return wallet?.isVerified && wallet.isActive ? 'VERIFIED' : 'EMPTY';
}

export function WalletVerification({
  initialWallet = null,
  serverCode = null,
}: WalletVerificationProps) {
  const [walletUrl, setWalletUrl] = useState('');
  const [step, setStep] = useState<VerificationStep>(initialStep(initialWallet));
  const [discovery, setDiscovery] = useState<WalletDiscovery | null>(null);
  const [challenge, setChallenge] = useState<WalletChallenge | null>(null);
  const [activeWallet, setActiveWallet] = useState<ActiveWallet | null>(
    initialWallet?.isVerified && initialWallet.isActive ? initialWallet : null,
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(serverCode);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadWalletState = async () => {
    const res = await fetch('/api/v1/me/wallet');
    const data: unknown = await res.json();
    if (!res.ok) {
      setErrorMessage(readApiCode(data) ?? 'UNAUTHENTICATED');
      return;
    }
    const wallet = readActiveWallet(data);
    if (wallet?.isVerified && wallet.isActive) {
      setActiveWallet(wallet);
      setStep('VERIFIED');
      setDiscovery(null);
      setChallenge(null);
      setErrorMessage(null);
      return;
    }
    setErrorMessage('WALLET_NOT_VERIFIED');
  };

  const handleDiscover = async (urlToTest?: string) => {
    const targetUrl = urlToTest || walletUrl;
    setErrorMessage(null);

    const parsed = WalletLinkRequestSchema.safeParse({ walletAddress: targetUrl });
    if (!parsed.success) {
      setErrorMessage('WALLET_ADDRESS_INVALID');
      return;
    }

    setIsSubmitting(true);
    setStep('DISCOVERING');

    try {
      const res = await fetch('/api/v1/me/wallet/discovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: targetUrl }),
      });
      const discoveryBody: unknown = await res.json();
      if (!res.ok) {
        setErrorMessage(readApiCode(discoveryBody) ?? 'OPEN_PAYMENTS_UPSTREAM');
        setStep('EMPTY');
        return;
      }
      const discovered = readWalletDiscovery(discoveryBody);
      if (!discovered) {
        setErrorMessage('WALLET_ADDRESS_INVALID');
        setStep('EMPTY');
        return;
      }
      setDiscovery(discovered);

      const chalRes = await fetch('/api/v1/me/wallet/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: targetUrl }),
      });
      const challengeBody: unknown = await chalRes.json();
      if (!chalRes.ok) {
        const code = readApiCode(challengeBody) ?? 'OPEN_PAYMENTS_UPSTREAM';
        setErrorMessage(code);
        setStep(code === 'WALLET_CHALLENGE_EXPIRED' ? 'EXPIRED' : 'EMPTY');
        return;
      }
      const nextChallenge = readWalletChallenge(challengeBody);
      if (!nextChallenge || nextChallenge.status !== 'PENDING_REDIRECT') {
        setErrorMessage('OPEN_PAYMENTS_GRANT_NOT_PENDING');
        setStep('EMPTY');
        return;
      }
      setChallenge(nextChallenge);
      setStep('PENDING_REDIRECT');
    } catch {
      setErrorMessage('API_UNREACHABLE');
      setStep('EMPTY');
    } finally {
      setIsSubmitting(false);
    }
  };

  const continueToProvider = () => {
    if (!challenge) return;
    window.location.assign(challenge.interactRedirectUri);
  };

  const handleResetForm = () => {
    setStep('EMPTY');
    setDiscovery(null);
    setChallenge(null);
    setErrorMessage(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {!activeWallet && (
        <div
          style={{
            padding: '16px 20px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--status-pending-bg)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            display: 'flex',
            gap: 12,
            alignItems: 'flex-start',
          }}
        >
          <AlertTriangle size={20} style={{ color: 'var(--status-pending)', flexShrink: 0, marginTop: 2 }} />
          <div>
            <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
              Verificación requerida (WALLET_NOT_VERIFIED)
            </h4>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Sin una billetera verificada y activa no se puede publicar, ofertar ni contratar. La prueba de posesión la completa el proveedor en el callback de NestJS.
            </p>
          </div>
        </div>
      )}

      {activeWallet && (
        <div
          className="card"
          style={{
            background: 'rgba(16, 185, 129, 0.05)',
            borderColor: 'rgba(16, 185, 129, 0.3)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--status-verified-bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--status-verified)',
                }}
              >
                <ShieldCheck size={20} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Billetera activa
                </div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#ffffff' }}>
                  {activeWallet.assetCode} (escala {activeWallet.assetScale})
                </div>
              </div>
            </div>
            <span className="badge badge-verified">
              <span className="pulse-dot" /> isVerified · isActive
            </span>
          </div>
          <div className="code-block" style={{ marginBottom: 16 }}>
            {activeWallet.walletAddress}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="button" onClick={handleResetForm} className="btn btn-outline btn-sm" style={{ fontSize: 12 }}>
              <RefreshCw size={12} />
              <span>Reemplazar billetera activa</span>
            </button>
          </div>
        </div>
      )}

      {(step === 'EMPTY' || step === 'DISCOVERING') && (
        <div className="card">
          <h3 style={{ fontSize: 17, fontWeight: 600, marginBottom: 8, color: '#ffffff' }}>
            {activeWallet ? 'Reemplazar por una nueva billetera' : 'Vincular billetera multimoneda en América'}
          </h3>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
            Ingresa la URL HTTPS de tu billetera Open Payments. El descubrimiento y el Subject Grant los resuelve la API.
          </p>

          <div style={{ marginBottom: 20 }}>
            <label className="form-label" style={{ marginBottom: 8, display: 'block' }}>
              Direcciones de prueba en América
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {PAN_AMERICAN_PRESETS.map((preset) => (
                <button
                  key={preset.url}
                  type="button"
                  onClick={() => {
                    setWalletUrl(preset.url);
                    void handleDiscover(preset.url);
                  }}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: 12 }}
                  disabled={isSubmitting}
                >
                  <span>{preset.country}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="wallet-url">
              Dirección de billetera (walletAddress HTTPS)
            </label>
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                id="wallet-url"
                type="text"
                className="form-input"
                placeholder="$ilp.interledger-test.dev/tu-usuario"
                value={walletUrl}
                onChange={(event) => setWalletUrl(event.target.value)}
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => void handleDiscover()}
                className="btn btn-primary"
                disabled={isSubmitting || !walletUrl}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw size={15} />
                    <span>Descubriendo...</span>
                  </>
                ) : (
                  <>
                    <span>Descubrir</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </div>
          </div>

          {errorMessage && <ErrorBanner message={errorMessage} />}
        </div>
      )}

      {step === 'PENDING_REDIRECT' && discovery && challenge && (
        <div
          className="card"
          style={{
            background: 'rgba(245, 158, 11, 0.05)',
            borderColor: 'rgba(245, 158, 11, 0.3)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Clock size={20} style={{ color: 'var(--status-pending)' }} />
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: '#ffffff' }}>PENDING_REDIRECT</h3>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  Moneda descubierta: <strong>{discovery.assetCode}</strong> (escala {discovery.assetScale})
                </span>
              </div>
            </div>
            <span className="badge badge-pending">
              <span className="pulse-dot" /> PENDING_REDIRECT
            </span>
          </div>

          <div className="code-block" style={{ marginBottom: 12 }}>
            {challenge.challengeId}
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
            El navegador continúa en el proveedor. El retorno canónico es <code>GET /api/v1/auth/wallet/callback</code> en la API. Después vuelve aquí y comprueba la billetera activa.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            <button type="button" onClick={continueToProvider} className="btn btn-primary">
              <ExternalLink size={16} />
              <span>Continuar en la billetera</span>
            </button>
            <button type="button" onClick={() => void loadWalletState()} className="btn btn-outline" disabled={isSubmitting}>
              <RefreshCw size={16} />
              <span>Comprobar verificación</span>
            </button>
          </div>
          {errorMessage && <div style={{ marginTop: 12 }}><ErrorBanner message={errorMessage} /></div>}
        </div>
      )}

      {(step === 'FAILED_HASH' || step === 'EXPIRED') && (
        <div className="card" style={{ background: 'var(--status-failed-bg)', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <ShieldAlert size={22} style={{ color: 'var(--status-failed)' }} />
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#ffffff' }}>
              {step === 'FAILED_HASH' ? 'GNAP_HASH_MISMATCH' : 'WALLET_CHALLENGE_EXPIRED'}
            </h3>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
            {errorMessage ?? 'La verificación no se completó. La billetera anterior, si existía, sigue activa.'}
          </p>
          <button type="button" onClick={handleResetForm} className="btn btn-secondary btn-sm">
            Intentar con otra dirección
          </button>
        </div>
      )}
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      style={{
        padding: '12px 16px',
        borderRadius: 'var(--radius-sm)',
        fontSize: 13,
        background: 'var(--status-failed-bg)',
        color: 'var(--status-failed)',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        display: 'flex',
        gap: 8,
        alignItems: 'center',
      }}
    >
      <ShieldAlert size={16} />
      <span>{message}</span>
    </div>
  );
}
