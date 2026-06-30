import type { FastifyInstance } from 'fastify';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { ModApiError } from '@msk-panel/shared';
import { prisma } from '../lib/prisma.js';
import { createModClient, toPublicServer } from '../lib/mod.js';
import { modWebSocketHub } from '../lib/mod-ws-hub.js';
import { probeServer } from './servers-health.js';

const createServerSchema = z.object({
  serverId: z.string().trim().min(1).max(64),
  name: z.string().trim().min(1).max(128),
  apiUrl: z.string().trim().url(),
  apiKey: z.string().trim().min(8),
  enabled: z.boolean().optional(),
});

const updateServerSchema = z.object({
  name: z.string().trim().min(1).max(128).optional(),
  apiUrl: z.string().trim().url().optional(),
  apiKey: z.string().trim().min(8).optional(),
  enabled: z.boolean().optional(),
});

export async function serverRoutes(app: FastifyInstance) {
  app.get('/api/servers', async () => {
    const servers = await prisma.gameServer.findMany({ orderBy: { name: 'asc' } });
    return servers.map(toPublicServer);
  });

  app.get('/api/servers/health/all', async () => {
    const servers = await prisma.gameServer.findMany({ where: { enabled: true } });
    return Promise.all(servers.map(probeServer));
  });

  app.get<{ Params: { id: string } }>('/api/servers/:id', async (request, reply) => {
    const server = await prisma.gameServer.findUnique({ where: { id: request.params.id } });
    if (!server) {
      return reply.status(404).send({ message: 'Server not found' });
    }
    return toPublicServer(server);
  });

  app.post('/api/servers', async (request, reply) => {
    const body = createServerSchema.parse(request.body);
    const server = await prisma.gameServer.create({ data: body });
    return reply.status(201).send(toPublicServer(server));
  });

  app.patch<{ Params: { id: string } }>('/api/servers/:id', async (request, reply) => {
    const body = updateServerSchema.parse(request.body);
    try {
      const server = await prisma.gameServer.update({
        where: { id: request.params.id },
        data: body,
      });
      return toPublicServer(server);
    } catch {
      return reply.status(404).send({ message: 'Server not found' });
    }
  });

  app.delete<{ Params: { id: string } }>('/api/servers/:id', async (request, reply) => {
    const { id } = request.params;
    try {
      await prisma.gameServer.delete({ where: { id } });
      modWebSocketHub.teardownServer(id);
      return reply.code(204).send();
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return reply.status(404).send({ message: 'Server not found' });
      }
      request.log.error(error, 'Failed to delete game server');
      return reply.status(500).send({ message: 'Failed to delete server' });
    }
  });

  app.get<{ Params: { id: string } }>('/api/servers/:id/health', async (request, reply) => {
    const server = await prisma.gameServer.findUnique({ where: { id: request.params.id } });
    if (!server) {
      return reply.status(404).send({ message: 'Server not found' });
    }
    return probeServer(server);
  });

  app.get<{ Params: { id: string } }>('/api/servers/:id/stats', async (request, reply) => {
    const server = await prisma.gameServer.findUnique({ where: { id: request.params.id } });
    if (!server) {
      return reply.status(404).send({ message: 'Server not found' });
    }
    if (!server.enabled) {
      return reply.status(403).send({ message: 'Server is disabled' });
    }

    try {
      const client = createModClient(server);
      return await client.getStats();
    } catch (error) {
      const status = error instanceof ModApiError ? error.statusCode || 502 : 502;
      return reply.status(status).send({
        message: error instanceof Error ? error.message : 'Failed to fetch stats',
      });
    }
  });
}
