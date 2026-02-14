#!/usr/bin/env node
/**
 * ActionFlows Dashboard - Chain Parse Hook
 *
 * Hook: Stop
 * Purpose: Parse chain compilation tables from orchestrator output
 *
 * This hook fires when Claude finishes responding (Stop event). It:
 * 1. Detects chain compilation messages (## Chain:)
 * 2. Parses chain title, metadata, steps table, execution mode
 * 3. Emits ChainCompiledEvent to backend with parsed structure
 * 4. Exits with code 0 (silent failure mode)
 *
 * This enables real-time DAG visualization in the Dashboard.
 */

import * as fs from 'fs';
import { readSettings } from './utils/settings.js';
import { postEvent } from './utils/http.js';
import { brandedTypes, ChainCompiledEvent, ChainStepSnapshot } from '@afw/shared';

// Configuration
const ENABLED = process.env.AFW_ENABLED !== 'false';

interface StopHookInput {
  message: {
    role: string;
    content: string;
  };
  session_id: string;
  transcript_path?: string;
}

/**
 * Checks if message contains a chain compilation
 */
function isChainCompilation(content: string): boolean {
  return /##\s*Chain:/i.test(content);
}

/**
 * Parses chain title from header
 */
function parseChainTitle(content: string): string | null {
  const headerMatch = content.match(/##\s*Chain:\s*(.+?)(?:\n|$)/i);
  if (!headerMatch || !headerMatch[1]) return null;

  return headerMatch[1].trim() || null;
}

/**
 * Parses chain metadata fields
 */
function parseChainMetadata(content: string): {
  request?: string;
  source?: string;
  type?: string;
  ref?: string;
} {
  const metadata: any = {};

  const requestMatch = content.match(/\*\*Request:\*\*\s*(.+?)(?:\n|$)/i);
  if (requestMatch && requestMatch[1]) metadata.request = requestMatch[1].trim();

  const sourceMatch = content.match(/\*\*Source:\*\*\s*(.+?)(?:\n|$)/i);
  if (sourceMatch && sourceMatch[1]) metadata.source = sourceMatch[1].trim();

  const typeMatch = content.match(/\*\*Type:\*\*\s*(.+?)(?:\n|$)/i);
  if (typeMatch && typeMatch[1]) metadata.type = typeMatch[1].trim();

  const refMatch = content.match(/\*\*Ref:\*\*\s*(.+?)(?:\n|$)/i);
  if (refMatch && refMatch[1]) metadata.ref = refMatch[1].trim();

  return metadata;
}

/**
 * Parses chain steps from markdown table
 * Expected format:
 * | # | Action | Model | Key Inputs | Waits For | Status |
 * |---|--------|-------|------------|-----------|--------|
 * | 1 | action/ | model | input=value | — | Pending |
 */
function parseChainSteps(content: string): ChainStepSnapshot[] {
  const steps: ChainStepSnapshot[] = [];

  // Find markdown table
  const tableRegex = /\|[^\n]+\|(?:\n\|[^\n]+\|)+/g;
  const tables = content.match(tableRegex);

  if (!tables || tables.length === 0) {
    return steps;
  }

  const table = tables[0];

  // Split into lines and skip header and separator
  const lines = table.split('\n').filter(line => line.trim().startsWith('|'));

  // Skip first two lines (header + separator)
  const dataLines = lines.slice(2);

  for (const line of dataLines) {
    // Split by | and trim
    const cells = line.split('|').map(cell => cell.trim()).filter(cell => cell.length > 0);

    if (cells.length < 5) continue; // Need at least: #, Action, Model, Inputs, WaitsFor

    const stepNumber = parseInt(cells[0] ?? '0', 10);
    if (isNaN(stepNumber)) continue;

    const action = cells[1] || 'unknown';
    const model = cells[2] || undefined;
    const inputsStr = cells[3] || '';
    const waitsForStr = cells[4] || '—';
    const description = cells.length > 5 ? cells[5] : undefined;

    // Parse inputs (format: "input=value, input2=value2")
    const inputs: Record<string, unknown> = {};
    if (inputsStr && inputsStr !== '—') {
      const inputPairs = inputsStr.split(',').map(p => p.trim());
      for (const pair of inputPairs) {
        const [key, value] = pair.split('=').map(s => s.trim());
        if (key) {
          inputs[key] = value || true;
        }
      }
    }

    // Parse waitsFor (format: "#1" or "#1, #2" or "—" for none)
    const waitsFor: number[] = [];
    if (waitsForStr && waitsForStr !== '—') {
      const refs = waitsForStr.match(/#(\d+)/g);
      if (refs) {
        for (const ref of refs) {
          const num = parseInt(ref.slice(1), 10);
          if (!isNaN(num)) {
            waitsFor.push(num);
          }
        }
      }
    }

    steps.push({
      stepNumber,
      action,
      model,
      inputs,
      waitsFor,
      description,
    });
  }

  return steps;
}

/**
 * Parses execution mode
 */
function parseExecutionMode(content: string): 'sequential' | 'parallel' | 'mixed' {
  const executionMatch = content.match(/\*\*Execution:\*\*\s*(.+)/i);
  if (!executionMatch || !executionMatch[1]) return 'sequential';

  const modeStr = executionMatch[1].toLowerCase();

  if (modeStr.includes('parallel')) {
    return modeStr.includes('→') || modeStr.includes('then') ? 'mixed' : 'parallel';
  }

  if (modeStr.includes('sequential')) {
    return 'sequential';
  }

  if (modeStr.includes('single')) {
    return 'sequential';
  }

  return 'sequential';
}

async function main() {
  if (!ENABLED) {
    process.exit(0); // Silently pass through when disabled
  }

  try {
    // Read hook input from stdin
    const inputData = fs.readFileSync(0, 'utf-8');
    const hookInput: StopHookInput = JSON.parse(inputData);

    const sessionId = hookInput.session_id;
    const content = hookInput.message?.content || '';

    // Check if this is a chain compilation
    if (!isChainCompilation(content)) {
      process.exit(0); // Not a chain - exit silently
    }

    // Read settings
    const settings = readSettings();

    // Parse chain data
    const title = parseChainTitle(content);
    const metadata = parseChainMetadata(content);
    const steps = parseChainSteps(content);
    const executionMode = parseExecutionMode(content);

    // Build ChainCompiledEvent
    const event: ChainCompiledEvent = {
      type: 'chain:compiled',
      sessionId: brandedTypes.sessionId(sessionId),
      timestamp: brandedTypes.currentTimestamp(),
      user: settings.user,
      chainId: brandedTypes.chainId(`${sessionId}-${Date.now()}`),
      title: title,
      steps: steps.length > 0 ? steps : null,
      source: metadata.source as any || null,
      ref: metadata.ref || null,
      totalSteps: steps.length || null,
      executionMode: executionMode,
    };

    // POST event to backend
    const posted = await postEvent(settings.backendUrl, event);

    if (!posted) {
      console.error('[AFW] Failed to post ChainCompiledEvent to backend');
    } else {
      console.log(`[AFW] Chain compiled: "${title}" with ${steps.length} steps`);
    }

    // Always exit with code 0 (silent failure mode)
    process.exit(0);
  } catch (error) {
    // Silent failure - log error but exit cleanly
    console.error('Chain parse hook error:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(0);
  }
}

main();
