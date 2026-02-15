/**
 * Tests for SlackNotifier Service
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SlackNotifier } from '../services/slackNotifier.js';
import type {
  SlackConfig,
  ChainCompletionNotification,
  ReviewCompletionNotification,
  DeploymentNotification,
  TestFailureNotification,
} from '@afw/shared';

describe('SlackNotifier', () => {
  let notifier: SlackNotifier;

  beforeEach(() => {
    notifier = new SlackNotifier({
      enabled: true,
      defaultChannel: '#test-channel',
      notificationLevel: 'info',
      mode: 'api',
    });
  });

  describe('Configuration', () => {
    it('should initialize with default config', () => {
      const config = notifier.getConfig();
      expect(config.enabled).toBe(true);
      expect(config.defaultChannel).toBe('#test-channel');
      expect(config.notificationLevel).toBe('info');
    });

    it('should update config', () => {
      notifier.updateConfig({ defaultChannel: '#new-channel' });
      const config = notifier.getConfig();
      expect(config.defaultChannel).toBe('#new-channel');
    });
  });

  describe('Notification Level Filtering', () => {
    it('should send all notifications when level is "all"', async () => {
      notifier.updateConfig({ notificationLevel: 'all' });

      const infoNotif = await notifier.prepareChainCompletion({
        chainTitle: 'Test Chain',
        steps: 3,
        status: 'success',
        logPath: '/logs/test.md',
      });

      expect(infoNotif).not.toBeNull();
      expect(infoNotif?.level).toBe('info');
    });

    it('should filter info notifications when level is "important"', async () => {
      notifier.updateConfig({ notificationLevel: 'important' });

      const infoNotif = await notifier.prepareChainCompletion({
        chainTitle: 'Test Chain',
        steps: 3,
        status: 'success',
        logPath: '/logs/test.md',
      });

      expect(infoNotif).toBeNull();
    });

    it('should send important notifications when level is "important"', async () => {
      notifier.updateConfig({ notificationLevel: 'important' });

      const importantNotif = await notifier.prepareChainCompletion({
        chainTitle: 'Test Chain',
        steps: 3,
        status: 'partial',
        logPath: '/logs/test.md',
      });

      expect(importantNotif).not.toBeNull();
      expect(importantNotif?.level).toBe('important');
    });

    it('should only send critical notifications when level is "critical"', async () => {
      notifier.updateConfig({ notificationLevel: 'critical' });

      const failedNotif = await notifier.prepareChainCompletion({
        chainTitle: 'Test Chain',
        steps: 3,
        status: 'failed',
        logPath: '/logs/test.md',
        error: 'Something broke',
      });

      expect(failedNotif).not.toBeNull();
      expect(failedNotif?.level).toBe('critical');
    });

    it('should not send notifications when disabled', async () => {
      notifier.updateConfig({ enabled: false });

      const notification = await notifier.prepareChainCompletion({
        chainTitle: 'Test Chain',
        steps: 3,
        status: 'success',
        logPath: '/logs/test.md',
      });

      expect(notification).toBeNull();
    });
  });

  describe('Chain Completion Notifications', () => {
    it('should format successful chain completion', () => {
      const data: ChainCompletionNotification = {
        chainTitle: 'Feature Implementation',
        steps: 5,
        status: 'success',
        logPath: '/logs/chain-123.md',
      };

      const notification = notifier.formatChainCompletion(data);

      expect(notification.text).toContain('✅');
      expect(notification.text).toContain('Feature Implementation');
      expect(notification.text).toContain('5');
      expect(notification.text).toContain('success');
      expect(notification.text).toContain('/logs/chain-123.md');
      expect(notification.level).toBe('info');
    });

    it('should format partial chain completion', () => {
      const data: ChainCompletionNotification = {
        chainTitle: 'Bug Fix',
        steps: 3,
        status: 'partial',
        logPath: '/logs/chain-456.md',
      };

      const notification = notifier.formatChainCompletion(data);

      expect(notification.text).toContain('⚠️');
      expect(notification.text).toContain('partial');
      expect(notification.level).toBe('important');
    });

    it('should format failed chain completion with error', () => {
      const data: ChainCompletionNotification = {
        chainTitle: 'Deployment',
        steps: 2,
        status: 'failed',
        logPath: '/logs/chain-789.md',
        error: 'Build failed: Type error in module',
      };

      const notification = notifier.formatChainCompletion(data);

      expect(notification.text).toContain('❌');
      expect(notification.text).toContain('failed');
      expect(notification.text).toContain('Build failed: Type error in module');
      expect(notification.level).toBe('critical');
    });
  });

  describe('Review Completion Notifications', () => {
    it('should format approved review', () => {
      const data: ReviewCompletionNotification = {
        reviewTitle: 'Code Review: Auth Module',
        verdict: 'APPROVED',
        score: 95,
        findingsCount: 2,
        reportPath: '/logs/review-123.md',
      };

      const notification = notifier.formatReviewCompletion(data);

      expect(notification.text).toContain('✅');
      expect(notification.text).toContain('APPROVED');
      expect(notification.text).toContain('95/100');
      expect(notification.level).toBe('info');
    });

    it('should format needs-changes review', () => {
      const data: ReviewCompletionNotification = {
        reviewTitle: 'Security Audit',
        verdict: 'NEEDS_CHANGES',
        score: 65,
        findingsCount: 8,
        reportPath: '/logs/review-456.md',
      };

      const notification = notifier.formatReviewCompletion(data);

      expect(notification.text).toContain('⚠️');
      expect(notification.text).toContain('NEEDS_CHANGES');
      expect(notification.text).toContain('65/100');
      expect(notification.text).toContain('8');
      expect(notification.level).toBe('important');
    });
  });

  describe('Deployment Notifications', () => {
    it('should format deployment started', () => {
      const data: DeploymentNotification = {
        environment: 'production',
        status: 'started',
        version: 'v1.2.3',
      };

      const notification = notifier.formatDeployment(data);

      expect(notification.text).toContain('🚀');
      expect(notification.text).toContain('production');
      expect(notification.text).toContain('v1.2.3');
      expect(notification.level).toBe('important');
    });

    it('should format successful deployment', () => {
      const data: DeploymentNotification = {
        environment: 'staging',
        status: 'success',
        version: 'v1.2.4',
      };

      const notification = notifier.formatDeployment(data);

      expect(notification.text).toContain('✅');
      expect(notification.text).toContain('staging');
    });

    it('should format failed deployment with error', () => {
      const data: DeploymentNotification = {
        environment: 'production',
        status: 'failed',
        version: 'v1.2.5',
        error: 'Database migration failed',
      };

      const notification = notifier.formatDeployment(data);

      expect(notification.text).toContain('❌');
      expect(notification.text).toContain('Database migration failed');
      expect(notification.level).toBe('critical');
    });
  });

  describe('Test Failure Notifications', () => {
    it('should format test failures', () => {
      const data: TestFailureNotification = {
        suite: 'Backend Unit Tests',
        failedCount: 3,
        totalCount: 150,
        errors: [
          'TypeError: Cannot read property "id" of undefined',
          'AssertionError: Expected 200 but got 404',
          'ReferenceError: storage is not defined',
        ],
      };

      const notification = notifier.formatTestFailure(data);

      expect(notification.text).toContain('❌');
      expect(notification.text).toContain('Backend Unit Tests');
      expect(notification.text).toContain('3/150');
      expect(notification.text).toContain('TypeError');
      expect(notification.text).toContain('AssertionError');
      expect(notification.text).toContain('ReferenceError');
      expect(notification.level).toBe('critical');
    });

    it('should truncate long error lists', () => {
      const data: TestFailureNotification = {
        suite: 'Frontend Tests',
        failedCount: 10,
        totalCount: 200,
        errors: [
          'Error 1',
          'Error 2',
          'Error 3',
          'Error 4',
          'Error 5',
        ],
      };

      const notification = notifier.formatTestFailure(data);

      expect(notification.text).toContain('Error 1');
      expect(notification.text).toContain('Error 2');
      expect(notification.text).toContain('Error 3');
      expect(notification.text).toContain('... and 2 more');
    });
  });

  describe('Notification History', () => {
    it('should track notification history', async () => {
      await notifier.prepareChainCompletion({
        chainTitle: 'Chain 1',
        steps: 1,
        status: 'success',
        logPath: '/logs/1.md',
      });

      await notifier.prepareChainCompletion({
        chainTitle: 'Chain 2',
        steps: 2,
        status: 'success',
        logPath: '/logs/2.md',
      });

      const history = notifier.getHistory();
      expect(history).toHaveLength(2);
      expect(history[0].text).toContain('Chain 1');
      expect(history[1].text).toContain('Chain 2');
    });

    it('should limit history to 100 entries', async () => {
      // Add 150 notifications
      for (let i = 0; i < 150; i++) {
        await notifier.prepareChainCompletion({
          chainTitle: `Chain ${i}`,
          steps: 1,
          status: 'success',
          logPath: `/logs/${i}.md`,
        });
      }

      const history = notifier.getHistory(200);
      expect(history.length).toBeLessThanOrEqual(100);
    });

    it('should clear history', async () => {
      await notifier.prepareChainCompletion({
        chainTitle: 'Test Chain',
        steps: 1,
        status: 'success',
        logPath: '/logs/test.md',
      });

      notifier.clearHistory();
      const history = notifier.getHistory();
      expect(history).toHaveLength(0);
    });
  });
});
