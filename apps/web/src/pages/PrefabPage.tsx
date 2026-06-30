import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ModAvailablePrefab, ModPrefabUndoHistory } from '@msk-panel/shared';
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

type TabId = 'browse' | 'place' | 'undo';

export function PrefabPage() {
  const queryClient = useQueryClient();
  const [serverId, setServerId] = useState('');
  const [tab, setTab] = useState<TabId>('browse');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [keyword, setKeyword] = useState('');
  const [appliedKeyword, setAppliedKeyword] = useState('');
  const [selectedPrefab, setSelectedPrefab] = useState<ModAvailablePrefab | null>(null);
  const [position, setPosition] = useState('0,0,0');
  const [rotation, setRotation] = useState('0');
  const [noSleepers, setNoSleepers] = useState(false);
  const [addToRWG, setAddToRWG] = useState(false);
  const [placeOutput, setPlaceOutput] = useState<string[]>([]);

  const { data: servers } = useQuery({ queryKey: ['servers'], queryFn: api.getServers });

  const prefabsQuery = useQuery({
    queryKey: ['prefabs', serverId, page, pageSize, appliedKeyword],
    queryFn: () =>
      api.getAvailablePrefabs(serverId, {
        pageNumber: page,
        pageSize,
        keyword: appliedKeyword || undefined,
      }),
    enabled: !!serverId && tab === 'browse',
  });

  const undoQuery = useQuery({
    queryKey: ['prefab-undo', serverId],
    queryFn: () => api.getPrefabUndoHistory(serverId),
    enabled: !!serverId && tab === 'undo',
  });

  const placeMutation = useMutation({
    mutationFn: () =>
      api.placePrefab(serverId, {
        prefabFileName: selectedPrefab!.fullPath,
        position,
        rotation: Number(rotation),
        noSleepers,
        addToRWG,
      }),
    onSuccess: (lines) => {
      setPlaceOutput(lines);
      queryClient.invalidateQueries({ queryKey: ['prefab-undo', serverId] });
    },
  });

  const undoMutation = useMutation({
    mutationFn: (id: number) => api.undoPrefab(serverId, id),
    onSuccess: (lines) => {
      setPlaceOutput(lines);
      queryClient.invalidateQueries({ queryKey: ['prefab-undo', serverId] });
    },
  });

  return (
    <PageShell
      title="Prefab"
      description="Browse available prefabs, place them on the map, and undo recent placements."
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
                { id: 'browse', label: 'Browse' },
                { id: 'place', label: 'Place' },
                { id: 'undo', label: 'Undo history' },
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
            Select a game server to manage prefabs.
          </p>
        </Card>
      ) : tab === 'browse' ? (
        <Card padding={false} className="overflow-hidden">
          <div className="border-b border-[var(--color-border)] px-5 py-4 flex flex-wrap gap-3">
            <Input label="Search prefabs" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
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
          {prefabsQuery.isLoading ? (
            <LoadingState label="Loading prefabs…" />
          ) : prefabsQuery.error ? (
            <div className="p-4">
              <ErrorBanner message={(prefabsQuery.error as Error).message} />
            </div>
          ) : (
            <>
              <DataTable<ModAvailablePrefab>
                keyFn={(row) => row.fullPath}
                data={prefabsQuery.data?.items ?? []}
                onRowClick={(row) => {
                  setSelectedPrefab(row);
                  setTab('place');
                }}
                columns={[
                  { key: 'name', header: 'Name', render: (row) => row.name },
                  { key: 'loc', header: 'Localization', render: (row) => row.localizationName },
                  {
                    key: 'path',
                    header: 'Path',
                    render: (row) => <span className="font-mono text-xs">{row.fullPath}</span>,
                  },
                ]}
              />
              <PaginationBar
                page={page}
                pageSize={pageSize}
                total={prefabsQuery.data?.total ?? 0}
                onPageChange={setPage}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setPage(1);
                }}
              />
            </>
          )}
        </Card>
      ) : tab === 'place' ? (
        <Card>
          <CardHeader title="Place prefab" description="Click a prefab in Browse or enter details manually." />
          <div className="grid gap-3 md:grid-cols-2">
            <Input
              className="md:col-span-2"
              label="Prefab file path"
              value={selectedPrefab?.fullPath ?? ''}
              onChange={(e) =>
                setSelectedPrefab({
                  name: e.target.value.split('/').pop() ?? e.target.value,
                  localizationName: e.target.value,
                  fullPath: e.target.value,
                })
              }
            />
            <Input label="Position (x,y,z)" value={position} onChange={(e) => setPosition(e.target.value)} />
            <Input label="Rotation" type="number" value={rotation} onChange={(e) => setRotation(e.target.value)} />
            <div className="flex items-center justify-between rounded-xl border border-[var(--color-border)] px-4 py-3">
              <span className="text-sm font-medium">No sleepers</span>
              <Toggle checked={noSleepers} onChange={setNoSleepers} />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-[var(--color-border)] px-4 py-3">
              <span className="text-sm font-medium">Add to RWG</span>
              <Toggle checked={addToRWG} onChange={setAddToRWG} />
            </div>
          </div>
          <div className="mt-4">
            <Button
              onClick={() => placeMutation.mutate()}
              disabled={!selectedPrefab?.fullPath || placeMutation.isPending}
            >
              {placeMutation.isPending ? 'Placing…' : 'Place prefab'}
            </Button>
          </div>
          {placeMutation.error && (
            <div className="mt-4">
              <ErrorBanner message={(placeMutation.error as Error).message} />
            </div>
          )}
          {placeOutput.length > 0 && (
            <pre className="mt-4 max-h-48 overflow-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 font-mono text-xs text-[var(--color-muted)]">
              {placeOutput.join('\n')}
            </pre>
          )}
        </Card>
      ) : undoQuery.isLoading ? (
        <LoadingState label="Loading undo history…" />
      ) : undoQuery.error ? (
        <ErrorBanner message={(undoQuery.error as Error).message} />
      ) : (
        <Card padding={false} className="overflow-hidden">
          <DataTable<ModPrefabUndoHistory>
            keyFn={(row) => String(row.id)}
            data={undoQuery.data ?? []}
            columns={[
              { key: 'name', header: 'Prefab', render: (row) => row.prefabName },
              { key: 'pos', header: 'Position', render: (row) => row.position },
              {
                key: 'time',
                header: 'Placed',
                render: (row) => new Date(row.createdAt).toLocaleString(),
              },
              {
                key: 'actions',
                header: '',
                render: (row) => (
                  <Button variant="ghost" size="sm" onClick={() => undoMutation.mutate(row.id)}>
                    Undo
                  </Button>
                ),
              },
            ]}
          />
        </Card>
      )}
    </PageShell>
  );
}
