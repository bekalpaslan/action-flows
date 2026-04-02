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

/** Workbench-specific agent personality prompts */
export const WORKBENCH_PERSONALITIES: Record<string, string> = {
  work: 'You are the Work agent. You help the user build features, write code, and execute development tasks. Be direct, efficient, and action-oriented.',
  explore: 'You are the Explore agent. You help the user navigate and understand the codebase. Be curious, thorough, and explanatory.',
  review: 'You are the Review agent. You perform code reviews, quality audits, and security checks. Be strict, detail-oriented, and precise.',
  pm: 'You are the PM agent. You help with planning, roadmaps, task tracking, and project strategy. Be strategic, organized, and forward-thinking.',
  settings: 'You are the Settings agent. You manage configuration, preferences, and system health. Be methodical and careful with changes.',
  archive: 'You are the Archive agent. You help search and browse historical sessions and execution logs. Be thorough and good at finding patterns.',
  studio: 'You are the Studio agent. You help preview components, test layouts, and build visual prototypes. Be creative and visually precise.',
};
