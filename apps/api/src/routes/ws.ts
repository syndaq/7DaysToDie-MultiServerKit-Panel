import type { FastifyInstance } from 'fastify';
import websocket from '@fastify/websocket';
import { verifySessionToken } from '../lib/session.js';
import { prisma } from '../lib/prisma.js';
import { modWebSocketHub } from '../lib/mod-ws-hub.js';

function parseSessionCookie(cookieHeader?: string): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(/(?:^|;\s*)msk_session=([^;]+)/);
  return match?.[1] ?? null;
}

export async function wsRoutes(app: FastifyInstance) {
  await app.register(websocket);

  modWebSocketHub.startHeartbeat();

  app.get('/api/ws', { websocket: true }, async (socket, request) => {
    const token = parseSessionCookie(request.headers.cookie);
    if (!token) {
      socket.close(4401, 'Authentication required');
      return;
    }

    const session = await verifySessionToken(token);
    if (!session) {
      socket.close(4401, 'Session expired');
      return;
    }

    const servers = await prisma.gameServer.findMany({ where: { enabled: true }, orderBy: { name: 'asc' } });
    modWebSocketHub.subscribeClient(socket, servers);

    socket.send(
      JSON.stringify({
        modEventType: 'PanelConnected',
        data: {
          servers: servers.map((server) => ({
            id: server.id,
            serverId: server.serverId,
            name: server.name,
          })),
        },
        receivedAt: new Date().toISOString(),
      }),
    );
  });
}
