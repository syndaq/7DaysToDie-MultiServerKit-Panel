import { useState } from 'react';
import { LevelGiftSettingsTab } from '../components/level-gifts/LevelGiftSettingsTab';
import { LevelGiftManagementTab } from '../components/level-gifts/LevelGiftManagementTab';
import { PageShell, Tabs } from '../components/ui/PageShell';

type TabId = 'settings' | 'management';

export function LevelGiftsPage() {
  const [tab, setTab] = useState<TabId>('settings');

  return (
    <PageShell
      title="Level gifts"
      description="One cluster-wide level gift system. Configure claim commands once and manage level rewards across every server."
      toolbar={
        <Tabs
          tabs={[
            { id: 'settings', label: 'Gift settings' },
            { id: 'management', label: 'Gift management' },
          ]}
          active={tab}
          onChange={(next) => setTab(next as TabId)}
        />
      }
    >
      {tab === 'settings' ? <LevelGiftSettingsTab /> : <LevelGiftManagementTab />}
    </PageShell>
  );
}
