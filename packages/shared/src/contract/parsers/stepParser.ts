/**
 * Step Format Parsers
 * Implements parsers for Format 2.1-2.3
 * With Zod validation for enum/range constraints
 */

import type {
  StepCompletionParsed,
  DualOutputParsed,
  SecondOpinionSkipParsed,
} from '../types/stepFormats.js';
import type { ModelString } from '../../types.js';
import { StepPatterns } from '../patterns/stepPatterns.js';
import { CONTRACT_VERSION } from '../version.js';
import {
  StepCompletionSchema,
  DualOutputSchema,
  SecondOpinionSkipSchema,
  validateWithLogging,
} from '../validation/index.js';

/**
 * Parse step completion announcement
 * Format 2.1
 */
export function parseStepCompletion(text: string): StepCompletionParsed | null {
  // 1. Detect
  const match = text.match(StepPatterns.stepCompletion.prefix);
  if (!match) {
    return null;
  }

  // 2. Extract
  const stepNumber = parseInt(match[1] ?? '0', 10);
  const action = match[2] ?? '';
  const result = match[3] ?? '';
  const nextStepRaw = match[4] ?? '';
  const nextStep = nextStepRaw === 'Done' ? 'Done' : parseInt(nextStepRaw, 10);

  // 3. Build
  const parsed: StepCompletionParsed = {
    stepNumber,
    action: action ?? null,
    result: result ?? null,
    nextStep,
    raw: text,
    contractVersion: CONTRACT_VERSION,
  };

  // 4. Validate with Zod
  const validation = validateWithLogging('StepCompletion', StepCompletionSchema, parsed);
  if (!validation.success) {
    console.warn('StepCompletion validation issues:', validation.error.issues);
  }

  return parsed;
}

/**
 * Parse dual output (action + second opinion)
 * Format 2.2
 */
export function parseDualOutput(text: string): DualOutputParsed | null {
  // 1. Detect
  if (!StepPatterns.dualOutput.heading.test(text)) {
    return null;
  }

  // 2. Extract
  const stepCompleteMatch = text.match(StepPatterns.dualOutput.stepComplete);
  const secondOpinionCompleteMatch = text.match(StepPatterns.dualOutput.secondOpinionComplete);
  const headingMatch = text.match(StepPatterns.dualOutput.heading);
  const originalLabelMatch = text.match(StepPatterns.dualOutput.originalLabel);
  const secondOpinionLabelMatch = text.match(StepPatterns.dualOutput.secondOpinionLabel);
  const missedIssuesMatch = text.match(StepPatterns.dualOutput.missedIssues);
  const disagreementsMatch = text.match(StepPatterns.dualOutput.disagreements);
  const notableMatch = text.match(StepPatterns.dualOutput.notable);
  const originalReportMatch = text.match(StepPatterns.dualOutput.originalReport);
  const critiqueReportMatch = text.match(StepPatterns.dualOutput.critiqueReport);
  const continuingMatch = text.match(StepPatterns.dualOutput.continuing);

  // Extract original result (text between original label and second opinion label)
  let originalResult: string | null = null;
  if (originalLabelMatch && secondOpinionLabelMatch) {
    const originalLabelIndex = text.indexOf(originalLabelMatch[0]);
    const secondOpinionLabelIndex = text.indexOf(secondOpinionLabelMatch[0]);
    if (originalLabelIndex !== -1 && secondOpinionLabelIndex !== -1) {
      const contentBetween = text.slice(
        originalLabelIndex + originalLabelMatch[0].length,
        secondOpinionLabelIndex
      ).trim();
      originalResult = contentBetween || null;
    }
  }

  // Extract second opinion summary (text between second opinion label and "- Missed issues:")
  let secondOpinionSummary: string | null = null;
  if (secondOpinionLabelMatch && missedIssuesMatch) {
    const secondOpinionLabelIndex = text.indexOf(secondOpinionLabelMatch[0]);
    const missedIssuesIndex = text.indexOf(missedIssuesMatch[0]);
    if (secondOpinionLabelIndex !== -1 && missedIssuesIndex !== -1) {
      const contentBetween = text.slice(
        secondOpinionLabelIndex + secondOpinionLabelMatch[0].length,
        missedIssuesIndex
      ).trim();
      secondOpinionSummary = contentBetween || null;
    }
  }

  // 3. Build
  const parsed: DualOutputParsed = {
    stepNumber: stepCompleteMatch ? parseInt(stepCompleteMatch[1] ?? '0', 10) : null,
    action: headingMatch?.[1] || null,
    originalResult,
    secondOpinionModel: (secondOpinionLabelMatch?.[1] || null) as ModelString | null,
    secondOpinionSummary,
    missedIssues: missedIssuesMatch ? parseInt(missedIssuesMatch[1] ?? '0', 10) : null,
    disagreements: disagreementsMatch ? parseInt(disagreementsMatch[1] ?? '0', 10) : null,
    notable: notableMatch?.[1] || null,
    originalLogPath: originalReportMatch?.[1] || null,
    critiqueLogPath: critiqueReportMatch?.[1] || null,
    nextStep: continuingMatch ? parseInt(continuingMatch[1] ?? '0', 10) : null,
    raw: text,
    contractVersion: CONTRACT_VERSION,
  };

  // 4. Validate with Zod
  const validation = validateWithLogging('DualOutput', DualOutputSchema, parsed);
  if (!validation.success) {
    console.warn('DualOutput validation issues:', validation.error.issues);
  }

  return parsed;
}

/**
 * Parse second opinion skip
 * Format 2.3
 */
export function parseSecondOpinionSkip(text: string): SecondOpinionSkipParsed | null {
  // 1. Detect
  const skippedMatch = text.match(StepPatterns.secondOpinionSkip.skipped);
  if (!skippedMatch) {
    return null;
  }

  // 2. Extract
  const stepCompleteMatch = text.match(StepPatterns.secondOpinionSkip.stepComplete);
  const continuingMatch = text.match(StepPatterns.secondOpinionSkip.continuing);

  // 3. Build
  const parsed: SecondOpinionSkipParsed = {
    stepNumber: stepCompleteMatch ? parseInt(stepCompleteMatch[1] ?? '0', 10) : null,
    action: stepCompleteMatch?.[2] || null,
    result: stepCompleteMatch?.[3] ?? null,
    secondOpinionStep: parseInt(skippedMatch[1] ?? '0', 10),
    skipReason: skippedMatch[2] ?? '',
    nextStep: continuingMatch ? parseInt(continuingMatch[1] ?? '0', 10) : null,
    raw: text,
    contractVersion: CONTRACT_VERSION,
  };

  // 4. Validate with Zod
  const validation = validateWithLogging('SecondOpinionSkip', SecondOpinionSkipSchema, parsed);
  if (!validation.success) {
    console.warn('SecondOpinionSkip validation issues:', validation.error.issues);
  }

  return parsed;
}
