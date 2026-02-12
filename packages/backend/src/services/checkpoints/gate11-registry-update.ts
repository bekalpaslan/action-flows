/**
 * Gate 11: Registry Update Checkpoint
 * Validates orchestrator registry file modifications
 */

import type { ChainId } from '@afw/shared';
import { getGateCheckpoint } from '../gateCheckpoint.js';

// Registry files from ActionFlows framework
const REGISTRY_FILES = [
  'INDEX.md',
  'LEARNINGS.md',
  'FLOWS.md',
  'ACTIONS.md',
  'CONTEXTS.md',
];

/**
 * Validate registry update checkpoint
 * Called when orchestrator updates a registry file
 *
 * @param orchestratorOutput - Raw orchestrator output text
 * @param chainId - Chain identifier
 */
export async function validateRegistryUpdate(
  orchestratorOutput: string,
  chainId: ChainId
): Promise<void> {
  const gateCheckpoint = getGateCheckpoint();
  const startTime = Date.now();

  try {
    // Pattern: Look for registry file mentions with update confirmation
    // "Registry updated", "Done." after file edit, or explicit INDEX.md/LEARNINGS.md references
    const registryMentions = REGISTRY_FILES.filter(file =>
      new RegExp(file, 'i').test(orchestratorOutput)
    );

    if (registryMentions.length === 0) {
      // Not a registry update
      return;
    }

    // Check for confirmation markers
    const hasConfirmation = /(?:Registry updated|Done\.|successfully|added|removed)/i.test(orchestratorOutput);
    const hasEditMarker = /(?:Edit|Write|Updated|Modified)/i.test(orchestratorOutput);

    // Extract which files were mentioned
    const mentionedFiles = registryMentions.join(', ');

    // Validation checks
    const violations: string[] = [];
    if (!hasConfirmation) violations.push('Missing update confirmation');
    if (!hasEditMarker) violations.push('Missing edit marker');

    const harmonyScore = violations.length === 0 ? 100 : Math.max(0, 100 - (violations.length * 30));

    await gateCheckpoint.recordCheckpoint({
      gateId: 'gate-11',
      gateName: 'Registry Update',
      timestamp: new Date().toISOString() as any,
      chainId,
      traceLevel: violations.length === 0 ? 'INFO' : 'WARN',
      orchestratorOutput: orchestratorOutput.substring(0, 300),
      input: 'Registry file modification',
      selected: mentionedFiles,
      rationale: hasConfirmation
        ? 'Registry update confirmed'
        : 'Registry file mentioned but no confirmation',
      confidence: hasConfirmation && hasEditMarker ? 'high' : 'medium',
      validationResult: {
        passed: violations.length === 0,
        violations,
        harmonyScore,
      },
      duration: Date.now() - startTime,
      metadata: {
        registryFiles: registryMentions,
        hasConfirmation,
        hasEditMarker,
      },
    });
  } catch (error) {
    // Parse failed
    await gateCheckpoint.recordCheckpoint({
      gateId: 'gate-11',
      gateName: 'Registry Update',
      timestamp: new Date().toISOString() as any,
      chainId,
      traceLevel: 'ERROR',
      orchestratorOutput: orchestratorOutput.substring(0, 300),
      input: 'Registry file modification',
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
