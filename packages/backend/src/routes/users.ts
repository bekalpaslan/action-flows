/**
 * Users API Routes
 * Provides user listing and per-user session queries
 */

import { Router } from 'express';
import type { Session, SessionId } from '@afw/shared';
import { storage } from '../storage/index.js';

const router = Router();

/**
 * GET /api/users
 * Get list of active users with session counts
 */
router.get('/', (req, res) => {
  try {
    const users = storage.getUsersWithActiveSessions?.() || [];

    const userStats = users.map((userId: string) => {
      const sessionIds = storage.getSessionsByUser?.(userId as any) || [];
      const sessions = (sessionIds
        .map((id: string) => storage.getSession(id as SessionId)) as any[])
        .filter((s: any): s is Session => s !== undefined && typeof s === 'object' && 'id' in s);

      return {
        id: userId,
        user: userId,
        sessionCount: sessions.length,
        isOnline: sessions.some((s: Session) => s.status === 'in_progress' || s.status === 'pending'),
        sessions: sessions.map((s: Session) => ({
          id: s.id,
          status: s.status,
          startedAt: s.startedAt,
          endedAt: s.endedAt,
        })),
      };
    });

    res.json({
      count: users.length,
      users: userStats,
    });
  } catch (error) {
    console.error('[API] Error fetching users:', error);
    res.status(500).json({
      error: 'Failed to fetch users',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/users/:userId/sessions
 * Get all sessions for a specific user
 */
router.get('/:userId/sessions', (req, res) => {
  try {
    const { userId } = req.params;
    const sessionIds = storage.getSessionsByUser?.(userId as any) || [];
    const sessions = (sessionIds
      .map((id: string) => storage.getSession(id as SessionId)) as any[])
      .filter((s: any): s is Session => s !== undefined && typeof s === 'object' && 'id' in s);

    res.json({
      user: userId,
      sessionCount: sessions.length,
      sessions,
    });
  } catch (error) {
    console.error('[API] Error fetching user sessions:', error);
    res.status(500).json({
      error: 'Failed to fetch user sessions',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
