import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

function StatusDot({ online }: { online: boolean }) {
  return (
    <span
      className={`inline-block h-2.5 w-2.5 rounded-full ${online ? 'bg-[--color-success]' : 'bg-[--color-danger]'}`}
    />
  );
}

export function DashboardPage() {
  const { data: health, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['health', 'all'],
    queryFn: api.getAllHealth,
    refetchInterval: 60_000,
  });

  const onlineCount = health?.filter((s) => s.online).length ?? 0;
  const totalCount = health?.length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="mt-1 text-sm text-[--color-muted]">
            Overview of all registered game servers
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="rounded-lg bg-[--color-accent] px-4 py-2 text-sm font-medium text-white hover:bg-[--color-accent-hover] disabled:opacity-50"
        >
          {isFetching ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-[--color-border] bg-[--color-surface] p-5">
          <p className="text-sm text-[--color-muted]">Servers online</p>
          <p className="mt-2 text-3xl font-semibold">
            {isLoading ? '—' : `${onlineCount} / ${totalCount}`}
          </p>
        </div>
        <div className="rounded-xl border border-[--color-border] bg-[--color-surface] p-5">
          <p className="text-sm text-[--color-muted]">Panel API</p>
          <p className="mt-2 text-3xl font-semibold text-[--color-success]">Running</p>
        </div>
        <div className="rounded-xl border border-[--color-border] bg-[--color-surface] p-5">
          <p className="text-sm text-[--color-muted]">Shared systems</p>
          <p className="mt-2 text-sm text-[--color-muted]">Points, shop, VIP — coming soon</p>
        </div>
      </div>

      <section className="rounded-xl border border-[--color-border] bg-[--color-surface]">
        <div className="border-b border-[--color-border] px-5 py-4">
          <h2 className="font-medium">Server status</h2>
        </div>
        {isLoading ? (
          <p className="px-5 py-8 text-sm text-[--color-muted]">Loading…</p>
        ) : health?.length === 0 ? (
          <p className="px-5 py-8 text-sm text-[--color-muted]">
            No servers registered yet. Add one on the Servers page.
          </p>
        ) : (
          <ul className="divide-y divide-[--color-border]">
            {health?.map((server) => (
              <li key={server.serverId} className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  <StatusDot online={server.online} />
                  <div>
                    <p className="font-medium">{server.name}</p>
                    <p className="text-xs text-[--color-muted]">{server.serverId}</p>
                  </div>
                </div>
                <div className="text-right text-sm">
                  {server.online ? (
                    <span className="text-[--color-success]">{server.latencyMs}ms</span>
                  ) : (
                    <span className="text-[--color-danger]">{server.error ?? 'Offline'}</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
