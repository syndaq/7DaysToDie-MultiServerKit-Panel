import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { defaultCdKeyRedeemSettings } from '../lib/cluster-defaults.js';
import { deleteCdKeyFromAllServers, syncCdKeyRedeemSettingsToAllServers, syncCdKeyToAllServers } from '../lib/cluster-sync.js';

const settingsSchema = z.object({
  isEnabled: z.boolean(),
  hasAlreadyRedeemedTip: z.string(),
  hasReachedMaxRedemptionLimitTip: z.string(),
  hasRedemptionCodeExpiredTip: z.string(),
  redeemSuccessTip: z.string(),
});

const cdKeySchema = z.object({
  code: z.string().min(2).max(64),
  maxRedeemCount: z.number().int().min(0).default(1),
  expiresAt: z.string().datetime().optional().nullable(),
  description: z.string().optional().nullable(),
});

const bindingItemSchema = z.object({
  itemName: z.string().min(1),
  count: z.number().int().min(1).default(1),
  quality: z.number().int().default(0),
  durability: z.number().int().default(0),
  description: z.string().optional().nullable(),
  sortOrder: z.number().int().default(0),
});

const bindingCommandSchema = z.object({
  command: z.string().min(1),
  inMainThread: z.boolean().default(false),
  description: z.string().optional().nullable(),
  sortOrder: z.number().int().default(0),
});

async function getOrCreateSettings() {
  let settings = await prisma.cdKeyRedeemSettings.findUnique({ where: { id: 'default' } });
  if (!settings) {
    settings = await prisma.cdKeyRedeemSettings.create({
      data: { id: 'default', ...defaultCdKeyRedeemSettings },
    });
  }
  return settings;
}

async function loadCdKey(id: string) {
  return prisma.cdKey.findUnique({
    where: { id },
    include: { items: { orderBy: { sortOrder: 'asc' } }, commands: { orderBy: { sortOrder: 'asc' } } },
  });
}

