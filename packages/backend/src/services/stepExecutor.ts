/**
 * Step Executor Service
 * Executes individual chain steps via Claude CLI, tracks status and results.
 * Handles timeouts, error capture, and WebSocket event broadcasting.
 */

import type { ChainStep, Chain, Session, SessionId, StepNumber, Timestamp, DurationMs, UserId } from '@afw/shared';
import { toTimestamp } from '@afw/shared';
import { storage } from '../storage/index.js';
import { userHasPermission } from './permissionService.js';

/**
 * Result of a step execution
 */
export interface StepResult {
  /** Step number that was executed */
  stepNumber: StepNumber;

  /** Final status of the step */
  status: 'completed' | 'failed' | 'timeout' | 'error';

  /** Result output from the step (if successful) */
  result?: unknown;

  /** Error message (if failed) */
  error?: string;

  /** Duration of execution in milliseconds */
  duration: DurationMs;

  /** Raw CLI output */
  output: string;

  /** When the step completed */
  completedAt: Timestamp;

  /** Timeout applied to this step execution (in milliseconds) */
  timeoutMs?: DurationMs;
}

/**
 * Step Executor Service
 * Executes steps from chains via Claude CLI
 */
export class StepExecutorService {
  /**
   * Execute a single step
   *
   * @param step - Step to execute
   * @param chain - Chain containing the step
   * @param session - Session context
   * @param userId - User ID for permission checks
   * @param timeoutMs - Timeout in milliseconds (default 1 hour)
   * @returns StepResult with execution details
   * @throws Error if step preconditions fail
   */
  async executeStep(
    step: ChainStep,
    chain: Chain,
    session: Session,
    userId: UserId,
    timeoutMs = 3600000 // 1 hour default
  ): Promise<StepResult> {
    const startTime = Date.now();

    try {
      // Validate preconditions
      this.validateStepPreconditions(step);

      // Check permissions
      const hasPermission = await userHasPermission(userId, 'execute_chain');
      if (!hasPermission) {
        return {
          stepNumber: step.stepNumber,
          status: 'error',
          error: `User ${userId} does not have execute_chain permission`,
          duration: Date.now() - startTime as DurationMs,
          output: '',
          completedAt: toTimestamp(new Date().toISOString()),
        };
      }

      // Update step status to in_progress
      // ChainStep.status uses StatusString which includes 'in_progress' | 'completed' | 'failed' | 'pending' | 'skipped'
      step.status = 'in_progress';
      step.startedAt = toTimestamp(new Date().toISOString());
      const setChainStepFn = storage.setChainStep;
      if (!setChainStepFn) {
        throw new Error('Storage implementation must provide setChainStep method');
      }
      await setChainStepFn(chain.id, step.stepNumber, step);

      // Execute via Claude CLI
      const { output, result, error, timedOut } = await this.spawnAgent(
        step,
        chain,
        session,
        timeoutMs
      );

      const duration = Date.now() - startTime;
      const completedAt = toTimestamp(new Date().toISOString());

      // Determine status
      // StepResult status: 'completed' | 'failed' | 'timeout' | 'error'
      // This differs from ChainStep.status which uses StatusString ('in_progress', 'completed', 'failed', etc.)
      let status: StepResult['status'] = 'completed';
      if (timedOut) {
        status = 'timeout';
      } else if (error) {
        status = 'failed';
      }

      // Update step in storage
      // Map step result status to valid StatusString
      const statusMap: Record<string, 'completed' | 'failed' | 'skipped'> = {
        'completed': 'completed',
        'failed': 'failed',
        'timeout': 'failed',
        'error': 'failed',
      };
      const validStatus = statusMap[status] ?? 'failed';

      const updatedStep: ChainStep = {
        ...step,
        status: validStatus,
        completedAt,
        duration: duration as DurationMs,
        result,
        error,
      };
      const setChainStepFn2 = storage.setChainStep;
      if (!setChainStepFn2) {
        throw new Error('Storage implementation must provide setChainStep method');
      }
      await setChainStepFn2(chain.id, step.stepNumber, updatedStep);

      const stepResult: StepResult = {
        stepNumber: step.stepNumber,
        status,
        result,
        error,
        duration: duration as DurationMs,
        output,
        completedAt,
        timeoutMs: timeoutMs as DurationMs,
      };

      // Broadcast completion event
      this.broadcastStepEvent(chain.sessionId, step.stepNumber, status);

      return stepResult;
    } catch (err) {
      const duration = Date.now() - startTime;
      const completedAt = toTimestamp(new Date().toISOString());
      const errorMsg = err instanceof Error ? err.message : String(err);

      // Update step status
      step.status = 'failed';
      step.completedAt = completedAt;
      step.duration = duration as DurationMs;
      step.error = errorMsg;
      const stepStorage = storage.setChainStep;
      if (!stepStorage) {
        throw new Error('Storage implementation must provide setChainStep method');
      }
      await stepStorage(chain.id, step.stepNumber, step);

      return {
        stepNumber: step.stepNumber,
        status: 'error',
        error: errorMsg,
        duration: duration as DurationMs,
        output: '',
        completedAt,
        timeoutMs: timeoutMs as DurationMs,
      };
    }
  }

