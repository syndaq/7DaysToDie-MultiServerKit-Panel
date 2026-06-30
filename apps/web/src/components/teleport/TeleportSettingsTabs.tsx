import type { Dispatch, ReactNode, SetStateAction } from 'react';
import type { ModTeleportCitySettings, ModTeleportFriendSettings, ModTeleportHomeSettings } from '@msk-panel/shared';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card, CardHeader } from '../ui/Card';
import { Input, Textarea } from '../ui/Input';
import { Toggle } from '../ui/Toggle';
import { ErrorBanner, LoadingState } from '../ui/PageHeader';
import { useModSettings } from '../../hooks/useModSettings';
import {
  defaultTeleportCitySettings,
  defaultTeleportFriendSettings,
  defaultTeleportHomeSettings,
  normalizeTeleportCitySettings,
  normalizeTeleportFriendSettings,
  normalizeTeleportHomeSettings,
} from '../../lib/mod-settings';
import { ModSettingsActions } from '../server/ModSettingsActions';
import { IconRefresh } from '../ui/icons';

function SettingsShell<T extends { isEnabled: boolean }>({
  title,
  description,
  form,
  setForm,
  isFetching,
  refetch,
  saveMutation,
  resetMutation,
  children,
}: {
  title: string;
  description: string;
  form: T;
  setForm: Dispatch<SetStateAction<T>>;
  isFetching: boolean;
  refetch: () => void;
  saveMutation: { mutate: () => void; isPending: boolean; error: Error | null; isSuccess: boolean };
  resetMutation: { mutate: () => void; isPending: boolean; error: Error | null };
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader
        title={title}
        description={description}
        action={
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant={form.isEnabled ? 'success' : 'neutral'}>
              {form.isEnabled ? 'Enabled' : 'Disabled'}
            </Badge>
            <Toggle
              checked={form.isEnabled}
              onChange={(value) => setForm((prev) => ({ ...prev, isEnabled: value }))}
            />
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
      {saveMutation.isSuccess && (
        <p className="mb-4 text-sm text-[var(--color-success)]">Settings saved to game server.</p>
      )}
      <div className="grid gap-4 md:grid-cols-2">{children}</div>
    </Card>
  );
}

export function TeleportFriendSettingsTab({ serverId }: { serverId: string }) {
  const hook = useModSettings(
    serverId,
    'TeleportFriend',
    defaultTeleportFriendSettings,
    normalizeTeleportFriendSettings,
  );
  if (hook.isLoading) return <LoadingState label="Loading friend teleport settings…" />;
  if (hook.error) return <ErrorBanner message={(hook.error as Error).message} />;
  const set = <K extends keyof ModTeleportFriendSettings>(key: K, value: ModTeleportFriendSettings[K]) =>
    hook.setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <SettingsShell
      title="Friend teleport"
      description="Configure friend-to-friend teleport commands and tips."
      form={hook.form}
      setForm={hook.setForm}
      isFetching={hook.isFetching}
      refetch={() => hook.refetch()}
      saveMutation={hook.saveMutation as {
        mutate: () => void;
        isPending: boolean;
        error: Error | null;
        isSuccess: boolean;
      }}
      resetMutation={hook.resetMutation as {
        mutate: () => void;
        isPending: boolean;
        error: Error | null;
      }}
    >
      <Input label="Command prefix" value={hook.form.teleCmdPrefix} onChange={(e) => set('teleCmdPrefix', e.target.value)} />
      <Input label="Teleport interval (sec)" type="number" value={String(hook.form.teleInterval)} onChange={(e) => set('teleInterval', Number(e.target.value))} />
      <Input label="Points required" type="number" value={String(hook.form.pointsRequired)} onChange={(e) => set('pointsRequired', Number(e.target.value))} />
      <Input label="Keep duration (sec)" type="number" value={String(hook.form.keepDuration)} onChange={(e) => set('keepDuration', Number(e.target.value))} />
      <Input label="Accept keyword" value={hook.form.acceptTele} onChange={(e) => set('acceptTele', e.target.value)} />
      <Input label="Reject keyword" value={hook.form.rejectTele} onChange={(e) => set('rejectTele', e.target.value)} />
      <div className="flex items-center justify-between rounded-xl border border-[var(--color-border)] px-4 py-3 md:col-span-2">
        <span className="text-sm font-medium">Bypass friend check</span>
        <Toggle checked={hook.form.isFriendBypass} onChange={(v) => set('isFriendBypass', v)} />
      </div>
      <div className="md:col-span-2">
        <Textarea label="Teleport success tip" rows={2} value={hook.form.teleSuccessTip} onChange={(v) => set('teleSuccessTip', v)} />
      </div>
      <div className="md:col-span-2">
        <Textarea label="Cooling tip" rows={2} value={hook.form.coolingTip} onChange={(v) => set('coolingTip', v)} />
      </div>
      <div className="md:col-span-2">
        <Textarea label="Target not found tip" rows={2} value={hook.form.targetNotFoundTip} onChange={(v) => set('targetNotFoundTip', v)} />
      </div>
      <div className="md:col-span-2">
        <Textarea label="Teleport confirm tip" rows={2} value={hook.form.teleConfirmTip} onChange={(v) => set('teleConfirmTip', v)} />
      </div>
    </SettingsShell>
  );
}

