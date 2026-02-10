import { test, expect } from '@playwright/test';

/**
 * Example Playwright E2E Test
 *
 * This is a basic smoke test to verify the ActionFlows Dashboard loads correctly.
 * It checks that the main UI elements are present and the application renders.
 */

test.describe('ActionFlows Dashboard - Smoke Test', () => {
  test('should load the dashboard homepage', async ({ page }) => {
    // Navigate to the frontend URL
    await page.goto('/');

    // Wait for the page to load
    await page.waitForLoadState('domcontentloaded');

    // Check that the page title or a key element is present
    // Adjust this selector based on your actual UI structure
    const workbench = page.locator('.workbench-layout');
    await expect(workbench).toBeVisible({ timeout: 10000 });
  });

  test('should have the session sidebar', async ({ page }) => {
    await page.goto('/');

    // Session sidebar is always rendered on the left
    const sidebar = page.locator('.session-sidebar');
    await expect(sidebar).toBeVisible({ timeout: 10000 });
  });

  test('should load without console errors', async ({ page }) => {
    const consoleErrors: string[] = [];

    // Listen for console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check that no critical errors were logged
    // Filter out expected/known errors if necessary
    const criticalErrors = consoleErrors.filter((error) => {
      // Filter known non-critical errors
      if (error.includes('DevTools')) return false;
      if (error.includes('WebSocket')) return false; // WS errors expected when no session active
      return true;
    });

    expect(criticalErrors).toHaveLength(0);
  });

  test('backend health check responds', async ({ request }) => {
    // Direct API call to backend health endpoint
    const response = await request.get('http://localhost:3001/health');
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty('status');
  });
});
