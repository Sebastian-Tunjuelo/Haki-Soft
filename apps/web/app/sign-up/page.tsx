'use client';

import { useState } from 'react';
import { AuthForm } from '@/src/components/auth-form';
import { WelcomeWalletModal } from '@/src/components/welcome-wallet-modal';
import { useRouter } from 'next/navigation';

export default function SignUpPage() {
  const router = useRouter();
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [displayName, setDisplayName] = useState<string | null>(null);

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
          El registro local basta por ahora. Tras crear la cuenta te pediremos tu wallet pública.
        </p>
      </div>
      <AuthForm
        mode="register"
        onSuccess={(result) => {
          setDisplayName(result.displayName ?? null);
          setWelcomeOpen(true);
        }}
      />

      <WelcomeWalletModal
        open={welcomeOpen}
        displayName={displayName}
        onClose={() => {
          setWelcomeOpen(false);
          router.push('/marketplace');
          router.refresh();
        }}
        onDone={() => {
          setWelcomeOpen(false);
          router.push('/marketplace');
          router.refresh();
        }}
      />
    </div>
  );
}
