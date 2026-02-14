/**
 * Force-Directed Layout Service
 *
 * Calculates optimal positions for new regions using force-directed algorithm with grid snapping.
 * Ensures regions are well-distributed and maintain minimum distances for readability.
 *
 * Features:
 * - Grid snapping (50px) for clean layouts
 * - Minimum distance enforcement (200px)
 * - Connected region clustering
 * - Fallback positioning for edge cases
 */

import type { RegionNode, LightBridge, RegionId } from '@afw/shared';

/**
 * Layout constraints for region positioning
 */
export interface LayoutConstraints {
  /** Minimum distance between regions (px) */
  minDistance: number;

  /** Maximum distance between connected regions (px) */
  maxDistance: number;

  /** Grid cell size for snapping (px) */
  gridSize: number;

  /** Map center X */
  centerX: number;

  /** Map center Y */
  centerY: number;
}

/**
 * Position on 2D map
 */
export interface Position {
  x: number;
  y: number;
}

/**
 * Force-Directed Layout Service
 *
 * Calculates intelligent positions for new regions using physics-inspired
 * force-directed algorithm with grid snapping for clean layouts.
 */
export class ForceDirectedLayoutService {
  private readonly DEFAULT_CONSTRAINTS: LayoutConstraints = {
    minDistance: 200,
    maxDistance: 500,
    gridSize: 50,
    centerX: 400,
    centerY: 300,
  };

  /**
   * Calculate position for new region using force-directed algorithm.
   *
   * Strategy:
   * 1. Find connected regions (via bridges)
   * 2. Calculate center of mass of connected cluster
   * 3. Find empty space near cluster center
   * 4. Snap to grid for clean layout
   *
   * @param newRegion - New region to position
   * @param existingRegions - Existing regions
   * @param bridges - All bridges (determines connections)
   * @returns Optimal position
   */
  public calculateNewRegionPosition(
    newRegion: RegionNode,
    existingRegions: RegionNode[],
    bridges: LightBridge[]
  ): Position {
    // Find connected regions
    const connectedRegions = this.findConnectedRegions(newRegion.id, bridges, existingRegions);

    if (connectedRegions.length === 0) {
      // No connections: place near center
      return this.findEmptySpace(existingRegions);
    }

    // Calculate center of mass of connected regions
    const centerOfMass = this.calculateCenterOfMass(connectedRegions);

    // Find empty space near center of mass
    return this.findEmptySpaceNear(centerOfMass, existingRegions);
  }

  /**
   * Calculate position for new region (overload without newRegion parameter).
   * Used when region doesn't exist yet.
   *
   * @param existingRegions - Existing regions
   * @param bridges - All bridges
   * @returns Optimal position
   */
  public calculatePosition(
    existingRegions: RegionNode[],
    bridges: LightBridge[]
  ): Position {
    // Simple case: find empty space near center
    return this.findEmptySpace(existingRegions);
  }

  /**
   * Find connected regions via bridges.
   */
  private findConnectedRegions(
    regionId: RegionId,
    bridges: LightBridge[],
    regions: RegionNode[]
  ): RegionNode[] {
    const connectedIds = new Set<string>();

    for (const bridge of bridges) {
      if (bridge.source === regionId) {
        connectedIds.add(bridge.target);
      } else if (bridge.target === regionId) {
        connectedIds.add(bridge.source);
      }
    }

    return regions.filter((r) => connectedIds.has(r.id));
  }

  /**
   * Calculate center of mass of region cluster.
   */
  private calculateCenterOfMass(regions: RegionNode[]): Position {
    if (regions.length === 0) {
      return { x: this.DEFAULT_CONSTRAINTS.centerX, y: this.DEFAULT_CONSTRAINTS.centerY };
    }

    const sum = regions.reduce(
      (acc, r) => ({ x: acc.x + r.position.x, y: acc.y + r.position.y }),
      { x: 0, y: 0 }
    );

    return {
      x: sum.x / regions.length,
      y: sum.y / regions.length,
    };
  }

  /**
   * Find empty space on grid (no existing regions nearby).
   * Searches in expanding spiral from center.
   */
  private findEmptySpace(existingRegions: RegionNode[]): Position {
    const constraints = this.DEFAULT_CONSTRAINTS;
    const { centerX, centerY, gridSize, minDistance } = constraints;

    if (existingRegions.length === 0) {
      // First region: place at center
      return this.snapToGrid({ x: centerX, y: centerY }, gridSize);
    }

    // Search in expanding spiral from center
    const maxRadius = 1500;
    const angleSteps = 16;

    for (let radius = minDistance; radius < maxRadius; radius += gridSize) {
      for (let i = 0; i < angleSteps; i++) {
        const angle = (i / angleSteps) * Math.PI * 2;
        const candidate = {
          x: centerX + Math.cos(angle) * radius,
          y: centerY + Math.sin(angle) * radius,
        };

        if (this.isSpaceEmpty(candidate, existingRegions, minDistance)) {
          return this.snapToGrid(candidate, gridSize);
        }
      }
    }

    // Fallback: far right
    const maxX = Math.max(...existingRegions.map((r) => r.position.x), 0);
    return this.snapToGrid({ x: maxX + 300, y: centerY }, gridSize);
  }

