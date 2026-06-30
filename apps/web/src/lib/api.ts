import type { GameServerRecord, ServerHealthStatus } from '@msk-panel/shared';

const API_BASE = '';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(body.message ?? 'Request failed');
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const api = {
  getServers: () => request<GameServerRecord[]>('/api/servers'),
  getServerHealth: (id: string) => request<ServerHealthStatus>(`/api/servers/${id}/health`),
  getAllHealth: () => request<ServerHealthStatus[]>('/api/servers/health/all'),
  createServer: (data: {
    serverId: string;
    name: string;
    apiUrl: string;
    apiKey: string;
  }) =>
    request<GameServerRecord>('/api/servers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteServer: (id: string) =>
    request<void>(`/api/servers/${id}`, { method: 'DELETE' }),
};
