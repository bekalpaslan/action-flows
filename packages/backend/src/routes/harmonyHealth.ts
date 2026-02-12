/**
 * Harmony Health Score API Routes
 *
 * Endpoints for retrieving aggregated gate health metrics.
 */

import { Router } from 'express';
import { z } from 'zod';
import type { GateId, ChainId } from '@afw/shared';
import { brandedTypes } from '@afw/shared';
import type { HealthScoreCalculator } from '../services/healthScoreCalculator.js';
import type { HealingRecommendationEngine } from '../services/healingRecommendations.js';
import { getHealingRecommendationEngine } from '../services/healingRecommendations.js';
import { validateChainCompilation } from '../services/checkpoints/gate04-chain-compilation.js';
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
  healthCalculator: HealthScoreCalculator,
  healingEngine?: HealingRecommendationEngine | null
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

      // Enhance with structured healing recommendations
      const engine = healingEngine || getHealingRecommendationEngine();
      let healingRecommendations: any[] = [];

      if (engine) {
        try {
          // Get recommendations for default project
          const projectId = 'default-project' as any;  // ProjectId
          const recommendations = await engine.analyzeAndRecommend(projectId, 'project');

          // Map to simplified format for API response
          healingRecommendations = recommendations.map(rec => ({
            pattern: rec.pattern,
            suggestedFlow: rec.suggestedFlow,
            severity: rec.severity,
            violationCount: rec.violationCount,
            reason: rec.reason,
            estimatedEffort: rec.estimatedEffort,
          }));
        } catch (recError) {
          console.error('[API] Error generating healing recommendations:', recError);
          // Continue without recommendations rather than failing the whole request
        }
      }

      res.json({
        ...healthScore,
        healingRecommendations,
      });
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

  /**
   * POST /api/harmony/validate/manual
   * Manually trigger Gate 4 validation (bypass ConversationWatcher)
   *
   * Body: { orchestratorOutput: string, sessionId?: string }
   *
   * Use this endpoint to test gate validation when ConversationWatcher
   * discovery isn't working. Directly calls validateChainCompilation().
   */
  router.post('/validate/manual', async (req, res) => {
    try {
      const { orchestratorOutput, sessionId } = req.body;

      if (!orchestratorOutput || typeof orchestratorOutput !== 'string') {
        return res.status(400).json({
          error: 'Missing or invalid orchestratorOutput in request body',
        });
      }

      // Generate ChainId from sessionId or use test ID
      const chainPrefix = sessionId || 'manual-test';
      const chainId = brandedTypes.chainId(`chain-${chainPrefix}-${Date.now()}`);

      // Trigger Gate 4 validation
      await validateChainCompilation(orchestratorOutput, chainId);

      res.json({
        success: true,
        message: 'Gate 4 validation triggered',
        chainId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('[API] Error in manual validation:', error);
      res.status(500).json({
        error: 'Failed to validate chain compilation',
        message: sanitizeError(error),
      });
    }
  });

  return router;
}
