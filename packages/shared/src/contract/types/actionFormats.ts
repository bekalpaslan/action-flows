/**
 * Format 5.x: Action Output Types
 * TypeScript interfaces for specialized action output formats
 */

/**
 * Format 5.1: Review Report Structure
 * When produced: After review/ action completes
 */
export interface ReviewReportParsed {
  /** Review scope */
  scope: string | null;

  /** Verdict (APPROVED | NEEDS_CHANGES) */
  verdict: 'APPROVED' | 'NEEDS_CHANGES' | null;

  /** Score (0-100) */
  score: number | null;

  /** 2-3 sentence overview */
  summary: string | null;

  /** List of findings */
  findings: ReviewFinding[] | null;

  /** Fixes applied (if review-and-fix mode) */
  fixesApplied: ReviewFix[] | null;

  /** Issues flagged for human review */
  flagsForHuman: ReviewFlag[] | null;

  /** Raw text */
  raw: string;

  /** Contract version */
  contractVersion: string;
}

export interface ReviewFinding {
  number: number;
  file: string;
  line: number | null;
  severity: 'critical' | 'high' | 'medium' | 'low' | null;
  description: string;
  suggestion: string;
}

export interface ReviewFix {
  file: string;
  fix: string;
}

export interface ReviewFlag {
  issue: string;
  reason: string;
}

/**
 * Format 5.2: Analysis Report Structure
 * When produced: After analyze/ action completes
 */
export interface AnalysisReportParsed {
  /** Report title */
  title: string | null;

  /** Analysis aspect (coverage | dependencies | structure | drift | inventory | impact) */
  aspect: string | null;

  /** Scope description */
  scope: string | null;

  /** Report date (YYYY-MM-DD) */
  date: string | null;

  /** Numbered sections */
  sections: AnalysisSection[] | null;

  /** Actionable recommendations */
  recommendations: string[] | null;

  /** Raw text */
  raw: string;

  /** Contract version */
  contractVersion: string;
}

export interface AnalysisSection {
  number: number;
  title: string;
  content: string; // Raw markdown content
}

/**
 * Format 5.3: Brainstorm Session Transcript
 * When produced: After brainstorm/ action completes
 */
export interface BrainstormTranscriptParsed {
  /** Idea being brainstormed */
  idea: string | null;

  /** Classification (Technical | Functional | Framework) */
  classification: 'Technical' | 'Functional' | 'Framework' | null;

  /** Initial context summary */
  initialContext: string | null;

  /** Questions and responses */
  questions: BrainstormQuestion[] | null;

  /** Key insights */
  keyInsights: string[] | null;

  /** Potential issues */
  potentialIssues: string[] | null;

  /** Suggested next steps */
  suggestedNextSteps: string[] | null;

  /** Open questions */
  openQuestions: string[] | null;

  /** Session duration */
  duration: string | null;

  /** Depth (High-level | Deep exploration) */
  depth: string | null;

  /** Consensus summary */
  consensus: string | null;

  /** Raw text */
  raw: string;

  /** Contract version */
  contractVersion: string;
}

export interface BrainstormQuestion {
  number: number;
  question: string;
  response: string;
}
