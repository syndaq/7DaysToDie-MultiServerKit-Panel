import { useState } from 'react';
import { StoreSettingsTab } from '../components/shop/StoreSettingsTab';
import { ProductManagementTab } from '../components/shop/ProductManagementTab';
import { LotterySettingsTab } from '../components/shop/LotterySettingsTab';
import { LotteryManagementTab } from '../components/shop/LotteryManagementTab';
import { PageShell, Tabs } from '../components/ui/PageShell';

type TabId = 'store-settings' | 'products' | 'lottery-settings' | 'lottery-management';

export function ShopPage() {
  const [tab, setTab] = useState<TabId>('store-settings');

  return (
    <PageShell
      title="Game store"
      description="One cluster-wide shop catalog and settings. Configure the store once and sync products to every connected server."
      toolbar={
        <Tabs
          tabs={[
            { id: 'store-settings', label: 'Store settings' },
            { id: 'products', label: 'Product management' },
            { id: 'lottery-settings', label: 'Lottery settings' },
            { id: 'lottery-management', label: 'Lottery management' },
          ]}
          active={tab}
          onChange={(next) => setTab(next as TabId)}
        />
      }
    >
      {tab === 'store-settings' ? (
        <StoreSettingsTab />
      ) : tab === 'products' ? (
        <ProductManagementTab />
      ) : tab === 'lottery-settings' ? (
        <LotterySettingsTab />
      ) : (
        <LotteryManagementTab />
      )}
    </PageShell>
  );
}
