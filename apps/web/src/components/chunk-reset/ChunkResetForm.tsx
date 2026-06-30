import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import type { ChunkResetResult } from '@msk-panel/shared';
import { Button } from '../ui/Button';
import { Card, CardHeader } from '../ui/Card';
import { Input } from '../ui/Input';
import { ErrorBanner } from '../ui/PageHeader';
import { parseCoordinatePair } from '../../lib/pvp-area-utils';
import { api } from '../../lib/api';

export function ChunkResetForm({ serverId }: { serverId: string }) {
  const [corner1, setCorner1] = useState('');
  const [corner2, setCorner2] = useState('');
  const [result, setResult] = useState<ChunkResetResult | null>(null);

  const resetMutation = useMutation({
    mutationFn: () => {
      const p1 = parseCoordinatePair(corner1);
      const p2 = parseCoordinatePair(corner2);
      if (!p1 || !p2) {
        throw new Error('Enter both corners as x, z coordinate pairs.');
      }
      return api.resetChunkRegion(serverId, { x1: p1.x, z1: p1.z, x2: p2.x, z2: p2.z });
    },
    onSuccess: (data) => setResult(data),
  });

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader
          title="Chunk reset"
          description="Request chunk regeneration for a rectangular region on this server. Only loaded chunks are reset; unloaded chunks are skipped."
        />

        {(resetMutation.error) && (
          <div className="mb-4">
            <ErrorBanner message={(resetMutation.error as Error).message} />
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-2">
          <Input
            label="Corner 1 (x, z)"
            placeholder="e.g. 100, 200"
            value={corner1}
            onChange={(e) => setCorner1(e.target.value)}
            hint="First corner of the region in block coordinates."
          />
          <Input
            label="Corner 2 (x, z)"
            placeholder="e.g. 250, 350"
            value={corner2}
            onChange={(e) => setCorner2(e.target.value)}
            hint="Opposite corner of the region in block coordinates."
          />
        </div>

        <div className="mt-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)]/60 px-4 py-3 text-sm text-[var(--color-muted)]">
          This calls the mod <code className="rounded bg-[var(--color-surface-solid)] px-1.5 py-0.5">POST /api/ChunkReset</code> endpoint.
          Use a small test region first. Player builds in reset chunks will be lost.
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button
            variant="danger"
            onClick={() => {
              if (confirm('Reset all loaded chunks in this region? This cannot be undone.')) {
                resetMutation.mutate();
              }
            }}
            disabled={resetMutation.isPending}
          >
            {resetMutation.isPending ? 'Resetting…' : 'Reset region'}
          </Button>
          <Button variant="secondary" onClick={() => { setCorner1(''); setCorner2(''); setResult(null); }}>
            Clear
          </Button>
        </div>

        {result && (
          <p className="mt-4 text-sm text-[var(--color-success)]">
            {result.message} ({result.resetCount} reset, {result.skippedCount} skipped)
          </p>
        )}
      </Card>
    </div>
  );
}
