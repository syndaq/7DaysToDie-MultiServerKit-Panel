Welcome to the **7DaysToDie-MultiServerKit-Panel** wiki.

Central admin panel for [7DaysToDie-MultiServerKit](https://github.com/syndaq/7DaysToDie-MultiServerKit). Manage multiple 7 Days to Die dedicated servers from one web interface.

## Architecture

```
Browser → Panel Web (React) → Panel API (Fastify) → PostgreSQL
                                    ↓
                         Game Server Mod APIs (X-Api-Key)
                                    ↓
                         Game Server WebSockets (port 8889)
```

## Wiki pages

| Page | Description |
|------|-------------|
| [[Quick Start]] | Development setup |
| [[Production Deployment]] | Docker Compose all-in-one |
| [[Server Registry]] | Add and manage game servers |
| [[Cluster Points]] | Panel as source of truth for balances |
| [[WebSocket Live Events]] | Aggregated live feed on the dashboard |
| [[Panel Pages]] | Full UI page reference |
| [[API Reference]] | Panel REST and WebSocket endpoints |

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19 + Vite + Tailwind CSS v4 |
| Backend | Fastify + TypeScript |
| Database | PostgreSQL + Prisma |

## Data scope

| Scope | Stored in | Examples |
|-------|-----------|----------|
| **Cluster-wide** | PostgreSQL + sync to mods | Points, shop, VIP, CD keys, level gifts, lottery |
| **Per-server** | Game mod (panel proxies) | Console, map, teleport, PVP, backups, permissions |

## Quick links

- [GitHub repository](https://github.com/syndaq/7DaysToDie-MultiServerKit-Panel)
- [Game mod](https://github.com/syndaq/7DaysToDie-MultiServerKit)
