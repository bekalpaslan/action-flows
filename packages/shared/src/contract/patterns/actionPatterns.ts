/**
 * Regex patterns for detecting action output formats
 * Used by harmony detection and message routing
 */

/**
 * Format 5.1: Review Report Structure
 */
export const ReviewReportPatterns = {
  heading: /^# Review Report: (.+)$/m,
  verdict: /^## Verdict: (APPROVED|NEEDS_CHANGES)$/m,
  score: /^## Score: (\d+)%$/m,
  summaryHeading: /^## Summary$/m,
  summary: /^(.+)$/m,
  findingsHeading: /^## Findings$/m,
  findingsTableHeader: /^\| # \| File \| Line \| Severity \| Description \| Suggestion \|$/m,
  findingRow: /^\| (\d+) \| (.+) \| (\d+) \| (critical|high|medium|low) \| (.+) \| (.+) \|$/m,
  fixesHeading: /^## Fixes Applied$/m,
  fixTableHeader: /^\| File \| Fix \|$/m,
  fixRow: /^\| (.+) \| (.+) \|$/m,
  flagsHeading: /^## Flags for Human$/m,
  flagTableHeader: /^\| Issue \| Why Human Needed \|$/m,
  flagRow: /^\| (.+) \| (.+) \|$/m,
} as const;

/**
 * Format 5.2: Analysis Report Structure
 */
export const AnalysisReportPatterns = {
  heading: /^# (.+)$/m,
  aspect: /^\*\*Aspect:\*\* (coverage|dependencies|structure|drift|inventory|impact)$/m,
  scope: /^\*\*Scope:\*\* (.+)$/m,
  date: /^\*\*Date:\*\* (\d{4}-\d{2}-\d{2})$/m,
  agent: /^\*\*Agent:\*\* analyze$/m,
  sectionHeading: /^## (\d+)\. (.+)$/m,
  recommendationsHeading: /^## Recommendations$/m,
  recommendation: /^- (.+)$/m,
} as const;

/**
 * Format 5.3: Brainstorm Session Transcript
 */
export const BrainstormTranscriptPatterns = {
  heading: /^# Brainstorming Session: (.+)$/m,
  ideaHeading: /^## Idea$/m,
  idea: /^(.+)$/m,
  classificationHeading: /^## Classification$/m,
  classification: /^(Technical|Functional|Framework)$/m,
  initialContextHeading: /^## Initial Context$/m,
  initialContext: /^(.+)$/m,
  transcriptHeading: /^## Session Transcript$/m,
  questionHeading: /^### Question (\d+): (.+)$/m,
  humanResponse: /^\*\*Human Response:\*\* (.+)$/m,
  keyInsightsHeading: /^## Key Insights$/m,
  insight: /^- (.+)$/m,
  potentialIssuesHeading: /^## Potential Issues & Risks$/m,
  issue: /^- (.+)$/m,
  nextStepsHeading: /^## Suggested Next Steps$/m,
  nextStep: /^(\d+)\. (.+)$/m,
  openQuestionsHeading: /^## Open Questions$/m,
  openQuestion: /^- (.+)$/m,
  metadataHeading: /^## Session Metadata$/m,
  duration: /^- \*\*Duration:\*\* (.+)$/m,
  depth: /^- \*\*Depth:\*\* (.+)$/m,
  consensus: /^- \*\*Consensus:\*\* (.+)$/m,
} as const;

export const ActionPatterns = {
  reviewReport: ReviewReportPatterns,
  analysisReport: AnalysisReportPatterns,
  brainstormTranscript: BrainstormTranscriptPatterns,
} as const;
