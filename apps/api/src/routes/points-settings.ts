import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { defaultPointsSystemSettings } from '../lib/cluster-defaults.js';
import { syncPointsSettingsToAllServers } from '../lib/cluster-sync.js';

const settingsSchema = z.object({
  isEnabled: z.boolean(),
  signInCmd: z.string(),
  signInInterval: z.number().int().min(0),
  signInRewardPoints: z.number().int().min(0),
  signInSuccessTip: z.string(),
  signInFailureTip: z.string(),
  queryPointsCmd: z.string(),
  queryPointsTip: z.string(),
  isCurrencyExchangeEnabled: z.boolean(),
  currencyToPointsExchangeRate: z.number(),
  currencyExchangeCmd: z.string(),
  exchangeSuccessTip: z.string(),
  exchangeFailureTip: z.string(),
});

async function getOrCreateSettings() {
  let settings = await prisma.pointsSystemSettings.findUnique({ where: { id: 'default' } });
  if (!settings) {
    settings = await prisma.pointsSystemSettings.create({
      data: { id: 'default', ...defaultPointsSystemSettings },
    });
  }
  return settings;
}

export async function pointsSettingsRoutes(app: FastifyInstance) {
  app.get('/api/points/settings', async () => getOrCreateSettings());

  app.put('/api/points/settings', async (request) => {
    const body = settingsSchema.parse(request.body);
    const settings = await prisma.pointsSystemSettings.upsert({
      where: { id: 'default' },
      create: { id: 'default', ...body },
      update: body,
    });
    const sync = await syncPointsSettingsToAllServers(settings);
    return { settings, sync };
  });

  app.delete('/api/points/settings', async () => {
    const settings = await prisma.pointsSystemSettings.upsert({
      where: { id: 'default' },
      create: { id: 'default', ...defaultPointsSystemSettings },
      update: defaultPointsSystemSettings,
    });
    const sync = await syncPointsSettingsToAllServers(settings);
    return { settings, sync };
  });
}
