import type { WebSocket } from 'ws';

interface ChannelSubscription {
  ws: WebSocket;
  clientId: string;
}

/**
 * WebSocket hub for channel-per-workbench message routing.
 * Manages channel subscriptions and targeted broadcasts.
 * Works alongside the existing session-based clientRegistry.
 */
export class WebSocketHub {
  private channels = new Map<string, Set<ChannelSubscription>>();

  /** Subscribe a client to a channel */
  subscribe(channel: string, ws: WebSocket, clientId: string): void {
    if (!this.channels.has(channel)) {
      this.channels.set(channel, new Set());
    }
    // Avoid duplicate subscriptions for same ws
    const subs = this.channels.get(channel)!;
    for (const sub of subs) {
      if (sub.ws === ws) return; // Already subscribed
    }
    subs.add({ ws, clientId });
  }

  /** Unsubscribe a client from a specific channel */
  unsubscribe(channel: string, ws: WebSocket): void {
    const subs = this.channels.get(channel);
    if (!subs) return;
    for (const sub of subs) {
      if (sub.ws === ws) {
        subs.delete(sub);
        break;
      }
    }
    if (subs.size === 0) this.channels.delete(channel);
  }

  /** Unsubscribe a client from ALL channels (on disconnect) */
  unsubscribeAll(ws: WebSocket): void {
    for (const [channel, subs] of this.channels) {
      for (const sub of subs) {
        if (sub.ws === ws) {
          subs.delete(sub);
          break;
        }
      }
      if (subs.size === 0) this.channels.delete(channel);
    }
  }

  /** Broadcast a message to all subscribers of a specific channel */
  broadcast(channel: string, message: string): void {
    const subs = this.channels.get(channel);
    if (!subs) return;
    for (const sub of subs) {
      if (sub.ws.readyState === 1) { // WebSocket.OPEN
        sub.ws.send(message);
      }
    }
  }

  /** Broadcast a message to ALL connected clients (across all channels) */
  broadcastAll(message: string): void {
    const sent = new Set<WebSocket>();
    for (const subs of this.channels.values()) {
      for (const sub of subs) {
        if (!sent.has(sub.ws) && sub.ws.readyState === 1) {
          sub.ws.send(message);
          sent.add(sub.ws);
        }
      }
    }
  }

  /** Get the number of subscribers on a channel */
  getChannelSize(channel: string): number {
    return this.channels.get(channel)?.size ?? 0;
  }

  /** Get all channels a client is subscribed to */
  getClientChannels(ws: WebSocket): string[] {
    const result: string[] = [];
    for (const [channel, subs] of this.channels) {
      for (const sub of subs) {
        if (sub.ws === ws) {
          result.push(channel);
          break;
        }
      }
    }
    return result;
  }
}
