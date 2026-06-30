import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BackupFilesTab } from '../components/backups/BackupFilesTab';
import { BackupSettingsTab } from '../components/backups/BackupSettingsTab';
import { ServerSelector } from '../components/ServerSelector';
import { Card } from '../components/ui/Card';
import { PageShell, Tabs } from '../components/ui/PageShell';
import { api } from '../lib/api';

type TabId = 'settings' | 'archives';

export function BackupsPage() {
  const [serverId, setServerId] = useState('');
  const [tab, setTab] = useState<TabId>('settings');
  const { data: servers } = useQuery({ queryKey: ['servers'], queryFn: api.getServers });

  return (
    <PageShell
      title="Auto backup"
      description="Configure scheduled backups and manage archive files for a selected game server."
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
                { id: 'settings', label: 'Backup settings' },
                { id: 'archives', label: 'Archive management' },
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
            Select a game server to configure backups and manage archive files.
          </p>
        </Card>
      ) : tab === 'settings' ? (
        <BackupSettingsTab serverId={serverId} />
      ) : (
        <BackupFilesTab serverId={serverId} />
      )}
    </PageShell>
  );
}
