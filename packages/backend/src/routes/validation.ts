/**
 * Validation Routes
 *
 * Receives violation reports from Claude Code hooks and broadcasts
 * them via WebSocket to the appropriate workbench channel.
 */

import { Router } from 'express';
import type { ViolationSignal, ViolationSeverity } from '@afw/shared';
import type { WebSocketHub } from '../ws/hub.js';

const router = Router();

/**
 * POST /violations
 * Receives violation reports from hooks and broadcasts via WebSocket.
 */
router.post('/violations', (req, res) => {
  try {
    const { filePath, violations, sessionId, timestamp, severity } = req.body as {
      filePath: string;
      violations: string[];
      sessionId: string;
      timestamp: string;
      severity?: string;
    };

    if (!filePath || !violations || !Array.isArray(violations) || !sessionId) {
      res.status(400).json({ error: 'Missing required fields: filePath, violations, sessionId' });
      return;
    }

    const hub = req.app.locals.wsHub as WebSocketHub | undefined;
    const violationSeverity: ViolationSeverity = (severity as ViolationSeverity) || 'critical';

    // Determine workbench channel from session context
    // If no mapping found, use _system channel as fallback
    const workbenchId = (req.body.workbenchId as string) || '_system';

    const signals: ViolationSignal[] = violations.map((violation, index) => {
      // Try to extract rule name from violation string (e.g., "[no-raw-hex] Raw hex color found")
      const ruleMatch = violation.match(/^\[([^\]]+)\]/);
      const rule = ruleMatch ? ruleMatch[1]! : 'unknown';
      const description = ruleMatch ? violation.slice(ruleMatch[0].length).trim() : violation;

      const signal: ViolationSignal = {
        id: `viol_${Date.now()}_${index}`,
        severity: violationSeverity,
        rule,
        description,
        filePath,
        line: 0,
        timestamp: timestamp || new Date().toISOString(),
        resolved: false,
      };

      // Broadcast to workbench channel via WebSocket
      if (hub) {
        const envelope = JSON.stringify({
          channel: workbenchId,
          type: 'validation:violation',
          payload: signal,
          ts: new Date().toISOString(),
        });
        hub.broadcast(workbenchId, envelope);
      }

      return signal;
    });

    console.log(`[Validation] Received ${violations.length} violation(s) for ${filePath}, broadcast to channel '${workbenchId}'`);

    res.status(200).json({ received: true, count: violations.length });
  } catch (error) {
    console.error('[Validation] Error processing violations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /violations
 * Placeholder for future violation history query.
 */
router.get('/violations', (_req, res) => {
  res.status(200).json({ violations: [] });
});

export default router;
