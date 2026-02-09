import express, { Router } from 'express';
import type { SuggestionEntry, SuggestionId, DossierId } from '@afw/shared';
import { createSuggestionId } from '@afw/shared';
import { storage } from '../storage/index.js';
import { validateBody } from '../middleware/validate.js';
import { writeLimiter } from '../middleware/rateLimit.js';
import { sanitizeError } from '../middleware/errorHandler.js';
import { createSuggestionSchema } from '../schemas/api.js';

const router = Router();

/**
 * GET /api/suggestions
 * List all suggestions, sorted by frequency descending
 */
router.get('/', async (req, res) => {
  try {
    const suggestions = await Promise.resolve(storage.listSuggestions());

    // Sort by frequency (highest first)
    const sorted = suggestions.sort((a, b) => b.frequency - a.frequency);

    res.json({
      count: sorted.length,
      suggestions: sorted,
    });
  } catch (error) {
    console.error('[API] Error listing suggestions:', error);
    res.status(500).json({
      error: 'Failed to list suggestions',
      message: sanitizeError(error),
    });
  }
});

/**
 * GET /api/suggestions/:id
 * Get suggestion by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const suggestion = await Promise.resolve(storage.getSuggestion(id));

    if (!suggestion) {
      return res.status(404).json({
        error: 'Suggestion not found',
        suggestionId: id,
      });
    }

    res.json(suggestion);
  } catch (error) {
    console.error('[API] Error fetching suggestion:', error);
    res.status(500).json({
      error: 'Failed to fetch suggestion',
      message: sanitizeError(error),
    });
  }
});

/**
 * POST /api/suggestions
 * Create a new suggestion
 * If a matching 'needed' widget already exists, increment frequency instead
 */
router.post('/', writeLimiter, validateBody(createSuggestionSchema), async (req, res) => {
  try {
    const { dossierId, needed, reason, fallback } = req.body;

    // Check if a suggestion for this widget type already exists
    const existing = await Promise.resolve(storage.listSuggestions());
    const match = existing.find(s => s.needed === needed);

    if (match) {
      // Increment frequency of existing suggestion
      const incremented = await Promise.resolve(storage.incrementSuggestionFrequency(match.id));

      if (!incremented) {
        return res.status(500).json({
          error: 'Failed to increment suggestion frequency',
          suggestionId: match.id,
        });
      }

      // Fetch updated suggestion
      const updated = await Promise.resolve(storage.getSuggestion(match.id));

      console.log(`[API] Suggestion frequency incremented: ${match.id} (${needed})`);

      return res.status(200).json({
        created: false,
        incremented: true,
        suggestion: updated,
      });
    }

    // Create new suggestion
    const suggestion: SuggestionEntry = {
      id: createSuggestionId(),
      type: 'widget_suggestion',
      requestedBy: dossierId as DossierId,
      needed,
      reason,
      fallback,
      frequency: 1,
      timestamp: new Date().toISOString(),
    };

    await Promise.resolve(storage.addSuggestion(suggestion));

    console.log(`[API] Suggestion created: ${suggestion.id} (${needed})`);

    res.status(201).json({
      created: true,
      incremented: false,
      suggestion,
    });
  } catch (error) {
    console.error('[API] Error creating suggestion:', error);
    res.status(500).json({
      error: 'Failed to create suggestion',
      message: sanitizeError(error),
    });
  }
});

/**
 * DELETE /api/suggestions/:id
 * Dismiss/delete a suggestion
 */
router.delete('/:id', writeLimiter, async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Promise.resolve(storage.deleteSuggestion(id));

    if (!deleted) {
      return res.status(404).json({
        error: 'Suggestion not found',
        suggestionId: id,
      });
    }

    console.log(`[API] Suggestion deleted: ${id}`);

    res.json({
      success: true,
      suggestionId: id,
    });
  } catch (error) {
    console.error('[API] Error deleting suggestion:', error);
    res.status(500).json({
      error: 'Failed to delete suggestion',
      message: sanitizeError(error),
    });
  }
});

/**
 * POST /api/suggestions/:id/promote
 * Mark suggestion as promoted (Phase 1: returns info only)
 * Phase 2 will implement actual widget creation
 */
router.post('/:id/promote', writeLimiter, async (req, res) => {
  try {
    const { id } = req.params;

    const suggestion = await Promise.resolve(storage.getSuggestion(id));

    if (!suggestion) {
      return res.status(404).json({
        error: 'Suggestion not found',
        suggestionId: id,
      });
    }

    console.log(`[API] Suggestion promotion requested: ${id} (${suggestion.needed})`);

    // Phase 1: Just return info about what would happen
    res.json({
      success: true,
      suggestionId: id,
      needed: suggestion.needed,
      frequency: suggestion.frequency,
      message: 'Phase 1: Promotion acknowledged but not implemented yet',
      nextSteps: [
        'Phase 2 will create the widget component',
        'Phase 2 will register it in the widget system',
        'Phase 2 will remove this suggestion after successful promotion',
      ],
    });
  } catch (error) {
    console.error('[API] Error promoting suggestion:', error);
    res.status(500).json({
      error: 'Failed to promote suggestion',
      message: sanitizeError(error),
    });
  }
});

export default router;
