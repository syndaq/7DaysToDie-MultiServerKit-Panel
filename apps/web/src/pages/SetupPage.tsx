import { AuthForm } from '../components/auth/AuthForm';
import { useAuth } from '../context/AuthContext';

export function SetupPage() {
  const { setup } = useAuth();

  return (
    <AuthForm
      title="Create admin account"
      description="Welcome to MultiServerKit. No administrator exists yet — create the first account to secure your panel."
      submitLabel="Create admin account"
      onSubmit={setup}
    />
  );
}
