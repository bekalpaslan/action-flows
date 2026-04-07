/**
 * Healing Routes
 *
 * REST API for the self-healing pipeline:
 * - Quota queries per workbench-flow pair
 * - Healing attempt creation and resolution
 * - Outcome recording (approved -> succeeded/failed)
 * - Circuit breaker status
 * - Attempt history
 */

import { Router } from 'express';
import type { HealingAttemptId, ErrorClass } from '@afw/shared';
import type { HealingService } from '../services/healingService.js';
import type { HealingQuotaTracker } from '../services/healingQuotaTracker.js';

/**
 * Create the healing router with injected dependencies.
 */
export default function createHealingRouter(
  healingService: HealingService,
  quotaTracker: HealingQuotaTracker
): Router {
  const router = Router();

  /**
   * GET /quota/:workbenchId/:flowId
   * Get today's healing quota for a workbench-flow pair.
   */
  router.get('/quota/:workbenchId/:flowId', async (req, res) => {
    try {
      const { workbenchId, flowId } = req.params;
      const quota = await quotaTracker.getTodayQuota(workbenchId!, flowId!);
      res.json({ success: true, quota });
    } catch (error) {
      console.error('[Healing] Error getting quota:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  });

  /**
   * GET /history
   * Get healing attempt history (most recent first).
   * Query param: ?limit=50
   */
  router.get('/history', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string, 10) || 50;
      const attempts = await healingService.getHistory(limit);
      res.json({ success: true, attempts });
    } catch (error) {
      console.error('[Healing] Error getting history:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  });

  /**
   * GET /history/:workbenchId
   * Get healing attempt history for a specific workbench.
   */
  router.get('/history/:workbenchId', async (req, res) => {
    try {
      const { workbenchId } = req.params;
      const attempts = await healingService.getAttemptsByWorkbench(workbenchId!);
      res.json({ success: true, attempts });
    } catch (error) {
      console.error('[Healing] Error getting workbench history:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  });

  /**
   * POST /attempts
   * Create a new healing attempt from a runtime error.
   * Body: { errorMessage, errorClass, workbenchId, flowId, sessionId }
   * Returns 201 with attempt on success, 409 if circuit breaker is active.
   */
  router.post('/attempts', async (req, res) => {
    try {
      const { errorMessage, errorClass, workbenchId, flowId, sessionId } = req.body as {
        errorMessage: string;
        errorClass: ErrorClass;
        workbenchId: string;
        flowId: string;
        sessionId: string;
      };

      if (!errorMessage || !errorClass || !workbenchId || !flowId || !sessionId) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: errorMessage, errorClass, workbenchId, flowId, sessionId',
        });
        return;
      }

      // Check circuit breaker first for a clear 409
      const isExhausted = await quotaTracker.isQuotaExhausted(workbenchId, flowId);
      if (isExhausted) {
        const quota = await quotaTracker.getTodayQuota(workbenchId, flowId);
        res.status(409).json({
          success: false,
          error: 'Circuit breaker active',
          quota,
        });
        return;
      }

      const attempt = await healingService.onRuntimeError(
        { message: errorMessage, errorClass },
        { workbenchId, flowId, sessionId }
      );

      if (!attempt) {
        // Non-healable error class or other filter
        res.status(422).json({
          success: false,
          error: 'Error class not eligible for healing',
        });
        return;
      }

      res.status(201).json({ success: true, attempt });
    } catch (error) {
      console.error('[Healing] Error creating attempt:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  });

  /**
   * POST /resolve/:approvalId
   * Resolve a healing attempt via its approval ID.
   * Body: { decision: 'approved' | 'declined' }
   */
  router.post('/resolve/:approvalId', async (req, res) => {
    try {
      const { approvalId } = req.params;
      const { decision } = req.body as { decision: 'approved' | 'declined' };

      if (!decision || !['approved', 'declined'].includes(decision)) {
        res.status(400).json({
          success: false,
          error: "Invalid decision: must be 'approved' or 'declined'",
        });
        return;
      }

      const attempt = await healingService.resolveHealing(approvalId!, decision);

      if (!attempt) {
        res.status(404).json({
          success: false,
          error: 'Healing attempt not found for this approval',
        });
        return;
      }

      res.json({ success: true, attempt });
    } catch (error) {
      console.error('[Healing] Error resolving attempt:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  });

  /**
   * POST /outcome/:attemptId
   * Record the outcome of an approved healing attempt (D-04).
   * Body: { outcome: 'succeeded' | 'failed', error?: string }
   */
  router.post('/outcome/:attemptId', async (req, res) => {
    try {
      const { attemptId } = req.params;
      const { outcome, error: outcomeError } = req.body as {
        outcome: 'succeeded' | 'failed';
        error?: string;
      };

      if (!outcome || !['succeeded', 'failed'].includes(outcome)) {
        res.status(400).json({
          success: false,
          error: "Invalid outcome: must be 'succeeded' or 'failed'",
        });
        return;
      }

      const attempt = await healingService.recordHealingOutcome(
        attemptId as HealingAttemptId,
        outcome,
        outcomeError
      );

      if (!attempt) {
        res.status(404).json({
          success: false,
          error: 'Healing attempt not found or not in approved status',
        });
        return;
      }

      res.json({ success: true, attempt });
    } catch (error) {
      console.error('[Healing] Error recording outcome:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  });

  /**
   * GET /circuit-breakers
   * Get all active circuit breakers for today.
   */
  router.get('/circuit-breakers', async (req, res) => {
    try {
      const breakers = await quotaTracker.getActiveCircuitBreakers();
      res.json({ success: true, breakers });
    } catch (error) {
      console.error('[Healing] Error getting circuit breakers:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  });

  return router;
}
