import type { ModPlayerDetails, ModPlayerPosition } from '@msk-panel/shared';

export function formatPosition(pos?: ModPlayerPosition | null): string {
  if (!pos) return '—';
  return `${Math.round(pos.x)} ${Math.round(pos.y)} ${Math.round(pos.z)}`;
}

export function formatLastLogin(value?: string): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

export function formatPlayTime(minutes?: number): string {
  if (minutes == null || minutes <= 0) return '—';
  const totalMinutes = Math.floor(minutes);
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hours === 0) return `${mins} Minutes`;
  if (mins === 0) return `${hours} Hour${hours === 1 ? '' : 's'}`;
  return `${hours} Hour${hours === 1 ? '' : 's'} ${mins} Minute${mins === 1 ? '' : 's'}`;
}

export function getPlayerDetails(player: {
  playerDetails?: ModPlayerDetails;
}): ModPlayerDetails {
  return player.playerDetails ?? {};
}

export type PlayerRow = {
  key: string;
  playerId: string;
  playerName: string;
  entityId: number;
  platformId?: string;
  gameStage?: number;
  ping?: number;
  ip?: string;
  isOnline?: boolean;
  serverName?: string;
  details: ModPlayerDetails;
};

export function onlineToRow(player: import('@msk-panel/shared').ModOnlinePlayer): PlayerRow {
  const details = getPlayerDetails(player);
  return {
    key: `${player.gameServerId ?? player.serverId ?? 'srv'}-${player.playerId}-${player.entityId}`,
    playerId: player.playerId,
    playerName: player.playerName,
    entityId: player.entityId,
    platformId: player.platformId,
    gameStage: player.gameStage,
    ping: player.ping,
    ip: player.ip,
    isOnline: true,
    serverName: player.serverName,
    details,
  };
}

export function historyToRow(player: import('@msk-panel/shared').ModHistoryPlayer): PlayerRow {
  const details = getPlayerDetails(player);
  return {
    key: `${player.playerId}-${player.entityId}`,
    playerId: player.playerId,
    playerName: player.playerName,
    entityId: player.entityId,
    platformId: player.platformId,
    isOnline: player.isOffline === false,
    details,
  };
}
