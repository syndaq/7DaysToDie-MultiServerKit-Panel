import type { ModGlobalSettings } from '@msk-panel/shared';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card, CardHeader } from '../ui/Card';
import { Input, Textarea } from '../ui/Input';
import { Toggle } from '../ui/Toggle';
import { ErrorBanner, LoadingState } from '../ui/PageHeader';
import { useModSettings } from '../../hooks/useModSettings';
import {
  arrayToLines,
  defaultGlobalSettings,
  linesToArray,
  normalizeGlobalSettings,
} from '../../lib/mod-settings';
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

export function GlobalSettingsForm({ serverId }: { serverId: string }) {
  const {
    form,
    setForm,
    isLoading,
    error,
    refetch,
    isFetching,
    saveMutation,
    resetMutation,
  } = useModSettings(serverId, 'GlobalSettings', defaultGlobalSettings, normalizeGlobalSettings);

  if (isLoading) return <LoadingState label="Loading global settings…" />;
  if (error) return <ErrorBanner message={(error as Error).message} />;

  const set = <K extends keyof ModGlobalSettings>(key: K, value: ModGlobalSettings[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const setTrigger = (
    key: 'killZombieTrigger' | 'deathTrigger',
    patch: Partial<ModGlobalSettings['killZombieTrigger']>,
  ) => setForm((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));

  const setAutoRestart = (patch: Partial<ModGlobalSettings['autoRestart']>) =>
    setForm((prev) => ({ ...prev, autoRestart: { ...prev.autoRestart, ...patch } }));

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader
          title="Global settings"
          description="Per-server chat formatting, protection rules, triggers, and maintenance options from the game mod."
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
        <CardHeader title="Chat" description="Server name tags and chat command formatting." />
        <div className="grid gap-5 lg:grid-cols-2">
          <Input
            label="Global server name"
            value={form.globalServerName}
            onChange={(e) => set('globalServerName', e.target.value)}
          />
          <Input
            label="Whisper server name"
            value={form.whisperServerName}
            onChange={(e) => set('whisperServerName', e.target.value)}
          />
          <Input
            label="Chat command prefix"
            value={form.chatCommandPrefix}
            onChange={(e) => set('chatCommandPrefix', e.target.value)}
          />
          <Input
            label="Chat command separator"
            value={form.chatCommandSeparator}
            onChange={(e) => set('chatCommandSeparator', e.target.value)}
          />
          <Input
            label="Chat message error"
            value={form.handleChatMessageError}
            onChange={(e) => set('handleChatMessageError', e.target.value)}
          />
          <ToggleRow
            label="Hide command in chat"
            checked={form.hideCommandInChat}
            onChange={(value) => set('hideCommandInChat', value)}
          />
        </div>
      </Card>

      <Card>
        <CardHeader title="Teleport" description="Safety checks before teleporting players." />
        <div className="grid gap-5 lg:grid-cols-2">
          <ToggleRow
            label="Check zombies before teleport"
            checked={form.teleZombieCheck}
            onChange={(value) => set('teleZombieCheck', value)}
          />
          <Input
            label="Teleport disabled tip"
            value={form.teleDisableTip}
            onChange={(e) => set('teleDisableTip', e.target.value)}
          />
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Protection"
          description="Land claim, trader area, falling block, and POI sleeping bag rules."
        />
        <div className="grid gap-5 lg:grid-cols-2">
          <ToggleRow
            label="Land claim protection"
            checked={form.enableLandClaimProtection}
            onChange={(value) => set('enableLandClaimProtection', value)}
          />
          <Input
            label="Land claim protection tip"
            value={form.landClaimProtectionTip ?? ''}
            onChange={(e) => set('landClaimProtectionTip', e.target.value || null)}
          />
          <ToggleRow
            label="Trader area protection"
            checked={form.enableTraderAreaProtection}
            onChange={(value) => set('enableTraderAreaProtection', value)}
          />
          <Input
            label="Trader area protection tip"
            value={form.traderAreaProtectionTip ?? ''}
            onChange={(e) => set('traderAreaProtectionTip', e.target.value || null)}
          />
          <ToggleRow
            label="Falling block protection"
            checked={form.enableFallingBlockProtection}
            onChange={(value) => set('enableFallingBlockProtection', value)}
          />
          <ToggleRow
            label="Remove sleeping bag from POI"
            checked={form.removeSleepingBagFromPOI}
            onChange={(value) => set('removeSleepingBagFromPOI', value)}
          />
          <Input
            label="POI sleeping bag tip"
            value={form.removeSleepingBagFromPoiTip ?? ''}
            onChange={(e) => set('removeSleepingBagFromPoiTip', e.target.value || null)}
          />
        </div>
      </Card>

      <Card>
        <CardHeader title="Kill zombie trigger" description="Console commands run when a player kills a zombie." />
        <div className="space-y-4">
          <ToggleRow
            label="Enable kill zombie trigger"
            checked={form.killZombieTrigger.isEnabled}
            onChange={(value) => setTrigger('killZombieTrigger', { isEnabled: value })}
          />
          <Textarea
            label="Execute commands (one per line)"
            hint="Available variables: {EntityId}, {PlayerId}, {PlayerName}"
            rows={5}
            value={arrayToLines(form.killZombieTrigger.executeCommands)}
            onChange={(value) =>
              setTrigger('killZombieTrigger', { executeCommands: linesToArray(value) })
            }
          />
        </div>
      </Card>

      <Card>
        <CardHeader title="Death trigger" description="Console commands run when a player dies." />
        <div className="space-y-4">
          <ToggleRow
            label="Enable death trigger"
            checked={form.deathTrigger.isEnabled}
            onChange={(value) => setTrigger('deathTrigger', { isEnabled: value })}
          />
          <Textarea
            label="Execute commands (one per line)"
            hint="Available variables: {EntityId}, {PlayerId}, {PlayerName}"
            rows={5}
            value={arrayToLines(form.deathTrigger.executeCommands)}
            onChange={(value) =>
              setTrigger('deathTrigger', { executeCommands: linesToArray(value) })
            }
          />
        </div>
      </Card>

      <Card>
        <CardHeader title="Auto restart" description="Scheduled daily restart with warning messages." />
        <div className="space-y-4">
          <ToggleRow
            label="Enable auto restart"
            checked={form.autoRestart.isEnabled}
            onChange={(value) => setAutoRestart({ isEnabled: value })}
          />
          <div className="grid gap-5 lg:grid-cols-2">
            <Input
              label="Restart hour (0–23)"
              type="number"
              min={0}
              max={23}
              value={form.autoRestart.restartHour}
              onChange={(e) => setAutoRestart({ restartHour: Number(e.target.value) })}
            />
            <Input
              label="Restart minute (0–59)"
              type="number"
              min={0}
              max={59}
              value={form.autoRestart.restartMinute}
              onChange={(e) => setAutoRestart({ restartMinute: Number(e.target.value) })}
            />
          </div>
          <Textarea
            label="Warning messages (one per line)"
            rows={4}
            value={arrayToLines(form.autoRestart.messages)}
            onChange={(value) => setAutoRestart({ messages: linesToArray(value) })}
          />
        </div>
      </Card>

      <Card>
        <CardHeader title="Advanced" description="Spawn point, zombie cleanup, and account restrictions." />
        <div className="grid gap-5 lg:grid-cols-2">
          <ToggleRow
            label="Block family sharing accounts"
            checked={form.blockFamilySharingAccount}
            onChange={(value) => set('blockFamilySharingAccount', value)}
          />
          <ToggleRow
            label="Enable player initial spawn point"
            checked={form.isEnablePlayerInitialSpawnPoint}
            onChange={(value) => set('isEnablePlayerInitialSpawnPoint', value)}
          />
          <Input
            label="Player initial position"
            hint="Format: x,y,z or leave empty"
            value={form.playerInitialPosition ?? ''}
            onChange={(e) => set('playerInitialPosition', e.target.value || null)}
          />
          <ToggleRow
            label="Enable auto zombie cleanup"
            checked={form.enableAutoZombieCleanup}
            onChange={(value) => set('enableAutoZombieCleanup', value)}
          />
          <Input
            label="Auto zombie cleanup threshold"
            type="number"
            min={1}
            value={form.autoZombieCleanupThreshold}
            onChange={(e) => set('autoZombieCleanupThreshold', Number(e.target.value))}
          />
          <ToggleRow
            label="Enable XML secondary overwrite"
            checked={form.enableXmlsSecondaryOverwrite}
            onChange={(value) => set('enableXmlsSecondaryOverwrite', value)}
          />
        </div>
      </Card>
    </div>
  );
}
