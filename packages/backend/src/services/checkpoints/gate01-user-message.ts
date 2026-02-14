/**
 * Gate 1: Parse & Understand Checkpoint
 * Validates user message reception and parsing
 */

import type { ChainId } from '@afw/shared';
import { getGateCheckpoint } from '../gateCheckpoint.js';

/**
 * Validate user message checkpoint
 * Called when a user message is received in the JSONL conversation log
 *
 * @param userMessage - The user message content
 * @param chainId - Chain identifier
 */
export async function validateUserMessage(
  userMessage: string,
  chainId: ChainId
): Promise<void> {
  const gateCheckpoint = getGateCheckpoint();
  const startTime = Date.now();

  try {
    // Validate message presence
    const hasContent = userMessage && userMessage.trim().length > 0;

    // Truncate for display
    const truncatedMessage = userMessage.substring(0, 200);

    // No violations for valid user message
    const violations: string[] = [];
    if (!hasContent) {
      violations.push('Empty user message received');
    }

    const harmonyScore = violations.length === 0 ? 100 : 0;

    await gateCheckpoint.recordCheckpoint({
      gateId: 'gate-01',
      gateName: 'Parse & Understand',
      timestamp: new Date().toISOString() as any,
      chainId,
      traceLevel: violations.length === 0 ? 'INFO' : 'WARN',
      orchestratorOutput: 'User message received',
      input: truncatedMessage,
      selected: 'REQUEST_RECEIVED',
      rationale: hasContent
        ? 'User message parsed successfully'
        : 'Empty message received',
      confidence: 'high',
      validationResult: {
        passed: violations.length === 0,
        violations,
        harmonyScore,
      },
      duration: Date.now() - startTime,
      metadata: {
        messageLength: userMessage.length,
        hasContent,
      },
    });
  } catch (error) {
    // Error handling
    await gateCheckpoint.recordCheckpoint({
      gateId: 'gate-01',
      gateName: 'Parse & Understand',
      timestamp: new Date().toISOString() as any,
      chainId,
      traceLevel: 'ERROR',
      orchestratorOutput: 'User message parsing error',
      input: userMessage.substring(0, 200),
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
