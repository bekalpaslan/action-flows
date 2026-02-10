/**
 * Smoke Tests for ActionFlows Dashboard
 *
 * Critical happy paths that must always pass.
 * These tests verify basic functionality and system health.
 *
 * Tags: @smoke
 */

import { test, expect } from '@playwright/test';
import { SELECTORS, API } from '../helpers/selectors';

test.describe('Smoke Tests', { tag: '@smoke' }, () => {
  test('dashboard loads @ui', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator(SELECTORS.workbenchLayout)).toBeVisible({
      timeout: 10000,
    });
  });

  test('session sidebar visible @ui', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator(SELECTORS.sessionSidebar)).toBeVisible({
      timeout: 10000,
    });
  });

  test('no critical console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Filter out known non-critical errors
    const critical = errors.filter((e) => {
      if (e.includes('DevTools')) return false;
      if (e.includes('WebSocket')) return false;
      return true;
    });

    expect(critical).toHaveLength(0);
  });

  test('backend health @api', async ({ request }) => {
    const response = await request.get(API.health);
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);
  });
});
