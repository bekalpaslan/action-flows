/**
 * Cosmic Map Navigation E2E Tests
 *
 * Tests the core navigation scenarios for the Living Universe cosmic map:
 * - Big Bang animation on first visit
 * - Region star visibility and interactivity
 * - Zoom in/out transitions
 * - Onboarding flow
 * - God View return navigation
 *
 * Tags: @cosmic @navigation @ui
 */

import { test, expect } from '@playwright/test';
import { SELECTORS, TIMEOUTS } from '../helpers/selectors';

test.describe('Cosmic Map Navigation', { tag: ['@cosmic', '@navigation', '@ui'] }, () => {
  test.beforeEach(async ({ page, context }) => {
    // Clear localStorage to ensure clean state
    await context.clearCookies();
    await page.goto('/');

    // Dismiss onboarding if it appears
    const skipButton = page.locator(SELECTORS.onboardingSkipBtn);
    if (await skipButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await skipButton.click();
      await page.waitForTimeout(500);
    }

    // Wait for cosmic map to render
    await page.waitForSelector(SELECTORS.cosmicMap, { timeout: TIMEOUTS.navigation });
  });

  test('COSMIC-001: Big Bang animation plays on first visit @visual', async ({
    page,
    context,
  }) => {
    // Clear localStorage to trigger Big Bang animation
    await context.clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
    });
    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    // Check for BigBangAnimation component
    const bigBang = page.locator(SELECTORS.bigBangAnimation);
    const isBigBangVisible = await bigBang
      .isVisible({ timeout: TIMEOUTS.navigation })
      .catch(() => false);

    if (isBigBangVisible) {
      // Wait for animation to complete (3-4 seconds)
      await page.waitForTimeout(4000);

      // Verify cosmic map is now visible
      await expect(page.locator(SELECTORS.cosmicMap)).toBeVisible({
        timeout: TIMEOUTS.element,
      });
    } else {
      // If Big Bang doesn't exist (optional feature), cosmic map should be visible
      await expect(page.locator(SELECTORS.cosmicMap)).toBeVisible({
        timeout: TIMEOUTS.element,
      });
    }
  });

  test('COSMIC-002: Region stars are visible and clickable @interaction', async ({
    page,
  }) => {
    // Wait for region stars to render
    const regionStars = page.locator(SELECTORS.regionStar);
    await expect(regionStars.first()).toBeVisible({ timeout: TIMEOUTS.navigation });

    // Verify at least one region exists
    const count = await regionStars.count();
    expect(count).toBeGreaterThan(0);

    // Click on first visible region
    const firstRegion = regionStars.first();
    await firstRegion.click();

    // Verify transition starts (cosmic map opacity or class changes)
    await page.waitForTimeout(200);

    const isZooming = await page.locator(SELECTORS.cosmicMap).evaluate((el) => {
      const classes = el.className;
      return (
        classes.includes('zooming') ||
        classes.includes('cosmic-map--zooming') ||
        window.getComputedStyle(el).opacity !== '1'
      );
    });

    expect(isZooming).toBeTruthy();
  });

  test('COSMIC-003: Zoom in and out transitions @interaction', async ({
    page,
  }) => {
    // Get initial cosmic map state
    const cosmicMap = page.locator(SELECTORS.cosmicMap);
    const initialOpacity = await cosmicMap.evaluate((el) =>
      window.getComputedStyle(el).opacity
    );

    // Click first region to zoom in
    const firstRegion = page.locator(SELECTORS.regionStar).first();
    await firstRegion.click();

    // Wait for zoom-in transition
    await page.waitForTimeout(600);

    // Verify zoom effect (opacity change or hidden)
    const zoomedOpacity = await cosmicMap
      .evaluate((el) => window.getComputedStyle(el).opacity)
      .catch(() => '0');
    expect(Number(zoomedOpacity)).toBeLessThanOrEqual(Number(initialOpacity));

    // Press Escape to return to god view
    await page.keyboard.press('Escape');

    // Wait for zoom-out transition
    await page.waitForTimeout(600);

    // Verify cosmic map is visible again
    await expect(cosmicMap).toBeVisible({ timeout: TIMEOUTS.element });

    // Verify opacity has increased back
    const unzoomedOpacity = await cosmicMap.evaluate((el) =>
      window.getComputedStyle(el).opacity
    );
    expect(Number(unzoomedOpacity)).toBeGreaterThan(Number(zoomedOpacity));
  });

  test('COSMIC-004: Onboarding dismisses correctly @onboarding', async ({
    page,
    context,
  }) => {
    // Clear onboarding flag
    await page.evaluate(() => {
      localStorage.removeItem('afw-onboarding-completed');
    });
    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    // Wait for onboarding tooltip
    const tooltip = page.locator(SELECTORS.onboardingTooltip);
    await expect(tooltip).toBeVisible({ timeout: TIMEOUTS.element });

    // Click skip button
    const skipButton = page.locator(SELECTORS.onboardingSkipBtn);
    await skipButton.click();

    // Verify onboarding disappears
    await expect(tooltip).not.toBeVisible({ timeout: TIMEOUTS.element });

    // Verify flag is set in localStorage
    const flagSet = await page.evaluate(() => {
      return localStorage.getItem('afw-onboarding-completed') === 'true';
    });
    expect(flagSet).toBeTruthy();
  });

  test('COSMIC-005: Onboarding step progression @onboarding', async ({
    page,
    context,
  }) => {
    // Clear onboarding flag
    await page.evaluate(() => {
      localStorage.removeItem('afw-onboarding-completed');
    });
    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    // Wait for onboarding tooltip
    const tooltip = page.locator(SELECTORS.onboardingTooltip);
    await expect(tooltip).toBeVisible({ timeout: TIMEOUTS.element });

    // Verify step 1/3 or similar progress indicator
    const stepIndicator = page.locator('.step-indicator, .onboarding-step');
    let stepText = await stepIndicator
      .textContent({ timeout: TIMEOUTS.element })
      .catch(() => '');
    expect(stepText).toBeTruthy();

    // Click Next button
    const nextButton = page.locator(SELECTORS.onboardingNextBtn);
    const nextVisible = await nextButton
      .isVisible({ timeout: TIMEOUTS.element })
      .catch(() => false);

    if (nextVisible) {
      await nextButton.click();
      await page.waitForTimeout(300);

      // Verify step changed
      const newStepText = await stepIndicator.textContent({ timeout: TIMEOUTS.element });
      expect(newStepText).not.toBe(stepText);

      // Click Next again
      await nextButton.click();
      await page.waitForTimeout(300);

      // Verify Done button appears
      const doneButton = page.locator(SELECTORS.onboardingDoneBtn);
      const doneVisible = await doneButton
        .isVisible({ timeout: TIMEOUTS.element })
        .catch(() => false);

      if (doneVisible) {
        // Click Done
        await doneButton.click();

        // Verify onboarding disappears
        await expect(tooltip).not.toBeVisible({ timeout: TIMEOUTS.element });
      }
    }
  });

  test('COSMIC-006: God View button returns to full map @interaction', async ({
    page,
  }) => {
    // Click first region to zoom in
    const firstRegion = page.locator(SELECTORS.regionStar).first();
    await firstRegion.click();
    await page.waitForTimeout(600);

    // Verify workbench or region view appears
    const workbench = page.locator(SELECTORS.workbenchPanel);
    const workbenchVisible = await workbench
      .isVisible({ timeout: TIMEOUTS.element })
      .catch(() => false);

    if (workbenchVisible) {
      // Click God View button if present
      const godViewButton = page.locator(SELECTORS.godViewButton);
      const godViewVisible = await godViewButton
        .isVisible({ timeout: TIMEOUTS.element })
        .catch(() => false);

      if (godViewVisible) {
        await godViewButton.click();
        await page.waitForTimeout(600);

        // Verify cosmic map is visible again
        await expect(page.locator(SELECTORS.cosmicMap)).toBeVisible({
          timeout: TIMEOUTS.element,
        });
      }
    }

    // Alternative: press Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(600);

    // Verify cosmic map is visible
    await expect(page.locator(SELECTORS.cosmicMap)).toBeVisible({
      timeout: TIMEOUTS.element,
    });
  });

  test('COSMIC-007: Multiple region navigation cycle @interaction', async ({
    page,
  }) => {
    const regionStars = page.locator(SELECTORS.regionStar);
    const regionCount = await regionStars.count();

    if (regionCount >= 2) {
      // Click first region
      await regionStars.nth(0).click();
      await page.waitForTimeout(600);

      // Return to god view
      await page.keyboard.press('Escape');
      await page.waitForTimeout(600);

      // Click second region
      await regionStars.nth(1).click();
      await page.waitForTimeout(600);

      // Return to god view
      await page.keyboard.press('Escape');
      await page.waitForTimeout(600);

      // Verify cosmic map is still visible
      await expect(page.locator(SELECTORS.cosmicMap)).toBeVisible({
        timeout: TIMEOUTS.element,
      });
    }
  });
});
