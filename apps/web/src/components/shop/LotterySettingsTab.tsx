import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ClusterSyncResult, ModLotterySettings } from '@msk-panel/shared';
import { Button } from '../ui/Button';
import { Card, CardHeader } from '../ui/Card';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Toggle } from '../ui/Toggle';
import { ErrorBanner, LoadingState } from '../ui/PageHeader';
import { SyncStatusBanner } from '../ui/SyncStatusBanner';
import { api } from '../../lib/api';

const variables = [
  '{PoolId}',
  '{PoolName}',
  '{DrawCost}',
  '{Weight}',
  '{EntityId}',
  '{PlayerId}',
  '{PlayerName}',
];

const defaultSettings: ModLotterySettings = {
  isEnabled: false,
  queryListCmd: 'lottery',
  drawCmdPrefix: 'draw',
  drawCost: 10,
  drawInterval: 60,
  poolItemTip: '',
  drawSuccessTip: '',
  pointsNotEnoughTip: '',
  coolingTip: '',
  noPoolTip: '',
};

export function LotterySettingsTab() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<ModLotterySettings>(defaultSettings);
  const [lastSync, setLastSync] = useState<ClusterSyncResult[]>();

  const { data, isLoading, error } = useQuery({
    queryKey: ['lottery-settings'],
    queryFn: () => api.getLotterySettings(),
  });

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: () => api.updateLotterySettings(form),
    onSuccess: (result) => {
      setLastSync(result.sync);
      queryClient.invalidateQueries({ queryKey: ['lottery-settings'] });
    },
  });

  const resetMutation = useMutation({
    mutationFn: () => api.resetLotterySettings(),
    onSuccess: (result) => {
      if (result.settings) setForm(result.settings);
      setLastSync(result.sync);
      queryClient.invalidateQueries({ queryKey: ['lottery-settings'] });
    },
  });

  if (isLoading) return <LoadingState label="Loading lottery settings…" />;
  if (error) return <ErrorBanner message={(error as Error).message} />;

  const set = <K extends keyof ModLotterySettings>(key: K, value: ModLotterySettings[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <Card>
      <CardHeader
        title="Lottery settings"
        description="Cluster-wide lottery configuration. Changes are saved once and pushed to every connected game server."
        action={
          <div className="flex items-center gap-3">
            <span className="text-sm text-[var(--color-muted)]">Enable lottery</span>
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
        <Input label="Query list command" value={form.queryListCmd} onChange={(e) => set('queryListCmd', e.target.value)} />
        <Input label="Draw command prefix" value={form.drawCmdPrefix} onChange={(e) => set('drawCmdPrefix', e.target.value)} />
        <Input label="Default draw cost" type="number" min={0} value={form.drawCost} onChange={(e) => set('drawCost', Number(e.target.value))} />
        <Input label="Draw cooldown (seconds)" type="number" min={0} value={form.drawInterval} onChange={(e) => set('drawInterval', Number(e.target.value))} />
        <Input label="Pool list item tip" className="lg:col-span-2" value={form.poolItemTip} onChange={(e) => set('poolItemTip', e.target.value)} />
        <Input label="Draw success tip" className="lg:col-span-2" value={form.drawSuccessTip} onChange={(e) => set('drawSuccessTip', e.target.value)} />
        <Input label="Points not enough tip" className="lg:col-span-2" value={form.pointsNotEnoughTip} onChange={(e) => set('pointsNotEnoughTip', e.target.value)} />
        <Input label="Cooldown tip" className="lg:col-span-2" value={form.coolingTip} onChange={(e) => set('coolingTip', e.target.value)} />
        <Input label="No pool tip" className="lg:col-span-2" value={form.noPoolTip} onChange={(e) => set('noPoolTip', e.target.value)} />
      </div>

      <p className="mt-6 text-sm text-[var(--color-success)]">
        Tip: Players can type <code className="rounded bg-[var(--color-surface-2)] px-1.5 py-0.5">{form.drawCmdPrefix ?? 'draw'}-1</code> in-game to draw from pool #1.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>Save</Button>
        <Button variant="secondary" onClick={() => resetMutation.mutate()} disabled={resetMutation.isPending}>Reset</Button>
      </div>

      <SyncStatusBanner sync={lastSync} />
    </Card>
  );
}
