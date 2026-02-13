/**
 * Gate 7: Execute Step Checkpoint
 * Validates orchestrator step execution initiation
 */

import type { ChainId, StepId } from '@afw/shared';
import { getGateCheckpoint } from '../gateCheckpoint.js';

/**
 * Validate execute step checkpoint
 * Called when orchestrator initiates step execution (spawn agent)
 *
 * @param orchestratorOutput - Raw orchestrator output text
 * @param chainId - Chain identifier
 * @param stepId - Step identifier
 */
export async function validateExecuteStep(
  orchestratorOutput: string,
  chainId: ChainId,
  stepId: StepId
): Promise<void> {
  const gateCheckpoint = getGateCheckpoint();
  const startTime = Date.now();

  try {
    // Detect step execution markers
    const executionMarkers = {
      spawning: /Spawning\s+Step\s+(\d+):/i.test(orchestratorOutput),
      stepPrefix: />>?\s*Step\s+(\d+)/i.test(orchestratorOutput),
      executing: /Executing\s+Step\s+(\d+)/i.test(orchestratorOutput),
    };

    const hasExecutionMarker = Object.values(executionMarkers).some(Boolean);

    // Extract step number if present
    const stepNumberMatch = orchestratorOutput.match(/(?:Spawning|Step|Executing)\s+Step\s+(\d+)/i);
    const extractedStepNumber = stepNumberMatch ? parseInt(stepNumberMatch[1], 10) : null;

    // Extract action type
    const actionMatch = orchestratorOutput.match(/(?:Spawning|Step\s+\d+):\s+([a-z-/]+)/i);
    const actionType = actionMatch ? actionMatch[1] : null;

    // Extract model specification
    const modelMatch = orchestratorOutput.match(/\(([a-z0-9-._]+)\)/i);
    const model = modelMatch ? modelMatch[1] : null;

    // Validation checks
    const violations: string[] = [];

    if (!hasExecutionMarker) {
      violations.push('No execution marker detected (Spawning/Executing/Step prefix)');
    }

    if (extractedStepNumber === null) {
      violations.push('Step number not found in output');
    }

    if (!actionType) {
      violations.push('Action type not specified');
    }

    if (!model) {
      violations.push('Model not specified');
    }

    // Calculate harmony score
    const harmonyScore = violations.length === 0
      ? 100
      : Math.max(0, 100 - (violations.length * 20));

    await gateCheckpoint.recordCheckpoint({
      gateId: 'gate-07',
      gateName: 'Execute Step',
      timestamp: new Date().toISOString() as any,
      chainId,
      stepId,
      traceLevel: violations.length === 0 ? 'DEBUG' : 'WARN',
      orchestratorOutput: orchestratorOutput.substring(0, 300),
      input: `Step ${stepId} execution initiation`,
      selected: actionType || 'UNKNOWN',
      rationale: hasExecutionMarker
        ? `Agent spawn initiated: ${actionType} (${model})`
        : 'Execution markers not detected',
      confidence: violations.length === 0 ? 'high' : 'medium',
      validationResult: {
        passed: violations.length === 0,
        violations,
        harmonyScore,
      },
      duration: Date.now() - startTime,
      metadata: {
        executionMarkers,
        extractedStepNumber,
        actionType,
        model,
        hasExecutionMarker,
      },
    });
  } catch (error) {
    // Error handling
    await gateCheckpoint.recordCheckpoint({
      gateId: 'gate-07',
      gateName: 'Execute Step',
      timestamp: new Date().toISOString() as any,
      chainId,
      stepId,
      traceLevel: 'ERROR',
      orchestratorOutput: orchestratorOutput.substring(0, 300),
      input: `Step ${stepId} execution initiation`,
      selected: 'ERROR',
      rationale: `Validation error: ${error instanceof Error ? error.message : String(error)}`,
      confidence: 'low',
      validationResult: {
        passed: false,
        violations: [`Validation error: ${error instanceof Error ? error.message : String(error)}`],
        harmonyScore: 0,
      },
      duration: Date.now() - startTime,
    });
  }
}
