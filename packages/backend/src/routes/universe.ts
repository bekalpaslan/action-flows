import express, { Router } from 'express';
import type { UniverseGraph, RegionNode, LightBridge, SessionId, RegionId, EdgeId, StarId, ChainId } from '@afw/shared';
import { brandedTypes, FogState } from '@afw/shared';
import { storage } from '../storage/index.js';
import { validateBody } from '../middleware/validate.js';
import { readLimiter, writeLimiter } from '../middleware/rateLimit.js';
import { sanitizeError } from '../middleware/errorHandler.js';
import {
  createRegionSchema,
  createBridgeSchema,
  sessionRegionMappingSchema,
  discoverRegionSchema,
  recordActivitySchema,
  revealRegionSchema,
  revealAllRegionsSchema,
} from '../schemas/api.js';
import { getDiscoveryService } from '../services/discoveryService.js';
import { getBridgeStrengthService } from '../services/bridgeStrengthService.js';
import * as universeEvents from '../ws/universeEvents.js';

const router = Router();

/**
 * @swagger
 * /api/universe:
 *   get:
 *     summary: Get the full universe graph
 *     description: Retrieve the complete living universe graph with regions, bridges, and fog states
 *     tags: [universe]
 *     responses:
 *       200:
 *         description: Universe graph retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 regions:
 *                   type: array
 *                   description: All regions in the universe
 *                 bridges:
 *                   type: array
 *                   description: Light bridges connecting regions
 *       404:
 *         description: Universe graph not initialized
 *       500:
 *         description: Internal server error
 */
router.get('/', readLimiter, async (req, res) => {
  try {
    const graph = await Promise.resolve(storage.getUniverseGraph());

    if (!graph) {
      return res.status(404).json({ error: 'Universe graph not initialized' });
    }

    res.json(graph);
  } catch (error) {
    console.error('[API] Error fetching universe graph:', error);
    res.status(500).json({
      error: 'Failed to fetch universe graph',
      message: sanitizeError(error),
    });
  }
});

/**
 * PUT /api/universe
 * Update or initialize the universe graph
 */
router.put('/', writeLimiter, async (req, res) => {
  try {
    const graph: UniverseGraph = req.body;
    await Promise.resolve(storage.setUniverseGraph(graph));
    res.json(graph);
  } catch (error) {
    console.error('[API] Error setting universe graph:', error);
    res.status(500).json({
      error: 'Failed to set universe graph',
      message: sanitizeError(error),
    });
  }
});

/**
 * GET /api/universe/regions
 * List all regions
 */
router.get('/regions', readLimiter, async (req, res) => {
  try {
    const regions = await Promise.resolve(storage.listRegions());
    res.json({
      count: regions.length,
      regions,
    });
  } catch (error) {
    console.error('[API] Error listing regions:', error);
    res.status(500).json({
      error: 'Failed to list regions',
      message: sanitizeError(error),
    });
  }
});

/**
 * GET /api/universe/regions/:id
 * Get a specific region
 */
router.get('/regions/:id', readLimiter, async (req, res) => {
  try {
    const { id } = req.params;
    const region = await Promise.resolve(storage.getRegion(id as RegionId));

    if (!region) {
      return res.status(404).json({
        error: 'Region not found',
        regionId: id,
      });
    }

    res.json(region);
  } catch (error) {
    console.error('[API] Error fetching region:', error);
    res.status(500).json({
      error: 'Failed to fetch region',
      message: sanitizeError(error),
    });
  }
});

/**
 * POST /api/universe/regions
 * Create a new region
 */
router.post('/regions', writeLimiter, validateBody(createRegionSchema), async (req, res) => {
  try {
    const regionData = req.body;

    // Build full region node with defaults
    const region: RegionNode = {
      id: brandedTypes.regionId(regionData.id),
      workbenchId: regionData.workbenchId as StarId,
      label: regionData.label,
      description: regionData.description,
      position: regionData.position,
      layer: regionData.layer,
      fogState: regionData.fogState || FogState.HIDDEN,
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
        baseColor: '#ffffff',
        currentColor: '#ffffff',
        saturation: 1.0,
        temperature: 0.5,
      },
      glowIntensity: 0.0,
      status: 'undiscovered',
      sessionCount: 0,
    };

    await Promise.resolve(storage.setRegion(region));

    console.log(`[API] Region created: ${region.id}`);

    res.status(201).json(region);
  } catch (error) {
    console.error('[API] Error creating region:', error);
    res.status(500).json({
      error: 'Failed to create region',
      message: sanitizeError(error),
    });
  }
});

/**
 * PUT /api/universe/regions/:id
 * Update a region
 */
