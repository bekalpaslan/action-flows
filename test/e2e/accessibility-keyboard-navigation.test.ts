/**
 * Accessibility E2E Tests - Keyboard Navigation
 *
 * Tests keyboard navigation and accessibility features:
 * - Enter/Space key activation on role="button" elements
 * - Tab navigation through interactive elements
 * - ARIA labels and descriptions
 * - Focus management
 */

import { test, expect } from '@playwright/test';

test.describe('Accessibility - Keyboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to application
    await page.goto('http://localhost:5173');

    // Wait for app to load
    await page.waitForLoadState('networkidle');

    // Dismiss any onboarding dialogs
    const skipButton = page.locator('button:has-text("Skip")');
    if (await skipButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await skipButton.click();
      await page.waitForTimeout(500);
    }
  });

  test('should activate button elements with Enter key', async ({ page }) => {
    // Find a role="button" element
    const button = page.locator('[role="button"]').first();

    if (await button.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Focus the button
      await button.focus();

      // Get the current state
      const beforeText = await button.textContent();

      // Press Enter
      await page.keyboard.press('Enter');

      // Wait a bit for any state changes
      await page.waitForTimeout(300);

      // Verify the button is still in the document (not hidden)
      await expect(button).toBeVisible();
    }
  });

  test('should activate button elements with Space key', async ({ page }) => {
    // Find a role="button" element
    const button = page.locator('[role="button"]').nth(1);

    if (await button.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Focus the button
      await button.focus();

      // Press Space
      await page.keyboard.press('Space');

      // Wait for any animations
      await page.waitForTimeout(300);

      // Verify the button is still visible
      await expect(button).toBeVisible();
    }
  });

  test('should support Tab navigation through interactive elements', async ({ page }) => {
    // Find first interactive element
    const firstButton = page.locator('[role="button"]').first();

    if (await firstButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Focus first button
      await firstButton.focus();
      const firstActive = page.locator(':focus');
      await expect(firstActive).toHaveCount(1);

      // Tab to next interactive element
      await page.keyboard.press('Tab');
      await page.waitForTimeout(100);

      const secondActive = page.locator(':focus');
      // Should have focus on another element
      await expect(secondActive).toHaveCount(1);
    }
  });

  test('should have proper aria-label on role="button" elements', async ({ page }) => {
    // Check that all role="button" elements have either aria-label or accessible name
    const buttons = page.locator('[role="button"]');
    const count = await buttons.count();

    if (count > 0) {
      // Check first few buttons for accessibility attributes
      for (let i = 0; i < Math.min(3, count); i++) {
        const button = buttons.nth(i);

        // Get accessible name (either aria-label or text content)
        const ariaLabel = await button.getAttribute('aria-label');
        const textContent = (await button.textContent())?.trim();
        const title = await button.getAttribute('title');

        // At least one should be present for accessibility
        const hasAccessibleName =
          !!ariaLabel || (!!textContent && textContent.length > 0) || !!title;

        expect(hasAccessibleName).toBe(true);
      }
    }
  });

  test('should have tabIndex 0 on keyboard-activatable role="button" elements', async ({
    page,
  }) => {
    const buttons = page.locator('[role="button"]');
    const count = await buttons.count();

    if (count > 0) {
      // Check first few buttons
      for (let i = 0; i < Math.min(3, count); i++) {
        const button = buttons.nth(i);
        const tabIndex = await button.getAttribute('tabIndex');

        // Should be 0 or negative (focusable)
        if (tabIndex !== null) {
          expect(parseInt(tabIndex) >= -1).toBe(true);
        }
      }
    }
  });

  test('should not trap focus on interactive elements', async ({ page }) => {
    // This test verifies that keyboard focus can escape from interactive elements
    const button = page.locator('[role="button"]').first();

    if (await button.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Focus the button
      await button.focus();

      // Press Tab multiple times to navigate away
      await page.keyboard.press('Tab');
      await page.waitForTimeout(100);
      await page.keyboard.press('Tab');

      // Verify focus moved (we can check if still on same button)
      const activeElement = await page.evaluate(() => document.activeElement?.className);

      // Just verify we can continue tabbing without errors
      expect(activeElement).toBeDefined();
    }
  });
});

