import type {
  CdKey,
  CdKeyCommand,
  CdKeyItem,
  GameServer,
  LotteryPool,
  LotteryPoolCommand,
  LotteryPoolItem,
  Player,
  ShopProduct,
  ShopProductCommand,
  ShopProductItem,
  VipGift,
  VipGiftCommand,
  VipGiftItem,
  LevelGift,
  LevelGiftCommand,
  LevelGiftItem,
} from '@prisma/client';
import { ModApiError } from '@msk-panel/shared';
import { prisma } from './prisma.js';
import { proxyToMod } from './mod-proxy.js';

export interface ClusterSyncResult {
  serverId: string;
  serverName: string;
  success: boolean;
  error?: string;
}

type ShopProductWithBindings = ShopProduct & {
  items: ShopProductItem[];
  commands: ShopProductCommand[];
};

type LotteryPoolWithBindings = LotteryPool & {
  items: LotteryPoolItem[];
  commands: LotteryPoolCommand[];
};

function normalizePaged<T>(data: unknown): { items: T[]; total: number } {
  if (Array.isArray(data)) {
    return { items: data as T[], total: data.length };
  }
  const record = (data ?? {}) as Record<string, unknown>;
  const items = (record.items ?? record.data ?? record.Items ?? record.Data ?? []) as T[];
  const total = Number(record.total ?? record.totalCount ?? record.Total ?? items.length);
  return { items, total };
}

async function getEnabledServers(): Promise<GameServer[]> {
  return prisma.gameServer.findMany({ where: { enabled: true }, orderBy: { name: 'asc' } });
}

async function syncToAllServers(
  label: string,
  fn: (server: GameServer) => Promise<void>,
): Promise<ClusterSyncResult[]> {
  const servers = await getEnabledServers();
  if (servers.length === 0) {
    return [];
  }

  return Promise.all(
    servers.map(async (server) => {
      try {
        await fn(server);
        return { serverId: server.serverId, serverName: server.name, success: true };
      } catch (error) {
        const message =
          error instanceof ModApiError
            ? error.message
            : error instanceof Error
              ? error.message
              : `Failed to sync ${label}`;
        return { serverId: server.serverId, serverName: server.name, success: false, error: message };
      }
    }),
  );
}

export async function syncPointsSettingsToAllServers(settings: {
  isEnabled: boolean;
  signInCmd: string;
  signInInterval: number;
  signInRewardPoints: number;
  signInSuccessTip: string;
  signInFailureTip: string;
  queryPointsCmd: string;
  queryPointsTip: string;
  isCurrencyExchangeEnabled: boolean;
  currencyToPointsExchangeRate: number;
  currencyExchangeCmd: string;
  exchangeSuccessTip: string;
  exchangeFailureTip: string;
}): Promise<ClusterSyncResult[]> {
  return syncToAllServers('points settings', async (server) => {
    await proxyToMod(server, 'PUT', '/api/Settings/PointsSystem', { body: settings });
  });
}

export async function syncGameStoreSettingsToAllServers(settings: {
  isEnabled: boolean;
  queryListCmd: string;
  buyCmdPrefix: string;
  goodsItemTip: string;
  buySuccessTip: string;
  pointsNotEnoughTip: string;
  noGoods: string;
}): Promise<ClusterSyncResult[]> {
  return syncToAllServers('game store settings', async (server) => {
    await proxyToMod(server, 'PUT', '/api/Settings/GameStore', { body: settings });
  });
}

export async function syncPlayerPointsToAllServers(player: Pick<Player, 'platformId' | 'displayName' | 'points' | 'lastSignInAt'>): Promise<ClusterSyncResult[]> {
  const body = {
    id: player.platformId,
    playerName: player.displayName,
    points: player.points,
    lastSignInAt: player.lastSignInAt?.toISOString() ?? new Date().toISOString(),
  };

  return syncToAllServers('player points', async (server) => {
    try {
      await proxyToMod(server, 'PUT', `/api/PointsInfo/${encodeURIComponent(player.platformId)}`, { body });
    } catch (error) {
      if (error instanceof ModApiError && error.statusCode === 404) {
        await proxyToMod(server, 'POST', '/api/PointsInfo', { body });
        return;
      }
      throw error;
    }
  });
}

