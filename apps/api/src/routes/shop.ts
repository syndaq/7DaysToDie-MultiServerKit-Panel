import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { defaultGameStoreSettings, defaultLotterySettings } from '../lib/cluster-defaults.js';
import {
  deleteLotteryPoolFromAllServers,
  deleteShopProductFromAllServers,
  syncAllLotteryPoolsToAllServers,
  syncAllShopProductsToAllServers,
  syncGameStoreSettingsToAllServers,
  syncLotteryPoolToAllServers,
  syncLotterySettingsToAllServers,
  syncShopProductToAllServers,
} from '../lib/cluster-sync.js';

const settingsSchema = z.object({
  isEnabled: z.boolean(),
  queryListCmd: z.string(),
  buyCmdPrefix: z.string(),
  goodsItemTip: z.string(),
  buySuccessTip: z.string(),
  pointsNotEnoughTip: z.string(),
  noGoods: z.string(),
});

const productSchema = z.object({
  name: z.string().min(1),
  price: z.number().int().min(0),
  description: z.string().optional().nullable(),
});

const productItemSchema = z.object({
  itemName: z.string().min(1),
  count: z.number().int().min(1).default(1),
  quality: z.number().int().default(0),
  durability: z.number().int().default(0),
  description: z.string().optional().nullable(),
  sortOrder: z.number().int().default(0),
});

const productCommandSchema = z.object({
  command: z.string().min(1),
  inMainThread: z.boolean().default(false),
  description: z.string().optional().nullable(),
  sortOrder: z.number().int().default(0),
});

const lotterySettingsSchema = z.object({
  isEnabled: z.boolean(),
  queryListCmd: z.string(),
  drawCmdPrefix: z.string(),
  drawCost: z.number().int().min(0),
  drawInterval: z.number().int().min(0),
  poolItemTip: z.string(),
  drawSuccessTip: z.string(),
  pointsNotEnoughTip: z.string(),
  coolingTip: z.string(),
  noPoolTip: z.string(),
});

const lotteryPoolSchema = z.object({
  name: z.string().min(1),
  drawCost: z.number().int().min(0),
  weight: z.number().int().min(1).default(1),
  isEnabled: z.boolean().default(true),
  description: z.string().optional().nullable(),
});

async function getOrCreateLotterySettings() {
  let settings = await prisma.lotterySettings.findUnique({ where: { id: 'default' } });
  if (!settings) {
    settings = await prisma.lotterySettings.create({
      data: { id: 'default', ...defaultLotterySettings },
    });
  }
  return settings;
}

async function loadLotteryPool(id: number) {
  return prisma.lotteryPool.findUnique({
    where: { id },
    include: { items: { orderBy: { sortOrder: 'asc' } }, commands: { orderBy: { sortOrder: 'asc' } } },
  });
}

async function getOrCreateSettings() {
  let settings = await prisma.gameStoreSettings.findUnique({ where: { id: 'default' } });
  if (!settings) {
    settings = await prisma.gameStoreSettings.create({
      data: { id: 'default', ...defaultGameStoreSettings },
    });
  }
  return settings;
}

async function loadProduct(id: number) {
  return prisma.shopProduct.findUnique({
    where: { id },
    include: { items: { orderBy: { sortOrder: 'asc' } }, commands: { orderBy: { sortOrder: 'asc' } } },
  });
}

