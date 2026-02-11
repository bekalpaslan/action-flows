/**
 * Gate 9: Agent Output Validation Checkpoint
 * Validates agent output files against CONTRACT.md specifications
 * Integration point with Component 3 (Agent Validator)
 */

import type { ChainId, StepId } from '@afw/shared';
import { getGateCheckpoint } from '../gateCheckpoint.js';

/**
 * Validation result from agent output validator
 */
export interface AgentValidationResult {
  passed: boolean;
  violations: Array<{
    severity: 'critical' | 'warning';
    field: string;
    issue: string;
  }>;
  harmonyScore: number;
  formatType: string;
}

/**
 * Validate agent output checkpoint
 * Called after agent completes and output file is written
 *
 * Note: Full agent validator integration (Component 3) is deferred.
 * This gate checkpoint handles the recording side.
 *
 * @param actionType - Agent action type (review, analyze, brainstorm, etc.)
 * @param outputPath - Path to agent output file
 * @param chainId - Chain identifier
 * @param stepId - Step identifier
 * @param validationResult - Result from agent validator (if available)
 */
export async function validateAgentOutput(
  actionType: string,
  outputPath: string,
  chainId: ChainId,
  stepId: StepId,
  validationResult?: AgentValidationResult
): Promise<void> {
  const gateCheckpoint = getGateCheckpoint();
  const startTime = Date.now();

  try {
    // If no validation result provided, record as pending
    if (!validationResult) {
      await gateCheckpoint.recordCheckpoint({
        gateId: 'gate-09',
        gateName: 'Agent Output Validation',
        timestamp: new Date().toISOString() as any,
        chainId,
        stepId,
        traceLevel: 'INFO',
        orchestratorOutput: `Agent: ${actionType}, Output: ${outputPath}`,
        input: `Agent output validation: ${actionType}`,
        selected: 'PENDING',
        rationale: 'Output file written, awaiting validation',
        confidence: 'medium',
        validationResult: {
          passed: true,
          violations: [],
          harmonyScore: 100,
        },
        duration: Date.now() - startTime,
        metadata: {
          actionType,
          outputPath,
          validatorAvailable: false,
        },
      });
      return;
    }

    // Record validation result
    const traceLevel = validationResult.passed ? 'INFO' : 'WARN';

    await gateCheckpoint.recordCheckpoint({
      gateId: 'gate-09',
      gateName: 'Agent Output Validation',
      timestamp: new Date().toISOString() as any,
      chainId,
      stepId,
      traceLevel,
      orchestratorOutput: `Agent: ${actionType}, Output: ${outputPath}`,
      input: `Agent output validation: ${actionType}`,
      selected: validationResult.passed ? 'PASS' : 'FAIL',
      rationale: validationResult.violations.length === 0
        ? 'All required fields present'
        : `Violations: ${validationResult.violations.map(v => `${v.field} (${v.severity})`).join(', ')}`,
      confidence: 'high',
      validationResult: {
        passed: validationResult.passed,
        violations: validationResult.violations.map(v =>
          `${v.severity.toUpperCase()}: ${v.field} - ${v.issue}`
        ),
        harmonyScore: validationResult.harmonyScore,
      },
      duration: Date.now() - startTime,
      metadata: {
        formatType: validationResult.formatType,
        outputPath,
        violationCount: validationResult.violations.length,
        criticalCount: validationResult.violations.filter(v => v.severity === 'critical').length,
        warningCount: validationResult.violations.filter(v => v.severity === 'warning').length,
      },
    });
  } catch (error) {
    // Validation error
    await gateCheckpoint.recordCheckpoint({
      gateId: 'gate-09',
      gateName: 'Agent Output Validation',
      timestamp: new Date().toISOString() as any,
      chainId,
      stepId,
      traceLevel: 'ERROR',
      orchestratorOutput: `Agent: ${actionType}, Output: ${outputPath}`,
      input: `Agent output validation: ${actionType}`,
      selected: 'ERROR',
      rationale: `Validation error: ${error instanceof Error ? error.message : String(error)}`,
      confidence: 'low',
      validationResult: {
        passed: false,
        violations: [`Validation error: ${error instanceof Error ? error.message : String(error)}`],
        harmonyScore: 0,
      },
      duration: Date.now() - startTime,
      metadata: {
        actionType,
        outputPath,
        error: error instanceof Error ? error.message : String(error),
      },
    });
  }
}
