'use client';

import { useEffect, useId, useState, type FormEvent } from 'react';
import { AuthForm, type AuthSuccessPayload } from '@/src/components/auth-form';

export type AuthGateTab = 'login' | 'register' | 'recover';

interface AuthGateModalProps {
  open: boolean;
  initialTab?: AuthGateTab;
  reason?: string;
  onClose: () => void;
  onAuthenticated: (result: AuthSuccessPayload) => void;
}

/**
 * Overlay compacto sobre el contenido actual (no navega a /sign-in).
 * Pestañas: iniciar sesión, crear cuenta, recuperar cuenta.
 */
export function AuthGateModal({
  open,
  initialTab = 'login',
  reason = 'Necesitas una sesión activa para continuar.',
  onClose,
  onAuthenticated,
}: AuthGateModalProps) {
  const titleId = useId();
  const [tab, setTab] = useState<AuthGateTab>(initialTab);

  useEffect(() => {
    if (open) setTab(initialTab);
  }, [open, initialTab]);

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

  if (!open) return null;

  return (
    <div
      role="presentation"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 80,
        background: 'rgba(2, 6, 23, 0.72)',
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
          maxWidth: 420,
          maxHeight: 'min(88vh, 640px)',
          overflow: 'auto',
          background: 'var(--surface-elevated)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.45)',
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div>
            <h2 id={titleId} style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>
              Accede a TaskStream
            </h2>
            <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>{reason}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            style={{
              background: 'transparent',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
              borderRadius: 'var(--radius-sm)',
              width: 32,
              height: 32,
              cursor: 'pointer',
            }}
          >
            ×
          </button>
        </div>

        <div
          role="tablist"
          aria-label="Opciones de acceso"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: 6,
            background: 'var(--bg-subtle)',
            padding: 4,
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)',
          }}
        >
          {(
            [
              ['login', 'Iniciar sesión'],
              ['register', 'Crear cuenta'],
              ['recover', 'Recuperar'],
            ] as const
          ).map(([id, label]) => {
            const active = tab === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(id)}
                style={{
                  border: 0,
                  cursor: 'pointer',
                  borderRadius: 'var(--radius-sm)',
                  padding: '8px 6px',
                  fontSize: 12,
                  fontWeight: active ? 700 : 500,
                  color: active ? 'var(--text-primary)' : 'var(--text-muted)',
                  background: active ? 'var(--surface)' : 'transparent',
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        {tab === 'recover' ? (
          <RecoverAccountPanel onBackToLogin={() => setTab('login')} />
        ) : (
          <AuthForm
            mode={tab}
            variant="embedded"
            onSuccess={(result) => onAuthenticated(result)}
            onSwitchMode={(next) => setTab(next)}
          />
        )}
      </div>
    </div>
  );
}

function RecoverAccountPanel({ onBackToLogin }: { onBackToLogin: () => void }) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage(null);
    // SPEC-02 aún no expone endpoint de recuperación; la pestaña existe para el flujo UX.
    await new Promise((resolve) => setTimeout(resolve, 350));
    setMessage(
      'La recuperación por correo aún no está habilitada en el backend. Mientras tanto inicia sesión o crea una cuenta nueva.',
    );
    setPending(false);
  }

  return (
    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>
        Indica el correo de tu cuenta. Te guiaremos cuando el flujo de recuperación esté disponible.
      </p>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
        Correo
        <input
          required
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          style={fieldStyle}
        />
      </label>
      {message ? <p style={{ margin: 0, color: 'var(--status-pending)', fontSize: 13 }}>{message}</p> : null}
      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending ? 'Espera…' : 'Solicitar recuperación'}
      </button>
      <button
        type="button"
        onClick={onBackToLogin}
        style={{
          background: 'transparent',
          border: 0,
          color: 'var(--brand-blue)',
          cursor: 'pointer',
          fontSize: 13,
          textAlign: 'left',
          padding: 0,
        }}
      >
        Volver a iniciar sesión
      </button>
    </form>
  );
}

const fieldStyle = {
  background: 'var(--bg-subtle)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--text-primary)',
  padding: '10px 12px',
  fontSize: 14,
};
