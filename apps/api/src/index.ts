import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { serverRoutes } from './routes/servers.js';

const port = Number(process.env.PORT ?? 3001);
const host = process.env.HOST ?? '0.0.0.0';
const webOrigin = process.env.WEB_ORIGIN ?? 'http://localhost:5173';

const app = Fastify({
  logger: true,
});

await app.register(cors, {
  origin: webOrigin,
  credentials: true,
});

app.get('/health', async () => ({
  status: 'ok',
  service: 'msk-panel-api',
  timestamp: new Date().toISOString(),
}));

await app.register(serverRoutes);

try {
  await app.listen({ port, host });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