export async function deletePlayerPointsFromAllServers(platformId: string): Promise<ClusterSyncResult[]> {
  return syncToAllServers('player delete', async (server) => {
    try {
      await proxyToMod(server, 'DELETE', `/api/PointsInfo/${encodeURIComponent(platformId)}`);
    } catch (error) {
      if (error instanceof ModApiError && error.statusCode === 404) {
        return;
      }
      throw error;
    }
  });
}

async function resolveItemId(
  server: GameServer,
  item: Pick<ShopProductItem | LotteryPoolItem, 'itemName' | 'count' | 'quality' | 'durability' | 'description'>,
): Promise<number> {
  const listResult = await proxyToMod(server, 'GET', '/api/ItemList', {
    query: { PageNumber: 1, PageSize: 500, Keyword: item.itemName },
  });
  const list = normalizePaged<{ id: number; itemName?: string; count?: number; quality?: number; durability?: number }>(
    listResult.data,
  );
  const match = list.items.find(
    (entry) =>
      entry.itemName === item.itemName &&
      (entry.count ?? 1) === item.count &&
      (entry.quality ?? 0) === item.quality &&
      (entry.durability ?? 0) === item.durability,
  );
  if (match) return match.id;

  const createResult = await proxyToMod(server, 'POST', '/api/ItemList', {
    body: {
      itemName: item.itemName,
      count: item.count,
      quality: item.quality,
      durability: item.durability,
      description: item.description ?? '',
    },
  });
  return Number(createResult.data);
}

async function resolveCommandId(
  server: GameServer,
  command: Pick<ShopProductCommand | LotteryPoolCommand, 'command' | 'inMainThread' | 'description'>,
): Promise<number> {
  const listResult = await proxyToMod(server, 'GET', '/api/CommandList', {
    query: { PageNumber: 1, PageSize: 500, Keyword: command.command.slice(0, 32) },
  });
  const list = normalizePaged<{ id: number; command?: string; inMainThread?: boolean }>(listResult.data);
  const match = list.items.find(
    (entry) => entry.command === command.command && Boolean(entry.inMainThread) === command.inMainThread,
  );
  if (match) return match.id;

  const createResult = await proxyToMod(server, 'POST', '/api/CommandList', {
    body: {
      command: command.command,
      inMainThread: command.inMainThread,
      description: command.description ?? '',
    },
  });
  return Number(createResult.data);
}

async function syncProductToServer(server: GameServer, product: ShopProductWithBindings): Promise<void> {
  const goodsBody = {
    id: product.id,
    name: product.name,
    price: product.price,
    description: product.description ?? '',
  };

  try {
    await proxyToMod(server, 'PUT', `/api/Goods/${product.id}`, { body: goodsBody });
  } catch (error) {
    if (error instanceof ModApiError && error.statusCode === 404) {
      await proxyToMod(server, 'POST', '/api/Goods', { body: goodsBody });
    } else {
      throw error;
    }
  }

  const itemIds = await Promise.all(product.items.map((item) => resolveItemId(server, item)));
  await proxyToMod(server, 'PUT', `/api/Goods/${product.id}/Items`, { body: itemIds });

  const commandIds = await Promise.all(product.commands.map((command) => resolveCommandId(server, command)));
  await proxyToMod(server, 'PUT', `/api/Goods/${product.id}/Commands`, { body: commandIds });
}

export async function syncShopProductToAllServers(product: ShopProductWithBindings): Promise<ClusterSyncResult[]> {
  return syncToAllServers('shop product', async (server) => {
    await syncProductToServer(server, product);
  });
}

export async function deleteShopProductFromAllServers(productId: number): Promise<ClusterSyncResult[]> {
  return syncToAllServers('shop product delete', async (server) => {
    try {
      await proxyToMod(server, 'DELETE', `/api/Goods/${productId}`);
    } catch (error) {
      if (error instanceof ModApiError && error.statusCode === 404) {
        return;
      }
      throw error;
    }
  });
}

