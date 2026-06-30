import type { FastifyInstance } from 'fastify';
import type { DashboardSummary, ModServerStats } from '@msk-panel/shared';
import { ModApiError } from '@msk-panel/shared';
import { prisma } from '../lib/prisma.js';
import { createModClient } from '../lib/mod.js';
import { probeServer } from './servers-health.js';

export async function dashboardRoutes(app: FastifyInstance) {
  app.get('/api/dashboard', async () => {
    const servers = await prisma.gameServer.findMany({
      where: { enabled: true },
      orderBy: { name: 'asc' },
    });

    const playerCount = await prisma.player.count();

    const serverResults = await Promise.all(
      servers.map(async (server) => {
        const health = await probeServer(server);
        let stats: ModServerStats | null = null;
        let statsError: string | null = null;

        if (health.online) {
          try {
            const client = createModClient(server);
            stats = await client.getStats();
          } catch (error) {
            statsError = error instanceof ModApiError ? error.message : 'Failed to load stats';
          }
        }

        return {
          id: server.id,
          serverId: server.serverId,
          name: server.name,
          online: health.online,
          latencyMs: health.latencyMs,
          stats,
          error: health.error ?? statsError,
        };
      }),
    );

    const summary: DashboardSummary = {
      serverCount: servers.length,
      serversOnline: serverResults.filter((s) => s.online).length,
      totalOnlinePlayers: serverResults.reduce(
        (sum, s) => sum + (s.stats?.onlinePlayers ?? 0),
        0,
      ),
      totalRegisteredPlayers: playerCount,
      servers: serverResults,
    };

    return summary;
  });
}
