import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ClusterSyncResult, PanelCdKey } from '@msk-panel/shared';
import { SearchBar, PlayerToolbar } from '../players/PlayerToolbar';
import { CdKeyBindModal } from './CdKeyBindModal';
import { Button } from '../ui/Button';
import { DensityToggle, PaginationBar, type RowDensity } from '../ui/Pagination';
import { ErrorBanner, LoadingState } from '../ui/PageHeader';
import { Input } from '../ui/Input';
import { SyncStatusBanner } from '../ui/SyncStatusBanner';
import { api } from '../../lib/api';
import { formatLastLogin } from '../../lib/player-utils';
import { fromDateTimeLocalValue } from '../../lib/points-utils';

const densityClasses: Record<RowDensity, string> = {
  compact: 'py-2',
  comfortable: 'py-3',
  spacious: 'py-4',
};

export function CdKeyManagementTab() {
  const queryClient = useQueryClient();
  const [keyword, setKeyword] = useState('');
  const [appliedKeyword, setAppliedKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [density, setDensity] = useState<RowDensity>('comfortable');
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [bindKey, setBindKey] = useState<PanelCdKey | null>(null);
  const [lastSync, setLastSync] = useState<ClusterSyncResult[]>();
  const [form, setForm] = useState({ code: '', maxRedeemCount: 1, expiresAt: '', description: '' });

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['cd-keys', page, pageSize, appliedKeyword],
    queryFn: () => api.getCdKeys({ page, pageSize, search: appliedKeyword || undefined }),
  });

  const rows = useMemo(() => data?.items ?? [], [data]);
  const cellClass = densityClasses[density];
  const allSelected = rows.length > 0 && rows.every((row) => selectedKeys.has(row.id));

  const createMutation = useMutation({
    mutationFn: () =>
      api.createCdKey({
        code: form.code,
        maxRedeemCount: form.maxRedeemCount,
        expiresAt: form.expiresAt ? fromDateTimeLocalValue(form.expiresAt) : null,
        description: form.description || undefined,
      }),
    onSuccess: (result) => {
      setLastSync(result.sync);
      queryClient.invalidateQueries({ queryKey: ['cd-keys'] });
      setForm({ code: '', maxRedeemCount: 1, expiresAt: '', description: '' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (ids: string[]) => api.batchDeleteCdKeys(ids),
    onSuccess: (result) => {
      setLastSync(result.sync);
      queryClient.invalidateQueries({ queryKey: ['cd-keys'] });
      setSelectedKeys(new Set());
    },
  });

  if (isLoading) return <LoadingState label="Loading CD keys…" />;
  if (error) return <ErrorBanner message={(error as Error).message} />;

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-solid)]">
        <div className="border-b border-[var(--color-border)] px-5 py-3 text-sm text-[var(--color-muted)]">
          Cluster-wide CD key catalog. Keys sync to every connected server so redemption works network-wide.
        </div>

        <form
          className="grid gap-4 border-b border-[var(--color-border)] px-5 py-4 lg:grid-cols-4"
          onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }}
        >
          <Input label="Key" required className="font-mono uppercase" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} />
          <Input label="Max redeem count" type="number" min={0} value={form.maxRedeemCount} onChange={(e) => setForm({ ...form, maxRedeemCount: Number(e.target.value) })} />
          <Input label="Expiry at" type="datetime-local" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
          <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="flex gap-2 lg:col-span-4">
            <Button type="submit" disabled={createMutation.isPending}>Add</Button>
            <Button type="button" variant="secondary" onClick={() => setForm({ code: '', maxRedeemCount: 1, expiresAt: '', description: '' })}>Reset</Button>
          </div>
        </form>

        <PlayerToolbar
          disabled={selectedKeys.size === 0}
          groups={[[{
            label: 'Batch delete',
            variant: 'danger',
            highlight: true,
            onClick: () => {
              if (confirm(`Delete ${selectedKeys.size} CD keys?`)) deleteMutation.mutate([...selectedKeys]);
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
                <th className={`px-4 ${cellClass}`}>Key</th>
                <th className={`px-4 ${cellClass}`}>Created at</th>
                <th className={`px-4 ${cellClass}`}>Redeem count</th>
                <th className={`px-4 ${cellClass}`}>Max redeem count</th>
                <th className={`px-4 ${cellClass}`}>Expiry at</th>
                <th className={`px-4 ${cellClass}`}>Description</th>
                <th className={`px-4 ${cellClass}`}>Bind</th>
                <th className={`px-4 ${cellClass}`}>Operate</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={9} className="px-5 py-16 text-center text-[var(--color-muted)]">No data</td></tr>
              ) : (
                rows.map((row) => (
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
                    <td className={`px-4 font-mono font-semibold text-[var(--color-accent)] ${cellClass}`}>{row.code}</td>
                    <td className={`px-4 text-[var(--color-muted)] ${cellClass}`}>{formatLastLogin(row.createdAt)}</td>
                    <td className={`px-4 ${cellClass}`}>{row.redeemCount}</td>
                    <td className={`px-4 ${cellClass}`}>{row.maxRedeemCount}</td>
                    <td className={`px-4 text-[var(--color-muted)] ${cellClass}`}>{row.expiresAt ? formatLastLogin(row.expiresAt) : '—'}</td>
                    <td className={`px-4 text-[var(--color-muted)] ${cellClass}`}>{row.description ?? '—'}</td>
                    <td className={`px-4 ${cellClass}`}>
                      <Button variant="secondary" size="sm" onClick={() => setBindKey(row)}>
                        Bind ({row.items.length + row.commands.length})
                      </Button>
                    </td>
                    <td className={`px-4 ${cellClass}`}>
                      <Button variant="ghost" size="sm" className="!text-[var(--color-danger)]" onClick={() => {
                        if (confirm(`Delete key ${row.code}?`)) deleteMutation.mutate([row.id]);
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

      {bindKey && (
        <CdKeyBindModal
          cdKey={bindKey}
          onClose={() => setBindKey(null)}
          onSaved={(sync) => {
            setLastSync(sync);
            queryClient.invalidateQueries({ queryKey: ['cd-keys'] });
          }}
        />
      )}
    </>
  );
}
