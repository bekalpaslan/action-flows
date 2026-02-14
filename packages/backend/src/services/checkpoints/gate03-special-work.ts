/**
 * Gate 3: Detect Special Work Checkpoint
 * Validates special work type detection from orchestrator output
 */

import type { ChainId } from '@afw/shared';
import { getGateCheckpoint } from '../gateCheckpoint.js';

// Special work type patterns
const SPECIAL_WORK_PATTERNS = {
  formatWork: /format.*work|contract.*update|CONTRACT\.md/i,
  harmonyWork: /harmony.*check|harmony.*audit|validation.*run/i,
  flowWork: /flow.*creation|register.*flow|FLOWS\.md/i,
  registryEdit: /registry.*edit|INDEX\.md|LEARNINGS\.md|ACTIONS\.md/i,
} as const;

type SpecialWorkType = keyof typeof SPECIAL_WORK_PATTERNS | 'standard-chain';

/**
 * Validate special work detection checkpoint
 * Called when orchestrator analyzes work type
 *
 * @param orchestratorOutput - Raw orchestrator output text
 * @param chainId - Chain identifier
 */
export async function validateSpecialWork(
  orchestratorOutput: string,
  chainId: ChainId
): Promise<void> {
  const gateCheckpoint = getGateCheckpoint();
  const startTime = Date.now();

  try {
    // Detect special work type
    let detectedType: SpecialWorkType = 'standard-chain';
    const matchedPatterns: string[] = [];

    for (const [workType, pattern] of Object.entries(SPECIAL_WORK_PATTERNS)) {
      if (pattern.test(orchestratorOutput)) {
        detectedType = workType as SpecialWorkType;
        matchedPatterns.push(workType);
        break; // Use first match
      }
    }

    // Validation (all work types are valid)
    const violations: string[] = [];
    const harmonyScore = 100;

    await gateCheckpoint.recordCheckpoint({
      gateId: 'gate-03',
      gateName: 'Detect Special Work',
      timestamp: new Date().toISOString() as any,
      chainId,
      traceLevel: 'INFO',
      orchestratorOutput: orchestratorOutput.substring(0, 300),
      input: 'Work type detection',
      alternatives: Object.keys(SPECIAL_WORK_PATTERNS).concat('standard-chain'),
      selected: detectedType,
      rationale: matchedPatterns.length > 0
        ? `Special work detected: ${matchedPatterns.join(', ')}`
        : 'No special work patterns detected, defaulting to standard-chain',
      confidence: matchedPatterns.length > 0 ? 'high' : 'medium',
      validationResult: {
        passed: true,
        violations,
        harmonyScore,
      },
      duration: Date.now() - startTime,
      metadata: {
        detectedType,
        matchedPatterns,
        allPatterns: Object.keys(SPECIAL_WORK_PATTERNS),
      },
    });
  } catch (error) {
    // Error handling
    await gateCheckpoint.recordCheckpoint({
      gateId: 'gate-03',
      gateName: 'Detect Special Work',
      timestamp: new Date().toISOString() as any,
      chainId,
      traceLevel: 'ERROR',
      orchestratorOutput: orchestratorOutput.substring(0, 300),
      input: 'Work type detection',
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
