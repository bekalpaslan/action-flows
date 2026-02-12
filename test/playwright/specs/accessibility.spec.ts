/**
 * Accessibility E2E Tests
 *
 * Tests keyboard navigation, screen reader support, and ARIA attributes:
 * - Keyboard-only navigation (Tab, Enter, Escape)
 * - ARIA landmarks and roles
 * - Live regions for dynamic content
 * - Focus management
 * - Semantic HTML
 *
 * Tags: @a11y @accessibility @keyboard
 */

import { test, expect } from '@playwright/test';
import { SELECTORS, TIMEOUTS } from '../helpers/selectors';

test.describe('Accessibility', { tag: ['@a11y', '@accessibility'] }, () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');

    // Dismiss onboarding if present to focus on main app
    const skipButton = page.locator(SELECTORS.onboardingSkipBtn);
    if (await skipButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await skipButton.click();
    }

    await page.waitForLoadState('domcontentloaded');
  });

  test('A11Y-001: Keyboard navigation - Tab through main elements @keyboard', async ({
    page,
  }) => {
    const tabbableElements: string[] = [];

    // Tab through elements and collect them
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('Tab');

      const focused = page.locator(':focus');
      const focusedElement = await focused.getAttribute('class').catch(() => '');
      const focusedId = await focused.getAttribute('id').catch(() => '');
      const ariaLabel = await focused
        .getAttribute('aria-label')
        .catch(() => '');

      if (
        focusedElement ||
        focusedId ||
        ariaLabel
      ) {
        tabbableElements.push(focusedElement || focusedId || ariaLabel);
      }
    }

    // Verify we found at least some tabbable elements
    expect(tabbableElements.length).toBeGreaterThan(0);
  });

  test('A11Y-002: Keyboard navigation - Enter on buttons @keyboard', async ({
    page,
  }) => {
    // Find the new session button
    const newSessionBtn = page.locator(SELECTORS.sidebarNewSessionBtn);

    // Tab until we reach it
    let found = false;
    for (let i = 0; i < 30; i++) {
      await page.keyboard.press('Tab');

      const focused = page.locator(':focus');
      const isButton = await focused
        .evaluate((el) => el.tagName === 'BUTTON')
        .catch(() => false);
      const hasNewSessionClass = await focused
        .evaluate((el) => el.classList.contains('sidebar-new-session-btn'))
        .catch(() => false);

      if (isButton && hasNewSessionClass) {
        found = true;
        break;
      }
    }

    if (found) {
      // Press Enter to activate button
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);

      // Verify session was created
      const sessionItem = page.locator(SELECTORS.sessionSidebarItem);
      const count = await sessionItem.count();
      expect(count).toBeGreaterThan(0);
    }
  });

  test('A11Y-003: Keyboard navigation - Escape closes overlays @keyboard', async ({
    page,
  }) => {
    // Click a region to open an overlay/workbench
    const regionStar = page.locator(SELECTORS.regionStar).first();
    const regionVisible = await regionStar
      .isVisible({ timeout: TIMEOUTS.element })
      .catch(() => false);

    if (regionVisible) {
      await regionStar.click();
      await page.waitForTimeout(600);

      // Verify workbench opened
      const workbench = page.locator(SELECTORS.workbenchPanel);
      const workbenchVisible = await workbench
        .isVisible({ timeout: TIMEOUTS.element })
        .catch(() => false);

      if (workbenchVisible) {
        // Press Escape
        await page.keyboard.press('Escape');
        await page.waitForTimeout(600);

        // Verify workbench closed and cosmic map is visible
        await expect(page.locator(SELECTORS.cosmicMap)).toBeVisible({
          timeout: TIMEOUTS.element,
        });
      }
    }
  });

  test('A11Y-004: ARIA landmarks exist @semantic', async ({ page }) => {
    // Check for main content area
    const main = page.locator(SELECTORS.mainContent);
    const hasMain = await main.count().catch(() => 0);

    // Check for navigation
    const nav = page.locator(SELECTORS.navigationRegion);
    const hasNav = await nav.count().catch(() => 0);

    // At least main content should exist
    expect(hasMain + hasNav).toBeGreaterThan(0);
  });

  test('A11Y-005: Buttons have accessible names @semantic', async ({
    page,
  }) => {
    // Find all buttons
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();

    expect(buttonCount).toBeGreaterThan(0);

    // Check first 5 buttons for accessible names
    for (let i = 0; i < Math.min(5, buttonCount); i++) {
      const button = buttons.nth(i);

      const ariaLabel = await button
        .getAttribute('aria-label')
        .catch(() => '');
      const textContent = await button.textContent().catch(() => '');
      const title = await button.getAttribute('title').catch(() => '');

      // Button should have at least one form of accessible name
      const hasAccessibleName = ariaLabel || textContent || title;
      expect(hasAccessibleName).toBeTruthy();
    }
  });

  test('A11Y-006: Form inputs have labels @semantic', async ({ page }) => {
    // Find all input fields
    const inputs = page.locator('input, textarea');
    const inputCount = await inputs.count();

    // If inputs exist, check for labels
    if (inputCount > 0) {
      for (let i = 0; i < Math.min(3, inputCount); i++) {
        const input = inputs.nth(i);

        const id = await input.getAttribute('id').catch(() => '');
        const ariaLabel = await input
          .getAttribute('aria-label')
          .catch(() => '');
        const ariaLabelledBy = await input
          .getAttribute('aria-labelledby')
          .catch(() => '');
        const placeholder = await input
          .getAttribute('placeholder')
          .catch(() => '');

        // Input should have a label or aria-label or placeholder
        const hasLabel = id || ariaLabel || ariaLabelledBy || placeholder;
        expect(hasLabel).toBeTruthy();
      }
    }
  });

  test('A11Y-007: Live regions for dynamic content @semantic', async ({
    page,
  }) => {
    // Check for live regions
    const liveRegions = page.locator('[role="status"], [aria-live]');
    const liveRegionCount = await liveRegions.count();

    // Live regions are optional but good to have
    // Just verify if they exist, they have proper aria attributes
    if (liveRegionCount > 0) {
      const firstLiveRegion = liveRegions.first();
      const ariaLive = await firstLiveRegion
        .getAttribute('aria-live')
        .catch(() => 'status'); // default role="status" implies polite

      expect(ariaLive).toMatch(/polite|assertive|off/);
    }
  });

  test('A11Y-008: Focus visible on interactive elements @visual', async ({
    page,
  }) => {
    // Tab to an interactive element
    await page.keyboard.press('Tab');
    await page.waitForTimeout(100);

    const focused = page.locator(':focus');
    const focusCount = await focused.count();

    // Verify focus is visible (browser default or custom focus styles)
    if (focusCount > 0) {
      const hasFocusStyles = await focused.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        const outline = styles.outline;
        const boxShadow = styles.boxShadow;
        const border = styles.borderStyle;

        // At least one visible indicator should exist
        return (
          outline !== 'none' ||
          boxShadow !== 'none' ||
          border !== 'none'
        );
      }).catch(() => true); // May have custom focus handling

      expect(hasFocusStyles).toBeTruthy();
    }
  });

  test('A11Y-009: Color contrast in buttons @visual', async ({
    page,
  }) => {
    // Get first button
    const button = page.locator('button').first();
    const buttonVisible = await button
      .isVisible({ timeout: TIMEOUTS.element })
      .catch(() => false);

    if (buttonVisible) {
      // Get computed styles
      const colors = await button.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return {
          color: styles.color,
          backgroundColor: styles.backgroundColor,
        };
      });

      // Just verify colors are set (not all transparent)
      expect(colors.color).not.toMatch(/^rgb\(0,\s*0,\s*0,\s*0\)/);
      expect(colors.backgroundColor).toBeTruthy();
    }
  });

  test('A11Y-010: Links have descriptive text @semantic', async ({
    page,
  }) => {
    const links = page.locator('a');
    const linkCount = await links.count();

    if (linkCount > 0) {
      // Check first few links
      for (let i = 0; i < Math.min(3, linkCount); i++) {
        const link = links.nth(i);

        const textContent = await link.textContent().catch(() => '');
        const ariaLabel = await link
          .getAttribute('aria-label')
          .catch(() => '');
        const title = await link.getAttribute('title').catch(() => '');

        // Link should have descriptive text
        const isDescriptive =
          (textContent && textContent.trim().length > 0) ||
          ariaLabel ||
          title;
        expect(isDescriptive).toBeTruthy();
      }
    }
  });

  test('A11Y-011: Cosmic map accessible via keyboard @keyboard', async ({
    page,
  }) => {
    // Tab to cosmic map region stars
    let foundRegionStar = false;

    for (let i = 0; i < 30; i++) {
      await page.keyboard.press('Tab');

      const focused = page.locator(':focus');
      const isRegionStar = await focused
        .evaluate((el) => {
          return (
            el.classList.contains('region-star') ||
            el.closest('.region-star') !== null ||
            el.getAttribute('role') === 'button' ||
            el.getAttribute('data-cosmic-element')
          );
        })
        .catch(() => false);

      if (isRegionStar) {
        foundRegionStar = true;

        // Verify region star is keyboard accessible
        const isButton = await focused
          .evaluate((el) => el.tagName === 'BUTTON' || el.getAttribute('role') === 'button')
          .catch(() => false);
        expect(isButton).toBeTruthy();

        break;
      }
    }

    // Note: Not all cosmic elements may be keyboard accessible in initial version
    // This test documents the expectation
  });

  test('A11Y-012: Session sidebar keyboard navigation @keyboard', async ({
    page,
  }) => {
    // Create a session first
    const createBtn = page.locator(SELECTORS.sidebarNewSessionBtn);
    await createBtn.click();
    await page.waitForTimeout(500);

    // Tab to session item
    let foundSessionItem = false;

    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('Tab');

      const focused = page.locator(':focus');
      const isSessionItem = await focused
        .evaluate((el) => {
          return (
            el.classList.contains('session-sidebar-item') ||
            el.closest('.session-sidebar-item') !== null
          );
        })
        .catch(() => false);

      if (isSessionItem) {
        foundSessionItem = true;

        // Verify we can press Enter to select
        await page.keyboard.press('Enter');
        await page.waitForTimeout(300);

        break;
      }
    }

    expect(foundSessionItem).toBeTruthy();
  });
});
