import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ModPvpArea, ModPvpAreaSettings, PvpDropMode, PvpKillMode } from '@msk-panel/shared';
import { ServerSelector } from '../components/ServerSelector';
import { Button } from '../components/ui/Button';
import { Card, CardHeader } from '../components/ui/Card';
import { Input, Select } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Toggle } from '../components/ui/Toggle';
import { StatCard } from '../components/ui/StatCard';
import { ErrorBanner, LoadingState } from '../components/ui/PageHeader';
import { PageShell } from '../components/ui/PageShell';
import { IconRefresh } from '../components/ui/icons';
import { api } from '../lib/api';
import { defaultPvpAreaSettings } from '../lib/mod-pvp-areas';
import {
  DROP_MODE_OPTIONS,
  KILL_MODE_OPTIONS,
  formatAreaRule,
  formatCoordinateRange,
  parseCoordinatePair,
} from '../lib/pvp-area-utils';

const emptyAreaForm = {
  cornerA: '',
  cornerB: '',
  areaNote: '',
  areaNoticeBuff: 'buffPvpVeNoticePvp',
  killMode: 'everyone' as PvpKillMode,
  dropOnDeath: 'all' as PvpDropMode,
  onlineLandClaimBonus: 4,
  offlineLandClaimBonus: 8,
  invulnerableClaim: false,
};

function ModeSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <Select label={label} value={value} onChange={onChange}>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </Select>
  );
}

