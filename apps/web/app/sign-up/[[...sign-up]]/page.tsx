import { SignUp } from '@clerk/nextjs';

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
          Crear Cuenta en TaskStream AI
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
          Únete al marketplace con pagos garantizados en escrow en toda América.
        </p>
      </div>

      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        appearance={{
          elements: {
            rootBox: { width: '100%', maxWidth: 420 },
            card: {
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
            },
            headerTitle: { color: 'var(--text-primary)' },
            headerSubtitle: { color: 'var(--text-secondary)' },
            socialButtonsBlockButton: {
              background: 'var(--bg-subtle)',
              borderColor: 'var(--border)',
              color: 'var(--text-primary)',
            },
            formButtonPrimary: {
              background: 'var(--brand-blue)',
            },
          },
        }}
      />
    </div>
  );
}
