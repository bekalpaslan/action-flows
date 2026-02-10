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
  | 'list_console_messages';

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
} as const;

/**
 * API endpoints
 */
export const API_ENDPOINTS = {
  health: '/health',
  sessions: '/api/sessions',
  sessionById: (id: string) => `/api/sessions/${id}`,
  sessionChat: (id: string) => `/api/sessions/${id}/chat`,
} as const;
