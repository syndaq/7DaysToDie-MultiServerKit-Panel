# WebSocket Live Events

The panel aggregates live mod WebSocket events from all enabled servers into a single browser stream.

## Browser endpoint

```
GET /api/ws
```

Requires an authenticated session cookie (same as other panel API routes). In production, nginx proxies WebSocket upgrades to the API service.

## Upstream (panel → mod)

For each enabled server, the panel connects to:

```
ws://game-host:8889/ws?apiKey=PANEL_API_KEY
```

Derived from the server's registered `apiUrl` (port 8888 → 8889).

## Event envelope

Each message includes server context:

```json
{
  "serverId": "us-pve-01",
  "serverName": "US PvE",
  "panelServerId": "cuid...",
  "modEventType": "ChatMessage",
  "data": { },
  "receivedAt": "2026-06-29T12:00:00.000Z"
}
```

## Dashboard

The **Dashboard** page shows:

- Live feed connection status badge
- Scrollable event list (chat, logins, disconnects, log callbacks, …)

Events auto-reconnect if the connection drops.

## Common event types

| `modEventType` | Meaning |
|----------------|---------|
| `ChatMessage` | In-game chat |
| `PlayerLogin` | Player joined |
| `PlayerDisconnected` | Player left |
| `LogCallback` | Server log line |
| `EntityKilled` | Entity death |
| `CommandExecutionReply` | Console output |

## Troubleshooting

| Symptom | Check |
|---------|-------|
| Feed disconnected | Session expired — refresh page / re-login |
| No events | Game server offline; port 8889 blocked from panel host |
| Events from one server only | Other servers disabled or unreachable |

## Security

Mod WebSocket ports must not be public. Only the panel host should connect upstream.
