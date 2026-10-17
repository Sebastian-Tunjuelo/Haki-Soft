import { WalletVerification } from '@/src/components/wallet-verification';
import { PageReveal } from '@/src/components/page-reveal';
import { readActiveWallet, readApiCode } from '@/src/lib/identity-contract';
import { hasLocalSession, readMyJson } from '@/src/lib/identity-proxy';
import { ShieldCheck, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

const FALLBACK_PRESETS = [
  { flag: '🇨🇴', country: 'Colombia', code: 'COP' },
  { flag: '🇲🇽', country: 'México', code: 'MXN' },
  { flag: '🇧🇷', country: 'Brasil', code: 'BRL' },
  { flag: '🇺🇸', country: 'USA', code: 'USD' },
  { flag: '🇨🇦', country: 'Canada', code: 'CAD' },
] as const;

export default async function WalletOnboardingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const status = typeof params.status === 'string' ? params.status : null;
  const code = typeof params.code === 'string' ? params.code : null;
  const walletParam = typeof params.wallet === 'string' ? params.wallet : null;

  const isAuthenticated = await hasLocalSession();

  let initialWallet = null;
  let serverCode: string | null = null;
  if (isAuthenticated) {
    const result = await readMyJson('/api/v1/me/wallet');
    initialWallet = readActiveWallet(result.body);
    if (result.status >= 400) serverCode = readApiCode(result.body);
  }

  return (
    <PageReveal className="ts-page">
      {status === 'verified' ? (
        <div
          className="ts-reveal"
          style={{
            padding: '14px 18px',
            marginBottom: 18,
            borderRadius: 'var(--radius-md)',
            background: 'var(--status-verified-bg)',
            border: '1px solid rgba(var(--tide-rgb), 0.35)',
            display: 'flex',
            gap: 10,
            alignItems: 'flex-start',
          }}
        >
          <ShieldCheck size={18} style={{ color: 'var(--status-verified)', flexShrink: 0, marginTop: 2 }} />
          <div>
            <strong style={{ color: 'var(--text-primary)' }}>Billetera reconocida y verificada</strong>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
              {walletParam
                ? `Titularidad confirmada para ${walletParam}. Ya puedes publicar actividades como Cliente y prestar servicios como Freelancer.`
                : 'Titularidad confirmada. Ya puedes publicar actividades y prestar servicios.'}
            </p>
            <Link
              href="/marketplace"
              style={{ display: 'inline-block', marginTop: 8, color: 'var(--tide-ink)', fontWeight: 700, fontSize: 13 }}
            >
              Ir al marketplace →
            </Link>
          </div>
        </div>
      ) : null}

      {status === 'error' ? (
        <div
          className="ts-reveal"
          style={{
            padding: '14px 18px',
            marginBottom: 18,
            borderRadius: 'var(--radius-md)',
            background: 'var(--status-failed-bg)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            display: 'flex',
            gap: 10,
            alignItems: 'flex-start',
          }}
        >
          <ShieldAlert size={18} style={{ color: 'var(--status-failed)', flexShrink: 0, marginTop: 2 }} />
          <div>
            <strong style={{ color: 'var(--text-primary)' }}>No se pudo completar la verificación</strong>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
              {callbackMessage(code)}. Puedes reintentar el descubrimiento desde el panel interactivo.
            </p>
          </div>
        </div>
      ) : null}

      {isAuthenticated ? (
        <div className="ts-reveal">
          <WalletVerification initialWallet={initialWallet} serverCode={serverCode} />
        </div>
      ) : (
        <section className="ts-reveal wallet-jpg-grid" aria-label="Billetera Open Payments de Meridia">
          {/* COLUMNA IZQUIERDA (~58%): Idéntica al boceto JPG */}
          <div className="wallet-jpg-left">
            <span className="wallet-jpg-eyebrow">
              IDENTIDAD FINANCIERA INTERLEDGER · GNAP SUBJECT GRANT
            </span>

            <h1 className="wallet-jpg-title">
              Queremos reconocerte con tu billetera de <strong>Open Payments:</strong> tu identidad para{' '}
              <strong>cobrar y contratar</strong> al instante en toda{' '}
              <span className="wallet-jpg-title__muted">América</span>
            </h1>

            <div className="wallet-jpg-stage">
              <svg
                className="wallet-jpg-orbit-svg"
                viewBox="0 0 600 300"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient id="meridiaWalletOrbitGradAnon" x1="0%" y1="65%" x2="100%" y2="25%">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.95" />
                    <stop offset="38%" stopColor="#fbbf24" stopOpacity="0.85" />
                    <stop offset="68%" stopColor="#34d399" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.95" />
                  </linearGradient>
                </defs>
                <ellipse
                  cx="305"
                  cy="168"
                  rx="252"
                  ry="94"
                  transform="rotate(-11 305 168)"
                  stroke="url(#meridiaWalletOrbitGradAnon)"
                  strokeWidth="3.2"
                />
              </svg>

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

              <div className="wallet-jpg-card" role="img" aria-label="Tarjeta de billetera Open Payments de Meridia">
                <div className="wallet-jpg-card__chips-row">
                  <div className="wallet-jpg-emv-chip" aria-hidden="true" />
                  <div className="wallet-jpg-photonic-chip" aria-hidden="true">
                    <div className="wallet-jpg-photonic-chip__pins" />
                    <div className="wallet-jpg-photonic-chip__core" />
                  </div>
                  <div className="wallet-jpg-m-emblem" aria-hidden="true">
                    M
                  </div>
                </div>
                <div className="wallet-jpg-card__info">
                  <p className="wallet-jpg-card__pointer">$ilp.interledger-test.dev/sara-estudio</p>
                  <p className="wallet-jpg-card__meta">
                    Divisa detectada:{' '}
                    <span className="wallet-jpg-card__meta-gold">COP / USD</span> ·{' '}
                    <span className="wallet-jpg-card__meta-green">Verificada</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA (~42%): Las 2 Tarjetas Apiladas del Boceto JPG */}
          <div className="wallet-jpg-right">
            <div className="wallet-jpg-panel">
              <div style={{ marginBottom: 12 }}>
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: '0.96rem',
                    color: 'var(--text-primary)',
                    marginBottom: 10,
                    display: 'block',
                  }}
                >
                  ILP Pointer
                </span>
                <div
                  style={{
                    width: '100%',
                    borderRadius: 12,
                    padding: '13px 16px',
                    fontSize: '0.95rem',
                    background: 'var(--soft)',
                    border: '1px solid var(--border-hi)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  $ilp.interledger-test.dev/sara-estudio
                </div>
              </div>

              <Link
                href="/sign-in?redirect=/onboarding/wallet"
                className="wallet-jpg-submit-btn"
                style={{ textDecoration: 'none' }}
              >
                Vincular y Reconocer mi Wallet
              </Link>

              <p style={{ margin: '10px 0 0', fontSize: 12, color: 'var(--text-secondary)', textAlign: 'center' }}>
                Sin sesión no se muestra el formulario activo. Inicia sesión para reconocer tu billetera.
              </p>

              <div className="wallet-jpg-stepper" aria-label="Pasos de verificación GNAP">
                <div className="wallet-jpg-step is-done">
                  <span className="wallet-jpg-step__circle">1.</span>
                  <span className="wallet-jpg-step__label">
                    Descubrimiento
                    <br />
                    Público ILP
                  </span>
                </div>
                <div className="wallet-jpg-step is-current">
                  <span className="wallet-jpg-step__circle">2.</span>
                  <span className="wallet-jpg-step__label">
                    Consentimiento
                    <br />
                    GNAP
                  </span>
                </div>
                <div className="wallet-jpg-step">
                  <span className="wallet-jpg-step__circle">3.</span>
                  <span className="wallet-jpg-step__label">
                    Sello SHA-256
                    <br />
                    Activo
                  </span>
                </div>
              </div>
            </div>

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
                {FALLBACK_PRESETS.map((preset) => (
                  <Link
                    key={preset.code}
                    href="/sign-in?redirect=/onboarding/wallet"
                    className="wallet-jpg-preset-card"
                  >
                    <span className="wallet-jpg-preset-flag" aria-hidden="true">
                      {preset.flag}
                    </span>
                    <span>
                      <span className="wallet-jpg-preset-name">{preset.country}</span>
                      <span className="wallet-jpg-preset-code">{preset.code}</span>
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
    </PageReveal>
  );
}

function callbackMessage(code: string | null): string {
  if (code === 'GNAP_HASH_MISMATCH') {
    return 'El hash GNAP no coincidió. Reinicia la verificación desde el formulario (un challenge no se reutiliza).';
  }
  if (code === 'WALLET_CHALLENGE_EXPIRED') return 'El reto de verificación expiró. Genera uno nuevo.';
  if (code === 'GNAP_INTERACT_ALREADY_USED') return 'Esa interacción ya se usó. Genera un reto nuevo.';
  if (code === 'GNAP_SUBJECT_NOT_CONFIRMED') return 'El proveedor no confirmó la titularidad de esa wallet.';
  if (code) return `Código: ${code}`;
  return 'Error desconocido en el callback';
}
