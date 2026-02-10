/**
 * Contracts Health Check API Routes
 * Provides contract validation, health check, and drift detection data
 */

import { Router } from 'express';
import { execSync } from 'child_process';
import { sanitizeError } from '../middleware/errorHandler.js';

const router = Router();

/**
 * In-memory cache for health check results
 * TTL: 5 minutes (300000ms)
 */
let cachedHealthCheck: {
  data: any;
  timestamp: number;
} | null = null;

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * GET /api/contracts/health
 * Returns contract health check results (cached with TTL)
 */
router.get('/health', async (req, res) => {
  try {
    const now = Date.now();

    // Return cached data if still fresh
    if (cachedHealthCheck && (now - cachedHealthCheck.timestamp) < CACHE_TTL) {
      return res.json({
        ...cachedHealthCheck.data,
        cached: true,
        cacheAge: Math.floor((now - cachedHealthCheck.timestamp) / 1000), // seconds
      });
    }

    // Run health check
    const output = execSync('pnpm run health:check:ci', {
      encoding: 'utf-8',
      cwd: process.cwd(),
      timeout: 10000, // 10 second timeout
    });

    const result = JSON.parse(output);

    // Update cache
    cachedHealthCheck = {
      data: result,
      timestamp: now,
    };

    res.json({
      ...result,
      cached: false,
      cacheAge: 0,
    });
  } catch (error) {
    console.error('[API] Contract health check failed:', error);

    // If we have stale cache, return it with warning
    if (cachedHealthCheck) {
      return res.json({
        ...cachedHealthCheck.data,
        cached: true,
        stale: true,
        cacheAge: Math.floor((Date.now() - cachedHealthCheck.timestamp) / 1000),
        error: 'Health check failed, returning stale cache',
      });
    }

    res.status(500).json({
      error: 'Contract health check failed',
      message: sanitizeError(error),
    });
  }
});

/**
 * POST /api/contracts/health/refresh
 * Forces a fresh health check (bypasses cache)
 */
router.post('/health/refresh', async (req, res) => {
  try {
    const output = execSync('pnpm run health:check:ci', {
      encoding: 'utf-8',
      cwd: process.cwd(),
      timeout: 10000,
    });

    const result = JSON.parse(output);

    // Update cache
    cachedHealthCheck = {
      data: result,
      timestamp: Date.now(),
    };

    res.json({
      ...result,
      cached: false,
      refreshed: true,
    });
  } catch (error) {
    console.error('[API] Contract health check refresh failed:', error);
    res.status(500).json({
      error: 'Contract health check refresh failed',
      message: sanitizeError(error),
    });
  }
});

export default router;
