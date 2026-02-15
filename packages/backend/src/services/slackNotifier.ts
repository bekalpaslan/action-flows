/**
 * Slack Notification Service
 *
 * Formats Slack messages for chain completions, reviews, deployments, etc.
 * Provides HTTP API endpoints for the orchestrator to trigger notifications.
 *
 * IMPORTANT: This service does NOT make MCP tool calls directly.
 * The orchestrator calls our HTTP API, then uses Slack MCP tools to actually post messages.
 * This separation allows backend services to trigger Slack notifications without MCP access.
 */

import type {
  SlackConfig,
  SlackNotification,
  ChainCompletionNotification,
  ReviewCompletionNotification,
  DeploymentNotification,
  TestFailureNotification,
  SlackNotificationLevel,
} from '@afw/shared';
import { DEFAULT_SLACK_CONFIG } from '@afw/shared';

/**
 * SlackNotifier Service
 *
 * Responsibilities:
 * - Format notification messages
 * - Provide notification data via HTTP API
 * - Track notification history
 * - Apply notification level filtering
 */
export class SlackNotifier {
  private config: SlackConfig;
  private notificationHistory: Array<{
    timestamp: number;
    channel: string;
    text: string;
    level: SlackNotificationLevel;
  }> = [];

  constructor(config: SlackConfig = DEFAULT_SLACK_CONFIG) {
    this.config = config;
  }

  /**
   * Update Slack configuration
   */
  updateConfig(config: Partial<SlackConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): SlackConfig {
    return { ...this.config };
  }

  /**
   * Check if notification should be sent based on level filter
   */
  private shouldSendNotification(level: SlackNotificationLevel): boolean {
    if (!this.config.enabled) {
      return false;
    }

    const levelPriority: Record<string, number> = { info: 1, important: 2, critical: 3 };
    const configPriority = levelPriority[this.config.notificationLevel] || 1;
    const notificationPriority = levelPriority[level] || 1;

    return notificationPriority >= configPriority;
  }

  /**
   * Format chain completion notification
   */
  formatChainCompletion(data: ChainCompletionNotification): SlackNotification {
    const statusEmoji: Record<string, string> = {
      success: '✅',
      partial: '⚠️',
      failed: '❌',
    };

    const level: SlackNotificationLevel =
      data.status === 'failed' ? 'critical' :
      data.status === 'partial' ? 'important' : 'info';

    const emoji = statusEmoji[data.status] || '❓';
    let text = `${emoji} *Chain Complete:* ${data.chainTitle}\n`;
    text += `*Steps:* ${data.steps} | *Status:* ${data.status}\n`;
    text += `*Logs:* \`${data.logPath}\``;

    if (data.error) {
      text += `\n*Error:* ${data.error}`;
    }

    return {
      channel: this.config.defaultChannel,
      text,
      level,
    };
  }

  /**
   * Format review completion notification
   */
  formatReviewCompletion(data: ReviewCompletionNotification): SlackNotification {
    const verdictEmoji = data.verdict === 'APPROVED' ? '✅' : '⚠️';
    const level: SlackNotificationLevel = data.verdict === 'APPROVED' ? 'info' : 'important';

    let text = `${verdictEmoji} *Review Complete:* ${data.reviewTitle}\n`;
    text += `*Verdict:* ${data.verdict} | *Score:* ${data.score}/100\n`;
    text += `*Findings:* ${data.findingsCount}\n`;
    text += `*Report:* \`${data.reportPath}\``;

    return {
      channel: this.config.defaultChannel,
      text,
      level,
    };
  }

  /**
   * Format deployment notification
   */
  formatDeployment(data: DeploymentNotification): SlackNotification {
    const statusEmoji: Record<string, string> = {
      started: '🚀',
      success: '✅',
      failed: '❌',
    };

    const level: SlackNotificationLevel =
      data.status === 'failed' ? 'critical' : 'important';

    const emoji = statusEmoji[data.status] || '❓';
    let text = `${emoji} *Deployment ${data.status}:* ${data.environment}\n`;
    text += `*Version:* \`${data.version}\``;

    if (data.error) {
      text += `\n*Error:* ${data.error}`;
    }

    return {
      channel: this.config.defaultChannel,
      text,
      level,
    };
  }

