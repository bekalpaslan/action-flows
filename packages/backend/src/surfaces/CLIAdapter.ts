/**
 * CLI Surface Adapter (Stub)
 * Wraps existing claudeCliManager patterns for multi-surface architecture
 * Part of Phase 2A — Multi-Surface Orchestration (Thread 1)
 */

import { BaseSurfaceAdapter } from './BaseSurfaceAdapter.js';
import type { SurfaceId, SurfaceConfig, SurfaceMessage, SurfaceInput } from '@afw/shared';

/**
 * CLIAdapter handles communication with Claude CLI sessions
 * Wraps existing claudeCliManager functionality
 */
export class CLIAdapter extends BaseSurfaceAdapter {
  readonly surfaceId: SurfaceId = 'cli';
  readonly config: SurfaceConfig = {
    id: 'cli',
    label: 'Claude CLI',
    icon: 'terminal',
    capabilities: ['text', 'markdown', 'interactive'],
  };

  async initialize(): Promise<void> {
    console.log('[CLIAdapter] Initialized (wraps existing claudeCliManager)');
    // claudeCliManager is already initialized in index.ts
    // This adapter provides the surface abstraction layer
  }

  translateIn(externalMessage: unknown): SurfaceInput {
    // Stub implementation — translates CLI output to SurfaceInput
    console.log('[CLIAdapter] translateIn called (stub)');

    // Expected format from CLI:
    // { sessionId: 'session-123', output: 'Command executed', type: 'stdout' }
    const cliEvent = externalMessage as any;

    return {
      surfaceId: this.surfaceId,
      instanceId: `cli-${cliEvent.sessionId || 'unknown'}`,
      sessionId: cliEvent.sessionId || 'default-session',
      content: cliEvent.output || '',
      metadata: {
        outputType: cliEvent.type, // stdout, stderr, etc.
        cliSessionId: cliEvent.sessionId,
      },
    };
  }

  translateOut(message: SurfaceMessage): unknown {
    // Stub implementation — translates SurfaceMessage to CLI input format
    console.log('[CLIAdapter] translateOut called (stub)');

    // Convert to CLI input format
    return {
      sessionId: message.sessionId,
      input: message.content,
      // CLI sessions expect plain text input
    };
  }

  async send(message: SurfaceMessage): Promise<void> {
    console.log('[CLIAdapter] send called (stub)');
    console.log(`[CLIAdapter] Would send to CLI: ${message.content.substring(0, 50)}...`);

    // TODO: Use claudeCliManager to send input to CLI session
    // claudeCliManager.sendInput(message.sessionId, message.content);
  }

  async shutdown(): Promise<void> {
    console.log('[CLIAdapter] Shutting down (stub)');
    // claudeCliManager handles its own cleanup
  }
}
