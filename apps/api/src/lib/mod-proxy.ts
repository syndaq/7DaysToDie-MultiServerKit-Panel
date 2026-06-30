import type { GameServer } from '@prisma/client';
import { ModApiError } from '@msk-panel/shared';
import { prisma } from './prisma.js';
import { createModClient } from './mod.js';

export async function getGameServerOrThrow(id: string): Promise<GameServer> {
  const server = await prisma.gameServer.findUnique({ where: { id } });
  if (!server) {
    throw new ModApiError(404, 'Server not found');
  }
  if (!server.enabled) {
    throw new ModApiError(403, 'Server is disabled');
  }
  return server;
}

export async function proxyToMod(
  server: GameServer,
  method: string,
  modPath: string,
  options?: {
    body?: unknown;
    query?: Record<string, string | string[] | number | boolean | undefined>;
    headers?: Record<string, string>;
  },
) {
  const client = createModClient(server);
  const path = modPath.startsWith('/') ? modPath : `/${modPath}`;
  return client.requestRaw(method, path, options);
}
