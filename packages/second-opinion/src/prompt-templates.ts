/**
 * Critique prompt templates per action type
 */

import type { ActionType } from './types.js';

// ============================================================================
// Review Action Template (Fully Detailed)
// ============================================================================

export function getReviewCritiquePrompt(originalInput: string, claudeOutput: string): string {
  return `You are a senior code reviewer providing an independent second opinion.

A previous reviewer analyzed the following code and produced findings.
Your job is to:
1. Identify any issues the previous reviewer MISSED
2. Note any findings you DISAGREE with (and why)
3. Highlight findings you STRONGLY AGREE with
4. Add any additional observations

## Code Under Review

${originalInput}

## Previous Review Findings

${claudeOutput}

## Your Independent Analysis

Respond in this format:

### Missed Issues
- [severity: HIGH/MEDIUM/LOW] description (file:line if applicable)

### Disagreements
- [finding: "original finding text"] Reason for disagreement

### Strong Agreements
- [finding: "original finding text"] Additional supporting evidence

### Additional Observations
- Any patterns, concerns, or suggestions not covered above

### Confidence Score
Rate your confidence in this second opinion: HIGH / MEDIUM / LOW
Explain briefly why.

Be thorough but concise. Focus on actionable feedback.`;
}

// ============================================================================
// Audit Action Template (Stub for Future)
// ============================================================================

export function getAuditCritiquePrompt(originalInput: string, claudeOutput: string): string {
  // TODO: Customize for security/architecture audit second opinions
  return getGenericCritiquePrompt('audit', originalInput, claudeOutput);
}

// ============================================================================
// Analyze Action Template (Stub for Future)
// ============================================================================

export function getAnalyzeCritiquePrompt(originalInput: string, claudeOutput: string): string {
  // TODO: Customize for quantitative analysis second opinions
  return getGenericCritiquePrompt('analyze', originalInput, claudeOutput);
}

// ============================================================================
// Plan Action Template (Stub for Future)
// ============================================================================

export function getPlanCritiquePrompt(originalInput: string, claudeOutput: string): string {
  // TODO: Customize for architectural planning second opinions
  return getGenericCritiquePrompt('plan', originalInput, claudeOutput);
}

// ============================================================================
// Code Action Template (Stub for Future)
// ============================================================================

export function getCodeCritiquePrompt(originalInput: string, claudeOutput: string): string {
  // TODO: Customize for implementation review second opinions
  return getGenericCritiquePrompt('code', originalInput, claudeOutput);
}

// ============================================================================
// Generic Fallback Template
// ============================================================================

function getGenericCritiquePrompt(
  actionType: string,
  originalInput: string,
  claudeOutput: string
): string {
  return `You are providing an independent second opinion on a ${actionType} action.

## Original Input

${originalInput}

## Previous Output

${claudeOutput}

## Your Analysis

Provide a critique of the previous output. Identify:
- Missed issues or concerns
- Points of disagreement
- Strong agreements
- Additional observations

### Confidence Score
Rate your confidence: HIGH / MEDIUM / LOW
Explain why.`;
}

// ============================================================================
// Router Function
// ============================================================================

/**
 * Get the appropriate critique prompt for an action type
 */
export function getCritiquePrompt(
  actionType: ActionType,
  originalInput: string,
  claudeOutput: string
): string {
  switch (actionType) {
    case 'review':
      return getReviewCritiquePrompt(originalInput, claudeOutput);
    case 'audit':
      return getAuditCritiquePrompt(originalInput, claudeOutput);
    case 'analyze':
      return getAnalyzeCritiquePrompt(originalInput, claudeOutput);
    case 'plan':
      return getPlanCritiquePrompt(originalInput, claudeOutput);
    case 'code':
      return getCodeCritiquePrompt(originalInput, claudeOutput);
    default:
      return getGenericCritiquePrompt(actionType, originalInput, claudeOutput);
  }
}
