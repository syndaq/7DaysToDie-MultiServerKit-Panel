# Production deployment (Docker Compose)

This guide runs the full panel stack in Docker: PostgreSQL, Fastify API, and nginx serving the React build with `/api` and WebSocket proxying.

## Prerequisites

- Docker Engine 24+ with Compose v2
- Network access from the panel host to each game server mod API (default port **8888**) and WebSocket (default port **8889**)
- Game servers running [7DaysToDie-MultiServerKit](https://github.com/syndaq/7DaysToDie-MultiServerKit) with `ApiOnly` enabled

## 1. Configure environment

Copy the example file and edit production values:

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

Use `COOKIE_SECURE=true` when terminating TLS in front of the panel (recommended for internet-facing installs).

## 2. Build and start

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

The API container applies the Prisma schema to PostgreSQL on startup (`prisma db push`).

Open `PANEL_URL` in your browser and complete first-run admin setup.

## 3. Register game servers

In **Servers**, add each dedicated server:

| Field | Value |
|-------|--------|
| Server ID | Must match mod `ServerId` in `appsettings.json` |
| API URL | `http://game-host:8888` (reachable from the panel container) |
| API key | Must match mod `PanelApiKey` |

## 4. Enable cluster-native points on mods

On each game server, edit mod `Config/appsettings.json`:

```json
{
  "PanelUrl": "http://panel-host:80",
  "PanelApiKey": "same-key-as-panel-server-registry",
  "ServerId": "server-01",
  "ApiOnly": true
}
```

When `PanelUrl` is set:

- PostgreSQL holds authoritative player points
- In-game point changes (sign-in, shop, lottery, etc.) ingest to the panel first
- Panel admin point edits sync back to all servers via the existing cluster sync

## 5. Live WebSocket feed

The panel aggregates mod WebSocket events from every enabled server at `GET /api/ws` (browser session cookie required).

- Mod WebSocket listens on port **8889** at `/ws`
- In `ApiOnly` mode, authenticate with `?apiKey=` or `X-Api-Key` using `PanelApiKey`
- Dashboard shows a live event stream (chat, logins, disconnects, logs)

Ensure the panel host can reach each game server on **8889** (firewall / Docker network).

## 6. Operations

```bash
# Logs
docker compose -f docker-compose.prod.yml logs -f api

# Restart after config change
docker compose -f docker-compose.prod.yml up -d --build

# Stop
docker compose -f docker-compose.prod.yml down
```

Back up the `postgres_data` volume regularly — cluster shop, points, VIP, and CD key data lives in PostgreSQL.

## Development vs production

| | Development | Production (this guide) |
|---|-------------|-------------------------|
| Start DB | `docker compose up -d` | Included in `docker-compose.prod.yml` |
| Run app | `npm run dev` | Built images (`api` + `web`) |
| Web port | `5173` (Vite) | `80` (nginx) |
| API port | `3001` (direct) | Proxied at `/api` |

## Security notes

- Do not expose mod API (8888) or WebSocket (8889) ports to the public internet
- Use a reverse proxy with TLS (Caddy, Traefik, nginx) in front of port 80 when exposing the panel externally
- Rotate `SESSION_SECRET` and database passwords if compromised
