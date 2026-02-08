/**
 * Status and Error Format Parsers
 * Implements parsers for Format 6.1-6.2
 */

import type {
  ErrorAnnouncementParsed,
  DepartmentRoutingParsed,
} from '../types/statusFormats.js';
import { StatusPatterns } from '../patterns/statusPatterns.js';
import { CONTRACT_VERSION } from '../version.js';

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
    stepNumber: stepMatch ? parseInt(stepMatch[1], 10) : null,
    action: stepMatch?.[2] || null,
    message: messageMatch?.[1] || null,
    context: contextMatch?.[1] || null,
    stackTrace,
    recoveryOptions,
    raw: text,
    contractVersion: CONTRACT_VERSION,
  };

  // 4. Validate
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
 * Parse department routing announcement
 * Format 6.2
 */
export function parseDepartmentRouting(text: string): DepartmentRoutingParsed | null {
  // 1. Detect
  if (!StatusPatterns.departmentRouting.heading.test(text)) {
    return null;
  }

  // 2. Extract
  const headingMatch = text.match(StatusPatterns.departmentRouting.heading);
  const departmentMatch = text.match(StatusPatterns.departmentRouting.department);
  const flowMatch = text.match(StatusPatterns.departmentRouting.flow);
  const actionsMatch = text.match(StatusPatterns.departmentRouting.actions);

  // Parse actions list
  const actions = actionsMatch?.[1]
    ? actionsMatch[1].split(',').map(a => a.trim())
    : null;

  // Extract explanation (text after actions line)
  let explanation: string | null = null;
  const actionsIndex = actionsMatch ? text.indexOf(actionsMatch[0]) : -1;
  if (actionsIndex !== -1) {
    const explanationText = text.slice(actionsIndex + actionsMatch![0].length).trim();
    explanation = explanationText || null;
  }

  // 3. Build
  const parsed: DepartmentRoutingParsed = {
    request: headingMatch?.[1] || null,
    department: (departmentMatch?.[1] as 'Framework' | 'Engineering' | 'QA' | 'Human') || null,
    flow: flowMatch?.[1] || null,
    actions,
    explanation,
    raw: text,
    contractVersion: CONTRACT_VERSION,
  };

  // 4. Validate
  return parsed;
}
