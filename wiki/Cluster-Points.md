# Cluster Points

PostgreSQL is the **source of truth** for player points when game servers have `PanelUrl` configured.

## Flow

```
In-game change on any server
    → mod POST /api/points/ingest
    → Player row updated in PostgreSQL
    → point log entry (if enabled)
    → mod local SQLite cache updated

Panel admin edits balance
    → panel PUT /api/points/:id
    → cluster sync to all servers (PUT /api/PointsInfo/:id)
    → each mod updates local cache only (no re-ingest loop)

Player joins a server
    → mod GET /api/points/by-platform/:platformId
    → local cache refreshed from panel
```

## Mod requirements

On each game server:

```json
{
  "PanelUrl": "http://panel-host:80",
  "PanelApiKey": "same-as-registry",
  "ServerId": "server-01"
}
```

## Panel admin

Use **Points system** → player list to view and edit balances. Changes sync to all enabled servers automatically.

## Point log

Enable categories in **Point log** → settings. Ingest events from mods are logged under **External Mod** (or the category sent by the mod, e.g. **Sign-in**).

## Mod ingest API

Called by game servers (not browsers):

```
POST /api/points/ingest
GET  /api/points/by-platform/:platformId
```

Headers:

- `X-Api-Key` — server's `PanelApiKey`
- `X-Server-Id` — server's `ServerId`

## Without PanelUrl

If a mod has no `PanelUrl`, points remain per-server in that mod's SQLite only. The panel can still push edits via cluster sync, but in-game changes won't ingest upstream.
