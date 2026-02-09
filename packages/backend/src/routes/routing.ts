/**
 * Context Routing API Routes
 *
 * Exposes the context routing algorithm to the frontend for determining
 * which workbench context to route user requests to.
 */

import { Router } from 'express';
import { z } from 'zod';
import type { RoutingResult } from '@afw/shared';
import { routeRequest } from '../routing/contextRouter.js';
import { sanitizeError } from '../middleware/errorHandler.js';
import { writeLimiter } from '../middleware/rateLimit.js';

const router = Router();

/**
 * Schema for routing request validation
 */
const routeRequestSchema = z.object({
  request: z.string().min(1).max(1000),
});

/**
 * POST /api/routing/resolve
 * Route a user request to the most appropriate workbench context
 *
 * Request body:
 * {
 *   "request": "fix the authentication bug"
 * }
 *
 * Response:
 * {
 *   "selectedContext": "debug",
 *   "confidence": 0.95,
 *   "alternativeContexts": [...],
 *   "triggerMatches": ["fix", "bug"],
 *   "requiresDisambiguation": false
 * }
 */
router.post('/resolve', writeLimiter, async (req, res) => {
  try {
    // Validate request body
    const parsed = routeRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Invalid request body',
        details: parsed.error.errors,
      });
    }

    const { request } = parsed.data;

    // Run the routing algorithm
    const result: RoutingResult = routeRequest(request);

    console.log(
      `[API] Routed request: "${request}" → ${result.selectedContext || 'disambiguation'} ` +
      `(confidence: ${result.confidence.toFixed(2)})`
    );

    res.json(result);
  } catch (error) {
    console.error('[API] Error routing request:', error);
    res.status(500).json({
      error: 'Failed to route request',
      message: sanitizeError(error),
    });
  }
});

export default router;
