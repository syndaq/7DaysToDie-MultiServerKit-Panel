import type { FastifyRequest } from 'fastify';
import { ModApiError } from '@msk-panel/shared';
import { prisma } from './prisma.js';

export async function authenticateModIngest(request: FastifyRequest) {
  const serverId = String(request.headers['x-server-id'] ?? '');
  const apiKey = String(request.headers['x-api-key'] ?? '');

  if (!serverId || !apiKey) {
    throw new ModApiError(401, 'Missing X-Server-Id or X-Api-Key');
  }

  const server = await prisma.gameServer.findUnique({ where: { serverId } });
  if (!server || !server.enabled || server.apiKey !== apiKey) {
    throw new ModApiError(403, 'Invalid game server credentials');
  }

  return server;
}

export function deriveModWebSocketUrl(apiUrl: string): string {
  try {
    const url = new URL(apiUrl);
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    if (url.port === '8888' || url.port === '') {
      url.port = url.protocol === 'wss:' ? '' : '8889';
      if (url.port === '' && url.protocol === 'ws:') {
        url.port = '8889';
      }
    }
    url.pathname = '/ws';
    url.search = '';
    url.hash = '';
    return url.toString();
  } catch {
    return apiUrl.replace(/^http/, 'ws').replace(':8888', ':8889').replace(/\/?$/, '/ws');
  }
}
