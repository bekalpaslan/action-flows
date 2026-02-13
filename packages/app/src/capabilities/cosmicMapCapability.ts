import type { Capability } from '@afw/shared';
import { toCapabilityId } from '@afw/shared';

/**
 * Cosmic Map State Capability
 *
 * Phase 1 of Inspiration Roadmap — Thread 2 (Node Architecture)
 *
 * Returns the current state of the cosmic map visualization:
 * - Regions (nodes) with their status
 * - Connections (edges) between regions
 * - Overall health metrics
 *
 * This capability will be registered by the CosmicMap component.
 */
export const cosmicMapCapability: Capability = {
  id: toCapabilityId('dashboard.cosmic-map.state'),
  name: 'Cosmic Map State',
  description: 'Returns the current state of the cosmic map (regions, connections, health)',
  provider: 'dashboard',
  invokable: true,
};

/**
 * Type for the result returned by the cosmic map capability
 */
export interface CosmicMapStateResult {
  regions: Array<{
    id: string;
    name: string;
    status: 'active' | 'idle' | 'error';
    position?: { x: number; y: number };
  }>;
  connections: Array<{
    id: string;
    source: string;
    target: string;
    active: boolean;
  }>;
  health: {
    overallScore: number;
    activeRegions: number;
    totalRegions: number;
  };
}
