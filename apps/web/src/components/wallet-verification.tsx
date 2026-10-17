'use client';

import React, { useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
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
  ExternalLink,
  RefreshCw,
  Clock,
} from 'lucide-react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(useGSAP);
}

interface WalletVerificationProps {
  initialWallet?: ActiveWallet | null;
  serverCode?: string | null;
}

type VerificationStep = 'EMPTY' | 'DISCOVERING' | 'PENDING_REDIRECT' | 'VERIFIED' | 'FAILED_HASH' | 'EXPIRED';

const PAN_AMERICAN_PRESETS = [
  { flag: '🇨🇴', country: 'Colombia', code: 'COP', url: 'https://ilp.interledger-test.dev/colombia-contractor-cop' },
  { flag: '🇲🇽', country: 'México', code: 'MXN', url: 'https://ilp.interledger-test.dev/mexico-agency-mxn' },
  { flag: '🇧🇷', country: 'Brasil', code: 'BRL', url: 'https://ilp.interledger-test.dev/brasil-dev-brl' },
  { flag: '🇺🇸', country: 'USA', code: 'USD', url: 'https://ilp.interledger-test.dev/us-freelancer-usd' },
  { flag: '🇨🇦', country: 'Canada', code: 'CAD', url: 'https://ilp.interledger-test.dev/canada-studio-cad' },
] as const;

function initialStep(wallet: ActiveWallet | null | undefined): VerificationStep {
  return wallet?.isVerified && wallet.isActive ? 'VERIFIED' : 'EMPTY';
}

