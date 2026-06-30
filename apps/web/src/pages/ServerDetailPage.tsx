import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Badge, StatusDot } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card, CardHeader } from '../components/ui/Card';
import { DataTable } from '../components/ui/DataTable';
import { IconArrowLeft, IconTerminal } from '../components/ui/icons';
import { EmptyState, ErrorBanner, LoadingState, PageHeader } from '../components/ui/PageHeader';
import { StatCard } from '../components/ui/StatCard';
import { api } from '../lib/api';
import type { ModOnlinePlayer } from '@msk-panel/shared';

export function ServerDetailPage() {
  const { id = '' } = useParams();
  const [command, setCommand] = useState('');
  const [output, setOutput] = useState<string[]>([]);

  const { data: server, isLoading } = useQuery({
    queryKey: ['server', id],
    queryFn: () => api.getServer(id),
    enabled: !!id,
  });

  const { data: health } = useQuery({
    queryKey: ['server-health', id],
    queryFn: () => api.getServerHealth(id),
    enabled: !!id,
    refetchInterval: 30_000,
  });

  const { data: stats } = useQuery({
    queryKey: ['server-stats', id],
    queryFn: () => api.getServerStats(id),
    enabled: !!id && health?.online === true,
    refetchInterval: 30_000,
  });

  const { data: players } = useQuery({
    queryKey: ['server-players', id],
    queryFn: () => api.getServerOnlinePlayers(id),
    enabled: !!id && health?.online === true,
    refetchInterval: 15_000,
  });

  const consoleMutation = useMutation({
    mutationFn: (cmd: string) => api.runConsoleCommand(id, cmd),
    onSuccess: (lines, cmd) => setOutput((prev) => [...prev, `$ ${cmd}`, ...lines, '']),
  });

  if (isLoading) {
    return <LoadingState label="Loading server…" />;
  }

  if (!server) {
    return <ErrorBanner message="Server not found." />;
  }

  return (
    <div>
      <Link
        to="/servers"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-[var(--color-muted)] transition-colors hover:text-[var(--color-accent)]"
      >
        <IconArrowLeft width={16} height={16} />
        Back to servers
      </Link>

      <PageHeader
        title={server.name}
        description={`${server.serverId} · ${server.apiUrl}`}
        action={
          <div className="flex items-center gap-3">
            <StatusDot online={health?.online ?? false} />
            <Badge variant={health?.online ? 'success' : 'danger'}>
              {health?.online ? 'Online' : 'Offline'}
            </Badge>
          </div>
        }
      />

      {!health?.online && (
        <ErrorBanner
          message={`Server is offline or unreachable${health?.error ? `: ${health.error}` : ''}`}
        />
      )}

      {health?.online && stats && (
        <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Players" value={stats.onlinePlayers ?? 0} />
          <StatCard label="Zombies" value={stats.zombies ?? 0} />
          <StatCard label="Animals" value={stats.animals ?? 0} />
          <StatCard label="Latency" value={`${health.latencyMs}ms`} />
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-5">
        <Card padding={false} className="overflow-hidden xl:col-span-3">
          <div className="border-b border-[var(--color-border)] px-5 py-4">
            <h2 className="font-semibold">Online players</h2>
            <p className="text-sm text-[var(--color-muted)]">{players?.length ?? 0} connected</p>
          </div>
          {!players?.length ? (
            <EmptyState title="No players online" description="Players will appear here when they connect." />
          ) : (
            <DataTable<ModOnlinePlayer>
              keyFn={(p) => `${p.platformId}-${p.entityId}`}
              data={players}
              columns={[
                { key: 'name', header: 'Name', render: (p) => <span className="font-medium">{p.playerName}</span> },
                {
                  key: 'platform',
                  header: 'Platform ID',
                  render: (p) => (
                    <span className="font-mono text-xs text-[var(--color-muted)]">{p.platformId ?? '—'}</span>
                  ),
                },
                { key: 'stage', header: 'Game stage', render: (p) => p.gameStage ?? '—' },
                {
                  key: 'ping',
                  header: 'Ping',
                  render: (p) => (p.ping != null ? `${p.ping}ms` : '—'),
                },
              ]}
            />
          )}
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader
            title="Console"
            description="Run server commands remotely"
            action={<IconTerminal width={18} height={18} className="text-[var(--color-muted)]" />}
          />
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!command.trim()) return;
              consoleMutation.mutate(command.trim());
              setCommand('');
            }}
          >
            <input
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3.5 py-2.5 font-mono text-sm outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-soft)]"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder="say Hello from panel"
              disabled={!health?.online || consoleMutation.isPending}
            />
            <Button type="submit" disabled={!health?.online || consoleMutation.isPending} className="w-full">
              {consoleMutation.isPending ? 'Running…' : 'Run command'}
            </Button>
          </form>
          <div className="mt-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-4">
            <pre className="max-h-72 overflow-auto font-mono text-xs leading-relaxed text-[var(--color-muted)]">
              {output.length === 0 ? (
                <span className="text-[var(--color-muted-2)]">Console output will appear here…</span>
              ) : (
                output.join('\n')
              )}
            </pre>
          </div>
        </Card>
      </div>
    </div>
  );
}
