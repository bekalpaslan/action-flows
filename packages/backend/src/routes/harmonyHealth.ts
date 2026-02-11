/**
 * Harmony Health Score API Routes
 *
 * Endpoints for retrieving aggregated gate health metrics.
 */

import { Router } from 'express';
import { z } from 'zod';
import type { GateId } from '@afw/shared';
import type { HealthScoreCalculator } from '../services/healthScoreCalculator.js';
import { sanitizeError } from '../middleware/errorHandler.js';

/**
 * Query schema for health endpoints
 */
const healthQuerySchema = z.object({
  gateId: z.string().optional(),
});

/**
 * Create router with health calculator dependency injection
 */
export default function createHarmonyHealthRouter(
  healthCalculator: HealthScoreCalculator
): Router {
  const router = Router();

  /**
   * GET /api/harmony/health
   * Get overall system health score
   *
   * Query params:
   * - gateId: Optional gate ID to filter by single gate
   */
  router.get('/health', async (req, res) => {
    try {
      const query = healthQuerySchema.parse(req.query);

      // Calculate health score (with optional gate filter)
      const healthScore = await healthCalculator.calculateHealthScore(
        query.gateId as GateId | undefined
      );

      res.json(healthScore);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Invalid query parameters',
          details: error.errors,
        });
      }

      console.error('[API] Error fetching harmony health score:', error);
      res.status(500).json({
        error: 'Failed to fetch harmony health score',
        message: sanitizeError(error),
      });
    }
  });

  /**
   * GET /api/harmony/health/gate/:gateId
   * Get health score for a specific gate
   */
  router.get('/health/gate/:gateId', async (req, res) => {
    try {
      const gateId = req.params.gateId as GateId;

      // Calculate health score for specific gate
      const healthScore = await healthCalculator.calculateHealthScore(gateId);

      // Extract single gate data
      const gateHealth = healthScore.byGate[gateId];

      if (!gateHealth) {
        return res.status(404).json({
          error: 'Gate not found',
          gateId,
        });
      }

      res.json({
        ...gateHealth,
        overall: healthScore.overall,
        timestamp: healthScore.timestamp,
      });
    } catch (error) {
      console.error('[API] Error fetching gate health score:', error);
      res.status(500).json({
        error: 'Failed to fetch gate health score',
        message: sanitizeError(error),
      });
    }
  });

  return router;
}
