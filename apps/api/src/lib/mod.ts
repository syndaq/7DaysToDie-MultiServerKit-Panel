import type { GameServer } from '@prisma/client';
import { ModApiClient } from '@msk-panel/shared';

export function createModClient(server: Pick<GameServer, 'apiUrl' | 'apiKey'>): ModApiClient {
  return new ModApiClient({
    apiUrl: server.apiUrl,
    apiKey: server.apiKey,
  });
}

export function toPublicServer(server: GameServer) {
  const { apiKey: _apiKey, ...rest } = server;
  return rest;
}
