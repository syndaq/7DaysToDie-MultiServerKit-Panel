import { ModApiError } from '@msk-panel/shared';

export function formatModConnectionError(error: unknown): string {
  if (!(error instanceof ModApiError)) {
    return error instanceof Error ? error.message : 'Health check failed';
  }

  const raw = error.message.trim();
  if (error.statusCode === 401 || raw.includes('Authorization has been denied')) {
    return [
      'Mod rejected the Panel API key (401).',
      'The game server loads Config/appsettings.json first, then overrides it with',
      '7DaysToDieServer_Data/Managed/LSTY_Data/appsettings.json after the first run.',
      'Set PanelApiKey and ApiOnly:true in that Managed/LSTY_Data file (or Mod/LSTY_Data after mod v1.0.11),',
      'match the key in the panel exactly, then restart the game server.',
    ].join(' ');
  }

  if (error.statusCode === 408) {
    return 'Request timed out — check firewall and that port 8888 is reachable from the panel.';
  }

  if (error.statusCode === 0) {
    const lower = raw.toLowerCase();
    if (lower.includes('fetch failed') || lower.includes('econnrefused') || lower.includes('connection refused')) {
      return [
        'Mod API port 8888 is not reachable (connection refused).',
        'The game server may be running but SdtdMultiServerKit failed to start or is still initializing.',
        'Check the game server log for [LSTY] lines or mod load errors (invalid appsettings.json is common).',
        'Ensure port 8888 is open from the panel host and WebUrl binds to the public IP.',
      ].join(' ');
    }
    if (lower.includes('enotfound') || lower.includes('getaddrinfo')) {
      return `Cannot resolve game server host — check the API URL in the panel registry. (${raw})`;
    }
    if (lower.includes('timed out') || lower.includes('timeout')) {
      return 'Connection timed out — check firewall allows the panel host to reach port 8888 on the game server.';
    }
    return `Unreachable: ${raw}`;
  }

  return raw.startsWith('{') ? tryParseJsonMessage(raw) : raw;
}

function tryParseJsonMessage(raw: string): string {
  try {
    const parsed = JSON.parse(raw) as { message?: string };
    return parsed.message ?? raw;
  } catch {
    return raw;
  }
}
