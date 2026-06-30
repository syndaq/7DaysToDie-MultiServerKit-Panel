import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { ModApiError } from '@msk-panel/shared';
import { prisma } from '../lib/prisma.js';
import { authenticateModIngest } from '../lib/mod-ingest-auth.js';
import { logPointChange } from './point-log.js';

const ingestSchema = z.object({
  platformId: z.string().min(1),
  displayName: z.string().optional(),
  change: z.number().int().optional(),
  absolutePoints: z.number().int().min(0).optional(),
  category: z.string().optional(),
  type: z.enum(['Income', 'Expense']).optional(),
  note: z.string().optional(),
  lastSignInAt: z.string().datetime().optional().nullable(),
});

export async function pointsIngestRoutes(app: FastifyInstance) {
  app.get<{ Params: { platformId: string } }>(
    '/api/points/by-platform/:platformId',
    async (request, reply) => {
      try {
        await authenticateModIngest(request);
        const player = await prisma.player.findUnique({
          where: { platformId: request.params.platformId },
        });
        if (!player) {
          return reply.status(404).send({ message: 'Player not found' });
        }
        return {
          platformId: player.platformId,
          displayName: player.displayName,
          points: player.points,
          lastSignInAt: player.lastSignInAt?.toISOString() ?? null,
        };
      } catch (error) {
        if (error instanceof ModApiError) {
          return reply.status(error.statusCode || 502).send({ message: error.message });
        }
        throw error;
      }
    },
  );

  app.post('/api/points/ingest', async (request, reply) => {
    try {
      const server = await authenticateModIngest(request);
      const body = ingestSchema.parse(request.body);

      const existing = await prisma.player.findUnique({ where: { platformId: body.platformId } });
      const nextPoints =
        body.absolutePoints != null
          ? body.absolutePoints
          : (existing?.points ?? 0) + (body.change ?? 0);

      if (nextPoints < 0) {
        return reply.status(400).send({ message: 'Points balance cannot be negative' });
      }

      const player = await prisma.player.upsert({
        where: { platformId: body.platformId },
        create: {
          platformId: body.platformId,
          displayName: body.displayName || body.platformId,
          points: nextPoints,
          lastSignInAt: body.lastSignInAt ? new Date(body.lastSignInAt) : null,
        },
        update: {
          ...(body.displayName ? { displayName: body.displayName } : {}),
          points: nextPoints,
          ...(body.lastSignInAt !== undefined
            ? { lastSignInAt: body.lastSignInAt ? new Date(body.lastSignInAt) : null }
            : {}),
        },
      });

      const delta =
        body.absolutePoints != null
          ? body.absolutePoints - (existing?.points ?? 0)
          : (body.change ?? 0);

      if (delta !== 0) {
        await logPointChange({
          playerId: player.platformId,
          playerName: player.displayName,
          category: body.category ?? 'External Mod',
          type: body.type ?? (delta > 0 ? 'Income' : 'Expense'),
          change: delta,
          balance: player.points,
          note: body.note ?? `Ingest from server ${server.serverId}`,
          gameServerId: server.id,
        });
      }

      return {
        platformId: player.platformId,
        displayName: player.displayName,
        points: player.points,
        lastSignInAt: player.lastSignInAt?.toISOString() ?? null,
      };
    } catch (error) {
      if (error instanceof ModApiError) {
        return reply.status(error.statusCode || 502).send({ message: error.message });
      }
      throw error;
    }
  });
}