router.put('/regions/:id', writeLimiter, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const region = await Promise.resolve(storage.getRegion(id as RegionId));

    if (!region) {
      return res.status(404).json({
        error: 'Region not found',
        regionId: id,
      });
    }

    // Merge updates
    const updatedRegion: RegionNode = {
      ...region,
      ...updates,
      id: region.id, // Never allow ID change
    };

    await Promise.resolve(storage.setRegion(updatedRegion));

    console.log(`[API] Region updated: ${id}`);

    res.json(updatedRegion);
  } catch (error) {
    console.error('[API] Error updating region:', error);
    res.status(500).json({
      error: 'Failed to update region',
      message: sanitizeError(error),
    });
  }
});

/**
 * DELETE /api/universe/regions/:id
 * Delete a region
 */
router.delete('/regions/:id', writeLimiter, async (req, res) => {
  try {
    const { id } = req.params;

    await Promise.resolve(storage.deleteRegion(id as RegionId));

    console.log(`[API] Region deleted: ${id}`);

    res.status(204).send();
  } catch (error) {
    console.error('[API] Error deleting region:', error);
    res.status(500).json({
      error: 'Failed to delete region',
      message: sanitizeError(error),
    });
  }
});

/**
 * GET /api/universe/bridges
 * List all light bridges
 */
router.get('/bridges', readLimiter, async (req, res) => {
  try {
    const bridges = await Promise.resolve(storage.listBridges());
    res.json({
      count: bridges.length,
      bridges,
    });
  } catch (error) {
    console.error('[API] Error listing bridges:', error);
    res.status(500).json({
      error: 'Failed to list bridges',
      message: sanitizeError(error),
    });
  }
});

/**
 * GET /api/universe/bridges/:id
 * Get a specific bridge
 */
router.get('/bridges/:id', readLimiter, async (req, res) => {
  try {
    const { id } = req.params;
    const bridge = await Promise.resolve(storage.getBridge(id as EdgeId));

    if (!bridge) {
      return res.status(404).json({
        error: 'Bridge not found',
        bridgeId: id,
      });
    }

    res.json(bridge);
  } catch (error) {
    console.error('[API] Error fetching bridge:', error);
    res.status(500).json({
      error: 'Failed to fetch bridge',
      message: sanitizeError(error),
    });
  }
});

/**
 * POST /api/universe/bridges
 * Create a new light bridge
 */
router.post('/bridges', writeLimiter, validateBody(createBridgeSchema), async (req, res) => {
  try {
    const bridgeData = req.body;

    const bridge: LightBridge = {
      id: brandedTypes.edgeId(bridgeData.id),
      source: brandedTypes.regionId(bridgeData.source),
      target: brandedTypes.regionId(bridgeData.target),
      gates: [],
      strength: bridgeData.strength || 0,
      traversalCount: 0,
      traces: {
        totalInteractions: 0,
        recentTraces: [],
        heatLevel: 0.0,
      },
    };

    await Promise.resolve(storage.setBridge(bridge));

    console.log(`[API] Bridge created: ${bridge.id}`);

    res.status(201).json(bridge);
  } catch (error) {
    console.error('[API] Error creating bridge:', error);
    res.status(500).json({
      error: 'Failed to create bridge',
      message: sanitizeError(error),
    });
  }
});

/**
 * DELETE /api/universe/bridges/:id
 * Delete a bridge
 */
router.delete('/bridges/:id', writeLimiter, async (req, res) => {
  try {
    const { id } = req.params;

    await Promise.resolve(storage.deleteBridge(id as EdgeId));

    console.log(`[API] Bridge deleted: ${id}`);

    res.status(204).send();
  } catch (error) {
    console.error('[API] Error deleting bridge:', error);
    res.status(500).json({
      error: 'Failed to delete bridge',
      message: sanitizeError(error),
    });
  }
});

/**
 * POST /api/universe/discover
 * Trigger region discovery (fog of war change)
 */
router.post('/discover', writeLimiter, validateBody(discoverRegionSchema), async (req, res) => {
  try {
    const { regionId, sessionId } = req.body;

    const region = await Promise.resolve(storage.getRegion(regionId as RegionId));

    if (!region) {
      return res.status(404).json({
        error: 'Region not found',
        regionId,
      });
    }

    // Change fog state to revealed
    region.fogState = FogState.REVEALED;
    region.status = 'idle';
    region.discoveredAt = brandedTypes.currentTimestamp();

    await Promise.resolve(storage.setRegion(region));

    console.log(`[API] Region discovered: ${regionId} by session ${sessionId}`);

    res.json({
      success: true,
      regionId,
      sessionId,
      newFogState: region.fogState,
    });
  } catch (error) {
    console.error('[API] Error discovering region:', error);
    res.status(500).json({
      error: 'Failed to discover region',
      message: sanitizeError(error),
    });
  }
});

