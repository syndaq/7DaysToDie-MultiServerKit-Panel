# 7DaysToDie-MultiServerKit-Panel

Central admin panel for [7DaysToDie-MultiServerKit](https://github.com/syndaq/7DaysToDie-MultiServerKit). Manages multiple 7 Days to Die dedicated servers from a single web interface.

## Architecture

```
┌─────────────────────────────────────┐
│  Panel VPS (this repo)              │
│  - Web UI for admins                │
│  - Shared DB (points, shop, VIP)    │
│  - Server registry                  │
└──────────────┬──────────────────────┘
               │ HTTPS + X-Api-Key
       ┌───────┼───────┬───────────┐
       ▼       ▼       ▼           ▼
   Game Server   Game Server   Game Server
   (mod API)     (mod API)     (mod API)
```

Game servers run the [MultiServerKit mod](https://github.com/syndaq/7DaysToDie-MultiServerKit) in **API-only mode** — no web UI on the game server, only a REST API for this panel to call.

## Responsibilities

| Component | Owns |
|-----------|------|
| **Panel** (this repo) | Admin login, web UI, shared player data, server list, orchestration |
| **Mod** (other repo) | Per-server game operations — players, map, console, backups, teleports |

### Shared data (panel database)

- Points and sign-in rewards
- Game store / shop
- VIP gifts and status
- CD keys and redemption history

### Per-server data (mod API)

- Online players, inventory, map
- Server console and stats
- Teleport homes/locations on that server
- Auto-backup, task schedules

## Connecting a game server

Each game server mod is configured with:

```json
{
  "ApiOnly": true,
  "PanelApiKey": "<same-secret-panel-uses>",
  "ServerId": "us-pve-01",
  "WebUrl": "http://10.0.0.5:8888"
}
```

The panel stores each server's `ServerId`, API URL, and API key, then calls:

```bash
curl -H "X-Api-Key: <secret>" http://10.0.0.5:8888/api/Server/Stats
```

## Project status

**Early scaffold.** Planned stack:

- **Frontend:** TBD (React / Vue)
- **Backend:** TBD (Node / .NET)
- **Database:** PostgreSQL (or SQLite for dev)

## Roadmap

- [ ] Panel backend API scaffold
- [ ] Server registry (add/remove/monitor game servers)
- [ ] Mod API client library
- [ ] Shared database schema (points, shop, VIP, CD keys)
- [ ] Admin authentication
- [ ] Web dashboard UI
- [ ] Migrate shared features from mod SQLite to panel DB

## Related repositories

- **Game mod (API agent):** https://github.com/syndaq/7DaysToDie-MultiServerKit

## License

[MIT](LICENSE)
