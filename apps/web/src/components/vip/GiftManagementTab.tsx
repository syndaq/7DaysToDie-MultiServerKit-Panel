import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ClusterSyncResult, VipGiftRecord } from '@msk-panel/shared';
import { SearchBar, PlayerToolbar } from '../players/PlayerToolbar';
import { VipGiftBindModal } from './VipGiftBindModal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { DensityToggle, PaginationBar, type RowDensity } from '../ui/Pagination';
import { ErrorBanner, LoadingState } from '../ui/PageHeader';
import { Input } from '../ui/Input';
import { SyncStatusBanner } from '../ui/SyncStatusBanner';
import { api } from '../../lib/api';
import { formatLastLogin } from '../../lib/player-utils';

const densityClasses: Record<RowDensity, string> = {
  compact: 'py-2',
  comfortable: 'py-3',
  spacious: 'py-4',
};

export function GiftManagementTab() {
  const queryClient = useQueryClient();
  const [keyword, setKeyword] = useState('');
  const [appliedKeyword, setAppliedKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [density, setDensity] = useState<RowDensity>('comfortable');
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [bindGift, setBindGift] = useState<VipGiftRecord | null>(null);
  const [lastSync, setLastSync] = useState<ClusterSyncResult[]>();
  const [form, setForm] = useState({
    id: '',
    displayName: '',
    name: '',
    description: '',
  });

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['vip-gifts', page, pageSize, appliedKeyword],
    queryFn: () =>
      api.getVipGifts({
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
      api.createVipGift({
        id: form.id,
        displayName: form.displayName || form.id,
        name: form.name,
        description: form.description || undefined,
      }),
    onSuccess: (result) => {
      setLastSync(result.sync);
      queryClient.invalidateQueries({ queryKey: ['vip-gifts'] });
      setForm({ id: '', displayName: '', name: '', description: '' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (ids: string[]) => api.batchDeleteVipGifts(ids),
    onSuccess: (result) => {
      setLastSync(result.sync);
      queryClient.invalidateQueries({ queryKey: ['vip-gifts'] });
      setSelectedKeys(new Set());
    },
  });

  if (isLoading) return <LoadingState label="Loading VIP gifts…" />;
  if (error) return <ErrorBanner message={(error as Error).message} />;

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-solid)]">
        <div className="border-b border-[var(--color-border)] px-5 py-3 text-sm text-[var(--color-muted)]">
          Cluster-wide VIP gift registry. Add eligible players once — their gift package syncs to every connected server.
        </div>

        <form
          className="grid gap-4 border-b border-[var(--color-border)] px-5 py-4 lg:grid-cols-4"
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate();
          }}
        >
          <Input label="Player ID" required value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} />
          <Input label="Player name" value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} />
          <Input label="Gift name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="flex gap-2 lg:col-span-4">
            <Button type="submit" disabled={createMutation.isPending}>Add</Button>
            <Button type="button" variant="secondary" onClick={() => setForm({ id: '', displayName: '', name: '', description: '' })}>Reset</Button>
          </div>
        </form>

        <PlayerToolbar
          disabled={selectedKeys.size === 0}
          groups={[[{
            label: 'Batch delete',
            variant: 'danger',
            highlight: true,
            onClick: () => {
              if (confirm(`Delete ${selectedKeys.size} VIP gift records?`)) {
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
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead>
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
                <th className={`px-4 ${cellClass}`}>Name</th>
                <th className={`px-4 ${cellClass}`}>Already claimed</th>
                <th className={`px-4 ${cellClass}`}>Total claim count</th>
                <th className={`px-4 ${cellClass}`}>Last claim at</th>
                <th className={`px-4 ${cellClass}`}>Description</th>
                <th className={`px-4 ${cellClass}`}>Bind</th>
                <th className={`px-4 ${cellClass}`}>Operate</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={11} className="px-5 py-16 text-center text-[var(--color-muted)]">No data</td></tr>
              ) : (
                rows.map((row, index) => (
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
                    <td className={`px-4 text-[var(--color-muted-2)] ${cellClass}`}>{index + 1 + (page - 1) * pageSize}</td>
                    <td className={`px-4 font-mono text-xs ${cellClass}`}>{row.id}</td>
                    <td className={`px-4 font-semibold ${cellClass}`}>{row.displayName}</td>
                    <td className={`px-4 ${cellClass}`}>{row.name}</td>
                    <td className={`px-4 ${cellClass}`}>
                      <Badge variant={row.claimState ? 'success' : 'neutral'}>
                        {row.claimState ? 'Yes' : 'No'}
                      </Badge>
                    </td>
                    <td className={`px-4 ${cellClass}`}>{row.totalClaimCount}</td>
                    <td className={`px-4 text-[var(--color-muted)] ${cellClass}`}>{formatLastLogin(row.lastClaimAt ?? undefined)}</td>
                    <td className={`px-4 text-[var(--color-muted)] ${cellClass}`}>{row.description ?? '—'}</td>
                    <td className={`px-4 ${cellClass}`}>
                      <Button variant="secondary" size="sm" onClick={() => setBindGift(row)}>
                        Bind ({row.items.length + row.commands.length})
                      </Button>
                    </td>
                    <td className={`px-4 ${cellClass}`}>
                      <Button variant="ghost" size="sm" className="!text-[var(--color-danger)]" onClick={() => {
                        if (confirm(`Delete VIP gift for ${row.displayName}?`)) deleteMutation.mutate([row.id]);
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

      {bindGift && (
        <VipGiftBindModal
          gift={bindGift}
          onClose={() => setBindGift(null)}
          onSaved={(sync) => {
            setLastSync(sync);
            queryClient.invalidateQueries({ queryKey: ['vip-gifts'] });
          }}
        />
      )}
    </>
  );
}
