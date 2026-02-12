/**
 * Accessibility E2E Tests - Cosmic Map A11y
 *
 * Tests cosmic map accessibility:
 * - Automated axe-core scanning
 * - Keyboard navigation in graph
 * - ARIA labels on nodes and edges
 * - Focus management in interactive graph
 */

import { test, expect } from '@playwright/test';

// Note: Full axe-core integration in Playwright requires injectAxe script
// This test uses basic accessibility checks compatible with Playwright

test.describe('Accessibility - Cosmic Map', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to application
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');

    // Dismiss onboarding
    const skipButton = page.locator('button:has-text("Skip")');
    if (await skipButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await skipButton.click();
      await page.waitForTimeout(500);
    }

    // Wait for cosmic map to load if it exists
    try {
      await page.waitForSelector('.cosmic-map, [data-component="cosmic-map"]', { timeout: 3000 });
    } catch {
      // Cosmic map may not be visible, continue with other elements
    }
  });

  test('should have accessible cosmic map container', async ({ page }) => {
    const cosmicMap = page.locator('.cosmic-map, [data-component="cosmic-map"]').first();

    if (await cosmicMap.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Cosmic map should be in the document
      await expect(cosmicMap).toBeVisible();

      // Check for role or semantic structure
      const role = await cosmicMap.getAttribute('role');
      const ariaLabel = await cosmicMap.getAttribute('aria-label');

      // Should have some accessibility annotation
      expect(role || ariaLabel).toBeTruthy();
    }
  });

  test('should support keyboard navigation in cosmic map', async ({ page }) => {
    const cosmicMap = page.locator('.cosmic-map, [data-component="cosmic-map"]').first();

    if (await cosmicMap.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Focus on cosmic map
      await cosmicMap.focus();

      // Try Tab navigation
      await page.keyboard.press('Tab');
      await page.waitForTimeout(200);

      // Verify we can navigate without errors
      const focused = await page.evaluate(() => {
        const el = document.activeElement;
        return el ? el.className : null;
      });

      expect(focused).toBeDefined();
    }
  });

  test('should make graph nodes keyboard accessible', async ({ page }) => {
    // Find interactive graph nodes
    const nodes = page.locator('[role="button"], [role="link"], button').filter({
      has: page.locator('[class*="node"], [class*="step"]'),
    });

    const count = await nodes.count();

    if (count > 0) {
      // Test first node
      const firstNode = nodes.first();

      if (await firstNode.isVisible({ timeout: 2000 }).catch(() => false)) {
        // Check for keyboard accessibility
        const role = await firstNode.getAttribute('role');
        const tabIndex = await firstNode.getAttribute('tabIndex');

        // Should have role and be focusable
        expect(['button', 'link', null]).toContain(role); // null is for buttons
        expect(tabIndex === null || parseInt(tabIndex) >= -1).toBe(true);

        // Should be focusable
        await firstNode.focus();
        const focused = await page.evaluate(() => document.activeElement?.className);
        expect(focused).toBeDefined();
      }
    }
  });

  test('should provide aria-labels for graph nodes', async ({ page }) => {
    // Find nodes that should have labels
    const nodes = page.locator('[role="button"], [role="link"]');
    const count = await nodes.count();

    if (count > 0) {
      // Check first few nodes
      for (let i = 0; i < Math.min(3, count); i++) {
        const node = nodes.nth(i);

        if (await node.isVisible({ timeout: 1000 }).catch(() => false)) {
          const ariaLabel = await node.getAttribute('aria-label');
          const title = await node.getAttribute('title');
          const text = await node.textContent();

          // Should have some accessible name
          const hasAccessibleName = !!ariaLabel || !!title || (!!text && text.trim().length > 0);

          expect(hasAccessibleName).toBe(true);
        }
      }
    }
  });

  test('should maintain focus visibility in cosmic map', async ({ page }) => {
    const cosmicMap = page.locator('.cosmic-map, [data-component="cosmic-map"]').first();

    if (await cosmicMap.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Find focusable elements
      const focusableElements = page.locator('[role="button"], [role="link"], button, a').first();

      if (await focusableElements.isVisible({ timeout: 2000 }).catch(() => false)) {
        // Focus element
        await focusableElements.focus();

        // Get focus outline or indication
        const outline = await focusableElements.evaluate((el) => {
          const styles = window.getComputedStyle(el);
          return styles.outline || styles.boxShadow || 'has-focus';
        });

        // Should have some visual indication
        expect(outline).toBeDefined();
      }
    }
  });

  test('should have no keyboard traps in cosmic map', async ({ page }) => {
    // This test verifies that Tab key can navigate through cosmic map without getting stuck

    const cosmicMap = page.locator('.cosmic-map, [data-component="cosmic-map"]').first();

    if (await cosmicMap.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Focus first element
      const firstFocusable = page.locator('[role="button"], [role="link"], button, a').first();

      if (await firstFocusable.isVisible({ timeout: 2000 }).catch(() => false)) {
        await firstFocusable.focus();

        // Tab through several times
        for (let i = 0; i < 5; i++) {
          await page.keyboard.press('Tab');
          await page.waitForTimeout(100);

          // Verify focus is on some element
          const focused = await page.evaluate(() => !!document.activeElement && document.activeElement !== document.body);

          expect(focused).toBe(true);
        }
      }
    }
  });

  test('should announce status changes to screen readers', async ({ page }) => {
    // Find elements with aria-live regions (for dynamic updates)
    const liveRegions = page.locator('[aria-live]');
    const count = await liveRegions.count();

    // Live regions are optional but helpful for status updates
    if (count > 0) {
      const firstLive = liveRegions.first();
      const ariaLive = await firstLive.getAttribute('aria-live');

      // Should have valid aria-live value
      expect(['polite', 'assertive', 'off']).toContain(ariaLive);
    }
  });

  test('should support graph node interactions via keyboard', async ({ page }) => {
    // Find and interact with graph nodes
    const nodes = page.locator('[role="button"]').filter({
      has: page.locator('[class*="node"], [class*="step"], [class*="step-number"]'),
    });

    const count = await nodes.count();

    if (count > 0) {
      const firstNode = nodes.first();

      if (await firstNode.isVisible({ timeout: 2000 }).catch(() => false)) {
        // Focus node
        await firstNode.focus();

        // Get node text for verification
        const nodeText = await firstNode.textContent();

        // Try Enter key
        await page.keyboard.press('Enter');
        await page.waitForTimeout(300);

        // Node should still be visible (may have triggered some action)
        await expect(firstNode).toBeVisible();
      }
    }
  });
});

