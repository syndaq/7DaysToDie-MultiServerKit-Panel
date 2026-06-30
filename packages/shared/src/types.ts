export interface GameServerRecord {
  id: string;
  serverId: string;
  name: string;
  apiUrl: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGameServerInput {
  serverId: string;
  name: string;
  apiUrl: string;
  apiKey: string;
  enabled?: boolean;
}

export interface UpdateGameServerInput {
  name?: string;
  apiUrl?: string;
  apiKey?: string;
  enabled?: boolean;
}

export interface ServerHealthStatus {
  serverId: string;
  name: string;
  online: boolean;
  latencyMs: number | null;
  error: string | null;
  checkedAt: string;
}

/** Subset of mod API /api/Server/Stats response */
export interface ModServerStats {
  uptime?: number;
  players?: number;
  zombies?: number;
  animals?: number;
  [key: string]: unknown;
}

export interface ApiError {
  message: string;
  statusCode: number;
}
