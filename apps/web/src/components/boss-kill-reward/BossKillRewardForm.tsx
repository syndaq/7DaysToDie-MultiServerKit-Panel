import type { ModBossKillRewardSettings } from '@msk-panel/shared';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card, CardHeader } from '../ui/Card';
import { Input, Textarea } from '../ui/Input';
import { Toggle } from '../ui/Toggle';
import { ErrorBanner, LoadingState } from '../ui/PageHeader';
import { useModSettings } from '../../hooks/useModSettings';
import {
  defaultBossKillRewardSettings,
  enemyRewardMapToRows,
  normalizeBossKillRewardSettings,
  rowsToEnemyRewardMap,
} from '../../lib/mod-settings';
import { ModSettingsActions } from '../server/ModSettingsActions';
import { IconPlus, IconRefresh } from '../ui/icons';

type RewardRow = { entityName: string; reward: number };

export function BossKillRewardForm({ serverId }: { serverId: string }) {
  const {
    form,
    setForm,
    isLoading,
    error,
    refetch,
    isFetching,
    saveMutation,
    resetMutation,
  } = useModSettings(
    serverId,
    'BossKillReward',
    defaultBossKillRewardSettings,
    normalizeBossKillRewardSettings,
  );

  if (isLoading) return <LoadingState label="Loading boss kill reward settings…" />;
  if (error) return <ErrorBanner message={(error as Error).message} />;

  const set = <K extends keyof ModBossKillRewardSettings>(key: K, value: ModBossKillRewardSettings[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const rewardRows = enemyRewardMapToRows(form.enemyRewardMap);

  const updateRows = (next: RewardRow[]) => {
    set('enemyRewardMap', rowsToEnemyRewardMap(next));
  };

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader
          title="Boss kill reward"
          description="Award points when players kill configured boss entities. Unmapped enemies use the fallback reward."
          action={
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant={form.isEnabled ? 'success' : 'neutral'}>
                {form.isEnabled ? 'Enabled' : 'Disabled'}
              </Badge>
              <Toggle checked={form.isEnabled} onChange={(value) => set('isEnabled', value)} />
              <Button variant="ghost" size="sm" icon={<IconRefresh />} onClick={() => refetch()}>
                {isFetching ? 'Refreshing…' : 'Refresh'}
              </Button>
              <ModSettingsActions
                onSave={() => saveMutation.mutate()}
                onReset={() => resetMutation.mutate()}
                saving={saveMutation.isPending}
                resetting={resetMutation.isPending}
              />
            </div>
          }
        />

        {saveMutation.error || resetMutation.error ? (
          <div className="mb-4">
            <ErrorBanner message={((saveMutation.error ?? resetMutation.error) as Error).message} />
          </div>
        ) : null}
        {saveMutation.isSuccess ? (
          <p className="mb-4 text-sm text-[var(--color-success)]">Settings saved to game server.</p>
        ) : null}

        <div className="grid gap-5">
          <Input
            label="Fallback reward (points)"
            type="number"
            value={String(form.fallbackReward)}
            onChange={(e) => set('fallbackReward', Number(e.target.value))}
            hint="Points granted when the killed entity is not listed below. Set to 0 to skip unmapped kills."
          />
          <Textarea
            label="Kill tip"
            rows={3}
            value={form.killTip}
            onChange={(value) => set('killTip', value)}
            hint="Sent to the killer. Supports {EntityName}, {PlayerName}, {PlayerId}, {EntityId}."
          />
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Enemy reward map"
          description="Map entity class names to point rewards. Overrides the fallback for matching kills."
          action={
            <Button
              variant="secondary"
              size="sm"
              icon={<IconPlus />}
              onClick={() =>
                updateRows([...rewardRows, { entityName: '', reward: form.fallbackReward }])
              }
            >
              Add entry
            </Button>
          }
        />

        {rewardRows.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">
            No per-entity overrides yet. All qualifying kills will use the fallback reward.
          </p>
        ) : (
          <div className="space-y-3">
            {rewardRows.map((row, index) => (
              <div
                key={`${row.entityName}-${index}`}
                className="grid gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-solid)] p-4 md:grid-cols-[1fr_140px_auto]"
              >
                <Input
                  label="Entity name"
                  value={row.entityName}
                  onChange={(e) => {
                    const next = [...rewardRows];
                    next[index] = { ...next[index], entityName: e.target.value };
                    updateRows(next);
                  }}
                  hint="e.g. zombieBoss, animalBear"
                />
                <Input
                  label="Points"
                  type="number"
                  value={String(row.reward)}
                  onChange={(e) => {
                    const next = [...rewardRows];
                    next[index] = { ...next[index], reward: Number(e.target.value) };
                    updateRows(next);
                  }}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="self-end !text-[var(--color-danger)]"
                  onClick={() => updateRows(rewardRows.filter((_, i) => i !== index))}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