/**
 * GET /api/universe/sessions/:sessionId/region
 * Get the region mapped to a session
 */
router.get('/sessions/:sessionId/region', readLimiter, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const regionId = await Promise.resolve(storage.getSessionRegion(sessionId as SessionId));

    if (!regionId) {
      return res.status(404).json({
        error: 'No region mapped to this session',
        sessionId,
      });
    }

    res.json({
      sessionId,
      regionId,
    });
  } catch (error) {
    console.error('[API] Error fetching session region:', error);
    res.status(500).json({
      error: 'Failed to fetch session region',
      message: sanitizeError(error),
    });
  }
});

/**
 * POST /api/universe/sessions/:sessionId/region
 * Map a session to a region
 */
router.post('/sessions/:sessionId/region', writeLimiter, validateBody(sessionRegionMappingSchema), async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { regionId } = req.body;

    // Verify session exists
    const session = await Promise.resolve(storage.getSession(sessionId as SessionId));
    if (!session) {
      return res.status(404).json({
        error: 'Session not found',
        sessionId,
      });
    }

    // Verify region exists
    const region = await Promise.resolve(storage.getRegion(regionId as RegionId));
    if (!region) {
      return res.status(404).json({
        error: 'Region not found',
        regionId,
      });
    }

    // Check if this is a new session entering this region
    const existingMapping = await Promise.resolve(storage.getSessionRegion(sessionId as SessionId));
    const isNewVisit = existingMapping !== regionId;

    // Use try-catch with rollback for atomic operation
    try {
      await Promise.resolve(storage.setSessionRegion(sessionId as SessionId, regionId as RegionId));

      // Increment session count if this is a new visit to this region
      if (isNewVisit) {
        // Re-read region to avoid race condition in read-modify-write
        const freshRegion = await Promise.resolve(storage.getRegion(regionId as RegionId));
        if (freshRegion) {
          freshRegion.sessionCount = (freshRegion.sessionCount || 0) + 1;
          await Promise.resolve(storage.setRegion(freshRegion));
          console.log(`[API] Region ${regionId} session count incremented to ${freshRegion.sessionCount}`);
        }
      }
    } catch (error) {
      // Rollback session mapping on failure
      await Promise.resolve(storage.deleteSessionRegion(sessionId as SessionId));
      throw error;
    }

    console.log(`[API] Session ${sessionId} mapped to region ${regionId}`);

    res.status(201).json({
      sessionId,
      regionId,
      success: true,
    });
  } catch (error) {
    console.error('[API] Error mapping session to region:', error);
    res.status(500).json({
      error: 'Failed to map session to region',
      message: sanitizeError(error),
    });
  }
});

/**
 * DELETE /api/universe/sessions/:sessionId/region
 * Remove session-region mapping
 */
router.delete('/sessions/:sessionId/region', writeLimiter, async (req, res) => {
  try {
    const { sessionId } = req.params;

    await Promise.resolve(storage.deleteSessionRegion(sessionId as SessionId));

    console.log(`[API] Session-region mapping deleted for session ${sessionId}`);

    res.status(204).send();
  } catch (error) {
    console.error('[API] Error deleting session-region mapping:', error);
    res.status(500).json({
      error: 'Failed to delete session-region mapping',
      message: sanitizeError(error),
    });
  }
});

// ============================================================================
// Discovery System Endpoints (Phase 3)
// ============================================================================

/**
 * GET /api/universe/discovery/progress/:sessionId
 * Poll current discovery progress for all regions
 */
router.get('/discovery/progress/:sessionId', readLimiter, async (req, res) => {
  try {
    const sessionId = req.params.sessionId as SessionId;

    // Verify session exists
    const session = await Promise.resolve(storage.getSession(sessionId));
    if (!session) {
      return res.status(404).json({
        error: 'Session not found',
        sessionId,
      });
    }

    const discoveryService = getDiscoveryService();
    if (!discoveryService) {
      return res.status(503).json({
        error: 'Discovery service not initialized',
      });
    }

    const result = await discoveryService.evaluateDiscovery(sessionId);

    res.json({
      discoveryProgress: result.progress,
      readyToReveal: result.readyRegions,
    });
  } catch (error) {
    console.error('[API] Error fetching discovery progress:', error);
    res.status(500).json({
      error: 'Failed to fetch discovery progress',
      message: sanitizeError(error),
    });
  }
});

