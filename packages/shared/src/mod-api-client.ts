import type { ModServerStats } from './types.js';

export interface ModApiClientOptions {
  apiUrl: string;
  apiKey: string;
  timeoutMs?: number;
}

export class ModApiClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly timeoutMs: number;

  constructor(options: ModApiClientOptions) {
    this.baseUrl = options.apiUrl.replace(/\/$/, '');
    this.apiKey = options.apiKey;
    this.timeoutMs = options.timeoutMs ?? 10_000;
  }

  async getStats(): Promise<ModServerStats> {
    return this.request<ModServerStats>('/api/Server/Stats');
  }

  async get<T>(path: string): Promise<T> {
    return this.request<T>(path);
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const headers = new Headers(init.headers);
      headers.set('X-Api-Key', this.apiKey);
      if (init.body !== undefined && typeof init.body === 'string') {
        headers.set('Content-Type', 'application/json');
      }

      const response = await fetch(`${this.baseUrl}${path}`, {
        ...init,
        headers,
        signal: controller.signal,
      });

      if (!response.ok) {
        const text = await response.text();
        throw new ModApiError(response.status, text || response.statusText);
      }

      const contentType = response.headers.get('content-type') ?? '';
      if (contentType.includes('application/json')) {
        return (await response.json()) as T;
      }

      return (await response.text()) as T;
    } catch (error) {
      if (error instanceof ModApiError) {
        throw error;
      }
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ModApiError(408, 'Request timed out');
      }
      throw new ModApiError(0, error instanceof Error ? error.message : 'Unknown error');
    } finally {
      clearTimeout(timer);
    }
  }
}

export class ModApiError extends Error {
  constructor(
    readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'ModApiError';
  }
}
