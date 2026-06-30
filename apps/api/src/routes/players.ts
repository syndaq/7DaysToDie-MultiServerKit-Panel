import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ModApiError } from '@msk-panel/shared';
import { prisma } from '../lib/prisma.js';
import { getGameServerOrThrow, proxyToMod } from '../lib/mod-proxy.js';
import { deletePlayerPointsFromAllServers, syncPlayerPointsToAllServers } from '../lib/cluster-sync.js';
import { logPointChange } from './point-log.js';
import type { ModOnlinePlayer } from '@msk-panel/shared';

export async function playerRoutes(app: FastifyInstance) {
  app.get('/api/players/online', async () => {
    const servers = await prisma.gameServer.findMany({ where: { enabled: true } });

    const results = await Promise.all(
      servers.map(async (server) => {
        try {
          const result = await proxyToMod(server, 'GET', '/api/OnlinePlayers');
          const players = (result.data as ModOnlinePlayer[]) ?? [];
          return players.map((player) => ({
            ...player,
            serverId: server.serverId,
            serverName: server.name,
            gameServerId: server.id,
          }));
        } catch {
          return [];
        }
      }),
    );

    return results.flat();
  });

  app.get<{ Params: { id: string } }>('/api/servers/:id/players/online', async (request, reply) => {
    try {
      const server = await getGameServerOrThrow(request.params.id);
      const result = await proxyToMod(server, 'GET', '/api/OnlinePlayers');
      return result.data;
    } catch (error) {
      if (error instanceof ModApiError) {
        return reply.status(error.statusCode || 502).send({ message: error.message });
      }
      throw error;
    }
  });

  app.get<{ Params: { id: string } }>('/api/servers/:id/players/history', async (request, reply) => {
    try {
      const server = await getGameServerOrThrow(request.params.id);
      const query = request.query as Record<string, string | number | boolean | undefined>;
      const result = await proxyToMod(server, 'GET', '/api/HistoryPlayers', { query });
      return result.data;
    } catch (error) {
      if (error instanceof ModApiError) {
        return reply.status(error.statusCode || 502).send({ message: error.message });
      }
      throw error;
    }
  });
}

const upsertPlayerSchema = z.object({
  platformId: z.string().min(1),
  displayName: z.string().min(1),
  points: z.number().int().min(0).optional(),
  lastSignInAt: z.string().datetime().optional().nullable(),
});

const updatePointsSchema = z.object({
  points: z.number().int().min(0),
  displayName: z.string().min(1).optional(),
  lastSignInAt: z.string().datetime().optional().nullable(),
});

