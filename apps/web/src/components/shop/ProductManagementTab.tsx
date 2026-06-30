import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ClusterSyncResult, ShopProduct } from '@msk-panel/shared';
import { SearchBar, PlayerToolbar } from '../players/PlayerToolbar';
import { GoodsBindModal } from './GoodsBindModal';
import { Button } from '../ui/Button';
import { DensityToggle, PaginationBar, type RowDensity } from '../ui/Pagination';
import { ErrorBanner, LoadingState } from '../ui/PageHeader';
import { Input } from '../ui/Input';
import { SyncStatusBanner } from '../ui/SyncStatusBanner';
import { api } from '../../lib/api';

const densityClasses: Record<RowDensity, string> = {
  compact: 'py-2',
  comfortable: 'py-3',
  spacious: 'py-4',
};

export function ProductManagementTab() {
  const queryClient = useQueryClient();
  const [keyword, setKeyword] = useState('');
  const [appliedKeyword, setAppliedKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [density, setDensity] = useState<RowDensity>('comfortable');
  const [selectedKeys, setSelectedKeys] = useState<Set<number>>(new Set());
  const [bindProduct, setBindProduct] = useState<ShopProduct | null>(null);
  const [lastSync, setLastSync] = useState<ClusterSyncResult[]>();
  const [form, setForm] = useState({ name: '', price: 1, description: '' });

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['shop-products'],
    queryFn: () => api.getShopProducts(),
  });

  const filtered = useMemo(() => {
    let items = data ?? [];
    if (appliedKeyword) {
      const q = appliedKeyword.toLowerCase();
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          String(item.id).includes(q) ||
          (item.description?.toLowerCase().includes(q) ?? false),
      );
    }
    return items;
  }, [data, appliedKeyword]);

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const createMutation = useMutation({
    mutationFn: () =>
      api.createShopProduct({
        name: form.name,
        price: form.price,
        description: form.description || undefined,
      }),
    onSuccess: (result) => {
      setLastSync(result.sync);
      queryClient.invalidateQueries({ queryKey: ['shop-products'] });
      setForm({ name: '', price: 1, description: '' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (ids: number[]) => api.batchDeleteShopProducts(ids),
    onSuccess: (result) => {
      setLastSync(result.sync);
      queryClient.invalidateQueries({ queryKey: ['shop-products'] });
      setSelectedKeys(new Set());
    },
  });

  const cellClass = densityClasses[density];
  const allSelected = paged.length > 0 && paged.every((row) => selectedKeys.has(row.id));

  if (isLoading) return <LoadingState label="Loading products…" />;
  if (error) return <ErrorBanner message={(error as Error).message} />;

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-solid)]">
        <div className="border-b border-[var(--color-border)] px-5 py-3 text-sm text-[var(--color-muted)]">
          Cluster-wide product catalog. New products and bindings sync to every connected game server automatically.
        </div>

        <form
          className="grid gap-4 border-b border-[var(--color-border)] px-5 py-4 lg:grid-cols-4"
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate();
          }}
        >
          <Input label="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Price" type="number" required min={0} value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
          <Input label="Description" className="lg:col-span-2" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="flex gap-2 lg:col-span-4">
            <Button type="submit" disabled={createMutation.isPending}>Add</Button>
            <Button type="button" variant="secondary" onClick={() => setForm({ name: '', price: 1, description: '' })}>Reset</Button>
          </div>
        </form>

        <PlayerToolbar
          disabled={selectedKeys.size === 0}
          groups={[[{
            label: 'Batch delete',
            variant: 'danger',
            highlight: true,
            onClick: () => {
              if (confirm(`Delete ${selectedKeys.size} products?`)) {
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
            <thead>
              <tr className="border-b border-[var(--color-border)] text-xs uppercase tracking-wider text-[var(--color-muted)]">
                <th className={`w-10 px-4 ${cellClass}`}>
                  <input type="checkbox" checked={allSelected} onChange={() => {
                    if (allSelected) setSelectedKeys(new Set());
                    else setSelectedKeys(new Set(paged.map((r) => r.id)));
                  }} className="h-4 w-4 accent-[var(--color-accent)]" />
                </th>
                <th className={`px-4 ${cellClass}`}>#</th>
                <th className={`px-4 ${cellClass}`}>ID</th>
                <th className={`px-4 ${cellClass}`}>Name</th>
                <th className={`px-4 ${cellClass}`}>Price</th>
                <th className={`px-4 ${cellClass}`}>Description</th>
                <th className={`px-4 ${cellClass}`}>Bind</th>
                <th className={`px-4 ${cellClass}`}>Operate</th>
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr><td colSpan={8} className="px-5 py-16 text-center text-[var(--color-muted)]">No data</td></tr>
              ) : (
                paged.map((row, index) => (
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
                    <td className={`px-4 font-semibold ${cellClass}`}>{row.name}</td>
                    <td className={`px-4 font-medium text-[var(--color-accent)] ${cellClass}`}>{row.price}</td>
                    <td className={`px-4 text-[var(--color-muted)] ${cellClass}`}>{row.description ?? '—'}</td>
                    <td className={`px-4 ${cellClass}`}>
                      <Button variant="secondary" size="sm" onClick={() => setBindProduct(row)}>
                        Bind ({row.items.length + row.commands.length})
                      </Button>
                    </td>
                    <td className={`px-4 ${cellClass}`}>
                      <Button variant="ghost" size="sm" className="!text-[var(--color-danger)]" onClick={() => {
                        if (confirm(`Delete ${row.name}?`)) deleteMutation.mutate([row.id]);
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
          <PaginationBar page={page} pageSize={pageSize} total={filtered.length} onPageChange={setPage} onPageSizeChange={(size) => { setPageSize(size); setPage(1); }} />
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

      {bindProduct && (
        <GoodsBindModal
          product={bindProduct}
          onClose={() => setBindProduct(null)}
          onSaved={(sync) => {
            setLastSync(sync);
            queryClient.invalidateQueries({ queryKey: ['shop-products'] });
          }}
        />
      )}
    </>
  );
}
