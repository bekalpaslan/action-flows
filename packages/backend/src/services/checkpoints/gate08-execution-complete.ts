/**
 * Gate 8: Execution Complete Checkpoint
 * Validates orchestrator execution completion output (final chain status table)
 */

import type { ChainId } from '@afw/shared';
import { getGateCheckpoint } from '../gateCheckpoint.js';

/**
 * Validate execution complete checkpoint
 * Called when orchestrator outputs final "COMPLETE" table with all steps done
 *
 * @param orchestratorOutput - Raw orchestrator output text
 * @param chainId - Chain identifier
 */
export async function validateExecutionComplete(
  orchestratorOutput: string,
  chainId: ChainId
): Promise<void> {
  const gateCheckpoint = getGateCheckpoint();
  const startTime = Date.now();

  try {
    // Pattern: Look for "COMPLETE" in chain header or "Execution Complete" text
    // AND a table where all steps show completed status
    const hasCompleteMarker = /(?:COMPLETE|Execution Complete)/i.test(orchestratorOutput);
    const hasTable = /^\|\s*#\s*\|\s*Action\s*\|\s*Model\s*\|/m.test(orchestratorOutput);

    if (!hasCompleteMarker && !hasTable) {
      // Not an execution complete output
      return;
    }

    // Extract step count from table
    const tableRows = orchestratorOutput.match(/^\|\s*\d+\s*\|[^|]+\|[^|]+\|/gm);
    const stepCount = tableRows?.length ?? 0;

    // Check if all steps are marked as completed
    const completedSteps = (orchestratorOutput.match(/completed|✅/gi) || []).length;
    const allStepsComplete = stepCount > 0 && completedSteps >= stepCount;

    // Validation checks
    const violations: string[] = [];
    if (!hasCompleteMarker) violations.push('Missing COMPLETE marker');
    if (!hasTable) violations.push('Missing chain status table');
    if (!allStepsComplete) violations.push('Not all steps marked as completed');

    const harmonyScore = violations.length === 0 ? 100 : Math.max(0, 100 - (violations.length * 25));

    await gateCheckpoint.recordCheckpoint({
      gateId: 'gate-08',
      gateName: 'Execution Complete',
      timestamp: new Date().toISOString() as any,
      chainId,
      traceLevel: violations.length === 0 ? 'INFO' : 'WARN',
      orchestratorOutput: orchestratorOutput.substring(0, 500),
      input: 'Chain execution completion',
      selected: allStepsComplete
        ? `All ${stepCount} steps completed successfully`
        : `Incomplete execution: ${completedSteps}/${stepCount} steps done`,
      rationale: 'Execution complete table detected',
      confidence: allStepsComplete ? 'high' : 'medium',
      validationResult: {
        passed: violations.length === 0,
        violations,
        harmonyScore,
      },
      duration: Date.now() - startTime,
      metadata: {
        stepCount,
        completedSteps,
        allStepsComplete,
        hasCompleteMarker,
      },
    });
  } catch (error) {
    // Parse failed
    await gateCheckpoint.recordCheckpoint({
      gateId: 'gate-08',
      gateName: 'Execution Complete',
      timestamp: new Date().toISOString() as any,
      chainId,
      traceLevel: 'ERROR',
      orchestratorOutput: orchestratorOutput.substring(0, 500),
      input: 'Chain execution completion',
      selected: 'PARSE_FAILED',
      rationale: `Parse error: ${error instanceof Error ? error.message : String(error)}`,
      confidence: 'low',
      validationResult: {
        passed: false,
        violations: [`Parse failed: ${error instanceof Error ? error.message : String(error)}`],
        harmonyScore: 0,
      },
      duration: Date.now() - startTime,
    });
  }
}
