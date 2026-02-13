/**
 * Mobile Surface Adapter (Stub)
 * Placeholder for future mobile app integration
 * Part of Phase 2A — Multi-Surface Orchestration (Thread 1)
 */

import { BaseSurfaceAdapter } from './BaseSurfaceAdapter.js';
import type { SurfaceId, SurfaceConfig, SurfaceMessage, SurfaceInput } from '@afw/shared';

/**
 * MobileAdapter handles communication with mobile apps (iOS/Android)
 * Current implementation is a minimal stub
 */
export class MobileAdapter extends BaseSurfaceAdapter {
  readonly surfaceId: SurfaceId = 'mobile';
  readonly config: SurfaceConfig = {
    id: 'mobile',
    label: 'Mobile',
    icon: 'mobile',
    capabilities: ['text', 'markdown'],
  };

  async initialize(): Promise<void> {
    console.log('[MobileAdapter] Initialized (stub - no mobile app)');
    // TODO: Set up push notification service
    // TODO: Set up mobile WebSocket/HTTP polling
  }

  translateIn(externalMessage: unknown): SurfaceInput {
    console.log('[MobileAdapter] translateIn called (stub)');

    const mobileEvent = externalMessage as any;

    return {
      surfaceId: this.surfaceId,
      instanceId: `mobile-${mobileEvent.deviceId || 'unknown'}`,
      sessionId: mobileEvent.sessionId || 'default-session',
      content: mobileEvent.message || '',
      metadata: {
        deviceId: mobileEvent.deviceId,
        platform: mobileEvent.platform, // 'ios' | 'android'
        appVersion: mobileEvent.appVersion,
      },
    };
  }

  translateOut(message: SurfaceMessage): unknown {
    console.log('[MobileAdapter] translateOut called (stub)');

    return {
      sessionId: message.sessionId,
      message: message.content,
      type: message.messageType,
      // TODO: Add mobile-specific formatting (notifications, badges, etc.)
    };
  }

  async send(message: SurfaceMessage): Promise<void> {
    console.log('[MobileAdapter] send called (stub)');
    console.log(`[MobileAdapter] Would send to mobile: ${message.content.substring(0, 50)}...`);

    // TODO: Send via push notification or WebSocket
  }

  async shutdown(): Promise<void> {
    console.log('[MobileAdapter] Shutting down (stub)');
    // TODO: Close mobile connections
  }
}
