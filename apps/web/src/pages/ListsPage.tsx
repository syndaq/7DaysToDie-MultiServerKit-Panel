import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ModCommandListEntry, ModItemListEntry } from '@msk-panel/shared';
import { ServerSelector } from '../components/ServerSelector';
import { Button } from '../components/ui/Button';
import { Card, CardHeader } from '../components/ui/Card';
import { DataTable } from '../components/ui/DataTable';
import { Input } from '../components/ui/Input';
import { Toggle } from '../components/ui/Toggle';
import { PaginationBar } from '../components/ui/Pagination';
import { ErrorBanner, LoadingState } from '../components/ui/PageHeader';
import { PageShell, Tabs } from '../components/ui/PageShell';
import { api } from '../lib/api';

type TabId = 'items' | 'commands';

function ItemListTab({ serverId }: { serverId: string }) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [keyword, setKeyword] = useState('');
  const [appliedKeyword, setAppliedKeyword] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [itemName, setItemName] = useState('');
  const [count, setCount] = useState('1');
  const [quality, setQuality] = useState('0');
  const [durability, setDurability] = useState('0');
  const [description, setDescription] = useState('');

  const query = useQuery({
    queryKey: ['item-list', serverId, page, pageSize, appliedKeyword],
    queryFn: () =>
      api.getItemList(serverId, {
        pageNumber: page,
        pageSize,
        keyword: appliedKeyword || undefined,
      }),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        itemName,
        count: Number(count),
        quality: Number(quality),
        durability: Number(durability),
        description: description || undefined,
      };
      if (editingId) {
        await api.updateItemListEntry(serverId, editingId, payload);
      } else {
        await api.createItemListEntry(serverId, payload);
      }
    },
    onSuccess: () => {
      setEditingId(null);
      setItemName('');
      setCount('1');
      setQuality('0');
      setDurability('0');
      setDescription('');
      queryClient.invalidateQueries({ queryKey: ['item-list', serverId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.deleteItemListEntry(serverId, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['item-list', serverId] }),
  });

  const startEdit = (row: ModItemListEntry) => {
    setEditingId(row.id);
    setItemName(String(row.itemName ?? ''));
    setCount(String(row.count ?? 1));
    setQuality(String(row.quality ?? 0));
    setDurability(String(row.durability ?? 0));
    setDescription(String(row.description ?? ''));
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader title={editingId ? 'Edit item' : 'Add item'} />
        <div className="grid gap-3 md:grid-cols-2">
          <Input label="Item name" value={itemName} onChange={(e) => setItemName(e.target.value)} />
          <Input label="Count" type="number" value={count} onChange={(e) => setCount(e.target.value)} />
          <Input label="Quality" type="number" value={quality} onChange={(e) => setQuality(e.target.value)} />
          <Input label="Durability" type="number" value={durability} onChange={(e) => setDurability(e.target.value)} />
          <Input className="md:col-span-2" label="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="mt-4 flex gap-3">
          <Button onClick={() => saveMutation.mutate()} disabled={!itemName || saveMutation.isPending}>
            {editingId ? 'Update' : 'Add'}
          </Button>
          {editingId && (
            <Button variant="secondary" onClick={() => setEditingId(null)}>
              Cancel
            </Button>
          )}
        </div>
      </Card>

      <Card padding={false} className="overflow-hidden">
        <div className="border-b border-[var(--color-border)] px-5 py-4 flex gap-3">
          <Input label="Search" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
          <Button
            className="self-end"
            onClick={() => {
              setAppliedKeyword(keyword);
              setPage(1);
            }}
          >
            Search
          </Button>
        </div>
        {query.isLoading ? (
          <LoadingState label="Loading items…" />
        ) : query.error ? (
          <div className="p-4">
            <ErrorBanner message={(query.error as Error).message} />
          </div>
        ) : (
          <>
            <DataTable<ModItemListEntry>
              keyFn={(row) => String(row.id)}
              data={query.data?.items ?? []}
              columns={[
                { key: 'name', header: 'Item', render: (row) => row.itemName },
                { key: 'count', header: 'Count', render: (row) => row.count },
                { key: 'quality', header: 'Quality', render: (row) => row.quality },
                {
                  key: 'actions',
                  header: '',
                  render: (row) => (
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => startEdit(row)}>
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="!text-[var(--color-danger)]"
                        onClick={() => deleteMutation.mutate(row.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  ),
                },
              ]}
            />
            <PaginationBar
              page={page}
              pageSize={pageSize}
              total={query.data?.total ?? 0}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
            />
          </>
        )}
      </Card>
    </div>
  );
}

function CommandListTab({ serverId }: { serverId: string }) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [keyword, setKeyword] = useState('');
  const [appliedKeyword, setAppliedKeyword] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [command, setCommand] = useState('');
  const [inMainThread, setInMainThread] = useState(false);
  const [description, setDescription] = useState('');

  const query = useQuery({
    queryKey: ['command-list', serverId, page, pageSize, appliedKeyword],
    queryFn: () =>
      api.getCommandList(serverId, {
        pageNumber: page,
        pageSize,
        keyword: appliedKeyword || undefined,
      }),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { command, inMainThread, description: description || undefined };
      if (editingId) {
        await api.updateCommandListEntry(serverId, editingId, payload);
      } else {
        await api.createCommandListEntry(serverId, payload);
      }
    },
    onSuccess: () => {
      setEditingId(null);
      setCommand('');
      setInMainThread(false);
      setDescription('');
      queryClient.invalidateQueries({ queryKey: ['command-list', serverId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.deleteCommandListEntry(serverId, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['command-list', serverId] }),
  });

  const startEdit = (row: ModCommandListEntry) => {
    setEditingId(row.id);
    setCommand(String(row.command ?? ''));
    setInMainThread(Boolean(row.inMainThread));
    setDescription(String(row.description ?? ''));
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader title={editingId ? 'Edit command' : 'Add command'} />
        <div className="grid gap-3 md:grid-cols-2">
          <Input className="md:col-span-2" label="Command" value={command} onChange={(e) => setCommand(e.target.value)} />
          <Input className="md:col-span-2" label="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
          <div className="flex items-center justify-between rounded-xl border border-[var(--color-border)] px-4 py-3 md:col-span-2">
            <span className="text-sm font-medium">Run on main thread</span>
            <Toggle checked={inMainThread} onChange={setInMainThread} />
          </div>
        </div>
        <div className="mt-4 flex gap-3">
          <Button onClick={() => saveMutation.mutate()} disabled={!command || saveMutation.isPending}>
            {editingId ? 'Update' : 'Add'}
          </Button>
          {editingId && (
            <Button variant="secondary" onClick={() => setEditingId(null)}>
              Cancel
            </Button>
          )}
        </div>
      </Card>

      <Card padding={false} className="overflow-hidden">
        <div className="border-b border-[var(--color-border)] px-5 py-4 flex gap-3">
          <Input label="Search" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
          <Button
            className="self-end"
            onClick={() => {
              setAppliedKeyword(keyword);
              setPage(1);
            }}
          >
            Search
          </Button>
        </div>
        {query.isLoading ? (
          <LoadingState label="Loading commands…" />
        ) : query.error ? (
          <div className="p-4">
            <ErrorBanner message={(query.error as Error).message} />
          </div>
        ) : (
          <>
            <DataTable<ModCommandListEntry>
              keyFn={(row) => String(row.id)}
              data={query.data?.items ?? []}
              columns={[
                { key: 'cmd', header: 'Command', render: (row) => <span className="font-mono text-xs">{row.command}</span> },
                { key: 'main', header: 'Main thread', render: (row) => (row.inMainThread ? 'Yes' : 'No') },
                { key: 'desc', header: 'Description', render: (row) => row.description ?? '—' },
                {
                  key: 'actions',
                  header: '',
                  render: (row) => (
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => startEdit(row)}>
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="!text-[var(--color-danger)]"
                        onClick={() => deleteMutation.mutate(row.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  ),
                },
              ]}
            />
            <PaginationBar
              page={page}
              pageSize={pageSize}
              total={query.data?.total ?? 0}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
            />
          </>
        )}
      </Card>
    </div>
  );
}

export function ListsPage() {
  const [serverId, setServerId] = useState('');
  const [tab, setTab] = useState<TabId>('items');
  const { data: servers } = useQuery({ queryKey: ['servers'], queryFn: api.getServers });

  return (
    <PageShell
      title="List management"
      description="Shared item and command catalogs used by shop, gifts, and scheduled tasks."
      toolbar={
        <div className="flex flex-wrap items-end gap-4">
          <ServerSelector
            servers={servers ?? []}
            value={serverId}
            onChange={setServerId}
            emptyLabel="Select a game server…"
          />
          {serverId && (
            <Tabs
              tabs={[
                { id: 'items', label: 'Item list' },
                { id: 'commands', label: 'Command list' },
              ]}
              active={tab}
              onChange={(next) => setTab(next as TabId)}
            />
          )}
        </div>
      }
    >
      {!serverId ? (
        <Card>
          <p className="py-16 text-center text-[var(--color-muted)]">
            Select a game server to manage item and command lists.
          </p>
        </Card>
      ) : tab === 'items' ? (
        <ItemListTab serverId={serverId} />
      ) : (
        <CommandListTab serverId={serverId} />
      )}
    </PageShell>
  );
}
