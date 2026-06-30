import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import { serverRoutes } from './routes/servers.js';
import { proxyRoutes } from './routes/proxy.js';
import { dashboardRoutes } from './routes/dashboard.js';
import { playerRoutes, pointsRoutes } from './routes/players.js';
import { pointsSettingsRoutes } from './routes/points-settings.js';
import { shopRoutes } from './routes/shop.js';
import { vipGiftRoutes } from './routes/vip-gifts.js';
import { cdKeyRoutes } from './routes/cd-keys.js';
import { levelGiftRoutes } from './routes/level-gifts.js';
import { pointLogRoutes } from './routes/point-log.js';
import { authRoutes } from './routes/auth.js';
import { registerAuthHook } from './plugins/auth.js';

const port = Number(process.env.PORT ?? 3001);
const host = process.env.HOST ?? '0.0.0.0';
const webOrigins = (process.env.WEB_ORIGIN ?? 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const app = Fastify({
  logger: true,
});

await app.register(cors, {
  origin: webOrigins.length === 1 ? webOrigins[0] : webOrigins,
  credentials: true,
});

await app.register(cookie);

app.get('/health', async () => ({
  status: 'ok',
  service: 'msk-panel-api',
  timestamp: new Date().toISOString(),
}));

await app.register(authRoutes);
await registerAuthHook(app);

await app.register(serverRoutes);
await app.register(proxyRoutes);
await app.register(dashboardRoutes);
await app.register(playerRoutes);
await app.register(pointsRoutes);
await app.register(pointsSettingsRoutes);
await app.register(shopRoutes);
await app.register(vipGiftRoutes);
await app.register(cdKeyRoutes);
await app.register(levelGiftRoutes);
await app.register(pointLogRoutes);

try {
  await app.listen({ port, host });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
