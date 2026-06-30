import { useState } from 'react';
import { SignInSettingsTab } from '../components/points/SignInSettingsTab';
import { PointsManagementTab } from '../components/points/PointsManagementTab';
import { PageShell, Tabs } from '../components/ui/PageShell';

type TabId = 'settings' | 'management';

export function PointsPage() {
  const [tab, setTab] = useState<TabId>('settings');

  return (
    <PageShell
      title="Points system"
      description="One cluster-wide points system. Configure sign-in rewards once and manage shared player balances across every server."
      toolbar={
        <Tabs
          tabs={[
            { id: 'settings', label: 'Sign-in settings' },
            { id: 'management', label: 'Points management' },
          ]}
          active={tab}
          onChange={(next) => setTab(next as TabId)}
        />
      }
    >
      {tab === 'settings' ? <SignInSettingsTab /> : <PointsManagementTab />}
    </PageShell>
  );
}
