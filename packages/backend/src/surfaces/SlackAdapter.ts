/**
 * Slack Surface Adapter (Stub)
 * Provides the structure for Slack integration
 * Part of Phase 2A — Multi-Surface Orchestration (Thread 1)
 */

import { BaseSurfaceAdapter } from './BaseSurfaceAdapter.js';
import type { SurfaceId, SurfaceConfig, SurfaceMessage, SurfaceInput } from '@afw/shared';

/**
 * SlackAdapter handles communication with Slack workspaces
 * Current implementation is a stub — full Slack API integration pending
 */
export class SlackAdapter extends BaseSurfaceAdapter {
  readonly surfaceId: SurfaceId = 'slack';
  readonly config: SurfaceConfig = {
    id: 'slack',
    label: 'Slack',
    icon: 'slack',
    capabilities: ['text', 'markdown'],
  };

  async initialize(): Promise<void> {
    console.log('[SlackAdapter] Initialized (stub - no Slack API connection)');
    // TODO: Initialize Slack SDK with bot token
    // TODO: Set up event subscriptions
    // TODO: Verify bot permissions
  }

  translateIn(externalMessage: unknown): SurfaceInput {
    // Stub implementation — translates Slack event to SurfaceInput
    console.log('[SlackAdapter] translateIn called (stub)');

    // Expected format from Slack:
    // { type: 'message', channel: 'C123', user: 'U456', text: 'Hello', ts: '1234567890.123456' }
    const slackEvent = externalMessage as any;

    return {
      surfaceId: this.surfaceId,
      instanceId: `slack-${slackEvent.team_id || 'unknown'}`,
      sessionId: slackEvent.channel || 'default-session',
      content: slackEvent.text || '',
      metadata: {
        slackUserId: slackEvent.user,
        slackChannelId: slackEvent.channel,
        slackThreadTs: slackEvent.thread_ts,
        slackTs: slackEvent.ts,
      },
    };
  }

  translateOut(message: SurfaceMessage): unknown {
    // Stub implementation — translates SurfaceMessage to Slack format
    console.log('[SlackAdapter] translateOut called (stub)');

    // Convert to Slack message format
    return {
      channel: message.sessionId,
      text: message.content,
      // TODO: Format markdown for Slack's mrkdwn syntax
      // TODO: Add blocks for rich formatting
    };
  }

  async send(message: SurfaceMessage): Promise<void> {
    console.log('[SlackAdapter] send called (stub)');
    console.log(`[SlackAdapter] Would send to Slack: ${message.content.substring(0, 50)}...`);

    // TODO: Use Slack SDK to send message
    // const result = await slackClient.chat.postMessage({
    //   channel: message.sessionId,
    //   text: message.content,
    // });
  }

  async shutdown(): Promise<void> {
    console.log('[SlackAdapter] Shutting down (stub)');
    // TODO: Clean up Slack SDK connections
    // TODO: Close event listeners
  }
}
