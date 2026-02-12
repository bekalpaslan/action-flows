/**
 * Registry Format Parsers
 * Implements parsers for Format 4.1-4.3
 * With Zod validation for enum/range constraints
 */

import type {
  RegistryUpdateParsed,
  IndexEntryParsed,
  LearningEntryParsed,
} from '../types/registryFormats.js';
import { RegistryPatterns } from '../patterns/registryPatterns.js';
import { CONTRACT_VERSION } from '../version.js';
import {
  RegistryUpdateSchema,
  IndexEntrySchema,
  LearningEntrySchema,
  validateWithLogging,
} from '../validation/index.js';

/**
 * Parse registry update
 * Format 4.1
 */
export function parseRegistryUpdate(text: string): RegistryUpdateParsed | null {
  // 1. Detect
  if (!RegistryPatterns.registryUpdate.heading.test(text)) {
    return null;
  }

  // 2. Extract
  const titleMatch = text.match(RegistryPatterns.registryUpdate.heading);
  const fileMatch = text.match(RegistryPatterns.registryUpdate.file);
  const lineMatch = text.match(RegistryPatterns.registryUpdate.line);

  // 3. Build
  const parsed: RegistryUpdateParsed = {
    title: titleMatch?.[1] || null,
    file: fileMatch?.[1] || null,
    action: (lineMatch?.[1] as 'added' | 'removed' | 'updated') || null,
    line: lineMatch?.[2] || null,
    raw: text,
    contractVersion: CONTRACT_VERSION,
  };

  // 4. Validate with Zod
  const validation = validateWithLogging('RegistryUpdate', RegistryUpdateSchema, parsed);
  if (!validation.success) {
    console.warn('RegistryUpdate validation issues:', validation.error.issues);
  }

  return parsed;
}

/**
 * Parse INDEX.md entry
 * Format 4.2
 */
export function parseIndexEntry(text: string): IndexEntryParsed | null {
  // 1. Detect
  const match = text.match(RegistryPatterns.indexEntry.tableRow);
  if (!match) {
    return null;
  }

  // 2. Extract
  const date = match[1];
  const description = match[2];
  const pattern = match[3];
  const status = match[4];
  const metrics = match[5];
  const commitHash = match[6];

  // 3. Build
  const parsed: IndexEntryParsed = {
    date: date ?? '',
    description: description ?? '',
    pattern: pattern ?? '',
    outcome: `${status ?? ''} — ${metrics ?? ''} (${commitHash ?? ''})`,
    success: status === 'Success',
    metrics: metrics ?? null,
    commitHash: commitHash ?? null,
    raw: text,
    contractVersion: CONTRACT_VERSION,
  };

  // 4. Validate with Zod
  const validation = validateWithLogging('IndexEntry', IndexEntrySchema, parsed);
  if (!validation.success) {
    console.warn('IndexEntry validation issues:', validation.error.issues);
  }

  return parsed;
}

/**
 * Parse LEARNINGS.md entry
 * Format 4.3
 */
export function parseLearningEntry(text: string): LearningEntryParsed | null {
  // 1. Detect
  if (!RegistryPatterns.learningEntry.actionTypeHeading.test(text)) {
    return null;
  }

  // 2. Extract
  const actionTypeMatch = text.match(RegistryPatterns.learningEntry.actionTypeHeading);
  const issueTitleMatch = text.match(RegistryPatterns.learningEntry.issueTitleHeading);
  const contextMatch = text.match(RegistryPatterns.learningEntry.context);
  const problemMatch = text.match(RegistryPatterns.learningEntry.problem);
  const rootCauseMatch = text.match(RegistryPatterns.learningEntry.rootCause);
  const solutionMatch = text.match(RegistryPatterns.learningEntry.solution);
  const dateMatch = text.match(RegistryPatterns.learningEntry.date);
  const sourceMatch = text.match(RegistryPatterns.learningEntry.source);

  // 3. Build
  const parsed: LearningEntryParsed = {
    actionType: actionTypeMatch?.[1] || null,
    issueTitle: issueTitleMatch?.[1] || null,
    context: contextMatch?.[1] || null,
    problem: problemMatch?.[1] || null,
    rootCause: rootCauseMatch?.[1] || null,
    solution: solutionMatch?.[1] || null,
    date: dateMatch?.[1] || null,
    source: sourceMatch ? `${sourceMatch[1]} in ${sourceMatch[2]}` : null,
    raw: text,
    contractVersion: CONTRACT_VERSION,
  };

  // 4. Validate with Zod
  const validation = validateWithLogging('LearningEntry', LearningEntrySchema, parsed);
  if (!validation.success) {
    console.warn('LearningEntry validation issues:', validation.error.issues);
  }

  return parsed;
}
