/**
 * Connection Inference Service
 *
 * Analyzes evolution history to detect patterns and suggest new connections.
 * Suggests bridges between region pairs that frequently co-occur but aren't connected.
 *
 * Rules:
 * - Minimum 10 co-occurrences required before suggesting
 * - Human overrides are "pinned" and never auto-removed
 * - Weak bridges fade but remain traversable
 */

import type {
  RegionId,
  EdgeId,
  EvolutionTick,
  LightBridge,
  UniverseGraph,
} from '@afw/shared';
import { brandedTypes } from '@afw/shared';

/**
 * Bridge suggestion with confidence score
 */
export interface BridgeSuggestion {
  fromRegion: RegionId;
  toRegion: RegionId;
  coOccurrenceCount: number;
  confidence: number; // 0.0 to 1.0
}

/**
 * Co-occurrence matrix tracking region pair frequency
 */
export interface CoOccurrenceMatrix {
  [key: string]: number; // "regionA→regionB" -> count
}

/**
 * Connection Inference Service
 *
 * Analyzes interaction patterns to suggest and manage bridges between regions.
 */
export class ConnectionInferenceService {
  private readonly MIN_COOCCURRENCE_THRESHOLD = 10;
  private readonly CONFIDENCE_THRESHOLD = 0.7;
  private readonly WEAK_BRIDGE_THRESHOLD = 5; // Traversals needed to avoid removal
  private readonly WEAK_BRIDGE_AGE_DAYS = 7; // Days of inactivity before removal

  /**
   * Analyze evolution history for co-occurrence patterns.
   *
   * @param evolutionHistory - Full evolution tick history
   * @returns Bridge suggestions with confidence scores
   */
  public analyzeCoOccurrence(evolutionHistory: EvolutionTick[]): BridgeSuggestion[] {
    const matrix = this.buildCoOccurrenceMatrix(evolutionHistory);
    const suggestions: BridgeSuggestion[] = [];

    for (const [key, count] of Object.entries(matrix)) {
      if (count >= this.MIN_COOCCURRENCE_THRESHOLD) {
        const [fromRegion, toRegion] = key.split('→') as [RegionId, RegionId];
        const confidence = this.calculateConfidence(count);

        suggestions.push({
          fromRegion,
          toRegion,
          coOccurrenceCount: count,
          confidence,
        });
      }
    }

    // Sort by confidence (highest first)
    suggestions.sort((a, b) => b.confidence - a.confidence);

    console.log(`[ConnectionInference] Found ${suggestions.length} bridge suggestions`);

    return suggestions;
  }

  /**
   * Calculate confidence score for a bridge suggestion.
   *
   * Formula: min(coOccurrenceCount / 20, 1.0)
   * - Reaches 1.0 confidence at 20 co-occurrences
   * - Linear scaling from 0.0 to 1.0
   *
   * @param coOccurrenceCount - Number of times regions co-occurred
   * @returns Confidence score (0.0 to 1.0)
   */
  private calculateConfidence(coOccurrenceCount: number): number {
    return Math.min(coOccurrenceCount / 20, 1.0);
  }

  /**
   * Build co-occurrence matrix from evolution history.
   * Counts how many times region pairs appear together in same chain.
   */
  private buildCoOccurrenceMatrix(evolutionHistory: EvolutionTick[]): CoOccurrenceMatrix {
    const matrix: CoOccurrenceMatrix = {};

    for (const tick of evolutionHistory) {
      const regionsActive = tick.details.regionsActive as RegionId[];
      if (!regionsActive || regionsActive.length < 2) continue;

      // Count all pairs within this tick
      for (let i = 0; i < regionsActive.length; i++) {
        for (let j = i + 1; j < regionsActive.length; j++) {
          const regionA = regionsActive[i];
          const regionB = regionsActive[j];

          // Bidirectional key (same as bridge key)
          const key = this.getBridgeKey(regionA, regionB);

          matrix[key] = (matrix[key] || 0) + 1;
        }
      }
    }

    return matrix;
  }

  /**
   * Generate bidirectional bridge key.
   * Same key for A→B and B→A (undirected bridges).
   */
  private getBridgeKey(from: RegionId, to: RegionId): string {
    return [from, to].sort().join('→');
  }

  /**
   * Check if a bridge should be removed (unused for extended period).
   * Never removes pinned bridges.
   *
   * Removal criteria:
   * - Not pinned (user override)
   * - Unused for 7+ days
   * - Less than 5 total traversals
   *
   * @param bridge - Bridge to evaluate
   * @param currentTime - Current timestamp
   * @returns True if bridge should be removed
   */
  public shouldRemoveBridge(bridge: LightBridge, currentTime: number): boolean {
    // Never remove pinned bridges (human override)
    if (bridge.pinned) {
      return false;
    }

    // Check age of last traversal
    const lastTraversal = bridge.traces.recentTraces[0]?.timestamp || 0;
    const timeSinceLastTraversal = currentTime - (typeof lastTraversal === 'number' ? lastTraversal : 0);
    const oneWeek = this.WEAK_BRIDGE_AGE_DAYS * 24 * 60 * 60 * 1000;

    if (timeSinceLastTraversal < oneWeek) {
      return false;
    }

    // Remove if total traversals below threshold
    return bridge.traces.totalInteractions < this.WEAK_BRIDGE_THRESHOLD;
  }

