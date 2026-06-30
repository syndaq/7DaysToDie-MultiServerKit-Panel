import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { defaultVipGiftSettings } from '../lib/cluster-defaults.js';
import { deleteVipGiftFromAllServers, syncVipGiftSettingsToAllServers, syncVipGiftToAllServers } from '../lib/cluster-sync.js';

const settingsSchema = z.object({
  isEnabled: z.boolean(),
  claimCmd: z.string(),
  hasClaimedTip: z.string(),
  nonVipTip: z.string(),
  claimSuccessTip: z.string(),
});

const giftSchema = z.object({
  id: z.string().min(1),
  displayName: z.string().min(1),
  name: z.string().min(1),
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
  let settings = await prisma.vipGiftSettings.findUnique({ where: { id: 'default' } });
  if (!settings) {
    settings = await prisma.vipGiftSettings.create({
      data: { id: 'default', ...defaultVipGiftSettings },
    });
  }
  return settings;
}

async function loadGift(id: string) {
  return prisma.vipGift.findUnique({
    where: { id },
    include: { items: { orderBy: { sortOrder: 'asc' } }, commands: { orderBy: { sortOrder: 'asc' } } },
  });
}

export async function vipGiftRoutes(app: FastifyInstance) {
  app.get('/api/vip-gifts/settings', async () => getOrCreateSettings());

  app.put('/api/vip-gifts/settings', async (request) => {
    const body = settingsSchema.parse(request.body);
    const settings = await prisma.vipGiftSettings.upsert({
      where: { id: 'default' },
      create: { id: 'default', ...body },
      update: body,
    });
    const sync = await syncVipGiftSettingsToAllServers(settings);
    return { settings, sync };
  });

  app.delete('/api/vip-gifts/settings', async () => {
    const settings = await prisma.vipGiftSettings.upsert({
      where: { id: 'default' },
      create: { id: 'default', ...defaultVipGiftSettings },
      update: defaultVipGiftSettings,
    });
    const sync = await syncVipGiftSettingsToAllServers(settings);
    return { settings, sync };
  });

  app.get('/api/vip-gifts', async (request) => {
    const query = request.query as { search?: string; page?: string; pageSize?: string };
    const search = query.search?.trim();
    const page = Math.max(1, Number(query.page ?? 1));
    const pageSize = Math.min(200, Math.max(1, Number(query.pageSize ?? 20)));
    const where = search
      ? {
          OR: [
            { id: { contains: search, mode: 'insensitive' as const } },
            { displayName: { contains: search, mode: 'insensitive' as const } },
            { name: { contains: search, mode: 'insensitive' as const } },
            { description: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : undefined;

    const [items, total] = await Promise.all([
      prisma.vipGift.findMany({
        where,
        include: { items: { orderBy: { sortOrder: 'asc' } }, commands: { orderBy: { sortOrder: 'asc' } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.vipGift.count({ where }),
    ]);

    return { items, total, page, pageSize };
  });

  app.post('/api/vip-gifts', async (request, reply) => {
    const body = giftSchema.parse(request.body);
    const gift = await prisma.vipGift.create({
      data: {
        id: body.id,
        displayName: body.displayName,
        name: body.name,
        claimState: body.claimState ?? false,
        totalClaimCount: body.totalClaimCount ?? 0,
        lastClaimAt: body.lastClaimAt ? new Date(body.lastClaimAt) : null,
        description: body.description ?? null,
      },
      include: { items: true, commands: true },
    });
    const sync = await syncVipGiftToAllServers(gift);
    return reply.status(201).send({ gift, sync });
  });

  app.put<{ Params: { id: string } }>('/api/vip-gifts/:id', async (request, reply) => {
    const body = giftSchema.omit({ id: true }).parse(request.body);
    try {
      const gift = await prisma.vipGift.update({
        where: { id: request.params.id },
        data: {
          displayName: body.displayName,
          name: body.name,
          claimState: body.claimState,
          totalClaimCount: body.totalClaimCount,
          lastClaimAt:
            body.lastClaimAt !== undefined
              ? body.lastClaimAt
                ? new Date(body.lastClaimAt)
                : null
              : undefined,
          description: body.description ?? null,
        },
        include: { items: { orderBy: { sortOrder: 'asc' } }, commands: { orderBy: { sortOrder: 'asc' } } },
      });
      const sync = await syncVipGiftToAllServers(gift);
      return { gift, sync };
    } catch {
      return reply.status(404).send({ message: 'VIP gift not found' });
    }
  });

  app.delete<{ Params: { id: string } }>('/api/vip-gifts/:id', async (request, reply) => {
    try {
      await prisma.vipGift.delete({ where: { id: request.params.id } });
      const sync = await deleteVipGiftFromAllServers(request.params.id);
      return reply.status(200).send({ sync });
    } catch {
      return reply.status(404).send({ message: 'VIP gift not found' });
    }
  });

  app.post('/api/vip-gifts/batch-delete', async (request) => {
    const { ids } = z.object({ ids: z.array(z.string().min(1)) }).parse(request.body);
    await prisma.vipGift.deleteMany({ where: { id: { in: ids } } });
    const syncResults = await Promise.all(ids.map((id) => deleteVipGiftFromAllServers(id)));
    return { sync: syncResults.flat() };
  });

  app.put<{ Params: { id: string } }>('/api/vip-gifts/:id/bindings', async (request, reply) => {
    const body = z
      .object({
        items: z.array(giftItemSchema),
        commands: z.array(giftCommandSchema),
      })
      .parse(request.body);

    const existing = await prisma.vipGift.findUnique({ where: { id: request.params.id } });
    if (!existing) {
      return reply.status(404).send({ message: 'VIP gift not found' });
    }

    await prisma.$transaction([
      prisma.vipGiftItem.deleteMany({ where: { vipGiftId: request.params.id } }),
      prisma.vipGiftCommand.deleteMany({ where: { vipGiftId: request.params.id } }),
      ...(body.items.length
        ? [
            prisma.vipGiftItem.createMany({
              data: body.items.map((item) => ({
                ...item,
                vipGiftId: request.params.id,
                description: item.description ?? null,
              })),
            }),
          ]
        : []),
      ...(body.commands.length
        ? [
            prisma.vipGiftCommand.createMany({
              data: body.commands.map((command) => ({
                ...command,
                vipGiftId: request.params.id,
                description: command.description ?? null,
              })),
            }),
          ]
        : []),
    ]);

    const gift = await loadGift(request.params.id);
    if (!gift) {
      return reply.status(404).send({ message: 'VIP gift not found' });
    }
    const sync = await syncVipGiftToAllServers(gift);
    return { gift, sync };
  });
}
