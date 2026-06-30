import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ClusterSyncResult, ModPointsSystemSettings } from '@msk-panel/shared';
import { Button } from '../ui/Button';
import { Card, CardHeader } from '../ui/Card';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Toggle } from '../ui/Toggle';
import { ErrorBanner, LoadingState } from '../ui/PageHeader';
import { SyncStatusBanner } from '../ui/SyncStatusBanner';
import { api } from '../../lib/api';

const variables = [
  '{SignInRewardPoints}',
  '{PlayerTotalPoints}',
  '{CurrencyAmount}',
  '{EntityId}',
  '{PlayerId}',
  '{PlayerName}',
];

const defaultSettings: ModPointsSystemSettings = {
  isEnabled: false,
  signInCmd: 'si',
  signInInterval: 3600,
  signInRewardPoints: 10,
  signInSuccessTip: '',
  signInFailureTip: '',
  queryPointsCmd: 'points',
  queryPointsTip: '',
  isCurrencyExchangeEnabled: false,
  currencyToPointsExchangeRate: 1,
  currencyExchangeCmd: 'dh',
  exchangeSuccessTip: '',
  exchangeFailureTip: '',
};

export function SignInSettingsTab() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<ModPointsSystemSettings>(defaultSettings);
  const [lastSync, setLastSync] = useState<ClusterSyncResult[]>();

  const { data, isLoading, error } = useQuery({
    queryKey: ['points-settings'],
    queryFn: () => api.getPointsSettings(),
  });

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: () => api.updatePointsSettings(form),
    onSuccess: (result) => {
      setLastSync(result.sync);
      queryClient.invalidateQueries({ queryKey: ['points-settings'] });
    },
  });

  const resetMutation = useMutation({
    mutationFn: () => api.resetPointsSettings(),
    onSuccess: (result) => {
      if (result.settings) setForm(result.settings);
      setLastSync(result.sync);
      queryClient.invalidateQueries({ queryKey: ['points-settings'] });
    },
  });

  if (isLoading) return <LoadingState label="Loading sign-in settings…" />;
  if (error) return <ErrorBanner message={(error as Error).message} />;

  const set = <K extends keyof ModPointsSystemSettings>(key: K, value: ModPointsSystemSettings[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <Card>
      <CardHeader
        title="Sign-in settings"
        description="Cluster-wide points configuration. Changes are saved once and pushed to every connected game server."
        action={
          <div className="flex items-center gap-3">
            <span className="text-sm text-[var(--color-muted)]">Enable points system</span>
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
        <Input label="Sign-in command" value={form.signInCmd} onChange={(e) => set('signInCmd', e.target.value)} />
        <Input
          label="Sign-in interval (seconds)"
          type="number"
          value={form.signInInterval}
          onChange={(e) => set('signInInterval', Number(e.target.value))}
        />
        <Input
          label="Sign-in reward points"
          type="number"
          value={form.signInRewardPoints}
          onChange={(e) => set('signInRewardPoints', Number(e.target.value))}
        />
        <Input
          label="Query points command"
          value={form.queryPointsCmd}
          onChange={(e) => set('queryPointsCmd', e.target.value)}
        />
        <Input
          label="Sign-in success tip"
          className="lg:col-span-2"
          value={form.signInSuccessTip}
          onChange={(e) => set('signInSuccessTip', e.target.value)}
        />
        <Input
          label="Sign-in failure tip"
          className="lg:col-span-2"
          value={form.signInFailureTip}
          onChange={(e) => set('signInFailureTip', e.target.value)}
        />
        <Input
          label="Query points tip"
          className="lg:col-span-2"
          value={form.queryPointsTip}
          onChange={(e) => set('queryPointsTip', e.target.value)}
        />
      </div>

      <div className="my-8 border-t border-[var(--color-border)] pt-8">
        <div className="mb-5 flex items-center gap-3">
          <h3 className="font-semibold">Currency exchange</h3>
          <Toggle
            checked={form.isCurrencyExchangeEnabled}
            onChange={(v) => set('isCurrencyExchangeEnabled', v)}
          />
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          <Input
            label="Exchange rate"
            type="number"
            step="0.001"
            value={form.currencyToPointsExchangeRate}
            onChange={(e) => set('currencyToPointsExchangeRate', Number(e.target.value))}
          />
          <Input
            label="Exchange command"
            value={form.currencyExchangeCmd}
            onChange={(e) => set('currencyExchangeCmd', e.target.value)}
          />
          <Input
            label="Exchange success tip"
            className="lg:col-span-2"
            value={form.exchangeSuccessTip}
            onChange={(e) => set('exchangeSuccessTip', e.target.value)}
          />
          <Input
            label="Exchange failure tip"
            className="lg:col-span-2"
            value={form.exchangeFailureTip}
            onChange={(e) => set('exchangeFailureTip', e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          {saveMutation.isPending ? 'Saving…' : 'Save'}
        </Button>
        <Button variant="secondary" onClick={() => resetMutation.mutate()} disabled={resetMutation.isPending}>
          Reset
        </Button>
      </div>

      <SyncStatusBanner sync={lastSync} />
    </Card>
  );
}
