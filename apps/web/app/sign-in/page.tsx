import { AuthForm } from '@/src/components/auth-form';

export default function SignInPage() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 0',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#ffffff', marginBottom: 8 }}>
          Iniciar sesión en TaskStream AI
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
          Entra con el correo y la contraseña de tu cuenta.
        </p>
      </div>
      <AuthForm mode="login" />
    </div>
  );
}
