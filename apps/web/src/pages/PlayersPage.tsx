import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { HistoryPlayerSortField } from '@msk-panel/shared';
import { ServerSelector } from '../components/ServerSelector';
import {
  PlayerGrid,
  useHistoryColumns,
  useOnlineColumns,
} from '../components/players/PlayerGrid';
import { PlayerToolbar, SearchBar } from '../components/players/PlayerToolbar';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { IconRefresh } from '../components/ui/icons';
import { DensityToggle, PaginationBar, type RowDensity } from '../components/ui/Pagination';
import { PageShell, Tabs } from '../components/ui/PageShell';
import { ErrorBanner, LoadingState } from '../components/ui/PageHeader';
import { api } from '../lib/api';
import { historyToRow, onlineToRow, type PlayerRow } from '../lib/player-utils';

type TabId = 'online' | 'history';

const sortFieldMap: Record<string, HistoryPlayerSortField> = {
  playerName: 'PlayerName',
  level: 'Level',
  isOnline: 'IsOffline',
  zombieKills: 'ZombieKills',
  playerKills: 'PlayerKills',
  deaths: 'Deaths',
  skillPoints: 'SkillPoints',
  lastLogin: 'LastLogin',
  totalTimePlayed: 'TotalTimePlayed',
  pointsCount: 'PointsCount',
};

function sortRows(rows: PlayerRow[], sortKey: string, desc: boolean): PlayerRow[] {
  return [...rows].sort((a, b) => {
    const getValue = (row: PlayerRow): string | number => {
      switch (sortKey) {
        case 'playerName':
          return row.playerName.toLowerCase();
        case 'gameStage':
          return row.gameStage ?? 0;
        case 'ping':
          return row.ping ?? 0;
        case 'level':
          return row.details.level ?? 0;
        case 'zombieKills':
          return row.details.zombieKills ?? 0;
        case 'playerKills':
          return row.details.playerKills ?? 0;
        case 'deaths':
          return row.details.deaths ?? 0;
        case 'skillPoints':
          return row.details.skillPoints ?? 0;
        case 'pointsCount':
          return row.details.pointsCount ?? 0;
        case 'isOnline':
          return row.isOnline ? 1 : 0;
        default:
          return row.playerName.toLowerCase();
      }
    };

    const left = getValue(a);
    const right = getValue(b);
    if (left < right) return desc ? 1 : -1;
    if (left > right) return desc ? -1 : 1;
    return 0;
  });
}

