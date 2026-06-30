import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ServerSelector } from '../components/ServerSelector';
import { GameNoticeForm } from '../components/game-notice/GameNoticeForm';
import { Card } from '../components/ui/Card';
import { PageShell } from '../components/ui/PageShell';
import { api } from '../lib/api';

export function GameNoticePage() {
  const [serverId, setServerId] = useState('');
  const { data: servers } = useQuery({ queryKey: ['servers'], queryFn: api.getServers });

  return (
    <PageShell
      title="Game notice"
      description="Welcome messages, rotating broadcasts, and blood moon announcements for a selected game server."
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
            Select a game server to configure in-game notices for that instance.
          </p>
        </Card>
      ) : (
        <GameNoticeForm serverId={serverId} />
      )}
    </PageShell>
  );
}
