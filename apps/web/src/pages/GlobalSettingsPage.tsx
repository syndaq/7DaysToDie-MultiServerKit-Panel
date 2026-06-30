import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ServerSelector } from '../components/ServerSelector';
import { GlobalSettingsForm } from '../components/global-settings/GlobalSettingsForm';
import { Card } from '../components/ui/Card';
import { PageShell } from '../components/ui/PageShell';
import { api } from '../lib/api';

export function GlobalSettingsPage() {
  const [serverId, setServerId] = useState('');
  const { data: servers } = useQuery({ queryKey: ['servers'], queryFn: api.getServers });

  return (
    <PageShell
      title="Global settings"
      description="Configure per-server chat formatting, protection toggles, event triggers, and maintenance options on the game mod."
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
            Select a game server to edit global mod settings for that instance.
          </p>
        </Card>
      ) : (
        <GlobalSettingsForm serverId={serverId} />
      )}
    </PageShell>
  );
}
