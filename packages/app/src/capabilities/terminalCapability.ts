import type { Capability } from '@afw/shared';
import { toCapabilityId } from '@afw/shared';

/**
 * Terminal Execute Capability
 *
 * Phase 1 of Inspiration Roadmap — Thread 2 (Node Architecture)
 *
 * Executes a command in the dashboard's integrated terminal.
 * This allows the orchestrator to trigger terminal commands
 * and receive execution results.
 *
 * This capability will be registered by the Terminal component.
 */
export const terminalCapability: Capability = {
  id: toCapabilityId('dashboard.terminal.execute'),
  name: 'Terminal Execute',
  description: 'Execute a command in the dashboard terminal',
  provider: 'dashboard',
  invokable: true,
};

/**
 * Input for terminal execution
 */
export interface TerminalExecuteInput {
  command: string;
  cwd?: string; // Optional working directory
  env?: Record<string, string>; // Optional environment variables
}

/**
 * Result of terminal execution
 */
export interface TerminalExecuteResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  duration: number; // milliseconds
}
