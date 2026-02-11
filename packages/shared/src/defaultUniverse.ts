/**
 * Default Universe Configuration
 * Creates the initial cosmic map with 13 regions derived from workbenches
 */

import type {
  UniverseGraph,
  RegionNode,
  LightBridge,
  DiscoveryTrigger,
  RegionId,
  EdgeId,
} from './universeTypes.js';
import { FogState } from './universeTypes.js';
import type { StarId, NavigationTarget } from './workbenchTypes.js';
import { NAVIGATION_TARGETS, DEFAULT_WORKBENCH_CONFIGS } from './workbenchTypes.js';
import { brandedTypes } from './types.js';

// ============================================================================
// Layer Assignments
// ============================================================================

/**
 * Maps stars to Living System layers
 * Note: Only stars have layers. Harmony is the space. Tools inherit layers from their host stars.
 */
const LAYER_ASSIGNMENTS: Record<StarId, 'platform' | 'template' | 'philosophy' | 'physics' | 'experience'> = {
  // Experience Layer (user-facing workbenches)
  archive: 'experience',
  intel: 'experience',
  pm: 'experience',

  // Physics Layer (execution workbenches)
  work: 'physics',
  maintenance: 'physics',
  review: 'physics',

  // Philosophy Layer (framework workbenches)
  settings: 'philosophy',

  // Template Layer (exploratory workbenches)
  explore: 'template',

  // Platform Layer (foundational workbenches)
  respect: 'platform',
};

// ============================================================================
// Initial Positions (Cosmic Map Layout)
// ============================================================================

/**
 * Initial positions for regions on the cosmic map
 * Organized into two spatial clusters matching existing workbench groups
 * Note: Only stars have positions. Harmony is the space itself. Tools are embedded inside stars.
 */
const INITIAL_POSITIONS: Record<StarId, { x: number; y: number }> = {
  // Framework Tools Cluster (upper region)
  respect: { x: -200, y: -350 },
  intel: { x: 0, y: -300 },
  settings: { x: -100, y: -150 },

  // Project Work Cluster (lower region)
  work: { x: -300, y: 150 },
  maintenance: { x: -100, y: 200 },
  explore: { x: 100, y: 150 },
  review: { x: 300, y: 200 },
  pm: { x: -200, y: 350 },
  archive: { x: 200, y: 350 },
};

// ============================================================================
// Initial Fog States
// ============================================================================

/**
 * Initial fog-of-war states
 * Work starts revealed. Canvas is a tool (not a star), so removed from fog states.
 * Note: Only stars have fog states. Harmony is the space itself. Tools don't appear on the map.
 */
const INITIAL_FOG_STATES: Record<StarId, FogState> = {
  work: FogState.REVEALED,           // Starting region (always visible)
  maintenance: FogState.FAINT,       // Adjacent to work
  explore: FogState.FAINT,           // Adjacent to work
  review: FogState.FAINT,            // Adjacent to work
  archive: FogState.FAINT,           // Always visible but inactive
  settings: FogState.FAINT,          // Framework config
  pm: FogState.HIDDEN,               // Unlocked after planning activity
  intel: FogState.HIDDEN,            // Unlocked after dossier creation
  respect: FogState.HIDDEN,          // Unlocked after boundary check
};

// ============================================================================
// Region Creation
// ============================================================================

/**
 * Creates a region node from a star
 * Note: Only stars become regions. Tools and harmony do not.
 */
function createRegion(starId: StarId): RegionNode {
  const config = DEFAULT_WORKBENCH_CONFIGS[starId as NavigationTarget];
  const layer = LAYER_ASSIGNMENTS[starId];
  const position = INITIAL_POSITIONS[starId];
  const fogState = INITIAL_FOG_STATES[starId];

  return {
    id: brandedTypes.regionId(`region-${starId}`),
    workbenchId: starId,
    label: config.label,
    description: config.tooltip,
    position,
    layer,
    fogState,
    health: {
      contractCompliance: 1.0,
      activityLevel: 0.0,
      errorRate: 0.0,
    },
    traces: {
      totalInteractions: 0,
      recentTraces: [],
      heatLevel: 0.0,
    },
    colorShift: {
      baseColor: config.glowColor || '#ffffff',
      currentColor: config.glowColor || '#ffffff',
      saturation: 1.0,
      temperature: 0.5,
    },
    glowIntensity: fogState === FogState.REVEALED ? 0.3 : 0.0,
    status: fogState === FogState.REVEALED ? 'idle' : 'undiscovered',
    sessionCount: 0,
  };
}

// ============================================================================
// Bridge Creation
// ============================================================================

/**
 * Default connections between related stars
 * Note: Connections are between stars only. Tools don't have bridges. Harmony is the space itself.
 */
const DEFAULT_CONNECTIONS: Array<[StarId, StarId]> = [
  // Primary workflow bridges
  ['work', 'maintenance'],
  ['work', 'explore'],
  ['work', 'review'],
  ['maintenance', 'review'],
  ['explore', 'review'],

  // Framework bridges (harmony removed - it's the space, not a star)
  // (coverage removed - it's a tool, not a star)
  ['settings', 'respect'],

  // Archival bridges
  ['review', 'archive'],
  ['pm', 'archive'],

  // Intel bridges
  ['work', 'intel'],
  ['explore', 'intel'],

  // Editor bridges removed (editor is a tool, not a star)

  // Canvas bridges removed (canvas is a tool, not a star)

  // PM bridges
  ['work', 'pm'],
  ['explore', 'pm'],
];

/**
 * Creates a light bridge between two star regions
 */
