import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ModCityLocation, ModHomeLocation } from '@msk-panel/shared';
import { Button } from '../ui/Button';
import { Card, CardHeader } from '../ui/Card';
import { DataTable } from '../ui/DataTable';
import { Input } from '../ui/Input';
import { PaginationBar } from '../ui/Pagination';
import { ErrorBanner, LoadingState } from '../ui/PageHeader';
import { api } from '../../lib/api';

export function HomeLocationsTab({ serverId }: { serverId: string }) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [keyword, setKeyword] = useState('');
  const [appliedKeyword, setAppliedKeyword] = useState('');

  const query = useQuery({
    queryKey: ['home-locations', serverId, page, pageSize, appliedKeyword],
    queryFn: () =>
      api.getHomeLocations(serverId, {
        pageNumber: page,
        pageSize,
        keyword: appliedKeyword || undefined,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.deleteHomeLocation(serverId, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['home-locations', serverId] }),
  });

  if (query.isLoading) return <LoadingState label="Loading home locations…" />;
  if (query.error) return <ErrorBanner message={(query.error as Error).message} />;

  return (
    <Card padding={false} className="overflow-hidden">
      <div className="border-b border-[var(--color-border)] px-5 py-4">
        <CardHeader title="Home locations" description="Player-set home points stored on the server." />
        <div className="mt-4 flex gap-3">
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
      </div>
      <DataTable<ModHomeLocation>
        keyFn={(row) => String(row.id)}
        data={query.data?.items ?? []}
        columns={[
          { key: 'player', header: 'Player', render: (row) => row.playerName },
          { key: 'home', header: 'Home', render: (row) => row.homeName },
          { key: 'position', header: 'Position', render: (row) => <span className="font-mono text-xs">{row.position}</span> },
          {
            key: 'actions',
            header: '',
            render: (row) => (
              <Button
                variant="ghost"
                size="sm"
                className="!text-[var(--color-danger)]"
                onClick={() => deleteMutation.mutate(row.id)}
              >
                Delete
              </Button>
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
    </Card>
  );
}

export function CityLocationsTab({ serverId }: { serverId: string }) {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [cityName, setCityName] = useState('');
  const [pointsRequired, setPointsRequired] = useState('0');
  const [position, setPosition] = useState('');
  const [viewDirection, setViewDirection] = useState('');

  const query = useQuery({
    queryKey: ['city-locations', serverId],
    queryFn: () => api.getCityLocations(serverId),
  });

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        cityName,
        pointsRequired: Number(pointsRequired),
        position,
        viewDirection: viewDirection || undefined,
      };
      return editingId
        ? api.updateCityLocation(serverId, editingId, payload)
        : api.createCityLocation(serverId, payload);
    },
    onSuccess: () => {
      setEditingId(null);
      setCityName('');
      setPointsRequired('0');
      setPosition('');
      setViewDirection('');
      queryClient.invalidateQueries({ queryKey: ['city-locations', serverId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.deleteCityLocation(serverId, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['city-locations', serverId] }),
  });

  const startEdit = (row: ModCityLocation) => {
    setEditingId(row.id);
    setCityName(row.cityName);
    setPointsRequired(String(row.pointsRequired));
    setPosition(row.position);
    setViewDirection(row.viewDirection ?? '');
  };

  if (query.isLoading) return <LoadingState label="Loading city locations…" />;
  if (query.error) return <ErrorBanner message={(query.error as Error).message} />;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader
          title={editingId ? 'Edit city' : 'Add city'}
          description="Position format: x,y,z"
        />
        <div className="grid gap-3 md:grid-cols-2">
          <Input label="City name" value={cityName} onChange={(e) => setCityName(e.target.value)} />
          <Input
            label="Points required"
            type="number"
            value={pointsRequired}
            onChange={(e) => setPointsRequired(e.target.value)}
          />
          <Input label="Position" value={position} onChange={(e) => setPosition(e.target.value)} />
          <Input
            label="View direction"
            value={viewDirection}
            onChange={(e) => setViewDirection(e.target.value)}
          />
        </div>
        <div className="mt-4 flex gap-3">
          <Button onClick={() => saveMutation.mutate()} disabled={!cityName || !position || saveMutation.isPending}>
            {saveMutation.isPending ? 'Saving…' : editingId ? 'Update city' : 'Add city'}
          </Button>
          {editingId && (
            <Button variant="secondary" onClick={() => setEditingId(null)}>
              Cancel edit
            </Button>
          )}
        </div>
      </Card>

      <Card padding={false} className="overflow-hidden">
        <DataTable<ModCityLocation>
          keyFn={(row) => String(row.id)}
          data={query.data ?? []}
          columns={[
            { key: 'name', header: 'City', render: (row) => row.cityName },
            { key: 'points', header: 'Points', render: (row) => row.pointsRequired },
            { key: 'position', header: 'Position', render: (row) => <span className="font-mono text-xs">{row.position}</span> },
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
      </Card>
    </div>
  );
}
