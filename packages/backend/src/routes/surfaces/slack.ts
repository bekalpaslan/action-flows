/**
 * Slack Webhook Routes & Notification API
 * Handles Slack events, slash commands, and notification preparation
 * Part of Phase 2A — Multi-Surface Orchestration (Thread 1)
 */

import { Router } from 'express';
import crypto from 'crypto';
import { surfaceManager } from '../../services/surfaceManager.js';
import { SlackAdapter } from '../../surfaces/SlackAdapter.js';
import { slackNotifier } from '../../services/slackNotifier.js';
import type {
  ChainCompletionNotification,
  ReviewCompletionNotification,
  DeploymentNotification,
  TestFailureNotification,
} from '@afw/shared';

const router = Router();

// Initialize Slack adapter (singleton)
const slackAdapter = new SlackAdapter();
slackAdapter.initialize().catch((error) => {
  console.error('[Slack Routes] Failed to initialize adapter:', error);
});

/**
 * Verify Slack request signature
 * https://api.slack.com/authentication/verifying-requests-from-slack
 */
function verifySlackSignature(req: any): boolean {
  const signingSecret = process.env.SLACK_SIGNING_SECRET;

  if (!signingSecret) {
    console.warn('[Slack Security] SLACK_SIGNING_SECRET not configured - signature verification disabled');
    return true; // Allow requests when not configured (dev mode)
  }

  const slackSignature = req.headers['x-slack-signature'] as string;
  const timestamp = req.headers['x-slack-request-timestamp'] as string;

  if (!slackSignature || !timestamp) {
    console.error('[Slack Security] Missing signature or timestamp headers');
    return false;
  }

  // Prevent replay attacks (reject requests older than 5 minutes)
  const currentTime = Math.floor(Date.now() / 1000);
  if (Math.abs(currentTime - parseInt(timestamp, 10)) > 300) {
    console.error('[Slack Security] Request timestamp too old');
    return false;
  }

  // Compute HMAC-SHA256 signature
  const body = JSON.stringify(req.body);
  const sigBasestring = `v0:${timestamp}:${body}`;
  const mySignature = 'v0=' + crypto
    .createHmac('sha256', signingSecret)
    .update(sigBasestring)
    .digest('hex');

  // Constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(mySignature),
    Buffer.from(slackSignature)
  );
}

/**
 * @swagger
 * /api/surfaces/slack/events:
 *   post:
 *     summary: Slack events webhook endpoint
 *     tags: [surfaces, slack]
 *     description: Receives events from Slack (messages, reactions, etc.)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Event processed
 */
router.post('/events', async (req, res) => {
  try {
    // Slack sends a challenge when setting up the webhook
    if (req.body.type === 'url_verification') {
      res.json({ challenge: req.body.challenge });
      return;
    }

    // Verify Slack signature for security (Finding #7 fix)
    if (!verifySlackSignature(req)) {
      console.error('[Slack Webhook] Invalid signature');
      res.status(401).json({ error: 'Invalid signature' });
      return;
    }

    console.log('[Slack Webhook] Event received (stub):', req.body.type);

    // TODO: Handle different event types (message, app_mention, etc.)
    // TODO: Translate Slack event to SurfaceInput
    // TODO: Route to surfaceManager

    res.json({ success: true });
  } catch (error) {
    console.error('[Slack Webhook] Error handling event:', error);
    res.status(500).json({ error: 'Failed to handle event' });
  }
});

/**
 * @swagger
 * /api/surfaces/slack/commands:
 *   post:
 *     summary: Slack slash commands endpoint
 *     tags: [surfaces, slack]
 *     description: Handles Slack slash commands (e.g., /actionflows)
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Command processed
 */
router.post('/commands', async (req, res) => {
  try {
    // Verify Slack signature for security (Finding #7 fix)
    if (!verifySlackSignature(req)) {
      console.error('[Slack Webhook] Invalid signature');
      res.status(401).json({ error: 'Invalid signature' });
      return;
    }

    console.log('[Slack Webhook] Slash command received (stub):', req.body.command);

    // TODO: Parse slash command
    // TODO: Translate to SurfaceInput
    // TODO: Route to surfaceManager

    // Respond immediately to avoid timeout
    res.json({
      response_type: 'in_channel',
      text: 'ActionFlows received your command (stub)',
    });
  } catch (error) {
    console.error('[Slack Webhook] Error handling command:', error);
    res.status(500).json({ error: 'Failed to handle command' });
  }
});

/**
 * @swagger
 * /api/surfaces/slack/interactive:
 *   post:
 *     summary: Slack interactive components endpoint
 *     tags: [surfaces, slack]
 *     description: Handles button clicks, menu selections, etc.
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Interaction processed
 */
