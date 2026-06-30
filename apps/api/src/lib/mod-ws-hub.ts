import type { GameServer } from '@prisma/client';
import type { ClusterWebSocketMessage } from '@msk-panel/shared';
import WebSocket from 'ws';
import { deriveModWebSocketUrl } from './mod-ingest-auth.js';

type ClientSocket = WebSocket & { isAlive?: boolean };

export class ModWebSocketHub {
  private readonly clientSubscriptions = new Map<ClientSocket, Set<string>>();
  private readonly upstreams = new Map<string, WebSocket>();
  private readonly upstreamListeners = new Map<string, Set<ClientSocket>>();

  subscribeClient(client: ClientSocket, servers: GameServer[]) {
    const serverIds = new Set(servers.map((server) => server.id));
    this.clientSubscriptions.set(client, serverIds);

    for (const server of servers) {
      if (!this.upstreams.has(server.id)) {
        this.openUpstream(server);
      }

      const listeners = this.upstreamListeners.get(server.id) ?? new Set<ClientSocket>();
      listeners.add(client);
      this.upstreamListeners.set(server.id, listeners);
    }

    client.isAlive = true;
    client.on('pong', () => {
      client.isAlive = true;
    });

    client.on('close', () => this.unsubscribeClient(client));
    client.on('error', () => this.unsubscribeClient(client));
  }

  private unsubscribeClient(client: ClientSocket) {
    const serverIds = this.clientSubscriptions.get(client);
    this.clientSubscriptions.delete(client);

    if (!serverIds) return;

    for (const serverId of serverIds) {
      const listeners = this.upstreamListeners.get(serverId);
      listeners?.delete(client);
      if (listeners && listeners.size === 0) {
        this.upstreamListeners.delete(serverId);
        const upstream = this.upstreams.get(serverId);
        upstream?.close();
        this.upstreams.delete(serverId);
      }
    }
  }

  private openUpstream(server: GameServer) {
    const wsUrl = new URL(deriveModWebSocketUrl(server.apiUrl));
    wsUrl.searchParams.set('apiKey', server.apiKey);

    const upstream = new WebSocket(wsUrl.toString());
    this.upstreams.set(server.id, upstream);

    upstream.on('message', (raw) => {
      let parsed: { modEventType?: string; data?: unknown } | null = null;
      try {
        parsed = JSON.parse(String(raw)) as { modEventType?: string; data?: unknown };
      } catch {
        return;
      }

      if (parsed?.modEventType === undefined || parsed?.modEventType === null) return;

      const envelope: ClusterWebSocketMessage = {
        serverId: server.serverId,
        serverName: server.name,
        panelServerId: server.id,
        modEventType: String(parsed.modEventType),
        data: parsed.data,
        receivedAt: new Date().toISOString(),
      };

      const payload = JSON.stringify(envelope);
      const listeners = this.upstreamListeners.get(server.id);
      if (!listeners) return;

      for (const client of listeners) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(payload);
        }
      }
    });

    upstream.on('close', () => {
      this.upstreams.delete(server.id);
      setTimeout(() => {
        if (this.upstreamListeners.has(server.id)) {
          this.openUpstream(server);
        }
      }, 5_000);
    });
  }

  startHeartbeat() {
    setInterval(() => {
      for (const [client] of this.clientSubscriptions) {
        if (client.isAlive === false) {
          client.terminate();
          this.unsubscribeClient(client);
          continue;
        }
        client.isAlive = false;
        client.ping();
      }
    }, 30_000);
  }
}

export const modWebSocketHub = new ModWebSocketHub();
