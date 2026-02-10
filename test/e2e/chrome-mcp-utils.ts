/**
 * Chrome MCP E2E Test Utilities
 *
 * Type definitions and helper constants for Chrome DevTools MCP E2E tests.
 * These utilities support structured test definitions that Claude executes
 * step-by-step using Chrome MCP tools.
 */

/**
 * Chrome MCP tool names (subset of available tools)
 */
export type ChromeMcpTool =
  | 'navigate_page'
  | 'take_snapshot'
  | 'click'
  | 'fill'
  | 'wait_for'
  | 'press_key'
  | 'evaluate_script'
  | 'list_network_requests'
  | 'get_network_request'
  | 'take_screenshot'
  | 'list_console_messages'
  | 'hover'
  | 'handle_dialog';

/**
 * Assertion types for test validation
 */
export interface Assertion {
  /** Type of assertion to perform */
  check:
    | 'snapshot_contains_text'
    | 'snapshot_has_element'
    | 'response_status'
    | 'response_contains'
    | 'truthy'
    | 'network_request_exists'
    | 'network_status_code'
    | 'websocket_connected';

  /** Target element/field to check (context-dependent) */
  target?: string;

  /** Expected value */
  expected: unknown;

  /** Human-readable assertion message */
  message: string;
}

/**
 * Test context carries state between steps
 */
export interface TestContext {
  /** Session ID extracted from API response */
  sessionId?: string;

  /** Named element UIDs from snapshots (e.g., 'newSessionBtn' -> 'uid-123') */
  elementUids: Record<string, string>;

  /** Network request IDs by name/pattern */
  networkReqIds: Record<string, number>;

  /** Results from previous steps */
  stepResults: Record<string, unknown>;
}

/**
 * Test step definition
 * Each step describes one Chrome MCP tool call with assertions
 */
export interface TestStep {
  /** Unique step identifier */
  id: string;

  /** Human-readable step name */
  name: string;

  /** Detailed description of what this step does */
  description: string;

  /** Chrome MCP tool to invoke */
  tool: ChromeMcpTool;

  /** Tool parameters (static or dynamic via function) */
  params: Record<string, unknown> | ((context: TestContext) => Record<string, unknown>);

  /** Assertions to validate after tool execution */
  assertions: Assertion[];

  /** Whether to take a screenshot after this step */
  screenshot: boolean;

  /** Failure handling strategy */
  onFailure: 'abort' | 'retry' | 'continue';

  /** Optional function to extract data from response into context */
  captureFrom?: (response: unknown, context: TestContext) => Record<string, unknown>;
}

/**
 * Test result for a single step
 */
export interface TestResult {
  /** Step identifier */
  stepId: string;

  /** Whether all assertions passed */
  passed: boolean;

  /** Execution duration in milliseconds */
  duration: number;

  /** Error message if step failed */
  error?: string;

  /** Path to screenshot if captured */
  screenshotPath?: string;

  /** Timestamp when step completed */
  completedAt: string;
}

/**
 * Full test suite result
 */
export interface TestSuiteResult {
  /** Total steps executed */
  totalSteps: number;

  /** Steps that passed */
  passedSteps: number;

  /** Steps that failed */
  failedSteps: number;

  /** Total duration in milliseconds */
  totalDuration: number;

  /** Individual step results */
  stepResults: TestResult[];

  /** Test execution timestamp */
  executedAt: string;

  /** Overall test status */
  status: 'passed' | 'failed' | 'aborted';
}

/**
 * Environment URLs
 */
export const BACKEND_URL = 'http://localhost:3001';
export const FRONTEND_URL = 'http://localhost:5173';

/**
 * Timeout values (milliseconds)
 */
export const TIMEOUTS = {
  /** Page navigation timeout */
  navigation: 10000,

  /** Element interaction timeout */
  element: 5000,

  /** Network request timeout */
  network: 3000,

  /** WebSocket connection timeout */
  websocket: 2000,

  /** Message display timeout */
  messageDisplay: 5000,
} as const;

/**
 * Test message content
 */
export const TEST_MESSAGE = 'Hello from E2E test! This is an automated Chrome MCP test message.';

/**
 * Screenshot output directory
 */
export const SCREENSHOT_DIR = 'test/e2e/reports/screenshots';

/**
 * Element selectors (CSS classes/attributes to look for in snapshots)
 */
