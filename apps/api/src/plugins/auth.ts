import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { verifySessionToken, type SessionPayload } from '../lib/session.js';

declare module 'fastify' {
  interface FastifyRequest {
    user?: SessionPayload;
  }
}

const PUBLIC_ROUTES: Array<{ method: string; path: string }> = [
  { method: 'GET', path: '/health' },
  { method: 'GET', path: '/api/auth/status' },
  { method: 'POST', path: '/api/auth/setup' },
  { method: 'POST', path: '/api/auth/login' },
  { method: 'POST', path: '/api/auth/logout' },
];

function isPublicRoute(method: string, url: string): boolean {
  const path = url.split('?')[0] ?? url;
  if (PUBLIC_ROUTES.some((route) => route.method === method && route.path === path)) {
    return true;
  }
  if (method === 'GET' && path.startsWith('/api/points/by-platform/')) {
    return true;
  }
  if (method === 'POST' && path === '/api/points/ingest') {
    return true;
  }
  if (method === 'GET' && path === '/api/ws') {
    return true;
  }
  return false;
}

export async function registerAuthHook(app: FastifyInstance) {
  app.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    if (request.method === 'OPTIONS') return;
    if (isPublicRoute(request.method, request.url)) return;

    const token = request.cookies.msk_session;
    if (!token) {
      return reply.status(401).send({ message: 'Authentication required' });
    }

    const session = await verifySessionToken(token);
    if (!session) {
      reply.clearCookie('msk_session', { path: '/' });
      return reply.status(401).send({ message: 'Session expired' });
    }

    request.user = session;
  });
}
