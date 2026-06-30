import type { ModServerStats } from './types.js';

function formatFetchError(error: unknown): string {
  if (!(error instanceof Error)) {
    return 'Unknown error';
  }

  const cause = error.cause;
  if (cause instanceof Error) {
    return `${error.message}: ${cause.message}`;
  }

  return error.message;
}

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

  async put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  async patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'DELETE' });
  }

  async requestRaw(
    method: string,
    path: string,
    options?: {
      body?: unknown;
      query?: Record<string, string | string[] | number | boolean | undefined>;
      headers?: Record<string, string>;
    },
  ): Promise<{ status: number; data: unknown; contentType: string }> {
    let url = path.startsWith('/') ? path : `/${path}`;
    if (options?.query) {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(options.query)) {
        if (value === undefined) continue;
        if (Array.isArray(value)) {
          for (const item of value) params.append(key, String(item));
        } else {
          params.set(key, String(value));
        }
      }
      const qs = params.toString();
      if (qs) {
        url += `?${qs}`;
      }
    }

    const init: RequestInit = { method };
    if (options?.body !== undefined) {
      init.body = JSON.stringify(options.body);
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const headers = new Headers(init.headers);
      headers.set('X-Api-Key', this.apiKey);
      if (options?.headers) {
        for (const [key, value] of Object.entries(options.headers)) {
          headers.set(key, value);
        }
      }
      if (init.body !== undefined) {
        headers.set('Content-Type', 'application/json');
      }

      const response = await fetch(`${this.baseUrl}${url}`, {
        ...init,
        headers,
        signal: controller.signal,
      });

      const contentType = response.headers.get('content-type') ?? '';
      let data: unknown;
      if (contentType.includes('application/json')) {
        data = await response.json();
      } else if (
        contentType.startsWith('image/') ||
        contentType === 'application/octet-stream'
      ) {
        data = Buffer.from(await response.arrayBuffer());
      } else if (response.status !== 204) {
        data = await response.text();
      }

      if (!response.ok) {
        throw new ModApiError(
          response.status,
          typeof data === 'string' ? data : JSON.stringify(data),
        );
      }

      return { status: response.status, data, contentType };
    } catch (error) {
      if (error instanceof ModApiError) {
        throw error;
      }
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ModApiError(408, 'Request timed out');
      }
      throw new ModApiError(0, formatFetchError(error));
    } finally {
      clearTimeout(timer);
    }
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
      throw new ModApiError(0, formatFetchError(error));
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
