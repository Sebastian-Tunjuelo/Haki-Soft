import { AuthForm } from '@/src/components/auth-form';

export default function SignUpPage() {
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
          Crear cuenta en TaskStream AI
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
          El registro local basta por ahora. La misma cuenta alterna Buyer y Seller.
        </p>
      </div>
      <AuthForm mode="register" />
    </div>
  );
}
