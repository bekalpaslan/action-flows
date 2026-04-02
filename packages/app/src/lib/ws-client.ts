import type { WSEnvelope } from '@afw/shared';

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';
export type MessageHandler = (envelope: WSEnvelope) => void;

class WSClient {
  private ws: WebSocket | null = null;
  private handlers = new Map<string, Set<MessageHandler>>();
  private statusListeners = new Set<(s: ConnectionStatus) => void>();
  private _status: ConnectionStatus = 'disconnected';
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempt = 0;
  private readonly maxReconnectDelay = 30_000;
  private url: string | null = null;

  get status(): ConnectionStatus {
    return this._status;
  }

  /** Derive WebSocket URL from current page location (works in dev via Vite proxy and in prod via Electron) */
  private deriveUrl(): string {
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${location.host}/ws`;
  }

  connect(url?: string): void {
    this.url = url ?? this.deriveUrl();
    this.setStatus('connecting');
    this.reconnectAttempt = 0;
    this.createConnection();
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.setStatus('disconnected');
  }

  private createConnection(): void {
    if (!this.url) return;
    try {
      this.ws = new WebSocket(this.url);
    } catch {
      this.scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      this.reconnectAttempt = 0;
      this.setStatus('connected');
    };

    this.ws.onmessage = (event) => {
      try {
        const envelope: WSEnvelope = JSON.parse(event.data as string);
        this.dispatch(envelope);
      } catch {
        // Ignore malformed messages
      }
    };

    this.ws.onclose = () => {
      this.ws = null;
      if (this._status !== 'disconnected') {
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = () => {
      // onclose will fire after onerror, triggering reconnect
    };
  }

  private scheduleReconnect(): void {
    this.setStatus('reconnecting');
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempt), this.maxReconnectDelay);
    this.reconnectAttempt++;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.createConnection();
    }, delay);
  }

  private dispatch(envelope: WSEnvelope): void {
    const channelHandlers = this.handlers.get(envelope.channel);
    if (channelHandlers) {
      for (const handler of channelHandlers) handler(envelope);
    }
    const wildcardHandlers = this.handlers.get('*');
    if (wildcardHandlers) {
      for (const handler of wildcardHandlers) handler(envelope);
    }
  }

  /** Subscribe to messages on a specific channel. Returns unsubscribe function. */
  subscribe(channel: string, handler: MessageHandler): () => void {
    if (!this.handlers.has(channel)) this.handlers.set(channel, new Set());
    this.handlers.get(channel)!.add(handler);
    return () => {
      const set = this.handlers.get(channel);
      if (set) { set.delete(handler); if (set.size === 0) this.handlers.delete(channel); }
    };
  }

  /** Send a raw JSON message to the backend */
  send(message: Record<string, unknown>): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify(message));
  }

  /** Send channel:subscribe command to backend hub */
  subscribeChannel(channel: string): void {
    this.send({ type: 'channel:subscribe', channel });
  }

  /** Send channel:unsubscribe command to backend hub */
  unsubscribeChannel(channel: string): void {
    this.send({ type: 'channel:unsubscribe', channel });
  }

  /** Register a status change listener. Returns unsubscribe function. */
  onStatusChange(listener: (s: ConnectionStatus) => void): () => void {
    this.statusListeners.add(listener);
    return () => { this.statusListeners.delete(listener); };
  }

  private setStatus(status: ConnectionStatus): void {
    this._status = status;
    for (const listener of this.statusListeners) listener(status);
  }
}

/** Singleton WebSocket client -- imported by stores and hooks */
export const wsClient = new WSClient();
