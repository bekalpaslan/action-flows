// FlowHub types for Phase 3A — Public Flow Registry (Thread 3)

import type { CapabilityId } from './capabilityTypes.js';
import type { SurfaceId } from './surfaceTypes.js';
import type { AgentPersonality } from './agentTypes.js';

// ============================================================================
// Core Identifiers & Enums
// ============================================================================

/** Identifies a flow from FlowHub */
export type FlowHubFlowId = string & { readonly __brand: 'FlowHubFlowId' };

/** Convert string to FlowHubFlowId */
export function toFlowHubFlowId(value: string): FlowHubFlowId {
  return value as FlowHubFlowId;
}

/** Source of a flow in the local registry */
export type FlowSource = 'local' | 'flow-hub' | 'community';

// ============================================================================
// Public Registry Entry
// ============================================================================

/**
 * A flow entry in the FlowHub public registry
 * This is the metadata visible in the Flow Browser before installation
 */
export interface FlowHubEntry {
  flowId: FlowHubFlowId;
  name: string;
  description: string;
  author: string;
  version: string;
  downloads: number;
  rating: number;
  source: FlowSource;

  /** Tags for searchability (e.g., 'frontend', 'testing', 'security') */
  tags: string[];

  /** Categories for organization (e.g., 'Development', 'QA', 'Documentation') */
  categories: string[];

  /** When this flow was first published */
  createdAt: string;

  /** When this flow was last updated */
  updatedAt: string;

  /** Required capabilities for this flow to function */
  requiresCapabilities: CapabilityId[];

  /** Required surfaces for this flow to function */
  requiresSurfaces: SurfaceId[];

  /** Recommended personality metadata for agents in this flow */
  personalityMetadata?: {
    /** Default personality for all agents if not specified per-agent */
    defaultPersonality?: AgentPersonality;
    /** Per-action personality overrides */
    perActionPersonalities?: Record<string, AgentPersonality>;
  };
}

// ============================================================================
// Flow Manifest (Complete Definition)
// ============================================================================

/**
 * Complete flow definition for installation
 * Extends FlowHubEntry with full implementation details
 */
export interface FlowManifest extends FlowHubEntry {
  /** Agent definitions for this flow */
  agents: Array<{
    /** Action type (e.g., 'code/frontend/component') */
    actionType: string;
    /** Full agent.md content */
    agentMdContent: string;
    /** Optional personality override for this specific agent */
    personality?: AgentPersonality;
  }>;

  /** Markdown content to append to FLOWS.md */
  flowsEntry: string;

  /** Optional GPG signature for verification (future security feature) */
  signature?: string;
}

// ============================================================================
// Installation Requests & Results
// ============================================================================

/** Request to install a flow from FlowHub */
export interface FlowInstallRequest {
  flowId: FlowHubFlowId;
  source: FlowSource;
  /** Whether to override existing flow with same ID if present */
  overrideExisting?: boolean;
}

/** Result of a flow installation attempt */
export interface FlowInstallResult {
  success: boolean;
  flowId: FlowHubFlowId;
  /** List of agent action types that were installed */
  installedAgents: string[];
  /** Whether the flow was added to FLOWS.md registry */
  addedToRegistry: boolean;
  /** Whether the flow signature was verified (false if unsigned or verification failed) */
  signatureVerified: boolean;
  /** Error messages if installation failed or partially failed */
  errors?: string[];
}

// ============================================================================
// Publishing
// ============================================================================

/** Request to publish a flow to FlowHub */
export interface FlowPublishRequest {
  flowId: FlowHubFlowId;
  /** URL where the flow manifest can be fetched */
  manifestUrl: string;
  /** Optional API key for authenticated publishing */
  apiKey?: string;
}

// ============================================================================
// Statistics
// ============================================================================

/** FlowHub statistics for dashboard display */
export interface FlowHubStats {
  /** Total flows available in FlowHub */
  totalFlows: number;
  /** Flows installed in local registry */
  installedFlows: number;
  /** Flows available but not installed */
  availableFlows: number;
}
