/**
 * Evolution Service
 *
 * Computes and applies evolution ticks after every orchestrator interaction.
 * Tracks which regions were active, which bridges were traversed, and applies
 * color shifts and trace accumulation.
 */

import type {
  SessionId,
  ChainId,
  RegionId,
  EdgeId,
  EvolutionTick,
  EvolutionType,
  Timestamp,
} from '@afw/shared';
import { brandedTypes } from '@afw/shared';
import { broadcastEvolutionTick, broadcastMapExpanded } from '../ws/universeEvents.js';

/**
 * Interaction context for evolution computation
 */
export interface InteractionContext {
  sessionId: SessionId;
  chainId: ChainId;
  regionsActive: RegionId[];
  bridgesTraversed: EdgeId[];
  durationMs: number;
  success: boolean;
}

/**
 * Color shift delta
 */
export interface ColorShiftDelta {
  hueRotationDegrees: number;
  saturationDelta: number;
  temperatureDelta: number;
}

/**
 * Trace increment for bridges
 */
export interface TraceIncrement {
  timestamp: Timestamp;
  strengthIncrement: number;
}

/**
 * Evolution speed setting
 */
export type EvolutionSpeed = 'off' | 'slow' | 'normal' | 'fast';

/**
 * Evolution Service
 *
 * Manages the core evolution loop: interaction → tick → color shift → WebSocket broadcast
 */
export class EvolutionService {
  private tickCounter = 0;
  private evolutionSpeed: EvolutionSpeed = 'normal';
  private autoInference = true;

  /**
   * Process a completed interaction and compute evolution tick.
   *
   * @param context - Interaction metadata
   * @returns Computed evolution tick (or null if evolution disabled)
   */
  public async processInteraction(context: InteractionContext): Promise<EvolutionTick | null> {
    // Check if evolution should tick based on speed setting
    if (!this.shouldTick()) {
      return null;
    }

    this.tickCounter++;

    // Compute color deltas for active regions
    const colorDeltas = this.computeColorDeltas(context.regionsActive);

    // Compute trace deltas for traversed bridges
    const traceDeltas = this.computeTraceDeltas(context.bridgesTraversed);

    // Create evolution tick
    const tick: EvolutionTick = {
      id: `tick-${Date.now()}-${this.tickCounter}`,
      timestamp: brandedTypes.currentTimestamp(),
      sessionId: context.sessionId,
      type: 'color_shifted',
      details: {
        colorDeltas,
        traceDeltas,
        regionsActive: context.regionsActive,
        bridgesTraversed: context.bridgesTraversed,
      },
    };

    // Check for new workbenches (every 50 interactions)
    if (this.tickCounter % 50 === 0) {
      const newRegionId = await this.checkForNewWorkbenches(context.sessionId);
      if (newRegionId) {
        tick.type = 'map_expanded';
        (tick.details as any).newRegionId = newRegionId;
      }

      // Run connection inference if enabled
      if (this.autoInference) {
        await this.runConnectionInference(context.sessionId);
      }
    }

    // Apply evolution to universe state
    await this.applyEvolutionTick(tick);

    // Broadcast to connected clients
    this.broadcastTick(tick);

    console.log(
      `[EvolutionService] Tick ${this.tickCounter} processed (${context.regionsActive.length} regions active)`
    );

    return tick;
  }

  /**
   * Compute color shift deltas for active regions.
   * Regions used more often shift toward warmer hues.
   *
   * Formula: +0.5° hue per interaction (reaches +15° after 30 interactions)
   */
  private computeColorDeltas(regionsActive: RegionId[]): Record<string, ColorShiftDelta> {
    const deltas: Record<string, ColorShiftDelta> = {};

    for (const regionId of regionsActive) {
      // Hue rotation: +0.5° per interaction (reaches +15° after 30 interactions)
      const hueRotation = 0.5;

      // Temperature increase: +0.01 per interaction (0.0 to 1.0 scale)
      const temperatureIncrease = 0.01;

      deltas[regionId] = {
        hueRotationDegrees: hueRotation,
        saturationDelta: 0.005, // Slight saturation increase
        temperatureDelta: temperatureIncrease,
      };
    }

    return deltas;
  }

