/**
 * Healing Service
 *
 * Orchestrates the self-healing pipeline:
 * 1. Error detection -> error class filtering (D-01)
 * 2. Daily quota check / circuit breaker (D-02)
 * 3. Approval request creation (D-03)
 * 4. Outcome recording: approved -> succeeded/failed (D-04)
 *
 * Only runtime/build/test_failure errors trigger healing (not contract violations).
 * Circuit breaker stops after 2 attempts per workbench-flow pair per day.
 */

import crypto from 'crypto';
import type { Storage } from '../storage/index.js';
import type { HealingAttempt, HealingAttemptId, ErrorClass } from '@afw/shared';
import { HEALING_ERROR_CLASSES } from '@afw/shared';
import type { ApprovalService } from './approvalService.js';
import type { HealingQuotaTracker } from './healingQuotaTracker.js';

export class HealingService {
  private approvalService: ApprovalService;
  private quotaTracker: HealingQuotaTracker;
  private storage: Storage;

  constructor(
    approvalService: ApprovalService,
    quotaTracker: HealingQuotaTracker,
    storage: Storage
  ) {
    this.approvalService = approvalService;
    this.quotaTracker = quotaTracker;
    this.storage = storage;
  }

  /**
   * Handle a runtime error and initiate the healing flow.
   *
   * D-01: Only HEALING_ERROR_CLASSES trigger healing (not contract violations).
   * D-02: Check daily quota; return null if circuit breaker is active.
   * D-03: Create an approval request for human approval.
   *
   * Returns the HealingAttempt if created, or null if blocked.
   */
  async onRuntimeError(
    err: { message: string; errorClass: ErrorClass },
    ctx: { workbenchId: string; flowId: string; sessionId: string }
  ): Promise<HealingAttempt | null> {
    // D-01: Only healing-eligible error classes
    if (!HEALING_ERROR_CLASSES.includes(err.errorClass)) {
      console.log(`[HealingService] Skipping non-healable error class: ${err.errorClass}`);
      return null;
    }

    // D-02: Check daily quota / circuit breaker
    const quota = await this.quotaTracker.getTodayQuota(ctx.workbenchId, ctx.flowId);
    if (quota.attemptsUsed >= quota.maxAttempts) {
      console.log(`[HealingService] Circuit breaker active for ${ctx.workbenchId}:${ctx.flowId} (${quota.attemptsUsed}/${quota.maxAttempts})`);
      return null;
    }

    // D-03: Create approval request
    const approval = this.approvalService.createRequest({
      action: 'heal_runtime_error',
      description: `Attempt to heal: ${err.message} (attempt ${quota.attemptsUsed + 1}/${quota.maxAttempts} today)`,
      workbenchId: ctx.workbenchId,
      sessionId: ctx.sessionId,
    });

    // Create HealingAttempt record
    const attempt: HealingAttempt = {
      id: crypto.randomUUID() as HealingAttemptId,
      workbenchId: ctx.workbenchId,
      flowId: ctx.flowId,
      errorClass: err.errorClass,
      errorMessage: err.message,
      proposedFix: 'Agent will attempt to fix the error',
      status: 'awaiting_approval',
      createdAt: new Date().toISOString(),
    };

    // Store the attempt and correlate with approval ID
    if (this.storage.set) {
      await Promise.resolve(this.storage.set(`healingAttempt:${attempt.id}`, JSON.stringify(attempt)));
      await Promise.resolve(this.storage.set(`healingApprovalMap:${approval.id}`, attempt.id));
    }

    console.log(`[HealingService] Created healing attempt ${attempt.id} for ${err.errorClass}: ${err.message}`);
    return attempt;
  }

  /**
   * Resolve a healing attempt based on approval decision.
   *
   * If approved: increment quota, set status to 'approved'.
   * If declined: set status to 'declined'.
   */
  async resolveHealing(
    approvalId: string,
    decision: 'approved' | 'declined'
  ): Promise<HealingAttempt | null> {
    // Look up attempt ID from approval mapping
    const attemptId = this.storage.get
      ? await Promise.resolve(this.storage.get(`healingApprovalMap:${approvalId}`))
      : null;
    if (!attemptId) {
      console.warn(`[HealingService] No healing attempt found for approval ${approvalId}`);
      return null;
    }

    // Read the attempt
    const raw = this.storage.get
      ? await Promise.resolve(this.storage.get(`healingAttempt:${attemptId}`))
      : null;
    if (!raw) {
      console.warn(`[HealingService] Healing attempt ${attemptId} not found in storage`);
      return null;
    }

    const attempt = JSON.parse(raw) as HealingAttempt;

    if (decision === 'approved') {
      // Increment quota on approval
      await this.quotaTracker.incrementAttempt(attempt.workbenchId, attempt.flowId);
      attempt.status = 'approved';
      console.log(`[HealingService] Healing attempt ${attemptId} approved`);
    } else {
      attempt.status = 'declined';
      console.log(`[HealingService] Healing attempt ${attemptId} declined`);
    }

    attempt.resolvedAt = new Date().toISOString();

    // Write back
    if (this.storage.set) {
      await Promise.resolve(this.storage.set(`healingAttempt:${attemptId}`, JSON.stringify(attempt)));
    }

    return attempt;
  }

  /**
   * Record the outcome of an approved healing attempt (D-04).
   * Transitions approved -> succeeded or approved -> failed.
   *
   * Only approved attempts can transition to outcome states.
   */
  async recordHealingOutcome(
    attemptId: HealingAttemptId,
    outcome: 'succeeded' | 'failed',
    error?: string
  ): Promise<HealingAttempt | null> {
    const raw = this.storage.get
      ? await Promise.resolve(this.storage.get(`healingAttempt:${attemptId}`))
      : null;
    if (!raw) {
      console.warn(`[HealingService] Healing attempt ${attemptId} not found`);
      return null;
    }

    const attempt = JSON.parse(raw) as HealingAttempt;

    // Only approved attempts can transition to outcome
    if (attempt.status !== 'approved') {
      console.warn(`[HealingService] Cannot record outcome for attempt ${attemptId} in status ${attempt.status}`);
      return null;
    }

    attempt.status = outcome;
    if (outcome === 'failed' && error) {
      attempt.errorMessage = `${attempt.errorMessage} | Healing failed: ${error}`;
    }
    attempt.resolvedAt = new Date().toISOString();

    if (this.storage.set) {
      await Promise.resolve(this.storage.set(`healingAttempt:${attemptId}`, JSON.stringify(attempt)));
    }

    console.log(`[HealingService] Healing attempt ${attemptId} outcome: ${outcome}`);
    return attempt;
  }

  /**
   * Get healing attempt history, sorted by createdAt descending.
   */
  async getHistory(limit = 50): Promise<HealingAttempt[]> {
    const keys = this.storage.keys
      ? await Promise.resolve(this.storage.keys('healingAttempt:*'))
      : [];

    const attempts: HealingAttempt[] = [];
    for (const key of keys) {
      const raw = this.storage.get ? await Promise.resolve(this.storage.get(key)) : null;
      if (raw) {
        try {
          attempts.push(JSON.parse(raw) as HealingAttempt);
        } catch {
          // Skip malformed entries
        }
      }
    }

    // Sort by createdAt descending
    attempts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return attempts.slice(0, limit);
  }

  /**
   * Get healing attempts for a specific workbench.
   */
  async getAttemptsByWorkbench(workbenchId: string): Promise<HealingAttempt[]> {
    const all = await this.getHistory(200);
    return all.filter((a) => a.workbenchId === workbenchId);
  }
}
