'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthForm } from '@/src/components/auth-form';
import { AuthShell } from '@/src/components/login/auth-shell';
import { WelcomeWalletModal } from '@/src/components/welcome-wallet-modal';

export default function SignUpPage() {
  const router = useRouter();
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [displayName, setDisplayName] = useState<string | null>(null);

  return (
    <>
      <AuthShell
        title="Crear cuenta en MERIDIA"
        lead="Regístrate para publicar actividades como Cliente o prestar servicios como Freelancer con custodia Open Payments."
      >
        <AuthForm
          mode="register"
          onSuccess={(result) => {
            setDisplayName(result.displayName ?? null);
            setWelcomeOpen(true);
          }}
        />
      </AuthShell>

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
    </>
  );
}
