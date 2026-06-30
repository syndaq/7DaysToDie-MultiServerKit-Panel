# Production Deployment

Run the full stack in Docker: PostgreSQL, Fastify API, and nginx serving the React build.

## Prerequisites

- Docker Engine 24+ with Compose v2
- Network access from the panel host to each game server on ports **8888** (REST) and **8889** (WebSocket)
- Game servers with `ApiOnly` enabled

## Configure environment

```bash
cp .env.example .env
```

Minimum production variables:

```env
PUBLIC_HOST=your-server-ip-or-domain
PANEL_URL=http://your-server-ip-or-domain
PANEL_PORT=80
SESSION_SECRET=replace-with-a-long-random-secret
POSTGRES_PASSWORD=replace-with-a-strong-db-password
COOKIE_SECURE=false
```

Set `COOKIE_SECURE=true` when serving over HTTPS.

## Build and start

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

The API container runs `prisma db push` on startup.

Open `PANEL_URL` and complete first-run admin setup.

## Services

| Service | Role |
|---------|------|
| `postgres` | PostgreSQL 16 |
| `api` | Fastify panel API on port 3001 (internal) |
| `web` | nginx on port 80 — static UI + `/api` and `/api/ws` proxy |

## Register game servers

See [[Server Registry]]. Each mod needs:

- `PanelUrl` pointing at this panel (e.g. `http://panel-host:80`)
- Matching `PanelApiKey` and `ServerId`

## Operations

```bash
# Logs
docker compose -f docker-compose.prod.yml logs -f api

# Rebuild after updates
docker compose -f docker-compose.prod.yml up -d --build

# Stop
docker compose -f docker-compose.prod.yml down
```

Back up the `postgres_data` volume regularly.

## Security

- Do not expose mod ports 8888/8889 to the internet
- Put TLS (Caddy, Traefik, nginx) in front of the panel when exposing it externally
- Use strong `SESSION_SECRET` and database passwords

## Dev vs production

| | Development | Production |
|---|-------------|------------|
| Database | `docker compose up -d` | Included in prod compose |
| App | `npm run dev` | Built Docker images |
| Web port | 5173 (Vite) | 80 (nginx) |
| API | 3001 direct | Proxied at `/api` |
