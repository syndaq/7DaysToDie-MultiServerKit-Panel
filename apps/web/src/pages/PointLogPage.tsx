import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { PointLogEntry, PointLogSettings } from '@msk-panel/shared';
import { SearchBar, PlayerToolbar } from '../components/players/PlayerToolbar';
import { Button } from '../components/ui/Button';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Toggle } from '../components/ui/Toggle';
import { DensityToggle, PaginationBar, type RowDensity } from '../components/ui/Pagination';
import { PageShell } from '../components/ui/PageShell';
import { ErrorBanner, LoadingState } from '../components/ui/PageHeader';
import { Input } from '../components/ui/Input';
import { api } from '../lib/api';
import { formatLastLogin } from '../lib/player-utils';

const categories = [
  { key: 'shopPurchase', label: 'Shop Purchase' },
  { key: 'signIn', label: 'Sign-in' },
  { key: 'pointsTransfer', label: 'Points Transfer' },
  { key: 'teleport', label: 'Teleport' },
  { key: 'killReward', label: 'Kill Reward' },
  { key: 'lottery', label: 'Lottery' },
  { key: 'redeemCode', label: 'Redeem Code' },
  { key: 'levelGift', label: 'Level Gift' },
  { key: 'vipGift', label: 'VIP Gift' },
  { key: 'webPanel', label: 'Web Panel' },
  { key: 'externalMod', label: 'External Mod' },
  { key: 'other', label: 'Other' },
] as const;

const logCategories = categories.map((c) => c.label);
const categoryFilterOptions = ['', ...logCategories];
const typeFilterOptions = ['', 'Income', 'Expense'];

const densityClasses: Record<RowDensity, string> = {
  compact: 'py-2',
  comfortable: 'py-3',
  spacious: 'py-4',
};