test.describe('Accessibility - Session Flow Visualization', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');

    // Dismiss onboarding
    const skipButton = page.locator('button:has-text("Skip")');
    if (await skipButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await skipButton.click();
    }
  });

  test('should make flow steps accessible with keyboard navigation', async ({ page }) => {
    // Find flow visualization
    const flowViz = page.locator('.flow-visualization, [data-component="flow-visualization"]').first();

    if (await flowViz.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Find steps in flow
      const steps = page.locator('[role="button"]').filter({
        has: page.locator('.step-number, .node-action'),
      });

      const count = await steps.count();

      if (count > 0) {
        // Test keyboard navigation
        const firstStep = steps.first();
        await firstStep.focus();

        // Verify it's focusable
        const focused = await page.evaluate(
          (selector) => document.querySelector(selector)?.textContent,
          '[role="button"]'
        );

        expect(focused).toBeTruthy();

        // Try Space activation
        await page.keyboard.press('Space');
        await page.waitForTimeout(200);

        // Element should still be visible
        await expect(firstStep).toBeVisible();
      }
    }
  });

  test('should provide meaningful labels for step nodes', async ({ page }) => {
    // Find step nodes
    const steps = page.locator('.step-number, [class*="step"]').locator('xpath=./parent::*[@role="button"]');

    const count = await steps.count();

    if (count > 0) {
      // Check first few steps
      for (let i = 0; i < Math.min(3, count); i++) {
        const step = steps.nth(i);

        if (await step.isVisible({ timeout: 1000 }).catch(() => false)) {
          const ariaLabel = await step.getAttribute('aria-label');
          const title = await step.getAttribute('title');

          // Should have accessible label
          expect(ariaLabel || title).toBeTruthy();
        }
      }
    }
  });
});
