import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ModApiError } from '@msk-panel/shared';
import { prisma } from '../lib/prisma.js';
import { createModClient, toPublicServer } from '../lib/mod.js';

const createServerSchema = z.object({
  serverId: z.string().min(1).max(64),
  name: z.string().min(1).max(128),
  apiUrl: z.string().url(),
  apiKey: z.string().min(8),
  enabled: z.boolean().optional(),
});

const updateServerSchema = z.object({
  name: z.string().min(1).max(128).optional(),
  apiUrl: z.string().url().optional(),
  apiKey: z.string().min(8).optional(),
  enabled: z.boolean().optional(),
});

async function probeServer(server: { id: string; serverId: string; name: string; apiUrl: string; apiKey: string }) {
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
    try {
      await prisma.gameServer.delete({ where: { id: request.params.id } });
      return reply.status(204).send();
    } catch {
      return reply.status(404).send({ message: 'Server not found' });
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
