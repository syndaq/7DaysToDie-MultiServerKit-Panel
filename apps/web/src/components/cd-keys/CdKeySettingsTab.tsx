import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ClusterSyncResult, ModCdKeyRedeemSettings } from '@msk-panel/shared';
import { Button } from '../ui/Button';
import { Card, CardHeader } from '../ui/Card';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Toggle } from '../ui/Toggle';
import { ErrorBanner, LoadingState } from '../ui/PageHeader';
import { SyncStatusBanner } from '../ui/SyncStatusBanner';
import { api } from '../../lib/api';

const variables = ['{CdKeyDescription}', '{EntityId}', '{PlayerId}', '{PlayerName}'];

const defaultSettings: ModCdKeyRedeemSettings = {
  isEnabled: false,
  hasAlreadyRedeemedTip: '',
  hasReachedMaxRedemptionLimitTip: '',
  hasRedemptionCodeExpiredTip: '',
  redeemSuccessTip: '',
};

export function CdKeySettingsTab() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<ModCdKeyRedeemSettings>(defaultSettings);
  const [lastSync, setLastSync] = useState<ClusterSyncResult[]>();

  const { data, isLoading, error } = useQuery({
    queryKey: ['cd-key-settings'],
    queryFn: () => api.getCdKeySettings(),
  });

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: () => api.updateCdKeySettings(form),
    onSuccess: (result) => {
      setLastSync(result.sync);
      queryClient.invalidateQueries({ queryKey: ['cd-key-settings'] });
    },
  });

  const resetMutation = useMutation({
    mutationFn: () => api.resetCdKeySettings(),
    onSuccess: (result) => {
      if (result.settings) setForm(result.settings);
      setLastSync(result.sync);
      queryClient.invalidateQueries({ queryKey: ['cd-key-settings'] });
    },
  });

  if (isLoading) return <LoadingState label="Loading CD key settings…" />;
  if (error) return <ErrorBanner message={(error as Error).message} />;

  const set = <K extends keyof ModCdKeyRedeemSettings>(key: K, value: ModCdKeyRedeemSettings[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <Card>
      <CardHeader
        title="CD key redeem settings"
        description="Cluster-wide redemption messages and command behavior. Saved once and synced to every connected server."
        action={
          <div className="flex items-center gap-3">
            <span className="text-sm text-[var(--color-muted)]">Enable CD key redeem</span>
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

      <div className="grid gap-5">
        <Input
          label="Has already redeemed tip"
          value={form.hasAlreadyRedeemedTip}
          onChange={(e) => set('hasAlreadyRedeemedTip', e.target.value)}
        />
        <Input
          label="Has reached max redemption limit tip"
          value={form.hasReachedMaxRedemptionLimitTip}
          onChange={(e) => set('hasReachedMaxRedemptionLimitTip', e.target.value)}
        />
        <Input
          label="Has redemption code expired tip"
          value={form.hasRedemptionCodeExpiredTip}
          onChange={(e) => set('hasRedemptionCodeExpiredTip', e.target.value)}
        />
        <Input
          label="Redeem success tip"
          value={form.redeemSuccessTip}
          onChange={(e) => set('redeemSuccessTip', e.target.value)}
        />
      </div>

      <p className="mt-6 text-sm text-[var(--color-success)]">
        Tip: Players type the CD key code directly in chat to redeem rewards bound to that key.
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
