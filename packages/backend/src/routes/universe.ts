import express, { Router } from 'express';
import type { UniverseGraph, RegionNode, LightBridge, SessionId, RegionId, EdgeId, WorkbenchId } from '@afw/shared';
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
} from '../schemas/api.js';

const router = Router();

/**
 * GET /api/universe
 * Get the full universe graph
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
      workbenchId: regionData.workbenchId as WorkbenchId,
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

    await Promise.resolve(storage.setSessionRegion(sessionId as SessionId, regionId as RegionId));

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

export default router;
