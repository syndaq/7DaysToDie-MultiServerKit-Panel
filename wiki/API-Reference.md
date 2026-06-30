# API Reference

Panel API base URL:

- Development: `http://HOST:3001`
- Production (Docker): `http://HOST/api` (via nginx)

## Authentication

Browser clients use session cookie `msk_session` after login.

Mod ingest endpoints use `X-Api-Key` + `X-Server-Id` (no session).

## Auth

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/auth/status` | Setup required / session state |
| POST | `/api/auth/setup` | Create first admin |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |

## Servers

| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/api/servers` | List / create |
| GET/PUT/DELETE | `/api/servers/:id` | Read / update / delete |
| GET | `/api/dashboard` | Cluster summary |

## Mod proxy

All per-server mod REST calls:

```
/api/servers/:id/mod/*
```

The panel adds `X-Api-Key` server-side. Never expose mod keys to the browser.

## Players & points

| Method | Path | Description |
|--------|------|-------------|
| GET/PUT | `/api/points/*` | Cluster player balances (admin) |
| POST | `/api/points/ingest` | Mod ingest (cluster-native changes) |
| GET | `/api/points/by-platform/:platformId` | Mod balance lookup |
| GET | `/api/point-log/*` | Audit log |

## Cluster features

| Area | Base path |
|------|-----------|
| Shop | `/api/shop/*` |
| VIP gifts | `/api/vip-gifts/*` |
| CD keys | `/api/cd-keys/*` |
| Level gifts | `/api/level-gifts/*` |
| Lottery | `/api/shop/lottery/*` |

## Live events

| Protocol | Path | Auth |
|----------|------|------|
| WebSocket | `/api/ws` | Session cookie |

## Health

```
GET /health
```

Returns `{ status: "ok", service: "msk-panel-api", ... }`.

## Related

- Mod REST API: see the [mod wiki](https://github.com/syndaq/7DaysToDie-MultiServerKit/wiki/API-Reference)
- Enable `EnableSwagger` on a dev game server for interactive mod API docs
