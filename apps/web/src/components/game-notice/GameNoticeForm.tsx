import type { ModGameNoticeSettings } from '@msk-panel/shared';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card, CardHeader } from '../ui/Card';
import { Input, Textarea } from '../ui/Input';
import { Toggle } from '../ui/Toggle';
import { ErrorBanner, LoadingState } from '../ui/PageHeader';
import { useModSettings } from '../../hooks/useModSettings';
import {
  arrayToLines,
  defaultGameNoticeSettings,
  linesToArray,
  normalizeGameNoticeSettings,
} from '../../lib/mod-settings';
import { ModSettingsActions } from '../server/ModSettingsActions';
import { IconRefresh } from '../ui/icons';

const bloodMoonVariables = ['{BloodMoonDays}', '{BloodMoonStartTime}', '{BloodMoonEndTime}'];

export function GameNoticeForm({ serverId }: { serverId: string }) {
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
    'GameNotice',
    defaultGameNoticeSettings,
    normalizeGameNoticeSettings,
  );

  if (isLoading) return <LoadingState label="Loading game notice settings…" />;
  if (error) return <ErrorBanner message={(error as Error).message} />;

  const set = <K extends keyof ModGameNoticeSettings>(key: K, value: ModGameNoticeSettings[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader
          title="Game notice"
          description="Welcome message, rotating broadcasts, and blood moon announcements for this server."
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
      </Card>

      <Card>
        <CardHeader title="Welcome notice" description="Shown when a player joins the server." />
        <Textarea
          label="Welcome notice"
          rows={4}
          value={form.welcomeNotice}
          onChange={(value) => set('welcomeNotice', value)}
        />
      </Card>

      <Card>
        <CardHeader
          title="Rotating notices"
          description="Broadcast messages cycled on a timer while players are online."
        />
        <div className="grid gap-5 lg:grid-cols-2">
          <Input
            label="Rotating interval (seconds)"
            type="number"
            min={30}
            value={form.rotatingInterval}
            onChange={(e) => set('rotatingInterval', Number(e.target.value))}
          />
        </div>
        <div className="mt-5">
          <Textarea
            label="Rotating notices (one per line)"
            rows={6}
            value={arrayToLines(form.rotatingNotices)}
            onChange={(value) => set('rotatingNotices', linesToArray(value))}
          />
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Blood moon notices"
          description="Messages shown before and during blood moon events."
        />
        <div className="mb-4 flex flex-wrap gap-2">
          {bloodMoonVariables.map((variable) => (
            <code
              key={variable}
              className="rounded-lg bg-[var(--color-accent-soft)] px-2.5 py-1 text-xs font-medium text-[var(--color-accent)]"
            >
              {variable}
            </code>
          ))}
        </div>
        <div className="grid gap-5">
          <Textarea
            label="Blood moon notice 1 (days until)"
            rows={3}
            value={form.bloodMoonNotice1}
            onChange={(value) => set('bloodMoonNotice1', value)}
          />
          <Textarea
            label="Blood moon notice 2 (starts today)"
            rows={3}
            value={form.bloodMoonNotice2}
            onChange={(value) => set('bloodMoonNotice2', value)}
          />
          <Textarea
            label="Blood moon notice 3 (during blood moon)"
            rows={3}
            value={form.bloodMoonNotice3}
            onChange={(value) => set('bloodMoonNotice3', value)}
          />
        </div>
      </Card>
    </div>
  );
}
