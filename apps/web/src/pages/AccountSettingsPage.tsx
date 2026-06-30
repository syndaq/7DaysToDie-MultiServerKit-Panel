import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { PageShell } from '../components/ui/PageShell';
import { Card, CardHeader } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { ErrorBanner } from '../components/ui/PageHeader';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

export function AccountSettingsPage() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState('');

  const mutation = useMutation({
    mutationFn: () => {
      if (newPassword !== confirmPassword) {
        throw new Error('New passwords do not match.');
      }
      return api.changePassword({ currentPassword, newPassword });
    },
    onSuccess: () => {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setLocalError('');
    },
    onError: (error) => setLocalError((error as Error).message),
  });

  return (
    <PageShell
      title="Account settings"
      description="Manage your panel administrator account. More profile options will be added here over time."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Profile" description="Signed-in administrator for this panel." />
          <dl className="grid gap-4 text-sm">
            <div>
              <dt className="text-[var(--color-muted)]">Username</dt>
              <dd className="mt-1 font-semibold">{user?.username ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-[var(--color-muted)]">Role</dt>
              <dd className="mt-1 font-semibold">Administrator</dd>
            </div>
          </dl>
        </Card>

        <Card>
          <CardHeader title="Change password" description="Use a strong password with at least 8 characters." />
          {(localError || mutation.error) && (
            <div className="mb-4">
              <ErrorBanner message={localError || (mutation.error as Error).message} />
            </div>
          )}
          <form
            className="grid gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              setLocalError('');
              mutation.mutate();
            }}
          >
            <Input
              label="Current password"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
            <Input
              label="New password"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
            />
            <Input
              label="Confirm new password"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
            />
            <div>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Saving…' : 'Update password'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </PageShell>
  );
}
