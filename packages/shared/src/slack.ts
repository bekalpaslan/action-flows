/**
 * Slack MCP Integration Types
 * Shared types for Slack notification service
 */

/**
 * Slack configuration
 */
export interface SlackConfig {
  /** Whether Slack notifications are enabled */
  enabled: boolean;

  /** Default channel for notifications */
  defaultChannel: string;

  /** Notification level filter */
  notificationLevel: 'all' | 'important' | 'critical';

  /** Whether to use MCP tools (orchestrator) or HTTP API (backend) */
  mode: 'mcp' | 'api';
}

/**
 * Slack notification priority levels
 */
export type SlackNotificationLevel = 'info' | 'important' | 'critical';

/**
 * Slack channel information
 */
export interface SlackChannel {
  /** Channel ID */
  id: string;

  /** Channel name (without #) */
  name: string;

  /** Whether this is a private channel */
  isPrivate: boolean;

  /** Whether the bot is a member */
  isMember: boolean;
}

/**
 * Slack notification message
 */
export interface SlackNotification {
  /** Target channel (ID or name) */
  channel: string;

  /** Message text (markdown supported) */
  text: string;

  /** Notification level */
  level: SlackNotificationLevel;

  /** Optional thread timestamp (for replies) */
  threadTs?: string;

  /** Optional blocks for rich formatting */
  blocks?: any[];

  /** Optional attachments */
  attachments?: any[];
}

/**
 * Chain completion notification data
 */
export interface ChainCompletionNotification {
  /** Chain title/description */
  chainTitle: string;

  /** Number of steps completed */
  steps: number;

  /** Completion status */
  status: 'success' | 'partial' | 'failed';

  /** Path to execution log */
  logPath: string;

  /** Optional error message */
  error?: string;
}

/**
 * Review completion notification data
 */
export interface ReviewCompletionNotification {
  /** Review title */
  reviewTitle: string;

  /** Review verdict */
  verdict: 'APPROVED' | 'NEEDS_CHANGES';

  /** Review score (0-100) */
  score: number;

  /** Number of findings */
  findingsCount: number;

  /** Path to review report */
  reportPath: string;
}

/**
 * Deployment notification data
 */
export interface DeploymentNotification {
  /** Environment (dev, staging, prod) */
  environment: string;

  /** Deployment status */
  status: 'started' | 'success' | 'failed';

  /** Commit hash or version */
  version: string;

  /** Optional error message */
  error?: string;
}

/**
 * Test failure notification data
 */
export interface TestFailureNotification {
  /** Test suite name */
  suite: string;

  /** Number of failed tests */
  failedCount: number;

  /** Total number of tests */
  totalCount: number;

  /** Error summary */
  errors: string[];
}

/**
 * Default Slack configuration
 */
export const DEFAULT_SLACK_CONFIG: SlackConfig = {
  enabled: false,
  defaultChannel: '#cityzen-dev',
  notificationLevel: 'important',
  mode: 'api',
};
