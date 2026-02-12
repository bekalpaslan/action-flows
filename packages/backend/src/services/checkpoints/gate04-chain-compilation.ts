/**
 * Gate 4: Compile Chain Checkpoint
 * Validates orchestrator chain compilation output (Format 1.1)
 */

import type { ChainId } from '@afw/shared';
import { parseChainCompilation } from '@afw/shared';
import { getGateCheckpoint } from '../gateCheckpoint.js';

/**
 * Validate chain compilation checkpoint
 * Called when orchestrator compiles a chain (outputs Format 1.1)
 *
 * @param orchestratorOutput - Raw orchestrator output text
 * @param chainId - Chain identifier
 */
export async function validateChainCompilation(
  orchestratorOutput: string,
  chainId: ChainId
): Promise<void> {
  const gateCheckpoint = getGateCheckpoint();
  const startTime = Date.now();

  try {
    // Parse Format 1.1 using existing parser
    const parsed = parseChainCompilation(orchestratorOutput);

    if (!parsed) {
      // Format not detected
      await gateCheckpoint.recordCheckpoint({
        gateId: 'gate-04',
        gateName: 'Compile Chain',
        timestamp: new Date().toISOString() as any,
        chainId,
        traceLevel: 'DEBUG',
        orchestratorOutput: orchestratorOutput.substring(0, 2000),
        input: 'Chain compilation',
        selected: 'FORMAT_NOT_DETECTED',
        rationale: 'Output does not match Format 1.1 pattern',
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

    // Validation checks
    const violations: string[] = [];

    if (!parsed.title) {
      violations.push('Missing brief title');
    }

    if (!parsed.steps || parsed.steps.length === 0) {
      violations.push('Empty or missing step table');
    }

    if (!parsed.executionMode) {
      violations.push('Missing execution mode (Sequential/Parallel)');
    }

    // Validate step structure
    if (parsed.steps) {
      for (const step of parsed.steps) {
        if (!step.action) violations.push(`Step ${step.stepNumber}: missing action`);
        if (!step.model) violations.push(`Step ${step.stepNumber}: missing model`);
        if (!step.status) violations.push(`Step ${step.stepNumber}: missing status`);
      }
    }

    // Calculate harmony score
    const harmonyScore = violations.length === 0 ? 100 : Math.max(0, 100 - (violations.length * 15));

    // Record checkpoint
    await gateCheckpoint.recordCheckpoint({
      gateId: 'gate-04',
      gateName: 'Compile Chain',
      timestamp: new Date().toISOString() as any,
      chainId,
      traceLevel: violations.length === 0 ? 'INFO' : 'WARN',
      orchestratorOutput: orchestratorOutput.substring(0, 2000),
      parsedFormat: 'Format 1.1',
      input: `Chain compilation${parsed.title ? ` for "${parsed.title}"` : ''}`,
      selected: `${parsed.steps?.length ?? 0} steps, ${parsed.executionMode || 'Unknown'} execution`,
      rationale: parsed.source || 'User request',
      confidence: 'high',
      validationResult: {
        passed: violations.length === 0,
        violations,
        harmonyScore,
      },
      duration: Date.now() - startTime,
      metadata: {
        stepCount: parsed.steps?.length ?? 0,
        executionMode: parsed.executionMode,
        source: parsed.source,
      },
    });
  } catch (error) {
    // Parsing failed — critical violation
    await gateCheckpoint.recordCheckpoint({
      gateId: 'gate-04',
      gateName: 'Compile Chain',
      timestamp: new Date().toISOString() as any,
      chainId,
      traceLevel: 'ERROR',
      orchestratorOutput: orchestratorOutput.substring(0, 2000),
      parsedFormat: 'Format 1.1',
      input: 'Chain compilation',
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
