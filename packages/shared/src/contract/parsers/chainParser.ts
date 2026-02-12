/**
 * Chain Format Parsers
 * Implements parsers for Format 1.1-1.4
 * With Zod validation for enum/range constraints
 */

import type {
  ChainCompilationParsed,
  ChainStepParsed,
  StepDescription,
  ChainExecutionStartParsed,
  ChainStatusUpdateParsed,
  ExecutionCompleteParsed,
  CompletedStepSummary,
} from '../types/chainFormats.js';
import { ChainPatterns } from '../patterns/chainPatterns.js';
import { CONTRACT_VERSION } from '../version.js';
import type { ModelString, StatusString } from '../../types.js';
import {
  ChainCompilationSchema,
  ChainExecutionStartSchema,
  ChainStatusUpdateSchema,
  ExecutionCompleteSchema,
  validateWithLogging,
} from '../validation/index.js';

/**
 * Parse a chain compilation table from orchestrator output
 * Format 1.1
 *
 * @param text - Raw markdown text containing chain compilation
 * @returns Parsed structure, or null if format not detected
 */
export function parseChainCompilation(text: string): ChainCompilationParsed | null {
  // 1. Quick detection (Level 1)
  if (!ChainPatterns.chainCompilation.heading.test(text)) {
    return null; // Not a chain compilation format
  }

  // 2. Extract fields (Level 2)
  const titleMatch = text.match(ChainPatterns.chainCompilation.heading);
  const requestMatch = text.match(ChainPatterns.chainCompilation.request);
  const sourceMatch = text.match(ChainPatterns.chainCompilation.source);
  const executionMatch = text.match(ChainPatterns.chainCompilation.execution);

  // Extract table rows
  const steps = parseChainTableRows(text);

  // Extract step descriptions
  const stepDescriptions = parseStepDescriptions(text);

  // 3. Build parsed object
  const parsed: ChainCompilationParsed = {
    title: titleMatch?.[1] || null,
    request: requestMatch?.[1] || null,
    source: sourceMatch?.[1] || null,
    steps,
    executionMode: executionMatch?.[1] || null,
    stepDescriptions,
    raw: text,
    contractVersion: CONTRACT_VERSION,
  };

  // 4. Validate with Zod
  const validation = validateWithLogging('ChainCompilation', ChainCompilationSchema, parsed);
  if (!validation.success) {
    console.warn('ChainCompilation validation issues:', validation.error.issues);
  }

  return parsed;
}

function parseChainTableRows(text: string): ChainStepParsed[] | null {
  const lines = text.split('\n');
  const rows: ChainStepParsed[] = [];

  for (const line of lines) {
    const match = line.match(ChainPatterns.chainCompilation.tableRow);
    if (match) {
      rows.push({
        stepNumber: parseInt(match[1] ?? '0', 10),
        action: match[2] ?? '',
        model: (match[3] ?? 'sonnet') as ModelString,
        keyInputs: match[4] ?? null,
        waitsFor: match[5] ?? null,
        status: (match[6] ?? 'pending') as StatusString,
      });
    }
  }

  return rows.length > 0 ? rows : null;
}

function parseStepDescriptions(text: string): StepDescription[] | null {
  const lines = text.split('\n');
  const descriptions: StepDescription[] = [];

  for (const line of lines) {
    const match = line.match(ChainPatterns.chainCompilation.stepDescription);
    if (match) {
      descriptions.push({
        stepNumber: parseInt(match[1] ?? '0', 10),
        action: match[2] ?? '',
        description: match[3] ?? '',
      });
    }
  }

  return descriptions.length > 0 ? descriptions : null;
}

/**
 * Parse chain execution start announcement
 * Format 1.2
 */
export function parseChainExecutionStart(text: string): ChainExecutionStartParsed | null {
  // 1. Detect
  if (!ChainPatterns.chainExecutionStart.heading.test(text)) {
    return null;
  }

  // 2. Extract
  const titleMatch = text.match(ChainPatterns.chainExecutionStart.heading);
  const spawningMatch = text.match(ChainPatterns.chainExecutionStart.spawning);

  // 3. Build
  const parsed: ChainExecutionStartParsed = {
    title: titleMatch?.[1] || null,
    stepNumber: spawningMatch ? parseInt(spawningMatch[1] ?? '0', 10) : null,
    action: spawningMatch?.[2] || null,
    model: (spawningMatch?.[3] as ModelString) || null,
    timestamp: null, // Optional: Currently not extracted from format
    raw: text,
    contractVersion: CONTRACT_VERSION,
  };

  // 4. Validate with Zod
  const validation = validateWithLogging('ChainExecutionStart', ChainExecutionStartSchema, parsed);
  if (!validation.success) {
    console.warn('ChainExecutionStart validation issues:', validation.error.issues);
  }

  return parsed;
}

/**
 * Parse chain status update
 * Format 1.3
 */
export function parseChainStatusUpdate(text: string): ChainStatusUpdateParsed | null {
  // 1. Detect
  if (!ChainPatterns.chainStatusUpdate.heading.test(text)) {
    return null;
  }

  // 2. Extract
  const titleMatch = text.match(ChainPatterns.chainStatusUpdate.heading);
  const changesMatch = text.match(ChainPatterns.chainStatusUpdate.changes);
  const steps = parseChainTableRows(text);

  // 3. Build
  const parsed: ChainStatusUpdateParsed = {
    title: titleMatch?.[1] || null,
    changes: changesMatch?.[1] || null,
    steps,
    raw: text,
    contractVersion: CONTRACT_VERSION,
  };

  // 4. Validate with Zod
  const validation = validateWithLogging('ChainStatusUpdate', ChainStatusUpdateSchema, parsed);
  if (!validation.success) {
    console.warn('ChainStatusUpdate validation issues:', validation.error.issues);
  }

  return parsed;
}

/**
 * Parse execution complete summary
 * Format 1.4
 */
export function parseExecutionComplete(text: string): ExecutionCompleteParsed | null {
  // 1. Detect
  if (!ChainPatterns.executionComplete.heading.test(text)) {
    return null;
  }

  // 2. Extract
  const titleMatch = text.match(ChainPatterns.executionComplete.heading);
  const logsMatch = text.match(ChainPatterns.executionComplete.logs);
  const learningsMatch = text.match(ChainPatterns.executionComplete.learnings);
  const steps = parseCompletedSteps(text);

  // 3. Build
  const parsed: ExecutionCompleteParsed = {
    title: titleMatch?.[1] || null,
    steps,
    logsPath: logsMatch?.[1] || null,
    learnings: learningsMatch?.[1] || null,
    totalSteps: null, // Optional: Currently not extracted from format
    completedSteps: null, // Optional: Currently not extracted from format
    failedSteps: null, // Optional: Currently not extracted from format
    raw: text,
    contractVersion: CONTRACT_VERSION,
  };

  // 4. Validate with Zod
  const validation = validateWithLogging('ExecutionComplete', ExecutionCompleteSchema, parsed);
  if (!validation.success) {
    console.warn('ExecutionComplete validation issues:', validation.error.issues);
  }

  return parsed;
}

function parseCompletedSteps(text: string): CompletedStepSummary[] | null {
  const lines = text.split('\n');
  const steps: CompletedStepSummary[] = [];

  for (const line of lines) {
    const match = line.match(ChainPatterns.executionComplete.tableRow);
    if (match) {
      steps.push({
        stepNumber: parseInt(match[1] ?? '0', 10),
        action: match[2] ?? '',
        status: (match[3] ?? 'pending') as StatusString,
        result: match[4] ?? null,
      });
    }
  }

  return steps.length > 0 ? steps : null;
}
