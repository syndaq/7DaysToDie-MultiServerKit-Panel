import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { DataTable } from '../components/ui/DataTable';
import { IconPlus, IconServer } from '../components/ui/icons';
import { Input } from '../components/ui/Input';
import { EmptyState, ErrorBanner, LoadingState, PageHeader } from '../components/ui/PageHeader';
import { api } from '../lib/api';
import type { GameServerRecord } from '@msk-panel/shared';

export function ServersPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    serverId: '',
    name: '',
    apiUrl: 'http://127.0.0.1:8888',
    apiKey: '',
  });

  const { data: servers, isLoading } = useQuery({
    queryKey: ['servers'],
    queryFn: api.getServers,
  });

  const createMutation = useMutation({
    mutationFn: api.createServer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setShowForm(false);
      setForm({ serverId: '', name: '', apiUrl: 'http://127.0.0.1:8888', apiKey: '' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      api.updateServer(id, { enabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: api.deleteServer,
    onMutate: async (id) => {
      setDeletingId(id);
      await queryClient.cancelQueries({ queryKey: ['servers'] });
      const previous = queryClient.getQueryData<GameServerRecord[]>(['servers']);
      queryClient.setQueryData<GameServerRecord[]>(
        ['servers'],
        (current) => current?.filter((server) => server.id !== id) ?? [],
      );
      return { previous };
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['servers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.removeQueries({ queryKey: ['server', id] });
      queryClient.removeQueries({ queryKey: ['server-health', id] });
      queryClient.removeQueries({ queryKey: ['server-stats', id] });
    },
    onError: (_error, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['servers'], context.previous);
      }
    },
    onSettled: () => {
      setDeletingId(null);
    },
  });

  return (
    <div>
      <PageHeader
        title="Game servers"
        description="Connect each dedicated server's mod API so the panel can proxy stats, players, shop, and console commands."
        action={
          <Button
            variant={showForm ? 'secondary' : 'primary'}
            icon={showForm ? undefined : <IconPlus width={16} height={16} />}
            onClick={() => setShowForm((v) => !v)}
          >
            {showForm ? 'Cancel' : 'Add server'}
          </Button>
        }
      />

      {deleteMutation.isError && (
        <div className="mb-6">
          <ErrorBanner
            message={(deleteMutation.error as Error).message || 'Failed to remove server'}
          />
        </div>
      )}

      {showForm && (
        <Card className="mb-6 animate-fade-up" glow>
          <form
            className="space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              createMutation.mutate(form);
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Server ID"
                required
                value={form.serverId}
                onChange={(e) => setForm({ ...form, serverId: e.target.value })}
                placeholder="us-pve-01"
              />
              <Input
                label="Display name"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="US PvE #1"
              />
              <Input
                label="Mod API URL"
                required
                type="url"
                className="sm:col-span-2"
                value={form.apiUrl}
                onChange={(e) => setForm({ ...form, apiUrl: e.target.value })}
              />
              <Input
                label="Panel API key"
                required
                type="password"
                hint="Must match PanelApiKey on the game server. After first run, also check 7DaysToDieServer_Data/Managed/LSTY_Data/appsettings.json"
                className="sm:col-span-2"
                value={form.apiKey}
                onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
              />
            </div>
            {createMutation.isError && (
              <ErrorBanner message={(createMutation.error as Error).message} />
            )}
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Saving…' : 'Save server'}
            </Button>
          </form>
        </Card>
      )}

      <Card padding={false} className="overflow-hidden">
        {isLoading ? (
          <LoadingState />
        ) : servers?.length === 0 ? (
          <EmptyState
            title="No servers registered"
            description="Add a game server to begin managing your cluster from one place."
            icon={<IconServer width={24} height={24} />}
          />
        ) : (
          <DataTable<GameServerRecord>
            keyFn={(s) => s.id}
            data={servers ?? []}
            columns={[
              {
                key: 'name',
                header: 'Name',
                render: (server) => (
                  <Link
                    to={`/servers/${server.id}`}
                    className="font-semibold text-[var(--color-accent)] hover:underline"
                  >
                    {server.name}
                  </Link>
                ),
              },
              {
                key: 'serverId',
                header: 'Server ID',
                render: (server) => (
                  <span className="font-mono text-xs text-[var(--color-muted)]">{server.serverId}</span>
                ),
              },
              {
                key: 'apiUrl',
                header: 'API URL',
                render: (server) => (
                  <span className="text-[var(--color-muted)]">{server.apiUrl}</span>
                ),
              },
              {
                key: 'enabled',
                header: 'Enabled',
                render: (server) => (
                  <label className="inline-flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={server.enabled}
                      disabled={updateMutation.isPending}
                      onChange={(e) => {
                        updateMutation.mutate({ id: server.id, enabled: e.target.checked });
                      }}
                      className="h-4 w-4 rounded border-[var(--color-border)] accent-[var(--color-accent)]"
                    />
                    <Badge variant={server.enabled ? 'success' : 'neutral'}>
                      {server.enabled ? 'On' : 'Off'}
                    </Badge>
                  </label>
                ),
              },
              {
                key: 'actions',
                header: '',
                className: 'text-right',
                render: (server) => (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="!text-[var(--color-danger)]"
                    disabled={deletingId === server.id}
                    onClick={() => {
                      if (confirm(`Remove ${server.name} from the panel? This cannot be undone.`)) {
                        deleteMutation.mutate(server.id);
                      }
                    }}
                  >
                    {deletingId === server.id ? 'Removing…' : 'Remove'}
                  </Button>
                ),
              },
            ]}
          />
        )}
      </Card>
    </div>
  );
}
