/**
 * Lifecycle API Routes
 * Provides access to lifecycle manager state, policies, and events
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import { lifecycleManager } from '../services/lifecycleManager.js';
import type { LifecyclePhase } from '@afw/shared';

const router = Router();

/**
 * GET /api/lifecycle/policies
 * Get all registered lifecycle policies
 */
router.get('/policies', (_req: Request, res: Response) => {
  try {
    const policies = [
      lifecycleManager.getPolicy('session'),
      lifecycleManager.getPolicy('chain'),
      lifecycleManager.getPolicy('event'),
    ].filter(Boolean);

    res.json({ policies });
  } catch (error) {
    console.error('[Lifecycle API] Error fetching policies:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/lifecycle/stats
 * Get aggregate lifecycle statistics
 */
router.get('/stats', (_req: Request, res: Response) => {
  try {
    const stats = lifecycleManager.getStats();
    res.json(stats);
  } catch (error) {
    console.error('[Lifecycle API] Error fetching stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/lifecycle/events
 * Get recent lifecycle events
 *
 * Query params:
 * - resourceType: Filter by resource type (optional)
 * - limit: Limit number of events (default: 50, max: 1000)
 */
router.get('/events', (req: Request, res: Response) => {
  try {
    const { resourceType, limit: limitParam } = req.query;
    const limit = limitParam ? Math.min(parseInt(limitParam as string, 10), 1000) : 50;

    let events;
    if (resourceType && typeof resourceType === 'string') {
      events = lifecycleManager.getEventsByResourceType(resourceType, limit);
    } else {
      events = lifecycleManager.getRecentEvents(limit);
    }

    res.json({
      events,
      count: events.length,
    });
  } catch (error) {
    console.error('[Lifecycle API] Error fetching events:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/lifecycle/:resourceType
 * Get lifecycle states for a resource type, with optional phase filter
 *
 * Query params:
 * - phase: Filter by lifecycle phase (optional)
 * - resourceId: Filter by specific resource ID (optional)
 */
router.get('/:resourceType', (req: Request, res: Response) => {
  try {
    const { resourceType } = req.params;
    const { phase, resourceId } = req.query;

    // Validate resource type
    if (!['session', 'chain', 'event'].includes(resourceType)) {
      res.status(400).json({
        error: 'Invalid resource type',
        validTypes: ['session', 'chain', 'event'],
      });
      return;
    }

    // If resourceId is provided, return single resource phase
    if (resourceId && typeof resourceId === 'string') {
      const currentPhase = lifecycleManager.getPhase(resourceType, resourceId);
      res.json({
        resourceType,
        resourceId,
        phase: currentPhase,
      });
      return;
    }

    // If phase filter is provided, return resources in that phase
    if (phase && typeof phase === 'string') {
      const validPhases: LifecyclePhase[] = ['active', 'idle', 'expiring', 'evicted'];
      if (!validPhases.includes(phase as LifecyclePhase)) {
        res.status(400).json({
          error: 'Invalid phase',
          validPhases,
        });
        return;
      }

      const resources = lifecycleManager.getResourcesByPhase(resourceType, phase as LifecyclePhase);
      res.json({
        resourceType,
        phase,
        resources,
        count: resources.length,
      });
      return;
    }

    // No filters - return all phases for this resource type
    const stats = lifecycleManager.getStats();
    res.json({
      resourceType,
      totalTracked: stats.byResourceType[resourceType] || 0,
      byPhase: {
        active: lifecycleManager.getResourcesByPhase(resourceType, 'active').length,
        idle: lifecycleManager.getResourcesByPhase(resourceType, 'idle').length,
        expiring: lifecycleManager.getResourcesByPhase(resourceType, 'expiring').length,
        evicted: lifecycleManager.getResourcesByPhase(resourceType, 'evicted').length,
      },
    });
  } catch (error) {
    console.error('[Lifecycle API] Error fetching lifecycle states:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
