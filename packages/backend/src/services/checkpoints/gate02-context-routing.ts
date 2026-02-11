/**
 * Gate 2: Route to Context Checkpoint
 * Validates orchestrator context routing decision
 */

import type { ChainId } from '@afw/shared';
import { parseContextRouting } from '@afw/shared';
import { getGateCheckpoint } from '../gateCheckpoint.js';

// Valid contexts from MEMORY.md
const VALID_CONTEXTS = ['work', 'maintenance', 'explore', 'review', 'settings', 'pm'];

/**
 * Validate context routing checkpoint
 * Called when orchestrator routes to a context
 *
 * @param orchestratorOutput - Raw orchestrator output text
 * @param chainId - Chain identifier
 * @param userRequest - Original user request for context
 */
export async function validateContextRouting(
  orchestratorOutput: string,
  chainId: ChainId,
  userRequest?: string
): Promise<void> {
  const gateCheckpoint = getGateCheckpoint();
  const startTime = Date.now();

  try {
    // Try to parse with existing parser first
    const parsed = parseContextRouting(orchestratorOutput);

    if (parsed && parsed.context) {
      // Existing parser succeeded
      const isValid = VALID_CONTEXTS.includes(parsed.context.toLowerCase());

      await gateCheckpoint.recordCheckpoint({
        gateId: 'gate-02',
        gateName: 'Route to Context',
        timestamp: new Date().toISOString() as any,
        chainId,
        traceLevel: isValid ? 'INFO' : 'WARN',
        orchestratorOutput: orchestratorOutput.substring(0, 300),
        input: userRequest || 'User request',
        alternatives: VALID_CONTEXTS,
        selected: parsed.context,
        rationale: 'Extracted from orchestrator output using parseContextRouting',
        confidence: 'high',
        validationResult: {
          passed: isValid,
          violations: isValid ? [] : [`Invalid context: ${parsed.context}`],
          harmonyScore: isValid ? 100 : 50,
        },
        duration: Date.now() - startTime,
        metadata: {
          extractedContext: parsed.context,
          validContexts: VALID_CONTEXTS,
        },
      });
      return;
    }

    // If no parser match, check for manual pattern matching
    // Pattern: "Routing to {context} context" or "Context: {context}"
    const contextMatch = orchestratorOutput.match(/(?:Routing to|Context:)\s+(\w+)\s+context/i);

    if (!contextMatch) {
      // Orchestrator didn't output context decision explicitly
      // This is not necessarily a violation — context might be implicit
      return;
    }

    const selectedContext = contextMatch[1].toLowerCase();
    const isValid = VALID_CONTEXTS.includes(selectedContext);

    await gateCheckpoint.recordCheckpoint({
      gateId: 'gate-02',
      gateName: 'Route to Context',
      timestamp: new Date().toISOString() as any,
      chainId,
      traceLevel: isValid ? 'INFO' : 'WARN',
      orchestratorOutput: orchestratorOutput.substring(0, 300),
      input: userRequest || 'User request',
      alternatives: VALID_CONTEXTS,
      selected: selectedContext,
      rationale: 'Keyword-based pattern matching',
      confidence: isValid ? 'high' : 'medium',
      validationResult: {
        passed: isValid,
        violations: isValid ? [] : [`Invalid context: ${selectedContext}`],
        harmonyScore: isValid ? 100 : 50,
      },
      duration: Date.now() - startTime,
      metadata: {
        extractedContext: selectedContext,
        validContexts: VALID_CONTEXTS,
        pattern: 'keyword-based',
      },
    });
  } catch (error) {
    // Error during validation
    await gateCheckpoint.recordCheckpoint({
      gateId: 'gate-02',
      gateName: 'Route to Context',
      timestamp: new Date().toISOString() as any,
      chainId,
      traceLevel: 'ERROR',
      orchestratorOutput: orchestratorOutput.substring(0, 300),
      input: userRequest || 'User request',
      alternatives: VALID_CONTEXTS,
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
