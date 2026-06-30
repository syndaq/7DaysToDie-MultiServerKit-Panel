import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Badge, StatusDot } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { IconChevronRight, IconRefresh, IconServer, IconUsers, IconZap } from '../components/ui/icons';
import { EmptyState, LoadingState, PageHeader } from '../components/ui/PageHeader';
import { StatCard } from '../components/ui/StatCard';
import { api } from '../lib/api';
import { formatClusterEvent, useClusterWebSocket } from '../hooks/useClusterWebSocket';

export function DashboardPage() {
  const { connected, events } = useClusterWebSocket();
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['dashboard'],
    queryFn: api.getDashboard,
    refetchInterval: 60_000,
  });

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Real-time overview of your 7DTD server cluster — players, health, and shared systems at a glance."
        action={
          <div className="flex items-center gap-3">
            <Badge variant={connected ? 'success' : 'danger'}>
              {connected ? 'Live feed connected' : 'Live feed reconnecting…'}
            </Badge>
            <Button
            variant="secondary"
            icon={<IconRefresh width={16} height={16} className={isFetching ? 'animate-spin' : ''} />}
            onClick={() => refetch()}
            disabled={isFetching}
          >
            {isFetching ? 'Refreshing…' : 'Refresh'}
          </Button>
          </div>
        }
      />

      {isLoading ? (
        <LoadingState label="Loading dashboard…" />
      ) : (
        <>
          <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              className="animate-fade-up stagger-1"
              label="Servers online"
              value={`${data?.serversOnline ?? 0}/${data?.serverCount ?? 0}`}
              sub="Connected mod APIs"
              icon={<IconServer width={18} height={18} />}
            />
            <StatCard
              className="animate-fade-up stagger-2"
              label="Players online"
              value={data?.totalOnlinePlayers ?? 0}
              sub="Across all servers"
              icon={<IconUsers width={18} height={18} />}
            />
            <StatCard
              className="animate-fade-up stagger-3"
              label="Registered players"
              value={data?.totalRegisteredPlayers ?? 0}
              sub="Shared panel database"
              icon={<IconUsers width={18} height={18} />}
            />
            <StatCard
              className="animate-fade-up stagger-4"
              label="Shared systems"
              value="Active"
              sub="Points & CD keys synced"
              icon={<IconZap width={18} height={18} />}
            />
          </div>

          <Card padding={false} className="animate-fade-up stagger-2 overflow-hidden">
            <div className="border-b border-[var(--color-border)] px-5 py-4">
              <h2 className="font-semibold">Game servers</h2>
              <p className="text-sm text-[var(--color-muted)]">Click a server for details and console access</p>
            </div>

            {data?.servers.length === 0 ? (
              <EmptyState
                title="No servers yet"
                description="Register your first game server to start monitoring players and running commands."
                icon={<IconServer width={24} height={24} />}
                action={
                  <Link to="/servers">
                    <Button>Add server</Button>
                  </Link>
                }
              />
            ) : (
              <div className="divide-y divide-[var(--color-border)]">
                {data?.servers.map((server) => (
                  <Link
                    key={server.id}
                    to={`/servers/${server.id}`}
                    className="group flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-[var(--color-surface-hover)]"
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <StatusDot online={server.online} />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold">{server.name}</p>
                          <Badge variant={server.online ? 'success' : 'danger'}>
                            {server.online ? 'Online' : 'Offline'}
                          </Badge>
                        </div>
                        <p className="mt-0.5 truncate text-xs text-[var(--color-muted)]">{server.serverId}</p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-4">
                      <div className="hidden text-right text-sm sm:block">
                        {server.online && server.stats ? (
                          <>
                            <p className="font-medium">{server.stats.onlinePlayers ?? 0} players</p>
                            <p className="text-xs text-[var(--color-muted)]">
                              {server.stats.zombies ?? 0} zombies · {server.latencyMs}ms
                            </p>
                          </>
                        ) : (
                          <p className="text-[var(--color-danger)]">{server.error ?? 'Unreachable'}</p>
                        )}
                      </div>
                      <IconChevronRight
                        width={18}
                        height={18}
                        className="text-[var(--color-muted-2)] transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--color-accent)]"
                      />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>

          <Card padding={false} className="animate-fade-up stagger-3 mt-8 overflow-hidden">
            <div className="border-b border-[var(--color-border)] px-5 py-4">
              <h2 className="font-semibold">Live cluster events</h2>
              <p className="text-sm text-[var(--color-muted)]">
                WebSocket stream aggregated from all registered game servers
              </p>
            </div>
            {events.length === 0 ? (
              <EmptyState
                title="Waiting for events"
                description="Chat, logins, and other mod events appear here when servers are online and connected."
              />
            ) : (
              <ul className="max-h-80 divide-y divide-[var(--color-border)] overflow-y-auto">
                {events.map((event, index) => (
                  <li key={`${event.receivedAt}-${index}`} className="px-5 py-3 text-sm">
                    <p className="text-[var(--color-muted)]">{new Date(event.receivedAt).toLocaleTimeString()}</p>
                    <p className="mt-0.5">{formatClusterEvent(event)}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
