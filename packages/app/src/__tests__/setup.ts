/**
 * Vitest setup file for frontend tests
 * Configures test environment and global test utilities
 */

import '@testing-library/jest-dom/vitest';

// Add any global test setup here
// For example, if you need to mock window.matchMedia:
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true,
  }),
});

// Mock import.meta.env for Vite
global.import = {
  meta: {
    env: {
      VITE_BACKEND_URL: 'http://localhost:3001',
    },
  },
} as any;
