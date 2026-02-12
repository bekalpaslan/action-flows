/**
 * Action Output Format Parsers
 * Implements parsers for Format 5.1-5.3
 * With Zod validation for enum/range constraints
 */

import type {
  ReviewReportParsed,
  ReviewFinding,
  ReviewFix,
  ReviewFlag,
  AnalysisReportParsed,
  AnalysisSection,
  BrainstormTranscriptParsed,
  BrainstormQuestion,
} from '../types/actionFormats.js';
import { ActionPatterns } from '../patterns/actionPatterns.js';
import { CONTRACT_VERSION } from '../version.js';
import {
  ReviewReportSchema,
  AnalysisReportSchema,
  BrainstormTranscriptSchema,
  validateWithLogging,
} from '../validation/index.js';

/**
 * Parse review report
 * Format 5.1
 */
export function parseReviewReport(text: string): ReviewReportParsed | null {
  // 1. Detect
  if (!ActionPatterns.reviewReport.heading.test(text)) {
    return null;
  }

  // 2. Extract
  const headingMatch = text.match(ActionPatterns.reviewReport.heading);
  const verdictMatch = text.match(ActionPatterns.reviewReport.verdict);
  const scoreMatch = text.match(ActionPatterns.reviewReport.score);

  // Extract summary (text between "## Summary" and "## Findings")
  let summary: string | null = null;
  const summaryHeadingIndex = text.indexOf('## Summary');
  const findingsHeadingIndex = text.indexOf('## Findings');
  if (summaryHeadingIndex !== -1 && findingsHeadingIndex !== -1) {
    const summaryText = text.slice(summaryHeadingIndex + 10, findingsHeadingIndex).trim();
    summary = summaryText || null;
  }

  // Extract findings
  const findings = parseReviewFindings(text);

  // Extract fixes
  const fixes = parseReviewFixes(text);

  // Extract flags
  const flags = parseReviewFlags(text);

  // 3. Build
  const parsed: ReviewReportParsed = {
    scope: headingMatch?.[1] || null,
    verdict: (verdictMatch?.[1] as 'APPROVED' | 'NEEDS_CHANGES') || null,
    score: scoreMatch ? parseInt(scoreMatch[1] ?? '0', 10) : null,
    summary,
    findings,
    fixesApplied: fixes,
    flagsForHuman: flags,
    raw: text,
    contractVersion: CONTRACT_VERSION,
  };

  // 4. Validate with Zod
  const validation = validateWithLogging('ReviewReport', ReviewReportSchema, parsed);
  if (!validation.success) {
    // Log validation errors but still return parsed object for graceful degradation
    console.warn('ReviewReport validation issues:', validation.error.issues);
  }

  return parsed;
}

function parseReviewFindings(text: string): ReviewFinding[] | null {
  const lines = text.split('\n');
  const findings: ReviewFinding[] = [];

  for (const line of lines) {
    const match = line.match(ActionPatterns.reviewReport.findingRow);
    if (match) {
      findings.push({
        number: parseInt(match[1] ?? '0', 10),
        file: match[2] ?? '',
        line: match[3] ? parseInt(match[3], 10) : null,
        severity: (match[4] ?? 'medium') as 'critical' | 'high' | 'medium' | 'low',
        description: match[5] ?? '',
        suggestion: match[6] ?? '',
      });
    }
  }

  return findings.length > 0 ? findings : null;
}

function parseReviewFixes(text: string): ReviewFix[] | null {
  const lines = text.split('\n');
  const fixes: ReviewFix[] = [];

  for (const line of lines) {
    const match = line.match(ActionPatterns.reviewReport.fixRow);
    if (match) {
      fixes.push({
        file: match[1] ?? '',
        fix: match[2] ?? '',
      });
    }
  }

  return fixes.length > 0 ? fixes : null;
}

function parseReviewFlags(text: string): ReviewFlag[] | null {
  const lines = text.split('\n');
  const flags: ReviewFlag[] = [];

  for (const line of lines) {
    const match = line.match(ActionPatterns.reviewReport.flagRow);
    if (match) {
      flags.push({
        issue: match[1] ?? '',
        reason: match[2] ?? '',
      });
    }
  }

  return flags.length > 0 ? flags : null;
}

/**
 * Parse analysis report
 * Format 5.2
 */
export function parseAnalysisReport(text: string): AnalysisReportParsed | null {
  // 1. Detect
  if (!ActionPatterns.analysisReport.aspect.test(text)) {
    return null;
  }

  // 2. Extract
  const headingMatch = text.match(ActionPatterns.analysisReport.heading);
  const aspectMatch = text.match(ActionPatterns.analysisReport.aspect);
  const scopeMatch = text.match(ActionPatterns.analysisReport.scope);
  const dateMatch = text.match(ActionPatterns.analysisReport.date);
  const agentMatch = text.match(ActionPatterns.analysisReport.agent);

  // Extract sections
  const sections = parseAnalysisSections(text);

  // Extract recommendations
  const recommendations = parseRecommendations(text);

  // 3. Build
  const parsed: AnalysisReportParsed = {
    title: headingMatch?.[1] || null,
    aspect: aspectMatch?.[1] || null,
    scope: scopeMatch?.[1] || null,
    date: dateMatch?.[1] || null,
    agent: agentMatch?.[1] ? `${agentMatch[1]}/` : null,
    sections,
    recommendations,
    raw: text,
    contractVersion: CONTRACT_VERSION,
  };

  // 4. Validate with Zod
  const validation = validateWithLogging('AnalysisReport', AnalysisReportSchema, parsed);
  if (!validation.success) {
    // Log validation errors but still return parsed object for graceful degradation
    console.warn('AnalysisReport validation issues:', validation.error.issues);
  }

  return parsed;
}

