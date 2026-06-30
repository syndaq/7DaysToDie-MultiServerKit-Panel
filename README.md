# 7DaysToDie-MultiServerKit-Panel

Central admin panel for [7DaysToDie-MultiServerKit](https://github.com/syndaq/7DaysToDie-MultiServerKit). Manages multiple 7 Days to Die dedicated servers from a single web interface.

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19 + Vite + Tailwind CSS v4 + TanStack Query |
| Backend | Fastify + TypeScript |
| Database | PostgreSQL + Prisma |
| Shared | `@msk-panel/shared` (types + mod API client) |

## Architecture

```
Browser → Panel Web (Vite/React) → Panel API (Fastify) → PostgreSQL
                                         ↓
                              Game Server Mod APIs (X-Api-Key)
```

### Data scope

| Scope | Stored in | Examples |
|-------|-----------|----------|
| **Cluster-wide** | Panel PostgreSQL + sync to all servers | Points, shop products, VIP gifts, CD keys, level gifts, lottery, point log |
| **Per-server** | Game mod only (panel proxies requests) | Global settings, backups, PVP areas, teleport, console, permissions, map, prefabs |

The panel never exposes mod API keys to the browser. All game-server calls go through `/api/servers/:id/mod/*` on the panel API.

## Quick start

### 1. Prerequisites

- Node.js 20+
- Docker (for PostgreSQL)
- One or more game servers running the [MultiServerKit mod](https://github.com/syndaq/7DaysToDie-MultiServerKit)

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

Edit `.env` and set `PUBLIC_HOST`, `WEB_ORIGIN`, `PANEL_URL`, and `SESSION_SECRET`:

```env
PUBLIC_HOST=YOUR-IP-HERE
WEB_ORIGIN=http://YOUR-IP-HERE:5173
PANEL_URL=http://YOUR-IP-HERE:5173
SESSION_SECRET=use-a-long-random-string-here
```

Use your machine's **reachable IP** (not `localhost`) when accessing the panel from another device.

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

Both services bind to `0.0.0.0`.

| Service | URL (replace with your IP) |
|---------|----------------------------|
| Web UI | http://YOUR-IP-HERE:5173 |
| Panel API | http://YOUR-IP-HERE:3001 |
| API health | http://YOUR-IP-HERE:3001/health |

Ensure ports **5173** and **3001** are open in your firewall/security group.

### 7. First login

1. Open the web UI — you will be prompted to create the first admin account.
2. Go to **Servers** and register each game server (name, mod API URL, `PanelApiKey` from the mod's `appsettings.json`, and `ServerId`).
3. Confirm the dashboard shows servers online.

## Panel pages

| Page | Description |
|------|-------------|
| Dashboard | Cluster overview, server health, online player counts |
| Servers | Register and manage game server connections |
| GPS map | Map info, render actions, tile viewer |
| Player list | Online and history players with admin actions |
| Game chat | Chat log search, cleanup, send global messages |
| Permissions | Admins, command permissions, blacklist, whitelist |
| Console | Remote console + allowed command reference |
| Global settings | Per-server chat, protection, triggers, auto-restart |
| Auto backup | Backup schedule and archive management |
| Game notice | Welcome, rotating, and blood moon notices |
| Points system | Cluster player points and per-server mod settings |
| Point log | Audit log settings and searchable history |
| Boss kill reward | Per-server boss kill point rewards |
| Game store | Cluster shop products synced to all servers |
| VIP gift | Cluster VIP reward definitions |
| Level gift | Cluster level milestone rewards |
| CD key redeem | Cluster redemption codes |
| Teleport | Home/city/friend settings and location management |
| Prefab | Browse, place, and undo prefab deployments |
| Task schedule | Cron jobs and command bindings |
| List management | Item list and command list CRUD |
| Chunk reset | Reset map regions on a server |
| Trader protection | Trader area build protection settings |
| PVP/PVE areas | Custom zone management |
| Mute commands | Block in-game chat commands |

## Registering a game server

1. On the game server mod, set in `Config/appsettings.json`:
   - `ApiOnly: true`
   - `PanelApiKey` — long random secret (shared with panel only)
   - `ServerId` — unique cluster identifier
   - `WebUrl` — bind to `127.0.0.1` or private IP
2. Open **Servers** in the panel and add the server's API URL and matching API key.
3. Verify health on the dashboard.

## Panel API (summary)

| Area | Base path | Description |
|------|-----------|-------------|
| Auth | `/api/auth/*` | Setup, login, logout, session |
| Servers | `/api/servers` | CRUD, health, stats |
| Mod proxy | `/api/servers/:id/mod/*` | Pass-through to game mod REST API |
| Console | `/api/servers/:id/console` | Execute remote commands |
| Players | `/api/players/*`, `/api/servers/:id/players/*` | Online and history |
| Points | `/api/points/*` | Cluster player points |
| Shop | `/api/shop/*` | Products, lottery (cluster) |
| VIP / CD keys / Level gifts | `/api/vip-gifts`, `/api/cd-keys`, `/api/level-gifts` | Cluster rewards |
| Point log | `/api/point-log/*` | Audit settings and entries |
| Dashboard | `/api/dashboard` | Aggregated cluster summary |
| Points ingest (mod) | `POST /api/points/ingest`, `GET /api/points/by-platform/:id` | Cluster-native balance (mod `X-Api-Key` + `X-Server-Id`) |
| Live events | `GET /api/ws` | WebSocket fan-in from all game servers |

Mod API reference: enable `EnableSwagger` on the game server (dev only) or see the mod repository.

## Project structure

```
7DaysToDie-MultiServerKit-Panel/
├── apps/
│   ├── api/                 # Fastify panel API, auth, cluster sync, mod proxy
│   └── web/                 # Vite + React admin UI
├── packages/
│   └── shared/              # Shared types + ModApiClient
├── prisma/
│   └── schema.prisma        # PostgreSQL schema
└── docker-compose.yml
```

## Scripts

```bash
npm run dev          # API + web concurrently
npm run dev:api      # API only
npm run dev:web      # Web only
npm run build        # Production build (shared + api + web)
npm run db:push      # Apply Prisma schema to database
npm run db:migrate   # Create migration
npm run db:studio    # Prisma Studio
```

## Production notes

For a full Docker Compose deployment (PostgreSQL + API + nginx), see **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)**.

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Manual production checklist:

- Set `SESSION_SECRET` to a strong random value.
- Set `COOKIE_SECURE=true` when serving the panel over HTTPS.
- Run PostgreSQL with backups; cluster-wide shop/points/VIP data lives here.
- Keep mod API port (default 8888) and WebSocket port (8889) private — only the panel host should reach them.
- Run `npm run build` and serve the API + static web build behind a reverse proxy.

### Cluster-native points & live events

- Mod `PanelUrl` + `PanelApiKey` + `ServerId` → panel PostgreSQL is the points source of truth (`POST /api/points/ingest`).
- Dashboard connects to `GET /api/ws` for aggregated mod events (chat, logins, logs) from all servers.

## Roadmap

- [x] Monorepo scaffold (React + Fastify + Prisma)
- [x] Admin authentication and first-run setup
- [x] Server registry + health checks + dashboard
- [x] Mod API proxy (all per-server admin pages)
- [x] Cluster-wide shop, VIP, CD keys, level gifts, lottery, point log
- [x] Player management, console, permissions, map, teleport, prefabs, schedules
- [x] Production deployment guide (Docker compose all-in-one)
- [x] WebSocket / live event aggregation from game servers
- [ ] Automated tests and CI

## Related

- **Game mod:** https://github.com/syndaq/7DaysToDie-MultiServerKit
- **Wiki:** https://github.com/syndaq/7DaysToDie-MultiServerKit-Panel/wiki ([source in `wiki/`](wiki/))

## Disclaimer
The source code of this project is open and transparent. Any disputes arising from or related to the use of this software should be resolved through friendly negotiation. 
Any private modifications to the code of this project are the sole responsibility of the person who made these modifications. The author team of this software does not assume any responsibility for any form of loss or damage that may be caused to the user or others during the use of this software.
If the user downloads, installs and uses this software, it means that the user trusts the author team of this software and agrees to the relevant agreements and disclaimers.

## License

[MIT](LICENSE)
