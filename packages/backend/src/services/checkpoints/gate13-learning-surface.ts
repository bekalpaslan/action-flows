/**
 * Gate 13: Learning Surface Validation Checkpoint
 * Validates that agent learning surfaces follow prescribed format and
 * that closed learnings have legitimate closure evidence.
 */

import type { ChainId, StepId } from '@afw/shared';
import { getGateCheckpoint } from '../gateCheckpoint.js';

/**
 * Helper to extract learning IDs from text
 * Matches pattern like L001, L002, etc.
 */
function extractLearningIds(text: string): string[] {
  const matches = text.match(/\bL\d{3}\b/g);
  return matches ? Array.from(new Set(matches)) : [];
}

/**
 * Validate learning surface checkpoint
 * Called when orchestrator outputs a learning surface format
 *
 * Validation rules:
 * - Learning surface must have proper format markers
 * - Must include: From, Issue, Root Cause, Fix, Status fields
 * - Closed learnings must have evidence: commit hash or documented reason
 *
 * @param orchestratorOutput - Raw orchestrator output text
 * @param chainId - Chain identifier
 * @param stepId - Step identifier (optional)
 */
export async function validateLearningSurface(
  orchestratorOutput: string,
  chainId: ChainId,
  stepId?: StepId
): Promise<void> {
  const startTime = Date.now();
  const gateCheckpoint = getGateCheckpoint();

  try {
    const violations: string[] = [];

    // 1. Check for learning surface format markers
    const hasLearningHeader = /##\s+Agent\s+Learning/i.test(orchestratorOutput);
    const hasFromField = /\*\*From:\*\*\s+[a-z-/]+/i.test(orchestratorOutput);
    const hasIssueField = /\*\*Issue:\*\*/i.test(orchestratorOutput);
    const hasRootCause = /\*\*Root\s+Cause:\*\*/i.test(orchestratorOutput);
    const hasSuggestedFix = /\*\*(?:Suggested\s+)?Fix:\*\*/i.test(orchestratorOutput);
    const hasStatus = /\*\*Status:\*\*/i.test(orchestratorOutput);

    // 2. If learning surface detected, validate completeness
    let selected = 'NO_LEARNING';
    if (hasLearningHeader) {
      selected = 'LEARNING_DETECTED';

      if (!hasFromField) violations.push('Learning surface missing From field');
      if (!hasIssueField) violations.push('Learning surface missing Issue field');
      if (!hasRootCause) violations.push('Learning surface missing Root Cause field');
      if (!hasSuggestedFix) violations.push('Learning surface missing Fix field');
      if (!hasStatus) violations.push('Learning surface missing Status field');
    }

    // 3. If LEARNINGS.md update mentioned, check closure evidence
    const learningsModified = /LEARNINGS\.md|learnings registry/i.test(orchestratorOutput);
    const closedCount = (orchestratorOutput.match(/Status:\s+Closed/gi) || []).length;

    if (learningsModified && closedCount > 0) {
      selected = 'LEARNINGS_UPDATED';

      // Extract learning IDs being closed
      const learningIds = extractLearningIds(orchestratorOutput);

      // Check if closures have evidence (commit hash or documented reason)
      for (const id of learningIds) {
        const closurePattern = new RegExp(
          `${id}[\\s\\S]*?Status:\\s+Closed[\\s\\S]*?(?:Evidence:|dissolved|documented|fixed)`,
          'i'
        );

        if (!closurePattern.test(orchestratorOutput)) {
          violations.push(`Learning ${id} marked closed without evidence or reason`);
        }
      }
    }

    // 4. Calculate harmony score
    const harmonyScore =
      violations.length === 0 ? 100 : Math.max(0, 100 - violations.length * 20);

    // 5. Determine trace level
    const traceLevel =
      violations.length === 0 ? 'DEBUG' : violations.length <= 2 ? 'WARN' : 'ERROR';

    // 6. Record checkpoint
    await gateCheckpoint.recordCheckpoint({
      gateId: 'gate-13',
      gateName: 'Learning Surface Validation',
      chainId,
      stepId,
      timestamp: new Date().toISOString() as any,
      traceLevel,
      input: 'Orchestrator output validation',
      selected,
      rationale:
        violations.length === 0
          ? 'Learning surface properly formatted'
          : `Validation violations: ${violations.join('; ')}`,
      confidence: violations.length === 0 ? 'high' : 'medium',
      orchestratorOutput: orchestratorOutput.substring(0, 300),
      validationResult: {
        passed: violations.length === 0,
        violations,
        harmonyScore,
      },
      duration: Date.now() - startTime,
      metadata: {
        hasLearningHeader,
        hasFromField,
        hasIssueField,
        hasRootCause,
        hasSuggestedFix,
        hasStatus,
        learningsModified,
        learningIdsDetected: extractLearningIds(orchestratorOutput),
        violationCount: violations.length,
        closedCount,
      },
    });
  } catch (error) {
    // Always log errors as traces, never throw
    await gateCheckpoint.recordCheckpoint({
      gateId: 'gate-13',
      gateName: 'Learning Surface Validation',
      chainId,
      stepId,
      timestamp: new Date().toISOString() as any,
      traceLevel: 'ERROR',
      input: 'Orchestrator output validation',
      selected: 'ERROR',
      rationale: `Gate 13 validation failed: ${
        error instanceof Error ? error.message : String(error)
      }`,
      confidence: 'low',
      orchestratorOutput: orchestratorOutput.substring(0, 300),
      validationResult: {
        passed: false,
        violations: [
          `Validation error: ${
            error instanceof Error ? error.message : String(error)
          }`,
        ],
        harmonyScore: 50,
      },
      duration: Date.now() - startTime,
      metadata: {
        errorType: error instanceof Error ? error.constructor.name : 'Unknown',
        errorMessage: error instanceof Error ? error.message : String(error),
      },
    });
  }
}
