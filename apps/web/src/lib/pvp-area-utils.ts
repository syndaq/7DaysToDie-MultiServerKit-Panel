import type { PvpDropMode, PvpKillMode } from '@msk-panel/shared';

export const KILL_MODE_OPTIONS: Array<{ value: PvpKillMode; label: string }> = [
  { value: 'none', label: 'No killing' },
  { value: 'allies', label: 'Allies only' },
  { value: 'strangers', label: 'Stranger damage' },
  { value: 'everyone', label: 'Everyone damage' },
];

export const DROP_MODE_OPTIONS: Array<{ value: PvpDropMode; label: string }> = [
  { value: 'none', label: 'No drop' },
  { value: 'all', label: 'Drop all' },
  { value: 'toolbelt', label: 'Toolbelt' },
  { value: 'backpack', label: 'Backpack' },
  { value: 'delete_all', label: 'Delete all' },
];

export function killModeLabel(value: string) {
  return KILL_MODE_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

export function dropModeLabel(value: string) {
  return DROP_MODE_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

export function formatCoordinateRange(x1: number, z1: number, x2: number, z2: number) {
  return `(${x1}, ${z1}) → (${x2}, ${z2})`;
}

export function formatAreaRule(killMode: string, dropOnDeath: string) {
  return `${killModeLabel(killMode)} · ${dropModeLabel(dropOnDeath)}`;
}

export function parseCoordinatePair(value: string): { x: number; z: number } | null {
  const match = value.trim().match(/^(-?\d+)\s*,\s*(-?\d+)$/);
  if (!match) return null;
  return { x: Number(match[1]), z: Number(match[2]) };
}
