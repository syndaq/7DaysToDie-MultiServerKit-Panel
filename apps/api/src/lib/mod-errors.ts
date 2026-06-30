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
