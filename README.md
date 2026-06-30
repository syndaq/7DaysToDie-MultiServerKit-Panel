# 7DaysToDie-MultiServerKit-Panel

Central admin panel for [7DaysToDie-MultiServerKit](https://github.com/syndaq/7DaysToDie-MultiServerKit). Manages multiple 7 Days to Die dedicated servers from a single web interface.

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19 + Vite + Tailwind CSS v4 + TanStack Query |
| Backend | Fastify + TypeScript |
| Database | PostgreSQL + Prisma |
| Shared | `@msk-panel/shared` (types + mod API client) |

## Quick start

### 1. Prerequisites

- Node.js 20+
- Docker (for PostgreSQL)

### 2. Install dependencies

```bash
git clone https://github.com/syndaq/7DaysToDie-MultiServerKit-Panel.git
cd 7DaysToDie-MultiServerKit-Panel
npm install
```

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and set `PUBLIC_HOST`, `WEB_ORIGIN`, and `PANEL_URL` to your machine's **physical IP** (not `localhost`):

```env
PUBLIC_HOST=YOUR-IP-HERE
WEB_ORIGIN=http://YOUR-IP-HERE:5173
PANEL_URL=http://YOUR-IP-HERE:5173
```

### 4. Start PostgreSQL

```bash
docker compose up -d
```

### 5. Initialize database

```bash
npm run db:push
npm run db:generate
```

### 6. Run development servers

```bash
npm run dev
```

Both services bind to `0.0.0.0` so they are reachable on your machine's IP.

| Service | URL (replace with your IP) |
|---------|----------------------------|
| Web UI | http://YOUR-IP-HERE:5173 |
| Panel API | http://YOUR-IP-HERE:3001 |
| API health | http://YOUR-IP-HERE:3001/health |

Ensure ports **5173** and **3001** are open in your firewall/security group.

## Project structure

```
7DaysToDie-MultiServerKit-Panel/
├── apps/
│   ├── api/                 # Fastify panel API + mod proxy
│   └── web/                 # Vite + React admin UI
├── packages/
│   └── shared/              # Shared types + ModApiClient
├── prisma/
│   └── schema.prisma        # PostgreSQL schema
└── docker-compose.yml
```

## Registering a game server

1. Configure the mod on your game server (`ApiOnly: true`, `PanelApiKey`, `ServerId`)
2. Open **Servers** in the panel UI
3. Add the server's API URL and matching API key

The panel calls the mod API on your behalf — API keys never reach the browser.

## API endpoints (panel)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Panel API health |
| GET | `/api/servers` | List registered servers |
| POST | `/api/servers` | Register a server |
| GET | `/api/servers/:id/health` | Probe one server |
| GET | `/api/servers/health/all` | Probe all enabled servers |
| GET | `/api/servers/:id/stats` | Proxy mod `/api/Server/Stats` |

## Scripts

```bash
npm run dev          # API + web concurrently
npm run dev:api      # API only
npm run dev:web      # Web only
npm run build        # Production build
npm run db:migrate   # Create migration
npm run db:studio    # Prisma Studio
```

## Architecture

```
Browser → Panel Web (Vite/React) → Panel API (Fastify) → PostgreSQL
                                         ↓
                              Game Server Mod APIs (X-Api-Key)
```

## Roadmap

- [x] Monorepo scaffold (React + Fastify + Prisma)
- [x] Server registry + health checks
- [x] Mod API client
- [ ] Admin authentication
- [ ] Shared points / shop / VIP / CD key management
- [ ] WebSocket aggregation from game servers
- [ ] Player management UI

## Related

- **Game mod:** https://github.com/syndaq/7DaysToDie-MultiServerKit

## License

[MIT](LICENSE)
