import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { validateAutoTriggerDetection } from '../../services/checkpoints/gate10-auto-trigger-detection.js';
import type { AutoTriggerDetectionResult } from '../../services/checkpoints/gate10-auto-trigger-detection.js';
import type { ChainId, StepId, GateTrace } from '@afw/shared';
import { getGateCheckpoint, initGateCheckpoint } from '../../services/gateCheckpoint.js';
import { storage as memoryStorage } from '../../storage/memory.js';

describe('Gate 10: Auto-Trigger Detection Validator', () => {
  let recordCheckpointSpy: any;
  let lastTrace: GateTrace | null = null;

  beforeEach(() => {
    lastTrace = null;
    initGateCheckpoint(memoryStorage);

    // Spy on recordCheckpoint to capture traces
    recordCheckpointSpy = vi.spyOn(getGateCheckpoint(), 'recordCheckpoint' as any);
    recordCheckpointSpy.mockImplementation(async (trace: GateTrace) => {
      lastTrace = trace;
      return Promise.resolve();
    });
  });

  afterEach(() => {
    recordCheckpointSpy?.mockRestore();
    getGateCheckpoint().shutdown();
  });

  describe('Valid Inputs - Harmony Score 100', () => {
    it('should validate second-opinion trigger after review', async () => {
      const output = 'Inserting second-opinion step after review';
      const result: AutoTriggerDetectionResult = {
        triggered: true,
        triggerType: 'second-opinion',
        conditions: ['after review/', 'auto-inserted'],
        confidence: 0.95,
      };

      await validateAutoTriggerDetection(output, 'chain-1' as ChainId, 'step-1' as StepId, result);

      expect(lastTrace).not.toBeNull();
      expect(lastTrace!.validationResult?.passed).toBe(true);
      expect(lastTrace!.validationResult?.harmonyScore).toBe(100);
      expect(lastTrace!.validationResult?.violations).toEqual([]);
      expect(lastTrace!.selected).toContain('Triggered: second-opinion');
      expect(lastTrace!.confidence).toBe('high');
      expect(lastTrace!.metadata?.triggered).toBe(true);
      expect(lastTrace!.metadata?.triggerType).toBe('second-opinion');
    });

    it('should validate second-opinion trigger after audit', async () => {
      const output = 'Auto-trigger: second-opinion after audit';
      const result: AutoTriggerDetectionResult = {
        triggered: true,
        triggerType: 'secondOpinion',
        conditions: ['after audit/', 'quality-gate'],
        confidence: 0.90,
      };

      await validateAutoTriggerDetection(output, 'chain-2' as ChainId, 'step-2' as StepId, result);

      expect(lastTrace!.validationResult?.passed).toBe(true);
      expect(lastTrace!.validationResult?.harmonyScore).toBe(100);
      expect(lastTrace!.metadata?.conditions).toContain('after audit/');
    });

    it('should validate no-trigger scenario', async () => {
      const output = 'No auto-trigger conditions met';
      const result: AutoTriggerDetectionResult = {
        triggered: false,
        conditions: [],
        confidence: 1.0,
      };

      await validateAutoTriggerDetection(output, 'chain-3' as ChainId, 'step-3' as StepId, result);

      expect(lastTrace!.validationResult?.passed).toBe(true);
      expect(lastTrace!.validationResult?.harmonyScore).toBe(100);
      expect(lastTrace!.selected).toBe('No trigger');
      expect(lastTrace!.metadata?.triggered).toBe(false);
    });

    it('should validate with trigger markers in output', async () => {
      const output = 'Detected second-opinion requirement after review';
      const result: AutoTriggerDetectionResult = {
        triggered: true,
        triggerType: 'second-opinion',
        conditions: ['review completed'],
        confidence: 0.85,
      };

      await validateAutoTriggerDetection(output, 'chain-4' as ChainId, 'step-4' as StepId, result);

      expect(lastTrace!.validationResult?.passed).toBe(true);
      expect(lastTrace!.metadata?.triggerMarkersDetected).toContain('secondOpinion');
      expect(lastTrace!.metadata?.triggerMarkersDetected).toContain('afterReview');
    });
  });

  describe('Invalid Inputs - Reduced Harmony Scores', () => {
    it('should fail when triggered=true but triggerType missing', async () => {
      const output = 'Auto-trigger detected';
      const result: AutoTriggerDetectionResult = {
        triggered: true,
        triggerType: undefined,
        conditions: ['some condition'],
        confidence: 0.7,
      };

      await validateAutoTriggerDetection(output, 'chain-5' as ChainId, 'step-5' as StepId, result);

      expect(lastTrace!.validationResult?.passed).toBe(false);
      expect(lastTrace!.validationResult?.violations).toContain('Trigger type missing when triggered=true');
      expect(lastTrace!.validationResult?.harmonyScore).toBeLessThan(100);
    });

    it('should fail when triggered=true but conditions empty', async () => {
      const output = 'Trigger without conditions';
      const result: AutoTriggerDetectionResult = {
        triggered: true,
        triggerType: 'second-opinion',
        conditions: [],
        confidence: 0.8,
      };

      await validateAutoTriggerDetection(output, 'chain-6' as ChainId, 'step-6' as StepId, result);

      expect(lastTrace!.validationResult?.passed).toBe(false);
      expect(lastTrace!.validationResult?.violations).toContain('No conditions specified for trigger');
    });

    it('should fail for unauthorized trigger types', async () => {
      const output = 'Unauthorized trigger';
      const result: AutoTriggerDetectionResult = {
        triggered: true,
        triggerType: 'auto-commit',
        conditions: ['commit needed'],
        confidence: 0.9,
      };

      await validateAutoTriggerDetection(output, 'chain-7' as ChainId, 'step-7' as StepId, result);

      expect(lastTrace!.validationResult?.passed).toBe(false);
      expect(lastTrace!.validationResult?.violations).toContain('Unauthorized trigger type: auto-commit');
    });

    it('should fail when markers detected but no result provided', async () => {
      const output = 'Second-opinion required after review';

      await validateAutoTriggerDetection(output, 'chain-8' as ChainId, 'step-8' as StepId);

      expect(lastTrace!.validationResult?.passed).toBe(false);
      expect(lastTrace!.validationResult?.violations).toContain('Trigger markers detected but no detection result provided');
    });

    it('should accumulate multiple violations', async () => {
      const output = 'Badly formed trigger';
      const result: AutoTriggerDetectionResult = {
        triggered: true,
        triggerType: undefined,
        conditions: [],
        confidence: 0.5,
      };

      await validateAutoTriggerDetection(output, 'chain-9' as ChainId, 'step-9' as StepId, result);

      expect(lastTrace!.validationResult?.passed).toBe(false);
      expect(lastTrace!.validationResult?.violations.length).toBeGreaterThan(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty input without result', async () => {
      await validateAutoTriggerDetection('', 'chain-10' as ChainId, 'step-10' as StepId);

      expect(lastTrace!.validationResult?.passed).toBe(true);
      expect(lastTrace!.metadata?.hasTriggerMarkers).toBe(false);
    });

    it('should handle multiline output with markers', async () => {
      const output = `
        Processing...
        Detected second-opinion requirement
        After review completion
      `;
      const result: AutoTriggerDetectionResult = {
        triggered: true,
        triggerType: 'second-opinion',
        conditions: ['review completed'],
        confidence: 0.9,
      };

      await validateAutoTriggerDetection(output, 'chain-11' as ChainId, 'step-11' as StepId, result);

      expect(lastTrace!.validationResult?.passed).toBe(true);
      expect(lastTrace!.metadata?.triggerMarkersDetected).toContain('secondOpinion');
    });

    it('should handle case-insensitive markers', async () => {
      const output = 'SECOND-OPINION after REVIEW';
      const result: AutoTriggerDetectionResult = {
        triggered: true,
        triggerType: 'second-opinion',
        conditions: ['after review'],
        confidence: 0.88,
      };

      await validateAutoTriggerDetection(output, 'chain-12' as ChainId, 'step-12' as StepId, result);

      expect(lastTrace!.validationResult?.passed).toBe(true);
      expect(lastTrace!.metadata?.triggerMarkersDetected.length).toBeGreaterThan(0);
    });

    it('should truncate long output to 500 chars', async () => {
      const longOutput = 'Second-opinion after review ' + 'x'.repeat(600);
      const result: AutoTriggerDetectionResult = {
        triggered: true,
        triggerType: 'second-opinion',
        conditions: ['after review'],
        confidence: 0.85,
      };

      await validateAutoTriggerDetection(longOutput, 'chain-13' as ChainId, 'step-13' as StepId, result);

      expect(lastTrace!.orchestratorOutput.length).toBeLessThanOrEqual(500);
    });

    it('should handle various triggerType formats', async () => {
      const testCases = [
        { triggerType: 'second-opinion' },
        { triggerType: 'secondOpinion' },
        { triggerType: 'SECOND-OPINION' },
      ];

      for (const { triggerType } of testCases) {
        const result: AutoTriggerDetectionResult = {
          triggered: true,
          triggerType,
          conditions: ['test'],
          confidence: 0.9,
        };

        await validateAutoTriggerDetection(`Trigger: ${triggerType}`, 'chain-x' as ChainId, 'step-x' as StepId, result);

        expect(lastTrace!.validationResult?.passed).toBe(true);
      }
    });
  });

  describe('Pattern Detection', () => {
    it('should detect all trigger markers', async () => {
      const output = 'Auto-trigger: second-opinion after review, inserting step';
      const result: AutoTriggerDetectionResult = {
        triggered: true,
        triggerType: 'second-opinion',
        conditions: ['after review'],
        confidence: 0.92,
      };

      await validateAutoTriggerDetection(output, 'chain-14' as ChainId, 'step-14' as StepId, result);

      expect(lastTrace!.metadata?.triggerMarkers.secondOpinion).toBe(true);
      expect(lastTrace!.metadata?.triggerMarkers.autoTrigger).toBe(true);
      expect(lastTrace!.metadata?.triggerMarkers.insertStep).toBe(true);
      expect(lastTrace!.metadata?.triggerMarkers.afterReview).toBe(true);
      expect(lastTrace!.metadata?.hasTriggerMarkers).toBe(true);
    });

    it('should detect authorized trigger patterns', async () => {
      const output = 'Second-opinion after review detected';
      const result: AutoTriggerDetectionResult = {
        triggered: true,
        triggerType: 'second-opinion',
        conditions: ['after review'],
        confidence: 0.93,
      };

      await validateAutoTriggerDetection(output, 'chain-15' as ChainId, 'step-15' as StepId, result);

      expect(lastTrace!.metadata?.authorizedTriggersDetected).toContain('secondOpinionAfterReview');
    });

    it('should detect second-opinion after audit pattern', async () => {
      const output = 'Inserting second-opinion after audit completion';
      const result: AutoTriggerDetectionResult = {
        triggered: true,
        triggerType: 'second-opinion',
        conditions: ['after audit'],
        confidence: 0.91,
      };

      await validateAutoTriggerDetection(output, 'chain-16' as ChainId, 'step-16' as StepId, result);

      expect(lastTrace!.metadata?.triggerMarkers.afterAudit).toBe(true);
      expect(lastTrace!.metadata?.authorizedTriggersDetected).toContain('secondOpinionAfterAudit');
    });
  });

  describe('Metadata Fields', () => {
    it('should populate all required trace fields', async () => {
      const chainId = 'chain-meta' as ChainId;
      const stepId = 'step-meta' as StepId;
      const result: AutoTriggerDetectionResult = {
        triggered: true,
        triggerType: 'second-opinion',
        conditions: ['after review'],
        confidence: 0.9,
      };

      await validateAutoTriggerDetection('Second-opinion after review', chainId, stepId, result);

      expect(lastTrace!.gateId).toBe('gate-10');
      expect(lastTrace!.gateName).toBe('Auto-Trigger Detection');
      expect(lastTrace!.chainId).toBe(chainId);
      expect(lastTrace!.stepId).toBe(stepId);
      expect(lastTrace!.timestamp).toBeDefined();
      expect(lastTrace!.input).toBe('Auto-trigger condition evaluation');
      expect(lastTrace!.alternatives).toContain('second-opinion (after review/audit)');
      expect(lastTrace!.selected).toBeDefined();
      expect(lastTrace!.rationale).toBeDefined();
      expect(lastTrace!.confidence).toBeDefined();
      expect(lastTrace!.validationResult).toBeDefined();
      expect(lastTrace!.duration).toBeGreaterThanOrEqual(0);
    });

    it('should set appropriate confidence levels', async () => {
      // High confidence - valid
      const validResult: AutoTriggerDetectionResult = {
        triggered: true,
        triggerType: 'second-opinion',
        conditions: ['after review'],
        confidence: 0.95,
      };
      await validateAutoTriggerDetection('Second-opinion after review', 'chain-v' as ChainId, 'step-v' as StepId, validResult);
      expect(lastTrace!.confidence).toBe('high');

      // Medium confidence - invalid
      const invalidResult: AutoTriggerDetectionResult = {
        triggered: true,
        triggerType: undefined,
        conditions: [],
        confidence: 0.5,
      };
      await validateAutoTriggerDetection('Invalid trigger', 'chain-w' as ChainId, 'step-w' as StepId, invalidResult);
      expect(lastTrace!.confidence).toBe('medium');
    });

    it('should set appropriate trace levels', async () => {
      const validResult: AutoTriggerDetectionResult = {
        triggered: true,
        triggerType: 'second-opinion',
        conditions: ['after review'],
        confidence: 0.9,
      };
      await validateAutoTriggerDetection('Valid trigger', 'chain-x' as ChainId, 'step-x' as StepId, validResult);
      expect(lastTrace!.traceLevel).toBe('DEBUG');

      const invalidResult: AutoTriggerDetectionResult = {
        triggered: true,
        triggerType: undefined,
        conditions: [],
        confidence: 0.5,
      };
      await validateAutoTriggerDetection('Invalid trigger', 'chain-y' as ChainId, 'step-y' as StepId, invalidResult);
      expect(lastTrace!.traceLevel).toBe('WARN');
    });

    it('should include conditions in metadata and rationale', async () => {
      const result: AutoTriggerDetectionResult = {
        triggered: true,
        triggerType: 'second-opinion',
        conditions: ['after review/', 'quality threshold met', 'team policy'],
        confidence: 0.88,
      };

      await validateAutoTriggerDetection('Trigger evaluation', 'chain-z' as ChainId, 'step-z' as StepId, result);

      expect(lastTrace!.metadata?.conditions).toEqual(['after review/', 'quality threshold met', 'team policy']);
      expect(lastTrace!.rationale).toContain('after review/');
      expect(lastTrace!.rationale).toContain('quality threshold met');
      expect(lastTrace!.rationale).toContain('team policy');
    });
  });

  describe('Error Handling', () => {
    it('should handle validation without throwing', async () => {
      const result: AutoTriggerDetectionResult = {
        triggered: true,
        triggerType: 'second-opinion',
        conditions: ['after review'],
        confidence: 0.9,
      };

      await expect(
        validateAutoTriggerDetection('Second-opinion after review', 'chain-err' as ChainId, 'step-err' as StepId, result)
      ).resolves.not.toThrow();
    });
  });

  describe('Alternatives Field', () => {
    it('should include proper alternatives in trace', async () => {
      const result: AutoTriggerDetectionResult = {
        triggered: false,
        conditions: [],
        confidence: 1.0,
      };

      await validateAutoTriggerDetection('Evaluating', 'chain-alt' as ChainId, 'step-alt' as StepId, result);

      expect(lastTrace!.alternatives).toBeDefined();
      expect(lastTrace!.alternatives).toContain('second-opinion (after review/audit)');
      expect(lastTrace!.alternatives).toContain('no-trigger');
    });
  });
});