export function PvpAreasPage() {
  const queryClient = useQueryClient();
  const [serverId, setServerId] = useState('');
  const [settingsForm, setSettingsForm] = useState<ModPvpAreaSettings>(defaultPvpAreaSettings);
  const [areaForm, setAreaForm] = useState(emptyAreaForm);
  const [actionError, setActionError] = useState<string | null>(null);

  const { data: servers } = useQuery({ queryKey: ['servers'], queryFn: api.getServers });

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['pvp-areas', serverId],
    queryFn: () => api.getPvpAreas(serverId),
    enabled: !!serverId,
  });

  useEffect(() => {
    if (data?.settings) setSettingsForm(data.settings);
  }, [data?.settings]);

  const saveSettingsMutation = useMutation({
    mutationFn: (payload?: ModPvpAreaSettings) =>
      api.updatePvpAreaSettings(serverId, payload ?? settingsForm),
    onSuccess: () => {
      setActionError(null);
      queryClient.invalidateQueries({ queryKey: ['pvp-areas', serverId] });
    },
    onError: (err) => setActionError((err as Error).message),
  });

  const resetSettingsMutation = useMutation({
    mutationFn: () => api.resetPvpAreaSettings(serverId),
    onSuccess: (result) => {
      setSettingsForm(result.settings);
      setActionError(null);
      queryClient.invalidateQueries({ queryKey: ['pvp-areas', serverId] });
    },
    onError: (err) => setActionError((err as Error).message),
  });

  const createAreaMutation = useMutation({
    mutationFn: () => {
      const cornerA = parseCoordinatePair(areaForm.cornerA);
      const cornerB = parseCoordinatePair(areaForm.cornerB);
      if (!cornerA || !cornerB) {
        throw new Error('Enter valid corner coordinates as x, z (e.g. 100, 200).');
      }
      return api.createPvpArea(serverId, {
        areaNote: areaForm.areaNote,
        x1: cornerA.x,
        z1: cornerA.z,
        x2: cornerB.x,
        z2: cornerB.z,
        areaNoticeBuff: areaForm.areaNoticeBuff,
        killMode: areaForm.killMode,
        dropOnDeath: areaForm.dropOnDeath,
        onlineLandClaimBonus: areaForm.onlineLandClaimBonus,
        offlineLandClaimBonus: areaForm.offlineLandClaimBonus,
        invulnerableClaim: areaForm.invulnerableClaim,
      });
    },
    onSuccess: () => {
      setActionError(null);
      setAreaForm(emptyAreaForm);
      queryClient.invalidateQueries({ queryKey: ['pvp-areas', serverId] });
    },
    onError: (err) => setActionError((err as Error).message),
  });

  const deleteAreaMutation = useMutation({
    mutationFn: (areaId: string) => api.deletePvpArea(serverId, areaId),
    onSuccess: () => {
      setActionError(null);
      queryClient.invalidateQueries({ queryKey: ['pvp-areas', serverId] });
    },
    onError: (err) => setActionError((err as Error).message),
  });

  const deleteAllMutation = useMutation({
    mutationFn: () => api.deleteAllPvpAreas(serverId),
    onSuccess: () => {
      setActionError(null);
      queryClient.invalidateQueries({ queryKey: ['pvp-areas', serverId] });
    },
    onError: (err) => setActionError((err as Error).message),
  });

  const summary = data?.summary ?? { total: 0, pvp: 0, pve: 0, invulnerableClaim: 0 };
  const areas = useMemo(() => data?.areas ?? [], [data?.areas]);
  const selectedServer = servers?.find((server) => server.id === serverId);

  return (
    <PageShell
      title="PVP/PVE mixed area management"
      description="Give different areas on the same map different damage, drop, and land claim bonuses. Entering or leaving an area takes effect instantly without rejoining or restarting."
      toolbar={
        <div className="flex flex-wrap items-end gap-4">
          <ServerSelector
            servers={servers ?? []}
            value={serverId}
            onChange={setServerId}
            emptyLabel="Select a game server…"
          />
          {selectedServer && (
            <div className="flex items-center gap-3 pb-1">
              <span className="text-sm text-[var(--color-muted)]">Feature status</span>
              <Toggle
                checked={settingsForm.isEnabled}
                onChange={(value) => {
                  const next = { ...settingsForm, isEnabled: value };
                  setSettingsForm(next);
                  saveSettingsMutation.mutate(next);
                }}
              />
              <Badge variant={settingsForm.isEnabled ? 'success' : 'neutral'}>
                {settingsForm.isEnabled ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
          )}
        </div>
      }
    >
      {!serverId ? (
        <Card>
          <p className="py-16 text-center text-[var(--color-muted)]">
            Select a game server to configure PVP/PVE areas for that map.
          </p>
        </Card>
      ) : isLoading ? (
        <LoadingState label="Loading PVP/PVE areas…" />
      ) : error ? (
        <ErrorBanner message={(error as Error).message} />
      ) : (
        <div className="space-y-6">
          {actionError && <ErrorBanner message={actionError} />}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total areas" value={summary.total} />
            <StatCard label="PVP areas" value={summary.pvp} className="!border-[var(--color-danger)]/20" />
            <StatCard label="PVE areas" value={summary.pve} className="!border-[var(--color-success)]/20" />
            <StatCard
              label="Invulnerable claim areas"
              value={summary.invulnerableClaim}
              className="!border-[var(--color-accent)]/20"
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card>
              <CardHeader
                title="Default area rules"
                description="Fallback rules for the whole map when a player is outside all custom zones."
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <ModeSelect
                  label="Kill mode"
                  value={settingsForm.killMode}
                  onChange={(value) => setSettingsForm((prev) => ({ ...prev, killMode: value as PvpKillMode }))}
                  options={KILL_MODE_OPTIONS}
                />
                <ModeSelect
                  label="Drop on death"
                  value={settingsForm.dropOnDeath}
                  onChange={(value) => setSettingsForm((prev) => ({ ...prev, dropOnDeath: value as PvpDropMode }))}
                  options={DROP_MODE_OPTIONS}
                />
                <Input
                  label="Online land claim bonus"
                  type="number"
                  min={0}
                  max={100}
                  value={settingsForm.onlineLandClaimBonus}
                  onChange={(e) =>
                    setSettingsForm((prev) => ({ ...prev, onlineLandClaimBonus: Number(e.target.value) }))
                  }
                />
                <Input
                  label="Offline land claim bonus"
                  type="number"
                  min={0}
                  max={100}
                  value={settingsForm.offlineLandClaimBonus}
                  onChange={(e) =>
                    setSettingsForm((prev) => ({ ...prev, offlineLandClaimBonus: Number(e.target.value) }))
                  }
                />
                <Input
                  label="Default notice buff"
                  className="sm:col-span-2"
                  value={settingsForm.defaultNoticeBuff}
                  onChange={(e) => setSettingsForm((prev) => ({ ...prev, defaultNoticeBuff: e.target.value }))}
                />
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button onClick={() => saveSettingsMutation.mutate(settingsForm)} disabled={saveSettingsMutation.isPending}>
                  Save
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => resetSettingsMutation.mutate()}
                  disabled={resetSettingsMutation.isPending}
                >
                  Reset
                </Button>
              </div>
            </Card>

            <Card>
              <CardHeader
                title="Add custom area"
                description="Define a rectangular zone using two opposite corner coordinates on the X/Z plane."
                action={
                  <Button variant="secondary" size="sm" disabled title="Map picker coming soon">
                    Select on map
                  </Button>
                }
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Corner coordinate A (x, z)"
                  placeholder="100, 200"
                  value={areaForm.cornerA}
                  onChange={(e) => setAreaForm((prev) => ({ ...prev, cornerA: e.target.value }))}
                />
                <Input
                  label="Opposite coordinate B (x, z)"
                  placeholder="250, 400"
                  value={areaForm.cornerB}
                  onChange={(e) => setAreaForm((prev) => ({ ...prev, cornerB: e.target.value }))}
                />
                <Input
                  label="Area note"
                  placeholder="Main city PVE"
                  value={areaForm.areaNote}
                  onChange={(e) => setAreaForm((prev) => ({ ...prev, areaNote: e.target.value }))}
                />
                <Input
                  label="Area notice buff"
                  value={areaForm.areaNoticeBuff}
                  onChange={(e) => setAreaForm((prev) => ({ ...prev, areaNoticeBuff: e.target.value }))}
                />
                <ModeSelect
                  label="Kill mode"
                  value={areaForm.killMode}
                  onChange={(value) => setAreaForm((prev) => ({ ...prev, killMode: value as PvpKillMode }))}
                  options={KILL_MODE_OPTIONS}
                />
                <ModeSelect
                  label="Drop on death"
                  value={areaForm.dropOnDeath}
                  onChange={(value) => setAreaForm((prev) => ({ ...prev, dropOnDeath: value as PvpDropMode }))}
                  options={DROP_MODE_OPTIONS}
                />
                <Input
                  label="Online land claim bonus"
                  type="number"
                  min={0}
                  max={100}
                  value={areaForm.onlineLandClaimBonus}
                  onChange={(e) =>
                    setAreaForm((prev) => ({ ...prev, onlineLandClaimBonus: Number(e.target.value) }))
                  }
                />
                <Input
                  label="Offline land claim bonus"
                  type="number"
                  min={0}
                  max={100}
                  value={areaForm.offlineLandClaimBonus}
                  onChange={(e) =>
                    setAreaForm((prev) => ({ ...prev, offlineLandClaimBonus: Number(e.target.value) }))
                  }
                />
                <label className="flex items-center gap-3 text-sm sm:col-span-2">
                  <Toggle
                    checked={areaForm.invulnerableClaim}
                    onChange={(value) => setAreaForm((prev) => ({ ...prev, invulnerableClaim: value }))}
                  />
                  Invulnerable claim area
                </label>
              </div>
              {createAreaMutation.error && (
                <p className="mt-4 text-sm text-[var(--color-danger)]">{(createAreaMutation.error as Error).message}</p>
              )}
              <div className="mt-6 flex flex-wrap gap-3">
                <Button onClick={() => createAreaMutation.mutate()} disabled={createAreaMutation.isPending}>
                  Add
                </Button>
                <Button type="button" variant="secondary" onClick={() => setAreaForm(emptyAreaForm)}>
                  Reset
                </Button>
              </div>
            </Card>
          </div>

          <Card>
            <CardHeader
              title="Area list"
              description="Custom zones stored on the selected game server. Coordinates are normalized to min/max after save."
              action={
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={isFetching}>
                    <IconRefresh className={isFetching ? 'animate-spin' : ''} />
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    disabled={areas.length === 0 || deleteAllMutation.isPending}
                    onClick={() => {
                      if (confirm('Delete all custom areas on this server?')) deleteAllMutation.mutate();
                    }}
                  >
                    Delete all
                  </Button>
                </div>
              }
            />

            <div className="overflow-x-auto">
              <table className="w-full min-w-[960px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border)] text-xs uppercase tracking-wider text-[var(--color-muted)]">
                    <th className="px-4 py-3">#</th>
                    <th className="px-4 py-3">Area note</th>
                    <th className="px-4 py-3">Coordinate range</th>
                    <th className="px-4 py-3">Area rule</th>
                    <th className="px-4 py-3">Land claim</th>
                    <th className="px-4 py-3">Area notice buff</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {areas.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-16 text-center text-[var(--color-muted)]">
                        No custom areas yet. Create one in the Add custom area card above.
                      </td>
                    </tr>
                  ) : (
                    areas.map((area: ModPvpArea, index: number) => (
                      <tr
                        key={area.id}
                        className="border-b border-[var(--color-border)] hover:bg-[var(--color-surface-hover)]"
                      >
                        <td className="px-4 py-3 text-[var(--color-muted)]">{index + 1}</td>
                        <td className="px-4 py-3 font-medium">{area.areaNote || '—'}</td>
                        <td className="px-4 py-3 font-mono text-xs">
                          {formatCoordinateRange(area.x1, area.z1, area.x2, area.z2)}
                        </td>
                        <td className="px-4 py-3">{formatAreaRule(area.killMode, area.dropOnDeath)}</td>
                        <td className="px-4 py-3 text-[var(--color-muted)]">
                          Online {area.onlineLandClaimBonus} · Offline {area.offlineLandClaimBonus}
                          {area.invulnerableClaim && <Badge variant="info">Invulnerable</Badge>}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">{area.areaNoticeBuff || '—'}</td>
                        <td className="px-4 py-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="!text-[var(--color-danger)]"
                            onClick={() => {
                              if (confirm(`Delete area "${area.areaNote || area.id}"?`)) {
                                deleteAreaMutation.mutate(area.id);
                              }
                            }}
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            <CardHeader title="Usage notes" />
            <ul className="list-disc space-y-2 pl-5 text-sm text-[var(--color-muted)]">
              <li>Areas are defined by two opposite corner coordinates using the X/Z axes. Y height is ignored.</li>
              <li>Coordinates are auto-reordered by size after submission.</li>
              <li>Default area rules apply when a player is outside all custom zones.</li>
              <li>
                Built-in example buffs: <code className="rounded bg-[var(--color-surface-2)] px-1.5 py-0.5">buffPvpVeNoticePve</code>{' '}
                (green PVE) and <code className="rounded bg-[var(--color-surface-2)] px-1.5 py-0.5">buffPvpVeNoticePvp</code>{' '}
                (red PVP).
              </li>
              <li>
                A player in a PVP area can still hit a player in a PVE area at the border — use physical separation when needed.
              </li>
              <li>
                Settings and areas are stored on the selected game server. The server must be online and reachable to load or save changes.
              </li>
            </ul>
          </Card>
        </div>
      )}
    </PageShell>
  );
}
