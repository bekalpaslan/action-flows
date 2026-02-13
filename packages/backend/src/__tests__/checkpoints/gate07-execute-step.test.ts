import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { validateExecuteStep } from '../../services/checkpoints/gate07-execute-step.js';
import type { ChainId, StepId, GateTrace } from '@afw/shared';
import { getGateCheckpoint, initGateCheckpoint } from '../../services/gateCheckpoint.js';
import { storage as memoryStorage } from '../../storage/memory.js';

describe('Gate 7: Execute Step Validator', () => {
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
    it('should validate "Spawning Step N:" format', async () => {
      await validateExecuteStep('Spawning Step 1: code/backend/ (opus-4.6)', 'chain-1' as ChainId, 'step-1' as StepId);

      expect(lastTrace).not.toBeNull();
      expect(lastTrace!.validationResult?.passed).toBe(true);
      expect(lastTrace!.validationResult?.harmonyScore).toBe(100);
      expect(lastTrace!.validationResult?.violations).toEqual([]);
      expect(lastTrace!.selected).toBe('code/backend/');
      expect(lastTrace!.confidence).toBe('high');
      expect(lastTrace!.metadata?.extractedStepNumber).toBe(1);
      expect(lastTrace!.metadata?.actionType).toBe('code/backend/');
      expect(lastTrace!.metadata?.model).toBe('opus-4.6');
    });

    it('should validate "Executing Step N:" format', async () => {
      await validateExecuteStep('Executing Step 5: review/ (opus-4.6)', 'chain-2' as ChainId, 'step-2' as StepId);

      expect(lastTrace!.validationResult?.passed).toBe(true);
      expect(lastTrace!.validationResult?.harmonyScore).toBe(100);
      expect(lastTrace!.metadata?.extractedStepNumber).toBe(5);
      expect(lastTrace!.metadata?.actionType).toBe('review/');
    });

    it('should validate hyphenated action names', async () => {
      await validateExecuteStep('Spawning Step 3: second-opinion/ (sonnet-4.5)', 'chain-3' as ChainId, 'step-3' as StepId);

      expect(lastTrace!.validationResult?.passed).toBe(true);
      expect(lastTrace!.metadata?.actionType).toBe('second-opinion/');
    });

    it('should validate nested action paths', async () => {
      await validateExecuteStep('Spawning Step 10: code/frontend/react/ (opus-4.6)', 'chain-4' as ChainId, 'step-4' as StepId);

      expect(lastTrace!.validationResult?.passed).toBe(true);
      expect(lastTrace!.metadata?.actionType).toBe('code/frontend/react/');
      expect(lastTrace!.metadata?.extractedStepNumber).toBe(10);
    });
  });

  describe('Invalid Inputs - Reduced Harmony Scores', () => {
    it('should fail when no execution marker present', async () => {
      await validateExecuteStep('Just some random output', 'chain-5' as ChainId, 'step-5' as StepId);

      expect(lastTrace!.validationResult?.passed).toBe(false);
      expect(lastTrace!.validationResult?.harmonyScore).toBeLessThan(100);
      expect(lastTrace!.validationResult?.violations).toContain('No execution marker detected (Spawning/Executing/Step prefix)');
    });

    it('should fail when step number is missing', async () => {
      await validateExecuteStep('Spawning: code/backend/ (opus-4.6)', 'chain-6' as ChainId, 'step-6' as StepId);

      expect(lastTrace!.validationResult?.passed).toBe(false);
      expect(lastTrace!.validationResult?.violations).toContain('Step number not found in output');
    });

    it('should fail when action type is missing', async () => {
      await validateExecuteStep('Spawning Step 1: (opus-4.6)', 'chain-7' as ChainId, 'step-7' as StepId);

      expect(lastTrace!.validationResult?.passed).toBe(false);
      expect(lastTrace!.validationResult?.violations).toContain('Action type not specified');
    });

    it('should fail when model is missing', async () => {
      await validateExecuteStep('Spawning Step 1: code/backend/', 'chain-8' as ChainId, 'step-8' as StepId);

      expect(lastTrace!.validationResult?.passed).toBe(false);
      expect(lastTrace!.validationResult?.violations).toContain('Model not specified');
    });

    it('should accumulate multiple violations', async () => {
      await validateExecuteStep('Invalid text', 'chain-9' as ChainId, 'step-9' as StepId);

      expect(lastTrace!.validationResult?.passed).toBe(false);
      expect(lastTrace!.validationResult?.violations.length).toBeGreaterThan(2);
    });

    it('should set confidence to medium when validation fails', async () => {
      await validateExecuteStep('Spawning Step 1:', 'chain-10' as ChainId, 'step-10' as StepId);

      expect(lastTrace!.confidence).toBe('medium');
      expect(lastTrace!.traceLevel).toBe('WARN');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty input', async () => {
      await validateExecuteStep('', 'chain-11' as ChainId, 'step-11' as StepId);

      expect(lastTrace!.validationResult?.passed).toBe(false);
      expect(lastTrace!.validationResult?.violations.length).toBeGreaterThan(0);
    });

    it('should handle multiline output with marker', async () => {
      const output = `
        Some context...
        Spawning Step 3: analyze/ (opus-4.6)
        More details...
      `;
      await validateExecuteStep(output, 'chain-12' as ChainId, 'step-12' as StepId);

      expect(lastTrace!.validationResult?.passed).toBe(true);
      expect(lastTrace!.metadata?.extractedStepNumber).toBe(3);
    });

    it('should handle case-insensitive markers', async () => {
      await validateExecuteStep('spawning step 7: code/ (opus-4.6)', 'chain-13' as ChainId, 'step-13' as StepId);

      expect(lastTrace!.validationResult?.passed).toBe(true);
      expect(lastTrace!.metadata?.extractedStepNumber).toBe(7);
    });

    it('should truncate long output to 300 chars', async () => {
      const longOutput = 'Spawning Step 1: code/ (opus-4.6) ' + 'x'.repeat(500);
      await validateExecuteStep(longOutput, 'chain-14' as ChainId, 'step-14' as StepId);

      expect(lastTrace!.orchestratorOutput.length).toBeLessThanOrEqual(300);
    });

    it('should extract multi-digit step numbers', async () => {
      await validateExecuteStep('Spawning Step 123: review/ (sonnet-4.5)', 'chain-15' as ChainId, 'step-15' as StepId);

      expect(lastTrace!.validationResult?.passed).toBe(true);
      expect(lastTrace!.metadata?.extractedStepNumber).toBe(123);
    });
  });

  describe('Pattern Extraction', () => {
    it('should extract all execution markers correctly', async () => {
      await validateExecuteStep('Spawning Step 1: code/ (opus-4.6)', 'chain-16' as ChainId, 'step-16' as StepId);

      expect(lastTrace!.metadata?.executionMarkers.spawning).toBe(true);
      // stepPrefix checks for >>? Step N, so won't match "Spawning Step"
      expect(lastTrace!.metadata?.executionMarkers.stepPrefix).toBe(false);
      expect(lastTrace!.metadata?.executionMarkers.executing).toBe(false);
      expect(lastTrace!.metadata?.hasExecutionMarker).toBe(true);
    });

    it('should extract various action types', async () => {
      const testCases = [
        { input: 'Spawning Step 1: code/ (opus-4.6)', expected: 'code/' },
        { input: 'Spawning Step 1: analyze/codebase/ (opus-4.6)', expected: 'analyze/codebase/' },
        { input: 'Spawning Step 1: second-opinion/ (opus-4.6)', expected: 'second-opinion/' },
      ];

      for (const { input, expected } of testCases) {
        await validateExecuteStep(input, 'chain-x' as ChainId, 'step-x' as StepId);
        expect(lastTrace!.metadata?.actionType).toBe(expected);
      }
    });

    it('should extract various model formats', async () => {
      const testCases = [
        { input: 'Spawning Step 1: code/ (opus-4.6)', expected: 'opus-4.6' },
        { input: 'Spawning Step 1: code/ (sonnet-4.5)', expected: 'sonnet-4.5' },
        { input: 'Spawning Step 1: code/ (haiku-3.5)', expected: 'haiku-3.5' },
      ];

      for (const { input, expected } of testCases) {
        await validateExecuteStep(input, 'chain-y' as ChainId, 'step-y' as StepId);
        expect(lastTrace!.metadata?.model).toBe(expected);
      }
    });
  });

  describe('Metadata Fields', () => {
    it('should populate all required trace fields', async () => {
      const chainId = 'chain-meta' as ChainId;
      const stepId = 'step-meta' as StepId;
      await validateExecuteStep('Spawning Step 1: code/ (opus-4.6)', chainId, stepId);

      expect(lastTrace!.gateId).toBe('gate-07');
      expect(lastTrace!.gateName).toBe('Execute Step');
      expect(lastTrace!.chainId).toBe(chainId);
      expect(lastTrace!.stepId).toBe(stepId);
      expect(lastTrace!.timestamp).toBeDefined();
      expect(lastTrace!.traceLevel).toBe('DEBUG');
      expect(lastTrace!.input).toContain('execution initiation');
      expect(lastTrace!.selected).toBeDefined();
      expect(lastTrace!.rationale).toBeDefined();
      expect(lastTrace!.confidence).toBeDefined();
      expect(lastTrace!.validationResult).toBeDefined();
      expect(lastTrace!.duration).toBeGreaterThanOrEqual(0);
    });

    it('should set appropriate trace levels', async () => {
      await validateExecuteStep('Spawning Step 1: code/ (opus-4.6)', 'chain-v' as ChainId, 'step-v' as StepId);
      expect(lastTrace!.traceLevel).toBe('DEBUG');

      await validateExecuteStep('Invalid format', 'chain-w' as ChainId, 'step-w' as StepId);
      expect(lastTrace!.traceLevel).toBe('WARN');
    });
  });

  describe('Error Handling', () => {
    it('should handle validation without throwing', async () => {
      await expect(
        validateExecuteStep('Spawning Step 1: code/ (opus-4.6)', 'chain-err' as ChainId, 'step-err' as StepId)
      ).resolves.not.toThrow();
    });
  });
});
