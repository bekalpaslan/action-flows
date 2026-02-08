/**
 * Registry Types
 * Comprehensive type definitions for the behavior registry system (SRD Section 4.1)
 * Supports dynamic registration, layer resolution, and behavior pack management
 */

import type { Timestamp } from './types.js';
import type { LayerSource, BehaviorPackId } from './selfEvolvingTypes.js';
import type { ButtonDefinition } from './buttonTypes.js';
import type { PatternAction } from './patternTypes.js';

// Re-export BehaviorPackId for convenience
export type { BehaviorPackId } from './selfEvolvingTypes.js';

// ============================================================================
// Branded Types
// ============================================================================

/** Branded type for registry entry IDs */
export type RegistryEntryId = string & { readonly __brand: 'RegistryEntryId' };

// ============================================================================
// Registry Entry Types
// ============================================================================

/**
 * Registry entry types
 * - button: Toolbar button definitions
 * - pattern: Detected usage patterns
 * - workflow: Multi-step automated workflows
 * - shortcut: Keyboard shortcut bindings
 * - modifier: Self-modification templates (legacy)
 * - pack: Behavior pack reference (legacy)
 */
export type RegistryEntryType = 'button' | 'pattern' | 'workflow' | 'shortcut' | 'modifier' | 'pack';

/** Status of a registry entry */
export type RegistryEntryStatus = 'active' | 'inactive';

/**
 * Workflow definition for multi-step automated workflows
 * Represents a sequence of actions that can be triggered together
 */
export interface WorkflowDefinition {
  /** Human-readable workflow name */
  name: string;
  /** Ordered list of step IDs or action references to execute */
  steps: Array<{
    /** Action to execute (button ID, command, or API call) */
    actionRef: string;
    /** Optional delay before this step (in ms) */
    delayMs?: number;
    /** Whether to continue on step failure */
    continueOnError?: boolean;
  }>;
  /** Trigger conditions */
  trigger?: {
    /** Manual trigger only */
    manual?: boolean;
    /** Keyboard shortcut */
    shortcut?: string;
    /** Context patterns that auto-trigger */
    contextPatterns?: string[];
  };
}

/**
 * Shortcut definition for keyboard shortcut bindings
 * Maps keyboard combinations to actions
 */
export interface ShortcutDefinition {
  /** Keyboard combination (e.g., "Ctrl+Shift+P", "Cmd+K") */
  key: string;
  /** Action to trigger (button ID, command type, or workflow ID) */
  actionRef: string;
  /** Contexts where this shortcut is active */
  contexts?: string[];
  /** Whether this shortcut can be overridden by project settings */
  overridable: boolean;
}

/** Modifier action definition (for self-modification templates) */
export interface ModifierDefinition {
  /** Description of what this modifier does */
  description: string;
  /** Which tier this modifier produces */
  targetTier: 'minor' | 'moderate' | 'major';
  /** Template for generating file changes */
  fileChangeTemplates: Array<{
    filePath: string;
    changeType: 'create' | 'modify' | 'delete';
    /** Handlebars-style template for content/diff generation */
    template?: string;
    package: 'shared' | 'backend' | 'app' | 'mcp-server' | 'hooks';
  }>;
  /** Validation requirements */
  validation: {
    typeCheck: boolean;
    lint: boolean;
    test: boolean;
  };
}

/**
 * A single entry in the behavior registry
 * Uses discriminated union for type-specific data
 */
export interface RegistryEntry {
  /** Unique identifier for this registry entry */
  id: RegistryEntryId;
  /** Human-readable name */
  name: string;
  /** Description of what this entry does */
  description: string;
  /** Type of registry entry */
  type: RegistryEntryType;
  /** Source layer (core, pack, or project) */
  source: LayerSource;
  /** Semantic version (e.g., "1.0.0") */
  version: string;
  /** Current status (active/inactive) */
  status: RegistryEntryStatus;
  /** Whether this entry is enabled for use */
  enabled: boolean;
  /** Type-specific data — discriminated union */
  data:
    | { type: 'button'; definition: ButtonDefinition }
    | { type: 'pattern'; definition: PatternAction }
    | { type: 'workflow'; definition: WorkflowDefinition }
    | { type: 'shortcut'; definition: ShortcutDefinition }
    | { type: 'modifier'; definition: ModifierDefinition };
  /** When this entry was created */
  createdAt: Timestamp;
  /** When this entry was last updated */
  updatedAt: Timestamp;
  /** Optional arbitrary metadata */
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Behavior Pack Types
// ============================================================================

/** Compatibility requirements for a behavior pack */
export interface PackCompatibility {
  minDashboardVersion: string;
  projectTypes?: string[];     // e.g., ['node', 'python', 'react']
}

/**
 * Behavior pack definition
 * Represents an installable collection of behaviors (buttons, patterns, workflows, shortcuts)
 */
export interface BehaviorPack {
  /** Unique identifier for this pack */
  id: BehaviorPackId;
  /** Display name */
  name: string;
  /** Description of what this pack provides */
  description: string;
  /** Pack author or organization */
  author: string;
  /** Semantic version */
  version: string;
  /** Searchable tags */
  tags: string[];
  /** Compatibility requirements */
  compatibility: PackCompatibility;
  /** Registry entries included in this pack */
  entries: RegistryEntry[];
  /** Other packs this pack depends on */
  dependencies?: BehaviorPackId[];
  /** When this pack was installed (undefined if not installed) */
  installedAt?: Timestamp;
  /** Whether this pack is currently enabled */
  enabled: boolean;
}

// ============================================================================
// Resolution Types
// ============================================================================

/**
 * Result of layer resolution
 * Shows the merged behavior from all layers with conflict information
 */
export interface ResolvedBehavior {
  /** The registry entry ID being resolved */
  entryId: RegistryEntryId;
  /** The resolved entry (from winning layer) */
  entry: RegistryEntry;
  /** Which layer provided the effective behavior */
  effectiveSource: LayerSource;
  /** All layers that define this entry, with their versions */
  layers: Array<{ source: LayerSource; entry: RegistryEntry }>;
  /** Conflict descriptions if multiple layers defined this entry */
  conflicts: string[];
  /** What was overridden (legacy field for backward compatibility) */
  overriddenBy?: LayerSource[];
}

/** Conflict between registry entries */
export interface RegistryConflict {
  entryId: RegistryEntryId;
  entryName: string;
  sources: LayerSource[];        // All layers that define this entry
  resolution: LayerSource;       // Which layer wins
  reason: string;                // Why this resolution was chosen
}

// ============================================================================
// Query/Filter Types
// ============================================================================

/**
 * Filter for querying registry entries
 * Supports filtering by type, source, status, and pack
 */
export interface RegistryFilter {
  /** Filter by entry type */
  type?: RegistryEntryType;
  /** Filter by source layer type ('core' | 'pack' | 'project') */
  source?: 'core' | 'pack' | 'project';
  /** Legacy alias for source */
  sourceType?: LayerSource['type'];
  /** Filter by status */
  status?: RegistryEntryStatus;
  /** Filter by enabled state */
  enabled?: boolean;
  /** Filter by behavior pack ID (only for pack-sourced entries) */
  packId?: BehaviorPackId;
  /** Search in name/description */
  search?: string;
}
