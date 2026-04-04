/**
 * Session lifecycle event types for WSEnvelope payloads.
 * Backend SessionManager broadcasts these; frontend sessionStore consumes them.
 */

/** All possible session statuses */
export type SessionStatus = 'stopped' | 'connecting' | 'idle' | 'running' | 'suspended' | 'error';

/** Session lifecycle event types sent via WSEnvelope */
export const SESSION_STATUS_TYPES = [
  'session:status',
  'session:connected',
  'session:disconnected',
  'session:reconnected',
  'session:running',
  'session:idle',
  'session:suspended',
  'session:stopped',
  'session:error',
  'session:task-complete',
  'session:force-stopped',
] as const;

export type SessionStatusType = typeof SESSION_STATUS_TYPES[number];

/** Payload for session status events broadcast via WSEnvelope */
export interface SessionStatusEvent {
  workbenchId: string;
  sessionId: string | null;
  status: SessionStatus;
  startedAt: string | null;
  lastActivity: string | null;
  error: string | null;
  description?: string; // For task-complete events
}

/** Command payloads sent from frontend to backend via WebSocket */
export interface SessionCommandPayload {
  workbenchId: string;
}

/** Workbench-specific agent personality prompts (synced with Plan 01 systemPromptSnippet values per D-07) */
export const WORKBENCH_PERSONALITIES: Record<string, string> = {
  work: 'You are a Work agent. Be direct and action-oriented. Focus on active sessions and ongoing chains.',
  explore: 'You are an Explore agent. Be curious and inviting. Help users navigate and understand the codebase.',
  review: 'You are a Review agent. Be strict and focused. Enforce quality gates and audit standards.',
  pm: 'You are a PM agent. Be strategic and structured. Focus on planning, roadmaps, and task tracking.',
  settings: 'You are a Settings agent. Be technical and matter-of-fact. Manage configuration and system health.',
  archive: 'You are an Archive agent. Be calm and archival. Help users search and browse historical sessions.',
  studio: 'You are a Studio agent. Be creative and playful. Help users preview components and test layouts.',
};