  /**
   * Apply bridge suggestions to universe graph.
   * Creates new bridges for high-confidence suggestions.
   *
   * @param universe - Current universe graph
   * @param suggestions - Bridge suggestions
   * @returns Array of newly created bridge IDs
   */
  public applyBridgeSuggestions(
    universe: UniverseGraph,
    suggestions: BridgeSuggestion[]
  ): EdgeId[] {
    const newBridgeIds: EdgeId[] = [];

    for (const suggestion of suggestions) {
      // Skip if bridge already exists
      const existingBridge = universe.bridges.find(
        (b) =>
          (b.source === suggestion.fromRegion && b.target === suggestion.toRegion) ||
          (b.source === suggestion.toRegion && b.target === suggestion.fromRegion)
      );

      if (existingBridge) continue;

      // Only apply high-confidence suggestions (>= 0.7)
      if (suggestion.confidence < this.CONFIDENCE_THRESHOLD) continue;

      // Create new bridge
      const newBridge: LightBridge = {
        id: `bridge-${Date.now()}-${newBridgeIds.length}` as EdgeId,
        source: suggestion.fromRegion,
        target: suggestion.toRegion,
        gates: [], // No gates by default
        strength: 0.3, // Minimum strength
        pinned: false, // Can be auto-removed if unused
        traversalCount: 0,
        traces: {
          totalInteractions: 0,
          recentTraces: [],
          heatLevel: 0.0,
        },
      };

      universe.bridges.push(newBridge);
      newBridgeIds.push(newBridge.id);

      console.log(
        `[ConnectionInference] Created bridge: ${suggestion.fromRegion} → ${suggestion.toRegion} (confidence: ${suggestion.confidence.toFixed(2)})`
      );
    }

    return newBridgeIds;
  }

  /**
   * Prune weak/unused bridges.
   * Removes bridges that haven't been traversed in extended period.
   *
   * @param universe - Current universe graph
   * @returns Array of removed bridge IDs
   */
  public pruneWeakBridges(universe: UniverseGraph): EdgeId[] {
    const currentTime = Date.now();
    const removedBridgeIds: EdgeId[] = [];

    universe.bridges = universe.bridges.filter((bridge) => {
      if (this.shouldRemoveBridge(bridge, currentTime)) {
        removedBridgeIds.push(bridge.id);
        console.log(`[ConnectionInference] Removed weak bridge: ${bridge.id}`);
        return false;
      }
      return true;
    });

    return removedBridgeIds;
  }

  /**
   * Suggest new bridges for a universe based on evolution history.
   * Main entry point for connection inference.
   *
   * @param universe - Current universe graph
   * @returns Object containing new and removed bridge IDs
   */
  public async inferConnections(universe: UniverseGraph): Promise<{
    newBridgeIds: EdgeId[];
    removedBridgeIds: EdgeId[];
    suggestions: BridgeSuggestion[];
  }> {
    // Analyze patterns
    const suggestions = this.analyzeCoOccurrence(universe.metadata.evolutionHistory);

    // Apply high-confidence suggestions
    const newBridgeIds = this.applyBridgeSuggestions(universe, suggestions);

    // Prune weak bridges
    const removedBridgeIds = this.pruneWeakBridges(universe);

    console.log(
      `[ConnectionInference] Connection inference complete: ${newBridgeIds.length} added, ${removedBridgeIds.length} removed`
    );

    return {
      newBridgeIds,
      removedBridgeIds,
      suggestions: suggestions.filter(s => s.confidence >= this.CONFIDENCE_THRESHOLD),
    };
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let connectionInferenceServiceInstance: ConnectionInferenceService | null = null;

/**
 * Initialize the ConnectionInferenceService singleton.
 * Call this once during backend startup.
 */
export function initConnectionInferenceService(): ConnectionInferenceService {
  if (!connectionInferenceServiceInstance) {
    connectionInferenceServiceInstance = new ConnectionInferenceService();
    console.log('[ConnectionInferenceService] Service initialized');
  }
  return connectionInferenceServiceInstance;
}

/**
 * Get the ConnectionInferenceService singleton instance.
 */
export function getConnectionInferenceService(): ConnectionInferenceService {
  if (!connectionInferenceServiceInstance) {
    // Auto-initialize on first access
    return initConnectionInferenceService();
  }
  return connectionInferenceServiceInstance;
}
