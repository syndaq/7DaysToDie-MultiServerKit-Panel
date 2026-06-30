import type {
  AdminUserPublic,
  AuthStatus,
  DashboardSummary,
  GameServerRecord,
  HistoryPlayerSortField,
  ModHistoryPlayer,
  ModOnlinePlayer,
  ModPagedResult,
  ModGameStoreSettings,
  ModLotterySettings,
  LotteryPool,
  ChunkResetResult,
  ModPointsSystemSettings,
  ModServerStats,
  PanelCdKey,
  ModCdKeyRedeemSettings,
  CdKeyRedemptionRecord,
  PanelPlayer,
  PointLogEntry,
  PointLogSettings,
  PagedResponse,
  ClusterSaveResponse,
  ShopProduct,
  VipGiftRecord,
  ModVipGiftSettings,
  ModLevelGiftSettings,
  LevelGiftRecord,
  ModBackupFile,
  ModPvpArea,
  ModPvpAreaSettings,
  PvpAreaPageData,
  PvpKillMode,
  PvpDropMode,
  ServerHealthStatus,
  ModChatRecord,
  ModHomeLocation,
  ModAvailablePrefab,
  ModItemListEntry,
  ModCommandListEntry,
} from '@msk-panel/shared';
import {
  normalizePvpArea,
  normalizePvpAreaSettings,
  normalizePvpAreas,
  normalizePvpCoords,
  summarizePvpAreas,
} from './mod-pvp-areas';
import { normalizePaged } from './points-utils';
import {
  buildModPagedQuery,
  normalizeAdminEntry,
  normalizeAllowedCommand,
  normalizeAvailablePrefab,
  normalizeBlacklistEntry,
  normalizeChatRecord,
  normalizeCityLocation,
  normalizeCommandListEntry,
  normalizeHomeLocation,
  normalizeItemListEntry,
  normalizeList,
  normalizeMapInfo,
  normalizePermissionEntry,
  normalizePrefabUndoHistory,
  normalizeTaskSchedule,
  normalizeWhitelistEntry,
} from './mod-records';

