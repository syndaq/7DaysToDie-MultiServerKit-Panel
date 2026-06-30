import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ClusterSyncResult, ModLevelGiftSettings } from '@msk-panel/shared';
import { Button } from '../ui/Button';
import { Card, CardHeader } from '../ui/Card';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Toggle } from '../ui/Toggle';
import { ErrorBanner, LoadingState } from '../ui/PageHeader';
import { SyncStatusBanner } from '../ui/SyncStatusBanner';
import { api } from '../../lib/api';

const variables = [
  '{GiftName}',
  '{RequiredLevel}',
  '{TotalClaimCount}',
  '{GiftDescription}',
  '{EntityId}',
  '{PlayerId}',
  '{PlayerName}',
];

const defaultSettings: ModLevelGiftSettings = {
  isEnabled: false,
  claimCmd: 'lq',
  hasClaimedTip: '',
  levelNotEnoughTip: '',
  noGiftTip: '',
  claimSuccessTip: '',
};

export function LevelGiftSettingsTab() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<ModLevelGiftSettings>(defaultSettings);
  const [lastSync, setLastSync] = useState<ClusterSyncResult[]>();

  const { data, isLoading, error } = useQuery({
    queryKey: ['level-gift-settings'],
    queryFn: () => api.getLevelGiftSettings(),
  });

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: () => api.updateLevelGiftSettings(form),
    onSuccess: (result) => {
      setLastSync(result.sync);
      queryClient.invalidateQueries({ queryKey: ['level-gift-settings'] });
    },
  });

  const resetMutation = useMutation({
    mutationFn: () => api.resetLevelGiftSettings(),
    onSuccess: (result) => {
      if (result.settings) setForm(result.settings);
      setLastSync(result.sync);
      queryClient.invalidateQueries({ queryKey: ['level-gift-settings'] });
    },
  });

  if (isLoading) return <LoadingState label="Loading level gift settings…" />;
  if (error) return <ErrorBanner message={(error as Error).message} />;

  const set = <K extends keyof ModLevelGiftSettings>(key: K, value: ModLevelGiftSettings[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <Card>
      <CardHeader
        title="Gift settings"
        description="Cluster-wide level gift configuration. Saved once and synced to every connected game server."
        action={
          <div className="flex items-center gap-3">
            <span className="text-sm text-[var(--color-muted)]">Enable level gift</span>
            <Toggle checked={form.isEnabled} onChange={(v) => set('isEnabled', v)} />
            <Badge variant={form.isEnabled ? 'success' : 'neutral'}>
              {form.isEnabled ? 'Enabled' : 'Disabled'}
            </Badge>
          </div>
        }
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {variables.map((variable) => (
          <code
            key={variable}
            className="rounded-lg bg-[var(--color-accent-soft)] px-2.5 py-1 text-xs font-medium text-[var(--color-accent)]"
          >
            {variable}
          </code>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Input label="Claim command" value={form.claimCmd} onChange={(e) => set('claimCmd', e.target.value)} />
        <Input
          label="Already claimed message"
          className="lg:col-span-2"
          value={form.hasClaimedTip}
          onChange={(e) => set('hasClaimedTip', e.target.value)}
        />
        <Input
          label="Level not enough message"
          className="lg:col-span-2"
          value={form.levelNotEnoughTip}
          onChange={(e) => set('levelNotEnoughTip', e.target.value)}
        />
        <Input
          label="No gift message"
          className="lg:col-span-2"
          value={form.noGiftTip}
          onChange={(e) => set('noGiftTip', e.target.value)}
        />
        <Input
          label="Claim success message"
          className="lg:col-span-2"
          value={form.claimSuccessTip}
          onChange={(e) => set('claimSuccessTip', e.target.value)}
        />
      </div>

      <p className="mt-6 text-sm text-[var(--color-success)]">
        Tip: Players type{' '}
        <code className="rounded bg-[var(--color-surface-2)] px-1.5 py-0.5">{form.claimCmd ?? 'lq'}</code> in-game to
        claim level rewards they qualify for.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>Save</Button>
        <Button variant="secondary" onClick={() => resetMutation.mutate()} disabled={resetMutation.isPending}>
          Reset
        </Button>
      </div>

      <SyncStatusBanner sync={lastSync} />
    </Card>
  );
}
