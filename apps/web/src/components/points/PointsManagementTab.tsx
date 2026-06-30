import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ClusterSyncResult, PanelPlayer } from '@msk-panel/shared';
import { SearchBar, PlayerToolbar } from '../players/PlayerToolbar';
import { Button } from '../ui/Button';
import { DensityToggle, PaginationBar, type RowDensity } from '../ui/Pagination';
import { ErrorBanner, LoadingState } from '../ui/PageHeader';
import { Input } from '../ui/Input';
import { SyncStatusBanner } from '../ui/SyncStatusBanner';
import { api } from '../../lib/api';
import { fromDateTimeLocalValue } from '../../lib/points-utils';
import { formatLastLogin } from '../../lib/player-utils';

const densityClasses: Record<RowDensity, string> = {
  compact: 'py-2',
  comfortable: 'py-3',
  spacious: 'py-4',
};

export function PointsManagementTab() {
  const queryClient = useQueryClient();
  const [keyword, setKeyword] = useState('');
  const [appliedKeyword, setAppliedKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [density, setDensity] = useState<RowDensity>('comfortable');
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [lastSync, setLastSync] = useState<ClusterSyncResult[]>();
  const [form, setForm] = useState({
    platformId: '',
    displayName: '',
    points: 0,
    lastSignInAt: '',
  });

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['cluster-points', page, pageSize, appliedKeyword],
    queryFn: () =>
      api.getPoints({
        page,
        pageSize,
        search: appliedKeyword || undefined,
      }),
  });

  const rows = useMemo(() => data?.items ?? [], [data]);
  const cellClass = densityClasses[density];
  const allSelected = rows.length > 0 && rows.every((row) => selectedKeys.has(row.id));

  const createMutation = useMutation({
    mutationFn: () =>
      api.createPlayerPoints({
        platformId: form.platformId,
        displayName: form.displayName || form.platformId,
        points: form.points,
        lastSignInAt: form.lastSignInAt ? fromDateTimeLocalValue(form.lastSignInAt) : null,
      }),
    onSuccess: (result) => {
      setLastSync(result.sync);
      queryClient.invalidateQueries({ queryKey: ['cluster-points'] });
      setForm({ platformId: '', displayName: '', points: 0, lastSignInAt: '' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (ids: string[]) => api.batchDeletePlayerPoints(ids),
    onSuccess: (result) => {
      setLastSync(result.sync);
      queryClient.invalidateQueries({ queryKey: ['cluster-points'] });
      setSelectedKeys(new Set());
    },
  });

  const toggleRow = (id: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (isLoading) return <LoadingState label="Loading points…" />;
  if (error) return <ErrorBanner message={(error as Error).message} />;

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-solid)]">
      <div className="border-b border-[var(--color-border)] px-5 py-3 text-sm text-[var(--color-muted)]">
        Cluster-wide player balances. Edits here update the panel database and sync to every connected server.
      </div>

      <form
        className="grid gap-4 border-b border-[var(--color-border)] px-5 py-4 lg:grid-cols-4"
        onSubmit={(e) => {
          e.preventDefault();
          createMutation.mutate();
        }}
      >
        <Input
          label="Player ID"
          required
          value={form.platformId}
          onChange={(e) => setForm({ ...form, platformId: e.target.value })}
        />
        <Input
          label="Player name"
          value={form.displayName}
          onChange={(e) => setForm({ ...form, displayName: e.target.value })}
        />
        <Input
          label="Points"
          type="number"
          required
          value={form.points}
          onChange={(e) => setForm({ ...form, points: Number(e.target.value) })}
        />
        <Input
          label="Last sign-in"
          type="datetime-local"
          value={form.lastSignInAt}
          onChange={(e) => setForm({ ...form, lastSignInAt: e.target.value })}
        />
        <div className="flex gap-2 lg:col-span-4">
          <Button type="submit" disabled={createMutation.isPending}>Add</Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setForm({ platformId: '', displayName: '', points: 0, lastSignInAt: '' })}
          >
            Reset
          </Button>
        </div>
      </form>

      <PlayerToolbar
        disabled={selectedKeys.size === 0}
        groups={[[{
          label: 'Batch delete',
          variant: 'danger',
          highlight: true,
          onClick: () => {
            if (confirm(`Delete ${selectedKeys.size} selected records?`)) {
              deleteMutation.mutate([...selectedKeys]);
            }
          },
        }]]}
      />

      <SearchBar
        value={keyword}
        onChange={setKeyword}
        onSearch={() => { setAppliedKeyword(keyword.trim()); setPage(1); }}
        onReset={() => { setKeyword(''); setAppliedKeyword(''); setPage(1); }}
      />

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-[var(--color-surface-solid)]">
            <tr className="border-b border-[var(--color-border)] text-xs uppercase tracking-wider text-[var(--color-muted)]">
              <th className={`w-10 px-4 ${cellClass}`}>
                <input type="checkbox" checked={allSelected} onChange={() => {
                  if (allSelected) setSelectedKeys(new Set());
                  else setSelectedKeys(new Set(rows.map((r) => r.id)));
                }} className="h-4 w-4 accent-[var(--color-accent)]" />
              </th>
              <th className={`px-4 ${cellClass}`}>#</th>
              <th className={`px-4 ${cellClass}`}>Player ID</th>
              <th className={`px-4 ${cellClass}`}>Player name</th>
              <th className={`px-4 ${cellClass}`}>Points</th>
              <th className={`px-4 ${cellClass}`}>Last sign-in</th>
              <th className={`px-4 ${cellClass}`}>Operate</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={7} className="px-5 py-16 text-center text-[var(--color-muted)]">No data</td></tr>
            ) : (
              rows.map((row: PanelPlayer, index) => (
                <tr key={row.id} className={`border-b border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] ${selectedKeys.has(row.id) ? 'bg-[var(--color-accent-soft)]/40' : ''}`}>
                  <td className={`px-4 ${cellClass}`}>
                    <input type="checkbox" checked={selectedKeys.has(row.id)} onChange={() => toggleRow(row.id)} className="h-4 w-4 accent-[var(--color-accent)]" />
                  </td>
                  <td className={`px-4 text-[var(--color-muted-2)] ${cellClass}`}>{index + 1 + (page - 1) * pageSize}</td>
                  <td className={`px-4 font-mono text-xs text-[var(--color-muted)] ${cellClass}`}>{row.platformId}</td>
                  <td className={`px-4 font-semibold ${cellClass}`}>{row.displayName}</td>
                  <td className={`px-4 font-medium text-[var(--color-accent)] ${cellClass}`}>{row.points}</td>
                  <td className={`px-4 text-[var(--color-muted)] ${cellClass}`}>{formatLastLogin(row.lastSignInAt ?? undefined)}</td>
                  <td className={`px-4 ${cellClass}`}>
                    <Button variant="ghost" size="sm" className="!text-[var(--color-danger)]" onClick={() => {
                      if (confirm(`Delete ${row.displayName}?`)) deleteMutation.mutate([row.id]);
                    }}>Delete</Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[var(--color-border)] px-5 py-4">
        <DensityToggle value={density} onChange={setDensity} />
        <PaginationBar page={page} pageSize={pageSize} total={data?.total ?? 0} onPageChange={setPage} onPageSizeChange={(size) => { setPageSize(size); setPage(1); }} />
      </div>

      <div className="border-t border-[var(--color-border)] px-5 py-3">
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={isFetching}>
            {isFetching ? 'Refreshing…' : 'Refresh table'}
          </Button>
        </div>
        <SyncStatusBanner sync={lastSync} />
      </div>
    </div>
  );
}
