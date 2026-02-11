/**
 * Living Universe Types
 * Defines the cosmic map data structures for the Living Universe visualization
 */

import type { SessionId, ChainId, Timestamp, DurationMs } from './types.js';
import type { StarId } from './workbenchTypes.js';

// ============================================================================
// Branded IDs
// ============================================================================

/** Unique identifier for a region (star) on the cosmic map */
export type RegionId = string & { readonly __brand: 'RegionId' };

/** Unique identifier for a light bridge (edge) connecting regions */
export type EdgeId = string & { readonly __brand: 'EdgeId' };

// ============================================================================
// Fog of War
// ============================================================================

/**
 * Fog state for region discovery progression
 */
export enum FogState {
  /** Completely undiscovered - invisible on the map */
  HIDDEN = 'hidden',
  /** Outline visible, not yet accessible - appears as faint glow */
  FAINT = 'faint',
  /** Fully discovered and accessible */
  REVEALED = 'revealed',
}

// ============================================================================
// Region Node (Star on the Cosmic Map)
// ============================================================================

/**
 * A region represents a star on the cosmic map.
 * Note: Regions map to StarId, NOT WorkbenchId (which includes harmony).
 * Tools (editor, canvas, coverage) are embedded inside stars, not regions themselves.
 */
export interface RegionNode {
  /** Unique region identifier */
  id: RegionId;

  /** Associated star (the workbench this region represents) */
  workbenchId: StarId;

  /** Display label */
  label: string;

  /** Optional description */
  description?: string;

  /** Position on the cosmic map */
  position: { x: number; y: number };

  /** Which layer of the Living System this region belongs to */
  layer: 'platform' | 'template' | 'philosophy' | 'physics' | 'experience';

  /** Current fog-of-war state */
  fogState: FogState;

  /** Health metrics for this region */
  health: HealthMetrics;

  /** Accumulated traces from interactions */
  traces: TraceAccumulation;

  /** Visual evolution based on activity */
  colorShift: ColorShift;

  /** Glow intensity (0.0 = dark/idle, 1.0 = blazing) */
  glowIntensity: number;

  /** Current activity status */
  status: 'idle' | 'active' | 'waiting' | 'undiscovered';

  /** When this region was first discovered */
  discoveredAt?: Timestamp;

  /** Last time this region was active */
  lastActiveAt?: Timestamp;

  /** Number of sessions that have visited this region */
  sessionCount: number;

  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Light Bridge (Connection Between Regions)
// ============================================================================

/**
 * A light bridge connects two regions and passes through Harmony terrain
 */
export interface LightBridge {
  /** Unique edge identifier */
  id: EdgeId;

  /** Source region */
  source: RegionId;

  /** Target region */
  target: RegionId;

  /** Gate checkpoints (Harmony validation points) along this bridge */
  gates: GateCheckpoint[];

  /** Bridge strength (0.0 = weak/new, 1.0 = well-traveled) */
  strength: number;

  /** Currently active chain spark traveling this bridge */
  activeSparkChainId?: ChainId;

  /** Number of times this bridge has been traversed */
  traversalCount: number;

  /** Last time this bridge was traversed */
  lastTraversed?: Timestamp;

  /** Accumulated traces from traversals (Phase 6 evolution) */
  traces: TraceAccumulation;

  /** Whether this bridge is pinned (immune to auto-removal) */
  pinned?: boolean;

  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Gate Checkpoint (Harmony Validation)
// ============================================================================

/**
 * A gate checkpoint enforces Harmony rules on a light bridge
 */
export interface GateCheckpoint {
  /** Unique gate identifier */
  id: string;

  /** Parent bridge */
  bridgeId: EdgeId;

  /** Which contract/rule this gate enforces */
  harmonyRule: string;

  /** Number of successful passes */
  passCount: number;

  /** Number of failures/violations */
  failCount: number;

  /** Last time this gate was checked */
  lastChecked?: Timestamp;

  /** Current gate status */
  status: 'clear' | 'warning' | 'violation';

  /** Total number of trace records through this gate */
  traceCount?: number;
}

// ============================================================================
// Moon Orbit (Data Sources orbiting Stars)
// ============================================================================

/**
 * A moon represents a data source orbiting a star (region)
 */
export interface MoonOrbit {
  /** Unique moon identifier */
  id: string;

  /** Parent star/region this moon orbits */
  parentRegion: RegionId;

  /** Display label */
  label: string;

  /** Type of data source */
  dataSourceType: 'external-api' | 'log-feed' | 'database' | 'file-watcher';

  /** Orbital radius (distance from parent star) */
  orbitRadius: number;

  /** Orbital speed (animation speed) */
  orbitSpeed: number;

  /** Current operational status */
  status: 'active' | 'idle' | 'error';
}

// ============================================================================
// Spark Particle (Executing Agents)
// ============================================================================

/**
 * A spark represents an executing agent visible on the cosmic map
 */
export interface SparkParticle {
  /** Unique spark identifier */
  id: string;

