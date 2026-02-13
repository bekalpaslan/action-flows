/**
 * Evolution Service
 *
 * Computes and applies evolution ticks after every orchestrator interaction.
 * Tracks which regions were active, which bridges were traversed, and applies
 * color shifts and trace accumulation.
 *
 * Phase 3 Features:
 * - GAP-3: Color Shift Backend (interaction-based hue/temperature shifts)
 * - GAP-4: Glow Intensity Backend (session/chain activity indicator)
 * - GAP-11: Trace Accumulation Backend (bridge traversal history)
 */

import type {
  SessionId,
  ChainId,
  RegionId,
  EdgeId,
  EvolutionTick,
  EvolutionType,
  Timestamp,
  TraceEntry,
  ColorShift,
  TraceAccumulation,
} from '@afw/shared';
import { brandedTypes } from '@afw/shared';
import { broadcastEvolutionTick, broadcastMapExpanded } from '../ws/universeEvents.js';
import { storage } from '../storage/memory.js';

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
 * Constants for evolution calculations
 */
const EVOLUTION_CONSTANTS = {
  // Color shift per interaction
  HUE_SHIFT_PER_INTERACTION: 0.5, // degrees
  TEMPERATURE_SHIFT_PER_INTERACTION: 0.01, // 0.0-1.0 scale
  SATURATION_SHIFT_PER_INTERACTION: 0.005, // 0.0-1.0 scale

  // Cooling decay (inactive regions)
  HUE_COOLING_PER_TICK: 0.1, // degrees decay per tick when inactive
  TEMPERATURE_COOLING_PER_TICK: 0.005, // decay per tick when inactive

  // Glow intensity
  GLOW_INTENSITY_PER_CHAIN: 0.2, // intensity per active chain
  GLOW_INTENSITY_MAX: 1.0,
  GLOW_INTENSITY_MIN: 0.0,
  GLOW_DECAY_PER_TICK: 0.05, // decay when no active chains

  // Trace accumulation
  MAX_TRACES_PER_BRIDGE: 100,
  HEAT_LEVEL_PER_TRACE: 0.01, // heat level contribution per trace
  HEAT_LEVEL_MAX: 1.0,
  HEAT_DECAY_PER_TICK: 0.02, // decay per tick

  // Throttling
  MIN_TICK_INTERVAL_MS: 1000, // max 1 tick per second
} as const;

/**
 * Evolution Service
 *
 * Manages the core evolution loop: interaction → tick → color shift → WebSocket broadcast
 */
export class EvolutionService {
  private tickCounter = 0;
  private evolutionSpeed: EvolutionSpeed = 'normal';
  private autoInference = true;
  private lastTickTimestamp = 0;
  private throttlingEnabled = true; // Can be disabled for testing

  // Track interaction counts per region for cooling decay
  private regionInteractionCounts: Map<RegionId, number> = new Map();
  private regionLastActive: Map<RegionId, number> = new Map();

  // Track active chains per region for glow intensity
  private activeChainsByRegion: Map<RegionId, Set<ChainId>> = new Map();

