/**
 * Telemetry API Routes
 * Query and statistics endpoints for structured telemetry entries
 */

import express, { Router, Request, Response } from 'express';
import { z } from 'zod';
import type { TelemetryQueryFilter } from '@afw/shared';
import { brandedTypes } from '@afw/shared';
import { telemetry } from '../services/telemetry.js';
import { storage, isAsyncStorage } from '../storage/index.js';

const router = Router();

/**
 * Zod schema for telemetry query parameters
 */
const telemetryQuerySchema = z.object({
  level: z.enum(['debug', 'info', 'warn', 'error']).optional(),
  source: z.string().optional(),
  sessionId: z.string().optional(),
  fromTimestamp: z.string().optional(),
  toTimestamp: z.string().optional(),
  limit: z.coerce.number().int().positive().max(1000).optional(),
});

/**
 * GET /api/telemetry
 * Query telemetry entries with optional filters
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    // Validate query parameters
    const validation = telemetryQuerySchema.safeParse(req.query);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Invalid query parameters',
        details: validation.error.format(),
      });
      return;
    }

    const params = validation.data;

    // Build filter
    const filter: TelemetryQueryFilter = {
      level: params.level,
      source: params.source,
      sessionId: params.sessionId ? brandedTypes.sessionId(params.sessionId) : undefined,
      fromTimestamp: params.fromTimestamp ? brandedTypes.timestamp(params.fromTimestamp) : undefined,
      toTimestamp: params.toTimestamp ? brandedTypes.timestamp(params.toTimestamp) : undefined,
      limit: params.limit,
    };

    // Query telemetry service first (in-memory ring buffer)
    const serviceEntries = telemetry.query(filter);

    // Also query storage if available
    let storageEntries: any[] = [];
    if (isAsyncStorage(storage)) {
      storageEntries = await storage.queryTelemetry(filter);
    } else if (storage.telemetryEntries) {
      storageEntries = await Promise.resolve(storage.queryTelemetry(filter));
    }

    // Merge and deduplicate by ID
    const entriesMap = new Map();
    for (const entry of [...serviceEntries, ...storageEntries]) {
      entriesMap.set(entry.id, entry);
    }

    const entries = Array.from(entriesMap.values());

    // Sort by timestamp (most recent last)
    entries.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    res.json({
      success: true,
      entries,
      count: entries.length,
    });
  } catch (error) {
    console.error('[Telemetry API] Error querying telemetry:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /api/telemetry/stats
 * Get aggregate statistics about telemetry entries
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    // Get stats from telemetry service
    const serviceStats = telemetry.getStats();

    // Also get stats from storage if available
    let storageStats = null;
    if (isAsyncStorage(storage)) {
      storageStats = await storage.getTelemetryStats();
    } else if (storage.telemetryEntries) {
      storageStats = storage.getTelemetryStats();
    }

    // Merge stats (prefer storage if available, otherwise use service)
    const stats = storageStats || serviceStats;

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('[Telemetry API] Error getting telemetry stats:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

export default router;
