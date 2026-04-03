/**
 * Approval Service
 *
 * Manages the human-in-the-loop approval gate lifecycle:
 * - Per-workbench autonomy levels (full, supervised, restricted)
 * - Approval request creation, polling, and resolution
 * - Auto-timeout (120s) for unanswered requests
 * - Destructive action detection for supervised mode
 */

import type { ApprovalRequest, AutonomyLevel } from '@afw/shared';
import { DEFAULT_AUTONOMY_LEVELS } from '@afw/shared';

/** Actions classified as destructive (per D-11) */
const DESTRUCTIVE_ACTIONS = [
  'delete_files',
  'remove_directory',
  'force_push',
  'drop_table',
  'git_reset_hard',
];

/** Timeout duration for approval requests (120 seconds) */
const APPROVAL_TIMEOUT_MS = 120_000;

/**
 * ApprovalService manages the approval request lifecycle
 * and per-workbench autonomy levels.
 */
export class ApprovalService {
  private autonomyLevels: Map<string, AutonomyLevel>;
  private pendingRequests: Map<string, ApprovalRequest>;
  private requestTimeouts: Map<string, NodeJS.Timeout>;

  constructor() {
    this.autonomyLevels = new Map(Object.entries(DEFAULT_AUTONOMY_LEVELS));
    this.pendingRequests = new Map();
    this.requestTimeouts = new Map();
  }

  /**
   * Get the autonomy level for a workbench.
   * Returns 'supervised' as default for unknown workbenches.
   */
  getAutonomyLevel(workbenchId: string): AutonomyLevel {
    return this.autonomyLevels.get(workbenchId) ?? 'supervised';
  }

  /**
   * Set the autonomy level for a workbench.
   */
  setAutonomyLevel(workbenchId: string, level: AutonomyLevel): void {
    this.autonomyLevels.set(workbenchId, level);
    console.log(`[ApprovalService] Autonomy level for ${workbenchId} set to ${level}`);
  }

  /**
   * Determine whether an action requires human approval
   * based on the workbench's autonomy level.
   *
   * - full: never needs approval
   * - restricted: always needs approval
   * - supervised: only destructive actions need approval
   */
  needsApproval(workbenchId: string, action: string): boolean {
    const level = this.getAutonomyLevel(workbenchId);

    switch (level) {
      case 'full':
        return false;
      case 'restricted':
        return true;
      case 'supervised':
        return DESTRUCTIVE_ACTIONS.includes(action);
      default:
        // Unknown level, default to requiring approval
        return true;
    }
  }

  /**
   * Create a new approval request.
   * Starts a 120s auto-timeout that resolves as 'timed_out'.
   */
  createRequest(params: {
    action: string;
    description: string;
    files?: string[];
    workbenchId: string;
    sessionId: string;
  }): ApprovalRequest {
    const id = `approval_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + APPROVAL_TIMEOUT_MS);

    const request: ApprovalRequest = {
      id,
      action: params.action,
      description: params.description,
      files: params.files,
      workbenchId: params.workbenchId,
      autonomyLevel: this.getAutonomyLevel(params.workbenchId),
      status: 'pending',
      expiresAt: expiresAt.toISOString(),
      sessionId: params.sessionId,
    };

    this.pendingRequests.set(id, request);

    // Set auto-timeout
    const timeout = setTimeout(() => {
      const req = this.pendingRequests.get(id);
      if (req && req.status === 'pending') {
        req.status = 'timed_out';
        req.resolvedAt = new Date().toISOString();
        console.log(`[ApprovalService] Request ${id} timed out after ${APPROVAL_TIMEOUT_MS / 1000}s`);
      }
      this.requestTimeouts.delete(id);
    }, APPROVAL_TIMEOUT_MS);

    this.requestTimeouts.set(id, timeout);

    console.log(`[ApprovalService] Created approval request ${id} for action '${params.action}' on workbench '${params.workbenchId}'`);
    return request;
  }

  /**
   * Get an approval request by ID.
   * Returns null if not found.
   */
  getRequest(id: string): ApprovalRequest | null {
    return this.pendingRequests.get(id) ?? null;
  }

  /**
   * Resolve an approval request (approve or deny).
   * Returns null if not found or already resolved.
   * Clears the auto-timeout timer.
   */
  resolveRequest(id: string, status: 'approved' | 'denied'): ApprovalRequest | null {
    const request = this.pendingRequests.get(id);
    if (!request || request.status !== 'pending') {
      return null;
    }

    request.status = status;
    request.resolvedAt = new Date().toISOString();

    // Clear the timeout
    const timeout = this.requestTimeouts.get(id);
    if (timeout) {
      clearTimeout(timeout);
      this.requestTimeouts.delete(id);
    }

    console.log(`[ApprovalService] Request ${id} resolved as '${status}'`);
    return request;
  }

  /**
   * Clean up all pending timeouts (for graceful shutdown).
   */
  cleanup(): void {
    for (const [id, timeout] of this.requestTimeouts) {
      clearTimeout(timeout);
    }
    this.requestTimeouts.clear();
    console.log('[ApprovalService] Cleanup complete');
  }
}

/** Singleton instance for production use */
export const approvalService = new ApprovalService();
