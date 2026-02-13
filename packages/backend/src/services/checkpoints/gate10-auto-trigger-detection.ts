/**
 * Gate 10: Auto-Trigger Detection Checkpoint
 * Validates orchestrator detection of auto-trigger conditions (second-opinion, etc.)
 */

import type { ChainId, StepId } from '@afw/shared';
import { getGateCheckpoint } from '../gateCheckpoint.js';

/**
 * Validation result from auto-trigger detector
 */
export interface AutoTriggerDetectionResult {
  triggered: boolean;
  triggerType?: string;
  conditions: string[];
  confidence: number;
}

/**
 * Validate auto-trigger detection checkpoint
 * Called when orchestrator evaluates auto-trigger conditions
 *
 * @param orchestratorOutput - Raw orchestrator output text
 * @param chainId - Chain identifier
 * @param stepId - Step identifier
 * @param detectionResult - Auto-trigger detection result (optional)
 */
export async function validateAutoTriggerDetection(
  orchestratorOutput: string,
  chainId: ChainId,
  stepId: StepId,
  detectionResult?: AutoTriggerDetectionResult
): Promise<void> {
  const gateCheckpoint = getGateCheckpoint();
  const startTime = Date.now();

  try {
    // Detect auto-trigger evaluation markers
    const triggerMarkers = {
      secondOpinion: /second-?opinion/i.test(orchestratorOutput),
      autoTrigger: /auto-?trigger/i.test(orchestratorOutput),
      insertStep: /insert(?:ing|ed)?\s+step/i.test(orchestratorOutput),
      afterReview: /after\s+review/i.test(orchestratorOutput),
      afterAudit: /after\s+audit/i.test(orchestratorOutput),
    };

    const triggerMarkersDetected = Object.entries(triggerMarkers)
      .filter(([, v]) => v)
      .map(([k]) => k);

    const hasTriggerMarkers = triggerMarkersDetected.length > 0;

    // Detect authorized trigger types
    const authorizedTriggers = {
      secondOpinionAfterReview: triggerMarkers.secondOpinion && triggerMarkers.afterReview,
      secondOpinionAfterAudit: triggerMarkers.secondOpinion && triggerMarkers.afterAudit,
    };

    const authorizedTriggersDetected = Object.entries(authorizedTriggers)
      .filter(([, v]) => v)
      .map(([k]) => k);

    // Validation checks
    const violations: string[] = [];

    // If result provided, validate it
    if (detectionResult) {
      if (detectionResult.triggered && !detectionResult.triggerType) {
        violations.push('Trigger type missing when triggered=true');
      }

      if (detectionResult.triggered && detectionResult.conditions.length === 0) {
        violations.push('No conditions specified for trigger');
      }

      // Check if trigger type is authorized
      const authorizedTypes = ['second-opinion', 'secondOpinion'];
      if (detectionResult.triggered && detectionResult.triggerType) {
        const isAuthorized = authorizedTypes.some(
          type => detectionResult.triggerType?.toLowerCase().includes(type.toLowerCase())
        );
        if (!isAuthorized) {
          violations.push(`Unauthorized trigger type: ${detectionResult.triggerType}`);
        }
      }
    }

    // Check for trigger markers without detection result
    if (hasTriggerMarkers && !detectionResult) {
      violations.push('Trigger markers detected but no detection result provided');
    }

    // Calculate harmony score
    const harmonyScore = violations.length === 0
      ? 100
      : Math.max(0, 100 - (violations.length * 20));

    await gateCheckpoint.recordCheckpoint({
      gateId: 'gate-10',
      gateName: 'Auto-Trigger Detection',
      timestamp: new Date().toISOString() as any,
      chainId,
      stepId,
      traceLevel: violations.length === 0 ? 'DEBUG' : 'WARN',
      orchestratorOutput: orchestratorOutput.substring(0, 500),
      input: 'Auto-trigger condition evaluation',
      alternatives: ['second-opinion (after review/audit)', 'no-trigger'],
      selected: detectionResult?.triggered
        ? `Triggered: ${detectionResult.triggerType}`
        : 'No trigger',
      rationale: detectionResult
        ? `Conditions: ${detectionResult.conditions.join(', ')}`
        : hasTriggerMarkers
          ? `Markers detected: ${triggerMarkersDetected.join(', ')}`
          : 'No trigger conditions met',
      confidence: detectionResult
        ? (violations.length === 0 ? 'high' : 'medium')
        : (hasTriggerMarkers ? 'medium' : 'high'),
      validationResult: {
        passed: violations.length === 0,
        violations,
        harmonyScore,
      },
      duration: Date.now() - startTime,
      metadata: {
        triggered: detectionResult?.triggered ?? false,
        triggerType: detectionResult?.triggerType,
        conditions: detectionResult?.conditions ?? [],
        triggerMarkers,
        triggerMarkersDetected,
        authorizedTriggers,
        authorizedTriggersDetected,
        hasTriggerMarkers,
      },
    });
  } catch (error) {
    // Error handling
    await gateCheckpoint.recordCheckpoint({
      gateId: 'gate-10',
      gateName: 'Auto-Trigger Detection',
      timestamp: new Date().toISOString() as any,
      chainId,
      stepId,
      traceLevel: 'ERROR',
      orchestratorOutput: orchestratorOutput.substring(0, 500),
      input: 'Auto-trigger condition evaluation',
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
