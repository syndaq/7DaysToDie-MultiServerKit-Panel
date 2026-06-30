import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ServerSelector } from '../components/ServerSelector';
import { BossKillRewardForm } from '../components/boss-kill-reward/BossKillRewardForm';
import { Card } from '../components/ui/Card';
import { PageShell } from '../components/ui/PageShell';
import { api } from '../lib/api';

export function BossKillRewardPage() {
  const [serverId, setServerId] = useState('');
  const { data: servers } = useQuery({ queryKey: ['servers'], queryFn: api.getServers });

  return (
    <PageShell
      title="Boss kill reward"
      description="Award points when players kill boss zombies or animals on a selected server."
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
            Select a game server to configure boss kill rewards for that instance.
          </p>
        </Card>
      ) : (
        <BossKillRewardForm serverId={serverId} />
      )}
    </PageShell>
  );
}
