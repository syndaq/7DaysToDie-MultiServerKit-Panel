import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ServerSelector } from '../components/ServerSelector';
import { MuteCommandsForm } from '../components/mute-commands/MuteCommandsForm';
import { Card } from '../components/ui/Card';
import { PageShell } from '../components/ui/PageShell';
import { api } from '../lib/api';

export function MuteCommandsPage() {
  const [serverId, setServerId] = useState('');
  const { data: servers } = useQuery({ queryKey: ['servers'], queryFn: api.getServers });

  return (
    <PageShell
      title="Mute commands"
      description="Block specific in-game chat commands on a selected server and show a custom message to players."
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
            Select a game server to configure muted commands for that instance.
          </p>
        </Card>
      ) : (
        <MuteCommandsForm serverId={serverId} />
      )}
    </PageShell>
  );
}
