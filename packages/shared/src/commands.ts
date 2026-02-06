/**
 * Command Types for ActionFlows System
 * Defines commands that can be issued to control session, chains, and steps
 */

import type { StepNumber, Timestamp } from './types';

/**
 * Command types that can be issued
 */
export enum CommandType {
  PAUSE = 'pause',
  RESUME = 'resume',
  CANCEL = 'cancel',
  RETRY = 'retry',
  SKIP = 'skip',
  ABORT = 'abort',
}

export type CommandTypeString = keyof typeof CommandType | 'pause' | 'resume' | 'cancel' | 'retry' | 'skip' | 'abort';

/**
 * Base command structure
 */
export interface Command {
  /** Type of command */
  type: CommandTypeString;

  /** Optional step this command targets */
  stepNumber?: StepNumber;

  /** Optional reason/context for the command */
  reason?: string;

  /** Additional options */
  options?: Record<string, unknown>;
}

/**
 * Session-level commands
 */

export interface PauseCommand extends Command {
  type: 'pause';

  /** Pause after completing current step (true) or immediately (false) */
  graceful?: boolean;

  /** Reason for pausing */
  reason?: string;
}

export interface ResumeCommand extends Command {
  type: 'resume';

  /** Resume from current step (true) or from beginning (false) */
  fromCurrent?: boolean;
}

export interface CancelCommand extends Command {
  type: 'cancel';

  /** Cancel current step only (true) or entire chain (false) */
  stepOnly?: boolean;

  /** Reason for cancellation */
  reason?: string;

  /** Whether to clean up created files */
  cleanup?: boolean;
}

export interface AbortCommand extends Command {
  type: 'abort';

  /** Emergency reason */
  reason: string;

  /** Whether to force kill all processes */
  forceful?: boolean;
}

/**
 * Step-level commands
 */

export interface RetryCommand extends Command {
  type: 'retry';

  /** Step to retry */
  stepNumber: StepNumber;

  /** Number of times to retry */
  maxRetries?: number;

  /** Delay between retries in milliseconds */
  retryDelayMs?: number;

  /** Whether to modify inputs before retry */
  modifiedInputs?: Record<string, unknown>;

  /** Reason for retry */
  reason?: string;
}

export interface SkipCommand extends Command {
  type: 'skip';

  /** Step to skip */
  stepNumber: StepNumber;

  /** Reason for skipping */
  reason?: string;

  /** Whether dependent steps should also be skipped */
  skipDependents?: boolean;
}

/**
 * Command Payload - wraps command with metadata
 */
export interface CommandPayload {
  /** Unique command ID for tracking */
  commandId: string;

  /** The actual command */
  command: Command;

  /** When command was issued */
  issuedAt: Timestamp;

  /** Session this command targets */
  sessionId?: string;

  /** Chain this command targets */
  chainId?: string;

  /** User who issued the command */
  userId?: string;

  /** Additional context */
  context?: Record<string, unknown>;
}

/**
 * Command execution result
 */
export interface CommandResult {
  /** Command ID that was executed */
  commandId: string;

  /** Whether command executed successfully */
  success: boolean;

  /** Result message */
  message: string;

  /** Any data returned by command execution */
  data?: unknown;

  /** Error if command failed */
  error?: string;

  /** When command execution completed */
  completedAt: Timestamp;

  /** Steps affected by this command */
  affectedSteps?: StepNumber[];
}

/**
 * Type guards for commands
 */
export const commandGuards = {
  isPause: (command: Command): command is PauseCommand => command.type === 'pause',
  isResume: (command: Command): command is ResumeCommand => command.type === 'resume',
  isCancel: (command: Command): command is CancelCommand => command.type === 'cancel',
  isAbort: (command: Command): command is AbortCommand => command.type === 'abort',
  isRetry: (command: Command): command is RetryCommand => command.type === 'retry',
  isSkip: (command: Command): command is SkipCommand => command.type === 'skip',
};

/**
 * Command validation
 */
export class CommandValidator {
  static validate(command: Command): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!command.type) {
      errors.push('Command type is required');
    }

    if (!Object.values(CommandType).includes(command.type as CommandType)) {
      errors.push(`Unknown command type: ${command.type}`);
    }

    // Step-level commands require stepNumber
    if (['retry', 'skip'].includes(command.type)) {
      if (!command.stepNumber) {
        errors.push(`Command ${command.type} requires stepNumber`);
      }
      if (command.stepNumber && command.stepNumber < 1) {
        errors.push('stepNumber must be >= 1');
      }
    }

    // Abort command requires reason
    if (command.type === 'abort' && !command.reason) {
      errors.push('Abort command requires reason');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

/**
 * Command builder - fluent API for building commands
 */
export class CommandBuilder {
  private command: Command;

  constructor(type: CommandTypeString) {
    this.command = { type };
  }

  static pause(): CommandBuilder {
    return new CommandBuilder('pause');
  }

  static resume(): CommandBuilder {
    return new CommandBuilder('resume');
  }

  static cancel(): CommandBuilder {
    return new CommandBuilder('cancel');
  }

  static retry(stepNumber: StepNumber): CommandBuilder {
    const builder = new CommandBuilder('retry');
    builder.command.stepNumber = stepNumber;
    return builder;
  }

  static skip(stepNumber: StepNumber): CommandBuilder {
    const builder = new CommandBuilder('skip');
    builder.command.stepNumber = stepNumber;
    return builder;
  }

  static abort(): CommandBuilder {
    return new CommandBuilder('abort');
  }

  withReason(reason: string): CommandBuilder {
    this.command.reason = reason;
    return this;
  }

  withStepNumber(stepNumber: StepNumber): CommandBuilder {
    this.command.stepNumber = stepNumber;
    return this;
  }

  withOptions(options: Record<string, unknown>): CommandBuilder {
    this.command.options = options;
    return this;
  }

  build(): Command {
    const validation = CommandValidator.validate(this.command);
    if (!validation.valid) {
      throw new Error(`Invalid command: ${validation.errors.join(', ')}`);
    }
    return this.command;
  }
}
