/**
 * Agent Validator API Routes
 * Provides agent behavior validation endpoints for Gate 9 checkpoint
 */

import { Router } from 'express';
import { z } from 'zod';
import type { SessionId, ProjectId } from '@afw/shared';
import { agentValidator } from '../services/agentValidator.js';
import { sanitizeError } from '../middleware/errorHandler.js';
import { writeLimiter } from '../middleware/rateLimit.js';

const router = Router();

/**
 * Schema for agent validation request
 */
const agentValidationSchema = z.object({
  output: z.string().min(1).max(50000), // Agent output markdown
  logFolderPath: z.string().min(1), // Path to log folder
  agentAction: z.string().min(1), // e.g., "code/backend", "review/"
  stepNumber: z.number().optional(),
  chainId: z.string().optional(),
  projectId: z.string().optional(),
});

/**
 * POST /api/agent-validator/validate
 * Validate an agent's output after completion
 */
router.post('/validate', writeLimiter, async (req, res) => {
  try {
    // Parse and validate request
    const parsed = agentValidationSchema.parse(req.body);

    // Extract session ID from headers or query
    const sessionId = (req.headers['x-session-id'] || req.query.sessionId) as SessionId;
    if (!sessionId) {
      return res.status(400).json({
        error: 'Missing session ID',
        message: 'Session ID must be provided in x-session-id header or sessionId query parameter',
      });
    }

    // Validate the agent output
    const result = await agentValidator.validateAgentOutput(
      parsed.output,
      parsed.logFolderPath,
      sessionId,
      parsed.agentAction,
      {
        stepNumber: parsed.stepNumber,
        chainId: parsed.chainId,
        projectId: parsed.projectId as ProjectId | undefined,
      }
    );

    // Return validation result
    res.json({
      validationId: result.id,
      sessionId: result.sessionId,
      agentAction: result.agentAction,
      isValid: result.isValid,
      results: {
        logFolderValid: result.logFolderValid,
        contractCompliant: result.contractCompliant,
        learningsPresent: result.learningsPresent,
      },
      violations: result.violations.map(v => ({
        type: v.type,
        severity: v.severity,
        message: v.message,
        remediation: v.remediation,
      })),
      timestamp: result.timestamp,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation schema error',
        details: error.errors,
      });
    }

    console.error('[API] Agent validation failed:', error);
    res.status(500).json({
      error: 'Agent validation failed',
      message: sanitizeError(error),
    });
  }
});

/**
 * GET /api/agent-validator/health
 * Health check for agent validator service
 */
router.get('/health', async (req, res) => {
  try {
    res.json({
      status: 'ok',
      service: 'AgentValidator',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API] Agent validator health check failed:', error);
    res.status(500).json({
      error: 'Health check failed',
      message: sanitizeError(error),
    });
  }
});

export default router;
