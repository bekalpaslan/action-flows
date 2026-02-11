/**
 * Human Interaction Format Parsers
 * Implements parsers for Format 3.1-3.3
 * With Zod validation for enum/range constraints
 */

import type {
  HumanGateParsed,
  LearningSurfaceParsed,
  SessionStartProtocolParsed,
} from '../types/humanFormats.js';
import { HumanPatterns } from '../patterns/humanPatterns.js';
import { CONTRACT_VERSION } from '../version.js';
import type { ModelString } from '../../types.js';
import {
  HumanGateSchema,
  LearningSurfaceSchema,
  SessionStartProtocolSchema,
  validateWithLogging,
} from '../validation/index.js';

/**
 * Parse human gate presentation
 * Format 3.1
 */
export function parseHumanGate(text: string): HumanGateParsed | null {
  // 1. Detect
  const headingMatch = text.match(HumanPatterns.humanGate.heading);
  if (!headingMatch) {
    return null;
  }

  // 2. Extract
  const stepNumber = parseInt(headingMatch[1], 10);

  // Extract content between heading and prompt
  const headingIndex = text.indexOf(headingMatch[0]);
  const lines = text.slice(headingIndex + headingMatch[0].length).split('\n');

  let content = '';
  let prompt: string | null = null;

  for (const line of lines) {
    if (line.trim().endsWith('?')) {
      prompt = line.trim();
      break;
    }
    if (line.trim()) {
      content += line.trim() + '\n';
    }
  }

  // 3. Build
  const parsed: HumanGateParsed = {
    stepNumber,
    content: content.trim() || null,
    prompt,
    raw: text,
    contractVersion: CONTRACT_VERSION,
  };

  // 4. Validate with Zod
  const validation = validateWithLogging('HumanGate', HumanGateSchema, parsed);
  if (!validation.success) {
    console.warn('HumanGate validation issues:', validation.error.issues);
  }

  return parsed;
}

/**
 * Parse learning surface presentation
 * Format 3.2
 */
export function parseLearningSurface(text: string): LearningSurfaceParsed | null {
  // 1. Detect
  if (!HumanPatterns.learningSurface.heading.test(text)) {
    return null;
  }

  // 2. Extract
  const fromMatch = text.match(HumanPatterns.learningSurface.from);
  const issueMatch = text.match(HumanPatterns.learningSurface.issue);
  const rootCauseMatch = text.match(HumanPatterns.learningSurface.rootCause);
  const suggestedFixMatch = text.match(HumanPatterns.learningSurface.suggestedFix);

  // 3. Build
  const parsed: LearningSurfaceParsed = {
    fromAction: fromMatch?.[1] || null,
    fromModel: (fromMatch?.[2] as ModelString) || null,
    issue: issueMatch?.[1] || null,
    rootCause: rootCauseMatch?.[1] || null,
    suggestedFix: suggestedFixMatch?.[1] || null,
    raw: text,
    contractVersion: CONTRACT_VERSION,
  };

  // 4. Validate with Zod
  const validation = validateWithLogging('LearningSurface', LearningSurfaceSchema, parsed);
  if (!validation.success) {
    console.warn('LearningSurface validation issues:', validation.error.issues);
  }

  return parsed;
}

/**
 * Parse session-start protocol acknowledgment
 * Format 3.3
 */
export function parseSessionStartProtocol(text: string): SessionStartProtocolParsed | null {
  // 1. Detect
  if (!HumanPatterns.sessionStartProtocol.heading.test(text)) {
    return null;
  }

  // 2. Extract
  const projectMatch = text.match(HumanPatterns.sessionStartProtocol.project);
  const flowsMatch = text.match(HumanPatterns.sessionStartProtocol.flows);
  const actionsMatch = text.match(HumanPatterns.sessionStartProtocol.actions);
  const pastExecutionsMatch = text.match(HumanPatterns.sessionStartProtocol.pastExecutions);

  // 3. Build
  const parsed: SessionStartProtocolParsed = {
    projectName: projectMatch?.[1] || null,
    flowCount: flowsMatch ? parseInt(flowsMatch[1], 10) : null,
    actionCount: actionsMatch ? parseInt(actionsMatch[1], 10) : null,
    pastExecutionCount: pastExecutionsMatch ? parseInt(pastExecutionsMatch[1], 10) : null,
    raw: text,
    contractVersion: CONTRACT_VERSION,
  };

  // 4. Validate with Zod
  const validation = validateWithLogging('SessionStartProtocol', SessionStartProtocolSchema, parsed);
  if (!validation.success) {
    console.warn('SessionStartProtocol validation issues:', validation.error.issues);
  }

  return parsed;
}
