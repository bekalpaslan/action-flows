/**
 * Context Detection Algorithm for Inline Buttons
 * Classifies Claude response messages to determine which contextual buttons should render.
 *
 * Detection is based on regex patterns and keyword matching, evaluated in priority order.
 * The highest-confidence match is returned as the primary context, with all matched
 * indicators included for debugging and transparency.
 */

import type { ButtonContext } from '@afw/shared';

/**
 * Result of context detection for a message
 */
export interface ContextDetectionResult {
  /** The detected ButtonContext (highest confidence match) */
  context: ButtonContext;
  /** Confidence score from 0.0 to 1.0 */
  confidence: number;
  /** Which rules matched in this detection (for debugging) */
  matchedIndicators: string[];
}

/**
 * Internal interface for tracking detected contexts during analysis
 */
interface ContextMatch {
  context: ButtonContext;
  confidence: number;
  indicator: string;
}

/**
 * Regex patterns for context detection rules
 */
const PATTERNS = {
  // Rule 1: Code fence + file path
  codeBlockWithPath: /```[\w]*\n[\s\S]*?```|`[^`]+\.(ts|tsx|js|jsx|json|md|css|scss)`/,

  // Rule 2: Error keywords (case-insensitive)
  errorKeywords: /\b(error|failed|failure|exception|traceback|Error:|TypeError:|SyntaxError|ReferenceError|RuntimeError)\b/i,

  // Rule 3: File path + modification verbs
  filePathPattern: /`[^`]+\.(ts|tsx|js|jsx|json|md|css|scss|html|yaml|yml|toml|lock|xml|py|go|rs|java|rb)`|\b[a-zA-Z0-9/_-]+\.(ts|tsx|js|jsx|json|md|css|scss|html|yaml|yml|toml|lock|xml|py|go|rs|java|rb)\b/,
  modificationVerbs: /\b(created|modified|updated|deleted|removed|changed|edited|added|replaced|renamed)\b/i,

  // Rule 4: Question indicators
  questionMark: /\?/,
  shouldI: /should\s+i\b/i,
  doYouWant: /do\s+you\s+want\b/i,
  wouldYouLike: /would\s+you\s+like\b/i,

  // Rule 5: Analysis keywords
  analysisKeywords: /\b(analysis|summary|recommendation|overview|findings|report|assessment|evaluation|conclusion|insight)\b/i,
};

/**
 * Detects all matching contexts for a message, sorted by confidence (descending).
 * Internal helper function used by both detectContext() and detectAllContexts().
 *
 * @param messageContent - The Claude response message text to analyze
 * @returns Array of ContextMatch objects, sorted by confidence descending
 */
function analyzeAllMatches(messageContent: string): ContextMatch[] {
  const matches: ContextMatch[] = [];

  // Rule 1: Code fence + file path → 'code-change' (confidence 0.9)
  // Check for code blocks and code-like syntax
  if (PATTERNS.codeBlockWithPath.test(messageContent)) {
    matches.push({
      context: 'code-change',
      confidence: 0.9,
      indicator: 'code-fence-or-inline-code',
    });
  }

  // Rule 2: Error keywords → 'error-message' (confidence 0.85)
  if (PATTERNS.errorKeywords.test(messageContent)) {
    matches.push({
      context: 'error-message',
      confidence: 0.85,
      indicator: 'error-keywords',
    });
  }

  // Rule 3: File path + modification verbs → 'file-modification' (confidence 0.8)
  // Both file path AND modification verb must be present
  if (
    PATTERNS.filePathPattern.test(messageContent) &&
    PATTERNS.modificationVerbs.test(messageContent)
  ) {
    matches.push({
      context: 'file-modification',
      confidence: 0.8,
      indicator: 'file-path-and-modification-verbs',
    });
  }

  // Rule 4: Question indicators → 'question-prompt' (confidence 0.75)
  // Any of: ends with ?, contains "should I", "do you want", "would you like"
  const isQuestionMark = PATTERNS.questionMark.test(messageContent);
  const isShouldI = PATTERNS.shouldI.test(messageContent);
  const isDoYouWant = PATTERNS.doYouWant.test(messageContent);
  const isWouldYouLike = PATTERNS.wouldYouLike.test(messageContent);

  if (isQuestionMark || isShouldI || isDoYouWant || isWouldYouLike) {
    const indicators = [];
    if (isQuestionMark) indicators.push('question-mark');
    if (isShouldI) indicators.push('should-I-phrase');
    if (isDoYouWant) indicators.push('do-you-want-phrase');
    if (isWouldYouLike) indicators.push('would-you-like-phrase');

    matches.push({
      context: 'question-prompt',
      confidence: 0.75,
      indicator: indicators.join('|'),
    });
  }

  // Rule 5: Analysis keywords → 'analysis-report' (confidence 0.7)
  if (PATTERNS.analysisKeywords.test(messageContent)) {
    matches.push({
      context: 'analysis-report',
      confidence: 0.7,
      indicator: 'analysis-keywords',
    });
  }

  // Sort by confidence descending
  matches.sort((a, b) => b.confidence - a.confidence);
  return matches;
}

/**
 * Classifies a Claude response message to determine which contextual buttons
 * should be rendered. Returns the highest-confidence match.
 *
 * Detection rules (evaluated in priority order):
 * 1. Code fence + file path → 'code-change' (confidence 0.9)
 * 2. Error keywords (error, failed, exception, traceback) → 'error-message' (0.85)
 * 3. File path + modification verbs (created, modified, deleted) → 'file-modification' (0.8)
 * 4. Question indicators (?, "should I", "do you want") → 'question-prompt' (0.75)
 * 5. Analysis keywords (analysis, summary, recommendation) → 'analysis-report' (0.7)
 * 6. Fallback → 'general' (0.5)
 *
 * @param messageContent - The Claude response message text to classify
 * @returns ContextDetectionResult with the highest-confidence context
 */
export function detectContext(messageContent: string): ContextDetectionResult {
  if (!messageContent || messageContent.trim().length === 0) {
    return {
      context: 'general',
      confidence: 0.5,
      matchedIndicators: ['empty-content-fallback'],
    };
  }

  const matches = analyzeAllMatches(messageContent);

  // If we found any matches, return the highest-confidence one
  if (matches.length > 0) {
    const topMatch = matches[0];
    return {
      context: topMatch.context,
      confidence: topMatch.confidence,
      matchedIndicators: [topMatch.indicator],
    };
  }

  // Fallback: no matches found
  return {
    context: 'general',
    confidence: 0.5,
    matchedIndicators: ['no-rules-matched-fallback'],
  };
}

/**
 * Detects all applicable contexts for a message (may match multiple).
 * Returns sorted by confidence descending. Useful for scenarios where
 * multiple button sets might be relevant for the same message.
 *
 * @param messageContent - The Claude response message text to analyze
 * @returns Array of ContextDetectionResult objects, sorted by confidence descending
 */
export function detectAllContexts(messageContent: string): ContextDetectionResult[] {
  if (!messageContent || messageContent.trim().length === 0) {
    return [
      {
        context: 'general',
        confidence: 0.5,
        matchedIndicators: ['empty-content-fallback'],
      },
    ];
  }

  const matches = analyzeAllMatches(messageContent);

  // If we found any matches, convert them to results
  if (matches.length > 0) {
    return matches.map((match) => ({
      context: match.context,
      confidence: match.confidence,
      matchedIndicators: [match.indicator],
    }));
  }

  // Fallback: no matches found
  return [
    {
      context: 'general',
      confidence: 0.5,
      matchedIndicators: ['no-rules-matched-fallback'],
    },
  ];
}