export async function syncAllShopProductsToAllServers(): Promise<ClusterSyncResult[]> {
  const products = await prisma.shopProduct.findMany({
    include: { items: { orderBy: { sortOrder: 'asc' } }, commands: { orderBy: { sortOrder: 'asc' } } },
    orderBy: { id: 'asc' },
  });

  const servers = await getEnabledServers();
  if (servers.length === 0 || products.length === 0) {
    return [];
  }

  const results: ClusterSyncResult[] = [];
  for (const server of servers) {
    try {
      for (const product of products) {
        await syncProductToServer(server, product);
      }
      results.push({ serverId: server.serverId, serverName: server.name, success: true });
    } catch (error) {
      const message =
        error instanceof ModApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Failed to sync shop catalog';
      results.push({ serverId: server.serverId, serverName: server.name, success: false, error: message });
    }
  }
  return results;
}

export async function syncLotterySettingsToAllServers(settings: {
  isEnabled: boolean;
  queryListCmd: string;
  drawCmdPrefix: string;
  drawCost: number;
  drawInterval: number;
  poolItemTip: string;
  drawSuccessTip: string;
  pointsNotEnoughTip: string;
  coolingTip: string;
  noPoolTip: string;
}): Promise<ClusterSyncResult[]> {
  return syncToAllServers('lottery settings', async (server) => {
    await proxyToMod(server, 'PUT', '/api/Settings/Lottery', { body: settings });
  });
}

async function syncLotteryPoolToServer(server: GameServer, pool: LotteryPoolWithBindings): Promise<void> {
  const poolBody = {
    id: pool.id,
    name: pool.name,
    drawCost: pool.drawCost,
    weight: pool.weight,
    isEnabled: pool.isEnabled,
    description: pool.description ?? '',
  };

  try {
    await proxyToMod(server, 'PUT', `/api/LotteryPool/${pool.id}`, { body: poolBody });
  } catch (error) {
    if (error instanceof ModApiError && error.statusCode === 404) {
      await proxyToMod(server, 'POST', '/api/LotteryPool', { body: poolBody });
    } else {
      throw error;
    }
  }

  const itemIds = await Promise.all(pool.items.map((item) => resolveItemId(server, item)));
  await proxyToMod(server, 'PUT', `/api/LotteryPool/${pool.id}/Items`, { body: itemIds });

  const commandIds = await Promise.all(pool.commands.map((command) => resolveCommandId(server, command)));
  await proxyToMod(server, 'PUT', `/api/LotteryPool/${pool.id}/Commands`, { body: commandIds });
}

export async function syncLotteryPoolToAllServers(pool: LotteryPoolWithBindings): Promise<ClusterSyncResult[]> {
  return syncToAllServers('lottery pool', async (server) => {
    await syncLotteryPoolToServer(server, pool);
  });
}

export async function deleteLotteryPoolFromAllServers(poolId: number): Promise<ClusterSyncResult[]> {
  return syncToAllServers('lottery pool delete', async (server) => {
    try {
      await proxyToMod(server, 'DELETE', `/api/LotteryPool/${poolId}`);
    } catch (error) {
      if (error instanceof ModApiError && error.statusCode === 404) {
        return;
      }
      throw error;
    }
  });
}

export async function syncAllLotteryPoolsToAllServers(): Promise<ClusterSyncResult[]> {
  const pools = await prisma.lotteryPool.findMany({
    include: { items: { orderBy: { sortOrder: 'asc' } }, commands: { orderBy: { sortOrder: 'asc' } } },
    orderBy: { id: 'asc' },
  });

  const servers = await getEnabledServers();
  if (servers.length === 0 || pools.length === 0) {
    return [];
  }

  const results: ClusterSyncResult[] = [];
  for (const server of servers) {
    try {
      for (const pool of pools) {
        await syncLotteryPoolToServer(server, pool);
      }
      results.push({ serverId: server.serverId, serverName: server.name, success: true });
    } catch (error) {
      const message =
        error instanceof ModApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Failed to sync lottery pools';
      results.push({ serverId: server.serverId, serverName: server.name, success: false, error: message });
    }
  }
  return results;
}

type VipGiftWithBindings = VipGift & {
  items: VipGiftItem[];
  commands: VipGiftCommand[];
};

