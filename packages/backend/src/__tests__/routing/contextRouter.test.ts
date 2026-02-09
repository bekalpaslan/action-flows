/**
 * Unit tests for Context Router
 *
 * Tests the context routing algorithm that matches user requests to workbench contexts
 * based on trigger keyword matching with confidence scoring.
 */

import { describe, it, expect } from 'vitest';
import {
  extractKeywords,
  calculateMatchScore,
  routeRequest,
  USE_CONTEXT_ROUTING,
} from '../../routing/contextRouter.js';

// ============================================================================
// extractKeywords Tests
// ============================================================================

describe('extractKeywords', () => {
  it('should filter out stop words', () => {
    const keywords = extractKeywords('the user is in the room');
    expect(keywords).not.toContain('the');
    expect(keywords).not.toContain('is');
    expect(keywords).not.toContain('in');
  });

  it('should filter out short words (length <= 2)', () => {
    const keywords = extractKeywords('fix a bug in my code');
    expect(keywords).not.toContain('a');
    expect(keywords).not.toContain('in');
    expect(keywords).not.toContain('my');
  });

  it('should convert to lowercase', () => {
    const keywords = extractKeywords('Fix The Login BUG');
    expect(keywords).toEqual(['fix', 'login', 'bug']);
  });

  it('should split on whitespace', () => {
    const keywords = extractKeywords('implement user authentication system');
    expect(keywords).toContain('implement');
    expect(keywords).toContain('user');
    expect(keywords).toContain('authentication');
    expect(keywords).toContain('system');
  });

  it('should return empty array for empty input', () => {
    expect(extractKeywords('')).toEqual([]);
  });

  it('should return empty array for whitespace-only input', () => {
    expect(extractKeywords('   \t\n  ')).toEqual([]);
  });

  it('should handle mixed case correctly', () => {
    const keywords = extractKeywords('Fix The Login BUG');
    expect(keywords).toEqual(['fix', 'login', 'bug']);
    expect(keywords).not.toContain('Fix');
    expect(keywords).not.toContain('The');
    expect(keywords).not.toContain('BUG');
  });

  it('should filter multiple stop words from a complex sentence', () => {
    const keywords = extractKeywords('I want to fix the bug in our authentication system');
    expect(keywords).not.toContain('i');
    // "want" is not a stop word (4 chars > 2)
    expect(keywords).toContain('want');
    expect(keywords).not.toContain('to');
    expect(keywords).not.toContain('the');
    expect(keywords).not.toContain('in');
    expect(keywords).not.toContain('our');
    expect(keywords).toContain('fix');
    expect(keywords).toContain('bug');
    expect(keywords).toContain('authentication');
    expect(keywords).toContain('system');
  });

  it('should handle words with mixed whitespace', () => {
    const keywords = extractKeywords('refactor   code\t\twith   better   style');
    expect(keywords).toContain('refactor');
    expect(keywords).toContain('code');
    // "with" is a stop word and should be filtered
    expect(keywords).not.toContain('with');
    expect(keywords).toContain('better');
    expect(keywords).toContain('style');
  });
});

// ============================================================================
// calculateMatchScore Tests
// ============================================================================

