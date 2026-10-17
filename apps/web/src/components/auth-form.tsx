'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

export type AuthSuccessPayload = {
  mode: 'login' | 'register';
  displayName?: string;
};

interface AuthFormProps {
  mode: 'login' | 'register';
  /** `page` navega a rutas; `embedded` se usa dentro del modal sobre el contenido actual. */
  variant?: 'page' | 'embedded';
  onSuccess?: (result: AuthSuccessPayload) => void;
  onSwitchMode?: (mode: 'login' | 'register' | 'recover') => void;
}

export function AuthForm({ mode, variant = 'page', onSuccess, onSwitchMode }: AuthFormProps) {
  const router = useRouter();
  const isRegister = mode === 'register';
  const embedded = variant === 'embedded';
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const response = await fetch(isRegister ? '/api/v1/auth/register' : '/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          isRegister ? { email, password, displayName, countryCode: 'CO' } : { email, password },
        ),
      });
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const code =
          data && typeof data === 'object' && 'code' in data && typeof data.code === 'string'
            ? data.code
            : 'AUTH_FAILED';
        setError(messageFor(code));
        return;
      }
      if (onSuccess) {
        onSuccess({
          mode: isRegister ? 'register' : 'login',
          displayName: isRegister ? displayName.trim() : undefined,
        });
        return;
      }
      if (isRegister) {
        router.push('/onboarding/wallet?welcome=1');
        router.refresh();
        return;
      }
      router.push('/');
      router.refresh();
    } catch {
      setError('No se pudo contactar la API.');
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      style={{
        width: '100%',
        maxWidth: embedded ? 'none' : 420,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        background: embedded ? 'transparent' : 'var(--surface)',
        border: embedded ? 'none' : '1px solid var(--border)',
        borderRadius: embedded ? 0 : 'var(--radius-lg)',
        padding: embedded ? 0 : 24,
      }}
    >
      {isRegister ? (
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
          Nombre
          <input
            required
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            autoComplete="name"
            style={fieldStyle}
          />
        </label>
      ) : null}
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
      <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
        Contraseña
        <input
          required
          type="password"
          minLength={isRegister ? 8 : 1}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete={isRegister ? 'new-password' : 'current-password'}
          style={fieldStyle}
        />
      </label>
      {error ? <p style={{ margin: 0, color: 'var(--status-alert, #f87171)', fontSize: 13 }}>{error}</p> : null}
      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending ? 'Espera…' : isRegister ? 'Crear cuenta' : 'Entrar'}
      </button>
      <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>
        {isRegister ? (
          <>
            ¿Ya tienes cuenta?{' '}
            {embedded && onSwitchMode ? (
              <button type="button" onClick={() => onSwitchMode('login')} style={linkButtonStyle}>
                Inicia sesión
              </button>
            ) : (
              <Link href="/sign-in">Inicia sesión</Link>
            )}
          </>
        ) : (
          <>
            ¿Aún no tienes cuenta?{' '}
            {embedded && onSwitchMode ? (
              <button type="button" onClick={() => onSwitchMode('register')} style={linkButtonStyle}>
                Regístrate
              </button>
            ) : (
              <Link href="/sign-up">Regístrate</Link>
            )}
            {embedded && onSwitchMode ? (
              <>
                {' · '}
                <button type="button" onClick={() => onSwitchMode('recover')} style={linkButtonStyle}>
                  Recuperar cuenta
                </button>
              </>
            ) : null}
          </>
        )}
      </p>
    </form>
  );
}

function messageFor(code: string): string {
  if (code === 'EMAIL_ALREADY_REGISTERED') return 'Ese correo ya está registrado.';
  if (code === 'INVALID_CREDENTIALS') return 'Correo o contraseña incorrectos.';
  if (code === 'AUTH_INPUT_INVALID') return 'Revisa el correo, el nombre y una contraseña de al menos 8 caracteres.';
  return 'No se pudo completar el acceso.';
}

const fieldStyle = {
  background: 'var(--bg-subtle)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--text-primary)',
  padding: '10px 12px',
  fontSize: 14,
};

const linkButtonStyle = {
  background: 'transparent',
  border: 0,
  color: 'var(--brand-blue)',
  cursor: 'pointer',
  padding: 0,
  fontSize: 13,
};
