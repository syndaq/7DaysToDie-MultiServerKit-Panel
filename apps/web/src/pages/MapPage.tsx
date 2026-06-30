import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ServerSelector } from '../components/ServerSelector';
import { Button } from '../components/ui/Button';
import { Card, CardHeader } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { ErrorBanner, LoadingState } from '../components/ui/PageHeader';
import { PageShell } from '../components/ui/PageShell';
import { api } from '../lib/api';
import { modTileUrl } from '../lib/mod-records';

export function MapPage() {
  const [serverId, setServerId] = useState('');
  const [zoom, setZoom] = useState(0);
  const [tileX, setTileX] = useState(0);
  const [tileY, setTileY] = useState(0);
  const [renderOutput, setRenderOutput] = useState<string[]>([]);

  const { data: servers } = useQuery({ queryKey: ['servers'], queryFn: api.getServers });

  const infoQuery = useQuery({
    queryKey: ['map-info', serverId],
    queryFn: () => api.getMapInfo(serverId),
    enabled: !!serverId,
  });

  const renderFullMutation = useMutation({
    mutationFn: () => api.renderFullMap(serverId),
    onSuccess: (lines) => setRenderOutput(lines),
  });

  const renderExploredMutation = useMutation({
    mutationFn: () => api.renderExploredArea(serverId),
    onSuccess: () => setRenderOutput(['Explored area render started on server.']),
  });

  const tileSrc = serverId ? `${modTileUrl(serverId, zoom, tileX, tileY)}?t=${Date.now()}` : '';

  return (
    <PageShell
      title="GPS map"
      description="View map tiles, trigger map renders, and inspect map metadata for a server."
      toolbar={
        <ServerSelector
          servers={servers ?? []}
          value={serverId}
          onChange={setServerId}
          emptyLabel="Select a game server…"
        />
      }
    >
      {!serverId ? (
        <Card>
          <p className="py-16 text-center text-[var(--color-muted)]">
            Select a game server to view the world map.
          </p>
        </Card>
      ) : (
        <div className="space-y-5">
          <div className="grid gap-5 lg:grid-cols-2">
            <Card>
              <CardHeader title="Map info" description="Tile size and zoom levels from the mod." />
              {infoQuery.isLoading ? (
                <LoadingState label="Loading map info…" />
              ) : infoQuery.error ? (
                <ErrorBanner message={(infoQuery.error as Error).message} />
              ) : infoQuery.data ? (
                <dl className="grid gap-3 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-[var(--color-muted)]">Block size</dt>
                    <dd className="font-medium">{infoQuery.data.blockSize}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-[var(--color-muted)]">Max zoom</dt>
                    <dd className="font-medium">{infoQuery.data.maxZoom}</dd>
                  </div>
                </dl>
              ) : null}
            </Card>

            <Card>
              <CardHeader title="Render actions" description="Trigger server-side map rendering." />
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() => renderFullMutation.mutate()}
                  disabled={renderFullMutation.isPending}
                >
                  {renderFullMutation.isPending ? 'Rendering…' : 'Render full map'}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => renderExploredMutation.mutate()}
                  disabled={renderExploredMutation.isPending}
                >
                  {renderExploredMutation.isPending ? 'Starting…' : 'Render explored area'}
                </Button>
              </div>
              {(renderFullMutation.error || renderExploredMutation.error) && (
                <div className="mt-4">
                  <ErrorBanner
                    message={((renderFullMutation.error ?? renderExploredMutation.error) as Error).message}
                  />
                </div>
              )}
              {renderOutput.length > 0 && (
                <pre className="mt-4 max-h-40 overflow-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 font-mono text-xs text-[var(--color-muted)]">
                  {renderOutput.join('\n')}
                </pre>
              )}
            </Card>
          </div>

          <Card>
            <CardHeader title="Tile viewer" description="Preview a single map tile by zoom and coordinates." />
            <div className="grid gap-3 sm:grid-cols-3">
              <Input
                label="Zoom"
                type="number"
                value={String(zoom)}
                onChange={(e) => setZoom(Number(e.target.value))}
              />
              <Input
                label="Tile X"
                type="number"
                value={String(tileX)}
                onChange={(e) => setTileX(Number(e.target.value))}
              />
              <Input
                label="Tile Y"
                type="number"
                value={String(tileY)}
                onChange={(e) => setTileY(Number(e.target.value))}
              />
            </div>
            <div className="mt-4 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-background)]">
              <img
                src={tileSrc}
                alt={`Map tile z${zoom} x${tileX} y${tileY}`}
                className="mx-auto max-h-[480px] object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
            <p className="mt-2 text-xs text-[var(--color-muted)]">
              If the tile is missing, run a map render on the server first.
            </p>
          </Card>
        </div>
      )}
    </PageShell>
  );
}
