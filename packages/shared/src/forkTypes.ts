/**
 * Fork & Merge Types for Phase 10: Customization & Automation
 *
 * Types for session forking and merge resolution.
 * Forks create divergent conversation branches from a parent session.
 */

/** @internal Unique symbol for ForkId branding */
declare const ForkIdSymbol: unique symbol;
/** Unique identifier for a fork */
export type ForkId = string & { readonly [ForkIdSymbol]: true };

/** Strategy for resolving merge conflicts between forked and parent sessions */
export type MergeResolution = 'theirs' | 'parent' | 'manual';

/** Metadata describing a forked session and its relationship to the parent */
export interface ForkMetadata {
  id: ForkId;
  parentSessionId: string;
  forkSessionId: string;
  workbenchId: string;
  description: string;
  createdAt: string;
  status: 'active' | 'merged' | 'abandoned';
  forkPointMessageId?: string;
}