export async function syncVipGiftSettingsToAllServers(settings: {
  isEnabled: boolean;
  claimCmd: string;
  hasClaimedTip: string;
  nonVipTip: string;
  claimSuccessTip: string;
}): Promise<ClusterSyncResult[]> {
  return syncToAllServers('VIP gift settings', async (server) => {
    await proxyToMod(server, 'PUT', '/api/Settings/VipGift', { body: settings });
  });
}

async function syncVipGiftToServer(server: GameServer, gift: VipGiftWithBindings): Promise<void> {
  const body = {
    id: gift.id,
    name: gift.name,
    claimState: gift.claimState,
    totalClaimCount: gift.totalClaimCount,
    description: gift.description ?? '',
  };

  try {
    await proxyToMod(server, 'PUT', `/api/VipGift/${encodeURIComponent(gift.id)}`, { body });
  } catch (error) {
    if (error instanceof ModApiError && error.statusCode === 404) {
      await proxyToMod(server, 'POST', '/api/VipGift', { body });
    } else {
      throw error;
    }
  }

  const itemIds = await Promise.all(gift.items.map((item) => resolveItemId(server, item)));
  await proxyToMod(server, 'PUT', `/api/VipGift/${encodeURIComponent(gift.id)}/Items`, { body: itemIds });

  const commandIds = await Promise.all(gift.commands.map((command) => resolveCommandId(server, command)));
  await proxyToMod(server, 'PUT', `/api/VipGift/${encodeURIComponent(gift.id)}/Commands`, { body: commandIds });
}

export async function syncVipGiftToAllServers(gift: VipGiftWithBindings): Promise<ClusterSyncResult[]> {
  return syncToAllServers('VIP gift', async (server) => {
    await syncVipGiftToServer(server, gift);
  });
}

export async function deleteVipGiftFromAllServers(giftId: string): Promise<ClusterSyncResult[]> {
  return syncToAllServers('VIP gift delete', async (server) => {
    try {
      await proxyToMod(server, 'DELETE', `/api/VipGift/${encodeURIComponent(giftId)}`);
    } catch (error) {
      if (error instanceof ModApiError && error.statusCode === 404) {
        return;
      }
      throw error;
    }
  });
}

type CdKeyWithBindings = CdKey & {
  items: CdKeyItem[];
  commands: CdKeyCommand[];
};

export async function syncCdKeyRedeemSettingsToAllServers(settings: {
  isEnabled: boolean;
  hasAlreadyRedeemedTip: string;
  hasReachedMaxRedemptionLimitTip: string;
  hasRedemptionCodeExpiredTip: string;
  redeemSuccessTip: string;
}): Promise<ClusterSyncResult[]> {
  return syncToAllServers('CD key redeem settings', async (server) => {
    await proxyToMod(server, 'PUT', '/api/Settings/CdKeyRedeem', { body: settings });
  });
}

async function syncCdKeyToServer(server: GameServer, cdKey: CdKeyWithBindings): Promise<void> {
  const body = {
    key: cdKey.code,
    redeemCount: cdKey.redeemCount,
    maxRedeemCount: cdKey.maxRedeemCount,
    expiryAt: cdKey.expiresAt?.toISOString() ?? null,
    description: cdKey.description ?? '',
  };

  const listResult = await proxyToMod(server, 'GET', '/api/CdKeys');
  const existing = (Array.isArray(listResult.data) ? listResult.data : []) as Array<{ id: number; key: string }>;
  const match = existing.find((entry) => entry.key?.toUpperCase() === cdKey.code.toUpperCase());

  let modCdKeyId = match?.id;
  if (modCdKeyId != null) {
    await proxyToMod(server, 'PUT', `/api/CdKeys/${modCdKeyId}`, { body });
  } else {
    await proxyToMod(server, 'POST', '/api/CdKeys', { body });
    const refreshed = await proxyToMod(server, 'GET', '/api/CdKeys');
    const created = (Array.isArray(refreshed.data) ? refreshed.data : []) as Array<{ id: number; key: string }>;
    modCdKeyId = created.find((entry) => entry.key?.toUpperCase() === cdKey.code.toUpperCase())?.id;
  }

  if (modCdKeyId == null) {
    throw new ModApiError(500, `Failed to resolve CD key id for ${cdKey.code}`);
  }

  const itemIds = await Promise.all(cdKey.items.map((item) => resolveItemId(server, item)));
  await proxyToMod(server, 'PUT', `/api/CdKeys/${modCdKeyId}/Items`, { body: itemIds });

  const commandIds = await Promise.all(cdKey.commands.map((command) => resolveCommandId(server, command)));
  await proxyToMod(server, 'PUT', `/api/CdKeys/${modCdKeyId}/Commands`, { body: commandIds });
}

