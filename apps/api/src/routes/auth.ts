import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { hashPassword, verifyPassword } from '../lib/password.js';
import {
  createSessionToken,
  getClearSessionCookieOptions,
  getSessionCookieName,
  getSessionCookieOptions,
  verifySessionToken,
} from '../lib/session.js';

const credentialsSchema = z.object({
  username: z.string().trim().min(3).max(32).regex(/^[a-zA-Z0-9_-]+$/),
  password: z.string().min(8).max(128),
});

function publicUser(user: { id: string; username: string }) {
  return { id: user.id, username: user.username };
}

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: z.string().min(8).max(128),
});

export async function authRoutes(app: FastifyInstance) {
  app.get('/api/auth/status', async (request) => {
    const adminCount = await prisma.adminUser.count();
    const setupRequired = adminCount === 0;

    const token = request.cookies[getSessionCookieName()];
    if (!token) {
      return { setupRequired, authenticated: false, user: null };
    }

    const session = await verifySessionToken(token);
    if (!session) {
      return { setupRequired, authenticated: false, user: null };
    }

    const user = await prisma.adminUser.findUnique({ where: { id: session.sub } });
    if (!user) {
      return { setupRequired, authenticated: false, user: null };
    }

    return {
      setupRequired,
      authenticated: true,
      user: publicUser(user),
    };
  });

  app.post('/api/auth/setup', async (request, reply) => {
    const adminCount = await prisma.adminUser.count();
    if (adminCount > 0) {
      return reply.status(403).send({ message: 'Setup already completed' });
    }

    const body = credentialsSchema.parse(request.body);
    const existing = await prisma.adminUser.findUnique({ where: { username: body.username } });
    if (existing) {
      return reply.status(409).send({ message: 'Username already taken' });
    }

    const user = await prisma.adminUser.create({
      data: {
        username: body.username,
        passwordHash: await hashPassword(body.password),
      },
    });

    const token = await createSessionToken({ sub: user.id, username: user.username });
    reply.setCookie(getSessionCookieName(), token, getSessionCookieOptions());

    return reply.status(201).send({
      setupRequired: false,
      authenticated: true,
      user: publicUser(user),
    });
  });

  app.post('/api/auth/login', async (request, reply) => {
    const body = credentialsSchema.parse(request.body);
    const user = await prisma.adminUser.findUnique({ where: { username: body.username } });

    if (!user || !(await verifyPassword(body.password, user.passwordHash))) {
      return reply.status(401).send({ message: 'Invalid username or password' });
    }

    const token = await createSessionToken({ sub: user.id, username: user.username });
    reply.setCookie(getSessionCookieName(), token, getSessionCookieOptions());

    return {
      setupRequired: false,
      authenticated: true,
      user: publicUser(user),
    };
  });

  app.post('/api/auth/logout', async (_request, reply) => {
    reply.clearCookie(getSessionCookieName(), getClearSessionCookieOptions());
    return reply.status(204).send();
  });

  app.get('/api/auth/me', async (request, reply) => {
    if (!request.user) {
      return reply.status(401).send({ message: 'Authentication required' });
    }

    const user = await prisma.adminUser.findUnique({ where: { id: request.user.sub } });
    if (!user) {
      return reply.status(401).send({ message: 'Authentication required' });
    }

    return publicUser(user);
  });

  app.post('/api/auth/change-password', async (request, reply) => {
    if (!request.user) {
      return reply.status(401).send({ message: 'Authentication required' });
    }

    const body = changePasswordSchema.parse(request.body);
    const user = await prisma.adminUser.findUnique({ where: { id: request.user.sub } });
    if (!user) {
      return reply.status(401).send({ message: 'Authentication required' });
    }

    if (!(await verifyPassword(body.currentPassword, user.passwordHash))) {
      return reply.status(401).send({ message: 'Current password is incorrect' });
    }

    await prisma.adminUser.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(body.newPassword) },
    });

    return { message: 'Password updated' };
  });
}