const API_BASE = '';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const { headers: initHeaders, body, ...rest } = init ?? {};
  const headers = new Headers(initHeaders);
  if (body != null && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    ...rest,
    body,
    headers,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(body.message ?? 'Request failed');
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const api = {
  getAuthStatus: () => request<AuthStatus>('/api/auth/status'),
  setupAdmin: (data: { username: string; password: string }) =>
    request<AuthStatus>('/api/auth/setup', { method: 'POST', body: JSON.stringify(data) }),
  login: (data: { username: string; password: string }) =>
    request<AuthStatus>('/api/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  logout: () => request<void>('/api/auth/logout', { method: 'POST' }),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    request<{ message: string }>('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getMe: () => request<AdminUserPublic>('/api/auth/me'),

  getDashboard: () => request<DashboardSummary>('/api/dashboard'),

  getServers: () => request<GameServerRecord[]>('/api/servers'),
  getServer: (id: string) => request<GameServerRecord>(`/api/servers/${id}`),
  getServerHealth: (id: string) => request<ServerHealthStatus>(`/api/servers/${id}/health`),
  getServerStats: (id: string) => request<ModServerStats>(`/api/servers/${id}/stats`),
  getAllHealth: () => request<ServerHealthStatus[]>('/api/servers/health/all'),
  createServer: (data: {
    serverId: string;
    name: string;
    apiUrl: string;
    apiKey: string;
  }) =>
    request<GameServerRecord>('/api/servers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateServer: (
    id: string,
    data: {
      name?: string;
      apiUrl?: string;
      apiKey?: string;
      enabled?: boolean;
    },
  ) =>
    request<GameServerRecord>(`/api/servers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteServer: (id: string) =>
    request<void>(`/api/servers/${id}`, { method: 'DELETE' }),

  runConsoleCommand: (serverId: string, command: string) =>
    request<string[]>(`/api/servers/${serverId}/console`, {
      method: 'POST',
      body: JSON.stringify({ command }),
    }),

  getOnlinePlayers: () => request<ModOnlinePlayer[]>('/api/players/online'),
  getServerOnlinePlayers: (serverId: string) =>
    request<ModOnlinePlayer[]>(`/api/servers/${serverId}/players/online`),
  getServerHistoryPlayers: (
    serverId: string,
    params: {
      pageNumber?: number;
      pageSize?: number;
      keyword?: string;
      order?: HistoryPlayerSortField;
      desc?: boolean;
    },
  ) => {
    const query = new URLSearchParams();
    if (params.pageNumber) query.set('PageNumber', String(params.pageNumber));
    if (params.pageSize) query.set('PageSize', String(params.pageSize));
    if (params.keyword) query.set('Keyword', params.keyword);
    if (params.order) query.set('Order', params.order);
    if (params.desc != null) query.set('Desc', String(params.desc));
    const suffix = query.toString() ? `?${query.toString()}` : '';
    return request<ModPagedResult<ModHistoryPlayer>>(
      `/api/servers/${serverId}/players/history${suffix}`,
    );
  },

  modGet: <T>(serverId: string, path: string) =>
    request<T>(`/api/servers/${serverId}/mod/${path.replace(/^\/?api\//, '')}`),

  modPost: <T>(serverId: string, path: string, body?: unknown) =>
    request<T>(`/api/servers/${serverId}/mod/${path.replace(/^\/?api\//, '')}`, {
      method: 'POST',
      body: body != null ? JSON.stringify(body) : undefined,
    }),

  modPut: <T>(serverId: string, path: string, body?: unknown) =>
    request<T>(`/api/servers/${serverId}/mod/${path.replace(/^\/?api\//, '')}`, {
      method: 'PUT',
      body: body != null ? JSON.stringify(body) : undefined,
    }),

  modDelete: <T>(serverId: string, path: string, query?: Record<string, string | string[]>) => {
    let suffix = '';
    if (query) {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(query)) {
        if (Array.isArray(value)) {
          for (const item of value) params.append(key, item);
        } else {
          params.append(key, value);
        }
      }
      suffix = `?${params.toString()}`;
    }
    return request<T>(
      `/api/servers/${serverId}/mod/${path.replace(/^\/?api\//, '')}${suffix}`,
      { method: 'DELETE' },
    );
  },

  getModSettings: <T>(serverId: string, name: string) =>
    request<T>(`/api/servers/${serverId}/mod/Settings/${name}?language=English`),

  putModSettings: <T>(serverId: string, name: string, body: T) =>
    request<void>(`/api/servers/${serverId}/mod/Settings/${name}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  resetModSettings: <T>(serverId: string, name: string) =>
    request<T>(`/api/servers/${serverId}/mod/Settings/${name}?language=English`, {
      method: 'DELETE',
    }),

  getBackupFiles: (serverId: string) =>
    request<ModBackupFile[]>(`/api/servers/${serverId}/mod/AutoBackup`),

  triggerManualBackup: (serverId: string) =>
    request<void>(`/api/servers/${serverId}/mod/AutoBackup`, { method: 'POST' }),

  deleteBackupFiles: (serverId: string, fileNames: string[]) => {
    const params = new URLSearchParams();
    for (const fileName of fileNames) params.append('fileNames', fileName);
    const suffix = params.toString() ? `?${params.toString()}` : '';
    return request<void>(`/api/servers/${serverId}/mod/AutoBackup${suffix}`, { method: 'DELETE' });
  },
  getPoints: (params?: { search?: string; page?: number; pageSize?: number }) => {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.page) query.set('page', String(params.page));
    if (params?.pageSize) query.set('pageSize', String(params.pageSize));
    const suffix = query.toString() ? `?${query.toString()}` : '';
    return request<PagedResponse<PanelPlayer>>(`/api/points${suffix}`);
  },
  createPlayerPoints: (data: {
    platformId: string;
    displayName: string;
    points?: number;
    lastSignInAt?: string | null;
  }) =>
    request<ClusterSaveResponse<PanelPlayer>>('/api/points', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  upsertPlayerPoints: (data: {
    platformId: string;
    displayName: string;
    points: number;
    lastSignInAt?: string | null;
  }) =>
    request<ClusterSaveResponse<PanelPlayer>>('/api/points/upsert', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  updatePlayerPoints: (
    id: string,
    data: { points: number; displayName?: string; lastSignInAt?: string | null },
  ) =>
    request<ClusterSaveResponse<PanelPlayer>>(`/api/points/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deletePlayerPoints: (id: string) =>
    request<{ sync: ClusterSaveResponse<never>['sync'] }>(`/api/points/${id}`, { method: 'DELETE' }),
  batchDeletePlayerPoints: (ids: string[]) =>
    request<{ sync: ClusterSaveResponse<never>['sync'] }>('/api/points/batch-delete', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    }),

  getPointsSettings: () => request<ModPointsSystemSettings>('/api/points/settings'),
  updatePointsSettings: (settings: ModPointsSystemSettings) =>
    request<ClusterSaveResponse<ModPointsSystemSettings>>('/api/points/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),
  resetPointsSettings: () =>
    request<ClusterSaveResponse<ModPointsSystemSettings>>('/api/points/settings', {
      method: 'DELETE',
    }),

  getShopSettings: () => request<ModGameStoreSettings>('/api/shop/settings'),
  updateShopSettings: (settings: ModGameStoreSettings) =>
    request<ClusterSaveResponse<ModGameStoreSettings>>('/api/shop/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),
  resetShopSettings: () =>
    request<ClusterSaveResponse<ModGameStoreSettings>>('/api/shop/settings', { method: 'DELETE' }),

  getShopProducts: () => request<ShopProduct[]>('/api/shop/products'),
  createShopProduct: (data: { name: string; price: number; description?: string }) =>
    request<ClusterSaveResponse<ShopProduct>>('/api/shop/products', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteShopProduct: (id: number) =>
    request<{ sync: ClusterSaveResponse<never>['sync'] }>(`/api/shop/products/${id}`, {
      method: 'DELETE',
    }),
  batchDeleteShopProducts: (ids: number[]) =>
    request<{ sync: ClusterSaveResponse<never>['sync'] }>('/api/shop/products/batch-delete', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    }),
  updateShopProductBindings: (
    id: number,
    data: {
      items: Array<{
        itemName: string;
        count: number;
        quality: number;
        durability: number;
        description?: string | null;
        sortOrder?: number;
      }>;
      commands: Array<{
        command: string;
        inMainThread: boolean;
        description?: string | null;
        sortOrder?: number;
      }>;
    },
  ) =>
    request<ClusterSaveResponse<ShopProduct>>(`/api/shop/products/${id}/bindings`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  getLotterySettings: () => request<ModLotterySettings>('/api/shop/lottery/settings'),
  updateLotterySettings: (settings: ModLotterySettings) =>
    request<ClusterSaveResponse<ModLotterySettings>>('/api/shop/lottery/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),
  resetLotterySettings: () =>
    request<ClusterSaveResponse<ModLotterySettings>>('/api/shop/lottery/settings', { method: 'DELETE' }),

  getLotteryPools: () => request<LotteryPool[]>('/api/shop/lottery/pools'),
  createLotteryPool: (data: {
    name: string;
    drawCost: number;
    weight: number;
    isEnabled: boolean;
    description?: string;
  }) =>
    request<ClusterSaveResponse<LotteryPool>>('/api/shop/lottery/pools', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  batchDeleteLotteryPools: (ids: number[]) =>
    request<{ sync: ClusterSaveResponse<never>['sync'] }>('/api/shop/lottery/pools/batch-delete', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    }),
  updateLotteryPoolBindings: (
    id: number,
    data: {
      items: Array<{
        itemName: string;
        count: number;
        quality: number;
        durability: number;
        description?: string | null;
        sortOrder?: number;
      }>;
      commands: Array<{
        command: string;
        inMainThread: boolean;
        description?: string | null;
        sortOrder?: number;
      }>;
    },
  ) =>
    request<ClusterSaveResponse<LotteryPool>>(`/api/shop/lottery/pools/${id}/bindings`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  resetChunkRegion: (
    serverId: string,
    data: { x1: number; z1: number; x2: number; z2: number },
  ) => api.modPost<ChunkResetResult>(serverId, 'ChunkReset', data),

  getCdKeys: (params?: { search?: string; page?: number; pageSize?: number }) => {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.page) query.set('page', String(params.page));
    if (params?.pageSize) query.set('pageSize', String(params.pageSize));
    const suffix = query.toString() ? `?${query.toString()}` : '';
    return request<PagedResponse<PanelCdKey>>(`/api/cd-keys${suffix}`);
  },
  getCdKeySettings: () => request<ModCdKeyRedeemSettings>('/api/cd-keys/settings'),
  updateCdKeySettings: (settings: ModCdKeyRedeemSettings) =>
    request<ClusterSaveResponse<ModCdKeyRedeemSettings>>('/api/cd-keys/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),
  resetCdKeySettings: () =>
    request<ClusterSaveResponse<ModCdKeyRedeemSettings>>('/api/cd-keys/settings', { method: 'DELETE' }),
  createCdKey: (data: {
    code: string;
    maxRedeemCount: number;
    expiresAt?: string | null;
    description?: string;
  }) =>
    request<ClusterSaveResponse<PanelCdKey>>('/api/cd-keys', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteCdKey: (id: string) =>
    request<{ sync: ClusterSaveResponse<never>['sync'] }>(`/api/cd-keys/${id}`, { method: 'DELETE' }),
  batchDeleteCdKeys: (ids: string[]) =>
    request<{ sync: ClusterSaveResponse<never>['sync'] }>('/api/cd-keys/batch-delete', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    }),
  updateCdKeyBindings: (
    id: string,
    data: {
      items: Array<{
        itemName: string;
        count: number;
        quality: number;
        durability: number;
        description?: string | null;
        sortOrder?: number;
      }>;
      commands: Array<{
        command: string;
        inMainThread: boolean;
        description?: string | null;
        sortOrder?: number;
      }>;
    },
  ) =>
    request<ClusterSaveResponse<PanelCdKey>>(`/api/cd-keys/${id}/bindings`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  getCdKeyRecords: (params?: { search?: string; page?: number; pageSize?: number }) => {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.page) query.set('page', String(params.page));
    if (params?.pageSize) query.set('pageSize', String(params.pageSize));
    const suffix = query.toString() ? `?${query.toString()}` : '';
    return request<PagedResponse<CdKeyRedemptionRecord>>(`/api/cd-keys/records${suffix}`);
  },
  batchDeleteCdKeyRecords: (ids: string[]) =>
    request<{ deleted: number }>('/api/cd-keys/records/batch-delete', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    }),

  getVipGifts: (params?: { search?: string; page?: number; pageSize?: number }) => {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.page) query.set('page', String(params.page));
    if (params?.pageSize) query.set('pageSize', String(params.pageSize));
    const suffix = query.toString() ? `?${query.toString()}` : '';
    return request<PagedResponse<VipGiftRecord>>(`/api/vip-gifts${suffix}`);
  },
  getVipGiftSettings: () => request<ModVipGiftSettings>('/api/vip-gifts/settings'),
  updateVipGiftSettings: (settings: ModVipGiftSettings) =>
    request<ClusterSaveResponse<ModVipGiftSettings>>('/api/vip-gifts/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),
  resetVipGiftSettings: () =>
    request<ClusterSaveResponse<ModVipGiftSettings>>('/api/vip-gifts/settings', { method: 'DELETE' }),
  createVipGift: (data: {
    id: string;
    displayName: string;
    name: string;
    description?: string;
  }) =>
    request<ClusterSaveResponse<VipGiftRecord>>('/api/vip-gifts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteVipGift: (id: string) =>
    request<{ sync: ClusterSaveResponse<never>['sync'] }>(`/api/vip-gifts/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),
  batchDeleteVipGifts: (ids: string[]) =>
    request<{ sync: ClusterSaveResponse<never>['sync'] }>('/api/vip-gifts/batch-delete', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    }),
  updateVipGiftBindings: (
    id: string,
    data: {
      items: Array<{
        itemName: string;
        count: number;
        quality: number;
        durability: number;
        description?: string | null;
        sortOrder?: number;
      }>;
      commands: Array<{
        command: string;
        inMainThread: boolean;
        description?: string | null;
        sortOrder?: number;
      }>;
    },
  ) =>
    request<ClusterSaveResponse<VipGiftRecord>>(`/api/vip-gifts/${encodeURIComponent(id)}/bindings`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  getLevelGifts: (params?: { search?: string; page?: number; pageSize?: number }) => {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.page) query.set('page', String(params.page));
    if (params?.pageSize) query.set('pageSize', String(params.pageSize));
    const suffix = query.toString() ? `?${query.toString()}` : '';
    return request<PagedResponse<LevelGiftRecord>>(`/api/level-gifts${suffix}`);
  },
  getLevelGiftSettings: () => request<ModLevelGiftSettings>('/api/level-gifts/settings'),
  updateLevelGiftSettings: (settings: ModLevelGiftSettings) =>
    request<ClusterSaveResponse<ModLevelGiftSettings>>('/api/level-gifts/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),
  resetLevelGiftSettings: () =>
    request<ClusterSaveResponse<ModLevelGiftSettings>>('/api/level-gifts/settings', { method: 'DELETE' }),
  createLevelGift: (data: {
    id: string;
    giftType: string;
    displayName?: string;
    name: string;
    requiredLevel: number;
    description?: string;
  }) =>
    request<ClusterSaveResponse<LevelGiftRecord>>('/api/level-gifts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteLevelGift: (id: string) =>
    request<{ sync: ClusterSaveResponse<never>['sync'] }>(`/api/level-gifts/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),
  batchDeleteLevelGifts: (ids: string[]) =>
    request<{ sync: ClusterSaveResponse<never>['sync'] }>('/api/level-gifts/batch-delete', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    }),
  updateLevelGiftBindings: (
    id: string,
    data: {
      items: Array<{
        itemName: string;
        count: number;
        quality: number;
        durability: number;
        description?: string | null;
        sortOrder?: number;
      }>;
      commands: Array<{
        command: string;
        inMainThread: boolean;
        description?: string | null;
        sortOrder?: number;
      }>;
    },
  ) =>
    request<ClusterSaveResponse<LevelGiftRecord>>(`/api/level-gifts/${encodeURIComponent(id)}/bindings`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  getPvpAreas: async (serverId: string): Promise<PvpAreaPageData> => {
    const [settingsRaw, areasRaw] = await Promise.all([
      request<unknown>(`/api/servers/${serverId}/mod/Settings/PvpArea?language=English`),
      request<unknown>(`/api/servers/${serverId}/mod/PvpArea`),
    ]);
    const settings = normalizePvpAreaSettings(settingsRaw);
    const areas = normalizePvpAreas(areasRaw);
    return { settings, areas, summary: summarizePvpAreas(areas) };
  },

  updatePvpAreaSettings: (serverId: string, settings: ModPvpAreaSettings) =>
    request<void>(`/api/servers/${serverId}/mod/Settings/PvpArea`, {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),

  resetPvpAreaSettings: async (serverId: string): Promise<{ settings: ModPvpAreaSettings }> => {
    const defaults = await request<unknown>(
      `/api/servers/${serverId}/mod/Settings/PvpArea?language=English`,
      { method: 'DELETE' },
    );
    const settings = normalizePvpAreaSettings(defaults);
    await request<void>(`/api/servers/${serverId}/mod/Settings/PvpArea`, {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
    return { settings };
  },

  createPvpArea: async (
    serverId: string,
    data: {
      areaNote: string;
      x1: number;
      z1: number;
      x2: number;
      z2: number;
      areaNoticeBuff: string;
      killMode: PvpKillMode;
      dropOnDeath: PvpDropMode;
      onlineLandClaimBonus: number;
      offlineLandClaimBonus: number;
      invulnerableClaim?: boolean;
    },
  ): Promise<ModPvpArea> => {
    const existing = await request<unknown>(`/api/servers/${serverId}/mod/PvpArea`);
    const count = Array.isArray(existing) ? existing.length : 0;
    const coords = normalizePvpCoords(data.x1, data.z1, data.x2, data.z2);
    const created = await request<unknown>(`/api/servers/${serverId}/mod/PvpArea`, {
      method: 'POST',
      body: JSON.stringify({
        areaNote: data.areaNote,
        x1: coords.x1,
        z1: coords.z1,
        x2: coords.x2,
        z2: coords.z2,
        areaNoticeBuff: data.areaNoticeBuff,
        killMode: data.killMode,
        dropOnDeath: data.dropOnDeath,
        onlineLandClaimBonus: data.onlineLandClaimBonus,
        offlineLandClaimBonus: data.offlineLandClaimBonus,
        invulnerableClaim: data.invulnerableClaim ?? false,
        sortOrder: count,
      }),
    });
    return normalizePvpArea(created);
  },

  deletePvpArea: (serverId: string, areaId: string) =>
    request<void>(`/api/servers/${serverId}/mod/PvpArea/${encodeURIComponent(areaId)}`, {
      method: 'DELETE',
    }),

  deleteAllPvpAreas: (serverId: string) =>
    request<void>(`/api/servers/${serverId}/mod/PvpArea`, { method: 'DELETE' }),

  getPointLogSettings: () => request<PointLogSettings>('/api/point-log/settings'),
  updatePointLogSettings: (settings: Omit<PointLogSettings, 'id' | 'updatedAt'>) =>
    request<PointLogSettings>('/api/point-log/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),
  getPointLog: (params: {
    page?: number;
    pageSize?: number;
    keyword?: string;
    category?: string;
    type?: string;
    start?: string;
    end?: string;
  }) => {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.pageSize) query.set('pageSize', String(params.pageSize));
    if (params.keyword) query.set('keyword', params.keyword);
    if (params.category) query.set('category', params.category);
    if (params.type) query.set('type', params.type);
    if (params.start) query.set('start', params.start);
    if (params.end) query.set('end', params.end);
    const suffix = query.toString() ? `?${query.toString()}` : '';
    return request<PagedResponse<PointLogEntry>>(`/api/point-log${suffix}`);
  },
  deletePointLogEntries: (ids: string[]) =>
    request<void>('/api/point-log', { method: 'DELETE', body: JSON.stringify({ ids }) }),

  getAllowedCommands: async (serverId: string) => {
    const data = await request<unknown>(`/api/servers/${serverId}/mod/Server/AllowedCommands`);
    return normalizeList(data, normalizeAllowedCommand);
  },

  getChatRecords: async (
    serverId: string,
    params: {
      pageNumber?: number;
      pageSize?: number;
      keyword?: string;
      chatType?: string;
      startDateTime?: string;
      endDateTime?: string;
    },
  ) => {
    const suffix = buildModPagedQuery(params);
    const data = await request<unknown>(`/api/servers/${serverId}/mod/ChatRecord${suffix}`);
    const paged = normalizePaged<unknown>(data);
    return {
      items: paged.items.map(normalizeChatRecord),
      total: paged.total,
    } satisfies ModPagedResult<ModChatRecord>;
  },

  deleteChatRecord: (serverId: string, id: number) =>
    request<void>(`/api/servers/${serverId}/mod/ChatRecord/${id}`, { method: 'DELETE' }),

  deleteChatRecords: (serverId: string, ids: number[], deleteAll = false) => {
    const query = new URLSearchParams();
    if (deleteAll) query.set('deleteAll', 'true');
    else for (const id of ids) query.append('ids', String(id));
    return request<number>(`/api/servers/${serverId}/mod/ChatRecord?${query.toString()}`, {
      method: 'DELETE',
    });
  },

  sendGlobalMessage: (serverId: string, message: string, senderName?: string) =>
    request<string[]>(`/api/servers/${serverId}/mod/Server/SendGlobalMessage`, {
      method: 'POST',
      body: JSON.stringify({ message, senderName: senderName ?? null }),
    }),

  getAdmins: async (serverId: string) => {
    const data = await request<unknown>(`/api/servers/${serverId}/mod/Admins`);
    return normalizeList(data, normalizeAdminEntry);
  },

  addAdmin: (serverId: string, data: { playerId: string; permissionLevel: number; displayName: string }) =>
    request<string[]>(`/api/servers/${serverId}/mod/Admins`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  removeAdmins: (serverId: string, playerIds: string[]) => {
    const query = new URLSearchParams();
    for (const id of playerIds) query.append('playerIds', id);
    return request<string[]>(`/api/servers/${serverId}/mod/Admins?${query.toString()}`, {
      method: 'DELETE',
    });
  },

  getPermissions: async (serverId: string) => {
    const data = await request<unknown>(`/api/servers/${serverId}/mod/Permissions`);
    return normalizeList(data, normalizePermissionEntry);
  },

  addPermission: (serverId: string, data: { command: string; permissionLevel: number }) =>
    request<string[]>(`/api/servers/${serverId}/mod/Permissions`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  removePermissions: (serverId: string, commands: string[]) => {
    const query = new URLSearchParams();
    for (const cmd of commands) query.append('cmds', cmd);
    return request<string[]>(`/api/servers/${serverId}/mod/Permissions?${query.toString()}`, {
      method: 'DELETE',
    });
  },

  getBlacklist: async (serverId: string) => {
    const data = await request<unknown>(`/api/servers/${serverId}/mod/Blacklist`);
    return normalizeList(data, normalizeBlacklistEntry);
  },

  addBlacklist: (
    serverId: string,
    data: { playerId: string; displayName: string; reason?: string; bannedUntil: string },
  ) =>
    request<string[]>(`/api/servers/${serverId}/mod/Blacklist`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  removeBlacklist: (serverId: string, playerIds: string[]) => {
    const query = new URLSearchParams();
    for (const id of playerIds) query.append('playerIds', id);
    return request<string[]>(`/api/servers/${serverId}/mod/Blacklist?${query.toString()}`, {
      method: 'DELETE',
    });
  },

  getWhitelist: async (serverId: string) => {
    const data = await request<unknown>(`/api/servers/${serverId}/mod/Whitelist`);
    return normalizeList(data, normalizeWhitelistEntry);
  },

  addWhitelist: (serverId: string, data: { playerId: string; displayName: string }) =>
    request<string[]>(`/api/servers/${serverId}/mod/Whitelist`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  removeWhitelist: (serverId: string, playerIds: string[]) => {
    const query = new URLSearchParams();
    for (const id of playerIds) query.append('playerIds', id);
    return request<string[]>(`/api/servers/${serverId}/mod/Whitelist?${query.toString()}`, {
      method: 'DELETE',
    });
  },

  getMapInfo: async (serverId: string) => {
    const data = await request<unknown>(`/api/servers/${serverId}/mod/Map/Info`);
    return normalizeMapInfo(data);
  },

  renderFullMap: (serverId: string) =>
    request<string[]>(`/api/servers/${serverId}/mod/Map/RenderFullMap`, { method: 'POST' }),

  renderExploredArea: (serverId: string) =>
    request<void>(`/api/servers/${serverId}/mod/Map/RenderExploredArea`, { method: 'POST' }),

  getHomeLocations: async (
    serverId: string,
    params: { pageNumber?: number; pageSize?: number; keyword?: string },
  ) => {
    const suffix = buildModPagedQuery(params);
    const data = await request<unknown>(`/api/servers/${serverId}/mod/HomeLocation${suffix}`);
    const paged = normalizePaged<unknown>(data);
    return {
      items: paged.items.map(normalizeHomeLocation),
      total: paged.total,
    } satisfies ModPagedResult<ModHomeLocation>;
  },

  deleteHomeLocation: (serverId: string, id: number) =>
    request<void>(`/api/servers/${serverId}/mod/HomeLocation/${id}`, { method: 'DELETE' }),

  getCityLocations: async (serverId: string) => {
    const data = await request<unknown>(`/api/servers/${serverId}/mod/CityLocation`);
    if (Array.isArray(data)) return data.map(normalizeCityLocation);
    const paged = normalizePaged<unknown>(data);
    return paged.items.map(normalizeCityLocation);
  },

  createCityLocation: (
    serverId: string,
    data: { cityName: string; pointsRequired: number; position: string; viewDirection?: string },
  ) =>
    request<void>(`/api/servers/${serverId}/mod/CityLocation`, {
      method: 'POST',
      body: JSON.stringify({ id: 0, ...data }),
    }),

  updateCityLocation: (
    serverId: string,
    id: number,
    data: { cityName: string; pointsRequired: number; position: string; viewDirection?: string },
  ) =>
    request<void>(`/api/servers/${serverId}/mod/CityLocation/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ id, ...data }),
    }),

  deleteCityLocation: (serverId: string, id: number) =>
    request<void>(`/api/servers/${serverId}/mod/CityLocation/${id}`, { method: 'DELETE' }),

  getItemList: async (
    serverId: string,
    params: { pageNumber?: number; pageSize?: number; keyword?: string },
  ) => {
    const suffix = buildModPagedQuery(params);
    const data = await request<unknown>(`/api/servers/${serverId}/mod/ItemList${suffix}`);
    const paged = normalizePaged<unknown>(data);
    return {
      items: paged.items.map(normalizeItemListEntry),
      total: paged.total,
    } satisfies ModPagedResult<ModItemListEntry>;
  },

  createItemListEntry: (
    serverId: string,
    data: { itemName: string; count: number; quality: number; durability: number; description?: string },
  ) =>
    request<number>(`/api/servers/${serverId}/mod/ItemList`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateItemListEntry: (
    serverId: string,
    id: number,
    data: { itemName: string; count: number; quality: number; durability: number; description?: string },
  ) =>
    request<void>(`/api/servers/${serverId}/mod/ItemList/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteItemListEntry: (serverId: string, id: number) =>
    request<void>(`/api/servers/${serverId}/mod/ItemList/${id}`, { method: 'DELETE' }),

  getCommandList: async (
    serverId: string,
    params: { pageNumber?: number; pageSize?: number; keyword?: string },
  ) => {
    const suffix = buildModPagedQuery(params);
    const data = await request<unknown>(`/api/servers/${serverId}/mod/CommandList${suffix}`);
    const paged = normalizePaged<unknown>(data);
    return {
      items: paged.items.map(normalizeCommandListEntry),
      total: paged.total,
    } satisfies ModPagedResult<ModCommandListEntry>;
  },

  createCommandListEntry: (
    serverId: string,
    data: { command: string; inMainThread: boolean; description?: string },
  ) =>
    request<number>(`/api/servers/${serverId}/mod/CommandList`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateCommandListEntry: (
    serverId: string,
    id: number,
    data: { command: string; inMainThread: boolean; description?: string },
  ) =>
    request<void>(`/api/servers/${serverId}/mod/CommandList/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteCommandListEntry: (serverId: string, id: number) =>
    request<void>(`/api/servers/${serverId}/mod/CommandList/${id}`, { method: 'DELETE' }),

  getTaskSchedules: async (serverId: string) => {
    const data = await request<unknown>(`/api/servers/${serverId}/mod/TaskSchedule?language=English`);
    return normalizeList(data, normalizeTaskSchedule);
  },

  createTaskSchedule: (
    serverId: string,
    data: { name: string; cronExpression: string; isEnabled: boolean; description?: string },
  ) =>
    request<void>(`/api/servers/${serverId}/mod/TaskSchedule`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateTaskSchedule: (
    serverId: string,
    id: number,
    data: { name: string; cronExpression: string; isEnabled: boolean; description?: string },
  ) =>
    request<void>(`/api/servers/${serverId}/mod/TaskSchedule/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteTaskSchedule: (serverId: string, id: number) =>
    request<void>(`/api/servers/${serverId}/mod/TaskSchedule/${id}`, { method: 'DELETE' }),

  getTaskScheduleCommands: async (serverId: string, taskId: number) => {
    const data = await request<unknown>(`/api/servers/${serverId}/mod/TaskSchedule/${taskId}/Commands`);
    return normalizeList(data, normalizeCommandListEntry);
  },

  setTaskScheduleCommands: (serverId: string, taskId: number, commandIds: number[]) =>
    request<void>(`/api/servers/${serverId}/mod/TaskSchedule/${taskId}/Commands`, {
      method: 'PUT',
      body: JSON.stringify(commandIds),
    }),

  getAvailablePrefabs: async (
    serverId: string,
    params: { pageNumber?: number; pageSize?: number; keyword?: string },
  ) => {
    const query = new URLSearchParams();
    if (params.pageNumber) query.set('PageNumber', String(params.pageNumber));
    if (params.pageSize) query.set('PageSize', String(params.pageSize));
    if (params.keyword) query.set('Keyword', params.keyword);
    query.set('Language', 'English');
    const suffix = query.toString() ? `?${query.toString()}` : '';
    const data = await request<unknown>(`/api/servers/${serverId}/mod/Prefab/AvailablePrefabs${suffix}`);
    const paged = normalizePaged<unknown>(data);
    return {
      items: paged.items.map(normalizeAvailablePrefab),
      total: paged.total,
    } satisfies ModPagedResult<ModAvailablePrefab>;
  },

  placePrefab: (
    serverId: string,
    data: {
      prefabFileName: string;
      position: string;
      rotation: number;
      noSleepers?: boolean;
      addToRWG?: boolean;
    },
  ) =>
    request<string[]>(`/api/servers/${serverId}/mod/Prefab/PlacePrefab`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getPrefabUndoHistory: async (serverId: string) => {
    const data = await request<unknown>(`/api/servers/${serverId}/mod/Prefab/UndoHistory`);
    return normalizeList(data, normalizePrefabUndoHistory);
  },

  undoPrefab: (serverId: string, id: number) =>
    request<string[]>(`/api/servers/${serverId}/mod/Prefab/UndoPrefab/${id}`, { method: 'PUT' }),
};