  /**
   * Validate step preconditions before execution
   *
   * @param step - Step to validate
   * @throws Error if step is invalid
   */
  validateStepPreconditions(step: ChainStep): void {
    if (!step) {
      throw new Error('Step is required');
    }

    if (step.stepNumber < 1) {
      throw new Error(`Invalid step number: ${step.stepNumber}`);
    }

    if (!step.action || step.action.trim().length === 0) {
      throw new Error(`Step ${step.stepNumber}: action is required`);
    }

    if (!step.model || step.model.trim().length === 0) {
      throw new Error(`Step ${step.stepNumber}: model is required`);
    }

    if (!step.inputs || typeof step.inputs !== 'object') {
      throw new Error(`Step ${step.stepNumber}: inputs must be an object`);
    }
  }

  /**
   * Spawn an agent via Claude CLI and capture output
   *
   * @param step - Step to execute
   * @param chain - Chain for context
   * @param session - Session for context
   * @param timeoutMs - Timeout in milliseconds
   * @returns Output, result, error, and timeout flag
   *
   * IMPLEMENTATION CONTRACT:
   * This method must spawn an agent process with the given step configuration.
   * Expected behavior:
   * - Input: ChainStep with action, model, inputs
   * - Process: Spawn agent via claudeCliManager or similar
   * - Output: Agent execution result (stdout/stderr/exit code)
   * - Timeout: Enforce timeoutMs deadline, return timedOut=true if exceeded
   *
   * PLACEHOLDER STATUS:
   * Currently returns mock data. Awaiting integration with claudeCliManager.
   * This is a critical path blocker - see GitHub issue [AGENT_SPAWN_INTEGRATION].
   */
  private async spawnAgent(
    step: ChainStep,
    chain: Chain,
    session: Session,
    timeoutMs: number
  ): Promise<{
    output: string;
    result?: unknown;
    error?: string;
    timedOut: boolean;
  }> {
    // Build agent inputs from step definition
    const agentInputs = {
      task: `Execute chain step: ${step.action}`,
      context: JSON.stringify({
        chain: {
          id: chain.id,
          title: chain.title,
        },
        step: {
          number: step.stepNumber,
          action: step.action,
          model: step.model,
        },
        session: {
          id: session.id,
          cwd: session.cwd,
        },
      }),
      ...step.inputs,
    };

    // Create timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Step ${step.stepNumber} execution timeout after ${timeoutMs}ms`));
      }, timeoutMs);
    });

    try {
      // INTEGRATION POINT: claudeCliManager.startSession()
      // TODO: Replace mock result with actual agent spawning:
      // const result = await claudeCliManager.startSession({
      //   action: step.action,
      //   model: step.model,
      //   inputs: agentInputs,
      // });

      // For now, we return a simulated success result
      const result = await Promise.race([
        Promise.resolve({
          success: true,
          output: `Step ${step.stepNumber} (${step.action}) executed successfully`,
          ...agentInputs,
        }),
        timeoutPromise,
      ]);

      return {
        output: typeof result === 'string' ? result : JSON.stringify(result),
        result,
        timedOut: false,
      };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      const timedOut = errorMsg.includes('timeout') || errorMsg.includes('Timeout');

      return {
        output: errorMsg,
        error: errorMsg,
        timedOut,
      };
    }
  }

  /**
   * Broadcast step event to WebSocket clients
   *
   * @param sessionId - Session ID
   * @param stepNumber - Step number
   * @param status - Completion status from StepResult ('completed' | 'failed' | 'timeout' | 'error')
   *
   * CONTRACT: This method logs step completion. WebSocket event broadcasting
   * is handled by the route handler after this service completes.
   * See packages/backend/src/routes/chains.ts for WebSocket event emission.
   *
   * INTEGRATION POINT: Route handler should listen to this service and emit:
   * - 'step:completed' when status is 'completed'
   * - 'step:failed' when status is 'failed' or 'error'
   * - 'step:timeout' when status is 'timeout'
   *
   * TODO: Implement route handler in packages/backend/src/routes/chains.ts to:
   * 1. Call stepExecutor.executeStep()
   * 2. Broadcast appropriate WebSocket event based on result status
   * 3. Use broadcastEvent utility to emit to all clients in the session
   */
  private broadcastStepEvent(sessionId: SessionId, stepNumber: StepNumber, status: string): void {
    // Log for debugging; WebSocket broadcast happens in route handler
    console.log(
      `[StepExecutor] Step ${stepNumber} in session ${sessionId} completed with status: ${status}`
    );
  }

  /**
   * Execute multiple steps in sequence
   *
   * @param steps - Steps to execute (assumed to be in order)
   * @param chain - Chain containing steps
   * @param session - Session context
   * @param userId - User ID
   * @returns Array of StepResult objects
   */
  async executeStepsSequential(
    steps: ChainStep[],
    chain: Chain,
    session: Session,
    userId: UserId
  ): Promise<StepResult[]> {
    const results: StepResult[] = [];

    for (const step of steps) {
      const result = await this.executeStep(step, chain, session, userId);
      results.push(result);

      // Stop on failure unless step specifies continue-on-error
      if (result.status === 'failed' || result.status === 'error') {
        // Could check step.continueOnError flag here if implemented
        break;
      }
    }

    return results;
  }

  /**
   * Execute multiple steps in parallel (for batches)
   *
   * @param steps - Steps to execute concurrently
   * @param chain - Chain containing steps
   * @param session - Session context
   * @param userId - User ID
   * @returns Array of StepResult objects
   */
  async executeStepsParallel(
    steps: ChainStep[],
    chain: Chain,
    session: Session,
    userId: UserId
  ): Promise<StepResult[]> {
    const promises = steps.map((step) => this.executeStep(step, chain, session, userId));
    return Promise.all(promises);
  }
}

// Export singleton instance
export const stepExecutor = new StepExecutorService();