export async function shopRoutes(app: FastifyInstance) {
  app.get('/api/shop/settings', async () => getOrCreateSettings());

  app.put('/api/shop/settings', async (request) => {
    const body = settingsSchema.parse(request.body);
    const settings = await prisma.gameStoreSettings.upsert({
      where: { id: 'default' },
      create: { id: 'default', ...body },
      update: body,
    });
    const sync = await syncGameStoreSettingsToAllServers(settings);
    return { settings, sync };
  });

  app.delete('/api/shop/settings', async () => {
    const settings = await prisma.gameStoreSettings.upsert({
      where: { id: 'default' },
      create: { id: 'default', ...defaultGameStoreSettings },
      update: defaultGameStoreSettings,
    });
    const sync = await syncGameStoreSettingsToAllServers(settings);
    return { settings, sync };
  });

  app.get('/api/shop/products', async () => {
    return prisma.shopProduct.findMany({
      include: { items: { orderBy: { sortOrder: 'asc' } }, commands: { orderBy: { sortOrder: 'asc' } } },
      orderBy: { id: 'asc' },
    });
  });

  app.post('/api/shop/products', async (request, reply) => {
    const body = productSchema.parse(request.body);
    const product = await prisma.shopProduct.create({
      data: {
        name: body.name,
        price: body.price,
        description: body.description ?? null,
      },
      include: { items: true, commands: true },
    });
    const sync = await syncShopProductToAllServers(product);
    return reply.status(201).send({ product, sync });
  });

  app.put<{ Params: { id: string } }>('/api/shop/products/:id', async (request, reply) => {
    const id = Number(request.params.id);
    const body = productSchema.parse(request.body);
    try {
      const product = await prisma.shopProduct.update({
        where: { id },
        data: {
          name: body.name,
          price: body.price,
          description: body.description ?? null,
        },
        include: { items: { orderBy: { sortOrder: 'asc' } }, commands: { orderBy: { sortOrder: 'asc' } } },
      });
      const sync = await syncShopProductToAllServers(product);
      return { product, sync };
    } catch {
      return reply.status(404).send({ message: 'Product not found' });
    }
  });

  app.delete<{ Params: { id: string } }>('/api/shop/products/:id', async (request, reply) => {
    const id = Number(request.params.id);
    try {
      await prisma.shopProduct.delete({ where: { id } });
      const sync = await deleteShopProductFromAllServers(id);
      return reply.status(200).send({ sync });
    } catch {
      return reply.status(404).send({ message: 'Product not found' });
    }
  });

  app.post('/api/shop/products/batch-delete', async (request) => {
    const { ids } = z.object({ ids: z.array(z.number().int()) }).parse(request.body);
    await prisma.shopProduct.deleteMany({ where: { id: { in: ids } } });
    const syncResults = await Promise.all(ids.map((id) => deleteShopProductFromAllServers(id)));
    const sync = syncResults.flat();
    return { sync };
  });

  app.put<{ Params: { id: string } }>('/api/shop/products/:id/bindings', async (request, reply) => {
    const id = Number(request.params.id);
    const body = z
      .object({
        items: z.array(productItemSchema),
        commands: z.array(productCommandSchema),
      })
      .parse(request.body);

    const existing = await prisma.shopProduct.findUnique({ where: { id } });
    if (!existing) {
      return reply.status(404).send({ message: 'Product not found' });
    }

    await prisma.$transaction([
      prisma.shopProductItem.deleteMany({ where: { productId: id } }),
      prisma.shopProductCommand.deleteMany({ where: { productId: id } }),
      ...(body.items.length
        ? [
            prisma.shopProductItem.createMany({
              data: body.items.map((item) => ({ ...item, productId: id, description: item.description ?? null })),
            }),
          ]
        : []),
      ...(body.commands.length
        ? [
            prisma.shopProductCommand.createMany({
              data: body.commands.map((command) => ({
                ...command,
                productId: id,
                description: command.description ?? null,
              })),
            }),
          ]
        : []),
    ]);

    const product = await loadProduct(id);
    if (!product) {
      return reply.status(404).send({ message: 'Product not found' });
    }
    const sync = await syncShopProductToAllServers(product);
    return { product, sync };
  });

  app.post('/api/shop/sync-all', async () => {
    const settings = await getOrCreateSettings();
    const settingsSync = await syncGameStoreSettingsToAllServers(settings);
    const productsSync = await syncAllShopProductsToAllServers();
    return { settingsSync, productsSync };
  });

  app.get('/api/shop/lottery/settings', async () => getOrCreateLotterySettings());

  app.put('/api/shop/lottery/settings', async (request) => {
    const body = lotterySettingsSchema.parse(request.body);
    const settings = await prisma.lotterySettings.upsert({
      where: { id: 'default' },
      create: { id: 'default', ...body },
      update: body,
    });
    const sync = await syncLotterySettingsToAllServers(settings);
    return { settings, sync };
  });

  app.delete('/api/shop/lottery/settings', async () => {
    const settings = await prisma.lotterySettings.upsert({
      where: { id: 'default' },
      create: { id: 'default', ...defaultLotterySettings },
      update: defaultLotterySettings,
    });
    const sync = await syncLotterySettingsToAllServers(settings);
    return { settings, sync };
  });

  app.get('/api/shop/lottery/pools', async () => {
    return prisma.lotteryPool.findMany({
      include: { items: { orderBy: { sortOrder: 'asc' } }, commands: { orderBy: { sortOrder: 'asc' } } },
      orderBy: { id: 'asc' },
    });
  });

  app.post('/api/shop/lottery/pools', async (request, reply) => {
    const body = lotteryPoolSchema.parse(request.body);
    const pool = await prisma.lotteryPool.create({
      data: {
        name: body.name,
        drawCost: body.drawCost,
        weight: body.weight,
        isEnabled: body.isEnabled,
        description: body.description ?? null,
      },
      include: { items: true, commands: true },
    });
    const sync = await syncLotteryPoolToAllServers(pool);
    return reply.status(201).send({ pool, sync });
  });

  app.put<{ Params: { id: string } }>('/api/shop/lottery/pools/:id', async (request, reply) => {
    const id = Number(request.params.id);
    const body = lotteryPoolSchema.parse(request.body);
    try {
      const pool = await prisma.lotteryPool.update({
        where: { id },
        data: {
          name: body.name,
          drawCost: body.drawCost,
          weight: body.weight,
          isEnabled: body.isEnabled,
          description: body.description ?? null,
        },
        include: { items: { orderBy: { sortOrder: 'asc' } }, commands: { orderBy: { sortOrder: 'asc' } } },
      });
      const sync = await syncLotteryPoolToAllServers(pool);
      return { pool, sync };
    } catch {
      return reply.status(404).send({ message: 'Lottery pool not found' });
    }
  });

  app.delete<{ Params: { id: string } }>('/api/shop/lottery/pools/:id', async (request, reply) => {
    const id = Number(request.params.id);
    try {
      await prisma.lotteryPool.delete({ where: { id } });
      const sync = await deleteLotteryPoolFromAllServers(id);
      return reply.status(200).send({ sync });
    } catch {
      return reply.status(404).send({ message: 'Lottery pool not found' });
    }
  });

  app.post('/api/shop/lottery/pools/batch-delete', async (request) => {
    const { ids } = z.object({ ids: z.array(z.number().int()) }).parse(request.body);
    await prisma.lotteryPool.deleteMany({ where: { id: { in: ids } } });
    const syncResults = await Promise.all(ids.map((id) => deleteLotteryPoolFromAllServers(id)));
    const sync = syncResults.flat();
    return { sync };
  });

  app.put<{ Params: { id: string } }>('/api/shop/lottery/pools/:id/bindings', async (request, reply) => {
    const id = Number(request.params.id);
    const body = z
      .object({
        items: z.array(productItemSchema),
        commands: z.array(productCommandSchema),
      })
      .parse(request.body);

    const existing = await prisma.lotteryPool.findUnique({ where: { id } });
    if (!existing) {
      return reply.status(404).send({ message: 'Lottery pool not found' });
    }

    await prisma.$transaction([
      prisma.lotteryPoolItem.deleteMany({ where: { lotteryPoolId: id } }),
      prisma.lotteryPoolCommand.deleteMany({ where: { lotteryPoolId: id } }),
      ...(body.items.length
        ? [
            prisma.lotteryPoolItem.createMany({
              data: body.items.map((item) => ({ ...item, lotteryPoolId: id, description: item.description ?? null })),
            }),
          ]
        : []),
      ...(body.commands.length
        ? [
            prisma.lotteryPoolCommand.createMany({
              data: body.commands.map((command) => ({
                ...command,
                lotteryPoolId: id,
                description: command.description ?? null,
              })),
            }),
          ]
        : []),
    ]);

    const pool = await loadLotteryPool(id);
    if (!pool) {
      return reply.status(404).send({ message: 'Lottery pool not found' });
    }
    const sync = await syncLotteryPoolToAllServers(pool);
    return { pool, sync };
  });

  app.post('/api/shop/lottery/sync-all', async () => {
    const settings = await getOrCreateLotterySettings();
    const settingsSync = await syncLotterySettingsToAllServers(settings);
    const poolsSync = await syncAllLotteryPoolsToAllServers();
    return { settingsSync, poolsSync };
  });
}
