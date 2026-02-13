/**
 * StepExecutor Service Unit Tests
 * Tests step execution, timeouts, error handling, and permission checks
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { ChainStep, Chain, Session, UserId, StepNumber } from '@afw/shared';
import { toTimestamp, toSessionId, toChainId } from '@afw/shared';
import { StepExecutorService } from '../../services/stepExecutor.js';
import * as permissionService from '../../services/permissionService.js';
import * as claudeCliManager from '../../services/claudeCliManager.js';

// Mock dependencies
vi.mock('../../services/permissionService.js', () => ({
  userHasPermission: vi.fn(),
}));

vi.mock('../../storage/index.js', () => ({
  storage: {
    setChainStep: vi.fn(),
  },
}));

describe('StepExecutorService', () => {
  let executor: StepExecutorService;

  beforeEach(() => {
    executor = new StepExecutorService();
    vi.clearAllMocks();
  });

  /**
   * Helper to create a test step
   */
  function createStep(stepNumber: number): ChainStep {
    return {
      stepNumber: stepNumber as StepNumber,
      action: `action-${stepNumber}`,
      model: 'haiku' as any,
      inputs: { task: `Task ${stepNumber}` },
      waitsFor: [],
      status: 'pending' as any,
    };
  }

  /**
   * Helper to create a test chain
   */
  function createChain(stepCount: number = 1): Chain {
    const steps: ChainStep[] = [];
    for (let i = 1; i <= stepCount; i++) {
      steps.push(createStep(i));
    }

    return {
      id: toChainId('chain-1'),
      sessionId: toSessionId('session-1'),
      title: 'Test Chain',
      steps,
      source: 'composed' as any,
      status: 'pending' as any,
      compiledAt: toTimestamp(new Date().toISOString()),
    };
  }

  /**
   * Helper to create a test session
   */
  function createSession(): Session {
    return {
      id: toSessionId('session-1'),
      cwd: '/tmp/test',
      status: 'active' as any,
      chains: [],
    };
  }

  describe('Step validation', () => {
    it('should validate that step is defined', () => {
      expect(() => {
        executor.validateStepPreconditions(null as any);
      }).toThrow('Step is required');
    });

    it('should validate step number is positive', () => {
      const step: ChainStep = {
        stepNumber: 0 as StepNumber,
        action: 'test',
        model: 'haiku' as any,
        inputs: {},
        waitsFor: [],
        status: 'pending' as any,
      };

      expect(() => {
        executor.validateStepPreconditions(step);
      }).toThrow(/Invalid step number/);
    });

    it('should validate action is provided', () => {
      const step: ChainStep = {
        stepNumber: 1 as StepNumber,
        action: '',
        model: 'haiku' as any,
        inputs: {},
        waitsFor: [],
        status: 'pending' as any,
      };

      expect(() => {
        executor.validateStepPreconditions(step);
      }).toThrow(/action is required/);
    });

    it('should validate model is provided', () => {
      const step: ChainStep = {
        stepNumber: 1 as StepNumber,
        action: 'test',
        model: '' as any,
        inputs: {},
        waitsFor: [],
        status: 'pending' as any,
      };

      expect(() => {
        executor.validateStepPreconditions(step);
      }).toThrow(/model is required/);
    });

    it('should validate inputs is an object', () => {
      const step: ChainStep = {
        stepNumber: 1 as StepNumber,
        action: 'test',
        model: 'haiku' as any,
        inputs: null as any,
        waitsFor: [],
        status: 'pending' as any,
      };

      expect(() => {
        executor.validateStepPreconditions(step);
      }).toThrow(/inputs must be an object/);
    });

    it('should pass valid step', () => {
      const step = createStep(1);

      expect(() => {
        executor.validateStepPreconditions(step);
      }).not.toThrow();
    });
  });

  describe('Permission checks', () => {
    it('should deny execution without execute_chain permission', async () => {
      vi.mocked(permissionService.userHasPermission).mockResolvedValue(false);

      const step = createStep(1);
      const chain = createChain(1);
      const session = createSession();

      const result = await executor.executeStep(
        step,
        chain,
        session,
        'user-1' as any
      );

      expect(result.status).toBe('error');
      expect(result.error).toContain('does not have execute_chain permission');
    });

    it('should allow execution with execute_chain permission', async () => {
      vi.mocked(permissionService.userHasPermission).mockResolvedValue(true);
      vi.mocked(claudeCliManager.claudeCliManager.spawnAgent).mockResolvedValue('Success');

      const step = createStep(1);
      const chain = createChain(1);
      const session = createSession();

      const result = await executor.executeStep(
        step,
        chain,
        session,
        'user-1' as any
      );

      expect(result.status).toBe('completed');
      expect(permissionService.userHasPermission).toHaveBeenCalledWith('user-1', 'execute_chain');
    });
  });

  describe('Step execution', () => {
    beforeEach(() => {
      vi.mocked(permissionService.userHasPermission).mockResolvedValue(true);
    });

    it('should execute a simple step successfully', async () => {
      const step = createStep(1);
      const chain = createChain(1);
      const session = createSession();

      const result = await executor.executeStep(
        step,
        chain,
        session,
        'user-1' as any
      );

      expect(result.status).toBe('completed');
      expect(result.stepNumber).toBe(1);
      expect(result.duration).toBeGreaterThanOrEqual(0);
      expect(result.completedAt).toBeDefined();
    });

    it('should capture output from step execution', async () => {
      const step = createStep(1);
      const chain = createChain(1);
      const session = createSession();

      const result = await executor.executeStep(
        step,
        chain,
        session,
        'user-1' as any
      );

      expect(result.output).toBeDefined();
      expect(result.output.length).toBeGreaterThan(0);
    });

    it('should track step duration', async () => {
      const step = createStep(1);
      const chain = createChain(1);
      const session = createSession();

      const result = await executor.executeStep(
        step,
        chain,
        session,
        'user-1' as any
      );

      expect(result.duration).toBeGreaterThanOrEqual(0);
      expect(typeof result.duration).toBe('number');
    });

    it('should update step status before and after execution', async () => {
      const step = createStep(1);
      const chain = createChain(1);
      const session = createSession();

      await executor.executeStep(
        step,
        chain,
        session,
        'user-1' as any
      );

      // Should have called storage.setChainStep
      const { storage } = await import('../../storage/index.js');
      expect(storage.setChainStep).toHaveBeenCalled();
    });
  });

  describe('Timeout handling', () => {
    beforeEach(() => {
      vi.mocked(permissionService.userHasPermission).mockResolvedValue(true);
    });

    it('should respect custom timeout value', async () => {
      // This test just verifies the timeout parameter is accepted
      const step = createStep(1);
      const chain = createChain(1);
      const session = createSession();

      const result = await executor.executeStep(
        step,
        chain,
        session,
        'user-1' as any,
        30000 // 30 second timeout
      );

      expect(result.stepNumber).toBe(1);
    });

    it('should have 1 hour default timeout', async () => {
      const step = createStep(1);
      const chain = createChain(1);
      const session = createSession();

      const result = await executor.executeStep(
        step,
        chain,
        session,
        'user-1' as any
      );

      // Should complete without timeout
      expect(result.status).not.toBe('timeout');
    });
  });

  describe('Multiple steps', () => {
    beforeEach(() => {
      vi.mocked(permissionService.userHasPermission).mockResolvedValue(true);
    });

    it('should execute steps sequentially', async () => {
      const steps = [createStep(1), createStep(2), createStep(3)];
      const chain = createChain(3);
      const session = createSession();

      const results = await executor.executeStepsSequential(
        steps,
        chain,
        session,
        'user-1' as any
      );

      expect(results).toHaveLength(3);
      results.forEach((result, idx) => {
        expect(result.stepNumber).toBe(idx + 1);
        expect(result.status).toBe('completed');
      });
    });

    it('should execute steps in parallel', async () => {
      const steps = [createStep(1), createStep(2), createStep(3)];
      const chain = createChain(3);
      const session = createSession();

      const results = await executor.executeStepsParallel(
        steps,
        chain,
        session,
        'user-1' as any
      );

      expect(results).toHaveLength(3);
      results.forEach((result, idx) => {
        expect(result.stepNumber).toBe(idx + 1);
        expect(result.status).toBe('completed');
      });
    });
  });

  describe('Error scenarios', () => {
    beforeEach(() => {
      vi.mocked(permissionService.userHasPermission).mockResolvedValue(true);
    });

    it('should handle permission denial gracefully', async () => {
      vi.mocked(permissionService.userHasPermission).mockResolvedValue(false);

      const step = createStep(1);
      const chain = createChain(1);
      const session = createSession();

      const result = await executor.executeStep(
        step,
        chain,
        session,
        'user-1' as any
      );

      expect(result.status).toBe('error');
      expect(result.error).toContain('permission');
    });

    it('should handle step execution result', async () => {
      const step = createStep(1);
      const chain = createChain(1);
      const session = createSession();

      const result = await executor.executeStep(
        step,
        chain,
        session,
        'user-1' as any
      );

      expect(result.result).toBeDefined();
    });
  });

  describe('Edge cases', () => {
    beforeEach(() => {
      vi.mocked(permissionService.userHasPermission).mockResolvedValue(true);
    });

    it('should handle step with no inputs', async () => {
      const step = createStep(1);
      step.inputs = {};
      const chain = createChain(1);
      const session = createSession();

      const result = await executor.executeStep(
        step,
        chain,
        session,
        'user-1' as any
      );

      expect(result.status).toBe('completed');
    });

    it('should handle step with many inputs', async () => {
      const step = createStep(1);
      step.inputs = {
        param1: 'value1',
        param2: 'value2',
        param3: { nested: 'value' },
        param4: [1, 2, 3],
        param5: 'very long string ' + 'x'.repeat(1000),
      };
      const chain = createChain(1);
      const session = createSession();

      const result = await executor.executeStep(
        step,
        chain,
        session,
        'user-1' as any
      );

      expect(result.status).toBe('completed');
    });
  });
});
