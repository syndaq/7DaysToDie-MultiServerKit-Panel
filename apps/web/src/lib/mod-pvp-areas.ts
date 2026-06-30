import type { ModPvpArea, ModPvpAreaSettings, PvpDropMode, PvpKillMode, PvpAreaSummary } from '@msk-panel/shared';

export const defaultPvpAreaSettings: ModPvpAreaSettings = {
  isEnabled: false,
  killMode: 'strangers',
  dropOnDeath: 'none',
  onlineLandClaimBonus: 4,
  offlineLandClaimBonus: 8,
  defaultNoticeBuff: 'buffPvpVeNoticePve',
};

function readBool(record: Record<string, unknown>, key: string, fallback = false): boolean {
  const pascal = key.charAt(0).toUpperCase() + key.slice(1);
  const value = record[key] ?? record[pascal];
  return value == null ? fallback : Boolean(value);
}

function readString(record: Record<string, unknown>, key: string, fallback = ''): string {
  const pascal = key.charAt(0).toUpperCase() + key.slice(1);
  const value = record[key] ?? record[pascal];
  return value == null ? fallback : String(value);
}

function readNumber(record: Record<string, unknown>, key: string, fallback = 0): number {
  const pascal = key.charAt(0).toUpperCase() + key.slice(1);
  const value = record[key] ?? record[pascal];
  return value == null ? fallback : Number(value);
}

export function normalizePvpAreaSettings(data: unknown): ModPvpAreaSettings {
  const record = (data ?? {}) as Record<string, unknown>;
  return {
    isEnabled: readBool(record, 'isEnabled'),
    killMode: readString(record, 'killMode', defaultPvpAreaSettings.killMode) as PvpKillMode,
    dropOnDeath: readString(record, 'dropOnDeath', defaultPvpAreaSettings.dropOnDeath) as PvpDropMode,
    onlineLandClaimBonus: readNumber(
      record,
      'onlineLandClaimBonus',
      defaultPvpAreaSettings.onlineLandClaimBonus,
    ),
    offlineLandClaimBonus: readNumber(
      record,
      'offlineLandClaimBonus',
      defaultPvpAreaSettings.offlineLandClaimBonus,
    ),
    defaultNoticeBuff: readString(
      record,
      'defaultNoticeBuff',
      defaultPvpAreaSettings.defaultNoticeBuff,
    ),
  };
}

export function normalizePvpArea(data: unknown): ModPvpArea {
  const record = (data ?? {}) as Record<string, unknown>;
  const createdAt = record.createdAt ?? record.CreatedAt;
  return {
    id: readString(record, 'id'),
    areaNote: readString(record, 'areaNote'),
    x1: readNumber(record, 'x1'),
    z1: readNumber(record, 'z1'),
    x2: readNumber(record, 'x2'),
    z2: readNumber(record, 'z2'),
    areaNoticeBuff: readString(record, 'areaNoticeBuff'),
    killMode: readString(record, 'killMode', 'strangers') as PvpKillMode,
    dropOnDeath: readString(record, 'dropOnDeath', 'none') as PvpDropMode,
    onlineLandClaimBonus: readNumber(record, 'onlineLandClaimBonus', 4),
    offlineLandClaimBonus: readNumber(record, 'offlineLandClaimBonus', 8),
    invulnerableClaim: readBool(record, 'invulnerableClaim'),
    sortOrder: readNumber(record, 'sortOrder'),
    createdAt: createdAt == null ? undefined : String(createdAt),
  };
}

export function normalizePvpAreas(data: unknown): ModPvpArea[] {
  const items = Array.isArray(data) ? data : [];
  return items
    .map(normalizePvpArea)
    .sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      return (a.createdAt ?? '').localeCompare(b.createdAt ?? '');
    });
}

function classifyPvpArea(area: { killMode: string; invulnerableClaim: boolean }) {
  if (area.invulnerableClaim) return 'invulnerable';
  if (area.killMode === 'everyone' || area.killMode === 'strangers') return 'pvp';
  return 'pve';
}

export function summarizePvpAreas(
  areas: Array<{ killMode: string; invulnerableClaim: boolean }>,
): PvpAreaSummary {
  let pvp = 0;
  let pve = 0;
  let invulnerableClaim = 0;
  for (const area of areas) {
    const kind = classifyPvpArea(area);
    if (kind === 'invulnerable') invulnerableClaim += 1;
    else if (kind === 'pvp') pvp += 1;
    else pve += 1;
  }
  return { total: areas.length, pvp, pve, invulnerableClaim };
}

export function normalizePvpCoords(x1: number, z1: number, x2: number, z2: number) {
  return {
    x1: Math.min(x1, x2),
    z1: Math.min(z1, z2),
    x2: Math.max(x1, x2),
    z2: Math.max(z1, z2),
  };
}
