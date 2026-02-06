import express, { Router, Request, Response, NextFunction } from 'express';
import type { SessionId } from '@afw/shared';
import { storage } from '../storage';
import * as fs from 'fs/promises';
import * as path from 'path';

const router = Router();

/**
 * Path Security Validation Middleware
 * Validates all file paths are within session cwd
 * Blocks directory traversal attacks
 */
async function validatePath(req: Request, res: Response, next: NextFunction) {
  try {
    const { sessionId } = req.params;
    const { path: filePath } = req.query;

    if (!sessionId) {
      return res.status(400).json({
        error: 'Missing sessionId parameter',
      });
    }

    // Get session to validate cwd
    const session = await Promise.resolve(storage.getSession(sessionId as SessionId));

    if (!session) {
      return res.status(404).json({
        error: 'Session not found',
        sessionId,
      });
    }

    if (!filePath || typeof filePath !== 'string') {
      return res.status(400).json({
        error: 'Missing or invalid file path',
      });
    }

    // Resolve the absolute path
    const absolutePath = path.resolve(session.cwd, filePath);

    // Verify the path is within the session's working directory
    if (!absolutePath.startsWith(path.resolve(session.cwd))) {
      console.warn(`[Security] Path traversal attempt blocked:`, {
        sessionId,
        cwd: session.cwd,
        requestedPath: filePath,
        resolvedPath: absolutePath,
      });

      return res.status(403).json({
        error: 'Access denied: path outside session working directory',
        requestedPath: filePath,
      });
    }

    // Attach validated path to request for use in route handlers
    (req as any).validatedPath = absolutePath;
    (req as any).session = session;

    next();
  } catch (error) {
    console.error('[Files] Error validating path:', error);
    res.status(500).json({
      error: 'Failed to validate path',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Directory Entry Type
 */
interface DirectoryEntry {
  name: string;
  type: 'file' | 'directory';
  path: string;
  size?: number;
  modified?: string;
  children?: DirectoryEntry[];
}

/**
 * Build directory tree recursively
 */
async function buildTree(
  dirPath: string,
  rootPath: string,
  depth: number = 3,
  currentDepth: number = 0
): Promise<DirectoryEntry[]> {
  if (currentDepth >= depth) {
    return [];
  }

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const tree: DirectoryEntry[] = [];

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      const relativePath = path.relative(rootPath, fullPath);

      // Skip hidden files/directories by default (can be toggled in UI)
      if (entry.name.startsWith('.')) {
        continue;
      }

      // Skip node_modules and other common ignore patterns
      if (entry.name === 'node_modules' || entry.name === '__pycache__' || entry.name === 'dist' || entry.name === 'build') {
        continue;
      }

      if (entry.isDirectory()) {
        const children = await buildTree(fullPath, rootPath, depth, currentDepth + 1);
        tree.push({
          name: entry.name,
          type: 'directory',
          path: relativePath,
          children,
        });
      } else if (entry.isFile()) {
        const stats = await fs.stat(fullPath);
        tree.push({
          name: entry.name,
          type: 'file',
          path: relativePath,
          size: stats.size,
          modified: stats.mtime.toISOString(),
        });
      }
    }

    // Sort: directories first, then files, both alphabetically
    tree.sort((a, b) => {
      if (a.type === 'directory' && b.type === 'file') return -1;
      if (a.type === 'file' && b.type === 'directory') return 1;
      return a.name.localeCompare(b.name);
    });

    return tree;
  } catch (error) {
    console.error(`[Files] Error reading directory ${dirPath}:`, error);
    return [];
  }
}

/**
 * GET /api/files/:sessionId/tree
 * Get directory structure for a session's working directory
 */
router.get('/:sessionId/tree', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const depth = parseInt(req.query.depth as string) || 3;
    const showHidden = req.query.showHidden === 'true';

    // Get session
    const session = await Promise.resolve(storage.getSession(sessionId as SessionId));

    if (!session) {
      return res.status(404).json({
        error: 'Session not found',
        sessionId,
      });
    }

    // Build tree
    const tree = await buildTree(session.cwd, session.cwd, depth);

    res.json({
      sessionId,
      cwd: session.cwd,
      depth,
      showHidden,
      tree,
    });
  } catch (error) {
    console.error('[Files] Error building file tree:', error);
    res.status(500).json({
      error: 'Failed to build file tree',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/files/:sessionId/read
 * Read file contents
 */
router.get('/:sessionId/read', validatePath, async (req, res) => {
  try {
    const absolutePath = (req as any).validatedPath;
    const session = (req as any).session;

    // Check if file exists
    try {
      const stats = await fs.stat(absolutePath);

      if (!stats.isFile()) {
        return res.status(400).json({
          error: 'Path is not a file',
          path: req.query.path,
        });
      }

      // Check file size (limit to 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (stats.size > maxSize) {
        return res.status(413).json({
          error: 'File too large',
          path: req.query.path,
          size: stats.size,
          maxSize,
        });
      }

      // Read file content
      const content = await fs.readFile(absolutePath, 'utf-8');

      res.json({
        sessionId: req.params.sessionId,
        path: req.query.path,
        content,
        encoding: 'utf-8',
        size: stats.size,
        modified: stats.mtime.toISOString(),
      });
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return res.status(404).json({
          error: 'File not found',
          path: req.query.path,
        });
      }
      throw error;
    }
  } catch (error) {
    console.error('[Files] Error reading file:', error);
    res.status(500).json({
      error: 'Failed to read file',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
