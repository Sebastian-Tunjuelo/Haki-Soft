'use client';

import React, { useState, useEffect } from 'react';
import { WalletLinkRequestSchema } from '@taskstream/shared-schemas';
import {
  WalletDiscovery,
  WalletChallenge,
  ActiveUserWallet,
} from '@/src/lib/wallet-mock-store';
import {
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  RefreshCw,
  Clock,
  Sparkles,
  AlertTriangle,
  History,
  Lock,
} from 'lucide-react';

interface WalletVerificationProps {
  isClerkAuthenticated: boolean;
}

type VerificationStep = 'EMPTY' | 'DISCOVERING' | 'PENDING_REDIRECT' | 'VERIFIED' | 'FAILED_HASH' | 'EXPIRED';

const PAN_AMERICAN_PRESETS = [
  {
    country: '🇨🇴 Colombia (COP)',
    url: 'https://ilp.interledger-test.dev/colombia-contractor-cop',
    assetCode: 'COP',
  },
  {
    country: '🇺🇸 Estados Unidos (USD)',
    url: 'https://ilp.interledger-test.dev/us-freelancer-usd',
    assetCode: 'USD',
  },
  {
    country: '🇨🇦 Canadá (CAD)',
    url: 'https://ilp.interledger-test.dev/canada-studio-cad',
    assetCode: 'CAD',
  },
  {
    country: '🇧🇷 Brasil (BRL)',
    url: 'https://ilp.interledger-test.dev/brasil-dev-brl',
    assetCode: 'BRL',
  },
  {
    country: '🇲🇽 México (MXN)',
    url: 'https://ilp.interledger-test.dev/mexico-agency-mxn',
    assetCode: 'MXN',
  },
];

