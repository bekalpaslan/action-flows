/**
 * Playwright Configuration for Cosmic Map Tests
 *
 * Specialized config for testing Living Universe visualization with:
 * - Reduced motion enabled (stable tests)
 * - Longer timeouts for animations
 * - Chromium-only (cosmos rendering)
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './test/e2e',
  testMatch: 'cosmic-map-*.test.ts',

  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  reporter: 'html',

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',

    // Disable animations for stable tests
    // Note: Playwright doesn't have built-in reducedMotion, we emulate via media query
    emulateMedia: { reducedMotion: 'reduce' },
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'pnpm dev:app',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
