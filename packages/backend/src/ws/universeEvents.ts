/**
 * Universe Event Broadcasting
 * Handles WebSocket events for Living Universe Phase 3+ features
 *
 * @module universeEvents
 */

import type { SessionId, RegionId, FogState, DiscoveryTrigger } from '@afw/shared';
import { brandedTypes } from '@afw/shared';
import { clientRegistry } from './clientRegistry.js';

/**
 * WebSocket event payload for region discovery
 */
interface RegionDiscoveredPayload {
  type: 'universe:region_discovered';
  sessionId: SessionId;
  regionId: RegionId;
  fogState: FogState;
  timestamp: string;
  triggeredBy?: string; // Which trigger condition was met
  label?: string; // Region label for UI display
  workbenchId?: string; // Associated workbench
}

/**
 * Broadcast region discovery event to all clients subscribed to the session
 *
 * @param sessionId - Session that triggered the discovery
 * @param regionId - Region that was discovered
 * @param newFogState - New fog state (typically 'revealed')
 * @param trigger - Optional trigger metadata
 */
export function broadcastRegionDiscovered(
  sessionId: SessionId,
  regionId: RegionId,
  newFogState: FogState,
  trigger?: DiscoveryTrigger
): void {
  const event: RegionDiscoveredPayload = {
    type: 'universe:region_discovered',
    sessionId,
    regionId,
    fogState: newFogState,
    timestamp: brandedTypes.currentTimestamp(),
    triggeredBy: trigger?.description,
  };

  const message = JSON.stringify({
    type: 'event',
    sessionId,
    payload: event,
  });

  clientRegistry.broadcastToSession(sessionId, message);
  console.log(`[Universe] Region discovered: ${regionId} for session ${sessionId}`);
}

/**
 * Broadcast evolution tick event (future Phase 4+)
 */
export function broadcastEvolutionTick(
  sessionId: SessionId,
  tickId: string,
  evolutionType: string,
  details: Record<string, unknown>
): void {
  const event = {
    type: 'universe:evolution_tick',
    sessionId,
    tickId,
    evolutionType,
    timestamp: brandedTypes.currentTimestamp(),
    details,
  };

  const message = JSON.stringify({
    type: 'event',
    sessionId,
    payload: event,
  });

  clientRegistry.broadcastToSession(sessionId, message);
  console.log(`[Universe] Evolution tick: ${evolutionType} for session ${sessionId}`);
}

/**
 * Broadcast chain spark traveling event (future Phase 4)
 */
export function broadcastSparkTraveling(
  sessionId: SessionId,
  chainId: string,
  fromRegionId: RegionId,
  toRegionId: RegionId,
  bridgeId: string
): void {
  const event = {
    type: 'chain:spark_traveling',
    sessionId,
    chainId,
    fromRegionId,
    toRegionId,
    bridgeId,
    timestamp: brandedTypes.currentTimestamp(),
  };

  const message = JSON.stringify({
    type: 'event',
    sessionId,
    payload: event,
  });

  clientRegistry.broadcastToSession(sessionId, message);
  console.log(`[Universe] Spark traveling: ${chainId} from ${fromRegionId} to ${toRegionId}`);
}
