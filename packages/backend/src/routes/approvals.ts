/**
 * Approval Routes
 *
 * Human-in-the-loop approval gate endpoints.
 * Manages per-workbench autonomy levels and the approval request lifecycle:
 * create, poll status, resolve (approve/deny/timeout).
 */

import { Router } from 'express';
import { approvalService } from '../services/approvalService.js';
import type { AutonomyLevel } from '@afw/shared';
import type { WebSocketHub } from '../ws/hub.js';

const VALID_AUTONOMY_LEVELS: AutonomyLevel[] = ['full', 'supervised', 'restricted'];

const router = Router();

/**
 * GET /autonomy/:workbenchId
 * Get the autonomy level for a workbench.
 */
router.get('/autonomy/:workbenchId', (req, res) => {
  const { workbenchId } = req.params;
  const autonomyLevel = approvalService.getAutonomyLevel(workbenchId!);
  res.status(200).json({ workbenchId, autonomyLevel });
});

/**
 * PUT /autonomy/:workbenchId
 * Set the autonomy level for a workbench.
 * Body: { level: AutonomyLevel }
 */
router.put('/autonomy/:workbenchId', (req, res) => {
  const { workbenchId } = req.params;
  const { level } = req.body as { level: AutonomyLevel };

  if (!level || !VALID_AUTONOMY_LEVELS.includes(level)) {
    res.status(400).json({ error: `Invalid level: must be one of ${VALID_AUTONOMY_LEVELS.join(', ')}` });
    return;
  }

  approvalService.setAutonomyLevel(workbenchId!, level);
  res.status(200).json({ workbenchId, autonomyLevel: level });
});

/**
 * POST /request
 * Create a new approval request.
 * Body: { action, description, files?, workbenchId, sessionId }
 *
 * If the action doesn't require approval (based on autonomy level),
 * returns immediately with { approved: true, autoApproved: true }.
 */
router.post('/request', (req, res) => {
  try {
    const { action, description, files, workbenchId, sessionId } = req.body as {
      action: string;
      description: string;
      files?: string[];
      workbenchId: string;
      sessionId: string;
    };

    if (!action || !description || !workbenchId || !sessionId) {
      res.status(400).json({ error: 'Missing required fields: action, description, workbenchId, sessionId' });
      return;
    }

    // Check if approval is needed
    if (!approvalService.needsApproval(workbenchId, action)) {
      res.status(200).json({ approved: true, autoApproved: true });
      return;
    }

    // Create approval request
    const request = approvalService.createRequest({
      action,
      description,
      files,
      workbenchId,
      sessionId,
    });

    // Broadcast approval request via WebSocket
    const hub = req.app.locals.wsHub as WebSocketHub | undefined;
    if (hub) {
      const envelope = JSON.stringify({
        channel: workbenchId,
        type: 'approval:request',
        payload: request,
        ts: new Date().toISOString(),
      });
      hub.broadcast(workbenchId, envelope);
    }

    res.status(201).json({ request });
  } catch (error) {
    console.error('[Approvals] Error creating request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /:id/status
 * Poll the status of an approval request.
 * Used by hooks to check if the request was approved/denied.
 */
router.get('/:id/status', (req, res) => {
  const { id } = req.params;
  const request = approvalService.getRequest(id!);

  if (!request) {
    res.status(404).json({ error: 'Approval request not found' });
    return;
  }

  res.status(200).json({
    status: request.status,
    resolvedAt: request.resolvedAt,
  });
});

/**
 * POST /:id/resolve
 * Resolve an approval request (approve or deny).
 * Body: { status: 'approved' | 'denied' }
 */
router.post('/:id/resolve', (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body as { status: 'approved' | 'denied' };

    if (!status || !['approved', 'denied'].includes(status)) {
      res.status(400).json({ error: "Invalid status: must be 'approved' or 'denied'" });
      return;
    }

    const resolved = approvalService.resolveRequest(id!, status);

    if (!resolved) {
      res.status(404).json({ error: 'Approval request not found or already resolved' });
      return;
    }

    // Broadcast resolution via WebSocket
    const hub = req.app.locals.wsHub as WebSocketHub | undefined;
    if (hub) {
      const envelope = JSON.stringify({
        channel: resolved.workbenchId,
        type: 'approval:resolved',
        payload: resolved,
        ts: new Date().toISOString(),
      });
      hub.broadcast(resolved.workbenchId, envelope);
    }

    res.status(200).json({ request: resolved });
  } catch (error) {
    console.error('[Approvals] Error resolving request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