export function WalletVerification({ isClerkAuthenticated }: WalletVerificationProps) {
  const [walletUrl, setWalletUrl] = useState('');
  const [step, setStep] = useState<VerificationStep>('EMPTY');
  const [discovery, setDiscovery] = useState<WalletDiscovery | null>(null);
  const [challenge, setChallenge] = useState<WalletChallenge | null>(null);
  const [activeWallet, setActiveWallet] = useState<ActiveUserWallet | null>(null);
  const [previousWallets, setPreviousWallets] = useState<ActiveUserWallet[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cargar billetera actual
  const loadWalletState = async () => {
    try {
      const res = await fetch('/api/v1/me/wallet');
      const data = await res.json();
      if (data?.activeWallet) {
        setActiveWallet(data.activeWallet);
        setStep('VERIFIED');
      }
      if (data?.previousWallets) {
        setPreviousWallets(data.previousWallets);
      }
    } catch {
      // Ignorar en arranque
    }
  };

  useEffect(() => {
    loadWalletState();
  }, []);

  // Paso 1: Descubrimiento de Wallet
  const handleDiscover = async (urlToTest?: string) => {
    const targetUrl = urlToTest || walletUrl;
    setErrorMessage(null);

    // Validación de contrato con WalletLinkRequestSchema
    const parsed = WalletLinkRequestSchema.safeParse({ walletAddress: targetUrl });
    if (!parsed.success) {
      setErrorMessage('La dirección debe ser una URL válida que empiece por https://');
      return;
    }

    setIsSubmitting(true);
    setStep('DISCOVERING');

    try {
      // Llamada al endpoint de descubrimiento (SPEC-02 §5.1)
      const res = await fetch('/api/v1/me/wallet/discovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: targetUrl }),
      });

      const discoveryData = (await res.json()) as WalletDiscovery;
      if (!res.ok) {
        throw new Error((discoveryData as unknown as { message: string }).message || 'Error en descubrimiento');
      }

      setDiscovery(discoveryData);

      // Paso 2: Crear reto Subject Grant
      const chalRes = await fetch('/api/v1/me/wallet/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: targetUrl }),
      });

      const challengeData = (await chalRes.json()) as WalletChallenge;
      setChallenge(challengeData);
      setStep('PENDING_REDIRECT');
    } catch (err) {
      setErrorMessage((err as Error).message);
      setStep('EMPTY');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Paso 3: Simular Callback Exitoso con Hash Correcto
  const handleVerifySuccess = async () => {
    if (!discovery || !challenge) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // Hash SHA-256 esperado devuelto en el reto del servidor (SPEC-02 §2 y §7)
      const correctHash = challenge.expectedHash;

      const res = await fetch('/api/v1/me/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: discovery.walletAddress,
          hash: correctHash,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.code || 'Verificación fallida');
      }

      setActiveWallet(data.wallet);
      setStep('VERIFIED');
      await loadWalletState();
    } catch (err) {
      setErrorMessage((err as Error).message);
      setStep('FAILED_HASH');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Simular Falla de Hash (GNAP_HASH_MISMATCH - SPEC-02 §10)
  const handleSimulateHashMismatch = async () => {
    if (!discovery) return;
    setIsSubmitting(true);
    try {
      const corruptedHash = '0000000000000000000000000000000000000000000000000000000000000000';
      const res = await fetch('/api/v1/me/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: discovery.walletAddress,
          hash: corruptedHash,
        }),
      });

      const data = await res.json();
      setErrorMessage(`Error: ${data.code} — El hash devuelto por el IdP no coincide con SHA-256(clientNonce + finishNonce + interactRef + authServerUrl). Se abortó grant.continue.`);
      setStep('FAILED_HASH');
    } catch (err) {
      setErrorMessage((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Simular Reto Expirado (WALLET_CHALLENGE_EXPIRED - SPEC-02 §10)
  const handleSimulateExpired = () => {
    setErrorMessage('Error: WALLET_CHALLENGE_EXPIRED — La ventana de consentimiento GNAP de 15 minutos ha expirado sin retorno del IdP.');
    setStep('EXPIRED');
  };

  const handleResetForm = () => {
    setStep('EMPTY');
    setDiscovery(null);
    setChallenge(null);
    setErrorMessage(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Alerta de bloqueo sin billetera (Invariante 3) */}
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
              Verificación Requerida (WALLET_NOT_VERIFIED)
            </h4>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Sin una billetera verificada activa en América no se permite publicar encargos, enviar ofertas ni cobrar en el escrow. Vincula una dirección Open Payments para desbloquear la plataforma.
            </p>
          </div>
        </div>
      )}

      {/* Billetera Activa Actual (si existe) */}
      {activeWallet && (
        <div
          className="card"
          style={{
            background: 'rgba(16, 185, 129, 0.05)',
            borderColor: 'rgba(16, 185, 129, 0.3)',
            boxShadow: '0 0 20px -6px rgba(16, 185, 129, 0.2)',
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
                  Billetera Activa Única (SPEC-02 Invariante 1)
                </div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#ffffff' }}>
                  {activeWallet.assetCode} (Escala: {activeWallet.assetScale})
                </div>
              </div>
            </div>

            <span className="badge badge-verified">
              <span className="pulse-dot" /> isVerified = true · isActive = true
            </span>
          </div>

          <div className="code-block" style={{ marginBottom: 16 }}>
            {activeWallet.walletAddress}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: 'var(--text-secondary)' }}>
            <span>Verificada mediante Open Payments Subject Grant</span>
            <button
              onClick={handleResetForm}
              className="btn btn-outline btn-sm"
              style={{ fontSize: 12 }}
            >
              <RefreshCw size={12} />
              <span>Reemplazar Billetera Activa</span>
            </button>
          </div>
        </div>
      )}

      {/* Formulario de Vinculación / Descubrimiento */}
      {(step === 'EMPTY' || step === 'DISCOVERING' || !activeWallet) && (
        <div className="card">
          <h3 style={{ fontSize: 17, fontWeight: 600, marginBottom: 8, color: '#ffffff' }}>
            {activeWallet ? 'Reemplazar por una nueva billetera' : 'Vincular Billetera Multimoneda en América'}
          </h3>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
            Ingresa la URL HTTPS de tu billetera Open Payments (Interledger Test Wallet o Rafiki). Se comprobará la posesión con una concesión GNAP Subject Grant sin mover dinero.
          </p>

          {/* Presets panamericanos interactivos (FE-2) */}
          <div style={{ marginBottom: 20 }}>
            <label className="form-label" style={{ marginBottom: 8, display: 'block' }}>
              Direcciones de prueba de la Test Wallet en América (Preconfiguradas):
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {PAN_AMERICAN_PRESETS.map((preset) => (
                <button
                  key={preset.assetCode}
                  type="button"
                  onClick={() => {
                    setWalletUrl(preset.url);
                    handleDiscover(preset.url);
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
              Dirección de Billetera (walletAddress HTTPS):
            </label>
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                id="wallet-url"
                type="url"
                className="form-input"
                placeholder="https://ilp.interledger-test.dev/tu-usuario"
                value={walletUrl}
                onChange={(e) => setWalletUrl(e.target.value)}
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => handleDiscover()}
                className="btn btn-primary"
                disabled={isSubmitting || !walletUrl}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} />
                    <span>Descubriendo...</span>
                  </>
                ) : (
                  <>
                    <span>Descubrir GNAP</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </div>
            <span className="input-hint">
              Contrato: debe ser una URL que empiece por https://. Se descubre authServer y resourceServer con UnauthenticatedClient.
            </span>
          </div>

          {errorMessage && (
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
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      )}

      {/* Estado PENDING_REDIRECT: Inspección de Reto GNAP y Simulación */}
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
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--status-pending-bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--status-pending)',
                }}
              >
                <Clock size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: '#ffffff' }}>
                  Reto Criptográfico GNAP Generado (PENDING_REDIRECT)
                </h3>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  Moneda descubierta: <strong>{discovery.assetCode}</strong> (Escala: {discovery.assetScale})
                </span>
              </div>
            </div>

            <span className="badge badge-pending">
              <span className="pulse-dot" /> PENDING_REDIRECT
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12, marginBottom: 16 }}>
            <div style={{ background: 'var(--bg)', padding: 12, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Challenge ID</div>
              <div className="tabular-num" style={{ fontSize: 12, color: '#cbd5e1', wordBreak: 'break-all' }}>{challenge.challengeId}</div>
            </div>
            <div style={{ background: 'var(--bg)', padding: 12, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Client Nonce (Único)</div>
              <div className="tabular-num" style={{ fontSize: 12, color: '#cbd5e1', wordBreak: 'break-all' }}>{challenge.clientNonce}</div>
            </div>
            <div style={{ background: 'var(--bg)', padding: 12, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Interact Ref</div>
              <div className="tabular-num" style={{ fontSize: 12, color: '#cbd5e1', wordBreak: 'break-all' }}>{challenge.interactRef}</div>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label className="form-label" style={{ fontSize: 11 }}>
              Hash SHA-256 Esperado en Callback (SPEC-02 §2.4):
            </label>
            <div className="code-block" style={{ fontSize: 11, color: 'var(--brand-blue)' }}>
              {challenge.expectedHash}
            </div>
          </div>

          {/* Botones de Acción para Simular el Flujo y Casos de Borde */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              <button
                type="button"
                onClick={handleVerifySuccess}
                className="btn btn-primary"
                disabled={isSubmitting}
                style={{ background: 'var(--status-verified)' }}
              >
                <CheckCircle2 size={16} />
                <span>Simular Retorno Válido (Hash Coincidente)</span>
              </button>

              <button
                type="button"
                onClick={handleSimulateHashMismatch}
                className="btn btn-outline"
                disabled={isSubmitting}
                style={{ borderColor: 'rgba(239, 68, 68, 0.4)', color: '#fca5a5' }}
              >
                <ShieldAlert size={16} />
                <span>Simular GNAP_HASH_MISMATCH</span>
              </button>

              <button
                type="button"
                onClick={handleSimulateExpired}
                className="btn btn-outline"
                disabled={isSubmitting}
                style={{ borderColor: 'var(--border)' }}
              >
                <Clock size={16} />
                <span>Simular Expiración</span>
              </button>
            </div>

            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
              * En producción, el navegador es redirigido a <code>{discovery.authServer}/interact</code> y el IdP retorna a <code>/api/v1/auth/wallet/callback</code>.
            </p>
          </div>
        </div>
      )}

      {/* Estado FAILED_HASH o EXPIRED */}
      {(step === 'FAILED_HASH' || step === 'EXPIRED') && (
        <div
          className="card"
          style={{
            background: 'var(--status-failed-bg)',
            borderColor: 'rgba(239, 68, 68, 0.3)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <ShieldAlert size={22} style={{ color: 'var(--status-failed)' }} />
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#ffffff' }}>
              {step === 'FAILED_HASH' ? 'Fallo de Integridad GNAP (GNAP_HASH_MISMATCH)' : 'Reto Expirado (WALLET_CHALLENGE_EXPIRED)'}
            </h3>
          </div>

          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
            {errorMessage || 'La verificación criptográfica no pudo ser completada. La billetera anterior, si existía, se mantiene intacta.'}
          </p>

          <button
            type="button"
            onClick={handleResetForm}
            className="btn btn-secondary btn-sm"
          >
            Intentar nuevamente con otra dirección
          </button>
        </div>
      )}

      {/* Historial de reemplazo de billeteras previas (Invariante 2) */}
      {previousWallets.length > 0 && (
        <div className="card" style={{ background: 'var(--bg-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <History size={16} style={{ color: 'var(--text-muted)' }} />
            <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
              Billeteras Previas Desactivadas (Invariante 2: Reemplazo Atómico)
            </h4>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {previousWallets.map((w, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 12px',
                  background: 'var(--surface)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                  fontSize: 12,
                }}
              >
                <span className="tabular-num" style={{ color: 'var(--text-muted)' }}>
                  {w.walletAddress} ({w.assetCode})
                </span>
                <span className="badge badge-failed" style={{ fontSize: 10, padding: '2px 6px' }}>
                  isActive = false (Desactivada)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
