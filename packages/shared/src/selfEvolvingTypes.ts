/**
 * Self-Evolving Types
 * Common types to avoid circular dependencies between buttonTypes, registry, and patterns
 */

import type { ProjectId } from './projects.js';

/**
 * BehaviorPackId - Branded type for behavior pack identifiers
 */
export type BehaviorPackId = string & { readonly __brand: 'BehaviorPackId' };

/**
 * Source layer for behavior resolution
 * Used by buttons, registry entries, and patterns to determine where a behavior was defined
 */
export type LayerSource =
  | { type: 'core' }                           // Built-in, non-deletable
  | { type: 'pack'; packId: BehaviorPackId }   // From installed behavior pack
  | { type: 'project'; projectId: ProjectId }; // Per-project override