export function PlayersPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<TabId>('online');
  const [serverId, setServerId] = useState('');
  const [keyword, setKeyword] = useState('');
  const [appliedKeyword, setAppliedKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortKey, setSortKey] = useState('playerName');
  const [sortDesc, setSortDesc] = useState(false);
  const [density, setDensity] = useState<RowDensity>('comfortable');
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [autoRefresh, setAutoRefresh] = useState(true);

  const { data: servers } = useQuery({
    queryKey: ['servers'],
    queryFn: api.getServers,
  });

  const onlineQuery = useQuery({
    queryKey: ['players-online', serverId],
    queryFn: () =>
      serverId ? api.getServerOnlinePlayers(serverId) : api.getOnlinePlayers(),
    refetchInterval: tab === 'online' && autoRefresh ? 15_000 : false,
    enabled: tab === 'online',
  });

  const historyQuery = useQuery({
    queryKey: ['players-history', serverId, page, pageSize, appliedKeyword, sortKey, sortDesc],
    queryFn: () => {
      const order = sortFieldMap[sortKey];
      const desc = sortKey === 'isOnline' ? !sortDesc : sortDesc;
      return api.getServerHistoryPlayers(serverId, {
        pageNumber: page,
        pageSize,
        keyword: appliedKeyword || undefined,
        order,
        desc,
      });
    },
    enabled: tab === 'history' && !!serverId,
  });

  const onlineRows = useMemo(() => {
    const players = onlineQuery.data ?? [];
    let rows = players.map((player) => onlineToRow(player));
    if (appliedKeyword) {
      const q = appliedKeyword.toLowerCase();
      rows = rows.filter(
        (row) =>
          row.playerName.toLowerCase().includes(q) ||
          row.playerId.toLowerCase().includes(q) ||
          (row.platformId?.toLowerCase().includes(q) ?? false),
      );
    }
    return sortRows(rows, sortKey, sortDesc);
  }, [onlineQuery.data, appliedKeyword, sortKey, sortDesc]);

  const historyRows = useMemo(() => {
    const items = historyQuery.data?.items ?? [];
    return items.map((player) => historyToRow(player));
  }, [historyQuery.data]);

  const pagedOnlineRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return onlineRows.slice(start, start + pageSize);
  }, [onlineRows, page, pageSize]);

  const rows = tab === 'online' ? pagedOnlineRows : historyRows;
  const total = tab === 'online' ? onlineRows.length : (historyQuery.data?.total ?? 0);

  const selectedPlayers = rows.filter((row) => selectedKeys.has(row.key));
  const hasSelection = selectedPlayers.length > 0;
  const activeServerId = serverId || servers?.[0]?.id || '';
  const needsServer = tab === 'history' && !serverId;

  const onlineColumns = useOnlineColumns(!serverId);
  const historyColumns = useHistoryColumns();

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDesc((value) => !value);
    } else {
      setSortKey(key);
      setSortDesc(false);
    }
    if (tab === 'history') setPage(1);
  };

  const toggleRow = (key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleAll = () => {
    if (rows.every((row) => selectedKeys.has(row.key))) {
      setSelectedKeys(new Set());
    } else {
      setSelectedKeys(new Set(rows.map((row) => row.key)));
    }
  };

  const runForSelection = async (action: (player: PlayerRow) => Promise<void>) => {
    if (!hasSelection) return;
    for (const player of selectedPlayers) {
      await action(player);
    }
    queryClient.invalidateQueries({ queryKey: ['players-online'] });
    queryClient.invalidateQueries({ queryKey: ['players-history'] });
  };

  const toolbarGroups = [
    [
      {
        label: 'Send message',
        onClick: () =>
          runForSelection(async (player) => {
            const message = prompt(`Message to ${player.playerName}:`);
            if (!message || !activeServerId) return;
            await api.modPost(activeServerId, 'Server/SendPrivateMessage', {
              targetPlayerIdOrName: player.playerId,
              message,
              senderName: 'Admin',
            });
          }),
      },
      {
        label: 'Give item',
        onClick: () =>
          runForSelection(async (player) => {
            const itemName = prompt(`Item name for ${player.playerName}:`);
            if (!itemName || !activeServerId) return;
            const count = Number(prompt('Count:', '1') ?? '1');
            await api.modPost(activeServerId, 'Server/GiveItem', {
              targetPlayerIdOrName: player.playerId,
              itemName,
              count,
            });
          }),
      },
      {
        label: 'Change points',
        onClick: () =>
          runForSelection(async (player) => {
            const points = Number(
              prompt(`Points for ${player.playerName}:`, String(player.details.pointsCount ?? 0)),
            );
            if (Number.isNaN(points)) return;
            await api.upsertPlayerPoints({
              platformId: player.playerId,
              displayName: player.playerName,
              points,
            });
          }),
      },
      {
        label: 'Spawn entity',
        onClick: () =>
          runForSelection(async (player) => {
            const entity = prompt(`Entity to spawn near ${player.playerName}:`);
            if (!entity || !activeServerId) return;
            await api.runConsoleCommand(activeServerId, `se ${entity} ${player.playerId}`);
          }),
      },
    ],
    [
      {
        label: 'Set admin',
        onClick: () =>
          runForSelection(async (player) => {
            if (!activeServerId) return;
            await api.modPost(activeServerId, 'Admins', {
              playerId: player.playerId,
              displayName: player.playerName,
              permissionLevel: 0,
            });
          }),
      },
      {
        label: 'Remove admin',
        onClick: () =>
          runForSelection(async (player) => {
            if (!activeServerId) return;
            await api.modDelete(activeServerId, 'Admins', { playerIds: player.playerId });
          }),
      },
    ],
    [
      {
        label: 'Kick player',
        onClick: () =>
          runForSelection(async (player) => {
            if (!activeServerId) return;
            await api.runConsoleCommand(activeServerId, `kick ${player.playerId}`);
          }),
      },
      {
        label: 'Ban player',
        onClick: () =>
          runForSelection(async (player) => {
            const reason =
              prompt(`Ban reason for ${player.playerName}:`, 'Banned by admin') ?? 'Banned by admin';
            if (!activeServerId) return;
            const bannedUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
            await api.modPost(activeServerId, 'Blacklist', {
              playerId: player.playerId,
              displayName: player.playerName,
              reason,
              bannedUntil,
            });
          }),
      },
      {
        label: 'Reset player',
        variant: 'danger' as const,
        onClick: () =>
          runForSelection(async (player) => {
            if (!confirm(`Reset ${player.playerName}? This cannot be undone.`)) return;
            if (!activeServerId) return;
            await api.modDelete(activeServerId, 'Server/ResetPlayer', { playerId: player.playerId });
          }),
      },
    ],
  ];

  return (
    <PageShell
      title="Player list"
      description="Manage online and historical players with search, sorting, batch actions, and pagination."
      toolbar={
        <div className="flex flex-wrap items-center gap-3">
          <Tabs
            tabs={[
              { id: 'online', label: 'Online players' },
              { id: 'history', label: 'History players' },
            ]}
            active={tab}
            onChange={(next) => {
              setTab(next as TabId);
              setPage(1);
              setSelectedKeys(new Set());
            }}
          />
          {tab === 'online' && (
            <label className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-solid)] px-3 py-2 text-sm">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="accent-[var(--color-accent)]"
              />
              <span className="text-[var(--color-muted)]">Auto refresh</span>
            </label>
          )}
          <Button
            variant="secondary"
            icon={
              <IconRefresh
                width={16}
                height={16}
                className={onlineQuery.isFetching || historyQuery.isFetching ? 'animate-spin' : ''}
              />
            }
            onClick={() => {
              if (tab === 'online') onlineQuery.refetch();
              else historyQuery.refetch();
            }}
          >
            Refresh
          </Button>
        </div>
      }
    >
      <div className="mb-1 flex flex-wrap items-end gap-4">
        <div className="min-w-[240px]">
          <ServerSelector
            servers={servers ?? []}
            value={serverId}
            onChange={(value) => {
              setServerId(value);
              setPage(1);
              setSelectedKeys(new Set());
            }}
            allowEmpty
            emptyLabel={tab === 'online' ? 'All servers' : 'Select a server…'}
          />
        </div>
      </div>

      {needsServer ? (
        <Card>
          <p className="py-12 text-center text-sm text-[var(--color-muted)]">
            Select a game server to browse historical player records.
          </p>
        </Card>
      ) : (
        <Card padding={false} className="overflow-hidden">
          <PlayerToolbar groups={toolbarGroups} disabled={!hasSelection || !activeServerId} />

          <SearchBar
            value={keyword}
            onChange={setKeyword}
            onSearch={() => {
              setAppliedKeyword(keyword.trim());
              setPage(1);
            }}
            onReset={() => {
              setKeyword('');
              setAppliedKeyword('');
              setPage(1);
            }}
          />

          {(tab === 'online' ? onlineQuery.isLoading : historyQuery.isLoading) ? (
            <LoadingState label="Loading players…" />
          ) : (tab === 'online' ? onlineQuery.error : historyQuery.error) ? (
            <div className="p-5">
              <ErrorBanner
                message={((tab === 'online' ? onlineQuery.error : historyQuery.error) as Error).message}
              />
            </div>
          ) : (
            <>
              <PlayerGrid
                rows={rows}
                columns={tab === 'online' ? onlineColumns : historyColumns}
                selectedKeys={selectedKeys}
                onToggleRow={toggleRow}
                onToggleAll={toggleAll}
                sortKey={sortKey}
                sortDesc={sortDesc}
                onSort={handleSort}
                density={density}
              />

              <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[var(--color-border)] px-5 py-4">
                <DensityToggle value={density} onChange={setDensity} />
                <PaginationBar
                  page={page}
                  pageSize={pageSize}
                  total={total}
                  onPageChange={setPage}
                  onPageSizeChange={(size) => {
                    setPageSize(size);
                    setPage(1);
                  }}
                />
              </div>
            </>
          )}
        </Card>
      )}
    </PageShell>
  );
}
