/**
 * Gate 6: Step Boundary Checkpoint
 * Validates orchestrator step completion and boundary evaluation
 */

import type { ChainId, StepId } from '@afw/shared';
import { parseStepCompletion } from '@afw/shared';
import { getGateCheckpoint } from '../gateCheckpoint.js';

/**
 * Validate step boundary checkpoint
 * Called when orchestrator completes a step (outputs Format 2.1)
 *
 * @param orchestratorOutput - Raw orchestrator output text
 * @param chainId - Chain identifier
 * @param currentStepId - Current step identifier
 */
export async function validateStepBoundary(
  orchestratorOutput: string,
  chainId: ChainId,
  currentStepId: StepId
): Promise<void> {
  const gateCheckpoint = getGateCheckpoint();
  const startTime = Date.now();

  try {
    // Parse Format 2.1
    const parsed = parseStepCompletion(orchestratorOutput);

    if (!parsed) {
      // Format not detected
      await gateCheckpoint.recordCheckpoint({
        gateId: 'gate-06',
        gateName: 'Step Boundary Evaluation',
        timestamp: new Date().toISOString() as any,
        chainId,
        stepId: currentStepId,
        traceLevel: 'DEBUG',
        orchestratorOutput: orchestratorOutput.substring(0, 300),
        input: 'Step completion',
        selected: 'FORMAT_NOT_DETECTED',
        rationale: 'Output does not match Format 2.1 pattern',
        confidence: 'high',
        validationResult: {
          passed: true,
          violations: [],
          harmonyScore: 100,
        },
        duration: Date.now() - startTime,
      });
      return;
    }

    // Check for 6-trigger signals in result text (from MEMORY.md)
    const triggers = {
      signal: /\[SIGNAL\]/i.test(parsed.result || ''),
      pattern: /\[PATTERN\]/i.test(parsed.result || ''),
      dependency: /\[DEPENDENCY\]/i.test(parsed.result || ''),
      quality: /\[QUALITY\]/i.test(parsed.result || ''),
      redesign: /\[REDESIGN\]/i.test(parsed.result || ''),
      reuse: /\[REUSE\]/i.test(parsed.result || ''),
    };

    const triggeredCount = Object.values(triggers).filter(Boolean).length;
    const triggeredNames = Object.entries(triggers)
      .filter(([, v]) => v)
      .map(([k]) => k);

    // Validation checks
    const violations: string[] = [];
    if (!parsed.stepNumber) violations.push('Missing step number');
    if (!parsed.action) violations.push('Missing action');
    if (!parsed.result) violations.push('Missing step result');

    const harmonyScore = violations.length === 0 ? 100 : Math.max(0, 100 - (violations.length * 20));

    await gateCheckpoint.recordCheckpoint({
      gateId: 'gate-06',
      gateName: 'Step Boundary Evaluation',
      timestamp: new Date().toISOString() as any,
      chainId,
      stepId: currentStepId,
      traceLevel: violations.length === 0 ? 'DEBUG' : 'WARN',
      orchestratorOutput: orchestratorOutput.substring(0, 300),
      parsedFormat: 'Format 2.1',
      input: `Step ${parsed.stepNumber} complete: ${parsed.action}`,
      selected: triggeredCount > 0
        ? `${triggeredCount} triggers detected: ${triggeredNames.join(', ')}`
        : 'Continue to next step',
      rationale: parsed.result || 'Step completed successfully',
      confidence: 'high',
      validationResult: {
        passed: violations.length === 0,
        violations,
        harmonyScore,
      },
      duration: Date.now() - startTime,
      metadata: {
        stepNumber: parsed.stepNumber,
        action: parsed.action,
        triggers,
        triggeredCount,
        nextStep: parsed.nextStep,
      },
    });
  } catch (error) {
    // Parse failed
    await gateCheckpoint.recordCheckpoint({
      gateId: 'gate-06',
      gateName: 'Step Boundary Evaluation',
      timestamp: new Date().toISOString() as any,
      chainId,
      stepId: currentStepId,
      traceLevel: 'ERROR',
      orchestratorOutput: orchestratorOutput.substring(0, 300),
      parsedFormat: 'Format 2.1',
      input: 'Step completion',
      selected: 'PARSE_FAILED',
      rationale: `Parse error: ${error instanceof Error ? error.message : String(error)}`,
      confidence: 'high',
      validationResult: {
        passed: false,
        violations: [`Parse failed: ${error instanceof Error ? error.message : String(error)}`],
        harmonyScore: 0,
      },
      duration: Date.now() - startTime,
    });
  }
}