  /**
   * Compute trace accumulation deltas for traversed bridges.
   * Bridge strength is already tracked by BridgeStrengthService.
   */
  private computeTraceDeltas(bridgesTraversed: EdgeId[]): Record<string, TraceIncrement> {
    const deltas: Record<string, TraceIncrement> = {};

    for (const edgeId of bridgesTraversed) {
      // BridgeStrengthService already updated strength during traversal
      // We just record the trace entry
      deltas[edgeId] = {
        timestamp: brandedTypes.currentTimestamp(),
        strengthIncrement: 0.05, // Small increment per traversal
      };
    }

    return deltas;
  }

  /**
   * Apply evolution tick to universe state (persisted).
   * This is a stub for Batch A - full implementation in later phases.
   */
  private async applyEvolutionTick(tick: EvolutionTick): Promise<void> {
    // TODO: Integrate with storage service
    // const storage = getStorageService();
    // const universe = await storage.getUniverse(tick.sessionId);
    // if (universe) {
    //   universe.metadata.evolutionHistory.push(tick);
    //
    //   // Prune old ticks (keep last 1000 for performance)
    //   if (universe.metadata.evolutionHistory.length > 1000) {
    //     universe.metadata.evolutionHistory = universe.metadata.evolutionHistory.slice(-1000);
    //   }
    //
    //   await storage.updateUniverse(universe);
    // }

    console.log(`[EvolutionService] Applied tick ${tick.id} (stub - storage integration pending)`);
  }

  /**
   * Broadcast evolution tick via WebSocket.
   */
  private broadcastTick(tick: EvolutionTick): void {
    try {
      broadcastEvolutionTick(
        tick.sessionId,
        tick.id,
        tick.type,
        tick.details
      );
    } catch (err) {
      console.error('[EvolutionService] Failed to broadcast evolution tick:', err);
    }
  }

  /**
   * Check for new user-created workbenches.
   * Called during evolution tick evaluation (every 50 interactions).
   *
   * @returns New region ID if workbench created, null otherwise
   */
  private async checkForNewWorkbenches(sessionId: SessionId): Promise<RegionId | null> {
    // TODO: Integrate with storage service
    // For now, this is a stub that returns null
    // Full implementation will:
    // 1. Fetch universe from storage
    // 2. Check for workbenches not yet mapped to regions
    // 3. Create new region for first unmapped workbench
    // 4. Broadcast map_expanded event

    console.log(`[EvolutionService] Checked for new workbenches (stub - storage integration pending)`);
    return null;

    /* Full implementation:
    const storage = getStorageService();
    const universe = await storage.getUniverse(sessionId);

    if (!universe) return null;

    // Check for workbenches not yet mapped to regions
    const unmappedWorkbenches = universe.metadata.customWorkbenches.filter(
      (wb) => !universe.regions.some((r) => r.workbenchId === wb.id)
    );

    if (unmappedWorkbenches.length === 0) return null;

    // Create region for first unmapped workbench
    const workbench = unmappedWorkbenches[0];
    const newRegion: RegionNode = {
      id: `region-${workbench.id}` as RegionId,
      workbenchId: workbench.id,
      label: workbench.name,
      layer: 'experience',
      fogState: FogState.REVEALED,
      position: this.calculateNewRegionPosition(universe.regions),
      colorShift: {
        baseColor: '#6b46c1',
        currentColor: '#6b46c1',
        saturation: 0.7,
        temperature: 0.0,
      },
      health: {
        overall: 1.0,
        gatePassRate: 0.0,
        activeConnections: 0,
      },
    };

    // Add region to universe
    universe.regions.push(newRegion);
    await storage.updateUniverse(universe);

    // Broadcast map expansion
    broadcastMapExpanded(sessionId, newRegion.id, []);

    console.log(`[EvolutionService] New region created for workbench: ${workbench.name}`);

    return newRegion.id;
    */
  }