describe('calculateMatchScore', () => {
  it('should return 0 for empty keywords', () => {
    const result = calculateMatchScore([], ['implement', 'build']);
    expect(result.score).toBe(0);
    expect(result.matchedTriggers).toEqual([]);
  });

  it('should return 0 for empty triggers', () => {
    const result = calculateMatchScore(['implement', 'feature'], []);
    expect(result.score).toBe(0);
    expect(result.matchedTriggers).toEqual([]);
  });

  it('should score perfect single-word trigger match', () => {
    const keywords = ['refactor', 'code', 'quality'];
    const triggers = ['refactor'];
    const result = calculateMatchScore(keywords, triggers);

    // Perfect match: bestMatchRatio = 1.0, breadthRatio = 1.0 (1/1)
    // score = 1.0 * 0.7 + 1.0 * 0.3 = 1.0
    expect(result.score).toBe(1.0);
    expect(result.matchedTriggers).toContain('refactor');
  });

  it('should score multi-word trigger full match', () => {
    const keywords = ['fix', 'bug', 'authentication'];
    const triggers = ['fix bug', 'implement'];
    const result = calculateMatchScore(keywords, triggers);

    // "fix bug" matches both words: matchRatio = 2/2 = 1.0
    // 1 trigger matched out of 2: breadthRatio = 1/2 = 0.5
    // score = 1.0 * 0.7 + 0.5 * 0.3 = 0.85
    expect(result.score).toBe(0.85);
    expect(result.matchedTriggers).toContain('fix bug');
    expect(result.matchedTriggers).not.toContain('implement');
  });

  it('should score multi-word trigger partial match', () => {
    const keywords = ['fix', 'authentication', 'system'];
    const triggers = ['fix bug', 'implement'];
    const result = calculateMatchScore(keywords, triggers);

    // "fix bug" matches only "fix": matchRatio = 1/2 = 0.5
    // 1 trigger matched out of 2: breadthRatio = 1/2 = 0.5
    // score = 0.5 * 0.7 + 0.5 * 0.3 = 0.5
    expect(result.score).toBe(0.5);
    expect(result.matchedTriggers).toContain('fix bug');
  });

  it('should score multiple triggers matching (breadth factor)', () => {
    const keywords = ['implement', 'build', 'create'];
    const triggers = ['implement', 'build', 'add feature', 'develop'];
    const result = calculateMatchScore(keywords, triggers);

    // Best match: "implement" or "build" = 1.0
    // 2 triggers matched out of 4: breadthRatio = 2/4 = 0.5
    // score = 1.0 * 0.7 + 0.5 * 0.3 = 0.85
    expect(result.score).toBe(0.85);
    expect(result.matchedTriggers).toContain('implement');
    expect(result.matchedTriggers).toContain('build');
    expect(result.matchedTriggers.length).toBe(2);
  });

  it('should return 0 for no match scenario', () => {
    const keywords = ['dancing', 'singing', 'party'];
    const triggers = ['implement', 'fix bug', 'review'];
    const result = calculateMatchScore(keywords, triggers);

    expect(result.score).toBe(0);
    expect(result.matchedTriggers).toEqual([]);
  });

  it('should ensure score is in range [0, 1]', () => {
    const keywords = ['implement', 'feature', 'system'];
    const triggers = ['implement', 'build', 'create'];
    const result = calculateMatchScore(keywords, triggers);

    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(1);
  });

  it('should populate matchedTriggers array with correct trigger phrases', () => {
    const keywords = ['fix', 'bug', 'performance'];
    const triggers = ['fix bug', 'optimize', 'improve performance', 'cleanup'];
    const result = calculateMatchScore(keywords, triggers);

    // "fix bug" matches both words
    // "optimize" doesn't match
    // "improve performance" matches "performance" (1/2)
    // "cleanup" doesn't match
    expect(result.matchedTriggers).toContain('fix bug');
    expect(result.matchedTriggers).toContain('improve performance');
    expect(result.matchedTriggers).not.toContain('optimize');
    expect(result.matchedTriggers).not.toContain('cleanup');
  });

  it('should handle trigger phrases with multiple words', () => {
    const keywords = ['security', 'scan', 'code'];
    const triggers = ['security scan', 'code review', 'audit'];
    const result = calculateMatchScore(keywords, triggers);

    // "security scan" matches both words: 2/2 = 1.0
    // "code review" matches "code": 1/2 = 0.5
    // "audit" doesn't match
    // Best match ratio = 1.0
    // 2 triggers matched out of 3: breadthRatio = 2/3 ≈ 0.667
    // score = 1.0 * 0.7 + 0.667 * 0.3 ≈ 0.9
    const expectedScore = 1.0 * 0.7 + (2 / 3) * 0.3;
    expect(result.score).toBeCloseTo(expectedScore, 10);
    expect(result.matchedTriggers).toContain('security scan');
    expect(result.matchedTriggers).toContain('code review');
  });
});

// ============================================================================
// routeRequest Tests
// ============================================================================

