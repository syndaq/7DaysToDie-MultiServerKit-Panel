import { ModApiError } from '@msk-panel/shared';
import { prisma } from '../lib/prisma.js';
import { createModClient } from '../lib/mod.js';

export async function probeServer(server: {
  id: string;
  serverId: string;
  name: string;
  apiUrl: string;
  apiKey: string;
}) {
  const started = Date.now();
  try {
    const client = createModClient(server);
    await client.getStats();
    const latencyMs = Date.now() - started;
    await prisma.serverHealthCheck.create({
      data: { gameServerId: server.id, online: true, latencyMs },
    });
    return {
      serverId: server.serverId,
      name: server.name,
      online: true,
      latencyMs,
      error: null,
      checkedAt: new Date().toISOString(),
    };
  } catch (error) {
    const message = error instanceof ModApiError ? error.message : 'Health check failed';
    await prisma.serverHealthCheck.create({
      data: { gameServerId: server.id, online: false, error: message },
    });
    return {
      serverId: server.serverId,
      name: server.name,
      online: false,
      latencyMs: null,
      error: message,
      checkedAt: new Date().toISOString(),
    };
  }
}
