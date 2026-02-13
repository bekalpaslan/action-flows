/**
 * Flow Registry API Routes (GAP-14)
 * Implements SRD Section 4.5: Flow Registration & Discovery
 *
 * Endpoints:
 * - GET /api/flows - List all flows with metadata
 * - POST /api/flows - Register new flow at runtime
 * - GET /api/flows/:flowId - Get flow details + execution history
 * - PUT /api/flows/:flowId - Update flow metadata/description
 * - DELETE /api/flows/:flowId - Unregister flow
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import type { FlowMetadata, Timestamp } from '@afw/shared';
import { brandedTypes } from '@afw/shared';
import { storage, isAsyncStorage } from '../storage/index.js';

const router = Router();
const FLOWS_KEY_PREFIX = 'flow:';
const FLOWS_INDEX_KEY = 'flows:index';

/**
 * Zod schema for flow metadata validation
 */
const flowMetadataSchema = z.object({
  id: z.string().min(1, 'Flow ID is required'),
  name: z.string().min(1, 'Flow name is required'),
  description: z.string().min(1, 'Description is required'),
  category: z.enum(['work', 'maintenance', 'explore', 'review', 'settings', 'pm', 'intel']),
  tags: z.array(z.string()).default([]),
  version: z.string().default('1.0.0'),
  author: z.string().optional(),
  readme: z.string().optional(),
  chainTemplate: z.string().optional(),
});

/**
 * Zod schema for updating flow metadata
 */
const updateFlowSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  version: z.string().optional(),
  readme: z.string().optional(),
  author: z.string().optional(),
});

/**
 * Zod schema for query parameters
 */
const flowQuerySchema = z.object({
  category: z.enum(['work', 'maintenance', 'explore', 'review', 'settings', 'pm', 'intel']).optional(),
  tag: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).default(50),
  offset: z.coerce.number().int().nonnegative().default(0),
});

/**
 * GET /api/flows
 * List all flows with metadata (tags, version, usage stats)
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const validation = flowQuerySchema.safeParse(req.query);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Invalid query parameters',
        details: validation.error.format(),
      });
      return;
    }

    const { category, tag, limit, offset } = validation.data;
    let flows: FlowMetadata[] = [];

    // Retrieve all flow IDs from index
    if (storage.keys) {
      const flowKeys = await Promise.resolve(storage.keys(`${FLOWS_KEY_PREFIX}*`));

      // Retrieve each flow
      for (const key of flowKeys) {
        if (storage.get) {
          const data = await Promise.resolve(storage.get(key));
          if (data) {
            try {
              const flow = JSON.parse(data) as FlowMetadata;
              flows.push(flow);
            } catch (e) {
              console.error(`[Flows API] Failed to parse flow ${key}:`, e);
            }
          }
        }
      }
    }

    // Apply filters
    if (category) {
      flows = flows.filter(f => f.category === category);
    }
    if (tag) {
      flows = flows.filter(f => f.tags.includes(tag));
    }

    // Sort by usage count (most used first), then by name
    flows.sort((a, b) => {
      if (b.usageCount !== a.usageCount) {
        return b.usageCount - a.usageCount;
      }
      return a.name.localeCompare(b.name);
    });

    // Apply pagination
    const total = flows.length;
    flows = flows.slice(offset, offset + limit);

    res.json({
      success: true,
      flows,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('[Flows API] Error listing flows:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * POST /api/flows
 * Register new flow at runtime
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const validation = flowMetadataSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Invalid flow metadata',
        details: validation.error.format(),
      });
      return;
    }

    const data = validation.data;
    const now = new Date().toISOString() as Timestamp;

    const flow: FlowMetadata = {
      id: data.id,
      name: data.name,
      description: data.description,
      category: data.category,
      tags: data.tags,
      version: data.version,
      author: data.author,
      usageCount: 0,
      readme: data.readme,
      chainTemplate: data.chainTemplate,
      registeredAt: now,
      modifiedAt: now,
    };

    // Store flow using key-value storage
    if (storage.set) {
      const key = `${FLOWS_KEY_PREFIX}${data.id}`;
      await Promise.resolve(storage.set(key, JSON.stringify(flow)));
    }

    res.status(201).json({
      success: true,
      flow,
      message: `Flow '${data.name}' registered successfully`,
    });
  } catch (error) {
    console.error('[Flows API] Error registering flow:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /api/flows/:flowId
 * Get flow details + execution history
 */
router.get('/:flowId', async (req: Request, res: Response) => {
  try {
    const { flowId } = req.params;
    let flow: FlowMetadata | undefined;

    if (storage.get) {
      const key = `${FLOWS_KEY_PREFIX}${flowId}`;
      const data = await Promise.resolve(storage.get(key));
      if (data) {
        try {
          flow = JSON.parse(data) as FlowMetadata;
        } catch (e) {
          console.error(`[Flows API] Failed to parse flow ${flowId}:`, e);
        }
      }
    }

    if (!flow) {
      res.status(404).json({
        success: false,
        error: `Flow '${flowId}' not found`,
      });
      return;
    }

    res.json({
      success: true,
      flow,
    });
  } catch (error) {
    console.error('[Flows API] Error getting flow:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * PUT /api/flows/:flowId
 * Update flow metadata/description
 */
router.put('/:flowId', async (req: Request, res: Response) => {
  try {
    const { flowId } = req.params;
    const validation = updateFlowSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Invalid update data',
        details: validation.error.format(),
      });
      return;
    }

    const updates = validation.data;
    const now = new Date().toISOString() as Timestamp;

    // Retrieve existing flow
    let flow: FlowMetadata | undefined;
    if (storage.get) {
      const key = `${FLOWS_KEY_PREFIX}${flowId}`;
      const data = await Promise.resolve(storage.get(key));
      if (data) {
        try {
          flow = JSON.parse(data) as FlowMetadata;
        } catch (e) {
          console.error(`[Flows API] Failed to parse flow ${flowId}:`, e);
        }
      }
    }

    if (!flow) {
      res.status(404).json({
        success: false,
        error: `Flow '${flowId}' not found`,
      });
      return;
    }

    // Apply updates
    const updatedFlow: FlowMetadata = {
      ...flow,
      ...updates,
      modifiedAt: now,
    };

    // Store updated flow
    if (storage.set) {
      const key = `${FLOWS_KEY_PREFIX}${flowId}`;
      await Promise.resolve(storage.set(key, JSON.stringify(updatedFlow)));
    }

    res.json({
      success: true,
      flow: updatedFlow,
      message: `Flow '${flowId}' updated successfully`,
      modifiedAt: now,
    });
  } catch (error) {
    console.error('[Flows API] Error updating flow:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * DELETE /api/flows/:flowId
 * Unregister flow
 */
router.delete('/:flowId', async (req: Request, res: Response) => {
  try {
    const { flowId } = req.params;

    // Mark flow as deleted by setting empty value or delete if method available
    const key = `${FLOWS_KEY_PREFIX}${flowId}`;

    // Try to use delete if available, otherwise set to empty string
    if (storage.delete) {
      await Promise.resolve((storage as any).delete(key));
    } else if (storage.set) {
      // Fallback: mark as deleted
      await Promise.resolve(storage.set(key, ''));
    }

    res.json({
      success: true,
      message: `Flow '${flowId}' unregistered successfully`,
    });
  } catch (error) {
    console.error('[Flows API] Error deleting flow:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

export default router;
