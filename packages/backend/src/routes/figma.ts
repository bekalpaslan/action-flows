/**
 * Figma API Routes
 * CRUD endpoints for managing Figma design links
 */

import { Router, type Request, type Response } from 'express';
import type { FigmaLink } from '@afw/shared';
import { v4 as uuidv4 } from 'uuid';
import { currentTimestamp } from '@afw/shared';

const router = Router();

/**
 * In-memory storage for Figma links (production would use Redis/database)
 */
const figmaLinks = new Map<string, FigmaLink>();

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
 * Extract file key and node ID from Figma URL
 * Example: https://www.figma.com/file/ABC123/Design?node-id=1-2
 */
function parseFigmaUrl(url: string): { fileKey: string; nodeId?: string } {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');

    // URL format: /file/{fileKey}/{title}
    const fileKey = pathParts[2];
    if (!fileKey) {
      throw new Error('Invalid Figma URL: missing file key');
    }

    // Extract node-id from query params
    const nodeId = urlObj.searchParams.get('node-id') || undefined;

    return { fileKey, nodeId };
  } catch (error) {
    throw new Error('Invalid Figma URL format');
  }
}

/**
 * GET /api/figma/links
 * List all stored Figma links (optionally filtered by chain/session)
 */
router.get('/links', async (req: Request, res: Response) => {
  const { chainId, sessionId } = req.query;

  try {
    let links = Array.from(figmaLinks.values());

    // Filter by chainId if provided
    if (chainId && typeof chainId === 'string') {
      links = links.filter((link) => link.chainId === chainId);
    }

    // Filter by sessionId if provided
    if (sessionId && typeof sessionId === 'string') {
      links = links.filter((link) => link.sessionId === sessionId);
    }

    // Sort by createdAt desc (newest first)
    links.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    res.json({
      count: links.length,
      links,
    });
  } catch (error) {
    console.error('[Figma] Error listing links:', error);
    res.status(500).json({
      error: sanitizeError(error),
    });
  }
});

/**
 * GET /api/figma/links/:id
 * Get a specific Figma link by ID
 */
router.get('/links/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: 'Missing link ID' });
  }

  try {
    const link = figmaLinks.get(id);

    if (!link) {
      return res.status(404).json({
        error: 'Figma link not found',
      });
    }

    res.json({
      link,
    });
  } catch (error) {
    console.error('[Figma] Error getting link:', error);
    res.status(500).json({
      error: sanitizeError(error),
    });
  }
});

/**
 * POST /api/figma/links
 * Store a new Figma design link
 */
router.post('/links', async (req: Request, res: Response) => {
  const { url, title, chainId, sessionId } = req.body;

  // Validate required fields
  if (!url || typeof url !== 'string') {
    return res.status(400).json({
      error: 'Missing or invalid required field: url',
    });
  }

  if (!title || typeof title !== 'string') {
    return res.status(400).json({
      error: 'Missing or invalid required field: title',
    });
  }

  try {
    // Parse Figma URL to extract fileKey and nodeId
    const { fileKey, nodeId } = parseFigmaUrl(url);

    // Create new link
    const link: FigmaLink = {
      id: uuidv4(),
      fileKey,
      nodeId,
      url,
      title,
      chainId,
      sessionId,
      createdAt: currentTimestamp(),
    };

    // Store link
    figmaLinks.set(link.id, link);

    res.status(201).json({
      success: true,
      link,
    });
  } catch (error) {
    console.error('[Figma] Error creating link:', error);
    res.status(400).json({
      error: sanitizeError(error),
    });
  }
});

/**
 * DELETE /api/figma/links/:id
 * Remove a Figma link
 */
router.delete('/links/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: 'Missing link ID' });
  }

  try {
    const deleted = figmaLinks.delete(id);

    if (!deleted) {
      return res.status(404).json({
        error: 'Figma link not found',
      });
    }

    res.json({
      success: true,
      deleted: true,
    });
  } catch (error) {
    console.error('[Figma] Error deleting link:', error);
    res.status(500).json({
      error: sanitizeError(error),
    });
  }
});

export default router;
