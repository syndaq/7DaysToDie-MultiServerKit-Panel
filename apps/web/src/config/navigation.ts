import type { ComponentType, SVGProps } from 'react';
import {
  IconBackup,
  IconChat,
  IconClock,
  IconCoins,
  IconConsole,
  IconDashboard,
  IconGift,
  IconGlobe,
  IconGrid,
  IconKey,
  IconLevel,
  IconList,
  IconMap,
  IconMapZone,
  IconMute,
  IconNotice,
  IconPrefab,
  IconServer,
  IconShield,
  IconShop,
  IconTeleport,
  IconUsers,
  IconZap,
} from '../components/ui/icons';

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

export interface NavItem {
  to: string;
  label: string;
  icon: IconComponent;
  end?: boolean;
}

export const mainNav: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: IconDashboard, end: true },
  { to: '/servers', label: 'Servers', icon: IconServer },
  { to: '/map', label: 'GPS map', icon: IconMap },
  { to: '/players', label: 'Player list', icon: IconUsers },
  { to: '/chat', label: 'Game chat', icon: IconChat },
  { to: '/permissions', label: 'Permissions', icon: IconShield },
  { to: '/console', label: 'Console', icon: IconConsole },
  { to: '/global-settings', label: 'Global settings', icon: IconGlobe },
  { to: '/backups', label: 'Auto backup', icon: IconBackup },
  { to: '/game-notice', label: 'Game notice', icon: IconNotice },
  { to: '/points', label: 'Points system', icon: IconCoins },
  { to: '/points/log', label: 'Point log', icon: IconList },
  { to: '/boss-kill-reward', label: 'Boss kill reward', icon: IconZap },
  { to: '/shop', label: 'Game store', icon: IconShop },
  { to: '/vip', label: 'VIP gift', icon: IconGift },
  { to: '/level-gifts', label: 'Level gift', icon: IconLevel },
  { to: '/cd-keys', label: 'CD key redeem', icon: IconKey },
  { to: '/teleport', label: 'Teleport', icon: IconTeleport },
  { to: '/prefab', label: 'Prefab', icon: IconPrefab },
  { to: '/task-schedule', label: 'Task schedule', icon: IconClock },
  { to: '/lists', label: 'List management', icon: IconGrid },
  { to: '/chunk-reset', label: 'Chunk reset', icon: IconServer },
  { to: '/trader-protection', label: 'Trader protection', icon: IconShield },
  { to: '/pvp-areas', label: 'PVP/PVE areas', icon: IconMapZone },
  { to: '/mute-commands', label: 'Mute commands', icon: IconMute },
];