export function TeleportHomeSettingsTab({ serverId }: { serverId: string }) {
  const hook = useModSettings(
    serverId,
    'TeleportHome',
    defaultTeleportHomeSettings,
    normalizeTeleportHomeSettings,
  );
  if (hook.isLoading) return <LoadingState label="Loading home teleport settings…" />;
  if (hook.error) return <ErrorBanner message={(hook.error as Error).message} />;
  const set = <K extends keyof ModTeleportHomeSettings>(key: K, value: ModTeleportHomeSettings[K]) =>
    hook.setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <SettingsShell
      title="Home teleport"
      description="Configure set-home, delete-home, and teleport-home commands."
      form={hook.form}
      setForm={hook.setForm}
      isFetching={hook.isFetching}
      refetch={() => hook.refetch()}
      saveMutation={hook.saveMutation as {
        mutate: () => void;
        isPending: boolean;
        error: Error | null;
        isSuccess: boolean;
      }}
      resetMutation={hook.resetMutation as {
        mutate: () => void;
        isPending: boolean;
        error: Error | null;
      }}
    >
      <Input label="Query list command" value={hook.form.queryListCmd} onChange={(e) => set('queryListCmd', e.target.value)} />
      <Input label="Set home prefix" value={hook.form.setHomeCmdPrefix} onChange={(e) => set('setHomeCmdPrefix', e.target.value)} />
      <Input label="Delete home prefix" value={hook.form.deleteHomeCmdPrefix} onChange={(e) => set('deleteHomeCmdPrefix', e.target.value)} />
      <Input label="Teleport home prefix" value={hook.form.teleHomeCmdPrefix} onChange={(e) => set('teleHomeCmdPrefix', e.target.value)} />
      <Input label="Max homes" type="number" value={String(hook.form.setCountLimit)} onChange={(e) => set('setCountLimit', Number(e.target.value))} />
      <Input label="Teleport interval (sec)" type="number" value={String(hook.form.teleInterval)} onChange={(e) => set('teleInterval', Number(e.target.value))} />
      <Input label="Points to set home" type="number" value={String(hook.form.pointsRequiredForSet)} onChange={(e) => set('pointsRequiredForSet', Number(e.target.value))} />
      <Input label="Points to teleport" type="number" value={String(hook.form.pointsRequiredForTele)} onChange={(e) => set('pointsRequiredForTele', Number(e.target.value))} />
      <div className="md:col-span-2">
        <Textarea label="Location list tip" rows={2} value={hook.form.locationItemTip} onChange={(v) => set('locationItemTip', v)} />
      </div>
      <div className="md:col-span-2">
        <Textarea label="Teleport success tip" rows={2} value={hook.form.teleSuccessTip} onChange={(v) => set('teleSuccessTip', v)} />
      </div>
    </SettingsShell>
  );
}

export function TeleportCitySettingsTab({ serverId }: { serverId: string }) {
  const hook = useModSettings(
    serverId,
    'TeleportCity',
    defaultTeleportCitySettings,
    normalizeTeleportCitySettings,
  );
  if (hook.isLoading) return <LoadingState label="Loading city teleport settings…" />;
  if (hook.error) return <ErrorBanner message={(hook.error as Error).message} />;
  const set = <K extends keyof ModTeleportCitySettings>(key: K, value: ModTeleportCitySettings[K]) =>
    hook.setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <SettingsShell
      title="City teleport"
      description="Configure city list and teleport commands."
      form={hook.form}
      setForm={hook.setForm}
      isFetching={hook.isFetching}
      refetch={() => hook.refetch()}
      saveMutation={hook.saveMutation as {
        mutate: () => void;
        isPending: boolean;
        error: Error | null;
        isSuccess: boolean;
      }}
      resetMutation={hook.resetMutation as {
        mutate: () => void;
        isPending: boolean;
        error: Error | null;
      }}
    >
      <Input label="Query list command" value={hook.form.queryListCmd} onChange={(e) => set('queryListCmd', e.target.value)} />
      <Input label="Teleport command prefix" value={hook.form.teleCmdPrefix} onChange={(e) => set('teleCmdPrefix', e.target.value)} />
      <Input label="Teleport interval (sec)" type="number" value={String(hook.form.teleInterval)} onChange={(e) => set('teleInterval', Number(e.target.value))} />
      <div className="md:col-span-2">
        <Textarea label="Location list tip" rows={2} value={hook.form.locationItemTip} onChange={(v) => set('locationItemTip', v)} />
      </div>
      <div className="md:col-span-2">
        <Textarea label="Teleport success tip" rows={2} value={hook.form.teleSuccessTip} onChange={(v) => set('teleSuccessTip', v)} />
      </div>
      <div className="md:col-span-2">
        <Textarea label="No city tip" rows={2} value={hook.form.noLocation} onChange={(v) => set('noLocation', v)} />
      </div>
    </SettingsShell>
  );
}
