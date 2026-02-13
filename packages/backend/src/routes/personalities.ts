/**
 * Personalities API Routes
 *
 * Endpoints for retrieving agent personality metadata extracted from agent.md files.
 * Part of Phase 1 Inspiration Roadmap — Thread 5 (Agent Personalities).
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import type { PersonalityParser } from '../services/personalityParser.js';

/**
 * Create personalities router
 * @param parser PersonalityParser instance
 * @returns Express router
 */
export function createPersonalitiesRouter(parser: PersonalityParser): Router {
  const router = Router();

  /**
   * GET /api/personalities
   * List all agent personalities
   *
   * @returns { personalities: AgentMetadata[] }
   */
  router.get('/', (req: Request, res: Response) => {
    const personalities = parser.getAll();
    res.json({ personalities });
  });

  /**
   * GET /api/personalities/:actionType
   * Get personality for specific action
   *
   * Note: actionType can contain slashes (e.g., "code/backend")
   *
   * @param actionType Action type (e.g., "review", "code/backend")
   * @returns AgentMetadata
   */
  router.get('/:actionType(*)', (req: Request, res: Response) => {
    const actionType = req.params.actionType ?? req.params['0'];

    if (!actionType) {
      return res.status(400).json({
        error: 'Action type is required',
      });
    }

    const metadata = parser.get(actionType);

    if (!metadata) {
      return res.status(404).json({
        error: 'Agent not found',
        actionType,
      });
    }

    res.json(metadata);
  });

  return router;
}

export default createPersonalitiesRouter;
