import { Router } from 'express';
import type { ProjectId, ToolbarConfig, ToolbarSlot, ButtonId, Timestamp } from '@afw/shared';
import { brandedTypes } from '@afw/shared';
import { storage } from '../storage/index.js';
import { validateBody } from '../middleware/validate.js';
import {
  toolbarConfigSchema,
  trackButtonUsageSchema,
} from '../schemas/api.js';
import { writeLimiter } from '../middleware/rateLimit.js';
import { sanitizeError } from '../middleware/errorHandler.js';

const router = Router();

/**
 * In-memory toolbar configs for now
 * TODO: Integrate with full Storage interface when storage layer is enhanced
 */
const toolbarConfigs = new Map<ProjectId, ToolbarConfig>();

/**
 * Get default toolbar configuration
 */
function getDefaultConfig(): ToolbarConfig {
  return {
    maxSlots: 10,
    slots: [],
    autoLearn: true,
    showUsageCount: false,
  };
}

/**
 * GET /api/toolbar/:projectId/config
 * Get toolbar config for a project
 */
router.get('/:projectId/config', (req, res) => {
  try {
    const projectId = req.params.projectId as ProjectId;

    // Return stored config or default
    const config = toolbarConfigs.get(projectId) || getDefaultConfig();

    res.json(config);
  } catch (error) {
    console.error('[Toolbar] Error fetching config:', error);
    res.status(500).json({
      error: 'Failed to fetch toolbar config',
      message: sanitizeError(error),
    });
  }
});

/**
 * PUT /api/toolbar/:projectId/config
 * Update toolbar config for a project
 */
router.put(
  '/:projectId/config',
  writeLimiter,
  validateBody(toolbarConfigSchema),
  (req, res) => {
    try {
      const projectId = req.params.projectId as ProjectId;
      const configUpdate = req.body as ToolbarConfig;

      // Validate maxSlots against actual slots
      if (configUpdate.slots.length > configUpdate.maxSlots) {
        return res.status(400).json({
          error: 'Invalid configuration',
          message: `Number of slots (${configUpdate.slots.length}) exceeds maxSlots (${configUpdate.maxSlots})`,
        });
      }

      // Validate slot positions
      const positions = new Set<number>();
      for (const slot of configUpdate.slots) {
        if (slot.position >= configUpdate.maxSlots) {
          return res.status(400).json({
            error: 'Invalid configuration',
            message: `Slot position ${slot.position} exceeds maxSlots ${configUpdate.maxSlots}`,
          });
        }
        if (positions.has(slot.position)) {
          return res.status(400).json({
            error: 'Invalid configuration',
            message: `Duplicate slot position: ${slot.position}`,
          });
        }
        positions.add(slot.position);
      }

      // Type assertion - cast slots to proper type
      const validatedSlots: ToolbarSlot[] = configUpdate.slots;

      // Store updated config
      toolbarConfigs.set(projectId, configUpdate);

      console.log(`[Toolbar] Config updated for project: ${projectId}`);

      res.json(configUpdate);
    } catch (error) {
      console.error('[Toolbar] Error updating config:', error);
      res.status(500).json({
        error: 'Failed to update toolbar config',
        message: sanitizeError(error),
      });
    }
  }
);

/**
 * POST /api/toolbar/:projectId/track
 * Track button usage and update statistics
 */
router.post(
  '/:projectId/track',
  writeLimiter,
  validateBody(trackButtonUsageSchema),
  (req, res) => {
    try {
      const projectId = req.params.projectId as ProjectId;
      const { buttonId, sessionId } = req.body;

      // Get current config or create default
      let config = toolbarConfigs.get(projectId);
      if (!config) {
        config = getDefaultConfig();
        toolbarConfigs.set(projectId, config);
      }

      // Find or create slot for this button
      let slot = config.slots.find((s) => s.buttonId === (buttonId as ButtonId));

      const currentTimestamp = brandedTypes.currentTimestamp();

      if (!slot) {
        // Create new slot
        const newPosition = Math.min(config.slots.length, config.maxSlots - 1);
        slot = {
          buttonId: buttonId as ButtonId,
          pinned: false,
          position: newPosition,
          usageCount: 1,
          lastUsed: currentTimestamp as unknown as Timestamp,
        };
        config.slots.push(slot);
      } else {
        // Update existing slot
        slot.usageCount += 1;
        slot.lastUsed = currentTimestamp as unknown as Timestamp;

        // If using autoLearn and slot isn't pinned, potentially reorder
        if (config.autoLearn && !slot.pinned) {
          // Sort unpinned slots by usage count (descending) and lastUsed (recent first)
          const unpinned = config.slots.filter((s: ToolbarSlot) => !s.pinned);
          unpinned.sort((a: ToolbarSlot, b: ToolbarSlot) => {
            if (b.usageCount !== a.usageCount) {
              return b.usageCount - a.usageCount;
            }
            return Number(b.lastUsed) - Number(a.lastUsed);
          });

          // Assign positions to unpinned slots
          unpinned.forEach((s: ToolbarSlot, idx: number) => {
            s.position = idx;
          });

          // Pinned slots keep their positions
          const pinnedSlots = config.slots.filter((s: ToolbarSlot) => s.pinned);
          pinnedSlots.forEach((s: ToolbarSlot) => {
            s.position = Math.max(s.position, unpinned.length);
          });
        }
      }

      // Trim slots if exceeds maxSlots
      if (config.slots.length > config.maxSlots) {
        // Keep pinned slots and most used unpinned slots
        const pinned = config.slots.filter((s: ToolbarSlot) => s.pinned);
        const unpinned = config.slots
          .filter((s: ToolbarSlot) => !s.pinned)
          .sort((a: ToolbarSlot, b: ToolbarSlot) => {
            if (b.usageCount !== a.usageCount) {
              return b.usageCount - a.usageCount;
            }
            return Number(b.lastUsed) - Number(a.lastUsed);
          });

        const slotsToKeep = config.maxSlots - pinned.length;
        config.slots = [...pinned, ...unpinned.slice(0, slotsToKeep)];

        // Reassign positions
        config.slots.forEach((s: ToolbarSlot, idx: number) => {
          s.position = idx;
        });
      }

      // Store updated config
      toolbarConfigs.set(projectId, config);

      console.log(
        `[Toolbar] Button tracked: ${buttonId} in project ${projectId} (usage: ${slot.usageCount})`
      );

      res.json({
        usageCount: slot.usageCount,
        sessionId,
        buttonId,
        timestamp: currentTimestamp,
      });
    } catch (error) {
      console.error('[Toolbar] Error tracking button usage:', error);
      res.status(500).json({
        error: 'Failed to track button usage',
        message: sanitizeError(error),
      });
    }
  }
);

export default router;
