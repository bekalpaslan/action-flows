/**
 * Project API Routes
 * CRUD endpoints for managing registered projects
 */

import { Router, type Request, type Response } from 'express';
import type { ProjectId } from '@afw/shared';
import { projectStorage } from '../services/projectStorage.js';
import { ProjectDetector } from '../services/projectDetector.js';
import { validateBody } from '../middleware/validate.js';
import { createProjectSchema, updateProjectSchema, autoDetectProjectSchema } from '../schemas/api.js';
import { writeLimiter } from '../middleware/rateLimit.js';

const router = Router();

/**
 * Sanitize error messages for API responses
 */
function sanitizeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
}

/**
 * GET /api/projects
 * List all projects (sorted by lastUsedAt desc)
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const projects = await projectStorage.getAllProjects();
    res.json({
      count: projects.length,
      projects,
    });
  } catch (error) {
    console.error('[Projects] Error listing projects:', error);
    res.status(500).json({
      error: sanitizeError(error),
    });
  }
});

/**
 * POST /api/projects/detect
 * Auto-detect project metadata from a working directory
 * NOTE: This route MUST come before /:id to avoid routing conflicts
 */
router.post('/detect', writeLimiter, validateBody(autoDetectProjectSchema), async (req: Request, res: Response) => {
  const { cwd } = req.body;

  try {
    const detected = await ProjectDetector.detectProject(cwd);

    res.json({
      success: true,
      detected,
    });
  } catch (error) {
    console.error('[Projects] Error detecting project:', error);
    res.status(500).json({
      error: sanitizeError(error),
    });
  }
});

/**
 * GET /api/projects/:id
 * Get a single project by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const project = await projectStorage.getProject(id as ProjectId);
    if (!project) {
      return res.status(404).json({
        error: 'Project not found',
      });
    }

    res.json({
      project,
    });
  } catch (error) {
    console.error('[Projects] Error getting project:', error);
    res.status(500).json({
      error: sanitizeError(error),
    });
  }
});

/**
 * POST /api/projects
 * Create a new project
 */
router.post('/', writeLimiter, validateBody(createProjectSchema), async (req: Request, res: Response) => {
  const {
    name,
    cwd,
    defaultCliFlags = [],
    defaultPromptTemplate = null,
    mcpConfigPath = null,
    envVars = {},
    quickActionPresets = [],
    description = null,
  } = req.body;

  try {
    // Validate environment variables
    for (const [key, value] of Object.entries(envVars)) {
      if (!ProjectDetector.validateEnvVarKey(key)) {
        return res.status(400).json({
          error: `Invalid environment variable key: ${key}`,
        });
      }
      if (!ProjectDetector.validateEnvVarValue(value as string)) {
        return res.status(400).json({
          error: `Invalid environment variable value for key: ${key}`,
        });
      }
    }

    const project = await projectStorage.createProject({
      name,
      cwd,
      defaultCliFlags,
      defaultPromptTemplate,
      mcpConfigPath,
      envVars,
      quickActionPresets,
      description,
      actionflowsDetected: false, // Will be set if user runs auto-detection
    });

    res.status(201).json({
      success: true,
      project,
    });
  } catch (error) {
    console.error('[Projects] Error creating project:', error);
    res.status(500).json({
      error: sanitizeError(error),
    });
  }
});

/**
 * PUT /api/projects/:id
 * Update an existing project
 */
router.put('/:id', writeLimiter, validateBody(updateProjectSchema), async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData = req.body;

  try {
    // Validate environment variables if provided
    if (updateData.envVars) {
      for (const [key, value] of Object.entries(updateData.envVars)) {
        if (!ProjectDetector.validateEnvVarKey(key)) {
          return res.status(400).json({
            error: `Invalid environment variable key: ${key}`,
          });
        }
        if (!ProjectDetector.validateEnvVarValue(value as string)) {
          return res.status(400).json({
            error: `Invalid environment variable value for key: ${key}`,
          });
        }
      }
    }

    const project = await projectStorage.updateProject(id as ProjectId, updateData);

    res.json({
      success: true,
      project,
    });
  } catch (error) {
    const errorMessage = sanitizeError(error);
    if (errorMessage.includes('not found')) {
      return res.status(404).json({
        error: errorMessage,
      });
    }

    console.error('[Projects] Error updating project:', error);
    res.status(500).json({
      error: errorMessage,
    });
  }
});

/**
 * DELETE /api/projects/:id
 * Delete a project
 */
router.delete('/:id', writeLimiter, async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const deleted = await projectStorage.deleteProject(id as ProjectId);

    if (!deleted) {
      return res.status(404).json({
        error: 'Project not found',
      });
    }

    res.json({
      success: true,
      deleted: true,
    });
  } catch (error) {
    console.error('[Projects] Error deleting project:', error);
    res.status(500).json({
      error: sanitizeError(error),
    });
  }
});

export default router;
