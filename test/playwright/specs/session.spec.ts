/**
 * Session Management Tests
 *
 * Tests for session CRUD operations:
 * - Creating sessions
 * - Listing sessions
 * - Viewing session details
 *
 * Tags: @session
 */

import { test, expect } from '@playwright/test';
import { SELECTORS, API, TIMEOUTS } from '../helpers/selectors';
import { createSession } from '../helpers/session-actions';

test.describe('Session Management', { tag: '@session' }, () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('create new session @crud', async ({ page }) => {
    const sessionId = await createSession(page);
    expect(sessionId).toBeTruthy();

    // Verify session was created via API response
    const response = await page.request.get(`${API.sessionById(sessionId)}`);
    expect(response.ok()).toBeTruthy();
  });

  test('list sessions via API @api', async ({ request }) => {
    const response = await request.get(API.sessions);
    expect(response.ok()).toBeTruthy();

    const sessions = await response.json();
    expect(Array.isArray(sessions)).toBeTruthy();
  });

  test('new session button available', async ({ page }) => {
    await expect(page.locator(SELECTORS.sidebarNewSessionBtn)).toBeVisible();
  });
});
