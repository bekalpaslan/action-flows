// Capability types for Phase 0 — Node Architecture (Thread 2)

/** Identifies a capability exposed by a dashboard panel or backend service */
export type CapabilityId = string & { readonly __brand: 'CapabilityId' };

/** Convert string to CapabilityId */
export function toCapabilityId(value: string): CapabilityId {
  return value as CapabilityId;
}

/** A capability that can be invoked by the orchestrator */
export interface Capability {
  id: CapabilityId;
  name: string;
  description: string;
  provider: CapabilityProvider;
  invokable: boolean;
}

/** Where a capability lives */
export type CapabilityProvider = 'dashboard' | 'backend' | 'external';

/** Result of invoking a capability */
export interface CapabilityResult {
  capabilityId: CapabilityId;
  success: boolean;
  data?: unknown;
  error?: string;
  correlationId?: string;
}

// ============================================================================
// Phase 1: Extended Types for Node Architecture
// ============================================================================

/** Status of a capability in the registry */
export type CapabilityStatus = 'online' | 'offline' | 'degraded';

/** Full capability with runtime state */
export interface RegisteredCapability extends Capability {
  status: CapabilityStatus;
  registeredAt: string;
  lastInvokedAt?: string;
  clientId?: string; // Which WS client provides this capability
}

/** Request to invoke a capability */
export interface CapabilityInvocation {
  capabilityId: CapabilityId;
  correlationId: string;
  inputs: Record<string, unknown>;
  timeout?: number; // ms, default 30000
}

// ============================================================================
// WebSocket Protocol Messages
// ============================================================================

/** WebSocket message types for capability protocol */
export interface CapabilityRegisterMessage {
  type: 'capability:register';
  capabilities: Capability[];
}

export interface CapabilityUnregisterMessage {
  type: 'capability:unregister';
  capabilityIds: CapabilityId[];
}

export interface CapabilityInvokeMessage {
  type: 'capability:invoke';
  correlationId: string;
  capabilityId: CapabilityId;
  inputs: Record<string, unknown>;
  timeout?: number;
}

export interface CapabilityResultMessage {
  type: 'capability:result';
  correlationId: string;
  capabilityId: CapabilityId;
  success: boolean;
  data?: unknown;
  error?: string;
}

export interface CapabilityErrorMessage {
  type: 'capability:error';
  correlationId: string;
  capabilityId: CapabilityId;
  error: string;
  code: 'timeout' | 'unavailable' | 'execution-error' | 'unknown';
}

/** Union of all capability WS messages */
export type CapabilityMessage =
  | CapabilityRegisterMessage
  | CapabilityUnregisterMessage
  | CapabilityInvokeMessage
  | CapabilityResultMessage
  | CapabilityErrorMessage;