router.post('/interactive', async (req, res) => {
  try {
    // Verify Slack signature for security (Finding #7 fix)
    if (!verifySlackSignature(req)) {
      console.error('[Slack Webhook] Invalid signature');
      res.status(401).json({ error: 'Invalid signature' });
      return;
    }

    console.log('[Slack Webhook] Interactive component received (stub)');

    // TODO: Parse interactive payload
    // TODO: Handle button clicks, menu selections, etc.

    res.json({ success: true });
  } catch (error) {
    console.error('[Slack Webhook] Error handling interaction:', error);
    res.status(500).json({ error: 'Failed to handle interaction' });
  }
});

/**
 * @swagger
 * /api/surfaces/slack/notifications/config:
 *   get:
 *     summary: Get Slack notification configuration
 *     tags: [surfaces, slack, notifications]
 *     responses:
 *       200:
 *         description: Current Slack configuration
 *   put:
 *     summary: Update Slack notification configuration
 *     tags: [surfaces, slack, notifications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               enabled:
 *                 type: boolean
 *               defaultChannel:
 *                 type: string
 *               notificationLevel:
 *                 type: string
 *                 enum: [all, important, critical]
 *     responses:
 *       200:
 *         description: Configuration updated
 */
router.get('/notifications/config', (req, res) => {
  try {
    const config = slackNotifier.getConfig();
    res.json(config);
  } catch (error) {
    console.error('[Slack API] Error getting config:', error);
    res.status(500).json({ error: 'Failed to get configuration' });
  }
});

router.put('/notifications/config', (req, res) => {
  try {
    slackNotifier.updateConfig(req.body);
    const config = slackNotifier.getConfig();
    res.json(config);
  } catch (error) {
    console.error('[Slack API] Error updating config:', error);
    res.status(500).json({ error: 'Failed to update configuration' });
  }
});

/**
 * @swagger
 * /api/surfaces/slack/notifications/chain-completion:
 *   post:
 *     summary: Prepare chain completion notification
 *     tags: [surfaces, slack, notifications]
 *     description: Formats a chain completion notification. Orchestrator calls this, then uses MCP to post.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               chainTitle:
 *                 type: string
 *               steps:
 *                 type: number
 *               status:
 *                 type: string
 *                 enum: [success, partial, failed]
 *               logPath:
 *                 type: string
 *               error:
 *                 type: string
 *     responses:
 *       200:
 *         description: Notification prepared (returns formatted message)
 *       204:
 *         description: Notification filtered out (not sent based on config)
 */
router.post('/notifications/chain-completion', async (req, res) => {
  try {
    const data: ChainCompletionNotification = req.body;
    const notification = await slackNotifier.prepareChainCompletion(data);

    if (!notification) {
      res.status(204).send(); // Filtered out
      return;
    }

    res.json(notification);
  } catch (error) {
    console.error('[Slack API] Error preparing chain completion notification:', error);
    res.status(500).json({ error: 'Failed to prepare notification' });
  }
});

/**
 * @swagger
 * /api/surfaces/slack/notifications/review-completion:
 *   post:
 *     summary: Prepare review completion notification
 *     tags: [surfaces, slack, notifications]
 */
router.post('/notifications/review-completion', async (req, res) => {
  try {
    const data: ReviewCompletionNotification = req.body;
    const notification = await slackNotifier.prepareReviewCompletion(data);

    if (!notification) {
      res.status(204).send();
      return;
    }

    res.json(notification);
  } catch (error) {
    console.error('[Slack API] Error preparing review completion notification:', error);
    res.status(500).json({ error: 'Failed to prepare notification' });
  }
});

/**
 * @swagger
 * /api/surfaces/slack/notifications/deployment:
 *   post:
 *     summary: Prepare deployment notification
 *     tags: [surfaces, slack, notifications]
 */
router.post('/notifications/deployment', async (req, res) => {
  try {
    const data: DeploymentNotification = req.body;
    const notification = await slackNotifier.prepareDeployment(data);

    if (!notification) {
      res.status(204).send();
      return;
    }

    res.json(notification);
  } catch (error) {
    console.error('[Slack API] Error preparing deployment notification:', error);
    res.status(500).json({ error: 'Failed to prepare notification' });
  }
});

/**
 * @swagger
 * /api/surfaces/slack/notifications/test-failure:
 *   post:
 *     summary: Prepare test failure notification
 *     tags: [surfaces, slack, notifications]
 */
router.post('/notifications/test-failure', async (req, res) => {
  try {
    const data: TestFailureNotification = req.body;
    const notification = await slackNotifier.prepareTestFailure(data);

    if (!notification) {
      res.status(204).send();
      return;
    }

    res.json(notification);
  } catch (error) {
    console.error('[Slack API] Error preparing test failure notification:', error);
    res.status(500).json({ error: 'Failed to prepare notification' });
  }
});

/**
 * @swagger
 * /api/surfaces/slack/notifications/history:
 *   get:
 *     summary: Get notification history
 *     tags: [surfaces, slack, notifications]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Notification history
 */
router.get('/notifications/history', (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const history = slackNotifier.getHistory(limit);
    res.json(history);
  } catch (error) {
    console.error('[Slack API] Error getting notification history:', error);
    res.status(500).json({ error: 'Failed to get notification history' });
  }
});

export default router;
