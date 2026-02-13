import { Router } from 'express';
import type { Request, Response } from 'express';
import { artifactStorage } from '../services/artifactStorage.js';
import { artifactParser } from '../services/artifactParser.js';
import type { ArtifactId, Artifact } from '@afw/shared';
import { toArtifactId } from '@afw/shared';

const router = Router();

/**
 * Artifact REST endpoints
 * Thread 4: Live Canvas — Phase 2 backend implementation
 */

/**
 * POST /api/artifacts
 * Create artifact (from agent output)
 *
 * Body: Omit<Artifact, 'id'>
 * Returns: StoredArtifact
 */
router.post('/', (req: Request, res: Response) => {
  try {
    const artifactData = req.body as Omit<Artifact, 'id'>;

    // Validate required fields
    if (!artifactData.sessionId || !artifactData.chainId || !artifactData.type || !artifactData.content) {
      res.status(400).json({
        error: 'Missing required fields: sessionId, chainId, type, content',
      });
      return;
    }

    const stored = artifactStorage.create(artifactData);
    res.status(201).json(stored);
  } catch (error) {
    console.error('Error creating artifact:', error);
    res.status(500).json({
      error: 'Failed to create artifact',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/artifacts/:artifactId
 * Get artifact by ID
 *
 * Returns: StoredArtifact | 404
 */
router.get('/:artifactId', (req: Request, res: Response) => {
  try {
    const artifactIdParam = req.params.artifactId;
    if (!artifactIdParam) {
      res.status(400).json({ error: 'Missing artifactId parameter' });
      return;
    }

    const artifactId = toArtifactId(artifactIdParam);
    const artifact = artifactStorage.get(artifactId);

    if (!artifact) {
      res.status(404).json({ error: 'Artifact not found' });
      return;
    }

    res.json(artifact);
  } catch (error) {
    console.error('Error fetching artifact:', error);
    res.status(500).json({
      error: 'Failed to fetch artifact',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * PUT /api/artifacts/:artifactId/data
 * Update artifact live data
 *
 * Body: Record<string, unknown>
 * Returns: StoredArtifact | 404
 */
router.put('/:artifactId/data', (req: Request, res: Response) => {
  try {
    const artifactIdParam = req.params.artifactId;
    if (!artifactIdParam) {
      res.status(400).json({ error: 'Missing artifactId parameter' });
      return;
    }

    const artifactId = toArtifactId(artifactIdParam);
    const data = req.body as Record<string, unknown>;

    const updated = artifactStorage.updateData(artifactId, data);

    if (!updated) {
      res.status(404).json({ error: 'Artifact not found' });
      return;
    }

    res.json(updated);
  } catch (error) {
    console.error('Error updating artifact data:', error);
    res.status(500).json({
      error: 'Failed to update artifact data',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/artifacts/stats
 * Get artifact statistics
 *
 * Returns: { total, active, archived, byType }
 */
router.get('/stats', (req: Request, res: Response) => {
  try {
    const stats = artifactStorage.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching artifact stats:', error);
    res.status(500).json({
      error: 'Failed to fetch stats',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/artifacts/session/:sessionId
 * List artifacts for session
 *
 * Returns: StoredArtifact[]
 */
router.get('/session/:sessionId', (req: Request, res: Response) => {
  try {
    const sessionId = req.params.sessionId;
    if (!sessionId) {
      res.status(400).json({ error: 'Missing sessionId parameter' });
      return;
    }

    const artifacts = artifactStorage.listBySession(sessionId);
    res.json(artifacts);
  } catch (error) {
    console.error('Error listing session artifacts:', error);
    res.status(500).json({
      error: 'Failed to list artifacts',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * DELETE /api/artifacts/:artifactId
 * Archive artifact
 *
 * Returns: { success: true }
 */
router.delete('/:artifactId', (req: Request, res: Response) => {
  try {
    const artifactIdParam = req.params.artifactId;
    if (!artifactIdParam) {
      res.status(400).json({ error: 'Missing artifactId parameter' });
      return;
    }

    const artifactId = toArtifactId(artifactIdParam);
    artifactStorage.archive(artifactId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error archiving artifact:', error);
    res.status(500).json({
      error: 'Failed to archive artifact',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
