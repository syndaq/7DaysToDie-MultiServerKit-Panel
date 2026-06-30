import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  ModAdminEntry,
  ModBlacklistEntry,
  ModPermissionEntry,
  ModWhitelistEntry,
} from '@msk-panel/shared';
import { ServerSelector } from '../components/ServerSelector';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { DataTable } from '../components/ui/DataTable';
import { Input } from '../components/ui/Input';
import { ErrorBanner, LoadingState } from '../components/ui/PageHeader';
import { PageShell, Tabs } from '../components/ui/PageShell';
import { api } from '../lib/api';

type TabId = 'admins' | 'permissions' | 'blacklist' | 'whitelist';

function AdminsTab({ serverId }: { serverId: string }) {
  const queryClient = useQueryClient();
  const [playerId, setPlayerId] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [permissionLevel, setPermissionLevel] = useState('0');

  const query = useQuery({
    queryKey: ['admins', serverId],
    queryFn: () => api.getAdmins(serverId),
  });

  const addMutation = useMutation({
    mutationFn: () =>
      api.addAdmin(serverId, {
        playerId,
        displayName,
        permissionLevel: Number(permissionLevel),
      }),
    onSuccess: () => {
      setPlayerId('');
      setDisplayName('');
      queryClient.invalidateQueries({ queryKey: ['admins', serverId] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (ids: string[]) => api.removeAdmins(serverId, ids),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admins', serverId] }),
  });

  if (query.isLoading) return <LoadingState label="Loading admins…" />;
  if (query.error) return <ErrorBanner message={(query.error as Error).message} />;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        <Input label="Player ID" value={playerId} onChange={(e) => setPlayerId(e.target.value)} />
        <Input label="Display name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        <Input
          label="Permission level"
          type="number"
          value={permissionLevel}
          onChange={(e) => setPermissionLevel(e.target.value)}
        />
      </div>
      <Button
        onClick={() => addMutation.mutate()}
        disabled={!playerId || !displayName || addMutation.isPending}
      >
        Add admin
      </Button>
      <DataTable<ModAdminEntry>
        keyFn={(row) => row.playerId}
        data={query.data ?? []}
        columns={[
          { key: 'name', header: 'Name', render: (row) => row.displayName },
          { key: 'id', header: 'Player ID', render: (row) => <span className="font-mono text-xs">{row.playerId}</span> },
          { key: 'level', header: 'Level', render: (row) => row.permissionLevel },
          {
            key: 'actions',
            header: '',
            render: (row) => (
              <Button
                variant="ghost"
                size="sm"
                className="!text-[var(--color-danger)]"
                onClick={() => removeMutation.mutate([row.playerId])}
              >
                Remove
              </Button>
            ),
          },
        ]}
      />
    </div>
  );
}

function PermissionsTab({ serverId }: { serverId: string }) {
  const queryClient = useQueryClient();
  const [command, setCommand] = useState('');
  const [permissionLevel, setPermissionLevel] = useState('0');

  const query = useQuery({
    queryKey: ['permissions', serverId],
    queryFn: () => api.getPermissions(serverId),
  });

  const addMutation = useMutation({
    mutationFn: () =>
      api.addPermission(serverId, { command, permissionLevel: Number(permissionLevel) }),
    onSuccess: () => {
      setCommand('');
      queryClient.invalidateQueries({ queryKey: ['permissions', serverId] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (cmds: string[]) => api.removePermissions(serverId, cmds),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['permissions', serverId] }),
  });

  if (query.isLoading) return <LoadingState label="Loading permissions…" />;
  if (query.error) return <ErrorBanner message={(query.error as Error).message} />;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        <Input label="Command" value={command} onChange={(e) => setCommand(e.target.value)} />
        <Input
          label="Permission level"
          type="number"
          value={permissionLevel}
          onChange={(e) => setPermissionLevel(e.target.value)}
        />
      </div>
      <Button onClick={() => addMutation.mutate()} disabled={!command || addMutation.isPending}>
        Add permission
      </Button>
      <DataTable<ModPermissionEntry>
        keyFn={(row) => row.command}
        data={query.data ?? []}
        columns={[
          { key: 'cmd', header: 'Command', render: (row) => <span className="font-mono text-xs">{row.command}</span> },
          { key: 'level', header: 'Level', render: (row) => row.permissionLevel },
          { key: 'desc', header: 'Description', render: (row) => row.description ?? '—' },
          {
            key: 'actions',
            header: '',
            render: (row) => (
              <Button
                variant="ghost"
                size="sm"
                className="!text-[var(--color-danger)]"
                onClick={() => removeMutation.mutate([row.command])}
              >
                Remove
              </Button>
            ),
          },
        ]}
      />
    </div>
  );
}

function BlacklistTab({ serverId }: { serverId: string }) {
  const queryClient = useQueryClient();
  const [playerId, setPlayerId] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [reason, setReason] = useState('');
  const [minutes, setMinutes] = useState('60');

  const query = useQuery({
    queryKey: ['blacklist', serverId],
    queryFn: () => api.getBlacklist(serverId),
  });

  const addMutation = useMutation({
    mutationFn: () => {
      const bannedUntil = new Date(Date.now() + Number(minutes) * 60_000).toISOString();
      return api.addBlacklist(serverId, { playerId, displayName, reason, bannedUntil });
    },
    onSuccess: () => {
      setPlayerId('');
      setDisplayName('');
      setReason('');
      queryClient.invalidateQueries({ queryKey: ['blacklist', serverId] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (ids: string[]) => api.removeBlacklist(serverId, ids),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['blacklist', serverId] }),
  });

  if (query.isLoading) return <LoadingState label="Loading blacklist…" />;
  if (query.error) return <ErrorBanner message={(query.error as Error).message} />;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        <Input label="Player ID" value={playerId} onChange={(e) => setPlayerId(e.target.value)} />
        <Input label="Display name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        <Input label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} />
        <Input
          label="Ban duration (minutes)"
          type="number"
          value={minutes}
          onChange={(e) => setMinutes(e.target.value)}
        />
      </div>
      <Button
        onClick={() => addMutation.mutate()}
        disabled={!playerId || !displayName || addMutation.isPending}
      >
        Ban player
      </Button>
      <DataTable<ModBlacklistEntry>
        keyFn={(row) => row.playerId}
        data={query.data ?? []}
        columns={[
          { key: 'name', header: 'Name', render: (row) => row.displayName },
          { key: 'id', header: 'Player ID', render: (row) => <span className="font-mono text-xs">{row.playerId}</span> },
          { key: 'reason', header: 'Reason', render: (row) => row.reason ?? '—' },
          {
            key: 'until',
            header: 'Banned until',
            render: (row) => (row.bannedUntil ? new Date(row.bannedUntil).toLocaleString() : '—'),
          },
          {
            key: 'actions',
            header: '',
            render: (row) => (
              <Button
                variant="ghost"
                size="sm"
                className="!text-[var(--color-danger)]"
                onClick={() => removeMutation.mutate([row.playerId])}
              >
                Unban
              </Button>
            ),
          },
        ]}
      />
    </div>
  );
}

function WhitelistTab({ serverId }: { serverId: string }) {
  const queryClient = useQueryClient();
  const [playerId, setPlayerId] = useState('');
  const [displayName, setDisplayName] = useState('');

  const query = useQuery({
    queryKey: ['whitelist', serverId],
    queryFn: () => api.getWhitelist(serverId),
  });

  const addMutation = useMutation({
    mutationFn: () => api.addWhitelist(serverId, { playerId, displayName }),
    onSuccess: () => {
      setPlayerId('');
      setDisplayName('');
      queryClient.invalidateQueries({ queryKey: ['whitelist', serverId] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (ids: string[]) => api.removeWhitelist(serverId, ids),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['whitelist', serverId] }),
  });

  if (query.isLoading) return <LoadingState label="Loading whitelist…" />;
  if (query.error) return <ErrorBanner message={(query.error as Error).message} />;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        <Input label="Player ID" value={playerId} onChange={(e) => setPlayerId(e.target.value)} />
        <Input label="Display name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
      </div>
      <Button
        onClick={() => addMutation.mutate()}
        disabled={!playerId || !displayName || addMutation.isPending}
      >
        Add to whitelist
      </Button>
      <DataTable<ModWhitelistEntry>
        keyFn={(row) => row.playerId}
        data={query.data ?? []}
        columns={[
          { key: 'name', header: 'Name', render: (row) => row.displayName },
          { key: 'id', header: 'Player ID', render: (row) => <span className="font-mono text-xs">{row.playerId}</span> },
          {
            key: 'actions',
            header: '',
            render: (row) => (
              <Button
                variant="ghost"
                size="sm"
                className="!text-[var(--color-danger)]"
                onClick={() => removeMutation.mutate([row.playerId])}
              >
                Remove
              </Button>
            ),
          },
        ]}
      />
    </div>
  );
}

export function PermissionsPage() {
  const [serverId, setServerId] = useState('');
  const [tab, setTab] = useState<TabId>('admins');
  const { data: servers } = useQuery({ queryKey: ['servers'], queryFn: api.getServers });

  return (
    <PageShell
      title="Permissions"
      description="Manage server admins, command permissions, ban list, and whitelist."
      toolbar={
        <div className="flex flex-wrap items-end gap-4">
          <ServerSelector
            servers={servers ?? []}
            value={serverId}
            onChange={setServerId}
            emptyLabel="Select a game server…"
          />
          {serverId && (
            <Tabs
              tabs={[
                { id: 'admins', label: 'Admins' },
                { id: 'permissions', label: 'Permissions' },
                { id: 'blacklist', label: 'Blacklist' },
                { id: 'whitelist', label: 'Whitelist' },
              ]}
              active={tab}
              onChange={(next) => setTab(next as TabId)}
            />
          )}
        </div>
      }
    >
      {!serverId ? (
        <Card>
          <p className="py-16 text-center text-[var(--color-muted)]">
            Select a game server to manage permissions.
          </p>
        </Card>
      ) : (
        <Card>
          {tab === 'admins' && <AdminsTab serverId={serverId} />}
          {tab === 'permissions' && <PermissionsTab serverId={serverId} />}
          {tab === 'blacklist' && <BlacklistTab serverId={serverId} />}
          {tab === 'whitelist' && <WhitelistTab serverId={serverId} />}
        </Card>
      )}
    </PageShell>
  );
}
