import { useMemo } from 'react';
import { Badge } from '../ui/Badge';
import { IconChevronDown, IconChevronUp } from '../ui/icons';
import type { RowDensity } from '../ui/Pagination';
import {
  formatLastLogin,
  formatPlayTime,
  formatPosition,
  type PlayerRow,
} from '../../lib/player-utils';

export type PlayerColumn = {
  key: string;
  label: string;
  sortable?: boolean;
  render: (row: PlayerRow, index: number) => React.ReactNode;
  className?: string;
};

const densityClasses: Record<RowDensity, string> = {
  compact: 'py-2',
  comfortable: 'py-3',
  spacious: 'py-4',
};

export function PlayerGrid({
  rows,
  columns,
  selectedKeys,
  onToggleRow,
  onToggleAll,
  sortKey,
  sortDesc,
  onSort,
  density,
}: {
  rows: PlayerRow[];
  columns: PlayerColumn[];
  selectedKeys: Set<string>;
  onToggleRow: (key: string) => void;
  onToggleAll: () => void;
  sortKey?: string;
  sortDesc?: boolean;
  onSort?: (key: string) => void;
  density: RowDensity;
}) {
  const allSelected = rows.length > 0 && rows.every((row) => selectedKeys.has(row.key));
  const cellClass = densityClasses[density];

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1200px] text-left text-sm">
        <thead className="sticky top-0 z-10 bg-[var(--color-surface-solid)]/95 backdrop-blur">
          <tr className="border-b border-[var(--color-border)]">
            <th className={`w-10 px-4 ${cellClass}`}>
              <input
                type="checkbox"
                checked={allSelected}
                onChange={onToggleAll}
                className="h-4 w-4 rounded border-[var(--color-border-strong)] accent-[var(--color-accent)]"
              />
            </th>
            <th className={`w-14 px-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)] ${cellClass}`}>
              #
            </th>
            {columns.map((column) => (
              <th
                key={column.key}
                className={`px-4 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)] ${cellClass} ${column.className ?? ''}`}
              >
                {column.sortable && onSort ? (
                  <button
                    type="button"
                    onClick={() => onSort(column.key)}
                    className="inline-flex items-center gap-1 hover:text-[var(--color-foreground)]"
                  >
                    {column.label}
                    {sortKey === column.key ? (
                      sortDesc ? (
                        <IconChevronDown width={14} height={14} />
                      ) : (
                        <IconChevronUp width={14} height={14} />
                      )
                    ) : (
                      <span className="inline-block h-3.5 w-3.5 opacity-30">↕</span>
                    )}
                  </button>
                ) : (
                  column.label
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + 2}
                className="px-5 py-16 text-center text-[var(--color-muted)]"
              >
                No data
              </td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr
                key={row.key}
                className={`border-b border-[var(--color-border)] transition-colors last:border-0 hover:bg-[var(--color-surface-hover)] ${selectedKeys.has(row.key) ? 'bg-[var(--color-accent-soft)]/40' : ''}`}
              >
                <td className={`px-4 ${cellClass}`}>
                  <input
                    type="checkbox"
                    checked={selectedKeys.has(row.key)}
                    onChange={() => onToggleRow(row.key)}
                    className="h-4 w-4 rounded border-[var(--color-border-strong)] accent-[var(--color-accent)]"
                  />
                </td>
                <td className={`px-2 text-[var(--color-muted-2)] ${cellClass}`}>{index + 1}</td>
                {columns.map((column) => (
                  <td key={column.key} className={`px-4 ${cellClass} ${column.className ?? ''}`}>
                    {column.render(row, index)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export function useOnlineColumns(showServer: boolean): PlayerColumn[] {
  return useMemo(
    () => [
      {
        key: 'playerName',
        label: 'Player name',
        sortable: true,
        render: (row) => <span className="font-semibold">{row.playerName}</span>,
      },
      ...(showServer
        ? [
            {
              key: 'server',
              label: 'Server',
              render: (row: PlayerRow) => (
                <Badge variant="info">{row.serverName ?? '—'}</Badge>
              ),
            } satisfies PlayerColumn,
          ]
        : []),
      {
        key: 'gameStage',
        label: 'Game stage',
        sortable: true,
        render: (row) => row.gameStage ?? '—',
      },
      {
        key: 'level',
        label: 'Level',
        sortable: true,
        render: (row) => row.details.level ?? '—',
      },
      {
        key: 'zombieKills',
        label: 'Zombie kills',
        sortable: true,
        render: (row) => row.details.zombieKills ?? 0,
      },
      {
        key: 'playerKills',
        label: 'Player kills',
        sortable: true,
        render: (row) => row.details.playerKills ?? 0,
      },
      {
        key: 'deaths',
        label: 'Deaths',
        sortable: true,
        render: (row) => row.details.deaths ?? 0,
      },
      {
        key: 'skillPoints',
        label: 'Skill points',
        sortable: true,
        render: (row) => row.details.skillPoints ?? 0,
      },
      {
        key: 'pointsCount',
        label: 'Points',
        sortable: true,
        render: (row) => (
          <span className="font-medium text-[var(--color-accent)]">{row.details.pointsCount ?? 0}</span>
        ),
      },
      {
        key: 'position',
        label: 'Current position',
        render: (row) => (
          <span className="font-mono text-xs text-[var(--color-muted)]">
            {formatPosition(row.details.position)}
          </span>
        ),
      },
      {
        key: 'ip',
        label: 'IP address',
        render: (row) => (
          <span className="font-mono text-xs text-[var(--color-muted)]">{row.ip ?? '—'}</span>
        ),
      },
      {
        key: 'ping',
        label: 'Ping',
        sortable: true,
        render: (row) => (row.ping != null ? `${row.ping}ms` : '—'),
      },
    ],
    [showServer],
  );
}

export function useHistoryColumns(): PlayerColumn[] {
  return useMemo(
    () => [
      {
        key: 'playerName',
        label: 'Player name',
        sortable: true,
        render: (row) => <span className="font-semibold">{row.playerName}</span>,
      },
      {
        key: 'isOnline',
        label: 'Online',
        sortable: true,
        render: (row) => (
          <Badge variant={row.isOnline ? 'success' : 'neutral'}>{row.isOnline ? 'Yes' : 'No'}</Badge>
        ),
      },
      {
        key: 'level',
        label: 'Level',
        sortable: true,
        render: (row) => row.details.level ?? '—',
      },
      {
        key: 'zombieKills',
        label: 'Zombie kills',
        sortable: true,
        render: (row) => row.details.zombieKills ?? 0,
      },
      {
        key: 'playerKills',
        label: 'Player kills',
        sortable: true,
        render: (row) => row.details.playerKills ?? 0,
      },
      {
        key: 'deaths',
        label: 'Deaths',
        sortable: true,
        render: (row) => row.details.deaths ?? 0,
      },
      {
        key: 'skillPoints',
        label: 'Skill points',
        sortable: true,
        render: (row) => row.details.skillPoints ?? 0,
      },
      {
        key: 'pointsCount',
        label: 'Points',
        sortable: true,
        render: (row) => (
          <span className="font-medium text-[var(--color-accent)]">{row.details.pointsCount ?? 0}</span>
        ),
      },
      {
        key: 'position',
        label: 'Current position',
        render: (row) => (
          <span className="font-mono text-xs text-[var(--color-muted)]">
            {formatPosition(row.details.position)}
          </span>
        ),
      },
      {
        key: 'lastLogin',
        label: 'Last login',
        sortable: true,
        render: (row) => (
          <span className="text-[var(--color-muted)]">{formatLastLogin(row.details.lastLogin)}</span>
        ),
      },
      {
        key: 'totalTimePlayed',
        label: 'Total time played',
        sortable: true,
        render: (row) => formatPlayTime(row.details.totalTimePlayed),
      },
    ],
    [],
  );
}
