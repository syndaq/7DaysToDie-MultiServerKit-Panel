import { Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { LoadingState } from './components/ui/PageHeader';
import { useAuth } from './context/AuthContext';
import { AccountSettingsPage } from './pages/AccountSettingsPage';
import { BackupsPage } from './pages/BackupsPage';
import { BossKillRewardPage } from './pages/BossKillRewardPage';
import { CdKeysPage } from './pages/CdKeysPage';
import { ChatPage } from './pages/ChatPage';
import { ConsolePage } from './pages/ConsolePage';
import { DashboardPage } from './pages/DashboardPage';
import { ChunkResetPage } from './pages/ChunkResetPage';
import { ListsPage } from './pages/ListsPage';
import { MapPage } from './pages/MapPage';
import { MuteCommandsPage } from './pages/MuteCommandsPage';
import { GameNoticePage } from './pages/GameNoticePage';
import { GlobalSettingsPage } from './pages/GlobalSettingsPage';
import { LevelGiftsPage } from './pages/LevelGiftsPage';
import { LoginPage } from './pages/LoginPage';
import { PermissionsPage } from './pages/PermissionsPage';
import { PlayersPage } from './pages/PlayersPage';
import { PointLogPage } from './pages/PointLogPage';
import { PointsPage } from './pages/PointsPage';
import { PrefabPage } from './pages/PrefabPage';
import { PvpAreasPage } from './pages/PvpAreasPage';
import { ServerDetailPage } from './pages/ServerDetailPage';
import { ServersPage } from './pages/ServersPage';
import { SetupPage } from './pages/SetupPage';
import { ShopPage } from './pages/ShopPage';
import { TaskSchedulePage } from './pages/TaskSchedulePage';
import { TeleportPage } from './pages/TeleportPage';
import { TraderProtectionPage } from './pages/TraderProtectionPage';
import { VipPage } from './pages/VipPage';

function AppRoutes() {
  const { loading, setupRequired, authenticated } = useAuth();

  if (loading) {
    return (
      <div className="app-bg flex min-h-screen items-center justify-center">
        <LoadingState label="Loading panel…" />
      </div>
    );
  }

  if (setupRequired) {
    return <SetupPage />;
  }

  if (!authenticated) {
    return <LoginPage />;
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/settings/account" element={<AccountSettingsPage />} />
        <Route path="/servers" element={<ServersPage />} />
        <Route path="/servers/:id" element={<ServerDetailPage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/players" element={<PlayersPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/permissions" element={<PermissionsPage />} />
        <Route path="/console" element={<ConsolePage />} />
        <Route path="/global-settings" element={<GlobalSettingsPage />} />
        <Route path="/backups" element={<BackupsPage />} />
        <Route path="/game-notice" element={<GameNoticePage />} />
        <Route path="/points" element={<PointsPage />} />
        <Route path="/points/log" element={<PointLogPage />} />
        <Route path="/boss-kill-reward" element={<BossKillRewardPage />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/vip" element={<VipPage />} />
        <Route path="/level-gifts" element={<LevelGiftsPage />} />
        <Route path="/cd-keys" element={<CdKeysPage />} />
        <Route path="/teleport" element={<TeleportPage />} />
        <Route path="/prefab" element={<PrefabPage />} />
        <Route path="/task-schedule" element={<TaskSchedulePage />} />
        <Route path="/lists" element={<ListsPage />} />
        <Route path="/chunk-reset" element={<ChunkResetPage />} />
        <Route path="/trader-protection" element={<TraderProtectionPage />} />
        <Route path="/pvp-areas" element={<PvpAreasPage />} />
        <Route path="/mute-commands" element={<MuteCommandsPage />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return <AppRoutes />;
}
