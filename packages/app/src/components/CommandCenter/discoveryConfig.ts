/**
 * Discovery Configuration - Suggestion text mapping for all 13 regions
 *
 * Phase 3: Living Universe Discovery System
 * Maps each RegionId to actionable suggestion text for DiscoveryHint component.
 */

import type { RegionId } from '@afw/shared';

/**
 * Suggestion text for each region
 * Provides specific, actionable guidance for users to unlock regions
 */
export const DISCOVERY_SUGGESTIONS: Record<RegionId, string> = {
  // Work region (starting loadout, always visible)
  ['region-work' as RegionId]: 'Ask about implementing a feature or building something',

  // Canvas region (starting loadout, always visible)
  ['region-canvas' as RegionId]: 'Brainstorm ideas or design a new feature',

  // Maintenance region (unlocked after encountering an error)
  ['region-maintenance' as RegionId]: 'Encounter or fix a bug',

  // Explore region (unlocked after research question)
  ['region-explore' as RegionId]: 'Ask a research question or investigate something',

  // Review region (unlocked after code chain completion)
  ['region-review' as RegionId]: 'Complete a code review or audit',

  // Archive region (unlocked after 3+ sessions)
  ['region-archive' as RegionId]: 'Create multiple sessions to access history',

  // Settings region (unlocked after config question)
  ['region-settings' as RegionId]: 'Ask about configuration or customization',

  // PM region (unlocked after planning activity)
  ['region-pm' as RegionId]: 'Ask about roadmaps, priorities, or project planning',

  // Harmony region (unlocked after first gate checkpoint)
  ['region-harmony' as RegionId]: 'Complete a chain with contract validation',

  // Editor region (unlocked after file editing)
  ['region-editor' as RegionId]: 'Request file editing or code modifications',

  // Intel region (unlocked after dossier creation)
  ['region-intel' as RegionId]: 'Create an intel dossier on any topic',

  // Respect region (unlocked after boundary check)
  ['region-respect' as RegionId]: 'Ask about patterns, practices, or standards',

  // Coverage region (unlocked after testing/quality work)
  ['region-coverage' as RegionId]: 'Ask about testing, quality, or code coverage',
} as const;

/**
 * Get human-readable region name from regionId
 * Strips 'region-' prefix and capitalizes
 */
export function getRegionName(regionId: RegionId): string {
  // Remove 'region-' prefix
  const workbenchId = regionId.replace('region-', '');

  // Region name mapping (from defaultUniverse.ts workbench configs)
  const REGION_NAMES: Record<string, string> = {
    work: 'Work',
    canvas: 'Canvas',
    maintenance: 'Maintenance',
    explore: 'Explore',
    review: 'Review',
    archive: 'Archive',
    settings: 'Settings',
    pm: 'Project Management',
    harmony: 'Harmony',
    editor: 'Editor',
    intel: 'Intel Dossiers',
    respect: 'Respect',
    coverage: 'Test Coverage',
  };

  return REGION_NAMES[workbenchId] || workbenchId.charAt(0).toUpperCase() + workbenchId.slice(1);
}