  /**
   * Calculate position for new region using force-directed layout.
   * Uses grid snapping and minimum distance enforcement for clean layouts.
   */
  private async calculateNewRegionPosition(existingRegions: any[], bridges: any[]): Promise<{ x: number; y: number }> {
    try {
      // Dynamic import to avoid circular dependency
      const { getForceDirectedLayoutService } = await import('./forceDirectedLayout.js');
      const layoutService = getForceDirectedLayoutService();

      // Use force-directed layout with grid snapping
      return layoutService.calculatePosition(existingRegions, bridges || []);
    } catch (error) {
      console.error('[EvolutionService] Force-directed layout failed, using fallback:', error);

      // Fallback: simple grid placement
      const maxX = Math.max(...existingRegions.map((r: any) => r.position.x), 0);
      return { x: maxX + 300, y: 300 };
    }
  }

  /**
   * Run connection inference to suggest and manage bridges.
   * Called periodically (every 50 interactions) when auto-inference is enabled.
   *
   * @param sessionId - Current session ID
   */
  private async runConnectionInference(sessionId: SessionId): Promise<void> {
    try {
      // Dynamic import to avoid circular dependency
      const { getConnectionInferenceService } = await import('./connectionInference.js');
      const inferenceService = getConnectionInferenceService();

      // TODO: Integrate with storage service to get universe
      // For now, this is a stub that logs the intent
      console.log(`[EvolutionService] Connection inference would run for session ${sessionId}`);

      /* Full implementation when storage is integrated:
      const storage = getStorageService();
      const universe = await storage.getUniverse(sessionId);

      if (!universe) return;

      // Run inference
      const result = await inferenceService.inferConnections(universe);

      if (result.newBridgeIds.length > 0 || result.removedBridgeIds.length > 0) {
        // Persist changes
        await storage.updateUniverse(universe);

        // Broadcast map expansion if new bridges created
        if (result.newBridgeIds.length > 0) {
          broadcastMapExpanded(sessionId, null, result.newBridgeIds);
        }

        console.log(
          `[EvolutionService] Connection inference: ${result.newBridgeIds.length} added, ${result.removedBridgeIds.length} removed`
        );
      }
      */
    } catch (error) {
      console.error('[EvolutionService] Connection inference failed:', error);
    }
  }

  /**
   * Check if evolution should tick based on configured speed.
   */
  private shouldTick(): boolean {
    const thresholds: Record<EvolutionSpeed, number> = {
      off: Infinity,
      slow: 20,    // Tick every 20 interactions
      normal: 10,  // Tick every 10 interactions
      fast: 5,     // Tick every 5 interactions
    };

    const threshold = thresholds[this.evolutionSpeed];
    return this.tickCounter % threshold === 0;
  }

  /**
   * Set evolution speed (from Settings workbench).
   */
  public setEvolutionSpeed(speed: EvolutionSpeed): void {
    this.evolutionSpeed = speed;
    console.log(`[EvolutionService] Evolution speed set to: ${speed}`);
  }

  /**
   * Set auto-inference setting (from Settings workbench).
   */
  public setAutoInference(enabled: boolean): void {
    this.autoInference = enabled;
    console.log(`[EvolutionService] Auto-inference set to: ${enabled}`);
  }

  /**
   * Get current evolution speed.
   */
  public getEvolutionSpeed(): EvolutionSpeed {
    return this.evolutionSpeed;
  }

  /**
   * Get auto-inference setting.
   */
  public getAutoInference(): boolean {
    return this.autoInference;
  }

  /**
   * Get current tick counter.
   */
  public getTickCounter(): number {
    return this.tickCounter;
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let evolutionServiceInstance: EvolutionService | null = null;

/**
 * Initialize the EvolutionService singleton.
 * Call this once during backend startup.
 */
export function initEvolutionService(): EvolutionService {
  if (!evolutionServiceInstance) {
    evolutionServiceInstance = new EvolutionService();
    console.log('[EvolutionService] Service initialized');
  }
  return evolutionServiceInstance;
}

/**
 * Get the EvolutionService singleton instance.
 */
export function getEvolutionService(): EvolutionService {
  if (!evolutionServiceInstance) {
    // Auto-initialize on first access
    return initEvolutionService();
  }
  return evolutionServiceInstance;
}
