import type { ModMuteCommandSettings } from '@msk-panel/shared';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card, CardHeader } from '../ui/Card';
import { Input, Textarea } from '../ui/Input';
import { Toggle } from '../ui/Toggle';
import { ErrorBanner, LoadingState } from '../ui/PageHeader';
import { useModSettings } from '../../hooks/useModSettings';
import {
  arrayToLines,
  defaultMuteCommandSettings,
  linesToArray,
  normalizeMuteCommandSettings,
} from '../../lib/mod-settings';
import { ModSettingsActions } from '../server/ModSettingsActions';
import { IconRefresh } from '../ui/icons';

export function MuteCommandsForm({ serverId }: { serverId: string }) {
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
    'MuteCommand',
    defaultMuteCommandSettings,
    normalizeMuteCommandSettings,
  );

  if (isLoading) return <LoadingState label="Loading mute command settings…" />;
  if (error) return <ErrorBanner message={(error as Error).message} />;

  const set = <K extends keyof ModMuteCommandSettings>(key: K, value: ModMuteCommandSettings[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader
          title="Mute commands"
          description="Block specific chat commands on this server. Players see the muted tip when they try a blocked command."
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
            <ErrorBanner message={((saveMutation.error ?? resetMutation.error) as Error).message} />
          </div>
        )}
        {saveMutation.isSuccess && (
          <p className="mb-4 text-sm text-[var(--color-success)]">Settings saved to game server.</p>
        )}

        <div className="grid gap-5">
          <Textarea
            label="Muted commands (one per line)"
            rows={8}
            value={arrayToLines(form.mutedCommands)}
            onChange={(value) => set('mutedCommands', linesToArray(value))}
            hint="Match the command text after the global chat prefix, e.g. lottery or draw."
          />
          <Input
            label="Muted tip"
            className="lg:col-span-2"
            value={form.mutedTip}
            onChange={(e) => set('mutedTip', e.target.value)}
          />
        </div>
      </Card>
    </div>
  );
}