export async function cdKeyRoutes(app: FastifyInstance) {
  app.get('/api/cd-keys/settings', async () => getOrCreateSettings());

  app.put('/api/cd-keys/settings', async (request) => {
    const body = settingsSchema.parse(request.body);
    const settings = await prisma.cdKeyRedeemSettings.upsert({
      where: { id: 'default' },
      create: { id: 'default', ...body },
      update: body,
    });
    const sync = await syncCdKeyRedeemSettingsToAllServers(settings);
    return { settings, sync };
  });

  app.delete('/api/cd-keys/settings', async () => {
    const settings = await prisma.cdKeyRedeemSettings.upsert({
      where: { id: 'default' },
      create: { id: 'default', ...defaultCdKeyRedeemSettings },
      update: defaultCdKeyRedeemSettings,
    });
    const sync = await syncCdKeyRedeemSettingsToAllServers(settings);
    return { settings, sync };
  });

  app.get('/api/cd-keys', async (request) => {
    const query = request.query as { search?: string; page?: string; pageSize?: string };
    const search = query.search?.trim();
    const page = Math.max(1, Number(query.page ?? 1));
    const pageSize = Math.min(200, Math.max(1, Number(query.pageSize ?? 20)));
    const where = search
      ? {
          OR: [
            { code: { contains: search, mode: 'insensitive' as const } },
            { description: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : undefined;

    const [items, total] = await Promise.all([
      prisma.cdKey.findMany({
        where,
        include: { items: { orderBy: { sortOrder: 'asc' } }, commands: { orderBy: { sortOrder: 'asc' } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.cdKey.count({ where }),
    ]);

    return { items, total, page, pageSize };
  });

  app.post('/api/cd-keys', async (request, reply) => {
    const body = cdKeySchema.parse(request.body);
    const cdKey = await prisma.cdKey.create({
      data: {
        code: body.code.toUpperCase(),
        maxRedeemCount: body.maxRedeemCount,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
        description: body.description ?? null,
      },
      include: { items: true, commands: true },
    });
    const sync = await syncCdKeyToAllServers(cdKey);
    return reply.status(201).send({ cdKey, sync });
  });

  app.delete<{ Params: { id: string } }>('/api/cd-keys/:id', async (request, reply) => {
    try {
      const existing = await prisma.cdKey.findUnique({ where: { id: request.params.id } });
      if (!existing) {
        return reply.status(404).send({ message: 'CD key not found' });
      }
      await prisma.cdKey.delete({ where: { id: request.params.id } });
      const sync = await deleteCdKeyFromAllServers(existing.code);
      return reply.status(200).send({ sync });
    } catch {
      return reply.status(404).send({ message: 'CD key not found' });
    }
  });

  app.post('/api/cd-keys/batch-delete', async (request) => {
    const { ids } = z.object({ ids: z.array(z.string().min(1)) }).parse(request.body);
    const keys = await prisma.cdKey.findMany({ where: { id: { in: ids } } });
    await prisma.cdKey.deleteMany({ where: { id: { in: ids } } });
    const syncResults = await Promise.all(keys.map((key) => deleteCdKeyFromAllServers(key.code)));
    return { sync: syncResults.flat() };
  });

  app.put<{ Params: { id: string } }>('/api/cd-keys/:id/bindings', async (request, reply) => {
    const body = z
      .object({
        items: z.array(bindingItemSchema),
        commands: z.array(bindingCommandSchema),
      })
      .parse(request.body);

    const existing = await prisma.cdKey.findUnique({ where: { id: request.params.id } });
    if (!existing) {
      return reply.status(404).send({ message: 'CD key not found' });
    }

    await prisma.$transaction([
      prisma.cdKeyItem.deleteMany({ where: { cdKeyId: request.params.id } }),
      prisma.cdKeyCommand.deleteMany({ where: { cdKeyId: request.params.id } }),
      ...(body.items.length
        ? [
            prisma.cdKeyItem.createMany({
              data: body.items.map((item) => ({
                ...item,
                cdKeyId: request.params.id,
                description: item.description ?? null,
              })),
            }),
          ]
        : []),
      ...(body.commands.length
        ? [
            prisma.cdKeyCommand.createMany({
              data: body.commands.map((command) => ({
                ...command,
                cdKeyId: request.params.id,
                description: command.description ?? null,
              })),
            }),
          ]
        : []),
    ]);

    const cdKey = await loadCdKey(request.params.id);
    if (!cdKey) {
      return reply.status(404).send({ message: 'CD key not found' });
    }
    const sync = await syncCdKeyToAllServers(cdKey);
    return { cdKey, sync };
  });

  app.get('/api/cd-keys/records', async (request) => {
    const query = request.query as { search?: string; page?: string; pageSize?: string };
    const search = query.search?.trim();
    const page = Math.max(1, Number(query.page ?? 1));
    const pageSize = Math.min(200, Math.max(1, Number(query.pageSize ?? 20)));
    const where = search
      ? {
          OR: [
            { platformId: { contains: search, mode: 'insensitive' as const } },
            { playerName: { contains: search, mode: 'insensitive' as const } },
            { cdKey: { code: { contains: search, mode: 'insensitive' as const } } },
          ],
        }
      : undefined;

    const [items, total] = await Promise.all([
      prisma.cdKeyRedemption.findMany({
        where,
        include: { cdKey: true },
        orderBy: { redeemedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.cdKeyRedemption.count({ where }),
    ]);

    return {
      items: items.map((record, index) => ({
        id: record.id,
        index: index + 1 + (page - 1) * pageSize,
        key: record.cdKey.code,
        createdAt: record.redeemedAt,
        platformId: record.platformId,
        playerName: record.playerName,
      })),
      total,
      page,
      pageSize,
    };
  });

  app.post('/api/cd-keys/records/batch-delete', async (request) => {
    const { ids } = z.object({ ids: z.array(z.string().min(1)) }).parse(request.body);
    await prisma.cdKeyRedemption.deleteMany({ where: { id: { in: ids } } });
    return { deleted: ids.length };
  });
}