export function PointLogPage() {
  const queryClient = useQueryClient();
  const [settingsForm, setSettingsForm] = useState<PointLogSettings | null>(null);
  const [keyword, setKeyword] = useState('');
  const [appliedKeyword, setAppliedKeyword] = useState('');
  const [category, setCategory] = useState('');
  const [type, setType] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [density, setDensity] = useState<RowDensity>('comfortable');
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  const settingsQuery = useQuery({
    queryKey: ['point-log-settings'],
    queryFn: api.getPointLogSettings,
  });

  useEffect(() => {
    if (settingsQuery.data) setSettingsForm(settingsQuery.data);
  }, [settingsQuery.data]);

  const logQuery = useQuery({
    queryKey: ['point-log', page, pageSize, appliedKeyword, category, type, start, end],
    queryFn: () =>
      api.getPointLog({
        page,
        pageSize,
        keyword: appliedKeyword || undefined,
        category: category || undefined,
        type: type || undefined,
        start: start || undefined,
        end: end ? new Date(end).toISOString() : undefined,
      }),
  });

  const saveSettingsMutation = useMutation({
    mutationFn: () => {
      if (!settingsForm) throw new Error('Settings not loaded');
      const { id, updatedAt, ...rest } = settingsForm;
      return api.updatePointLogSettings(rest);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['point-log-settings'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (ids: string[]) => api.deletePointLogEntries(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['point-log'] });
      setSelectedKeys(new Set());
    },
  });

  const rows = logQuery.data?.items ?? [];
  const cellClass = densityClasses[density];
  const allSelected = rows.length > 0 && rows.every((row) => selectedKeys.has(row.id));

  const toggleCategory = (key: keyof PointLogSettings) => {
    if (!settingsForm) return;
    setSettingsForm({ ...settingsForm, [key]: !settingsForm[key] });
  };

  return (
    <PageShell
      title="Point log"
      description="Audit trail for all point balance changes across your cluster. Enable logging and filter by category, type, or time range."
    >
      {settingsQuery.isLoading ? (
        <LoadingState label="Loading log settings…" />
      ) : settingsForm ? (
        <Card className="mb-6">
          <CardHeader
            title="Log settings"
            description="When enabled, the panel records point changes for auditing. Retention days of 0 means records are never cleaned automatically."
            action={
              <div className="flex items-center gap-3">
                <Badge variant={settingsForm.enabled ? 'success' : 'neutral'}>
                  {settingsForm.enabled ? 'Enabled' : 'Disabled'}
                </Badge>
                <Toggle
                  checked={settingsForm.enabled}
                  onChange={(enabled) => setSettingsForm({ ...settingsForm, enabled })}
                />
              </div>
            }
          />

          <div className="mb-5 max-w-xs">
            <Input
              label="Retention days"
              type="number"
              min={0}
              value={settingsForm.retentionDays}
              onChange={(e) =>
                setSettingsForm({ ...settingsForm, retentionDays: Number(e.target.value) })
              }
              hint="0 = never clean up automatically"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {categories.map(({ key, label }) => (
              <label
                key={key}
                className="flex items-center justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2.5 text-sm"
              >
                <span>{label}</span>
                <Toggle
                  checked={Boolean(settingsForm[key as keyof PointLogSettings])}
                  onChange={() => toggleCategory(key as keyof PointLogSettings)}
                />
              </label>
            ))}
          </div>

          <div className="mt-5 flex gap-3">
            <Button onClick={() => saveSettingsMutation.mutate()} disabled={saveSettingsMutation.isPending}>
              Save
            </Button>
            <Button variant="secondary" onClick={() => setSettingsForm(settingsQuery.data ?? null)}>
              Reset
            </Button>
          </div>
        </Card>
      ) : null}

      <Card padding={false} className="overflow-hidden">
        <div className="grid gap-4 border-b border-[var(--color-border)] px-5 py-4 lg:grid-cols-4">
          <Input label="Start time" type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} />
          <Input label="End time" type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} />
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-[var(--color-muted)]">Category</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-solid)] px-3.5 py-2.5 text-sm"
            >
              {categoryFilterOptions.map((option) => (
                <option key={option || 'all'} value={option}>{option || 'All categories'}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-[var(--color-muted)]">Type</span>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-solid)] px-3.5 py-2.5 text-sm"
            >
              {typeFilterOptions.map((option) => (
                <option key={option || 'all'} value={option}>{option || 'All types'}</option>
              ))}
            </select>
          </label>
        </div>

        <SearchBar
          value={keyword}
          onChange={setKeyword}
          onSearch={() => { setAppliedKeyword(keyword.trim()); setPage(1); }}
          onReset={() => { setKeyword(''); setAppliedKeyword(''); setPage(1); }}
        />

        <PlayerToolbar
          disabled={selectedKeys.size === 0}
          groups={[[{
            label: 'Batch delete',
            variant: 'danger',
            highlight: true,
            onClick: () => {
              if (confirm(`Delete ${selectedKeys.size} log entries?`)) {
                deleteMutation.mutate([...selectedKeys]);
              }
            },
          }]]}
        />

        {logQuery.isLoading ? (
          <LoadingState label="Loading point log…" />
        ) : logQuery.error ? (
          <div className="p-5"><ErrorBanner message={(logQuery.error as Error).message} /></div>
        ) : (
          <>
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
                    <th className={`px-4 ${cellClass}`}>Time</th>
                    <th className={`px-4 ${cellClass}`}>Player name</th>
                    <th className={`px-4 ${cellClass}`}>Player ID</th>
                    <th className={`px-4 ${cellClass}`}>Category</th>
                    <th className={`px-4 ${cellClass}`}>Type</th>
                    <th className={`px-4 ${cellClass}`}>Δ</th>
                    <th className={`px-4 ${cellClass}`}>Balance</th>
                    <th className={`px-4 ${cellClass}`}>Note</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr><td colSpan={10} className="px-5 py-16 text-center text-[var(--color-muted)]">No data</td></tr>
                  ) : (
                    rows.map((row: PointLogEntry, index) => (
                      <LogRow
                        key={row.id}
                        row={row}
                        index={index + 1 + (page - 1) * pageSize}
                        cellClass={cellClass}
                        selected={selectedKeys.has(row.id)}
                        onToggle={() => {
                          setSelectedKeys((prev) => {
                            const next = new Set(prev);
                            if (next.has(row.id)) next.delete(row.id);
                            else next.add(row.id);
                            return next;
                          });
                        }}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[var(--color-border)] px-5 py-4">
              <DensityToggle value={density} onChange={setDensity} />
              <PaginationBar
                page={page}
                pageSize={pageSize}
                total={logQuery.data?.total ?? 0}
                onPageChange={setPage}
                onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
              />
            </div>
          </>
        )}
      </Card>
    </PageShell>
  );
}

function LogRow({
  row,
  index,
  cellClass,
  selected,
  onToggle,
}: {
  row: PointLogEntry;
  index: number;
  cellClass: string;
  selected: boolean;
  onToggle: () => void;
}) {
  const deltaClass =
    row.type === 'Income' ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]';

  return (
    <tr className={`border-b border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] ${selected ? 'bg-[var(--color-accent-soft)]/40' : ''}`}>
      <td className={`px-4 ${cellClass}`}>
        <input type="checkbox" checked={selected} onChange={onToggle} className="h-4 w-4 accent-[var(--color-accent)]" />
      </td>
      <td className={`px-4 text-[var(--color-muted-2)] ${cellClass}`}>{index}</td>
      <td className={`px-4 text-[var(--color-muted)] ${cellClass}`}>{formatLastLogin(row.createdAt)}</td>
      <td className={`px-4 font-semibold ${cellClass}`}>{row.playerName}</td>
      <td className={`px-4 font-mono text-xs text-[var(--color-muted)] ${cellClass}`}>{row.playerId}</td>
      <td className={`px-4 ${cellClass}`}><Badge variant="info">{row.category}</Badge></td>
      <td className={`px-4 ${cellClass}`}>
        <Badge variant={row.type === 'Income' ? 'success' : 'danger'}>{row.type}</Badge>
      </td>
      <td className={`px-4 font-semibold ${deltaClass} ${cellClass}`}>
        {row.change > 0 ? `+${row.change}` : row.change}
      </td>
      <td className={`px-4 font-medium ${cellClass}`}>{row.balance}</td>
      <td className={`px-4 text-[var(--color-muted)] ${cellClass}`}>{row.note ?? '—'}</td>
    </tr>
  );
}
