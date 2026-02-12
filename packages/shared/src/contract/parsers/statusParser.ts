/**
 * Status and Error Format Parsers
 * Implements parsers for Format 6.1-6.2
 * With Zod validation for enum/range constraints
 */

import type {
  ErrorAnnouncementParsed,
  ContextRoutingParsed,
} from '../types/statusFormats.js';
import type { WorkbenchId } from '../../workbenchTypes.js';
import { StatusPatterns } from '../patterns/statusPatterns.js';
import { CONTRACT_VERSION } from '../version.js';
import {
  ErrorAnnouncementSchema,
  ContextRoutingSchema,
  validateWithLogging,
} from '../validation/index.js';

/**
 * Parse error announcement
 * Format 6.1
 */
export function parseErrorAnnouncement(text: string): ErrorAnnouncementParsed | null {
  // 1. Detect
  if (!StatusPatterns.errorAnnouncement.heading.test(text)) {
    return null;
  }

  // 2. Extract
  const titleMatch = text.match(StatusPatterns.errorAnnouncement.heading);
  const stepMatch = text.match(StatusPatterns.errorAnnouncement.step);
  const messageMatch = text.match(StatusPatterns.errorAnnouncement.message);
  const contextMatch = text.match(StatusPatterns.errorAnnouncement.context);

  // Extract stack trace (text between "Stack trace:" and "**Recovery options:**")
  let stackTrace: string | null = null;
  const stackTraceIndex = text.indexOf('Stack trace:');
  const recoveryOptionsIndex = text.indexOf('**Recovery options:**');
  if (stackTraceIndex !== -1 && recoveryOptionsIndex !== -1) {
    const stackTraceText = text.slice(stackTraceIndex + 13, recoveryOptionsIndex).trim();
    stackTrace = stackTraceText || null;
  }

  // Extract recovery options
  const recoveryOptions = parseRecoveryOptions(text);

  // 3. Build
  const parsed: ErrorAnnouncementParsed = {
    title: titleMatch?.[1] || null,
    stepNumber: stepMatch ? parseInt(stepMatch[1] ?? '0', 10) : null,
    action: stepMatch?.[2] || null,
    message: messageMatch?.[1] || null,
    context: contextMatch?.[1] || null,
    stackTrace,
    recoveryOptions,
    raw: text,
    contractVersion: CONTRACT_VERSION,
  };

  // 4. Validate with Zod
  const validation = validateWithLogging('ErrorAnnouncement', ErrorAnnouncementSchema, parsed);
  if (!validation.success) {
    // Log validation errors but still return parsed object for graceful degradation
    console.warn('ErrorAnnouncement validation issues:', validation.error.issues);
  }

  return parsed;
}

function parseRecoveryOptions(text: string): string[] | null {
  const lines = text.split('\n');
  const options: string[] = [];

  let collectingOptions = false;
  for (const line of lines) {
    if (line.includes('**Recovery options:**')) {
      collectingOptions = true;
      continue;
    }
    if (collectingOptions && line.trim().startsWith('-')) {
      options.push(line.trim().slice(2));
    }
  }

  return options.length > 0 ? options : null;
}

/**
 * Parse context routing announcement
 * Format 6.2
 */
export function parseContextRouting(text: string): ContextRoutingParsed | null {
  // 1. Detect
  if (!StatusPatterns.contextRouting.heading.test(text)) {
    return null;
  }

  // 2. Extract
  const headingMatch = text.match(StatusPatterns.contextRouting.heading);
  const contextMatch = text.match(StatusPatterns.contextRouting.context);
  const confidenceMatch = text.match(StatusPatterns.contextRouting.confidence);
  const flowMatch = text.match(StatusPatterns.contextRouting.flow);
  const actionsMatch = text.match(StatusPatterns.contextRouting.actions);
  const disambiguatedMatch = text.match(StatusPatterns.contextRouting.disambiguated);

  // Parse actions list
  const actions = actionsMatch?.[1]
    ? actionsMatch[1].split(',').map(a => a.trim())
    : null;

  // Parse confidence as number
  const confidence = confidenceMatch?.[1]
    ? parseFloat(confidenceMatch[1])
    : null;

  // Parse disambiguated as boolean
  const disambiguated = disambiguatedMatch?.[1]
    ? disambiguatedMatch[1].toLowerCase() === 'true'
    : false;

  // 3. Build
  const parsed: ContextRoutingParsed = {
    request: headingMatch?.[1] || null,
    context: (contextMatch?.[1] as WorkbenchId) || null,
    confidence,
    flow: flowMatch?.[1] || null,
    actions,
    disambiguated,
    raw: text,
    contractVersion: CONTRACT_VERSION,
  };

  // 4. Validate with Zod
  const validation = validateWithLogging('ContextRouting', ContextRoutingSchema, parsed);
  if (!validation.success) {
    // Log validation errors but still return parsed object for graceful degradation
    console.warn('ContextRouting validation issues:', validation.error.issues);
  }

  return parsed;
}

