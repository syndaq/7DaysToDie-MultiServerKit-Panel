import type { ModAutoBackupSettings } from '@msk-panel/shared';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card, CardHeader } from '../ui/Card';
import { Input } from '../ui/Input';
import { Toggle } from '../ui/Toggle';
import { ErrorBanner, LoadingState } from '../ui/PageHeader';
import { useModSettings } from '../../hooks/useModSettings';
import { defaultAutoBackupSettings, normalizeAutoBackupSettings } from '../../lib/mod-settings';
import { ModSettingsActions } from '../server/ModSettingsActions';
import { IconRefresh } from '../ui/icons';

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-solid)] px-4 py-3">
      <span className="text-sm font-medium">{label}</span>
      <Toggle checked={checked} onChange={onChange} label={label} />
    </div>
  );
}

export function BackupSettingsTab({ serverId }: { serverId: string }) {
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
    'AutoBackup',
    defaultAutoBackupSettings,
    normalizeAutoBackupSettings,
  );

  if (isLoading) return <LoadingState label="Loading backup settings…" />;
  if (error) return <ErrorBanner message={(error as Error).message} />;

  const set = <K extends keyof ModAutoBackupSettings>(key: K, value: ModAutoBackupSettings[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader
          title="Backup schedule"
          description="Automatic world backup interval and retention for this game server."
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

        {(saveMutation.error || resetMutation.error) && (
          <div className="mb-4">
            <ErrorBanner
              message={((saveMutation.error ?? resetMutation.error) as Error).message}
            />
          </div>
        )}
        {saveMutation.isSuccess && (
          <p className="mb-4 text-sm text-[var(--color-success)]">Settings saved to game server.</p>
        )}

        <div className="grid gap-5 lg:grid-cols-2">
          <Input
            label="Backup interval (seconds)"
            type="number"
            min={300}
            value={form.interval}
            onChange={(e) => set('interval', Number(e.target.value))}
            hint="Default: 7200 (2 hours)"
          />
          <Input
            label="Retained file count limit"
            type="number"
            min={1}
            value={form.retainedFileCountLimit}
            onChange={(e) => set('retainedFileCountLimit', Number(e.target.value))}
          />
          <Input
            label="Archive folder"
            value={form.archiveFolder}
            onChange={(e) => set('archiveFolder', e.target.value)}
            hint="Relative to the server install directory"
          />
          <ToggleRow
            label="Reset interval after manual backup"
            checked={form.resetIntervalAfterManualBackup}
            onChange={(value) => set('resetIntervalAfterManualBackup', value)}
          />
          <ToggleRow
            label="Skip backup when no players online"
            checked={form.skipIfThereAreNoPlayers}
            onChange={(value) => set('skipIfThereAreNoPlayers', value)}
          />
          <ToggleRow
            label="Auto backup on server startup"
            checked={form.autoBackupOnServerStartup}
            onChange={(value) => set('autoBackupOnServerStartup', value)}
          />
        </div>
      </Card>
    </div>
  );
}
