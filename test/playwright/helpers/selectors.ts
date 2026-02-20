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

  // Chat panel (data-testid attributes - preferred for stability)
  chatPanel: '[data-testid="chat-panel"]',
  chatInputTestId: '[data-testid="chat-input"]',
  chatSendBtnTestId: '[data-testid="send-button"]',
  chatMessageList: '[data-testid="message-list"]',
  chatMessageByIndex: (index: number) => `[data-testid="message-msg-${index}"]`,
  typingIndicator: '[data-testid="typing-indicator"]',
  sessionInfoHeader: '[data-testid="session-info-header"]',

  // Message bubble classes (for role verification)
  chatBubbleUser: '.chat-bubble--user',
  chatBubbleAssistant: '.chat-bubble--assistant',
  chatBubbleContent: '.chat-bubble__content',
  chatBubbleTimestamp: '.chat-bubble__timestamp',

  // Dashboard
  dashboardHeading: 'h1:has-text("Work Dashboard")',
  sessionInfoBar: '.chat-panel__info-bar', // Contains session ID and metadata
  sessionIdInInfoBar: '.chat-panel__info-bar', // Session ID displayed in info bar

  // Cosmic Map Navigation
  cosmicMap: '.cosmic-map',
  cosmicMapContainer: '.cosmic-map-container',
  regionStar: '.region-star',
  regionStarButton: '.region-star-button',
  bigBangAnimation: '.big-bang-animation',
  onboardingTooltip: '.onboarding-tooltip',
  onboardingSkipBtn: 'button:has-text("Skip")',
  onboardingNextBtn: 'button:has-text("Next")',
  onboardingDoneBtn: 'button:has-text("Done")',
  godViewButton: 'button:has-text("God View")',
  workbenchPanel: '.workbench-panel',
  regionFocusView: '.region-focus-view',

  // Accessibility
  liveRegion: '[role="status"]',
  mainContent: '[role="main"]',
  navigationRegion: '[role="navigation"]',
  tooltipRegion: '[role="tooltip"]',
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
  userMessage: 10000,      // User message appearance: 10s
  assistantResponse: 30000, // Assistant response: 30s (LLM inference)
  testTotal: 60000,        // Total test timeout: 60s
} as const;