  /**
   * Process a completed interaction and compute evolution tick.
   *
   * @param context - Interaction metadata
   * @returns Computed evolution tick (or null if evolution disabled)
   */
  public async processInteraction(context: InteractionContext): Promise<EvolutionTick | null> {
    // Increment tick counter on every interaction (used for speed threshold)
    this.tickCounter++;

    // Check if evolution should tick based on speed setting
    if (!this.shouldTick()) {
      return null;
    }

    // Throttle to max 1 tick per second (can be disabled for testing)
    const now = Date.now();
    if (this.throttlingEnabled && now - this.lastTickTimestamp < EVOLUTION_CONSTANTS.MIN_TICK_INTERVAL_MS) {
      return null;
    }
    this.lastTickTimestamp = now;

    // Track active chains for glow intensity calculation
    this.trackActiveChain(context.regionsActive, context.chainId);

    // Update interaction counts for color shift calculation
    this.updateInteractionCounts(context.regionsActive);

    // Compute color deltas for active regions
    const colorDeltas = this.computeColorDeltas(context.regionsActive || []);

    // Compute trace deltas for traversed bridges
    const traceDeltas = this.computeTraceDeltas(context.bridgesTraversed || []);

    // Compute glow intensities for active regions
    const glowIntensities = this.computeGlowIntensities(context.regionsActive || []);

    // Record trace entries for bridge traversals
    const traceEntries = this.recordBridgeTraces(
      context.bridgesTraversed || [],
      context.sessionId,
      context.chainId,
      context.success
    );

    // Create evolution tick
    const tick: EvolutionTick = {
      id: `tick-${Date.now()}-${this.tickCounter}`,
      timestamp: brandedTypes.currentTimestamp(),
      sessionId: context.sessionId,
      type: 'color_shifted',
      details: {
        colorDeltas,
        traceDeltas,
        glowIntensities,
        traceEntries,
        regionsActive: context.regionsActive || [],
        bridgesTraversed: context.bridgesTraversed || [],
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

    return tick;
  }

  /**
   * Track active chain for a region (for glow intensity calculation).
   */
  private trackActiveChain(regionsActive: RegionId[], chainId: ChainId): void {
    if (!regionsActive) return;

    for (const regionId of regionsActive) {
      if (!this.activeChainsByRegion.has(regionId)) {
        this.activeChainsByRegion.set(regionId, new Set());
      }
      this.activeChainsByRegion.get(regionId)!.add(chainId);
    }
  }

  /**
   * Update interaction counts for regions (for color shift calculation).
   */
  private updateInteractionCounts(regionsActive: RegionId[]): void {
    if (!regionsActive) return;

    const now = Date.now();
    for (const regionId of regionsActive) {
      const current = this.regionInteractionCounts.get(regionId) || 0;
      this.regionInteractionCounts.set(regionId, current + 1);
      this.regionLastActive.set(regionId, now);
    }
  }

  /**
   * Mark a chain as completed (removes from active tracking).
   * Call this when a chain finishes execution.
   */
  public markChainCompleted(chainId: ChainId, regionsActive?: RegionId[]): void {
    if (regionsActive) {
      for (const regionId of regionsActive) {
        const chains = this.activeChainsByRegion.get(regionId);
        if (chains) {
          chains.delete(chainId);
        }
      }
    } else {
      // Remove from all regions
      for (const chains of this.activeChainsByRegion.values()) {
        chains.delete(chainId);
      }
    }
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
      // Use constants for consistent values
      deltas[regionId] = {
        hueRotationDegrees: EVOLUTION_CONSTANTS.HUE_SHIFT_PER_INTERACTION,
        saturationDelta: EVOLUTION_CONSTANTS.SATURATION_SHIFT_PER_INTERACTION,
        temperatureDelta: EVOLUTION_CONSTANTS.TEMPERATURE_SHIFT_PER_INTERACTION,
      };
    }

    return deltas;
  }

  /**
   * Compute glow intensities for active regions.
   * Formula: glowIntensity = Math.min(1.0, activeChains * 0.2)
   */
  private computeGlowIntensities(regionsActive: RegionId[]): Record<string, number> {
    const intensities: Record<string, number> = {};

    for (const regionId of regionsActive) {
      const activeChains = this.activeChainsByRegion.get(regionId)?.size || 0;
      const intensity = Math.min(
        EVOLUTION_CONSTANTS.GLOW_INTENSITY_MAX,
        activeChains * EVOLUTION_CONSTANTS.GLOW_INTENSITY_PER_CHAIN
      );
      intensities[regionId] = intensity;
    }

    return intensities;
  }

  /**
   * Record trace entries for bridge traversals.
   */
  private recordBridgeTraces(
    bridgesTraversed: EdgeId[],
    sessionId: SessionId,
    chainId: ChainId,
    success: boolean
  ): Record<string, TraceEntry> {
    const entries: Record<string, TraceEntry> = {};

    for (const edgeId of bridgesTraversed) {
      entries[edgeId] = {
        chainId,
        sessionId,
        timestamp: brandedTypes.currentTimestamp(),
        action: 'bridge_traversal',
        result: success ? 'success' : 'failure',
      };
    }

    return entries;
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
   *
   * Phase 3 Implementation:
   * - Applies color shifts to active regions
   * - Updates glow intensities based on active chains
   * - Records trace entries on traversed bridges
   * - Applies cooling decay to inactive regions
   */
  private async applyEvolutionTick(tick: EvolutionTick): Promise<void> {
    const details = tick.details as {
      colorDeltas?: Record<string, ColorShiftDelta>;
      glowIntensities?: Record<string, number>;
      traceEntries?: Record<string, TraceEntry>;
      regionsActive?: RegionId[];
      bridgesTraversed?: EdgeId[];
    };

    // 1. Apply color shifts to active regions
    const regionsActive = new Set(details.regionsActive || []);
    if (details.colorDeltas) {
      for (const [regionIdStr, delta] of Object.entries(details.colorDeltas)) {
        const regionId = regionIdStr as RegionId;
        await this.applyColorShiftToRegion(regionId, delta);
      }
    }

    // 2. Apply cooling decay to inactive regions
    await this.applyCoolingDecay(regionsActive);

    // 3. Update glow intensities
    if (details.glowIntensities) {
      for (const [regionIdStr, intensity] of Object.entries(details.glowIntensities)) {
        const regionId = regionIdStr as RegionId;
        await this.applyGlowIntensityToRegion(regionId, intensity);
      }
    }

    // 4. Record trace entries on bridges
    if (details.traceEntries && details.bridgesTraversed) {
      for (const edgeId of details.bridgesTraversed) {
        const traceEntry = details.traceEntries[edgeId];
        if (traceEntry) {
          await this.recordTraceOnBridge(edgeId, traceEntry);
        }
      }
    }

    // 5. Update universe graph metadata
    const universe = storage.getUniverseGraph();
    if (universe) {
      universe.metadata.evolutionHistory.push(tick);
      universe.metadata.lastModifiedAt = brandedTypes.currentTimestamp();
      universe.metadata.totalInteractions++;

      // Prune old ticks (keep last 1000 for performance)
      if (universe.metadata.evolutionHistory.length > 1000) {
        universe.metadata.evolutionHistory = universe.metadata.evolutionHistory.slice(-1000);
      }

      storage.setUniverseGraph(universe);
    }

  }

  /**
   * Apply color shift delta to a region.
   * Updates the region's colorShift in storage.
   */
  private async applyColorShiftToRegion(
    regionId: RegionId,
    delta: ColorShiftDelta
  ): Promise<void> {
    const region = storage.getRegion(regionId);
    if (!region) return;

    // Initialize colorShift if not present
    if (!region.colorShift) {
      region.colorShift = {
        baseColor: '#6b46c1',
        currentColor: '#6b46c1',
        saturation: 0.7,
        temperature: 0.0,
      };
    }

    // Apply hue rotation to current color
    region.colorShift.currentColor = this.rotateHue(
      region.colorShift.currentColor,
      delta.hueRotationDegrees
    );

    // Apply saturation change (clamped 0.0 - 1.0)
    region.colorShift.saturation = Math.min(
      1.0,
      Math.max(0.0, region.colorShift.saturation + delta.saturationDelta)
    );

    // Apply temperature change (clamped 0.0 - 1.0)
    region.colorShift.temperature = Math.min(
      1.0,
      Math.max(0.0, region.colorShift.temperature + delta.temperatureDelta)
    );

    // Update last active timestamp
    region.lastActiveAt = brandedTypes.currentTimestamp();
    region.status = 'active';

    storage.setRegion(region);
  }

  /**
   * Apply cooling decay to inactive regions.
   * Regions not in the active set will have their color shift decay toward neutral.
   */
  private async applyCoolingDecay(activeRegions: Set<RegionId>): Promise<void> {
    const allRegions = storage.listRegions();

    for (const region of allRegions) {
      if (activeRegions.has(region.id)) continue;

      // Check if region has been inactive long enough to cool
      const lastActive = this.regionLastActive.get(region.id) || 0;
      const now = Date.now();
      if (now - lastActive < EVOLUTION_CONSTANTS.MIN_TICK_INTERVAL_MS * 10) {
        continue; // Don't cool regions that were recently active
      }

      if (!region.colorShift) continue;

      // Apply hue cooling (shift back toward base color)
      const currentHue = this.extractHue(region.colorShift.currentColor);
      const baseHue = this.extractHue(region.colorShift.baseColor);
      const hueDiff = currentHue - baseHue;

      if (Math.abs(hueDiff) > EVOLUTION_CONSTANTS.HUE_COOLING_PER_TICK) {
        const coolingDirection = hueDiff > 0 ? -1 : 1;
        region.colorShift.currentColor = this.rotateHue(
          region.colorShift.currentColor,
          EVOLUTION_CONSTANTS.HUE_COOLING_PER_TICK * coolingDirection
        );
      }

      // Apply temperature cooling
      if (region.colorShift.temperature > 0) {
        region.colorShift.temperature = Math.max(
          0,
          region.colorShift.temperature - EVOLUTION_CONSTANTS.TEMPERATURE_COOLING_PER_TICK
        );
      }

      // Apply glow decay
      if (region.glowIntensity > EVOLUTION_CONSTANTS.GLOW_INTENSITY_MIN) {
        region.glowIntensity = Math.max(
          EVOLUTION_CONSTANTS.GLOW_INTENSITY_MIN,
          region.glowIntensity - EVOLUTION_CONSTANTS.GLOW_DECAY_PER_TICK
        );
      }

      storage.setRegion(region);
    }
  }

  /**
   * Apply glow intensity to a region.
   */
  private async applyGlowIntensityToRegion(
    regionId: RegionId,
    intensity: number
  ): Promise<void> {
    const region = storage.getRegion(regionId);
    if (!region) return;

    region.glowIntensity = Math.min(
      EVOLUTION_CONSTANTS.GLOW_INTENSITY_MAX,
      Math.max(EVOLUTION_CONSTANTS.GLOW_INTENSITY_MIN, intensity)
    );

    storage.setRegion(region);
  }

  /**
   * Record a trace entry on a bridge.
   * Updates the bridge's trace accumulation and heat level.
   */
  private async recordTraceOnBridge(
    edgeId: EdgeId,
    traceEntry: TraceEntry
  ): Promise<void> {
    const bridge = storage.getBridge(edgeId);
    if (!bridge) return;

    // Initialize traces if not present
    if (!bridge.traces) {
      bridge.traces = {
        totalInteractions: 0,
        recentTraces: [],
        heatLevel: 0,
      };
    }

    // Add trace entry
    bridge.traces.recentTraces.push(traceEntry);
    bridge.traces.totalInteractions++;

    // Prune old traces (keep last MAX_TRACES_PER_BRIDGE)
    if (bridge.traces.recentTraces.length > EVOLUTION_CONSTANTS.MAX_TRACES_PER_BRIDGE) {
      bridge.traces.recentTraces = bridge.traces.recentTraces.slice(
        -EVOLUTION_CONSTANTS.MAX_TRACES_PER_BRIDGE
      );
    }

    // Calculate heat level from recent trace frequency
    const recentTraceCount = bridge.traces.recentTraces.length;
    bridge.traces.heatLevel = Math.min(
      EVOLUTION_CONSTANTS.HEAT_LEVEL_MAX,
      recentTraceCount * EVOLUTION_CONSTANTS.HEAT_LEVEL_PER_TRACE
    );

    // Update traversal metadata
    bridge.traversalCount = (bridge.traversalCount || 0) + 1;
    bridge.lastTraversed = brandedTypes.currentTimestamp();

    storage.setBridge(bridge);
  }

  /**
   * Rotate hue of a hex color by specified degrees.
   */
  private rotateHue(hexColor: string, degrees: number): string {
    const hsl = this.hexToHsl(hexColor);
    hsl.h = (hsl.h + degrees + 360) % 360;
    return this.hslToHex(hsl);
  }

  /**
   * Extract hue from a hex color (0-360 degrees).
   */
  private extractHue(hexColor: string): number {
    return this.hexToHsl(hexColor).h;
  }

  /**
   * Convert hex color to HSL.
   */
  private hexToHsl(hex: string): { h: number; s: number; l: number } {
    // Remove # if present
    hex = hex.replace(/^#/, '');

    // Parse RGB
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;

    let h = 0;
    let s = 0;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r:
          h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
          break;
        case g:
          h = ((b - r) / d + 2) / 6;
          break;
        case b:
          h = ((r - g) / d + 4) / 6;
          break;
      }
    }

    return { h: h * 360, s, l };
  }

  /**
   * Convert HSL to hex color.
   */
  private hslToHex(hsl: { h: number; s: number; l: number }): string {
    const { h, s, l } = hsl;
    const hNorm = h / 360;

    let r: number, g: number, b: number;

    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number): number => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, hNorm + 1 / 3);
      g = hue2rgb(p, q, hNorm);
      b = hue2rgb(p, q, hNorm - 1 / 3);
    }

    const toHex = (x: number): string => {
      const hex = Math.round(x * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
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
      // Broadcast failure - silently continue
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

    return newRegion.id;
    */
  }

  /**
   * Calculate position for new region using force-directed layout.
   * Uses grid snapping and minimum distance enforcement for clean layouts.
   */
  private async calculateNewRegionPosition(
    existingRegions: Array<{ position: { x: number; y: number } }>,
    bridges: Array<{ source: string; target: string }>
  ): Promise<{ x: number; y: number }> {
    try {
      // Dynamic import to avoid circular dependency
      const { getForceDirectedLayoutService } = await import('./forceDirectedLayout.js');
      const layoutService = getForceDirectedLayoutService();

      // Use force-directed layout with grid snapping
      return layoutService.calculatePosition(existingRegions, bridges || []);
    } catch (error) {
      // Layout calculation failed, use fallback
      const maxX = Math.max(...existingRegions.map((r) => r.position.x), 0);
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
      // For now, this is a stub (storage integration pending)

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
      // Inference service failed, continue without updates
    }
  }

  /**
   * Check if evolution should tick based on configured speed.
   */
  private shouldTick(): boolean {
    // Explicitly handle "off" - never tick
    if (this.evolutionSpeed === 'off') {
      return false;
    }

    const thresholds: Record<Exclude<EvolutionSpeed, 'off'>, number> = {
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
  }

  /**
   * Set auto-inference setting (from Settings workbench).
   */
  public setAutoInference(enabled: boolean): void {
    this.autoInference = enabled;
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

  /**
   * Get interaction count for a region.
   */
  public getRegionInteractionCount(regionId: RegionId): number {
    return this.regionInteractionCounts.get(regionId) || 0;
  }

  /**
   * Get active chain count for a region.
   */
  public getRegionActiveChainCount(regionId: RegionId): number {
    return this.activeChainsByRegion.get(regionId)?.size || 0;
  }

  /**
   * Get all region statistics for debugging.
   */
  public getRegionStats(): Array<{
    regionId: RegionId;
    interactionCount: number;
    activeChainCount: number;
    lastActive: number | undefined;
  }> {
    const allRegionIds = new Set([
      ...this.regionInteractionCounts.keys(),
      ...this.activeChainsByRegion.keys(),
    ]);

    return Array.from(allRegionIds).map((regionId) => ({
      regionId,
      interactionCount: this.regionInteractionCounts.get(regionId) || 0,
      activeChainCount: this.activeChainsByRegion.get(regionId)?.size || 0,
      lastActive: this.regionLastActive.get(regionId),
    }));
  }

  /**
   * Reset tracking data (for testing).
   */
  public resetTracking(): void {
    this.regionInteractionCounts.clear();
    this.regionLastActive.clear();
    this.activeChainsByRegion.clear();
    this.tickCounter = 0;
    this.lastTickTimestamp = 0;
  }

  /**
   * Enable or disable throttling (for testing).
   * In production, throttling should always be enabled.
   */
  public setThrottling(enabled: boolean): void {
    this.throttlingEnabled = enabled;
  }

  /**
   * Check if throttling is enabled.
   */
  public isThrottlingEnabled(): boolean {
    return this.throttlingEnabled;
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
