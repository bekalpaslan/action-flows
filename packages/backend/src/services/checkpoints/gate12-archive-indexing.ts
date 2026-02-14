/**
 * Gate 12: Archive & Indexing Checkpoint
 * Validates chain archival and INDEX.md updates
 */

import type { ChainId } from '@afw/shared';
import { getGateCheckpoint } from '../gateCheckpoint.js';

// Archive and indexing detection patterns
const ARCHIVE_PATTERNS = {
  indexUpdate: /INDEX\.md.*updated|Added to INDEX|logs\/INDEX/i,
  chainArchived: /Chain.*archived|Execution.*logged|log.*folder/i,
  completionRecorded: /## Chain Complete|Done\./i,
} as const;

/**
 * Validate archive and indexing checkpoint
 * Called when chain execution completes and archival begins
 *
 * @param orchestratorOutput - Raw orchestrator output text
 * @param chainId - Chain identifier
 */
export async function validateArchiveIndexing(
  orchestratorOutput: string,
  chainId: ChainId
): Promise<void> {
  const gateCheckpoint = getGateCheckpoint();
  const startTime = Date.now();

  try {
    // Detect archival activities
    const detectedActivities: string[] = [];

    for (const [activity, pattern] of Object.entries(ARCHIVE_PATTERNS)) {
      if (pattern.test(orchestratorOutput)) {
        detectedActivities.push(activity);
      }
    }

    // Validation
    const violations: string[] = [];

    // Must detect at least one archival activity
    if (detectedActivities.length === 0) {
      violations.push('No archival or indexing activity detected');
    }

    // Optimal scenario: all three activities present
    const totalExpected = Object.keys(ARCHIVE_PATTERNS).length;
    const allActivitiesPresent = detectedActivities.length === totalExpected;

    // Calculate harmony score — 0 if nothing detected
    const harmonyScore = detectedActivities.length === 0
      ? 0
      : allActivitiesPresent
        ? 100
        : Math.round((detectedActivities.length / totalExpected) * 100);

    await gateCheckpoint.recordCheckpoint({
      gateId: 'gate-12',
      gateName: 'Archive & Indexing',
      timestamp: new Date().toISOString() as any,
      chainId,
      traceLevel: violations.length === 0 ? 'INFO' : 'WARN',
      orchestratorOutput: orchestratorOutput.substring(0, 300),
      input: 'Chain completion archival',
      alternatives: Object.keys(ARCHIVE_PATTERNS),
      selected: detectedActivities.join(', ') || 'NONE',
      rationale: detectedActivities.length > 0
        ? `Detected ${detectedActivities.length} archival activities`
        : 'No archival activity detected',
      confidence: allActivitiesPresent ? 'high' : detectedActivities.length > 0 ? 'medium' : 'low',
      validationResult: {
        passed: violations.length === 0,
        violations,
        harmonyScore,
      },
      duration: Date.now() - startTime,
      metadata: {
        detectedActivities,
        allActivitiesPresent,
        totalExpectedActivities: Object.keys(ARCHIVE_PATTERNS).length,
      },
    });
  } catch (error) {
    // Error handling
    await gateCheckpoint.recordCheckpoint({
      gateId: 'gate-12',
      gateName: 'Archive & Indexing',
      timestamp: new Date().toISOString() as any,
      chainId,
      traceLevel: 'ERROR',
      orchestratorOutput: orchestratorOutput.substring(0, 300),
      input: 'Chain completion archival',
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
