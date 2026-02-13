/**
 * User Personality Preferences Router
 *
 * Phase 2 — Agent Personalities completion (Thread 5)
 * Allows users to configure their personality preferences for agent interactions.
 */

import { Router } from 'express';
import type { AgentTone, AgentSpeed, AgentPersonality } from '@afw/shared';

const router = Router();

// In-memory store for now (will move to storage later)
const userPreferences: Map<string, UserPersonalityPreference> = new Map();

interface UserPersonalityPreference {
  userId: string;
  preferredTone?: AgentTone;
  preferredSpeed?: AgentSpeed;
  overrides?: Record<string, Partial<AgentPersonality>>; // Per-context overrides
  updatedAt: string;
}

/**
 * GET /api/preferences/personality — Get user's personality preferences
 *
 * Query params:
 * - userId: string (optional, defaults to 'default')
 *
 * Returns:
 * - UserPersonalityPreference with user's preferences or defaults
 */
router.get('/personality', (req, res) => {
  const userId = (req.query.userId as string) || 'default';
  const prefs = userPreferences.get(userId);

  res.json(prefs || {
    userId,
    preferredTone: null,
    preferredSpeed: null,
    overrides: {}
  });
});

/**
 * PUT /api/preferences/personality — Update personality preferences
 *
 * Body:
 * - userId: string (optional, defaults to 'default')
 * - preferredTone: AgentTone (optional)
 * - preferredSpeed: AgentSpeed (optional)
 * - overrides: Record<string, Partial<AgentPersonality>> (optional)
 *
 * Returns:
 * - Updated UserPersonalityPreference
 */
router.put('/personality', (req, res) => {
  const { userId = 'default', preferredTone, preferredSpeed, overrides } = req.body;

  const prefs: UserPersonalityPreference = {
    userId,
    preferredTone,
    preferredSpeed,
    overrides,
    updatedAt: new Date().toISOString(),
  };

  userPreferences.set(userId, prefs);
  res.json(prefs);
});

export default router;
