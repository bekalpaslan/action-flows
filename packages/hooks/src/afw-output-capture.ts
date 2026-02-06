#!/usr/bin/env node
/**
 * ActionFlows Dashboard - Output Capture Hook
 *
 * Hook: PostToolUse (matcher: Bash)
 * Purpose: Capture stdout/stderr from agent bash commands and send to Dashboard
 *
 * This hook fires AFTER Bash tool execution and:
 * 1. Detects which step is running (from context)
 * 2. Captures command output from tool result
 * 3. POSTs to /terminal/:sessionId/output with stream attribution
 *
 * Note: This is a PASSIVE hook - it doesn't modify behavior, only observes output.
 */

import * as fs from 'fs';

// Configuration
const BACKEND_URL = process.env.AFW_BACKEND_URL || 'http://localhost:3001';
const ENABLED = process.env.AFW_ENABLED === 'true';

interface PostToolUseInput {
  tool_name: string;
  tool_input: any;
  tool_result: {
    system?: string;
    error?: string;
    output?: string;
  };
  session_id: string;
  cwd: string;
}

/**
 * Extract step number from recent conversation context
 * Looks for patterns like "Step 3:" in the tool input or recent messages
 */
function extractStepNumber(data: PostToolUseInput): number | undefined {
  try {
    // Check if tool input contains step reference
    const toolInputStr = JSON.stringify(data.tool_input || {});
    const stepMatch = toolInputStr.match(/Step\s+(\d+)|#(\d+)/i);

    if (stepMatch) {
      const stepNum = parseInt(stepMatch[1] || stepMatch[2], 10);
      if (!isNaN(stepNum)) {
        return stepNum;
      }
    }

    return undefined;
  } catch (error) {
    return undefined;
  }
}

/**
 * Extract action name from tool input
 * Looks for patterns like "Read your definition in .claude/actionflows/actions/{action}/"
 */
function extractAction(data: PostToolUseInput): string | undefined {
  try {
    const toolInputStr = JSON.stringify(data.tool_input || {});

    // Pattern: .claude/actionflows/actions/{action}/
    const actionMatch = toolInputStr.match(/\.claude\/actionflows\/actions\/([^\/]+)\//);
    if (actionMatch) {
      return actionMatch[1] + '/';
    }

    // Fallback: Common action names
    const commonActions = ['code', 'review', 'audit', 'test', 'analyze', 'plan', 'notify', 'commit'];
    for (const action of commonActions) {
      if (toolInputStr.includes(`${action}/`) || toolInputStr.includes(`${action}:`)) {
        return action + '/';
      }
    }

    return undefined;
  } catch (error) {
    return undefined;
  }
}

/**
 * Post terminal output to backend
 */
async function postTerminalOutput(
  sessionId: string,
  output: string,
  stream: 'stdout' | 'stderr',
  stepNumber?: number,
  action?: string
): Promise<void> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/terminal/${sessionId}/output`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        output,
        stream,
        stepNumber,
        action,
      }),
    });

    if (!response.ok) {
      console.error(`[AFW] Failed to post terminal output: ${response.statusText}`);
    }
  } catch (error) {
    // Silent failure - don't break Claude execution
  }
}

/**
 * Main hook logic
 */
async function main() {
  if (!ENABLED) {
    process.exit(0); // Silently pass through
  }

  try {
    // Read stdin (hook input)
    const input = fs.readFileSync(0, 'utf-8');
    const data: PostToolUseInput = JSON.parse(input);

    // Only process Bash tool calls
    if (data.tool_name !== 'Bash') {
      process.exit(0); // Not a bash command, pass through
    }

    const { session_id, tool_result } = data;

    // Extract output (stdout/stderr might be in different fields)
    const stdout = tool_result.output || tool_result.system || '';
    const stderr = tool_result.error || '';

    // Extract context
    const stepNumber = extractStepNumber(data);
    const action = extractAction(data);

    // Post stdout if present
    if (stdout && stdout.trim()) {
      await postTerminalOutput(session_id, stdout, 'stdout', stepNumber, action);
    }

    // Post stderr if present
    if (stderr && stderr.trim()) {
      await postTerminalOutput(session_id, stderr, 'stderr', stepNumber, action);
    }

    process.exit(0); // Pass through
  } catch (error) {
    // Silent failure
    console.error('[AFW] Error in output capture hook:', error);
    process.exit(0);
  }
}

main();
