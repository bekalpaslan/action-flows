/**
 * Test Utilities Index
 *
 * Central export point for all test utilities including mock providers,
 * mock data factories, and test helper functions.
 */

// Re-export mock providers
export {
  MockWebSocketProvider,
  MockWorkbenchProvider,
  MockUniverseProvider,
  MockSessionProvider,
  MockDiscussProvider,
  MockDiscoveryProvider,
  MockFeatureFlagProvider,
} from './mockProviders';

// Re-export mock data factories
export {
  createMockSession,
  createMockChain,
  createMockSessions,
  createMockGate,
  createMockPosition,
  createMockUniverse,
  createMockColorShift,
  createMockHealthMetrics,
  createMockRegionStarData,
  createMockRegionStarNodeProps,
  createMockChatMessage,
  createMockChatMessages,
  createMockPromptButton,
  createMockPromptButtons,
  createMockError,
  createMockUnreadErrors,
  type RegionStarData,
} from './mockData';

// Re-export test helpers
export {
  setupCommonTest,
  useCommonTestSetup,
  setupWindowMocks,
  cleanupWindowMocks,
  createMockFn,
  createMockCallbacks,
  assertTestAttributes,
  assertAccessibilityAttributes,
  setLocalStorageValue,
  getLocalStorageValue,
  assertLocalStorageContains,
  findElement,
  findElements,
  getElementStyle,
  createMockFetchResponse,
  createMockWebSocket,
  skipIf,
  onlyIf,
} from './testHelpers';
