import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

const defaults: IconProps = {
  width: 20,
  height: 20,
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

export function IconDashboard(props: IconProps) {
  return (
    <svg {...defaults} {...props} viewBox="0 0 24 24">
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  );
}

export function IconServer(props: IconProps) {
  return (
    <svg {...defaults} {...props} viewBox="0 0 24 24">
      <rect x="2" y="3" width="20" height="6" rx="2" />
      <rect x="2" y="15" width="20" height="6" rx="2" />
      <circle cx="7" cy="6" r="1" fill="currentColor" stroke="none" />
      <circle cx="7" cy="18" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconUsers(props: IconProps) {
  return (
    <svg {...defaults} {...props} viewBox="0 0 24 24">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

export function IconCoins(props: IconProps) {
  return (
    <svg {...defaults} {...props} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v8M9 10h4.5a2 2 0 1 1 0 4H9" />
    </svg>
  );
}

export function IconShop(props: IconProps) {
  return (
    <svg {...defaults} {...props} viewBox="0 0 24 24">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

export function IconGift(props: IconProps) {
  return (
    <svg {...defaults} {...props} viewBox="0 0 24 24">
      <rect x="3" y="8" width="18" height="4" rx="1" />
      <path d="M12 8v13M12 8c-2-2.5-4-3-6-1s0 4 6 4 6-1.5 6-4-4-1.5-6 1Z" />
      <path d="M12 8V5.5C12 4 10.5 3 9 3S6 4 6 5.5" />
      <path d="M12 8V5.5C12 4 13.5 3 15 3s3 1.5 3 2.5" />
    </svg>
  );
}

export function IconLevel(props: IconProps) {
  return (
    <svg {...defaults} {...props} viewBox="0 0 24 24">
      <path d="M4 20V10M10 20V4M16 20v-8M22 20H2" />
    </svg>
  );
}

export function IconMapZone(props: IconProps) {
  return (
    <svg {...defaults} {...props} viewBox="0 0 24 24">
      <path d="M12 2 4 7v10l8 5 8-5V7l-8-5Z" />
      <path d="M12 12v9M4 7l8 5 8-5" />
    </svg>
  );
}

export function IconKey(props: IconProps) {
  return (
    <svg {...defaults} {...props} viewBox="0 0 24 24">
      <circle cx="8" cy="15" r="4" />
      <path d="m10.5 12.5 9-9M18 5l2 2" />
    </svg>
  );
}

export function IconSun(props: IconProps) {
  return (
    <svg {...defaults} {...props} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

export function IconMoon(props: IconProps) {
  return (
    <svg {...defaults} {...props} viewBox="0 0 24 24">
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}

export function IconRefresh(props: IconProps) {
  return (
    <svg {...defaults} {...props} viewBox="0 0 24 24">
      <path d="M21 12a9 9 0 1 1-3-6.7" />
      <path d="M21 3v6h-6" />
    </svg>
  );
}

export function IconPlus(props: IconProps) {
  return (
    <svg {...defaults} {...props} viewBox="0 0 24 24">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function IconChevronLeft(props: IconProps) {
  return (
    <svg {...defaults} {...props} viewBox="0 0 24 24">
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

export function IconChevronRight(props: IconProps) {
  return (
    <svg {...defaults} {...props} viewBox="0 0 24 24">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

export function IconChevronUp(props: IconProps) {
  return (
    <svg {...defaults} {...props} viewBox="0 0 24 24">
      <path d="m18 15-6-6-6 6" />
    </svg>
  );
}

export function IconChevronDown(props: IconProps) {
  return (
    <svg {...defaults} {...props} viewBox="0 0 24 24">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function IconArrowLeft(props: IconProps) {
  return (
    <svg {...defaults} {...props} viewBox="0 0 24 24">
      <path d="m12 19-7-7 7-7M19 12H5" />
    </svg>
  );
}

export function IconTerminal(props: IconProps) {
  return (
    <svg {...defaults} {...props} viewBox="0 0 24 24">
      <polyline points="4 17 10 11 4 5" />
      <line x1="12" y1="19" x2="20" y2="19" />
    </svg>
  );
}

export function IconZap(props: IconProps) {
  return (
    <svg {...defaults} {...props} viewBox="0 0 24 24">
      <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z" />
    </svg>
  );
}

export function IconList(props: IconProps) {
  return (
    <svg {...defaults} {...props} viewBox="0 0 24 24">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}

export function IconMenu(props: IconProps) {
  return (
    <svg {...defaults} {...props} viewBox="0 0 24 24">
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="18" x2="20" y2="18" />
    </svg>
  );
}

export function IconX(props: IconProps) {
  return (
    <svg {...defaults} {...props} viewBox="0 0 24 24">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

export function IconMap(props: IconProps) {
  return (
    <svg {...defaults} {...props} viewBox="0 0 24 24">
      <path d="M2 6l6-2 6 2 8-3v15l-8 3-6-2-6 2V6Z" />
      <path d="M8 4v15M16 6v15" />
    </svg>
  );
}

export function IconChat(props: IconProps) {
  return (
    <svg {...defaults} {...props} viewBox="0 0 24 24">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z" />
    </svg>
  );
}

export function IconShield(props: IconProps) {
  return (
    <svg {...defaults} {...props} viewBox="0 0 24 24">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
    </svg>
  );
}

export function IconConsole(props: IconProps) {
  return <IconTerminal {...props} />;
}

export function IconGlobe(props: IconProps) {
  return (
    <svg {...defaults} {...props} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z" />
    </svg>
  );
}

export function IconBackup(props: IconProps) {
  return (
    <svg {...defaults} {...props} viewBox="0 0 24 24">
      <path d="M12 3v12" />
      <path d="m8 11 4 4 4-4" />
      <path d="M4 14v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" />
    </svg>
  );
}

export function IconNotice(props: IconProps) {
  return (
    <svg {...defaults} {...props} viewBox="0 0 24 24">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

export function IconTeleport(props: IconProps) {
  return (
    <svg {...defaults} {...props} viewBox="0 0 24 24">
      <path d="m5 12 7-7 7 7" />
      <path d="M12 19V5" />
    </svg>
  );
}

export function IconPrefab(props: IconProps) {
  return (
    <svg {...defaults} {...props} viewBox="0 0 24 24">
      <path d="M3 21h18" />
      <path d="M5 21V7l7-4 7 4v14" />
      <path d="M9 21v-6h6v6" />
    </svg>
  );
}

export function IconClock(props: IconProps) {
  return (
    <svg {...defaults} {...props} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}

export function IconGrid(props: IconProps) {
  return (
    <svg {...defaults} {...props} viewBox="0 0 24 24">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

export function IconMute(props: IconProps) {
  return (
    <svg {...defaults} {...props} viewBox="0 0 24 24">
      <path d="M11 5 6 9H3v6h3l5 4V5Z" />
      <path d="m22 9-6 6M16 9l6 6" />
    </svg>
  );
}

export function IconBook(props: IconProps) {
  return (
    <svg {...defaults} {...props} viewBox="0 0 24 24">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
    </svg>
  );
}

export function IconSettings(props: IconProps) {
  return (
    <svg {...defaults} {...props} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  );
}

export function IconUser(props: IconProps) {
  return (
    <svg {...defaults} {...props} viewBox="0 0 24 24">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  );
}
