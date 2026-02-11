/**
 * Cosmic Map Navigation E2E Tests
 *
 * Tests core navigation scenarios for the Living Universe cosmic map:
 * - Big Bang animation on first visit
 * - Region star visibility and interaction
 * - Zoom in/out transitions
 * - Onboarding tooltip sequence
 */

import { test, expect } from '@playwright/test';

test.describe('Cosmic Map Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');

    // Dismiss onboarding if present
    const skipButton = page.locator('button:has-text("Skip")');
    if (await skipButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await skipButton.click();
    }

    // Wait for cosmic map to render
    await page.waitForSelector('.cosmic-map', { timeout: 5000 });
  });

  test('Big Bang animation plays on first visit', async ({ page }) => {
    // Clear localStorage to trigger Big Bang
    await page.evaluate(() => {
      localStorage.clear();
    });
    await page.reload();

    // Check for BigBangAnimation component
    const bigBang = page.locator('.big-bang-animation');
    await expect(bigBang).toBeVisible({ timeout: 5000 });

    // Wait for animation to complete (3 seconds)
    await page.waitForTimeout(3500);

    // Verify cosmic map is now visible
    const cosmicMap = page.locator('.cosmic-map');
    await expect(cosmicMap).toBeVisible();
  });

  test('Region stars are visible and clickable', async ({ page }) => {
    // Wait for region stars to render
    const regionStars = page.locator('.region-star');
    await expect(regionStars.first()).toBeVisible({ timeout: 5000 });

    const count = await regionStars.count();
    expect(count).toBeGreaterThan(0);

    // Click on first visible region
    const firstRegion = regionStars.first();
    await firstRegion.click();

    // Verify zoom transition starts (cosmic map gets zooming class or opacity changes)
    await page.waitForTimeout(100);
    const isZooming = await page.locator('.cosmic-map').evaluate((el) => {
      return (
        el.classList.contains('zooming') ||
        el.classList.contains('cosmic-map--zooming') ||
        window.getComputedStyle(el).opacity !== '1'
      );
    });
    expect(isZooming).toBeTruthy();
  });

  test('Zoom in and out transitions', async ({ page }) => {
    // Click first region to zoom in
    const firstRegion = page.locator('.region-star').first();
    await firstRegion.click();

    // Wait for zoom-in transition (400ms + buffer)
    await page.waitForTimeout(600);

    // Verify RegionFocusView or workbench content is visible
    const regionFocus = page.locator('.region-focus-view, .workbench-panel, [data-workbench-id]');
    const isFocusVisible = await regionFocus.first().isVisible({ timeout: 2000 }).catch(() => false);

    // At minimum, cosmic map should start fading or zooming
    const cosmicMap = page.locator('.cosmic-map');
    const hasZoomClass = await cosmicMap.evaluate((el) => {
      return (
        el.classList.contains('cosmic-map--zooming') ||
        el.classList.contains('cosmic-map--hidden')
      );
    });

    expect(isFocusVisible || hasZoomClass).toBeTruthy();

    // Press Escape to return to god view
    await page.keyboard.press('Escape');

    // Wait for zoom-out transition
    await page.waitForTimeout(600);

    // Verify cosmic map is visible again
    await expect(cosmicMap).toBeVisible();
  });

  test('Onboarding dismisses correctly', async ({ page }) => {
    // Clear onboarding flag
    await page.evaluate(() => {
      localStorage.removeItem('afw-onboarding-completed');
    });
    await page.reload();

    // Wait for onboarding tooltip
    const tooltip = page.locator('.onboarding-tooltip');
    await expect(tooltip).toBeVisible({ timeout: 2000 });

    // Click skip button
    const skipButton = page.locator('button:has-text("Skip")');
    await skipButton.click();

    // Verify onboarding disappears
    await expect(tooltip).not.toBeVisible();

    // Verify flag is set in localStorage
    const flagSet = await page.evaluate(() => {
      return localStorage.getItem('afw-onboarding-completed') === 'true';
    });
    expect(flagSet).toBeTruthy();
  });

  test('Onboarding step progression', async ({ page }) => {
    // Clear onboarding flag
    await page.evaluate(() => {
      localStorage.removeItem('afw-onboarding-completed');
    });
    await page.reload();

    // Wait for onboarding tooltip
    const tooltip = page.locator('.onboarding-tooltip');
    await expect(tooltip).toBeVisible({ timeout: 2000 });

    // Verify step 1/3
    const stepIndicator = page.locator('.step-indicator');
    await expect(stepIndicator).toContainText('1 / 3');

    // Click Next
    const nextButton = page.locator('button:has-text("Next")');
    await nextButton.click();

    // Verify step 2/3
    await expect(stepIndicator).toContainText('2 / 3');

    // Click Next again
    await nextButton.click();

    // Verify step 3/3
    await expect(stepIndicator).toContainText('3 / 3');

    // Verify Done button appears
    const doneButton = page.locator('button:has-text("Done")');
    await expect(doneButton).toBeVisible();

    // Click Done
    await doneButton.click();

    // Verify onboarding disappears
    await expect(tooltip).not.toBeVisible();
  });
});
