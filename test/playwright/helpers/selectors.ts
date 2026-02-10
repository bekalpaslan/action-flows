/**
 * Centralized Selectors for Playwright Tests
 *
 * Single source of truth for all CSS selectors used in tests.
 * This prevents brittle tests and makes updates easier when UI changes.
 */

export const SELECTORS = {
  // Layout
  workbenchLayout: '.workbench-layout',
  workbenchBody: '.workbench-body',
  topBar: '.top-bar',

  // Session sidebar
  sessionSidebar: '.session-sidebar',
  sidebarNewSessionBtn: '.sidebar-new-session-btn',
  sessionSidebarItem: '.session-sidebar-item',

  // Chat panel
  chatInput: '.chat-panel__input-field',
  chatSendBtn: '.chat-panel__send-btn',
  chatMessages: '.chat-panel__messages',
  chatInfoBar: '.chat-panel__info-bar',

  // Dashboard
  dashboardHeading: 'h1:has-text("Work Dashboard")',
  sessionInfoBar: '.chat-panel__info-bar', // Contains session ID and metadata
  sessionIdInInfoBar: '.chat-panel__info-bar', // Session ID displayed in info bar
} as const;

/**
 * API Endpoints for direct API testing
 */
export const API = {
  health: 'http://localhost:3001/health',
  sessions: 'http://localhost:3001/api/sessions',
  sessionById: (id: string) => `http://localhost:3001/api/sessions/${id}`,
  sessionChat: (id: string) => `http://localhost:3001/api/sessions/${id}/chat`,
} as const;

/**
 * Timeout values for different operations
 */
export const TIMEOUTS = {
  navigation: 10000,
  element: 5000,
  network: 3000,
  message: 5000,
} as const;
