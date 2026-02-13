/**
 * Analytics API Routes (GAP-28)
 * Implements SRD Section 4.6: Analytics & Tracking
 *
 * Endpoints:
 * - GET /api/analytics/summary - Overall system stats (total sessions, chains, steps)
 * - GET /api/analytics/flows - Per-flow metrics (usage count, success rate, avg duration)
 * - GET /api/analytics/agents - Per-agent metrics (tasks completed, success rate)
 * - GET /api/analytics/timeline - Time-series data for charts (usage over time)
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import type { Timestamp } from '@afw/shared';
import { analyticsAggregator } from '../services/analyticsAggregator.js';
import { telemetry } from '../services/telemetry.js';
import { storage, isAsyncStorage } from '../storage/index.js';

const router = Router();

/**
 * Zod schema for analytics query parameters
 */
const analyticsQuerySchema = z.object({
  bucket: z.enum(['minute', '5min', 'hour', 'day']).default('hour'),
  fromTimestamp: z.string().optional(),
  toTimestamp: z.string().optional(),
});

/**
 * Parse time range query parameter and convert to timestamps
 * Examples: "24h" -> { fromTimestamp: now-24h, toTimestamp: now }
 */
function parseTimeRange(timeRange?: string): { fromTimestamp?: string; toTimestamp?: string } {
  if (!timeRange) return {};

  const now = new Date();
  const match = timeRange.match(/^(\d+)([hdm])$/); // e.g., "24h", "7d", "30m"

  if (!match) return {};

  const amount = parseInt(match[1], 10);
  const unit = match[2];

  let from = new Date(now);
  switch (unit) {
    case 'h': // hours
      from.setHours(from.getHours() - amount);
      break;
    case 'd': // days
      from.setDate(from.getDate() - amount);
      break;
    case 'm': // minutes
      from.setMinutes(from.getMinutes() - amount);
      break;
  }

  return {
    fromTimestamp: from.toISOString(),
    toTimestamp: now.toISOString(),
  };
}

/**
 * Helper function to filter telemetry entries by time range
 */
function filterByTimeRange(
  entries: any[],
  fromTimestamp?: string,
  toTimestamp?: string
): any[] {
  return entries.filter(entry => {
    const entryTime = new Date(entry.timestamp).getTime();
    if (fromTimestamp && entryTime < new Date(fromTimestamp).getTime()) return false;
    if (toTimestamp && entryTime > new Date(toTimestamp).getTime()) return false;
    return true;
  });
}

/**
 * GET /api/analytics/summary
 * Overall system stats (total sessions, chains, steps)
 */
router.get('/summary', async (req: Request, res: Response) => {
  try {
    // Get telemetry entries
    const serviceEntries = telemetry.query({});
    let storageEntries: any[] = [];

    if (isAsyncStorage(storage)) {
      storageEntries = await storage.queryTelemetry?.({ limit: 10000 }) || [];
    }

    const allEntries = [...serviceEntries, ...storageEntries];

    // Parse time range query parameter
    const timeRange = req.query.timeRange as string | undefined;
    const { fromTimestamp, toTimestamp } = parseTimeRange(timeRange);
    const filteredEntries = filterByTimeRange(allEntries, fromTimestamp, toTimestamp);

    // Calculate system summary
    const summary = analyticsAggregator.calculateSystemSummary(filteredEntries);

    res.json({
      success: true,
      summary,
    });
  } catch (error) {
    console.error('[Analytics API] Error getting summary:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /api/analytics/flows
 * Per-flow metrics (usage count, success rate, avg duration)
 */
router.get('/flows', async (req: Request, res: Response) => {
  try {
    // Get telemetry entries
    const serviceEntries = telemetry.query({});
    let storageEntries: any[] = [];

    if (isAsyncStorage(storage)) {
      storageEntries = await storage.queryTelemetry?.({ limit: 10000 }) || [];
    }

    const allEntries = [...serviceEntries, ...storageEntries];

    // Parse time range query parameter
    const timeRange = req.query.timeRange as string | undefined;
    const { fromTimestamp, toTimestamp } = parseTimeRange(timeRange);
    const filteredEntries = filterByTimeRange(allEntries, fromTimestamp, toTimestamp);

    // Calculate per-flow metrics
    const flowMetrics = analyticsAggregator.calculateFlowMetrics(filteredEntries);

    res.json({
      success: true,
      flows: flowMetrics,
      total: flowMetrics.length,
    });
  } catch (error) {
    console.error('[Analytics API] Error getting flow metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /api/analytics/agents
 * Per-agent metrics (tasks completed, success rate)
 */
router.get('/agents', async (req: Request, res: Response) => {
  try {
    // Get telemetry entries
    const serviceEntries = telemetry.query({});
    let storageEntries: any[] = [];

    if (isAsyncStorage(storage)) {
      storageEntries = await storage.queryTelemetry?.({ limit: 10000 }) || [];
    }

    const allEntries = [...serviceEntries, ...storageEntries];

    // Parse time range query parameter
    const timeRange = req.query.timeRange as string | undefined;
    const { fromTimestamp, toTimestamp } = parseTimeRange(timeRange);
    const filteredEntries = filterByTimeRange(allEntries, fromTimestamp, toTimestamp);

    // Calculate per-agent metrics
    const agentMetrics = analyticsAggregator.calculateAgentMetrics(filteredEntries);

    res.json({
      success: true,
      agents: agentMetrics,
      total: agentMetrics.length,
    });
  } catch (error) {
    console.error('[Analytics API] Error getting agent metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /api/analytics/timeline
 * Time-series data for charts (usage over time)
 */
router.get('/timeline', async (req: Request, res: Response) => {
  try {
    const validation = analyticsQuerySchema.safeParse(req.query);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Invalid query parameters',
        details: validation.error.format(),
      });
      return;
    }

    const { bucket, fromTimestamp, toTimestamp } = validation.data;

    // Get telemetry entries
    const serviceEntries = telemetry.query({});
    let storageEntries: any[] = [];

    if (isAsyncStorage(storage)) {
      storageEntries = await storage.queryTelemetry?.({ limit: 10000 }) || [];
    }

    const allEntries = [...serviceEntries, ...storageEntries];

    // Filter by time range
    const filteredEntries = filterByTimeRange(allEntries, fromTimestamp, toTimestamp);

    // Aggregate telemetry into time buckets
    const timeline = analyticsAggregator.aggregateTelemetry(filteredEntries, bucket);

    res.json({
      success: true,
      timeline,
      bucket,
      count: timeline.length,
    });
  } catch (error) {
    console.error('[Analytics API] Error getting timeline:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

export default router;
