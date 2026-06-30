import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';

const defaultCategories = {
  shopPurchase: true,
  signIn: true,
  pointsTransfer: true,
  teleport: true,
  killReward: false,
  lottery: true,
  redeemCode: true,
  levelGift: true,
  vipGift: true,
  webPanel: true,
  externalMod: true,
  other: true,
};

async function getOrCreateSettings() {
  let settings = await prisma.pointLogSettings.findUnique({ where: { id: 'default' } });
  if (!settings) {
    settings = await prisma.pointLogSettings.create({
      data: { id: 'default', ...defaultCategories },
    });
  }
  return settings;
}

const settingsSchema = z.object({
  enabled: z.boolean(),
  retentionDays: z.number().int().min(0),
  shopPurchase: z.boolean(),
  signIn: z.boolean(),
  pointsTransfer: z.boolean(),
  teleport: z.boolean(),
  killReward: z.boolean(),
  lottery: z.boolean(),
  redeemCode: z.boolean(),
  levelGift: z.boolean(),
  vipGift: z.boolean(),
  webPanel: z.boolean(),
  externalMod: z.boolean(),
  other: z.boolean(),
});

const categoryFieldMap: Record<string, keyof typeof defaultCategories> = {
  'Shop Purchase': 'shopPurchase',
  'Sign-in': 'signIn',
  'Points Transfer': 'pointsTransfer',
  Teleport: 'teleport',
  'Kill Reward': 'killReward',
  Lottery: 'lottery',
  'Redeem Code': 'redeemCode',
  'Level Gift': 'levelGift',
  'VIP Gift': 'vipGift',
  'Web Panel': 'webPanel',
  'External Mod': 'externalMod',
  Other: 'other',
};

export async function logPointChange(input: {
  playerId: string;
  playerName: string;
  category: string;
  type: 'Income' | 'Expense';
  change: number;
  balance: number;
  note?: string;
  gameServerId?: string;
}) {
  const settings = await getOrCreateSettings();
  if (!settings.enabled) return;

  const field = categoryFieldMap[input.category] ?? 'other';
  if (settings[field] === false) return;

  await prisma.pointLogEntry.create({ data: input });
}

export async function pointLogRoutes(app: FastifyInstance) {
  app.get('/api/point-log/settings', async () => getOrCreateSettings());

  app.put('/api/point-log/settings', async (request) => {
    const body = settingsSchema.parse(request.body);
    return prisma.pointLogSettings.upsert({
      where: { id: 'default' },
      create: { id: 'default', ...body },
      update: body,
    });
  });

  app.get('/api/point-log', async (request) => {
    const query = request.query as {
      page?: string;
      pageSize?: string;
      keyword?: string;
      category?: string;
      type?: string;
      start?: string;
      end?: string;
    };

    const page = Math.max(1, Number(query.page ?? 1));
    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize ?? 20)));
    const keyword = query.keyword?.trim();
    const category = query.category?.trim();
    const type = query.type?.trim();

    const where = {
      ...(keyword
        ? {
            OR: [
              { playerId: { contains: keyword, mode: 'insensitive' as const } },
              { playerName: { contains: keyword, mode: 'insensitive' as const } },
              { note: { contains: keyword, mode: 'insensitive' as const } },
            ],
          }
        : {}),
      ...(category ? { category } : {}),
      ...(type ? { type } : {}),
      ...(query.start || query.end
        ? {
            createdAt: {
              ...(query.start ? { gte: new Date(query.start) } : {}),
              ...(query.end ? { lte: new Date(query.end) } : {}),
            },
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.pointLogEntry.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.pointLogEntry.count({ where }),
    ]);

    return { items, total, page, pageSize };
  });

  app.delete<{ Body: { ids: string[] } }>('/api/point-log', async (request, reply) => {
    const ids = z.object({ ids: z.array(z.string().min(1)).min(1) }).parse(request.body).ids;
    await prisma.pointLogEntry.deleteMany({ where: { id: { in: ids } } });
    return reply.status(204).send();
  });
}