function parseAnalysisSections(text: string): AnalysisSection[] | null {
  const lines = text.split('\n');
  const sections: AnalysisSection[] = [];

  let currentSection: AnalysisSection | null = null;

  for (const line of lines) {
    const match = line.match(ActionPatterns.analysisReport.sectionHeading);
    if (match) {
      // Save previous section
      if (currentSection) {
        sections.push(currentSection);
      }
      // Start new section
      currentSection = {
        number: parseInt(match[1] ?? '0', 10),
        title: match[2] ?? '',
        content: '',
      };
    } else if (currentSection && line.trim() && !line.startsWith('## Recommendations')) {
      currentSection.content += line + '\n';
    }
  }

  // Save last section
  if (currentSection) {
    sections.push(currentSection);
  }

  return sections.length > 0 ? sections : null;
}

function parseRecommendations(text: string): string[] | null {
  const recommendationsIndex = text.indexOf('## Recommendations');
  if (recommendationsIndex === -1) {
    return null;
  }

  const lines = text.slice(recommendationsIndex).split('\n');
  const recommendations: string[] = [];

  for (const line of lines) {
    const match = line.match(ActionPatterns.analysisReport.recommendation);
    if (match) {
      recommendations.push(match[1] ?? '');
    }
  }

  return recommendations.length > 0 ? recommendations : null;
}

/**
 * Parse brainstorm session transcript
 * Format 5.3
 */
export function parseBrainstormTranscript(text: string): BrainstormTranscriptParsed | null {
  // 1. Detect
  if (!ActionPatterns.brainstormTranscript.heading.test(text)) {
    return null;
  }

  // 2. Extract
  const headingMatch = text.match(ActionPatterns.brainstormTranscript.heading);
  const classificationMatch = text.match(ActionPatterns.brainstormTranscript.classification);
  const dateMatch = text.match(ActionPatterns.brainstormTranscript.date);
  const durationMatch = text.match(ActionPatterns.brainstormTranscript.duration);
  const depthMatch = text.match(ActionPatterns.brainstormTranscript.depth);
  const consensusMatch = text.match(ActionPatterns.brainstormTranscript.consensus);

  // Extract sections
  const initialContext = extractSectionContent(text, '## Initial Context', '## Session Transcript');
  const questions = parseBrainstormQuestions(text);
  const keyInsights = extractBulletList(text, '## Key Insights', '## Potential Issues');
  const potentialIssues = extractBulletList(text, '## Potential Issues & Risks', '## Suggested Next Steps');
  const suggestedNextSteps = extractNumberedList(text, '## Suggested Next Steps', '## Open Questions');
  const openQuestions = extractBulletList(text, '## Open Questions', '## Session Metadata');

  // 3. Build
  const parsed: BrainstormTranscriptParsed = {
    idea: headingMatch?.[1] || null,
    classification: (classificationMatch?.[1] as 'Technical' | 'Functional' | 'Framework') || null,
    date: dateMatch?.[1] || null,
    initialContext,
    questions,
    keyInsights,
    potentialIssues,
    suggestedNextSteps,
    openQuestions,
    duration: durationMatch?.[1] || null,
    depth: depthMatch?.[1] || null,
    consensus: consensusMatch?.[1] || null,
    raw: text,
    contractVersion: CONTRACT_VERSION,
  };

  // 4. Validate with Zod
  const validation = validateWithLogging('BrainstormTranscript', BrainstormTranscriptSchema, parsed);
  if (!validation.success) {
    // Log validation errors but still return parsed object for graceful degradation
    console.warn('BrainstormTranscript validation issues:', validation.error.issues);
  }

  return parsed;
}

function parseBrainstormQuestions(text: string): BrainstormQuestion[] | null {
  const lines = text.split('\n');
  const questions: BrainstormQuestion[] = [];

  let currentQuestion: BrainstormQuestion | null = null;

  for (const line of lines) {
    const questionMatch = line.match(ActionPatterns.brainstormTranscript.questionHeading);
    if (questionMatch) {
      if (currentQuestion) {
        questions.push(currentQuestion);
      }
      currentQuestion = {
        number: parseInt(questionMatch[1] ?? '0', 10),
        question: questionMatch[2] ?? '',
        response: '',
      };
    } else {
      const responseMatch = line.match(ActionPatterns.brainstormTranscript.humanResponse);
      if (responseMatch && currentQuestion) {
        currentQuestion.response = responseMatch[1] ?? '';
      }
    }
  }

  if (currentQuestion) {
    questions.push(currentQuestion);
  }

  return questions.length > 0 ? questions : null;
}

function extractSectionContent(text: string, startHeading: string, endHeading: string): string | null {
  const startIndex = text.indexOf(startHeading);
  const endIndex = text.indexOf(endHeading);
  if (startIndex === -1 || endIndex === -1) {
    return null;
  }
  const content = text.slice(startIndex + startHeading.length, endIndex).trim();
  return content || null;
}

function extractBulletList(text: string, startHeading: string, endHeading: string): string[] | null {
  const content = extractSectionContent(text, startHeading, endHeading);
  if (!content) {
    return null;
  }
  const items = content.split('\n')
    .filter(line => line.trim().startsWith('-'))
    .map(line => line.trim().slice(2));
  return items.length > 0 ? items : null;
}

function extractNumberedList(text: string, startHeading: string, endHeading: string): string[] | null {
  const content = extractSectionContent(text, startHeading, endHeading);
  if (!content) {
    return null;
  }
  const items = content.split('\n')
    .filter(line => /^\d+\./.test(line.trim()))
    .map(line => line.trim().replace(/^\d+\.\s*/, ''));
  return items.length > 0 ? items : null;
}