function toPointerDisplay(raw: string): string {
  if (!raw) return '$ilp.interledger-test.dev/sara-estudio';
  if (raw.startsWith('$')) return raw;
  return raw.replace(/^https?:\/\//i, '$');
}

export function WalletVerification({
  initialWallet = null,
  serverCode = null,
}: WalletVerificationProps) {
  const [walletUrl, setWalletUrl] = useState(
    initialWallet?.walletAddress
      ? toPointerDisplay(initialWallet.walletAddress)
      : '$ilp.interledger-test.dev/sara-estudio',
  );
  const [step, setStep] = useState<VerificationStep>(initialStep(initialWallet));
  const [discovery, setDiscovery] = useState<WalletDiscovery | null>(null);
  const [challenge, setChallenge] = useState<WalletChallenge | null>(null);
  const [activeWallet, setActiveWallet] = useState<ActiveWallet | null>(
    initialWallet?.isVerified && initialWallet.isActive ? initialWallet : null,
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(serverCode);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const stageRef = useRef<HTMLDivElement>(null);
  const card3dRef = useRef<HTMLDivElement>(null);

  const { contextSafe } = useGSAP(
    () => {
      const root = stageRef.current;
      if (!root || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      const nodes = root.querySelectorAll('.wallet-jpg-orbit-node');
      gsap.to(nodes, {
        y: '-=7',
        duration: 2.2,
        stagger: { each: 0.28, yoyo: true, repeat: -1 },
        ease: 'sine.inOut',
      });
    },
    { scope: stageRef },
  );

  const onPointerMoveCard = contextSafe((e: React.PointerEvent<HTMLDivElement>) => {
    const card = card3dRef.current;
    if (!card || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const rect = card.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    gsap.to(card, {
      rotate: -14 + nx * 5,
      rotateY: nx * 18,
      rotateX: -ny * 15,
      duration: 0.35,
      ease: 'power2.out',
    });
  });

  const onPointerLeaveCard = contextSafe(() => {
    const card = card3dRef.current;
    if (!card) return;
    gsap.to(card, {
      rotate: -14,
      rotateY: 0,
      rotateX: 0,
      duration: 0.55,
      ease: 'power3.out',
    });
  });

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

  const displayedPointer = toPointerDisplay(
    activeWallet?.walletAddress ||
      discovery?.walletAddress ||
      walletUrl ||
      '$ilp.interledger-test.dev/sara-estudio',
  );

  const displayedAsset =
    activeWallet?.assetCode
      ? `${activeWallet.assetCode} / USD`
      : discovery?.assetCode
        ? `${discovery.assetCode} / USD`
        : 'COP / USD';

  const step1Done = Boolean(discovery || activeWallet || step === 'EMPTY' || step === 'DISCOVERING');
  const step2Current = step === 'PENDING_REDIRECT' || Boolean(activeWallet);
  const step3Done = Boolean(activeWallet);

  return (
    <div ref={stageRef} className="wallet-jpg-grid">
      {/* COLUMNA IZQUIERDA (~58%): Eyebrow + Titular + Tarjeta 3D Inclinada + Órbita Elíptica */}
      <div className="wallet-jpg-left">
        <span className="wallet-jpg-eyebrow">
          IDENTIDAD FINANCIERA INTERLEDGER · GNAP SUBJECT GRANT
        </span>

        <h1 className="wallet-jpg-title">
          Queremos reconocerte con tu billetera de <strong>Open Payments:</strong> tu identidad para{' '}
          <strong>cobrar y contratar</strong> al instante en toda{' '}
          <span className="wallet-jpg-title__muted">América</span>
        </h1>

        <div
          className="wallet-jpg-stage"
          onPointerMove={onPointerMoveCard}
          onPointerLeave={onPointerLeaveCard}
        >
          {/* Anillo Orbital Elíptico SVG con Gradiente Ámbar (Izquierda) y Esmeralda (Derecha) */}
          <svg
            className="wallet-jpg-orbit-svg"
            viewBox="0 0 600 300"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="meridiaWalletOrbitGrad" x1="0%" y1="65%" x2="100%" y2="25%">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.95" />
                <stop offset="38%" stopColor="#fbbf24" stopOpacity="0.85" />
                <stop offset="68%" stopColor="#34d399" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.95" />
              </linearGradient>
              <filter id="meridiaOrbitGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
            <ellipse
              cx="305"
              cy="168"
              rx="252"
              ry="94"
              transform="rotate(-11 305 168)"
              stroke="url(#meridiaWalletOrbitGrad)"
              strokeWidth="3.2"
              filter="url(#meridiaOrbitGlow)"
            />
          </svg>

          {/* Nodos Circulares Flotantes sobre la Órbita (USD, COP, MXN, CAD, BRL) */}
          <div className="wallet-jpg-orbit-node wallet-jpg-orbit-node--usd">
            <span>USD</span>
            <span className="wallet-jpg-orbit-node__circle">$</span>
          </div>

          <div className="wallet-jpg-orbit-node wallet-jpg-orbit-node--cop">
            <span className="wallet-jpg-orbit-node__circle">€</span>
            <span>COP</span>
          </div>

          <div className="wallet-jpg-orbit-node wallet-jpg-orbit-node--mxn">
            <span className="wallet-jpg-orbit-node__circle">$</span>
            <span>MXN</span>
          </div>

          <div className="wallet-jpg-orbit-node wallet-jpg-orbit-node--cad">
            <span className="wallet-jpg-orbit-node__circle">₹</span>
            <span>CAD</span>
          </div>

          <div className="wallet-jpg-orbit-node wallet-jpg-orbit-node--brl">
            <span className="wallet-jpg-orbit-node__circle">$</span>
            <span>BRL</span>
          </div>

          {/* Tarjeta Física-Digital Inclinada (-14deg) Fiel al JPG */}
          <div
            ref={card3dRef}
            className="wallet-jpg-card"
            role="img"
            aria-label="Tarjeta de billetera Open Payments de Meridia"
          >
            <div className="wallet-jpg-card__chips-row">
              {/* Chip EMV Dorado a la Izquierda */}
              <div className="wallet-jpg-emv-chip" aria-hidden="true" />

              {/* Microprocesador Fotónico Central Iluminado */}
              <div className="wallet-jpg-photonic-chip" aria-hidden="true">
                <div className="wallet-jpg-photonic-chip__pins" />
                <div className="wallet-jpg-photonic-chip__core" />
              </div>

              {/* Emblema Dorado 'M' en Relieve a la Derecha */}
              <div className="wallet-jpg-m-emblem" aria-hidden="true">
                M
              </div>
            </div>

            <div className="wallet-jpg-card__info">
              <p className="wallet-jpg-card__pointer">{displayedPointer}</p>
              <p className="wallet-jpg-card__meta">
                Divisa detectada:{' '}
                <span className="wallet-jpg-card__meta-gold">{displayedAsset}</span> ·{' '}
                <span className="wallet-jpg-card__meta-green">Verificada</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* COLUMNA DERECHA (~42%): Las 2 Tarjetas Apiladas del Boceto JPG */}
      <div className="wallet-jpg-right">
        {/* TARJETA SUPERIOR: ILP Pointer + Botón + Stepper Horizontal (1 — 2 — 3) */}
        <div className="wallet-jpg-panel">
          <div className="form-group" style={{ marginBottom: 14 }}>
            <label
              className="form-label"
              htmlFor="wallet-url"
              style={{
                fontWeight: 700,
                fontSize: '0.96rem',
                color: 'var(--text-primary)',
                marginBottom: 10,
                display: 'block',
              }}
            >
              ILP Pointer
            </label>
            <input
              id="wallet-url"
              type="text"
              className="form-input"
              style={{
                width: '100%',
                borderRadius: 12,
                padding: '13px 16px',
                fontSize: '0.95rem',
              }}
              placeholder="$ilp.interledger-test.dev/sara-estudio"
              value={walletUrl}
              onChange={(event) => setWalletUrl(event.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <button
            type="button"
            onClick={() => void handleDiscover()}
            className="wallet-jpg-submit-btn"
            disabled={isSubmitting || !walletUrl}
          >
            {isSubmitting ? (
              <>
                <RefreshCw size={15} />
                <span>Descubriendo Wallet...</span>
              </>
            ) : (
              <span>Vincular y Reconocer mi Wallet</span>
            )}
          </button>

          {/* Stepper Horizontal de 3 Pasos Conectados por Línea (1 — 2 — 3) */}
          <div className="wallet-jpg-stepper" aria-label="Pasos de verificación GNAP">
            <div className={`wallet-jpg-step ${step1Done ? 'is-done' : 'is-current'}`}>
              <span className="wallet-jpg-step__circle">1.</span>
              <span className="wallet-jpg-step__label">
                Descubrimiento
                <br />
                Público ILP
              </span>
            </div>

            <div className={`wallet-jpg-step ${step3Done ? 'is-done' : step2Current ? 'is-current' : ''}`}>
              <span className="wallet-jpg-step__circle">2.</span>
              <span className="wallet-jpg-step__label">
                Consentimiento
                <br />
                GNAP
              </span>
            </div>

            <div className={`wallet-jpg-step ${step3Done ? 'is-done' : ''}`}>
              <span className="wallet-jpg-step__circle">3.</span>
              <span className="wallet-jpg-step__label">
                Sello SHA-256
                <br />
                Activo
              </span>
            </div>
          </div>

          {/* Estados Interactivos en Vivo (PENDING_REDIRECT / VERIFIED / ERROR) */}
          {step === 'PENDING_REDIRECT' && discovery && challenge ? (
            <div
              style={{
                marginTop: 18,
                padding: '14px 16px',
                borderRadius: 14,
                background: 'var(--status-pending-bg)',
                border: '1px solid rgba(var(--volt-rgb), 0.45)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Clock size={16} style={{ color: 'var(--volt-ink)' }} />
                <strong style={{ fontSize: 13.5, color: 'var(--text-primary)' }}>
                  Confirmar titularidad en proveedor ({discovery.assetCode})
                </strong>
              </div>
              <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', margin: '0 0 12px' }}>
                Autoriza el reconocimiento sin costo. Retorno seguro en <code>/api/v1/auth/wallet/callback</code>.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                <button type="button" onClick={continueToProvider} className="btn btn-amber btn-sm">
                  <ExternalLink size={14} />
                  <span>Continuar en la billetera</span>
                </button>
                <button
                  type="button"
                  onClick={() => void loadWalletState()}
                  className="btn btn-outline btn-sm"
                  disabled={isSubmitting}
                >
                  <RefreshCw size={14} />
                  <span>Comprobar</span>
                </button>
              </div>
            </div>
          ) : null}

          {activeWallet ? (
            <div
              style={{
                marginTop: 18,
                padding: '12px 14px',
                borderRadius: 14,
                background: 'var(--status-verified-bg)',
                border: '1px solid rgba(var(--tide-rgb), 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10,
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShieldCheck size={17} style={{ color: 'var(--tide)' }} />
                <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)' }}>
                  Activa: {activeWallet.assetCode} (escala {activeWallet.assetScale})
                </span>
              </div>
              <button type="button" onClick={handleResetForm} className="btn btn-outline btn-sm" style={{ fontSize: 11.5 }}>
                Reemplazar
              </button>
            </div>
          ) : null}

          {errorMessage ? (
            <div style={{ marginTop: 14 }}>
              <ErrorBanner message={errorMessage} />
            </div>
          ) : null}
        </div>

        {/* TARJETA INFERIOR: Test presets cards en Grilla de 2 Columnas con Banderas Circulares */}
        <div className="wallet-jpg-panel">
          <h3
            style={{
              margin: 0,
              fontFamily: 'var(--font-sans)',
              fontSize: '1.02rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
            }}
          >
            Test presets cards
          </h3>

          <div className="wallet-jpg-presets-grid">
            {PAN_AMERICAN_PRESETS.map((preset) => {
              const pointerLabel = toPointerDisplay(preset.url);
              const isSelected = walletUrl === pointerLabel || walletUrl === preset.url;
              return (
                <button
                  key={preset.url}
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => {
                    setWalletUrl(pointerLabel);
                    void handleDiscover(preset.url);
                  }}
                  className={`wallet-jpg-preset-card ${isSelected ? 'is-active' : ''}`}
                >
                  <span className="wallet-jpg-preset-flag" aria-hidden="true">
                    {preset.flag}
                  </span>
                  <span>
                    <span className="wallet-jpg-preset-name">{preset.country}</span>
                    <span className="wallet-jpg-preset-code">{preset.code}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      style={{
        padding: '10px 14px',
        borderRadius: 'var(--radius-sm)',
        fontSize: 12.5,
        fontWeight: 600,
        background: 'var(--status-failed-bg)',
        color: 'var(--status-failed)',
        border: '1px solid rgba(239, 68, 68, 0.35)',
        display: 'flex',
        gap: 8,
        alignItems: 'center',
      }}
    >
      <ShieldAlert size={15} />
      <span>{message}</span>
    </div>
  );
}
