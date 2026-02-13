/**
 * Slack Webhook Routes (Stub)
 * Handles Slack events and slash commands
 * Part of Phase 2A — Multi-Surface Orchestration (Thread 1)
 */

import { Router } from 'express';
import crypto from 'crypto';
import { surfaceManager } from '../../services/surfaceManager.js';
import { SlackAdapter } from '../../surfaces/SlackAdapter.js';

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

export default router;