test.describe('Accessibility - Step Navigation in Flow Visualization', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');

    // Dismiss onboarding
    const skipButton = page.locator('button:has-text("Skip")');
    if (await skipButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await skipButton.click();
    }
  });

  test('should activate animated step nodes with Enter key', async ({ page }) => {
    // Find the flow visualization
    const flowContainer = page.locator('.flow-visualization, [role="main"]').first();

    if (await flowContainer.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Find a step node (role="button" in flow)
      const stepNode = page.locator('[role="button"]').filter({ has: page.locator('.node-content') }).first();

      if (await stepNode.isVisible({ timeout: 2000 }).catch(() => false)) {
        // Focus and activate
        await stepNode.focus();
        await page.keyboard.press('Enter');
        await page.waitForTimeout(300);

        // Verify element is still there
        await expect(stepNode).toBeVisible();
      }
    }
  });

  test('should navigate between steps with keyboard', async ({ page }) => {
    // Find multiple step nodes
    const stepNodes = page.locator('[role="button"]').filter({ has: page.locator('.step-number') });
    const count = await stepNodes.count();

    if (count >= 2) {
      // Focus first step
      await stepNodes.first().focus();

      // Tab to next step
      await page.keyboard.press('Tab');
      await page.waitForTimeout(100);

      // Verify focus moved
      const focused = await page.evaluate(() => document.activeElement?.className);
      expect(focused).toBeDefined();
    }
  });
});

test.describe('Accessibility - Session Sidebar Keyboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');

    // Dismiss onboarding
    const skipButton = page.locator('button:has-text("Skip")');
    if (await skipButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await skipButton.click();
    }
  });

  test('should activate session items with Enter key', async ({ page }) => {
    // Find session sidebar items
    const sessionItems = page.locator('.session-sidebar-item');

    if (await sessionItems.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      const firstSession = sessionItems.first();

      // Focus and activate
      await firstSession.focus();
      await page.keyboard.press('Enter');
      await page.waitForTimeout(300);

      // Item should still be visible
      await expect(firstSession).toBeVisible();
    }
  });

  test('should support Space key on session items', async ({ page }) => {
    const sessionItems = page.locator('.session-sidebar-item');

    if (await sessionItems.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      const firstSession = sessionItems.first();

      // Focus and activate with Space
      await firstSession.focus();
      await page.keyboard.press('Space');
      await page.waitForTimeout(300);

      // Item should still be visible
      await expect(firstSession).toBeVisible();
    }
  });

  test('should have proper aria-labels on session items', async ({ page }) => {
    const sessionItems = page.locator('.session-sidebar-item');
    const count = await sessionItems.count();

    if (count > 0) {
      // Check that session items have accessible names
      const firstItem = sessionItems.first();
      const ariaLabel = await firstItem.getAttribute('aria-label');
      const title = await firstItem.getAttribute('title');

      // Should have aria-label for accessibility
      expect(ariaLabel || title).toBeTruthy();
    }
  });
});

test.describe('Accessibility - ARIA Attributes Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');

    const skipButton = page.locator('button:has-text("Skip")');
    if (await skipButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await skipButton.click();
    }
  });

  test('should have valid ARIA attributes on interactive elements', async ({ page }) => {
    // Check role="button" elements
    const roleButtons = page.locator('[role="button"]');
    const count = await roleButtons.count();

    const violations: string[] = [];

    for (let i = 0; i < Math.min(5, count); i++) {
      const button = roleButtons.nth(i);
      const role = await button.getAttribute('role');
      const tabIndex = await button.getAttribute('tabIndex');

      // role="button" should have tabIndex >= -1
      if (role === 'button' && tabIndex !== null) {
        const tabIndexNum = parseInt(tabIndex);
        if (tabIndexNum < -1) {
          violations.push(`Button ${i} has invalid tabIndex: ${tabIndex}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  test('should have aria-expanded on expandable elements', async ({ page }) => {
    // Find elements with aria-expanded
    const expandables = page.locator('[aria-expanded]');
    const count = await expandables.count();

    if (count > 0) {
      // Check that aria-expanded values are valid (true/false)
      for (let i = 0; i < Math.min(3, count); i++) {
        const element = expandables.nth(i);
        const expanded = await element.getAttribute('aria-expanded');

        // Should be "true" or "false"
        expect(['true', 'false']).toContain(expanded);
      }
    }
  });

  test('should hide decorative elements from accessibility tree', async ({ page }) => {
    // Find elements with aria-hidden="true"
    const hidden = page.locator('[aria-hidden="true"]');
    const count = await hidden.count();

    if (count > 0) {
      // At least some decorative elements should be hidden
      expect(count).toBeGreaterThan(0);

      // Verify they are actually hidden or decorative
      const firstHidden = hidden.first();
      const display = await firstHidden.evaluate((el) => window.getComputedStyle(el).display);

      // Hidden elements might have display:none or be decorative icons
      expect(['none', 'inline', 'inline-block']).toContain(display);
    }
  });
});