export async function pointsRoutes(app: FastifyInstance) {
  app.get('/api/points', async (request) => {
    const query = request.query as { search?: string; page?: string; pageSize?: string };
    const search = query.search?.trim();
    const page = Math.max(1, Number(query.page ?? 1));
    const pageSize = Math.min(200, Math.max(1, Number(query.pageSize ?? 20)));
    const where = search
      ? {
          OR: [
            { displayName: { contains: search, mode: 'insensitive' as const } },
            { platformId: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : undefined;

    const [items, total] = await Promise.all([
      prisma.player.findMany({
        where,
        orderBy: { points: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.player.count({ where }),
    ]);

    return { items, total, page, pageSize };
  });

  app.post('/api/points', async (request, reply) => {
    const body = upsertPlayerSchema.parse(request.body);
    const player = await prisma.player.upsert({
      where: { platformId: body.platformId },
      create: {
        platformId: body.platformId,
        displayName: body.displayName,
        points: body.points ?? 0,
        lastSignInAt: body.lastSignInAt ? new Date(body.lastSignInAt) : null,
      },
      update: {
        displayName: body.displayName,
        ...(body.points !== undefined ? { points: body.points } : {}),
        ...(body.lastSignInAt !== undefined
          ? { lastSignInAt: body.lastSignInAt ? new Date(body.lastSignInAt) : null }
          : {}),
      },
    });
    if (body.points && body.points > 0) {
      await logPointChange({
        playerId: player.platformId,
        playerName: player.displayName,
        category: 'Web Panel',
        type: 'Income',
        change: body.points,
        balance: player.points,
        note: 'Points created via panel',
      });
    }
    const sync = await syncPlayerPointsToAllServers(player);
    return reply.status(201).send({ player, sync });
  });

  app.put('/api/points/upsert', async (request) => {
    const body = upsertPlayerSchema.extend({ points: z.number().int().min(0) }).parse(request.body);
    const existing = await prisma.player.findUnique({ where: { platformId: body.platformId } });
    const player = await prisma.player.upsert({
      where: { platformId: body.platformId },
      create: {
        platformId: body.platformId,
        displayName: body.displayName,
        points: body.points,
        lastSignInAt: body.lastSignInAt ? new Date(body.lastSignInAt) : null,
      },
      update: {
        displayName: body.displayName,
        points: body.points,
        ...(body.lastSignInAt !== undefined
          ? { lastSignInAt: body.lastSignInAt ? new Date(body.lastSignInAt) : null }
          : {}),
      },
    });
    const delta = existing ? body.points - existing.points : body.points;
    if (delta !== 0) {
      await logPointChange({
        playerId: player.platformId,
        playerName: player.displayName,
        category: 'Web Panel',
        type: delta > 0 ? 'Income' : 'Expense',
        change: delta,
        balance: player.points,
        note: 'Points updated via panel',
      });
    }
    const sync = await syncPlayerPointsToAllServers(player);
    return { player, sync };
  });

  app.patch<{ Params: { id: string } }>('/api/points/:id', async (request, reply) => {
    const body = updatePointsSchema.parse(request.body);
    try {
      const existing = await prisma.player.findUnique({ where: { id: request.params.id } });
      if (!existing) {
        return reply.status(404).send({ message: 'Player not found' });
      }
      const player = await prisma.player.update({
        where: { id: request.params.id },
        data: {
          ...(body.displayName !== undefined ? { displayName: body.displayName } : {}),
          points: body.points,
          ...(body.lastSignInAt !== undefined
            ? { lastSignInAt: body.lastSignInAt ? new Date(body.lastSignInAt) : null }
            : {}),
        },
      });
      const delta = body.points - existing.points;
      if (delta !== 0) {
        await logPointChange({
          playerId: player.platformId,
          playerName: player.displayName,
          category: 'Web Panel',
          type: delta > 0 ? 'Income' : 'Expense',
          change: delta,
          balance: player.points,
          note: 'Points updated via panel',
        });
      }
      const sync = await syncPlayerPointsToAllServers(player);
      return { player, sync };
    } catch {
      return reply.status(404).send({ message: 'Player not found' });
    }
  });

  app.post('/api/points/batch-delete', async (request, reply) => {
    const { ids } = z.object({ ids: z.array(z.string().min(1)) }).parse(request.body);
    const players = await prisma.player.findMany({ where: { id: { in: ids } } });
    if (players.length === 0) {
      return reply.status(404).send({ message: 'No players found' });
    }
    await prisma.player.deleteMany({ where: { id: { in: ids } } });
    for (const player of players) {
      if (player.points > 0) {
        await logPointChange({
          playerId: player.platformId,
          playerName: player.displayName,
          category: 'Web Panel',
          type: 'Expense',
          change: -player.points,
          balance: 0,
          note: 'Player removed from panel',
        });
      }
    }
    const syncResults = await Promise.all(
      players.map((player) => deletePlayerPointsFromAllServers(player.platformId)),
    );
    return { sync: syncResults.flat() };
  });

  app.delete<{ Params: { id: string } }>('/api/points/:id', async (request, reply) => {
    try {
      const existing = await prisma.player.findUnique({ where: { id: request.params.id } });
      if (!existing) {
        return reply.status(404).send({ message: 'Player not found' });
      }
      await prisma.player.delete({ where: { id: request.params.id } });
      if (existing.points > 0) {
        await logPointChange({
          playerId: existing.platformId,
          playerName: existing.displayName,
          category: 'Web Panel',
          type: 'Expense',
          change: -existing.points,
          balance: 0,
          note: 'Player removed from panel',
        });
      }
      const sync = await deletePlayerPointsFromAllServers(existing.platformId);
      return reply.status(200).send({ sync });
    } catch {
      return reply.status(404).send({ message: 'Player not found' });
    }
  });
}
