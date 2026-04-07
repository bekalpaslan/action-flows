/**
 * Skills API Routes
 *
 * REST endpoints for per-workbench skill CRUD operations.
 * All routes are scoped to a workbenchId parameter for isolation (D-06).
 *
 * Endpoints:
 * - GET    /api/skills/:workbenchId        — List all skills for a workbench
 * - POST   /api/skills/:workbenchId        — Create a new skill
 * - PUT    /api/skills/:workbenchId/:skillId — Update an existing skill
 * - DELETE /api/skills/:workbenchId/:skillId — Delete a skill
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import type { SkillId } from '@afw/shared';
import type { SkillService } from '../services/skillService.js';

/**
 * Create skills router with injected SkillService dependency.
 */
export default function createSkillsRouter(skillService: SkillService): Router {
  const router = Router();

  /**
   * GET /api/skills/:workbenchId
   * List all skills for a workbench.
   */
  router.get('/:workbenchId', async (req: Request, res: Response) => {
    try {
      const { workbenchId } = req.params;
      const skills = await skillService.listSkills(workbenchId!);

      res.json({
        success: true,
        skills,
      });
    } catch (error) {
      console.error('[Skills API] Error listing skills:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  });

  /**
   * POST /api/skills/:workbenchId
   * Create a new skill for a workbench.
   * Body: { name, description, trigger, action }
   */
  router.post('/:workbenchId', async (req: Request, res: Response) => {
    try {
      const { workbenchId } = req.params;
      const { name, description, trigger, action } = req.body;

      // Validate required fields
      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: 'name is required and must be a non-empty string',
        });
        return;
      }

      if (!trigger || typeof trigger !== 'string' || trigger.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: 'trigger is required and must be a non-empty string',
        });
        return;
      }

      const skill = await skillService.createSkill(workbenchId!, {
        name: name.trim(),
        description: typeof description === 'string' ? description.trim() : '',
        trigger: trigger.trim(),
        action: typeof action === 'string' ? action.trim() : '',
      });

      res.status(201).json({
        success: true,
        skill,
      });
    } catch (error) {
      console.error('[Skills API] Error creating skill:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  });

  /**
   * PUT /api/skills/:workbenchId/:skillId
   * Update an existing skill.
   * Body: partial { name?, description?, trigger?, action? }
   */
  router.put('/:workbenchId/:skillId', async (req: Request, res: Response) => {
    try {
      const { workbenchId, skillId } = req.params;
      const { name, description, trigger, action } = req.body;

      const updates: Partial<{ name: string; description: string; trigger: string; action: string }> = {};
      if (name !== undefined) updates.name = String(name).trim();
      if (description !== undefined) updates.description = String(description).trim();
      if (trigger !== undefined) updates.trigger = String(trigger).trim();
      if (action !== undefined) updates.action = String(action).trim();

      const skill = await skillService.updateSkill(
        workbenchId!,
        skillId as unknown as SkillId,
        updates
      );

      if (!skill) {
        res.status(404).json({
          success: false,
          error: `Skill '${skillId}' not found in workbench '${workbenchId}'`,
        });
        return;
      }

      res.json({
        success: true,
        skill,
      });
    } catch (error) {
      console.error('[Skills API] Error updating skill:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  });

  /**
   * DELETE /api/skills/:workbenchId/:skillId
   * Delete a skill.
   */
  router.delete('/:workbenchId/:skillId', async (req: Request, res: Response) => {
    try {
      const { workbenchId, skillId } = req.params;
      const deleted = await skillService.deleteSkill(
        workbenchId!,
        skillId as unknown as SkillId
      );

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: `Skill '${skillId}' not found in workbench '${workbenchId}'`,
        });
        return;
      }

      res.json({
        success: true,
      });
    } catch (error) {
      console.error('[Skills API] Error deleting skill:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  });

  return router;
}
