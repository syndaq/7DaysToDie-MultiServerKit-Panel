import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ServerSelector } from '../components/ServerSelector';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card, CardHeader } from '../components/ui/Card';
import { DataTable } from '../components/ui/DataTable';
import { IconTerminal } from '../components/ui/icons';
import { ErrorBanner, LoadingState } from '../components/ui/PageHeader';
import { PageShell } from '../components/ui/PageShell';
import { api } from '../lib/api';
import type { ModAllowedCommand } from '@msk-panel/shared';

export function ConsolePage() {
  const [serverId, setServerId] = useState('');
  const [command, setCommand] = useState('');
  const [output, setOutput] = useState<string[]>([]);
  const [cmdFilter, setCmdFilter] = useState('');

  const { data: servers } = useQuery({ queryKey: ['servers'], queryFn: api.getServers });
  const { data: health } = useQuery({
    queryKey: ['server-health', serverId],
    queryFn: () => api.getServerHealth(serverId),
    enabled: !!serverId,
    refetchInterval: 30_000,
  });

  const allowedQuery = useQuery({
    queryKey: ['allowed-commands', serverId],
    queryFn: () => api.getAllowedCommands(serverId),
    enabled: !!serverId && health?.online === true,
  });

  const consoleMutation = useMutation({
    mutationFn: (cmd: string) => api.runConsoleCommand(serverId, cmd),
    onSuccess: (lines, cmd) => setOutput((prev) => [...prev, `$ ${cmd}`, ...lines, '']),
  });

  const filteredCommands = (allowedQuery.data ?? []).filter((cmd) => {
    if (!cmdFilter) return true;
    const q = cmdFilter.toLowerCase();
    return (
      cmd.commands.toLowerCase().includes(q) ||
      (cmd.description ?? '').toLowerCase().includes(q)
    );
  });

  return (
    <PageShell
      title="Console"
      description="Run live console commands against a selected game server and browse allowed commands."
      toolbar={
        <ServerSelector
          servers={servers ?? []}
          value={serverId}
          onChange={(id) => {
            setServerId(id);
            setOutput([]);
          }}
          emptyLabel="Select a game server…"
        />
      }
    >
      {!serverId ? (
        <Card>
          <p className="py-16 text-center text-[var(--color-muted)]">
            Select a game server to open the remote console.
          </p>
        </Card>
      ) : (
        <div className="grid gap-6 xl:grid-cols-5">
          <Card className="xl:col-span-3">
            <CardHeader
              title="Command runner"
              description="Commands execute on the game server via the mod API."
              action={
                <div className="flex items-center gap-2">
                  <IconTerminal width={18} height={18} className="text-[var(--color-muted)]" />
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
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (!command.trim() || !health?.online) return;
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
              <div className="flex gap-3">
                <Button type="submit" disabled={!health?.online || consoleMutation.isPending}>
                  {consoleMutation.isPending ? 'Running…' : 'Run command'}
                </Button>
                <Button type="button" variant="secondary" onClick={() => setOutput([])}>
                  Clear output
                </Button>
              </div>
            </form>
            {consoleMutation.error && (
              <div className="mt-4">
                <ErrorBanner message={(consoleMutation.error as Error).message} />
              </div>
            )}
            <div className="mt-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-4">
              <pre className="max-h-96 overflow-auto font-mono text-xs leading-relaxed text-[var(--color-muted)]">
                {output.length === 0
                  ? 'Console output will appear here…'
                  : output.join('\n')}
              </pre>
            </div>
          </Card>

          <Card padding={false} className="overflow-hidden xl:col-span-2">
            <div className="border-b border-[var(--color-border)] px-5 py-4">
              <h2 className="font-semibold">Allowed commands</h2>
              <p className="text-sm text-[var(--color-muted)]">Reference from the game server</p>
              <input
                className="mt-3 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)]"
                value={cmdFilter}
                onChange={(e) => setCmdFilter(e.target.value)}
                placeholder="Filter commands…"
              />
            </div>
            {allowedQuery.isLoading ? (
              <LoadingState label="Loading commands…" />
            ) : allowedQuery.error ? (
              <div className="p-4">
                <ErrorBanner message={(allowedQuery.error as Error).message} />
              </div>
            ) : (
              <DataTable<ModAllowedCommand>
                keyFn={(cmd) => cmd.commands}
                data={filteredCommands.slice(0, 200)}
                columns={[
                  {
                    key: 'cmd',
                    header: 'Command',
                    render: (cmd) => <span className="font-mono text-xs">{cmd.commands}</span>,
                  },
                  {
                    key: 'level',
                    header: 'Level',
                    render: (cmd) => cmd.permissionLevel,
                  },
                ]}
              />
            )}
          </Card>
        </div>
      )}
    </PageShell>
  );
}