  /** Type of agent this spark represents */
  agentType: string;

  /** Parent star/region where this agent is executing */
  parentStar: RegionId;

  /** Current execution status */
  status: 'spawning' | 'executing' | 'completing' | 'vanished';

  /** Execution progress (0.0 - 1.0) */
  progress: number;
}

// ============================================================================
// Trace Accumulation (Interaction History)
// ============================================================================

/**
 * Accumulated traces from interactions on a region
 */
export interface TraceAccumulation {
  /** Total number of interactions */
  totalInteractions: number;

  /** Recent trace entries */
  recentTraces: TraceEntry[];

  /** Heat level (0.0 = cold, 1.0 = hot) */
  heatLevel: number;
}

/**
 * A single trace entry representing an interaction
 */
export interface TraceEntry {
  /** Chain that created this trace */
  chainId: ChainId;

  /** Session context */
  sessionId: SessionId;

  /** When the interaction occurred */
  timestamp: Timestamp;

  /** What action was performed */
  action: string;

  /** Outcome of the interaction */
  result: 'success' | 'failure' | 'partial';
}

// ============================================================================
// Color Shift (Visual Evolution)
// ============================================================================

/**
 * Visual evolution state for a region
 */
export interface ColorShift {
  /** Base color from workbench configuration (hex) */
  baseColor: string;

  /** Current evolved color (hex) */
  currentColor: string;

  /** Color saturation (0.0 = desaturated, 1.0 = vivid) */
  saturation: number;

  /** Color temperature (0.0 = cool, 1.0 = warm) */
  temperature: number;
}

// ============================================================================
// Health Metrics
// ============================================================================

/**
 * Health metrics for a region
 */
export interface HealthMetrics {
  /** Contract compliance score (0.0 - 1.0) */
  contractCompliance: number;

  /** Activity level (0.0 - 1.0) */
  activityLevel: number;

  /** Error rate (0.0 - 1.0, lower is better) */
  errorRate: number;

  /** Last health check timestamp */
  lastHealthCheck?: Timestamp;
}

// ============================================================================
// Discovery Triggers
// ============================================================================

/**
 * Organic unlock condition for a region
 */
export interface DiscoveryTrigger {
  /** Target region to unlock */
  regionId: RegionId;

  /** Condition that must be met */
  condition: DiscoveryCondition;

  /** Human-readable description */
  description: string;

  /** Whether this trigger has fired */
  triggered: boolean;

  /** When the trigger fired */
  triggeredAt?: Timestamp;

  /** Session that triggered the discovery */
  triggeredBySessionId?: SessionId;
}

/**
 * Discovery condition variants
 */
export type DiscoveryCondition =
  | { type: 'interaction_count'; threshold: number }
  | { type: 'chain_completed'; action: string }
  | { type: 'error_encountered'; errorType: string }
  | { type: 'time_elapsed'; durationMs: number }
  | { type: 'region_discovered'; requiredRegionId: RegionId }
  | { type: 'custom'; evaluator: string };

// ============================================================================
// Evolution History
// ============================================================================

/**
 * A single evolution tick in the universe's history
 */
export interface EvolutionTick {
  /** Unique tick identifier */
  id: string;

  /** When this evolution occurred */
  timestamp: Timestamp;

  /** Session context */
  sessionId: SessionId;

  /** Type of evolution */
  type: EvolutionType;

  /** Evolution details */
  details: Record<string, unknown>;
}

/**
 * Types of evolution events
 */
export type EvolutionType =
  | 'region_discovered'
  | 'region_activated'
  | 'bridge_formed'
  | 'bridge_strengthened'
  | 'gate_passed'
  | 'gate_violated'
  | 'color_shifted'
  | 'map_expanded'
  | 'topology_rewired';

// ============================================================================
// Universe Graph (Top-Level Container)
// ============================================================================

/**
 * The complete universe graph
 */
export interface UniverseGraph {
  /** All regions in the universe */
  regions: RegionNode[];

  /** All light bridges connecting regions */
  bridges: LightBridge[];

  /** Discovery triggers for fog-of-war progression */
  discoveryTriggers: DiscoveryTrigger[];

  /** Universe-level metadata */
  metadata: UniverseMetadata;
}

/**
 * Universe metadata
 */
export interface UniverseMetadata {
  /** When the universe was created */
  createdAt: Timestamp;

  /** Last modification timestamp */
  lastModifiedAt: Timestamp;

  /** Big Bang timestamp (first session) */
  bigBangTimestamp?: Timestamp;

  /** Evolution history (append-only) */
  evolutionHistory: EvolutionTick[];

  /** Total interactions across all regions */
  totalInteractions: number;

  /** Number of discovered regions */
  discoveredRegionCount: number;

  /** Total number of regions */
  totalRegionCount: number;

  /** Map bounds for rendering */
  mapBounds: { minX: number; minY: number; maxX: number; maxY: number };
}
