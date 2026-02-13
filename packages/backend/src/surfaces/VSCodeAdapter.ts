/**
 * VS Code Surface Adapter (Stub)
 * Placeholder for future VS Code extension integration
 * Part of Phase 2A — Multi-Surface Orchestration (Thread 1)
 */

import { BaseSurfaceAdapter } from './BaseSurfaceAdapter.js';
import type { SurfaceId, SurfaceConfig, SurfaceMessage, SurfaceInput } from '@afw/shared';

/**
 * VSCodeAdapter handles communication with VS Code extension
 * Current implementation is a minimal stub
 */
export class VSCodeAdapter extends BaseSurfaceAdapter {
  readonly surfaceId: SurfaceId = 'vscode';
  readonly config: SurfaceConfig = {
    id: 'vscode',
    label: 'VS Code',
    icon: 'vscode',
    capabilities: ['text', 'markdown', 'html', 'interactive'],
  };

  async initialize(): Promise<void> {
    console.log('[VSCodeAdapter] Initialized (stub - no VS Code extension)');
    // TODO: Set up WebSocket/IPC connection with VS Code extension
  }

  translateIn(externalMessage: unknown): SurfaceInput {
    console.log('[VSCodeAdapter] translateIn called (stub)');

    const vscodeEvent = externalMessage as any;

    return {
      surfaceId: this.surfaceId,
      instanceId: `vscode-${vscodeEvent.workspaceId || 'unknown'}`,
      sessionId: vscodeEvent.sessionId || 'default-session',
      content: vscodeEvent.command || '',
      metadata: {
        workspaceId: vscodeEvent.workspaceId,
        filePath: vscodeEvent.filePath,
      },
    };
  }

  translateOut(message: SurfaceMessage): unknown {
    console.log('[VSCodeAdapter] translateOut called (stub)');

    return {
      sessionId: message.sessionId,
      content: message.content,
      // TODO: Add VS Code-specific formatting
    };
  }

  async send(message: SurfaceMessage): Promise<void> {
    console.log('[VSCodeAdapter] send called (stub)');
    console.log(`[VSCodeAdapter] Would send to VS Code: ${message.content.substring(0, 50)}...`);

    // TODO: Send message to VS Code extension via WebSocket/IPC
  }

  async shutdown(): Promise<void> {
    console.log('[VSCodeAdapter] Shutting down (stub)');
    // TODO: Close VS Code extension connection
  }
}
