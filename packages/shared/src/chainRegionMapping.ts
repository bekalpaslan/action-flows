/**
 * Chain-to-Region Mapping
 * Maps chain step actions to cosmic map regions for spark travel visualization
 */

import type { RegionId } from './universeTypes.js';

/**
 * Maps chain step actions to cosmic map regions.
 * Used for spark travel visualization and region activity indicators.
 *
 * Based on CONTEXTS.md routing triggers:
 * - work: "implement", "build", "create", "add feature"
 * - maintenance: "fix bug", "refactor", "optimize"
 * - explore: "explore", "investigate", "research"
 * - review: "review", "audit", "check quality"
 * - settings: "configure", "setup", "create flow"
 * - pm: "plan", "roadmap", "brainstorm"
 * - intel: "dossier", "intel", "monitor"
 */
export const ACTION_TO_REGION_MAP: Record<string, RegionId> = {
  // Work context (feature development)
  'code': 'region-work' as RegionId,
  'code/backend': 'region-work' as RegionId,
  'code/frontend': 'region-work' as RegionId,
  'code/shared': 'region-work' as RegionId,
  'implement': 'region-work' as RegionId,
  'build': 'region-work' as RegionId,
  'create': 'region-work' as RegionId,
  'develop': 'region-work' as RegionId,
  'write': 'region-work' as RegionId,
  'generate': 'region-work' as RegionId,
  'construct': 'region-work' as RegionId,
  'design': 'region-work' as RegionId,

  // Maintenance context (bug fixes, refactoring)
  'fix': 'region-maintenance' as RegionId,
  'refactor': 'region-maintenance' as RegionId,
  'optimize': 'region-maintenance' as RegionId,
  'cleanup': 'region-maintenance' as RegionId,
  'triage': 'region-maintenance' as RegionId,
  'debug': 'region-maintenance' as RegionId,
  'repair': 'region-maintenance' as RegionId,
  'patch': 'region-maintenance' as RegionId,

  // Explore context (research, learning)
  'analyze': 'region-explore' as RegionId,
  'research': 'region-explore' as RegionId,
  'investigate': 'region-explore' as RegionId,
  'explore': 'region-explore' as RegionId,
  'learn': 'region-explore' as RegionId,
  'study': 'region-explore' as RegionId,
  'discover': 'region-explore' as RegionId,

  // Review context (code reviews, audits)
  'review': 'region-review' as RegionId,
  'audit': 'region-review' as RegionId,
  'second-opinion': 'region-review' as RegionId,
  'inspect': 'region-review' as RegionId,
  'examine': 'region-review' as RegionId,
  'validate': 'region-review' as RegionId,
  'verify': 'region-review' as RegionId,

  // Settings context (config, framework dev)
  'configure': 'region-settings' as RegionId,
  'setup': 'region-settings' as RegionId,
  'config': 'region-settings' as RegionId,
  'initialize': 'region-settings' as RegionId,

  // PM context (project management)
  'plan': 'region-pm' as RegionId,
  'roadmap': 'region-pm' as RegionId,
  'brainstorm': 'region-pm' as RegionId,
  'organize': 'region-pm' as RegionId,
  'coordinate': 'region-pm' as RegionId,
  'schedule': 'region-pm' as RegionId,

  // Intel context (code intelligence, dossiers)
  'intel': 'region-intel' as RegionId,
  'dossier': 'region-intel' as RegionId,
  'monitor': 'region-monitor' as RegionId,
  'watch': 'region-monitor' as RegionId,
  'track': 'region-monitor' as RegionId,

  // Additional mappings
  'test': 'region-test' as RegionId,
  'commit': 'region-archive' as RegionId,
  'deploy': 'region-deploy' as RegionId,
};

/**
 * Default region for unmapped actions.
 * Use Work region as fallback + log warning.
 */
export const DEFAULT_REGION: RegionId = 'region-work' as RegionId;

/**
 * Maps a chain step action to its corresponding cosmic map region.
 *
 * Normalization:
 * - Converts to lowercase
 * - Removes trailing slashes
 * - Supports prefix matching (e.g., "code/backend/api" → "code/backend" → "region-work")
 *
 * @param action - Chain step action (e.g., "code/backend", "review", "analyze")
 * @returns Region ID for cosmic map visualization
 *
 * @example
 * mapActionToRegion("code/backend") // "region-work"
 * mapActionToRegion("review") // "region-review"
 * mapActionToRegion("CODE/") // "region-work" (normalized)
 * mapActionToRegion("unknown-action") // "region-work" (default + warning)
 */
export function mapActionToRegion(action: string): RegionId {
  // Normalize action (remove trailing slash, lowercase)
  const normalized = action.toLowerCase().replace(/\/$/, '');

  // Direct match
  if (ACTION_TO_REGION_MAP[normalized]) {
    return ACTION_TO_REGION_MAP[normalized];
  }

  // Prefix match (e.g., "code/backend/api" → "code/backend" → "region-work")
  // Sort keys by length (descending) to match longest prefix first
  const sortedKeys = Object.keys(ACTION_TO_REGION_MAP).sort((a, b) => b.length - a.length);

  for (const key of sortedKeys) {
    if (normalized.startsWith(key)) {
      return ACTION_TO_REGION_MAP[key];
    }
  }

  // Fallback with warning
  console.warn(`[ChainRegionMapping] Unmapped action "${action}", defaulting to ${DEFAULT_REGION}`);
  return DEFAULT_REGION;
}

/**
 * Maps a chain's step sequence to bridge transitions.
 * Returns array of [fromRegion, toRegion] pairs.
 *
 * Self-loops (same region consecutively) are automatically filtered out.
 *
 * @param actions - Array of chain step actions in execution order
 * @returns Array of region transitions for spark animation
 *
 * @example
 * mapChainToBridges(["analyze", "plan", "code", "review"])
 * // [
 * //   ["region-explore", "region-pm"],
 * //   ["region-pm", "region-work"],
 * //   ["region-work", "region-review"]
 * // ]
 *
 * @example
 * mapChainToBridges(["code", "code", "review"])
 * // [
 * //   ["region-work", "region-review"]
 * // ] (consecutive "code" filtered)
 */
export function mapChainToBridges(actions: string[]): Array<[RegionId, RegionId]> {
  if (actions.length < 2) {
    return [];
  }

  const regions = actions.map(mapActionToRegion);
  const bridges: Array<[RegionId, RegionId]> = [];

  for (let i = 0; i < regions.length - 1; i++) {
    const from = regions[i];
    const to = regions[i + 1];

    // Skip self-loops (same region consecutively)
    if (from !== to) {
      bridges.push([from, to]);
    }
  }

  return bridges;
}

/**
 * Get all unique regions involved in a chain's execution.
 * Useful for highlighting active regions on the cosmic map.
 *
 * @param actions - Array of chain step actions
 * @returns Unique set of region IDs
 *
 * @example
 * getChainRegions(["analyze", "code", "code", "review"])
 * // Set(3) { "region-explore", "region-work", "region-review" }
 */
export function getChainRegions(actions: string[]): Set<RegionId> {
  return new Set(actions.map(mapActionToRegion));
}

/**
 * Validates action-to-region mapping against CONTEXTS.md routing triggers.
 * Used in tests to ensure mapping stays in sync with context routing.
 *
 * @param action - Action to validate
 * @param expectedRegion - Expected region ID
 * @returns True if mapping matches expectation
 *
 * @internal Test utility
 */
export function validateMapping(action: string, expectedRegion: RegionId): boolean {
  return mapActionToRegion(action) === expectedRegion;
}