  /**
   * Find empty space near target position.
   * Searches in expanding circle from target.
   */
  private findEmptySpaceNear(
    target: Position,
    existingRegions: RegionNode[]
  ): Position {
    const constraints = this.DEFAULT_CONSTRAINTS;
    const { gridSize, minDistance } = constraints;

    // Search in expanding circle from target
    const maxRadius = 1000;
    const angleSteps = 16;

    for (let radius = minDistance; radius < maxRadius; radius += gridSize) {
      for (let i = 0; i < angleSteps; i++) {
        const angle = (i / angleSteps) * Math.PI * 2;
        const candidate = {
          x: target.x + Math.cos(angle) * radius,
          y: target.y + Math.sin(angle) * radius,
        };

        if (this.isSpaceEmpty(candidate, existingRegions, minDistance)) {
          return this.snapToGrid(candidate, gridSize);
        }
      }
    }

    // Fallback: target position (may overlap, but better than failing)
    console.warn('[ForceDirectedLayout] Could not find empty space near target, using target position');
    return this.snapToGrid(target, gridSize);
  }

  /**
   * Check if space is empty (no regions within minDistance).
   */
  private isSpaceEmpty(
    position: Position,
    existingRegions: RegionNode[],
    minDistance: number
  ): boolean {
    return existingRegions.every((region) => {
      const dx = region.position.x - position.x;
      const dy = region.position.y - position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance >= minDistance;
    });
  }

  /**
   * Snap position to grid.
   * Rounds x/y to nearest grid cell and clamps to non-negative values.
   */
  private snapToGrid(position: Position, gridSize: number): Position {
    return {
      x: Math.max(0, Math.round(position.x / gridSize) * gridSize),
      y: Math.max(0, Math.round(position.y / gridSize) * gridSize),
    };
  }

  /**
   * Calculate repulsion force between two regions.
   * Used for advanced force-directed layouts (future enhancement).
   *
   * @param region1 - First region
   * @param region2 - Second region
   * @returns Repulsion force vector
   */
  public calculateRepulsionForce(region1: RegionNode, region2: RegionNode): Position {
    const dx = region1.position.x - region2.position.x;
    const dy = region1.position.y - region2.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance === 0) {
      return { x: 0, y: 0 };
    }

    // Repulsion strength inversely proportional to distance
    const strength = 1000 / (distance * distance);

    return {
      x: (dx / distance) * strength,
      y: (dy / distance) * strength,
    };
  }

  /**
   * Calculate attraction force between connected regions.
   * Used for advanced force-directed layouts (future enhancement).
   *
   * @param region1 - First region
   * @param region2 - Second region
   * @returns Attraction force vector
   */
  public calculateAttractionForce(region1: RegionNode, region2: RegionNode): Position {
    const dx = region2.position.x - region1.position.x;
    const dy = region2.position.y - region1.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance === 0) {
      return { x: 0, y: 0 };
    }

    // Spring-like attraction (Hooke's law)
    const idealDistance = 300;
    const strength = (distance - idealDistance) * 0.1;

    return {
      x: (dx / distance) * strength,
      y: (dy / distance) * strength,
    };
  }

  /**
   * Enforce minimum distance constraint.
   * Pushes regions apart if they're too close.
   *
   * @param position - Position to enforce
   * @param existingRegions - Existing regions
   * @returns Adjusted position
   */
  public enforceMinimumDistance(position: Position, existingRegions: RegionNode[]): Position {
    const minDistance = this.DEFAULT_CONSTRAINTS.minDistance;
    let adjustedX = position.x;
    let adjustedY = position.y;

    for (const region of existingRegions) {
      const dx = adjustedX - region.position.x;
      const dy = adjustedY - region.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < minDistance && distance > 0) {
        // Push away from region
        const pushX = (dx / distance) * (minDistance - distance);
        const pushY = (dy / distance) * (minDistance - distance);
        adjustedX += pushX;
        adjustedY += pushY;
      }
    }

    return this.snapToGrid({ x: adjustedX, y: adjustedY }, this.DEFAULT_CONSTRAINTS.gridSize);
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let layoutServiceInstance: ForceDirectedLayoutService | null = null;

/**
 * Initialize the ForceDirectedLayoutService singleton.
 * Call this once during backend startup.
 */
export function initForceDirectedLayoutService(): ForceDirectedLayoutService {
  if (!layoutServiceInstance) {
    layoutServiceInstance = new ForceDirectedLayoutService();
    console.log('[ForceDirectedLayoutService] Service initialized');
  }
  return layoutServiceInstance;
}

/**
 * Get the ForceDirectedLayoutService singleton instance.
 */
export function getForceDirectedLayoutService(): ForceDirectedLayoutService {
  if (!layoutServiceInstance) {
    // Auto-initialize on first access
    return initForceDirectedLayoutService();
  }
  return layoutServiceInstance;
}
