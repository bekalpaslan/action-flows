import { Router } from 'express';
import { z } from 'zod';
import type {
  Bookmark,
  BookmarkCategory,
  BookmarkId,
  DetectedPattern,
  PatternType,
  ProjectId,
  SessionId,
  Timestamp,
  UserId,
} from '@afw/shared';
import { brandedTypes } from '@afw/shared';
import { storage } from '../storage/index.js';
import { validateBody } from '../middleware/validate.js';
import { writeLimiter } from '../middleware/rateLimit.js';
import { sanitizeError } from '../middleware/errorHandler.js';
import {
  createBookmarkSchema,
  analyzePatternSchema,
  type CreateBookmarkRequest,
} from '../schemas/api.js';
import { PatternAnalyzer } from '../services/patternAnalyzer.js';
import { FrequencyTracker } from '../services/frequencyTracker.js';

const router = Router();

/**
 * Zod schemas for pattern and bookmark query parameters
 */

const patternQuerySchema = z.object({
  minConfidence: z.coerce.number().min(0).max(1).optional(),
  type: z
    .enum(['frequency', 'sequence', 'temporal', 'error-recovery', 'preference'])
    .optional(),
  since: z.string().datetime().optional(),
});

const bookmarkQuerySchema = z.object({
  category: z
    .enum([
      'useful-pattern',
      'good-output',
      'want-to-automate',
      'reference-material',
      'other',
    ])
    .optional(),
  since: z.string().datetime().optional(),
  userId: z.string().optional(),
});

/**
 * Utility function to generate a bookmark ID
 */
function generateBookmarkId(): BookmarkId {
  return `bm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` as BookmarkId;
}

/**
 * GET /api/patterns/:projectId
 * Get detected patterns with optional filtering
 */
router.get('/:projectId', async (req, res) => {
  try {
    const projectId = req.params.projectId as ProjectId;
    const query = patternQuerySchema.parse(req.query);

    const patterns = await Promise.resolve(
      storage.getPatterns(projectId, {
        patternType: query.type,
        minConfidence: query.minConfidence,
        since: query.since as Timestamp | undefined,
      })
    );

    res.json(patterns);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid query parameters',
        details: error.errors,
      });
    }

    console.error('[API] Error fetching patterns:', error);
    res.status(500).json({
      error: 'Failed to fetch patterns',
      message: sanitizeError(error),
    });
  }
});

/**
 * POST /api/patterns/:projectId/analyze
 * Trigger pattern analysis
 */
router.post('/:projectId/analyze', writeLimiter, validateBody(analyzePatternSchema), async (req, res) => {
  try {
    const projectId = req.params.projectId as ProjectId;
    const { force } = req.body;

    console.log(`[API] Pattern analysis triggered for project ${projectId} (force=${force})`);

    // Create PatternAnalyzer with FrequencyTracker
    const frequencyTracker = new FrequencyTracker(storage);
    const analyzer = new PatternAnalyzer(frequencyTracker, storage);

    // Run analysis
    const analysisResult = await analyzer.analyze(projectId);

    // Store detected patterns in storage
    for (const pattern of [
      ...analysisResult.frequencyPatterns,
      ...analysisResult.sequencePatterns,
      ...analysisResult.bookmarkPatterns,
    ]) {
      await Promise.resolve(storage.addPattern(pattern));
    }

    console.log(
      `[API] Pattern analysis completed for ${projectId}: ` +
      `${analysisResult.frequencyPatterns.length} frequency, ` +
      `${analysisResult.sequencePatterns.length} sequence, ` +
      `${analysisResult.bookmarkPatterns.length} bookmark patterns`
    );

    res.json({
      ...analysisResult,
      analyzedAt: brandedTypes.currentTimestamp(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid request body',
        details: error.errors,
      });
    }

    console.error('[API] Error triggering pattern analysis:', error);
    res.status(500).json({
      error: 'Failed to trigger pattern analysis',
      message: sanitizeError(error),
    });
  }
});

/**
 * POST /api/bookmarks
 * Create a new bookmark
 */
router.post('/bookmarks', writeLimiter, validateBody(createBookmarkSchema), async (req, res) => {
  try {
    const data = req.body as CreateBookmarkRequest;

    const bookmark: Bookmark = {
      id: generateBookmarkId(),
      sessionId: brandedTypes.sessionId(data.sessionId),
      messageIndex: data.messageIndex,
      messageContent: data.messageContent,
      category: data.category as BookmarkCategory,
      explanation: data.explanation,
      timestamp: brandedTypes.currentTimestamp(),
      userId: data.userId ? brandedTypes.userId(data.userId) : undefined,
      projectId: data.projectId as ProjectId | undefined,
      tags: data.tags,
    };

    await Promise.resolve(storage.addBookmark(bookmark));

    console.log(`[API] Bookmark created: ${bookmark.id}`);

    res.status(201).json(bookmark);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid request body',
        details: error.errors,
      });
    }

    console.error('[API] Error creating bookmark:', error);
    res.status(500).json({
      error: 'Failed to create bookmark',
      message: sanitizeError(error),
    });
  }
});

/**
 * GET /api/bookmarks/:projectId
 * List bookmarks for a project with optional filtering
 */
router.get('/bookmarks/:projectId', async (req, res) => {
  try {
    const projectId = req.params.projectId as ProjectId;
    const query = bookmarkQuerySchema.parse(req.query);

    const bookmarks = await Promise.resolve(
      storage.getBookmarks(projectId, {
        category: query.category as BookmarkCategory | undefined,
        since: query.since as Timestamp | undefined,
        userId: query.userId ? brandedTypes.userId(query.userId) : undefined,
      })
    );

    res.json(bookmarks);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid query parameters',
        details: error.errors,
      });
    }

    console.error('[API] Error fetching bookmarks:', error);
    res.status(500).json({
      error: 'Failed to fetch bookmarks',
      message: sanitizeError(error),
    });
  }
});

/**
 * DELETE /api/bookmarks/:bookmarkId
 * Delete a bookmark by ID
 */
router.delete('/bookmarks/:bookmarkId', writeLimiter, async (req, res) => {
  try {
    const bookmarkId = req.params.bookmarkId;

    await Promise.resolve(storage.removeBookmark(bookmarkId));

    console.log(`[API] Bookmark deleted: ${bookmarkId}`);

    res.json({ success: true });
  } catch (error) {
    console.error('[API] Error deleting bookmark:', error);
    res.status(500).json({
      error: 'Failed to delete bookmark',
      message: sanitizeError(error),
    });
  }
});

export default router;
