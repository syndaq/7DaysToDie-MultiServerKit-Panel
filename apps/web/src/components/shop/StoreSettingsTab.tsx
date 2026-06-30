import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ClusterSyncResult, ModGameStoreSettings } from '@msk-panel/shared';
import { Button } from '../ui/Button';
import { Card, CardHeader } from '../ui/Card';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Toggle } from '../ui/Toggle';
import { ErrorBanner, LoadingState } from '../ui/PageHeader';
import { SyncStatusBanner } from '../ui/SyncStatusBanner';
import { api } from '../../lib/api';

const variables = ['{GoodsId}', '{GoodsName}', '{Price}', '{EntityId}', '{PlayerId}', '{PlayerName}'];

const defaultSettings: ModGameStoreSettings = {
  isEnabled: false,
  queryListCmd: 'buy',
  buyCmdPrefix: 'buy',
  goodsItemTip: '',
  buySuccessTip: '',
  pointsNotEnoughTip: '',
  noGoods: '',
};

export function StoreSettingsTab() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<ModGameStoreSettings>(defaultSettings);
  const [lastSync, setLastSync] = useState<ClusterSyncResult[]>();

  const { data, isLoading, error } = useQuery({
    queryKey: ['shop-settings'],
    queryFn: () => api.getShopSettings(),
  });

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: () => api.updateShopSettings(form),
    onSuccess: (result) => {
      setLastSync(result.sync);
      queryClient.invalidateQueries({ queryKey: ['shop-settings'] });
    },
  });

  const resetMutation = useMutation({
    mutationFn: () => api.resetShopSettings(),
    onSuccess: (result) => {
      if (result.settings) setForm(result.settings);
      setLastSync(result.sync);
      queryClient.invalidateQueries({ queryKey: ['shop-settings'] });
    },
  });

  if (isLoading) return <LoadingState label="Loading store settings…" />;
  if (error) return <ErrorBanner message={(error as Error).message} />;

  const set = <K extends keyof ModGameStoreSettings>(key: K, value: ModGameStoreSettings[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <Card>
      <CardHeader
        title="Store settings"
        description="Cluster-wide shop configuration. Changes are saved once and pushed to every connected game server."
        action={
          <div className="flex items-center gap-3">
            <span className="text-sm text-[var(--color-muted)]">Enable game store</span>
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
        <Input label="Buy command prefix" value={form.buyCmdPrefix} onChange={(e) => set('buyCmdPrefix', e.target.value)} />
        <Input label="Goods item tip" className="lg:col-span-2" value={form.goodsItemTip} onChange={(e) => set('goodsItemTip', e.target.value)} />
        <Input label="Buy success tip" className="lg:col-span-2" value={form.buySuccessTip} onChange={(e) => set('buySuccessTip', e.target.value)} />
        <Input label="Points not enough tip" className="lg:col-span-2" value={form.pointsNotEnoughTip} onChange={(e) => set('pointsNotEnoughTip', e.target.value)} />
        <Input label="No goods tip" className="lg:col-span-2" value={form.noGoods} onChange={(e) => set('noGoods', e.target.value)} />
      </div>

      <p className="mt-6 text-sm text-[var(--color-success)]">
        Tip: Players can type <code className="rounded bg-[var(--color-surface-2)] px-1.5 py-0.5">{form.buyCmdPrefix ?? 'buy'}</code> in-game to browse and purchase.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>Save</Button>
        <Button variant="secondary" onClick={() => resetMutation.mutate()} disabled={resetMutation.isPending}>Reset</Button>
      </div>

      <SyncStatusBanner sync={lastSync} />
    </Card>
  );
}
