import { useState } from 'react';
import { CdKeySettingsTab } from '../components/cd-keys/CdKeySettingsTab';
import { CdKeyManagementTab } from '../components/cd-keys/CdKeyManagementTab';
import { CdKeyRecordTab } from '../components/cd-keys/CdKeyRecordTab';
import { PageShell, Tabs } from '../components/ui/PageShell';

type TabId = 'settings' | 'management' | 'records';

export function CdKeysPage() {
  const [tab, setTab] = useState<TabId>('settings');

  return (
    <PageShell
      title="CD key redeem"
      description="One cluster-wide CD key system. Configure redemption messages, manage keys, and review redemption history across every server."
      toolbar={
        <Tabs
          tabs={[
            { id: 'settings', label: 'CD key redeem settings' },
            { id: 'management', label: 'CD key redeem management' },
            { id: 'records', label: 'CD key redeem record' },
          ]}
          active={tab}
          onChange={(next) => setTab(next as TabId)}
        />
      }
    >
      {tab === 'settings' ? (
        <CdKeySettingsTab />
      ) : tab === 'management' ? (
        <CdKeyManagementTab />
      ) : (
        <CdKeyRecordTab />
      )}
    </PageShell>
  );
}
