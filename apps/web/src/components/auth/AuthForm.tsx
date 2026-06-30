import { useState } from 'react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { IconZap } from '../ui/icons';
import { ErrorBanner } from '../ui/PageHeader';

interface AuthFormProps {
  title: string;
  description: string;
  submitLabel: string;
  onSubmit: (username: string, password: string) => Promise<void>;
}

export function AuthForm({ title, description, submitLabel, onSubmit }: AuthFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const isSetup = submitLabel.toLowerCase().includes('create');

  return (
    <div className="app-bg flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md animate-fade-up">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-2)] text-white shadow-lg shadow-[var(--color-accent-glow)]">
            <IconZap width={28} height={28} strokeWidth={2} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">{description}</p>
        </div>

        <Card glow>
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              setError(null);

              if (isSetup && password !== confirmPassword) {
                setError('Passwords do not match');
                return;
              }

              setPending(true);
              try {
                await onSubmit(username.trim(), password);
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Request failed');
              } finally {
                setPending(false);
              }
            }}
          >
            <Input
              label="Username"
              required
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              hint="Letters, numbers, underscores, and hyphens only"
            />
            <Input
              label="Password"
              type="password"
              required
              autoComplete={isSetup ? 'new-password' : 'current-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              hint="At least 8 characters"
            />
            {isSetup && (
              <Input
                label="Confirm password"
                type="password"
                required
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            )}

            {error && <ErrorBanner message={error} />}

            <Button type="submit" disabled={pending} className="w-full">
              {pending ? 'Please wait…' : submitLabel}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
