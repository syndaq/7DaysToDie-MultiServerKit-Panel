import { useState } from 'react';
import { GiftSettingsTab } from '../components/vip/GiftSettingsTab';
import { GiftManagementTab } from '../components/vip/GiftManagementTab';
import { PageShell, Tabs } from '../components/ui/PageShell';

type TabId = 'settings' | 'management';

export function VipPage() {
  const [tab, setTab] = useState<TabId>('settings');

  return (
    <PageShell
      title="VIP gifts"
      description="One cluster-wide VIP gift system. Configure claim commands once and manage eligible players across every server."
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
      {tab === 'settings' ? <GiftSettingsTab /> : <GiftManagementTab />}
    </PageShell>
  );
}
