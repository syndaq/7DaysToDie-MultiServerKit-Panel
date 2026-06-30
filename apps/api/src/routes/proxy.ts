import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { ModApiError } from '@msk-panel/shared';
import { getGameServerOrThrow, proxyToMod } from '../lib/mod-proxy.js';

type ProxyParams = { id: string; '*': string };

async function handleProxy(
  request: FastifyRequest<{ Params: ProxyParams }>,
  reply: FastifyReply,
) {
  try {
    const server = await getGameServerOrThrow(request.params.id);
    const suffix = request.params['*'] ?? '';
    const modPath = `/api/${suffix}`.replace(/\/+/g, '/');
    const query = request.query as Record<string, string | number | boolean | undefined>;

    const result = await proxyToMod(server, request.method, modPath, {
      body: request.body,
      query,
    });

    reply.status(result.status);
    if (result.contentType) {
      reply.header('content-type', result.contentType);
    }
    if (typeof Buffer !== 'undefined' && Buffer.isBuffer(result.data)) {
      return reply.send(result.data);
    }
    return result.data;
  } catch (error) {
    if (error instanceof ModApiError) {
      return reply.status(error.statusCode || 502).send({ message: error.message });
    }
    throw error;
  }
}

export async function proxyRoutes(app: FastifyInstance) {
  const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const;
  for (const method of methods) {
    app.route({
      method,
      url: '/api/servers/:id/mod/*',
      handler: handleProxy,
    });
  }

  app.post<{ Params: { id: string }; Body: { command: string; inMainThread?: boolean } }>(
    '/api/servers/:id/console',
    async (request, reply) => {
      try {
        const server = await getGameServerOrThrow(request.params.id);
        const { command, inMainThread = false } = request.body;
        const result = await proxyToMod(server, 'POST', '/api/Server/ExecuteConsoleCommand', {
          query: { command, inMainThread },
        });
        return result.data;
      } catch (error) {
        if (error instanceof ModApiError) {
          return reply.status(error.statusCode || 502).send({ message: error.message });
        }
        throw error;
      }
    },
  );
}
