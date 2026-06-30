import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ServerSelector } from '../components/ServerSelector';
import { Card } from '../components/ui/Card';
import { PageShell, Tabs } from '../components/ui/PageShell';
import {
  TeleportCitySettingsTab,
  TeleportFriendSettingsTab,
  TeleportHomeSettingsTab,
} from '../components/teleport/TeleportSettingsTabs';
import { CityLocationsTab, HomeLocationsTab } from '../components/teleport/TeleportLocationsTabs';
import { api } from '../lib/api';

type TabId = 'friend' | 'home' | 'city' | 'home-locs' | 'city-locs';

export function TeleportPage() {
  const [serverId, setServerId] = useState('');
  const [tab, setTab] = useState<TabId>('friend');
  const { data: servers } = useQuery({ queryKey: ['servers'], queryFn: api.getServers });

  return (
    <PageShell
      title="Teleport"
      description="Friend, city, and home teleport settings plus location management."
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
                { id: 'friend', label: 'Friend settings' },
                { id: 'home', label: 'Home settings' },
                { id: 'city', label: 'City settings' },
                { id: 'home-locs', label: 'Home locations' },
                { id: 'city-locs', label: 'City locations' },
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
            Select a game server to configure teleport features.
          </p>
        </Card>
      ) : (
        <div className="space-y-5">
          {tab === 'friend' && <TeleportFriendSettingsTab serverId={serverId} />}
          {tab === 'home' && <TeleportHomeSettingsTab serverId={serverId} />}
          {tab === 'city' && <TeleportCitySettingsTab serverId={serverId} />}
          {tab === 'home-locs' && <HomeLocationsTab serverId={serverId} />}
          {tab === 'city-locs' && <CityLocationsTab serverId={serverId} />}
        </div>
      )}
    </PageShell>
  );
}