function createBridge(sourceId: StarId, targetId: StarId): LightBridge {
  const edgeId = brandedTypes.edgeId(`edge-${sourceId}-${targetId}`);
  const sourceRegionId = brandedTypes.regionId(`region-${sourceId}`);
  const targetRegionId = brandedTypes.regionId(`region-${targetId}`);

  return {
    id: edgeId,
    source: sourceRegionId,
    target: targetRegionId,
    gates: [
      {
        id: `gate-${sourceId}-${targetId}-harmony`,
        bridgeId: edgeId,
        harmonyRule: 'output-format-compliance',
        passCount: 0,
        failCount: 0,
        status: 'clear',
      },
    ],
    strength: 0.0,
    traversalCount: 0,
  };
}

// ============================================================================
// Discovery Triggers
// ============================================================================

/**
 * Creates discovery triggers for hidden regions
 * Phase 3: All 13 regions now have discovery conditions
 */
function createDiscoveryTriggers(): DiscoveryTrigger[] {
  const triggers: DiscoveryTrigger[] = [];

  // Work - always visible (no trigger, starts REVEALED)
  // Canvas - always visible (no trigger, starts REVEALED)

  // Maintenance unlocks after encountering a bug/error
  triggers.push({
    regionId: brandedTypes.regionId('region-maintenance'),
    condition: { type: 'error_encountered', errorType: 'any' },
    description: 'Encounter a bug or error to unlock Maintenance',
    triggered: false,
  });

  // Explore unlocks after asking research questions
  triggers.push({
    regionId: brandedTypes.regionId('region-explore'),
    condition: { type: 'interaction_count', threshold: 3 },
    description: 'Ask 3 research questions to unlock Explore',
    triggered: false,
  });

  // Review unlocks after completing code chains
  triggers.push({
    regionId: brandedTypes.regionId('region-review'),
    condition: { type: 'chain_completed', action: 'code/' },
    description: 'Complete 2 code chains to unlock Review',
    triggered: false,
  });

  // Settings unlocks after asking about config
  triggers.push({
    regionId: brandedTypes.regionId('region-settings'),
    condition: { type: 'interaction_count', threshold: 1 },
    description: 'Ask about configuration to unlock Settings',
    triggered: false,
  });

  // Archive unlocks after creating multiple sessions
  triggers.push({
    regionId: brandedTypes.regionId('region-archive'),
    condition: { type: 'chain_completed', action: 'code/' },
    description: 'Complete 3 sessions to unlock Archive',
    triggered: false,
  });

  // PM unlocks after first planning chain
  triggers.push({
    regionId: brandedTypes.regionId('region-pm'),
    condition: { type: 'interaction_count', threshold: 5 },
    description: 'Ask 5 planning questions to unlock Project Management',
    triggered: false,
  });

  // Harmony unlocks after first contract violation
  triggers.push({
    regionId: brandedTypes.regionId('region-harmony'),
    condition: { type: 'error_encountered', errorType: 'contract-violation' },
    description: 'Encounter a contract violation to unlock Harmony',
    triggered: false,
  });

  // Editor unlocks after first code edit
  triggers.push({
    regionId: brandedTypes.regionId('region-editor'),
    condition: { type: 'chain_completed', action: 'code/' },
    description: 'Complete a code chain to unlock Editor',
    triggered: false,
  });

  // Intel unlocks after creating a dossier
  triggers.push({
    regionId: brandedTypes.regionId('region-intel'),
    condition: { type: 'chain_completed', action: 'analyze/' },
    description: 'Create an analysis report to unlock Intel',
    triggered: false,
  });

  // Respect unlocks after boundary check
  triggers.push({
    regionId: brandedTypes.regionId('region-respect'),
    condition: { type: 'chain_completed', action: 'review/' },
    description: 'Complete a code review to unlock Respect',
    triggered: false,
  });

  // Coverage unlocks after contract work
  triggers.push({
    regionId: brandedTypes.regionId('region-coverage'),
    condition: { type: 'chain_completed', action: 'test/' },
    description: 'Run tests to unlock Coverage',
    triggered: false,
  });

  return triggers;
}

// ============================================================================
// Default Universe Export
// ============================================================================

/**
 * Creates the default universe graph
 */
export function createDefaultUniverse(): UniverseGraph {
  // Only stars become regions (filter out tools and harmony)
  const starIds: StarId[] = NAVIGATION_TARGETS.filter(
    (id) => id !== 'harmony' && id !== 'editor' && id !== 'canvas' && id !== 'coverage'
  ) as StarId[];

  const regions = starIds.map(createRegion);
  const bridges = DEFAULT_CONNECTIONS.map(([source, target]) => createBridge(source, target));
  const discoveryTriggers = createDiscoveryTriggers();

  // Calculate map bounds
  const positions = Object.values(INITIAL_POSITIONS);
  const xs = positions.map((p) => p.x);
  const ys = positions.map((p) => p.y);

  return {
    regions,
    bridges,
    discoveryTriggers,
    metadata: {
      createdAt: brandedTypes.currentTimestamp(),
      lastModifiedAt: brandedTypes.currentTimestamp(),
      evolutionHistory: [],
      totalInteractions: 0,
      discoveredRegionCount: 1, // Only Work starts revealed (Canvas is a tool, not a star)
      totalRegionCount: regions.length,
      mapBounds: {
        minX: Math.min(...xs) - 100,
        minY: Math.min(...ys) - 100,
        maxX: Math.max(...xs) + 100,
        maxY: Math.max(...ys) + 100,
      },
    },
  };
}

/**
 * Default universe singleton
 */
export const DEFAULT_UNIVERSE = createDefaultUniverse();
