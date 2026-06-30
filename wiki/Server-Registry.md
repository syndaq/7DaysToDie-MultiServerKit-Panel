# Server Registry

Register each game server so the panel can proxy admin requests and aggregate health/events.

## On the game server (mod)

Edit `Config/appsettings.json`:

```json
{
  "ApiOnly": true,
  "PanelApiKey": "long-random-secret-shared-with-panel-only",
  "ServerId": "us-pve-01",
  "PanelUrl": "http://panel-host:80",
  "WebUrl": "http://127.0.0.1:8888"
}
```

| Setting | Notes |
|---------|-------|
| `ServerId` | Unique across the cluster |
| `PanelApiKey` | Must match the key entered in the panel |
| `PanelUrl` | Panel base URL — required for [[Cluster Points]] |
| `WebUrl` | Bind to localhost or private IP |

## In the panel

1. Open **Servers** → **Add server**
2. Fill in:

| Panel field | Value |
|-------------|-------|
| Name | Display name (e.g. "US PvE") |
| Server ID | Same as mod `ServerId` |
| API URL | Reachable from panel host, e.g. `http://10.0.0.5:8888` |
| API key | Same as mod `PanelApiKey` |

3. Save and check the **Dashboard** — server should show online with latency and player count.

## Network requirements

The panel host must reach each game server on:

| Port | Purpose |
|------|---------|
| **8888** | REST API (`X-Api-Key`) |
| **8889** | WebSocket live events |

These ports should **not** be exposed to the public internet.

## Troubleshooting

| Symptom | Check |
|---------|-------|
| Server offline | Firewall, `WebUrl` bind address, API URL reachable from panel |
| 403 on mod calls | `PanelApiKey` mismatch |
| No live events | Port 8889 blocked; see [[WebSocket Live Events]] |
| Points not syncing | `PanelUrl` on mod; see [[Cluster Points]] |

## Disable a server

Set **Enabled** to off in the panel registry. The server stays registered but is excluded from cluster sync and WebSocket aggregation.
