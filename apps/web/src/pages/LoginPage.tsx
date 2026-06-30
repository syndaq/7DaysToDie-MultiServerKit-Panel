import { AuthForm } from '../components/auth/AuthForm';
import { useAuth } from '../context/AuthContext';

export function LoginPage() {
  const { login } = useAuth();

  return (
    <AuthForm
      title="Sign in"
      description="Enter your administrator credentials to access the MultiServerKit panel."
      submitLabel="Sign in"
      onSubmit={login}
    />
  );
}
