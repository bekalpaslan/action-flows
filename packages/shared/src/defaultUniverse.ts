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
import type { WorkbenchId } from './workbenchTypes.js';
import { WORKBENCH_IDS, DEFAULT_WORKBENCH_CONFIGS } from './workbenchTypes.js';
import { brandedTypes } from './types.js';

// ============================================================================
// Layer Assignments
// ============================================================================

/**
 * Maps workbenches to Living System layers
 */
const LAYER_ASSIGNMENTS: Record<WorkbenchId, 'platform' | 'template' | 'philosophy' | 'physics' | 'experience'> = {
  // Experience Layer (user-facing workbenches)
  archive: 'experience',
  intel: 'experience',
  pm: 'experience',

  // Physics Layer (execution workbenches)
  work: 'physics',
  maintenance: 'physics',
  editor: 'physics',
  review: 'physics',
  coverage: 'physics',

  // Philosophy Layer (framework workbenches)
  harmony: 'philosophy',
  settings: 'philosophy',
  canvas: 'philosophy',

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
 */
const INITIAL_POSITIONS: Record<WorkbenchId, { x: number; y: number }> = {
  // Framework Tools Cluster (upper region)
  harmony: { x: -400, y: -300 },
  respect: { x: -200, y: -350 },
  intel: { x: 0, y: -300 },
  canvas: { x: 200, y: -350 },
  editor: { x: 400, y: -300 },
  settings: { x: -100, y: -150 },
  coverage: { x: 100, y: -150 },

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
 * Work starts revealed, others at faint or hidden
 */
const INITIAL_FOG_STATES: Record<WorkbenchId, FogState> = {
  work: FogState.REVEALED,           // Starting region
  maintenance: FogState.FAINT,       // Adjacent to work
  explore: FogState.FAINT,           // Adjacent to work
  review: FogState.FAINT,            // Adjacent to work
  archive: FogState.FAINT,           // Always visible but inactive
  settings: FogState.FAINT,          // Framework config
  pm: FogState.HIDDEN,               // Unlocked after planning activity
  harmony: FogState.HIDDEN,          // Unlocked after first violation
  editor: FogState.HIDDEN,           // Unlocked after first edit
  intel: FogState.HIDDEN,            // Unlocked after dossier creation
  respect: FogState.HIDDEN,          // Unlocked after boundary check
  canvas: FogState.HIDDEN,           // Unlocked after design work
  coverage: FogState.HIDDEN,         // Unlocked after contract work
};

// ============================================================================
// Region Creation
// ============================================================================

/**
 * Creates a region node from a workbench
 */
function createRegion(workbenchId: WorkbenchId): RegionNode {
  const config = DEFAULT_WORKBENCH_CONFIGS[workbenchId];
  const layer = LAYER_ASSIGNMENTS[workbenchId];
  const position = INITIAL_POSITIONS[workbenchId];
  const fogState = INITIAL_FOG_STATES[workbenchId];

  return {
    id: brandedTypes.regionId(`region-${workbenchId}`),
    workbenchId,
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
 * Default connections between related workbenches
 */
const DEFAULT_CONNECTIONS: Array<[WorkbenchId, WorkbenchId]> = [
  // Primary workflow bridges
  ['work', 'maintenance'],
  ['work', 'explore'],
  ['work', 'review'],
  ['maintenance', 'review'],
  ['explore', 'review'],

  // Framework bridges
  ['settings', 'harmony'],
  ['settings', 'coverage'],
  ['harmony', 'respect'],
  ['coverage', 'respect'],

  // Archival bridges
  ['review', 'archive'],
  ['pm', 'archive'],

  // Intel bridges
  ['work', 'intel'],
  ['explore', 'intel'],

  // Editor bridges
  ['work', 'editor'],
  ['maintenance', 'editor'],

  // Canvas bridges
  ['work', 'canvas'],
  ['explore', 'canvas'],

  // PM bridges
  ['work', 'pm'],
  ['explore', 'pm'],
];

/**
 * Creates a light bridge between two regions
 */
function createBridge(sourceId: WorkbenchId, targetId: WorkbenchId): LightBridge {
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
 */
function createDiscoveryTriggers(): DiscoveryTrigger[] {
  const triggers: DiscoveryTrigger[] = [];

  // PM unlocks after first planning chain
  triggers.push({
    regionId: brandedTypes.regionId('region-pm'),
    condition: { type: 'chain_completed', action: 'plan/' },
    description: 'Complete a planning chain to unlock Project Management',
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
    condition: { type: 'chain_completed', action: 'intel/' },
    description: 'Create an intelligence dossier to unlock Intel',
    triggered: false,
  });

  // Respect unlocks after boundary check
  triggers.push({
    regionId: brandedTypes.regionId('region-respect'),
    condition: { type: 'chain_completed', action: 'respect/' },
    description: 'Run a spatial boundary check to unlock Respect',
    triggered: false,
  });

  // Canvas unlocks after design work
  triggers.push({
    regionId: brandedTypes.regionId('region-canvas'),
    condition: { type: 'chain_completed', action: 'canvas/' },
    description: 'Open a design preview to unlock Canvas',
    triggered: false,
  });

  // Coverage unlocks after contract work
  triggers.push({
    regionId: brandedTypes.regionId('region-coverage'),
    condition: { type: 'chain_completed', action: 'coverage/' },
    description: 'Check contract coverage to unlock Coverage',
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
  const regions = WORKBENCH_IDS.map(createRegion);
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
      discoveredRegionCount: 1, // Work starts revealed
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
