import { AuthForm } from '@/src/components/auth-form';
import { AuthShell } from '@/src/components/login/auth-shell';

export default function SignInPage() {
  return (
    <AuthShell
      title="Ingresar a TaskStream"
      lead="Usa tus credenciales para abrir el panel y continuar tus encargos."
    >
      <AuthForm mode="login" />
    </AuthShell>
  );
}