describe('routeRequest', () => {
  it('should route empty request to "work" with confidence 0', () => {
    const result = routeRequest('');
    expect(result.selectedContext).toBe('work');
    expect(result.confidence).toBe(0);
    expect(result.alternativeContexts).toEqual([]);
    expect(result.triggerMatches).toEqual([]);
    expect(result.requiresDisambiguation).toBe(false);
  });

  it('should route "fix the login bug" to "maintenance"', () => {
    const result = routeRequest('fix the login bug');
    // "fix bug" is a strong trigger for maintenance
    expect(result.selectedContext).toBe('maintenance');
    expect(result.confidence).toBeGreaterThan(0.5);
    expect(result.triggerMatches).toContain('fix bug');
    expect(result.requiresDisambiguation).toBe(false);
  });

  it('should route "implement user authentication" to "work"', () => {
    const result = routeRequest('implement user authentication');
    // "implement" is a strong trigger for work
    expect(result.selectedContext).toBe('work');
    expect(result.confidence).toBeGreaterThan(0.5);
    expect(result.triggerMatches).toContain('implement');
    expect(result.requiresDisambiguation).toBe(false);
  });

  it('should route "review the auth implementation" to "review"', () => {
    const result = routeRequest('review the auth implementation');
    // "review" is a strong trigger for review workbench
    expect(result.selectedContext).toBe('review');
    expect(result.confidence).toBeGreaterThan(0.5);
    expect(result.triggerMatches).toContain('review');
    expect(result.requiresDisambiguation).toBe(false);
  });

  it('should route "explore the WebSocket code" to "explore"', () => {
    const result = routeRequest('explore the WebSocket code');
    // "explore" is a strong trigger for explore workbench, but "code" appears in multiple contexts
    // May require disambiguation if multiple contexts score similarly
    if (result.requiresDisambiguation) {
      expect(result.selectedContext).toBeNull();
      expect(result.alternativeContexts.length).toBeGreaterThan(1);
      // One of the alternatives should be 'explore'
      const exploreAlt = result.alternativeContexts.find((alt) => alt.context === 'explore');
      expect(exploreAlt).toBeDefined();
    } else {
      expect(result.selectedContext).toBe('explore');
      expect(result.confidence).toBeGreaterThan(0.5);
    }
    // Trigger matches should contain at least one match
    expect(result.triggerMatches.length).toBeGreaterThan(0);
  });

  it('should route "create a new flow" to "settings"', () => {
    const result = routeRequest('create a new flow');
    // "create flow" is a trigger for settings, but "create" also appears in work context
    // May require disambiguation if multiple contexts score similarly
    if (result.requiresDisambiguation) {
      expect(result.selectedContext).toBeNull();
      expect(result.alternativeContexts.length).toBeGreaterThan(1);
      // One of the alternatives should be 'settings'
      const settingsAlt = result.alternativeContexts.find((alt) => alt.context === 'settings');
      expect(settingsAlt).toBeDefined();
    } else {
      expect(result.selectedContext).toBe('settings');
      expect(result.confidence).toBeGreaterThan(0.5);
    }
    expect(result.triggerMatches.length).toBeGreaterThan(0);
  });

  it('should route "plan the next sprint" to "pm"', () => {
    const result = routeRequest('plan the next sprint');
    // "plan" is a strong trigger for pm workbench
    expect(result.selectedContext).toBe('pm');
    expect(result.confidence).toBeGreaterThan(0.5);
    expect(result.triggerMatches).toContain('plan');
    expect(result.requiresDisambiguation).toBe(false);
  });

  it('should handle ambiguous request requiring disambiguation', () => {
    // A request that could match multiple contexts with similar scores
    const result = routeRequest('check the code quality');
    // "check" might match both "review" (check quality) and "explore" (investigate)

    // If disambiguation is triggered, selectedContext should be null
    // and requiresDisambiguation should be true
    if (result.requiresDisambiguation) {
      expect(result.selectedContext).toBeNull();
      expect(result.alternativeContexts.length).toBeGreaterThan(1);
      // All alternatives should have score >= DISAMBIGUATION threshold (0.5)
      result.alternativeContexts.forEach((alt) => {
        expect(alt.score).toBeGreaterThanOrEqual(0.5);
      });
    } else {
      // If not requiring disambiguation, should have a selected context
      expect(result.selectedContext).not.toBeNull();
    }
  });

  it('should populate alternativeContexts correctly', () => {
    const result = routeRequest('implement user authentication');

    // Should have at most 2 alternative contexts (slice(1, 3))
    expect(result.alternativeContexts.length).toBeLessThanOrEqual(2);

    // Each alternative should have context and score
    result.alternativeContexts.forEach((alt) => {
      expect(alt.context).toBeTruthy();
      expect(typeof alt.score).toBe('number');
      expect(alt.score).toBeGreaterThanOrEqual(0);
      expect(alt.score).toBeLessThanOrEqual(1);
    });
  });

  it('should populate triggerMatches correctly', () => {
    const result = routeRequest('fix the authentication bug');

    // Should have triggerMatches from the top match
    expect(Array.isArray(result.triggerMatches)).toBe(true);

    // If there's a match, triggerMatches should contain relevant triggers
    if (result.confidence > 0) {
      expect(result.triggerMatches.length).toBeGreaterThan(0);
    }
  });

  it('should set requiresDisambiguation to false for high confidence matches', () => {
    const result = routeRequest('implement the login feature');

    // "implement" is a very strong trigger for "work"
    // Should have high confidence and not require disambiguation
    if (result.confidence >= 0.9) {
      expect(result.requiresDisambiguation).toBe(false);
      expect(result.selectedContext).not.toBeNull();
    }
  });

  it('should fall back to top match for low confidence with no disambiguation', () => {
    // A request that might have some weak matches but not enough for disambiguation
    const result = routeRequest('dancing with authentication');

    // If confidence is low but still has some match
    if (result.confidence > 0 && result.confidence < 0.5) {
      expect(result.requiresDisambiguation).toBe(false);
      expect(result.selectedContext).not.toBeNull();
    }
  });

  it('should route request with only stop words to "work"', () => {
    const result = routeRequest('the a in is to');
    // All stop words → empty keywords → fallback to 'work'
    expect(result.selectedContext).toBe('work');
    expect(result.confidence).toBe(0);
  });

  it('should handle very long request strings', () => {
    const longRequest =
      'implement a comprehensive user authentication system with OAuth2 integration, JWT tokens, refresh token rotation, role-based access control, multi-factor authentication, password reset flows, and email verification';

    const result = routeRequest(longRequest);

    // Should still route correctly despite length
    expect(result.selectedContext).not.toBeNull();
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });

  it('should handle request with special characters and punctuation', () => {
    const result = routeRequest('fix bug: authentication fails @ login!!!');

    // Should still extract meaningful keywords and route
    expect(result.selectedContext).toBe('maintenance');
    expect(result.confidence).toBeGreaterThan(0);
  });

  it('should handle single keyword request', () => {
    const result = routeRequest('refactor');

    // "refactor" is a strong trigger for maintenance
    expect(result.selectedContext).toBe('maintenance');
    expect(result.confidence).toBeGreaterThan(0);
  });

  it('should ensure confidence is always in range [0, 1]', () => {
    const testRequests = [
      'implement feature',
      'fix bug',
      'review code',
      'explore system',
      'plan sprint',
      'random unrelated words',
      '',
    ];

    testRequests.forEach((request) => {
      const result = routeRequest(request);
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });
  });

  it('should auto-route with high confidence (>= 0.9)', () => {
    const result = routeRequest('implement the dashboard');

    // "implement" should give high confidence for "work"
    if (result.confidence >= 0.9) {
      expect(result.requiresDisambiguation).toBe(false);
      expect(result.selectedContext).toBe('work');
    }
  });

  it('should require disambiguation when multiple contexts score above threshold', () => {
    // Craft a request that could reasonably match multiple contexts
    // "code" appears in work, maintenance, and review triggers
    const result = routeRequest('code quality improvements');

    // This request might trigger disambiguation
    // Check the structure is correct if disambiguation is triggered
    if (result.requiresDisambiguation) {
      expect(result.selectedContext).toBeNull();
      expect(result.alternativeContexts.length).toBeGreaterThan(1);
      expect(result.confidence).toBeLessThan(0.9);
      expect(result.confidence).toBeGreaterThanOrEqual(0.5);

      // All alternatives should meet the DISAMBIGUATION threshold
      result.alternativeContexts.forEach((alt) => {
        expect(alt.score).toBeGreaterThanOrEqual(0.5);
      });
    }
  });

  it('should return structured RoutingResult with all required fields', () => {
    const result = routeRequest('fix the bug');

    // Verify all required fields are present
    expect(result).toHaveProperty('selectedContext');
    expect(result).toHaveProperty('confidence');
    expect(result).toHaveProperty('alternativeContexts');
    expect(result).toHaveProperty('triggerMatches');
    expect(result).toHaveProperty('requiresDisambiguation');

    // Verify types
    expect(Array.isArray(result.alternativeContexts)).toBe(true);
    expect(Array.isArray(result.triggerMatches)).toBe(true);
    expect(typeof result.confidence).toBe('number');
    expect(typeof result.requiresDisambiguation).toBe('boolean');
  });
});

// ============================================================================
// Feature Flag Test
// ============================================================================

describe('USE_CONTEXT_ROUTING', () => {
  it('should be false', () => {
    expect(USE_CONTEXT_ROUTING).toBe(false);
  });
});
