import { useCallback, useEffect, useRef, useState } from 'react';
import type { ClusterWebSocketMessage } from '@msk-panel/shared';

const MAX_EVENTS = 50;

function buildWebSocketUrl(): string {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/api/ws`;
}

export function useClusterWebSocket() {
  const [connected, setConnected] = useState(false);
  const [events, setEvents] = useState<ClusterWebSocketMessage[]>([]);
  const socketRef = useRef<WebSocket | null>(null);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearRetry = useCallback(() => {
    if (retryRef.current) {
      clearTimeout(retryRef.current);
      retryRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    clearRetry();
    socketRef.current?.close();

    const socket = new WebSocket(buildWebSocketUrl());
    socketRef.current = socket;

    socket.onopen = () => setConnected(true);
    socket.onclose = () => {
      setConnected(false);
      retryRef.current = setTimeout(connect, 5_000);
    };
    socket.onerror = () => socket.close();

    socket.onmessage = (message) => {
      try {
        const payload = JSON.parse(String(message.data)) as ClusterWebSocketMessage;
        if (!payload?.modEventType) return;
        setEvents((current) => [payload, ...current].slice(0, MAX_EVENTS));
      } catch {
        // Ignore malformed frames.
      }
    };
  }, [clearRetry]);

  useEffect(() => {
    connect();
    return () => {
      clearRetry();
      socketRef.current?.close();
    };
  }, [clearRetry, connect]);

  return { connected, events };
}

export function formatClusterEvent(message: ClusterWebSocketMessage): string {
  const prefix = `[${message.serverName}]`;
  switch (message.modEventType) {
    case 'ChatMessage': {
      const data = message.data as { senderName?: string; message?: string } | undefined;
      return `${prefix} ${data?.senderName ?? 'Unknown'}: ${data?.message ?? ''}`;
    }
    case 'PlayerLogin': {
      const data = message.data as { playerName?: string } | undefined;
      return `${prefix} ${data?.playerName ?? 'Player'} joined`;
    }
    case 'PlayerDisconnected': {
      const data = message.data as { playerName?: string } | undefined;
      return `${prefix} ${data?.playerName ?? 'Player'} left`;
    }
    case 'EntityKilled':
      return `${prefix} Entity killed`;
    case 'LogCallback': {
      const data = message.data as { message?: string } | undefined;
      return `${prefix} ${data?.message ?? 'Log event'}`;
    }
    case 'PanelConnected':
      return 'Connected to cluster live feed';
    default:
      return `${prefix} ${message.modEventType}`;
  }
}
