// Surface types for Phase 0 — Multi-Surface Orchestration (Thread 1)

/** Identifies the surface (entry point) that sent a message to the orchestrator */
export type SurfaceId = 'electron' | 'slack' | 'cli' | 'vscode' | 'mobile';

/** Configuration for a connected surface */
export interface SurfaceConfig {
  id: SurfaceId;
  label: string;
  icon: string;
  capabilities: SurfaceCapability[];
}

/** What a surface can render */
export type SurfaceCapability = 'text' | 'markdown' | 'html' | 'interactive';

/** A message from or to a surface */
export interface SurfaceMessage {
  surfaceId: SurfaceId;
  sessionId: string;
  content: string;
  messageType: 'user-input' | 'orchestrator-output' | 'system-notification';
}

// ============================================================================
// Phase 2A: Multi-Surface Orchestration — Expanded Types
// ============================================================================

/** Represents a connected surface instance */
export interface ConnectedSurface {
  surfaceId: SurfaceId;
  instanceId: string; // Unique per connection (e.g., 'slack-workspace-123')
  config: SurfaceConfig;
  connectedAt: string;
  lastActivityAt: string;
  sessionIds: string[]; // Sessions this surface is subscribed to
}

/** Event when a surface connects/disconnects */
export interface SurfaceConnectionEvent {
  surfaceId: SurfaceId;
  instanceId: string;
  action: 'connected' | 'disconnected';
  timestamp: string;
}

/** Input received from any surface */
export interface SurfaceInput {
  surfaceId: SurfaceId;
  instanceId: string;
  sessionId: string;
  content: string;
  metadata?: Record<string, unknown>; // Surface-specific metadata (e.g., Slack thread_ts)
}
