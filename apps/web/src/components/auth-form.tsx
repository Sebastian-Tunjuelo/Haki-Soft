'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Eye, EyeOff, Lock, Mail, User } from 'lucide-react';

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
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
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
      if (!isRegister && typeof window !== 'undefined') {
        try {
          if (remember) localStorage.setItem('ts-auth-remember:v1', '1');
          else localStorage.removeItem('ts-auth-remember:v1');
        } catch {
          /* storage puede fallar en privado */
        }
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

  const errorId = `${mode}-auth-error`;
  const describedBy = error ? errorId : undefined;

  return (
    <form
      className="auth-form"
      onSubmit={onSubmit}
      aria-busy={pending}
      style={embedded ? { maxWidth: 'none' } : undefined}
    >
      {isRegister ? (
        <label className="auth-field">
          <span className="auth-field__label">Nombre</span>
          <span className="auth-input-wrap">
            <User className="auth-input-wrap__icon" size={16} aria-hidden="true" />
            <input
              className="auth-input"
              required
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              autoComplete="name"
              placeholder="Tu nombre"
              aria-describedby={describedBy}
            />
          </span>
        </label>
      ) : null}
      <label className="auth-field">
        <span className="auth-field__label">Correo electrónico</span>
        <span className="auth-input-wrap">
          <Mail className="auth-input-wrap__icon" size={16} aria-hidden="true" />
          <input
            className="auth-input"
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            inputMode="email"
            placeholder="correo@empresa.com"
            aria-describedby={describedBy}
            aria-invalid={error ? true : undefined}
          />
        </span>
      </label>
      <div className="auth-field">
        <label className="auth-field__label" htmlFor={`${mode}-password`}>
          Contraseña
        </label>
        <div className="auth-password">
          <Lock className="auth-input-wrap__icon" size={16} aria-hidden="true" />
          <input
            id={`${mode}-password`}
            className="auth-input"
            required
            type={showPassword ? 'text' : 'password'}
            minLength={isRegister ? 8 : 1}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete={isRegister ? 'new-password' : 'current-password'}
            placeholder="••••••••"
            aria-describedby={describedBy}
            aria-invalid={error ? true : undefined}
          />
          <button
            type="button"
            className="auth-password__toggle"
            onClick={() => setShowPassword((value) => !value)}
            aria-pressed={showPassword}
            aria-controls={`${mode}-password`}
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            {showPassword ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
          </button>
        </div>
      </div>
      {!isRegister ? (
        <div className="auth-row">
          <label className="auth-check">
            <input
              type="checkbox"
              checked={remember}
              onChange={(event) => setRemember(event.target.checked)}
            />
            <span>Recordar sesión</span>
          </label>
          <span className="auth-forgot" title="Próximamente">
            ¿Olvidaste tu contraseña?
          </span>
        </div>
      ) : null}
      {error ? (
        <p id={errorId} className="auth-error" role="alert">
          {error}
        </p>
      ) : null}
      <button className="auth-submit" type="submit" disabled={pending}>
        {pending ? <span className="auth-submit__spinner" aria-hidden="true" /> : null}
        {pending
          ? isRegister
            ? 'Creando cuenta…'
            : 'Ingresando…'
          : isRegister
            ? 'Crear cuenta'
            : 'Ingresar a TaskStream'}
      </button>
      <p className="auth-switch">
        {isRegister ? (
          <>
            ¿Ya tienes cuenta?{' '}
            {embedded && onSwitchMode ? (
              <button type="button" onClick={() => onSwitchMode('login')} className="auth-switch__button">
                Inicia sesión
              </button>
            ) : (
              <Link href="/sign-in">Iniciar sesión</Link>
            )}
          </>
        ) : (
          <>
            ¿No tienes cuenta?{' '}
            {embedded && onSwitchMode ? (
              <button type="button" onClick={() => onSwitchMode('register')} className="auth-switch__button">
                Regístrate
              </button>
            ) : (
              <Link href="/sign-up">Crear cuenta</Link>
            )}
            {embedded && onSwitchMode ? (
              <>
                {' · '}
                <button type="button" onClick={() => onSwitchMode('recover')} className="auth-switch__button">
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