export async function syncCdKeyToAllServers(cdKey: CdKeyWithBindings): Promise<ClusterSyncResult[]> {
  return syncToAllServers('CD key', async (server) => {
    await syncCdKeyToServer(server, cdKey);
  });
}

export async function deleteCdKeyFromAllServers(code: string): Promise<ClusterSyncResult[]> {
  return syncToAllServers('CD key delete', async (server) => {
    const listResult = await proxyToMod(server, 'GET', '/api/CdKeys');
    const existing = (Array.isArray(listResult.data) ? listResult.data : []) as Array<{ id: number; key: string }>;
    const match = existing.find((entry) => entry.key?.toUpperCase() === code.toUpperCase());
    if (!match) return;
    try {
      await proxyToMod(server, 'DELETE', `/api/CdKeys/${match.id}`);
    } catch (error) {
      if (error instanceof ModApiError && error.statusCode === 404) {
        return;
      }
      throw error;
    }
  });
}

type LevelGiftWithBindings = LevelGift & {
  items: LevelGiftItem[];
  commands: LevelGiftCommand[];
};

export async function syncLevelGiftSettingsToAllServers(settings: {
  isEnabled: boolean;
  claimCmd: string;
  hasClaimedTip: string;
  levelNotEnoughTip: string;
  noGiftTip: string;
  claimSuccessTip: string;
}): Promise<ClusterSyncResult[]> {
  return syncToAllServers('level gift settings', async (server) => {
    await proxyToMod(server, 'PUT', '/api/Settings/LevelGift', { body: settings });
  });
}

async function syncLevelGiftToServer(server: GameServer, gift: LevelGiftWithBindings): Promise<void> {
  const body = {
    id: gift.id,
    giftType: gift.giftType,
    displayName: gift.displayName,
    name: gift.name,
    requiredLevel: gift.requiredLevel,
    claimState: gift.claimState,
    totalClaimCount: gift.totalClaimCount,
    description: gift.description ?? '',
  };

  try {
    await proxyToMod(server, 'PUT', `/api/LevelGift/${encodeURIComponent(gift.id)}`, { body });
  } catch (error) {
    if (error instanceof ModApiError && error.statusCode === 404) {
      await proxyToMod(server, 'POST', '/api/LevelGift', { body });
    } else {
      throw error;
    }
  }

  const itemIds = await Promise.all(gift.items.map((item) => resolveItemId(server, item)));
  await proxyToMod(server, 'PUT', `/api/LevelGift/${encodeURIComponent(gift.id)}/Items`, { body: itemIds });

  const commandIds = await Promise.all(gift.commands.map((command) => resolveCommandId(server, command)));
  await proxyToMod(server, 'PUT', `/api/LevelGift/${encodeURIComponent(gift.id)}/Commands`, { body: commandIds });
}

export async function syncLevelGiftToAllServers(gift: LevelGiftWithBindings): Promise<ClusterSyncResult[]> {
  return syncToAllServers('level gift', async (server) => {
    await syncLevelGiftToServer(server, gift);
  });
}

export async function deleteLevelGiftFromAllServers(giftId: string): Promise<ClusterSyncResult[]> {
  return syncToAllServers('level gift delete', async (server) => {
    try {
      await proxyToMod(server, 'DELETE', `/api/LevelGift/${encodeURIComponent(giftId)}`);
    } catch (error) {
      if (error instanceof ModApiError && error.statusCode === 404) {
        return;
      }
      throw error;
    }
  });
}
