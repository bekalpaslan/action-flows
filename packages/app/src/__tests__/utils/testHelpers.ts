/**
 * Test Helper Functions for Component Tests
 *
 * Provides common test setup, assertions, and utility functions used across
 * component tests to reduce code duplication.
 */

import { vi, beforeEach } from 'vitest';

// ============================================================================
// Common Test Setup
// ============================================================================

/**
 * Standard test setup - clears mocks and storage
 */
export const setupCommonTest = () => {
  vi.clearAllMocks();
  localStorage.clear();
};

/**
 * Wraps setupCommonTest in a beforeEach hook
 */
export const useCommonTestSetup = () => {
  beforeEach(() => {
    setupCommonTest();
  });
};

/**
 * Setup window mocks for tests that need matchMedia
 */
export const setupWindowMocks = () => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
};

/**
 * Cleanup window mocks after tests
 */
export const cleanupWindowMocks = () => {
  vi.restoreAllMocks();
};

// ============================================================================
// Common Mock Functions
// ============================================================================

/**
 * Creates a mock vi.fn() with default behavior
 */
export const createMockFn = <T extends any[], R>(
  defaultReturnValue?: R
) => {
  return vi.fn((..._args: T) => defaultReturnValue);
};

/**
 * Creates mock callback functions for testing
 */
export const createMockCallbacks = () => ({
  onCommand: vi.fn(),
  onCollapseChange: vi.fn(),
  onToggle: vi.fn(),
  onClick: vi.fn(),
  onChange: vi.fn(),
  onSearch: vi.fn(),
  onSubmit: vi.fn(),
  onClose: vi.fn(),
  onOpen: vi.fn(),
  onSelect: vi.fn(),
  onNavigate: vi.fn(),
});

// ============================================================================
// Common Assertions
// ============================================================================

/**
 * Assert that a container element has specific test attributes
 */
export const assertTestAttributes = (
  element: HTMLElement | null,
  testId: string,
  expectedClasses?: string[]
) => {
  if (!element) {
    throw new Error(`Element with testId "${testId}" not found`);
  }

  if (expectedClasses) {
    expectedClasses.forEach((className) => {
      if (!element.classList.contains(className)) {
        throw new Error(
          `Element missing class "${className}". Got: ${element.className}`
        );
      }
    });
  }
};

/**
 * Assert accessibility attributes on element
 */
export const assertAccessibilityAttributes = (
  element: HTMLElement | null,
  options: {
    role?: string;
    ariaLabel?: string;
    ariaLive?: 'polite' | 'assertive' | 'off';
    ariaHidden?: boolean;
  } = {}
) => {
  if (!element) {
    throw new Error('Element not found for accessibility check');
  }

  if (options.role) {
    const role = element.getAttribute('role');
    if (role !== options.role) {
      throw new Error(
        `Expected role "${options.role}" but got "${role}"`
      );
    }
  }

  if (options.ariaLabel) {
    const label = element.getAttribute('aria-label');
    if (!label?.includes(options.ariaLabel)) {
      throw new Error(
        `Expected aria-label to contain "${options.ariaLabel}" but got "${label}"`
      );
    }
  }

  if (options.ariaLive) {
    const live = element.getAttribute('aria-live');
    if (live !== options.ariaLive) {
      throw new Error(
        `Expected aria-live "${options.ariaLive}" but got "${live}"`
      );
    }
  }

  if (options.ariaHidden !== undefined) {
    const hidden = element.getAttribute('aria-hidden');
    const expectedValue = options.ariaHidden ? 'true' : 'false';
    if (hidden !== expectedValue && hidden !== null) {
      throw new Error(
        `Expected aria-hidden "${expectedValue}" but got "${hidden}"`
      );
    }
  }
};

// ============================================================================
// Local Storage Helpers
// ============================================================================

/**
 * Set and verify localStorage value for testing
 */
export const setLocalStorageValue = (key: string, value: any) => {
  const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
  localStorage.setItem(key, stringValue);
  return stringValue;
};

/**
 * Get and parse localStorage value for testing
 */
export const getLocalStorageValue = (key: string, shouldParse: boolean = false) => {
  const value = localStorage.getItem(key);
  if (value && shouldParse) {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  return value;
};

/**
 * Assert localStorage contains expected value
 */
export const assertLocalStorageContains = (
  key: string,
  expectedValue: string
) => {
  const actual = localStorage.getItem(key);
  if (!actual?.includes(expectedValue)) {
    throw new Error(
      `Expected localStorage[${key}] to contain "${expectedValue}" but got "${actual}"`
    );
  }
};

// ============================================================================
// DOM Query Helpers
// ============================================================================

/**
 * Safely query element and assert existence
 */
export const findElement = (
  container: Element,
  selector: string
): HTMLElement => {
  const element = container.querySelector<HTMLElement>(selector);
  if (!element) {
    throw new Error(`Element matching "${selector}" not found`);
  }
  return element;
};

/**
 * Find all elements matching selector
 */
export const findElements = (
  container: Element,
  selector: string
): HTMLElement[] => {
  return Array.from(container.querySelectorAll<HTMLElement>(selector));
};

/**
 * Get element's computed style value
 */
export const getElementStyle = (
  element: HTMLElement,
  property: string
): string => {
  return window.getComputedStyle(element).getPropertyValue(property);
};

// ============================================================================
// Mock HTTP and WebSocket Helpers
// ============================================================================

/**
 * Create mock fetch response
 */
export const createMockFetchResponse = <T>(
  data: T,
  status: number = 200
) => ({
  ok: status >= 200 && status < 300,
  status,
  json: vi.fn().mockResolvedValue(data),
  text: vi.fn().mockResolvedValue(JSON.stringify(data)),
  blob: vi.fn().mockResolvedValue(new Blob([JSON.stringify(data)])),
  clone: vi.fn(function (this: any) {
    return this;
  }),
  headers: new Map(),
  type: 'basic' as const,
});

/**
 * Create mock WebSocket
 */
export const createMockWebSocket = () => ({
  send: vi.fn(),
  close: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  readyState: 1, // OPEN
});

// ============================================================================
// Conditional Test Utilities
// ============================================================================

/**
 * Skip test if condition is true
 */
export const skipIf = (condition: boolean, message: string = 'Skipped') => {
  if (condition) {
    console.warn(`Test skipped: ${message}`);
  }
  return condition;
};

/**
 * Only run test if condition is true
 */
export const onlyIf = (condition: boolean) => {
  return !condition;
};