/**
 * POST /api/universe/discovery/record
 * Record user activity (interactions, chains, errors)
 */
router.post('/discovery/record', writeLimiter, validateBody(recordActivitySchema), async (req, res) => {
  try {
    const { sessionId, activityType, context, chainId } = req.body;

    // Verify session exists
    const session = await Promise.resolve(storage.getSession(sessionId as SessionId));
    if (!session) {
      return res.status(404).json({
        error: 'Session not found',
        sessionId,
      });
    }

    const discoveryService = getDiscoveryService();
    if (!discoveryService) {
      return res.status(503).json({
        error: 'Discovery service not initialized',
      });
    }

    // Record activity based on type
    switch (activityType) {
      case 'interaction':
        await discoveryService.recordInteraction(sessionId as SessionId, context || 'unknown');
        break;
      case 'chain_completed':
        if (!chainId) {
          return res.status(400).json({ error: 'chainId required for chain_completed activity' });
        }
        await discoveryService.recordChainCompleted(sessionId as SessionId, chainId as ChainId);
        break;
      case 'error':
        await discoveryService.recordError(sessionId as SessionId);
        break;
      default:
        return res.status(400).json({ error: 'Invalid activityType' });
    }

    // Evaluate and return updated progress
    const result = await discoveryService.evaluateDiscovery(sessionId as SessionId);

    // Broadcast WebSocket events for newly revealed regions
    if (result.readyRegions.length > 0) {
      for (const regionId of result.readyRegions) {
        // Get region details for the event
        const region = await Promise.resolve(storage.getRegion(regionId));
        if (region) {
          universeEvents.broadcastRegionDiscovered(
            sessionId as SessionId,
            regionId,
            region.fogState,
            undefined
          );
        }
      }
    }

    console.log(`[API] Activity recorded: ${activityType} for session ${sessionId}`);

    res.json({
      success: true,
      progress: result.progress,
      newlyRevealed: result.readyRegions,
    });
  } catch (error) {
    console.error('[API] Error recording activity:', error);
    res.status(500).json({
      error: 'Failed to record activity',
      message: sanitizeError(error),
    });
  }
});

/**
 * POST /api/universe/discovery/reveal/:regionId
 * Manually reveal a specific region (testing/debug)
 */
router.post('/discovery/reveal/:regionId', writeLimiter, validateBody(revealRegionSchema), async (req, res) => {
  try {
    const regionId = req.params.regionId as RegionId;
    const { sessionId } = req.body;

    // Verify session exists
    const session = await Promise.resolve(storage.getSession(sessionId as SessionId));
    if (!session) {
      return res.status(404).json({
        error: 'Session not found',
        sessionId,
      });
    }

    // Verify region exists
    const region = await Promise.resolve(storage.getRegion(regionId));
    if (!region) {
      return res.status(404).json({
        error: 'Region not found',
        regionId,
      });
    }

    const discoveryService = getDiscoveryService();
    if (!discoveryService) {
      return res.status(503).json({
        error: 'Discovery service not initialized',
      });
    }

    await discoveryService.revealRegion(sessionId as SessionId, regionId);

    // Get updated region for broadcast
    const updatedRegion = await Promise.resolve(storage.getRegion(regionId));
    if (updatedRegion) {
      universeEvents.broadcastRegionDiscovered(
        sessionId as SessionId,
        regionId,
        updatedRegion.fogState,
        undefined
      );
    }

    console.log(`[API] Region manually revealed: ${regionId} for session ${sessionId}`);

    res.json({
      success: true,
      regionId,
    });
  } catch (error) {
    console.error('[API] Error revealing region:', error);
    res.status(500).json({
      error: 'Failed to reveal region',
      message: sanitizeError(error),
    });
  }
});

/**
 * POST /api/universe/discovery/reveal-all
 * Manually reveal all regions (testing/debug)
 */
