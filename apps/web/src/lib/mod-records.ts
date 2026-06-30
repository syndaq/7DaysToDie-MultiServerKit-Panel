import type {
  ModAdminEntry,
  ModAllowedCommand,
  ModAvailablePrefab,
  ModBlacklistEntry,
  ModChatRecord,
  ModCityLocation,
  ModCommandListEntry,
  ModHomeLocation,
  ModItemListEntry,
  ModMapInfo,
  ModPermissionEntry,
  ModPrefabUndoHistory,
  ModTaskSchedule,
  ModWhitelistEntry,
} from '@msk-panel/shared';

function readRecord(data: unknown): Record<string, unknown> {
  return (data ?? {}) as Record<string, unknown>;
}

function readField<T>(record: Record<string, unknown>, camel: string, fallback: T): T {
  const pascal = camel.charAt(0).toUpperCase() + camel.slice(1);
  const value = record[camel] ?? record[pascal];
  return (value == null ? fallback : value) as T;
}

function readString(record: Record<string, unknown>, key: string, fallback = ''): string {
  const value = readField(record, key, fallback);
  return value == null ? fallback : String(value);
}

function readNumber(record: Record<string, unknown>, key: string, fallback = 0): number {
  const value = readField(record, key, fallback);
  return value == null ? fallback : Number(value);
}

function readBool(record: Record<string, unknown>, key: string, fallback = false): boolean {
  const value = readField(record, key, fallback);
  return value == null ? fallback : Boolean(value);
}

export function normalizeChatRecord(data: unknown): ModChatRecord {
  const record = readRecord(data);
  return {
    id: readNumber(record, 'id'),
    createdAt: readString(record, 'createdAt'),
    entityId: readNumber(record, 'entityId'),
    playerId: readString(record, 'playerId') || null,
    senderName: readString(record, 'senderName'),
    chatType: readString(record, 'chatType'),
    message: readString(record, 'message'),
  };
}

export function normalizeAdminEntry(data: unknown): ModAdminEntry {
  const record = readRecord(data);
  return {
    playerId: readString(record, 'playerId'),
    permissionLevel: readNumber(record, 'permissionLevel', 0),
    displayName: readString(record, 'displayName'),
  };
}

export function normalizePermissionEntry(data: unknown): ModPermissionEntry {
  const record = readRecord(data);
  return {
    command: readString(record, 'command'),
    permissionLevel: readNumber(record, 'permissionLevel', 0),
    description: readString(record, 'description') || null,
  };
}

export function normalizeBlacklistEntry(data: unknown): ModBlacklistEntry {
  const record = readRecord(data);
  return {
    playerId: readString(record, 'playerId'),
    displayName: readString(record, 'displayName'),
    reason: readString(record, 'reason') || null,
    bannedUntil: readString(record, 'bannedUntil'),
  };
}

export function normalizeWhitelistEntry(data: unknown): ModWhitelistEntry {
  const record = readRecord(data);
  return {
    playerId: readString(record, 'playerId'),
    displayName: readString(record, 'displayName'),
  };
}

export function normalizeAllowedCommand(data: unknown): ModAllowedCommand {
  const record = readRecord(data);
  return {
    commands: readString(record, 'commands'),
    permissionLevel: readNumber(record, 'permissionLevel', 0),
    description: readString(record, 'description') || null,
    help: readString(record, 'help') || null,
  };
}

export function normalizeMapInfo(data: unknown): ModMapInfo {
  const record = readRecord(data);
  return {
    blockSize: readNumber(record, 'blockSize', 512),
    maxZoom: readNumber(record, 'maxZoom', 3),
  };
}

export function normalizeHomeLocation(data: unknown): ModHomeLocation {
  const record = readRecord(data);
  return {
    id: readNumber(record, 'id'),
    playerId: readString(record, 'playerId'),
    playerName: readString(record, 'playerName'),
    homeName: readString(record, 'homeName'),
    position: readString(record, 'position'),
    createdAt: readString(record, 'createdAt') || undefined,
  };
}

export function normalizeCityLocation(data: unknown): ModCityLocation {
  const record = readRecord(data);
  return {
    id: readNumber(record, 'id'),
    cityName: readString(record, 'cityName'),
    pointsRequired: readNumber(record, 'pointsRequired'),
    position: readString(record, 'position'),
    viewDirection: readString(record, 'viewDirection') || null,
    createdAt: readString(record, 'createdAt') || undefined,
  };
}

export function normalizeItemListEntry(data: unknown): ModItemListEntry {
  const record = readRecord(data);
  return {
    id: readNumber(record, 'id'),
    itemName: readString(record, 'itemName'),
    count: readNumber(record, 'count', 1),
    quality: readNumber(record, 'quality'),
    durability: readNumber(record, 'durability'),
    description: readString(record, 'description') || undefined,
  };
}

export function normalizeCommandListEntry(data: unknown): ModCommandListEntry {
  const record = readRecord(data);
  return {
    id: readNumber(record, 'id'),
    command: readString(record, 'command'),
    inMainThread: readBool(record, 'inMainThread'),
    description: readString(record, 'description') || undefined,
  };
}

export function normalizeTaskSchedule(data: unknown): ModTaskSchedule {
  const record = readRecord(data);
  return {
    id: readNumber(record, 'id'),
    name: readString(record, 'name'),
    cronExpression: readString(record, 'cronExpression'),
    isEnabled: readBool(record, 'isEnabled'),
    description: readString(record, 'description') || null,
    expressionDescription: readString(record, 'expressionDescription') || null,
    lastRunAt: readString(record, 'lastRunAt') || null,
    createdAt: readString(record, 'createdAt') || undefined,
  };
}

export function normalizeAvailablePrefab(data: unknown): ModAvailablePrefab {
  const record = readRecord(data);
  return {
    name: readString(record, 'name'),
    localizationName: readString(record, 'localizationName'),
    fullPath: readString(record, 'fullPath'),
  };
}

export function normalizePrefabUndoHistory(data: unknown): ModPrefabUndoHistory {
  const record = readRecord(data);
  return {
    id: readNumber(record, 'id'),
    prefabName: readString(record, 'prefabName'),
    position: readString(record, 'position'),
    createdAt: readString(record, 'createdAt'),
  };
}

export function normalizeList<T>(data: unknown, normalize: (item: unknown) => T): T[] {
  if (!Array.isArray(data)) return [];
  return data.map(normalize);
}

export function buildModPagedQuery(params: {
  pageNumber?: number;
  pageSize?: number;
  keyword?: string;
  order?: string;
  desc?: boolean;
  chatType?: string;
  startDateTime?: string;
  endDateTime?: string;
}): string {
  const query = new URLSearchParams();
  if (params.pageNumber) query.set('PageNumber', String(params.pageNumber));
  if (params.pageSize) query.set('PageSize', String(params.pageSize));
  if (params.keyword) query.set('Keyword', params.keyword);
  if (params.order) query.set('Order', params.order);
  if (params.desc != null) query.set('Desc', String(params.desc));
  if (params.chatType) query.set('ChatType', params.chatType);
  if (params.startDateTime) query.set('StartDateTime', params.startDateTime);
  if (params.endDateTime) query.set('EndDateTime', params.endDateTime);
  const suffix = query.toString();
  return suffix ? `?${suffix}` : '';
}

export function modTileUrl(serverId: string, z: number, x: number, y: number): string {
  return `/api/servers/${serverId}/mod/Map/Tile/${z}/${x}/${y}`;
}
