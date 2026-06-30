import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import type { ModGlobalSettings } from '@msk-panel/shared';
import { ServerSelector } from '../components/ServerSelector';
import { Badge } from '../components/ui/Badge';
import { Card, CardHeader } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Toggle } from '../components/ui/Toggle';
import { ErrorBanner, LoadingState } from '../components/ui/PageHeader';
import { PageShell } from '../components/ui/PageShell';
import { useModSettings } from '../hooks/useModSettings';
import { defaultGlobalSettings, normalizeGlobalSettings } from '../lib/mod-settings';
import { ModSettingsActions } from '../components/server/ModSettingsActions';
import { api } from '../lib/api';

export function TraderProtectionPage() {
  const [serverId, setServerId] = useState('');
  const { data: servers } = useQuery({ queryKey: ['servers'], queryFn: api.getServers });

  const {
    form,
    setForm,
    isLoading,
    error,
    saveMutation,
    resetMutation,
  } = useModSettings(serverId, 'GlobalSettings', defaultGlobalSettings, normalizeGlobalSettings);

  const set = <K extends keyof ModGlobalSettings>(key: K, value: ModGlobalSettings[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <PageShell
      title="Trader protection"
      description="Configure trader area build protection and the player-facing warning message."
      toolbar={
        <ServerSelector
          servers={servers ?? []}
          value={serverId}
          onChange={setServerId}
          emptyLabel="Select a game server…"
        />
      }
    >
      {!serverId ? (
        <Card>
          <p className="py-16 text-center text-[var(--color-muted)]">
            Select a game server to configure trader area protection.
          </p>
        </Card>
      ) : isLoading ? (
        <LoadingState label="Loading trader protection settings…" />
      ) : error ? (
        <ErrorBanner message={(error as Error).message} />
      ) : (
        <div className="space-y-5">
          <Card>
            <CardHeader
              title="Trader area protection"
              description="These settings are stored in global settings on the game server."
              action={
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant={form.enableTraderAreaProtection ? 'success' : 'neutral'}>
                    {form.enableTraderAreaProtection ? 'Protected' : 'Off'}
                  </Badge>
                  <ModSettingsActions
                    onSave={() => saveMutation.mutate()}
                    onReset={() => resetMutation.mutate()}
                    saving={saveMutation.isPending}
                    resetting={resetMutation.isPending}
                  />
                </div>
              }
            />
            {(saveMutation.error || resetMutation.error) && (
              <div className="mb-4">
                <ErrorBanner message={((saveMutation.error ?? resetMutation.error) as Error).message} />
              </div>
            )}
            {saveMutation.isSuccess && (
              <p className="mb-4 text-sm text-[var(--color-success)]">Settings saved to game server.</p>
            )}
            <div className="grid gap-4">
              <div className="flex items-center justify-between rounded-xl border border-[var(--color-border)] px-4 py-3">
                <span className="text-sm font-medium">Enable trader area protection</span>
                <Toggle
                  checked={form.enableTraderAreaProtection}
                  onChange={(value) => set('enableTraderAreaProtection', value)}
                />
              </div>
              <Input
                label="Trader area protection tip"
                value={form.traderAreaProtectionTip ?? ''}
                onChange={(e) => set('traderAreaProtectionTip', e.target.value || null)}
              />
            </div>
            <p className="mt-4 text-sm text-[var(--color-muted)]">
              Related land claim and POI protection options live on{' '}
              <Link to="/global-settings" className="text-[var(--color-accent)] hover:underline">
                Global settings
              </Link>
              .
            </p>
          </Card>
        </div>
      )}
    </PageShell>
  );
}
