import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CdKeyRedemptionRecord } from '@msk-panel/shared';
import { SearchBar, PlayerToolbar } from '../players/PlayerToolbar';
import { Button } from '../ui/Button';
import { DensityToggle, PaginationBar, type RowDensity } from '../ui/Pagination';
import { ErrorBanner, LoadingState } from '../ui/PageHeader';
import { api } from '../../lib/api';
import { formatLastLogin } from '../../lib/player-utils';

const densityClasses: Record<RowDensity, string> = {
  compact: 'py-2',
  comfortable: 'py-3',
  spacious: 'py-4',
};

export function CdKeyRecordTab() {
  const queryClient = useQueryClient();
  const [keyword, setKeyword] = useState('');
  const [appliedKeyword, setAppliedKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [density, setDensity] = useState<RowDensity>('comfortable');
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['cd-key-records', page, pageSize, appliedKeyword],
    queryFn: () => api.getCdKeyRecords({ page, pageSize, search: appliedKeyword || undefined }),
  });

  const rows = useMemo(() => data?.items ?? [], [data]);
  const cellClass = densityClasses[density];
  const allSelected = rows.length > 0 && rows.every((row) => selectedKeys.has(row.id));

  const deleteMutation = useMutation({
    mutationFn: (ids: string[]) => api.batchDeleteCdKeyRecords(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cd-key-records'] });
      setSelectedKeys(new Set());
    },
  });

  if (isLoading) return <LoadingState label="Loading redemption records…" />;
  if (error) return <ErrorBanner message={(error as Error).message} />;

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-solid)]">
      <div className="border-b border-[var(--color-border)] px-5 py-3 text-sm text-[var(--color-muted)]">
        Cluster-wide redemption history. Records show which player redeemed which key and when.
      </div>

      <PlayerToolbar
        disabled={selectedKeys.size === 0}
        groups={[[{
          label: 'Batch delete',
          variant: 'danger',
          highlight: true,
          onClick: () => {
            if (confirm(`Delete ${selectedKeys.size} records?`)) deleteMutation.mutate([...selectedKeys]);
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
          <thead>
            <tr className="border-b border-[var(--color-border)] text-xs uppercase tracking-wider text-[var(--color-muted)]">
              <th className={`w-10 px-4 ${cellClass}`}>
                <input type="checkbox" checked={allSelected} onChange={() => {
                  if (allSelected) setSelectedKeys(new Set());
                  else setSelectedKeys(new Set(rows.map((r) => r.id)));
                }} className="h-4 w-4 accent-[var(--color-accent)]" />
              </th>
              <th className={`px-4 ${cellClass}`}>Index</th>
              <th className={`px-4 ${cellClass}`}>Key</th>
              <th className={`px-4 ${cellClass}`}>Created at</th>
              <th className={`px-4 ${cellClass}`}>Player ID</th>
              <th className={`px-4 ${cellClass}`}>Player name</th>
              <th className={`px-4 ${cellClass}`}>Operate</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={7} className="px-5 py-16 text-center text-[var(--color-muted)]">No data</td></tr>
            ) : (
              rows.map((row: CdKeyRedemptionRecord) => (
                <tr key={row.id} className={`border-b border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] ${selectedKeys.has(row.id) ? 'bg-[var(--color-accent-soft)]/40' : ''}`}>
                  <td className={`px-4 ${cellClass}`}>
                    <input type="checkbox" checked={selectedKeys.has(row.id)} onChange={() => {
                      setSelectedKeys((prev) => {
                        const next = new Set(prev);
                        if (next.has(row.id)) next.delete(row.id);
                        else next.add(row.id);
                        return next;
                      });
                    }} className="h-4 w-4 accent-[var(--color-accent)]" />
                  </td>
                  <td className={`px-4 text-[var(--color-muted-2)] ${cellClass}`}>{row.index}</td>
                  <td className={`px-4 font-mono font-semibold text-[var(--color-accent)] ${cellClass}`}>{row.key}</td>
                  <td className={`px-4 text-[var(--color-muted)] ${cellClass}`}>{formatLastLogin(row.createdAt)}</td>
                  <td className={`px-4 font-mono text-xs ${cellClass}`}>{row.platformId}</td>
                  <td className={`px-4 font-semibold ${cellClass}`}>{row.playerName}</td>
                  <td className={`px-4 ${cellClass}`}>
                    <Button variant="ghost" size="sm" className="!text-[var(--color-danger)]" onClick={() => {
                      if (confirm('Delete this record?')) deleteMutation.mutate([row.id]);
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

      <div className="border-t border-[var(--color-border)] px-5 py-3 text-right">
        <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={isFetching}>
          {isFetching ? 'Refreshing…' : 'Refresh table'}
        </Button>
      </div>
    </div>
  );
}