router.post('/discovery/reveal-all', writeLimiter, validateBody(revealAllRegionsSchema), async (req, res) => {
  try {
    const { sessionId } = req.body;

    // Verify session exists
    const session = await Promise.resolve(storage.getSession(sessionId as SessionId));
    if (!session) {
      return res.status(404).json({
        error: 'Session not found',
        sessionId,
      });
    }

    const discoveryService = getDiscoveryService();
    if (!discoveryService) {
      return res.status(503).json({
        error: 'Discovery service not initialized',
      });
    }

    // Get universe to count regions before revealing
    const universe = await Promise.resolve(storage.getUniverseGraph());
    if (!universe) {
      return res.status(404).json({
        error: 'Universe graph not initialized',
      });
    }

    const regionsToReveal = universe.regions.filter((r) => r.fogState !== 'revealed');
    const regionIds = regionsToReveal.map((r) => r.id);

    // Reveal all regions
    await discoveryService.revealAll(sessionId as SessionId);

    // Broadcast WebSocket events for all revealed regions
    for (const regionId of regionIds) {
      const region = await Promise.resolve(storage.getRegion(regionId));
      if (region) {
        universeEvents.broadcastRegionDiscovered(
          sessionId as SessionId,
          regionId,
          region.fogState,
          undefined
        );
      }
    }

    console.log(`[API] All regions revealed for session ${sessionId} (count: ${regionIds.length})`);

    res.json({
      success: true,
      revealedCount: regionIds.length,
    });
  } catch (error) {
    console.error('[API] Error revealing all regions:', error);
    res.status(500).json({
      error: 'Failed to reveal all regions',
      message: sanitizeError(error),
    });
  }
});

// ============================================================================
// Bridge Strength Endpoints (Phase 4 - Batch F)
// ============================================================================

/**
 * GET /api/universe/bridge-strength/:from/:to
 * Get bridge strength for visualization (0.3 to 1.0)
 */
router.get('/bridge-strength/:from/:to', readLimiter, async (req, res) => {
  try {
    const fromRegion = req.params.from as RegionId;
    const toRegion = req.params.to as RegionId;

    const bridgeStrengthService = getBridgeStrengthService();
    const strength = bridgeStrengthService.getStrength(fromRegion, toRegion);
    const traversalCount = bridgeStrengthService.getTraversalCount(fromRegion, toRegion);

    res.json({
      fromRegion,
      toRegion,
      strength,
      traversalCount,
    });
  } catch (error) {
    console.error('[API] Error fetching bridge strength:', error);
    res.status(500).json({
      error: 'Failed to fetch bridge strength',
      message: sanitizeError(error),
    });
  }
});

/**
 * GET /api/universe/bridge-strengths
 * Get all bridge strengths for full universe visualization
 */
router.get('/bridge-strengths', readLimiter, async (req, res) => {
  try {
    const bridgeStrengthService = getBridgeStrengthService();
    const allStrengths = bridgeStrengthService.getAllStrengths();

    // Convert Map to array for JSON serialization
    const strengths = Array.from(allStrengths.entries()).map(([key, data]) => ({
      key,
      fromRegion: data.fromRegion,
      toRegion: data.toRegion,
      strength: data.strength,
      traversalCount: data.traversalCount,
      lastTraversal: data.lastTraversal,
    }));

    res.json({
      count: strengths.length,
      strengths,
    });
  } catch (error) {
    console.error('[API] Error fetching all bridge strengths:', error);
    res.status(500).json({
      error: 'Failed to fetch bridge strengths',
      message: sanitizeError(error),
    });
  }
});

/**
 * PUT /api/universe/evolution/settings
 * Update evolution service settings
 */
router.put('/evolution/settings', writeLimiter, async (req, res) => {
  try {
    const { speed, autoInference } = req.body;

    // Dynamically import to avoid circular dependency
    const { getEvolutionService } = await import('../services/evolutionService.js');
    const evolutionService = getEvolutionService();

    // Update settings
    if (speed !== undefined) {
      evolutionService.setEvolutionSpeed(speed);
    }

    if (autoInference !== undefined) {
      evolutionService.setAutoInference(autoInference);
    }

    console.log(`[API] Evolution settings updated: speed=${speed}, autoInference=${autoInference}`);

    res.json({
      success: true,
      settings: {
        speed: evolutionService.getEvolutionSpeed(),
        autoInference: evolutionService.getAutoInference(),
        tickCounter: evolutionService.getTickCounter(),
      },
    });
  } catch (error) {
    console.error('[API] Error updating evolution settings:', error);
    res.status(500).json({
      error: 'Failed to update evolution settings',
      message: sanitizeError(error),
    });
  }
});

/**
 * GET /api/universe/evolution/settings
 * Get current evolution service settings
 */
router.get('/evolution/settings', readLimiter, async (req, res) => {
  try {
    // Dynamically import to avoid circular dependency
    const { getEvolutionService } = await import('../services/evolutionService.js');
    const evolutionService = getEvolutionService();

    res.json({
      speed: evolutionService.getEvolutionSpeed(),
      autoInference: evolutionService.getAutoInference(),
      tickCounter: evolutionService.getTickCounter(),
    });
  } catch (error) {
    console.error('[API] Error fetching evolution settings:', error);
    res.status(500).json({
      error: 'Failed to fetch evolution settings',
      message: sanitizeError(error),
    });
  }
});

export default router;
