import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { defaultLevelGiftSettings } from '../lib/cluster-defaults.js';
import {
  deleteLevelGiftFromAllServers,
  syncLevelGiftSettingsToAllServers,
  syncLevelGiftToAllServers,
} from '../lib/cluster-sync.js';

const settingsSchema = z.object({
  isEnabled: z.boolean(),
  claimCmd: z.string(),
  hasClaimedTip: z.string(),
  levelNotEnoughTip: z.string(),
  noGiftTip: z.string(),
  claimSuccessTip: z.string(),
});

const giftSchema = z.object({
  id: z.string().min(1),
  giftType: z.string().min(1),
  displayName: z.string().optional(),
  name: z.string().min(1),
  requiredLevel: z.number().int().min(1),
  claimState: z.boolean().optional(),
  totalClaimCount: z.number().int().min(0).optional(),
  lastClaimAt: z.string().datetime().optional().nullable(),
  description: z.string().optional().nullable(),
});

const giftItemSchema = z.object({
  itemName: z.string().min(1),
  count: z.number().int().min(1).default(1),
  quality: z.number().int().default(0),
  durability: z.number().int().default(0),
  description: z.string().optional().nullable(),
  sortOrder: z.number().int().default(0),
});

const giftCommandSchema = z.object({
  command: z.string().min(1),
  inMainThread: z.boolean().default(false),
  description: z.string().optional().nullable(),
  sortOrder: z.number().int().default(0),
});

async function getOrCreateSettings() {
  let settings = await prisma.levelGiftSettings.findUnique({ where: { id: 'default' } });
  if (!settings) {
    settings = await prisma.levelGiftSettings.create({
      data: { id: 'default', ...defaultLevelGiftSettings },
    });
  }
  return settings;
}

async function loadGift(id: string) {
  return prisma.levelGift.findUnique({
    where: { id },
    include: { items: { orderBy: { sortOrder: 'asc' } }, commands: { orderBy: { sortOrder: 'asc' } } },
  });
}

export async function levelGiftRoutes(app: FastifyInstance) {
  app.get('/api/level-gifts/settings', async () => getOrCreateSettings());

  app.put('/api/level-gifts/settings', async (request) => {
    const body = settingsSchema.parse(request.body);
    const settings = await prisma.levelGiftSettings.upsert({
      where: { id: 'default' },
      create: { id: 'default', ...body },
      update: body,
    });
    const sync = await syncLevelGiftSettingsToAllServers(settings);
    return { settings, sync };
  });

  app.delete('/api/level-gifts/settings', async () => {
    const settings = await prisma.levelGiftSettings.upsert({
      where: { id: 'default' },
      create: { id: 'default', ...defaultLevelGiftSettings },
      update: defaultLevelGiftSettings,
    });
    const sync = await syncLevelGiftSettingsToAllServers(settings);
    return { settings, sync };
  });

  app.get('/api/level-gifts', async (request) => {
    const query = request.query as { search?: string; page?: string; pageSize?: string };
    const search = query.search?.trim();
    const page = Math.max(1, Number(query.page ?? 1));
    const pageSize = Math.min(200, Math.max(1, Number(query.pageSize ?? 20)));
    const where = search
      ? {
          OR: [
            { id: { contains: search, mode: 'insensitive' as const } },
            { giftType: { contains: search, mode: 'insensitive' as const } },
            { displayName: { contains: search, mode: 'insensitive' as const } },
            { name: { contains: search, mode: 'insensitive' as const } },
            { description: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : undefined;

    const [items, total] = await Promise.all([
      prisma.levelGift.findMany({
        where,
        include: { items: { orderBy: { sortOrder: 'asc' } }, commands: { orderBy: { sortOrder: 'asc' } } },
        orderBy: [{ requiredLevel: 'asc' }, { createdAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.levelGift.count({ where }),
    ]);

    return { items, total, page, pageSize };
  });

  app.post('/api/level-gifts', async (request, reply) => {
    const body = giftSchema.parse(request.body);
    const gift = await prisma.levelGift.create({
      data: {
        id: body.id,
        giftType: body.giftType,
        displayName: body.displayName ?? '',
        name: body.name,
        requiredLevel: body.requiredLevel,
        claimState: body.claimState ?? false,
        totalClaimCount: body.totalClaimCount ?? 0,
        lastClaimAt: body.lastClaimAt ? new Date(body.lastClaimAt) : null,
        description: body.description ?? null,
      },
      include: { items: true, commands: true },
    });
    const sync = await syncLevelGiftToAllServers(gift);
    return reply.status(201).send({ gift, sync });
  });

  app.delete<{ Params: { id: string } }>('/api/level-gifts/:id', async (request, reply) => {
    try {
      await prisma.levelGift.delete({ where: { id: request.params.id } });
      const sync = await deleteLevelGiftFromAllServers(request.params.id);
      return reply.status(200).send({ sync });
    } catch {
      return reply.status(404).send({ message: 'Level gift not found' });
    }
  });

  app.post('/api/level-gifts/batch-delete', async (request) => {
    const { ids } = z.object({ ids: z.array(z.string().min(1)) }).parse(request.body);
    await prisma.levelGift.deleteMany({ where: { id: { in: ids } } });
    const syncResults = await Promise.all(ids.map((id) => deleteLevelGiftFromAllServers(id)));
    return { sync: syncResults.flat() };
  });

  app.put<{ Params: { id: string } }>('/api/level-gifts/:id/bindings', async (request, reply) => {
    const body = z
      .object({
        items: z.array(giftItemSchema),
        commands: z.array(giftCommandSchema),
      })
      .parse(request.body);

    const existing = await prisma.levelGift.findUnique({ where: { id: request.params.id } });
    if (!existing) {
      return reply.status(404).send({ message: 'Level gift not found' });
    }

    await prisma.$transaction([
      prisma.levelGiftItem.deleteMany({ where: { levelGiftId: request.params.id } }),
      prisma.levelGiftCommand.deleteMany({ where: { levelGiftId: request.params.id } }),
      ...(body.items.length
        ? [
            prisma.levelGiftItem.createMany({
              data: body.items.map((item) => ({
                ...item,
                levelGiftId: request.params.id,
                description: item.description ?? null,
              })),
            }),
          ]
        : []),
      ...(body.commands.length
        ? [
            prisma.levelGiftCommand.createMany({
              data: body.commands.map((command) => ({
                ...command,
                levelGiftId: request.params.id,
                description: command.description ?? null,
              })),
            }),
          ]
        : []),
    ]);

    const gift = await loadGift(request.params.id);
    if (!gift) {
      return reply.status(404).send({ message: 'Level gift not found' });
    }
    const sync = await syncLevelGiftToAllServers(gift);
    return { gift, sync };
  });
}
