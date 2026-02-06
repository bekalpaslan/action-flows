#!/usr/bin/env node
/**
 * ActionFlows Dashboard - Control Command Check Hook
 *
 * Hook: PreToolUse (Task matcher)
 * Purpose: Check for pause/cancel commands before agent spawn and block if needed
 *
 * This hook fires BEFORE each Task tool invocation. It:
 * 1. GETs /sessions/:id/commands to check for pending control commands
 * 2. If pause/cancel command exists, exits with code 2 to BLOCK the tool call
 * 3. If no commands, exits with code 0 to ALLOW the tool call
 *
 * Exit codes:
 * - 0: Allow tool call (no commands pending)
 * - 2: Block tool call (pause/cancel command pending)
 */

import * as fs from 'fs';

// Configuration
const BACKEND_URL = process.env.AFW_BACKEND_URL || 'http://localhost:3001';

interface PreToolUseHookInput {
  tool_name: string;
  tool_input: Record<string, unknown>;
  session_id: string;
}

interface CommandPayload {
  id: string;
  sessionId: string;
  type: 'pause' | 'resume' | 'cancel' | 'retry' | 'skip';
  issuedAt: string;
  target?: {
    stepNumber?: number;
    chainId?: string;
  };
  status: 'pending' | 'acknowledged' | 'expired';
}

/**
 * Fetches pending commands for a session
 */
async function getCommands(sessionId: string): Promise<CommandPayload[]> {
  try {
    const url = `${BACKEND_URL.replace(/\/$/, '')}/api/sessions/${sessionId}/commands`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      console.error(`Failed to get commands: ${response.status} ${response.statusText}`);
      return [];
    }

    const data = await response.json();
    return data.commands || [];
  } catch (error) {
    console.error('Error getting commands:', error instanceof Error ? error.message : 'Unknown error');
    return [];
  }
}

async function main() {
  try {
    // Read hook input from stdin
    const inputData = fs.readFileSync(0, 'utf-8');
    const hookInput: PreToolUseHookInput = JSON.parse(inputData);

    const sessionId = hookInput.session_id;

    // Check for pending commands
    const commands = await getCommands(sessionId);

    // Filter for blocking commands (pause, cancel)
    const blockingCommands = commands.filter(
      cmd => cmd.status === 'pending' && (cmd.type === 'pause' || cmd.type === 'cancel')
    );

    if (blockingCommands.length > 0) {
      const command = blockingCommands[0];

      // Block the tool call
      console.error(`[ActionFlows Dashboard] ${command.type.toUpperCase()} command pending`);

      if (command.type === 'pause') {
        console.error('Chain paused by Dashboard user. Please resume or cancel from Dashboard.');
      } else if (command.type === 'cancel') {
        console.error('Chain cancelled by Dashboard user.');
      }

      // Exit with code 2 to BLOCK the tool call
      process.exit(2);
    }

    // No blocking commands - allow tool call
    console.log('No control commands pending - allowing tool call');
    process.exit(0);
  } catch (error) {
    // Silent failure - log error but exit with code 0 to allow continuation
    console.error('Hook error:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(0);
  }
}

main();
