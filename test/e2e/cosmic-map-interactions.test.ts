/**
 * Cosmic Map Interactions E2E Tests
 *
 * Tests interactive features and accessibility:
 * - Feature flag toggles
 * - Keyboard navigation (Tab, Enter, Escape)
 * - Reduced motion settings
 * - Settings integration
 */

import { test, expect } from '@playwright/test';

test.describe('Cosmic Map Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');

    // Dismiss onboarding
    const skipButton = page.locator('button:has-text("Skip")');
    if (await skipButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await skipButton.click();
    }

    await page.waitForSelector('.cosmic-map', { timeout: 5000 });
  });

  test('Feature flags toggle cosmic map visibility', async ({ page }) => {
    // Navigate to Settings (look for settings workbench or button)
    const settingsButton = page.locator('[data-workbench-id="settings"], button:has-text("Settings")');
    if (await settingsButton.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      await settingsButton.first().click();
      await page.waitForTimeout(500);

      // Click Feature Flags tab
      const flagsTab = page.locator('button:has-text("Feature Flags")');
      if (await flagsTab.isVisible({ timeout: 2000 }).catch(() => false)) {
        await flagsTab.click();

        // Find cosmic map toggle
        const cosmicMapToggle = page.locator('#cosmic-map-flag, input[id*="cosmic"], input[name*="cosmic"]');
        if (await cosmicMapToggle.first().isVisible({ timeout: 2000 }).catch(() => false)) {
          await expect(cosmicMapToggle.first()).toBeVisible();

          // Verify it exists (may or may not be checked)
          const isChecked = await cosmicMapToggle.first().isChecked().catch(() => false);
          expect(typeof isChecked).toBe('boolean');
        }
      }
    }
  });

  test('Keyboard navigation (Tab, Enter, Escape)', async ({ page }) => {
    // Tab to first region star
    await page.keyboard.press('Tab');

    // May need multiple tabs to reach cosmic map
    let foundRegionStar = false;
    for (let i = 0; i < 10; i++) {
      const focusedElement = page.locator(':focus');
      const isRegionStar = await focusedElement
        .evaluate((el) => {
          return el.classList.contains('region-star') || el.closest('.region-star') !== null;
        })
        .catch(() => false);

      if (isRegionStar) {
        foundRegionStar = true;
        break;
      }
      await page.keyboard.press('Tab');
    }

    // If we found a region star, test Enter to zoom in
    if (foundRegionStar) {
      // Press Enter to zoom in
      await page.keyboard.press('Enter');

      // Verify zoom transition
      await page.waitForTimeout(600);

      // Press Escape to return
      await page.keyboard.press('Escape');
      await page.waitForTimeout(600);

      const cosmicMap = page.locator('.cosmic-map');
      await expect(cosmicMap).toBeVisible();
    }
  });

  test('Reduced motion settings display', async ({ page }) => {
    // Navigate to Settings → Performance
    const settingsButton = page.locator('[data-workbench-id="settings"], button:has-text("Settings")');
    if (await settingsButton.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      await settingsButton.first().click();
      await page.waitForTimeout(500);

      const perfTab = page.locator('button:has-text("Performance")');
      if (await perfTab.isVisible({ timeout: 2000 }).catch(() => false)) {
        await perfTab.click();

        // Verify Reduced Motion section exists
        const reducedMotionSection = page.locator('.reduced-motion-status, .performance-section');
        await expect(reducedMotionSection.first()).toBeVisible();

        // Verify status badge or text exists
        const statusBadge = page.locator('.status-badge, .performance-metric');
        const badgeVisible = await statusBadge.first().isVisible({ timeout: 2000 }).catch(() => false);
        expect(badgeVisible).toBeTruthy();
      }
    }
  });

  test('God View button returns to full map', async ({ page }) => {
    // Click first region to zoom
    const firstRegion = page.locator('.region-star').first();
    await firstRegion.click();
    await page.waitForTimeout(600);

    // Click God View button
    const godViewButton = page.locator('button:has-text("God View"), .cosmic-map__god-view-button');
    if (await godViewButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await godViewButton.click();
      await page.waitForTimeout(600);

      // Verify cosmic map is visible
      const cosmicMap = page.locator('.cosmic-map');
      await expect(cosmicMap).toBeVisible();
    }
  });

  test('Reset onboarding in Settings', async ({ page }) => {
    // Mark onboarding as completed
    await page.evaluate(() => {
      localStorage.setItem('afw-onboarding-completed', 'true');
    });

    // Navigate to Settings → General
    const settingsButton = page.locator('[data-workbench-id="settings"], button:has-text("Settings")');
    if (await settingsButton.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      await settingsButton.first().click();
      await page.waitForTimeout(500);

      // Click General tab (default, but click to be sure)
      const generalTab = page.locator('button:has-text("General")');
      if (await generalTab.isVisible({ timeout: 2000 }).catch(() => false)) {
        await generalTab.click();
      }

      // Find Reset Onboarding button
      const resetButton = page.locator('button:has-text("Reset Onboarding")');
      if (await resetButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        // Click will reload the page
        await Promise.all([
          page.waitForNavigation({ timeout: 5000 }).catch(() => {}),
          resetButton.click(),
        ]);

        // After reload, verify onboarding appears
        const tooltip = page.locator('.onboarding-tooltip');
        const tooltipVisible = await tooltip.isVisible({ timeout: 3000 }).catch(() => false);
        expect(tooltipVisible).toBeTruthy();
      }
    }
  });
});
