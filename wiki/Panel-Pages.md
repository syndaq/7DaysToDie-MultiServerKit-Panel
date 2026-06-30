# Panel Pages

Full list of admin UI pages and what they control.

| Page | Scope | Description |
|------|-------|-------------|
| Dashboard | Cluster | Overview, server health, online players, **live event feed** |
| Servers | Cluster | Register and manage game server connections |
| GPS map | Per-server | Map info, render, tile viewer |
| Player list | Per-server | Online and history players |
| Game chat | Per-server | Chat log, cleanup, global messages |
| Permissions | Per-server | Admins, command permissions, ban/whitelist |
| Console | Per-server | Remote console + allowed commands |
| Global settings | Per-server | Protection, triggers, auto-restart |
| Auto backup | Per-server | Backup schedule and archives |
| Game notice | Per-server | Welcome, rotating, blood moon messages |
| Points system | Cluster + per-server | Player balances + mod sign-in settings |
| Point log | Cluster | Audit settings and searchable history |
| Boss kill reward | Per-server | Boss kill point rewards |
| Game store | Cluster | Shop products synced to all servers |
| VIP gift | Cluster | VIP reward definitions |
| Level gift | Cluster | Level milestone rewards |
| CD key redeem | Cluster | Redemption codes |
| Teleport | Per-server | Home / city / friend settings and locations |
| Prefab | Per-server | Browse, place, undo prefabs |
| Task schedule | Per-server | Cron jobs |
| List management | Per-server | Item and command list CRUD |
| Chunk reset | Per-server | Reset map regions |
| Trader protection | Per-server | Trader area build protection |
| PVP/PVE areas | Per-server | Custom zones |
| Mute commands | Per-server | Block chat commands |

## Cluster sync

Pages marked **Cluster** save to PostgreSQL and push changes to all enabled game servers. Pages marked **Per-server** proxy requests to the selected server's mod API only.

## First-time setup order

1. **Servers** — register all game servers
2. **Points system** — enable cluster points (`PanelUrl` on mods)
3. **Game store / VIP / CD keys / Level gifts / Lottery** — configure shared rewards
4. Per-server pages — tune each world independently
