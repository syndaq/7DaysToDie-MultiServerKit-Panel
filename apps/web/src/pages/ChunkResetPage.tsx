import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ServerSelector } from '../components/ServerSelector';
import { ChunkResetForm } from '../components/chunk-reset/ChunkResetForm';
import { Card } from '../components/ui/Card';
import { PageShell } from '../components/ui/PageShell';
import { api } from '../lib/api';

export function ChunkResetPage() {
  const [serverId, setServerId] = useState('');
  const { data: servers } = useQuery({ queryKey: ['servers'], queryFn: api.getServers });

  return (
    <PageShell
      title="Chunk reset"
      description="Reset or regenerate map chunks for a rectangular region on a selected game server."
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
            Select a game server to reset chunks for that instance.
          </p>
        </Card>
      ) : (
        <ChunkResetForm serverId={serverId} />
      )}
    </PageShell>
  );
}