  /**
   * Format test failure notification
   */
  formatTestFailure(data: TestFailureNotification): SlackNotification {
    let text = `❌ *Test Failures:* ${data.suite}\n`;
    text += `*Failed:* ${data.failedCount}/${data.totalCount}\n`;

    if (data.errors.length > 0) {
      text += `*Errors:*\n`;
      data.errors.slice(0, 3).forEach((error: string, i: number) => {
        text += `${i + 1}. ${error}\n`;
      });
      if (data.errors.length > 3) {
        text += `... and ${data.errors.length - 3} more`;
      }
    }

    return {
      channel: this.config.defaultChannel,
      text,
      level: 'critical',
    };
  }

  /**
   * Prepare chain completion notification
   * Returns notification object if it should be sent, null otherwise
   */
  async prepareChainCompletion(data: ChainCompletionNotification): Promise<SlackNotification | null> {
    const notification = this.formatChainCompletion(data);

    if (!this.shouldSendNotification(notification.level)) {
      return null;
    }

    this.logNotification(notification);
    return notification;
  }

  /**
   * Prepare review completion notification
   */
  async prepareReviewCompletion(data: ReviewCompletionNotification): Promise<SlackNotification | null> {
    const notification = this.formatReviewCompletion(data);

    if (!this.shouldSendNotification(notification.level)) {
      return null;
    }

    this.logNotification(notification);
    return notification;
  }

  /**
   * Prepare deployment notification
   */
  async prepareDeployment(data: DeploymentNotification): Promise<SlackNotification | null> {
    const notification = this.formatDeployment(data);

    if (!this.shouldSendNotification(notification.level)) {
      return null;
    }

    this.logNotification(notification);
    return notification;
  }

  /**
   * Prepare test failure notification
   */
  async prepareTestFailure(data: TestFailureNotification): Promise<SlackNotification | null> {
    const notification = this.formatTestFailure(data);

    if (!this.shouldSendNotification(notification.level)) {
      return null;
    }

    this.logNotification(notification);
    return notification;
  }

  /**
   * Log notification to history
   */
  private logNotification(notification: SlackNotification): void {
    this.notificationHistory.push({
      timestamp: Date.now(),
      channel: notification.channel,
      text: notification.text,
      level: notification.level,
    });

    // Keep only last 100 notifications
    if (this.notificationHistory.length > 100) {
      this.notificationHistory = this.notificationHistory.slice(-100);
    }

    console.log(`[Slack] Prepared notification (${notification.level}):`, notification.text.split('\n')[0]);
  }

  /**
   * Get notification history
   */
  getHistory(limit: number = 50): typeof this.notificationHistory {
    return this.notificationHistory.slice(-limit);
  }

  /**
   * Clear notification history
   */
  clearHistory(): void {
    this.notificationHistory = [];
  }
}

/**
 * Singleton instance
 */
export let slackNotifier: SlackNotifier;

/**
 * Initialize Slack notifier with configuration
 */
export function initializeSlackNotifier(config?: Partial<SlackConfig>): void {
  const enabled = process.env.SLACK_NOTIFICATIONS_ENABLED === 'true';
  const defaultChannel = process.env.SLACK_DEFAULT_CHANNEL || '#cityzen-dev';

  const finalConfig: SlackConfig = {
    ...DEFAULT_SLACK_CONFIG,
    ...config,
    enabled,
    defaultChannel,
  };

  slackNotifier = new SlackNotifier(finalConfig);

  console.log('[Slack] Notifier initialized:', {
    enabled: finalConfig.enabled,
    defaultChannel: finalConfig.defaultChannel,
    notificationLevel: finalConfig.notificationLevel,
  });
}