export const SELECTORS = {
  /** New session button in sidebar */
  newSessionBtn: 'sidebar-new-session-btn',

  /** Session list items */
  sessionItem: 'session-sidebar-item',

  /** Active or Recent sessions section (new sessions start as "pending" in RECENT) */
  activeSection: 'ACTIVE',
  recentSection: 'RECENT',

  /** Empty state message */
  emptyState: 'No sessions yet',

  /** Chat input textarea */
  chatInput: 'chat-panel__input-field',

  /** Chat send button */
  chatSendBtn: 'chat-panel__send-btn',

  /** Chat message bubble */
  chatBubble: 'chat-bubble',

  /** WebSocket status indicator */
  wsStatus: 'ws-status',

  /** Session title in workbench */
  sessionTitle: 'Sessions',

  /** Respect check selectors (verified from CSS analysis 2026-02-10) */
  workbenchLayout: 'workbench-layout',
  workbenchBody: 'workbench-body',
  workbenchMain: 'workbench-main',
  workbenchContent: 'workbench-content',
  workbenchBottom: 'workbench-bottom',
  topBar: 'top-bar',
  topBarTabs: 'top-bar-tabs',
  leftPanelStack: 'left-panel-stack',
  sessionPanelLayout: 'session-panel-layout',
  rightVisualizationArea: 'right-visualization-area',
  flowVisualization: 'flow-visualization',
  chainDagContainer: 'chain-dag-container',
  squadPanel: 'squad-panel',
  chatMessages: 'chat-panel__messages',
  chatInfoBar: 'chat-panel__info-bar',

  /** Session Sidebar selectors (verified 2026-02-10) */
  sidebarTitle: 'sidebar-title',
  sidebarIcon: 'sidebar-icon',
  sidebarDivider: 'sidebar-divider',
  sessionList: 'session-list',
  sectionTitle: 'section-title',
  sessionCount: 'session-count',

  /** Session Sidebar Item selectors (verified 2026-02-10) */
  sessionSidebarItem: 'session-sidebar-item',
  sessionSidebarItemActive: 'session-sidebar-item active',
  statusDot: 'status-dot',
  sessionName: 'session-name',
  sessionTime: 'session-time',
  routingBadge: 'routing-badge',
  notificationBadge: 'notification-badge',
  sessionDeleteBtn: 'session-delete-btn',

  /** Session Info Panel selectors (verified 2026-02-10) */
  infoPanelHeader: 'info-panel-header',
  panelTitle: 'panel-title',
  collapseToggle: 'collapse-toggle',
  collapseIcon: 'collapse-icon',
  statusBadge: 'status-badge',
  freshnessIndicator: 'freshness-indicator',
  sessionIdButton: 'session-id-button',
  sessionIdText: 'session-id-text',
  copyIcon: 'copy-icon',
  infoChip: 'info-chip',

  /** Conversation Panel selectors (verified 2026-02-10) */
  conversationHeader: 'conversation-header',
  awaitingBadge: 'awaiting-badge',
  pulseDot: 'pulse-dot',
  messagesContainer: 'messages-container',
  noMessages: 'no-messages',
  message: 'message',
  messageAssistant: 'message-assistant',
  messageUser: 'message-user',
  messageRole: 'message-role',
  messageContent: 'message-content',
  messageTimestamp: 'message-timestamp',
  quickResponses: 'quick-responses',
  quickResponseBtn: 'quick-response-btn',
  chatInputField: 'chat-panel__input-field',
  notAwaitingNotice: 'not-awaiting-notice',

  /** Session Pane selectors (verified 2026-02-10) */
  userAvatarSmall: 'user-avatar-small',
  userName: 'user-name',
  sessionIdDisplay: 'session-id-display',
  sessionStatus: 'session-status',
  viewToggleBtn: 'view-toggle-btn',
  sessionDetachBtn: 'session-detach-btn',

  /** Session Archive selectors (verified 2026-02-10) */
  sessionArchiveOverlay: 'session-archive-overlay',
  sessionArchivePanel: 'session-archive-panel',
  archiveHeader: 'archive-header',
  archiveCloseBtn: 'archive-close-btn',
  archiveEmpty: 'archive-empty',
  archiveList: 'archive-list',
  archiveItem: 'archive-item',
  archiveSessionId: 'archive-session-id',
  archiveStatusBadge: 'archive-status-badge',
  restoreBtn: 'restore-btn',
  deleteBtn: 'delete-btn',
} as const;

/**
 * API endpoints
 */
export const API_ENDPOINTS = {
  health: '/health',
  sessions: '/api/sessions',
  sessionById: (id: string) => `/api/sessions/${id}`,
  sessionChat: (id: string) => `/api/sessions/${id}/chat`,
  sessionInput: (id: string) => `/api/sessions/${id}/input`,
  sessionAwaiting: (id: string) => `/api/sessions/${id}/awaiting`,
  sessionChains: (id: string) => `/api/sessions/${id}/chains`,
  sessionFreshness: (id: string) => `/api/sessions/${id}/freshness`,
} as const;

/**
 * Respect Check Types
 */
export interface RespectCheckViolation {
  type: string;
  severity: 'high' | 'medium' | 'low';
  message: string;
  expected: string;
  actual: string;
}

export interface ComponentCheckResult {
  selector: string;
  type: string;
  violations: RespectCheckViolation[];
  metrics: {
    width: number;
    height: number;
    scrollWidth: number;
    scrollHeight: number;
    clientWidth: number;
    clientHeight: number;
  };
}

export interface RespectCheckResult {
  timestamp: string;
  viewportWidth: number;
  viewportHeight: number;
  totalChecked: number;
  totalElementsFound: number;
  totalViolations: number;
  violations: ComponentCheckResult[];
  summary: { high: number; medium: number; low: number };
  clean: Array<{ selector: string; type: string; width: number; height: number }>;
}
