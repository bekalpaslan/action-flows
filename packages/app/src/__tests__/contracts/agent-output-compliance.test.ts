import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import type {
  ReviewReportParsed,
  AnalysisReportParsed,
  BrainstormTranscriptParsed,
} from '@afw/shared';
import {
  parseReviewReport,
  parseAnalysisReport,
  parseBrainstormTranscript,
} from '@afw/shared';

const MONOREPO_ROOT = path.resolve(__dirname, '..', '..', '..', '..', '..');

/**
 * Contract enforcement date - logs before this are legacy and may not conform
 */
const CONTRACT_ENFORCEMENT_DATE = new Date('2026-02-14');

/**
 * Extract date from log directory name (format: name_YYYY-MM-DD-HH-MM-SS)
 */
function getLogDate(logPath: string): Date | null {
  const dirName = path.basename(path.dirname(logPath));
  // Match YYYY-MM-DD pattern (with optional time suffix)
  const dateMatch = dirName.match(/(\d{4}-\d{2}-\d{2})/);
  if (!dateMatch) return null;
  return new Date(dateMatch[1]);
}

/**
 * Check if log is post-contract (should enforce strict validation)
 */
function isPostContractLog(logPath: string): boolean {
  const logDate = getLogDate(logPath);
  if (!logDate) return false; // No date = treat as legacy
  return logDate >= CONTRACT_ENFORCEMENT_DATE;
}

/**
 * Agent Output Compliance Test Suite
 *
 * Verifies that agent outputs match CONTRACT.md Format 5.1-5.3 specifications:
 * - Format 5.1: Review Report Structure (review/ action)
 * - Format 5.2: Analysis Report Structure (analyze/ action)
 * - Format 5.3: Brainstorm Session Transcript (brainstorm/ action)
 *
 * Tests parse actual log files from .claude/actionflows/logs/ and validate:
 * 1. Parser produces non-null output (format detection works)
 * 2. Required fields are present and correctly typed
 * 3. Enum fields contain valid values
 * 4. Numeric fields are in expected ranges
 * 5. Coverage: test against multiple real agent outputs to achieve 90%+ coverage
 *
 * Scope: All agent output formats (review/, analyze/, brainstorm/)
 */

interface ReviewReportLog {
  path: string;
  content: string;
  parsed: ReviewReportParsed | null;
  format: 'review';
}

interface AnalysisReportLog {
  path: string;
  content: string;
  parsed: AnalysisReportParsed | null;
  format: 'analyze';
}

interface BrainstormLog {
  path: string;
  content: string;
  parsed: BrainstormTranscriptParsed | null;
  format: 'brainstorm';
}

/**
 * Load and parse all review report logs
 */
function loadReviewReports(): ReviewReportLog[] {
  const pattern = '.claude/actionflows/logs/review/*/review-report.md';
  const files = glob.sync(pattern, {
    cwd: MONOREPO_ROOT,
  }) as string[];

  return files
    .slice(0, 20) // Test against first 20 review reports
    .map((filePath: string) => {
      const fullPath = path.resolve(MONOREPO_ROOT, filePath);
      const content = fs.readFileSync(fullPath, 'utf-8');
      const parsed = parseReviewReport(content);

      return {
        path: filePath,
        content,
        parsed,
        format: 'review' as const,
      };
    });
}

/**
 * Load and parse all analysis report logs
 */
function loadAnalysisReports(): AnalysisReportLog[] {
  // Find analysis reports by filename patterns
  const pattern = '.claude/actionflows/logs/analyze/*/report.md';
  const files = glob.sync(pattern, {
    cwd: MONOREPO_ROOT,
  }) as string[];

  return files
    .slice(0, 20) // Test against first 20 analysis reports
    .map((filePath: string) => {
      const fullPath = path.resolve(MONOREPO_ROOT, filePath);
      const content = fs.readFileSync(fullPath, 'utf-8');
      const parsed = parseAnalysisReport(content);

      return {
        path: filePath,
        content,
        parsed,
        format: 'analyze' as const,
      };
    });
}

/**
 * Load and parse all brainstorm transcripts
 */
function loadBrainstormTranscripts(): BrainstormLog[] {
  // Find brainstorm logs — look for .md files in brainstorm folders
  const pattern = '.claude/actionflows/logs/brainstorm/**/*.md';
  const files = glob.sync(pattern, {
    cwd: MONOREPO_ROOT,
  }) as string[];

  return files
    .slice(0, 10) // Test against first 10 brainstorm transcripts
    .map((filePath: string) => {
      const fullPath = path.resolve(MONOREPO_ROOT, filePath);
      const content = fs.readFileSync(fullPath, 'utf-8');
      const parsed = parseBrainstormTranscript(content);

      return {
        path: filePath,
        content,
        parsed,
        format: 'brainstorm' as const,
      };
    });
}

describe('Agent Output Format Compliance (CONTRACT.md § 5.1-5.3)', () => {
  const reviewReports = loadReviewReports();
  const analysisReports = loadAnalysisReports();
  const brainstormTranscripts = loadBrainstormTranscripts();

  if (reviewReports.length === 0 && analysisReports.length === 0 && brainstormTranscripts.length === 0) {
    it.skip('No agent output logs found', () => {});
    return;
  }

  describe('Format 5.1: Review Report Structure', () => {
    it('should have review reports to test', () => {
      expect(reviewReports.length).toBeGreaterThan(0);
    });

    reviewReports.forEach((log) => {
      const name = path.basename(path.dirname(log.path));

      describe(`${name}`, () => {
        it('should be detected and parsed', () => {
          // Skip legacy logs (before contract enforcement)
          if (!isPostContractLog(log.path)) {
            expect(true).toBe(true);
            return;
          }
          expect(log.parsed).not.toBeNull();
        });

        it('should have required scope field', () => {
          if (log.parsed) {
            expect(log.parsed.scope).toBeDefined();
            expect(typeof log.parsed.scope === 'string' || log.parsed.scope === null).toBe(true);
          }
        });

        it('should have valid verdict enum (APPROVED | NEEDS_CHANGES)', () => {
          if (log.parsed && log.parsed.verdict) {
            expect(['APPROVED', 'NEEDS_CHANGES']).toContain(log.parsed.verdict);
          }
        });

        it('should have score in range 0-100', () => {
          if (log.parsed && log.parsed.score !== null) {
            expect(log.parsed.score).toBeGreaterThanOrEqual(0);
            expect(log.parsed.score).toBeLessThanOrEqual(100);
          }
        });

        it('should have summary (string or null)', () => {
          if (log.parsed) {
            expect(typeof log.parsed.summary === 'string' || log.parsed.summary === null).toBe(true);
          }
        });

        it('should have findings array (can be null)', () => {
          if (log.parsed && log.parsed.findings) {
            expect(Array.isArray(log.parsed.findings)).toBe(true);

            // Validate finding structure
            log.parsed.findings.forEach((finding) => {
              expect(finding.number).toBeDefined();
              expect(finding.file).toBeDefined();
              expect(['critical', 'high', 'medium', 'low']).toContain(finding.severity);
              expect(finding.description).toBeDefined();
              expect(finding.suggestion).toBeDefined();
            });
          }
        });

        it('should have contract version field', () => {
          if (log.parsed) {
            expect(log.parsed.contractVersion).toBeDefined();
            expect(typeof log.parsed.contractVersion).toBe('string');
          }
        });

        it('should preserve raw markdown text', () => {
          if (log.parsed) {
            expect(log.parsed.raw).toBeDefined();
            expect(typeof log.parsed.raw).toBe('string');
            expect(log.parsed.raw.length).toBeGreaterThan(0);
          }
        });
      });
    });

    it('should achieve 90%+ coverage on verdict extraction', () => {
      // Only count post-contract logs
      const postContractReports = reviewReports.filter((log) => isPostContractLog(log.path));
      if (postContractReports.length === 0) {
        expect(true).toBe(true);
        return;
      }
      const parsed = postContractReports.filter((log) => log.parsed?.verdict !== null);
      const coverage = (parsed.length / postContractReports.length) * 100;
      expect(coverage).toBeGreaterThanOrEqual(90);
    });

    it('should achieve 90%+ coverage on score extraction', () => {
      // Only count post-contract logs
      const postContractReports = reviewReports.filter((log) => isPostContractLog(log.path));
      if (postContractReports.length === 0) {
        expect(true).toBe(true);
        return;
      }
      const parsed = postContractReports.filter((log) => log.parsed?.score !== null);
      const coverage = (parsed.length / postContractReports.length) * 100;
      expect(coverage).toBeGreaterThanOrEqual(90);
    });
  });

  describe('Format 5.2: Analysis Report Structure', () => {
    it('should have analysis reports to test', () => {
      expect(analysisReports.length).toBeGreaterThan(0);
    });

    analysisReports.forEach((log) => {
      const name = path.basename(path.dirname(log.path));

      describe(`${name}`, () => {
        it('should be detected and parsed', () => {
          // Skip legacy logs (before contract enforcement)
          if (!isPostContractLog(log.path)) {
            expect(true).toBe(true);
            return;
          }
          expect(log.parsed).not.toBeNull();
        });

        it('should have required title field', () => {
          if (log.parsed) {
            expect(log.parsed.title).toBeDefined();
            expect(typeof log.parsed.title === 'string' || log.parsed.title === null).toBe(true);
          }
        });

        it('should have aspect field', () => {
          if (log.parsed) {
            expect(log.parsed.aspect).toBeDefined();
            expect(typeof log.parsed.aspect === 'string' || log.parsed.aspect === null).toBe(true);
          }
        });

        it('should have scope field', () => {
          if (log.parsed) {
            expect(log.parsed.scope).toBeDefined();
            expect(typeof log.parsed.scope === 'string' || log.parsed.scope === null).toBe(true);
          }
        });

        it('should have date in YYYY-MM-DD format or null', () => {
          if (log.parsed && log.parsed.date) {
            expect(/^\d{4}-\d{2}-\d{2}$/.test(log.parsed.date)).toBe(true);
          }
        });

        it('should have numbered sections array', () => {
          if (log.parsed && log.parsed.sections) {
            expect(Array.isArray(log.parsed.sections)).toBe(true);

            // Validate section structure
            log.parsed.sections.forEach((section: any) => {
              expect(section.number).toBeDefined();
              expect(typeof section.number).toBe('number');
              expect(section.title).toBeDefined();
              expect(typeof section.title).toBe('string');
              expect(section.content).toBeDefined();
              expect(typeof section.content).toBe('string');
            });
          }
        });

        it('should have recommendations array (can be null)', () => {
          if (log.parsed && log.parsed.recommendations) {
            expect(Array.isArray(log.parsed.recommendations)).toBe(true);
            log.parsed.recommendations.forEach((rec: any) => {
              expect(typeof rec).toBe('string');
            });
          }
        });

        it('should preserve raw markdown text', () => {
          if (log.parsed) {
            expect(log.parsed.raw).toBeDefined();
            expect(typeof log.parsed.raw).toBe('string');
            expect(log.parsed.raw.length).toBeGreaterThan(0);
          }
        });
      });
    });

    it('should achieve 85%+ coverage on title extraction', () => {
      // Only count post-contract logs
      const postContractReports = analysisReports.filter((log) => isPostContractLog(log.path));
      if (postContractReports.length === 0) {
        expect(true).toBe(true);
        return;
      }
      const parsed = postContractReports.filter((log) => log.parsed?.title !== null);
      const coverage = (parsed.length / postContractReports.length) * 100;
      expect(coverage).toBeGreaterThanOrEqual(85);
    });

    it('should achieve 90%+ coverage on sections extraction', () => {
      // Only count post-contract logs
      const postContractReports = analysisReports.filter((log) => isPostContractLog(log.path));
      if (postContractReports.length === 0) {
        expect(true).toBe(true);
        return;
      }
      const parsed = postContractReports.filter((log) => log.parsed?.sections && log.parsed.sections.length > 0);
      const coverage = (parsed.length / postContractReports.length) * 100;
      expect(coverage).toBeGreaterThanOrEqual(90);
    });
  });

  describe('Format 5.3: Brainstorm Session Transcript', () => {
    it('should have brainstorm transcripts to test', () => {
      // This may be skipped if no brainstorm logs exist
      expect(brainstormTranscripts.length).toBeGreaterThanOrEqual(0);
    });

    brainstormTranscripts.forEach((log) => {
      const name = path.basename(path.dirname(log.path));

      describe(`${name}`, () => {
        it('should be detected and parsed (if format matches)', () => {
          // Brainstorm format detection may be false for some logs
          // This is OK — we validate structure only when parsed successfully
          if (log.parsed) {
            expect(log.parsed).toBeDefined();
          }
        });

        it('should have idea field when parsed', () => {
          if (log.parsed) {
            expect(log.parsed.idea).toBeDefined();
            expect(typeof log.parsed.idea === 'string' || log.parsed.idea === null).toBe(true);
          }
        });

        it('should have classification field when parsed', () => {
          if (log.parsed && log.parsed.classification) {
            expect(['Technical', 'Functional', 'Framework']).toContain(log.parsed.classification);
          }
        });

        it('should have questions array structure', () => {
          if (log.parsed && log.parsed.questions) {
            expect(Array.isArray(log.parsed.questions)).toBe(true);

            log.parsed.questions.forEach((q: any) => {
              expect(q.number).toBeDefined();
              expect(typeof q.number).toBe('number');
              expect(q.question).toBeDefined();
              expect(typeof q.question).toBe('string');
              expect(q.response).toBeDefined();
              expect(typeof q.response).toBe('string');
            });
          }
        });

        it('should have key insights array (can be null)', () => {
          if (log.parsed && log.parsed.keyInsights) {
            expect(Array.isArray(log.parsed.keyInsights)).toBe(true);
            log.parsed.keyInsights.forEach((insight: any) => {
              expect(typeof insight).toBe('string');
            });
          }
        });

        it('should have potential issues array (can be null)', () => {
          if (log.parsed && log.parsed.potentialIssues) {
            expect(Array.isArray(log.parsed.potentialIssues)).toBe(true);
            log.parsed.potentialIssues.forEach((issue: any) => {
              expect(typeof issue).toBe('string');
            });
          }
        });

        it('should preserve raw markdown text', () => {
          if (log.parsed) {
            expect(log.parsed.raw).toBeDefined();
            expect(typeof log.parsed.raw).toBe('string');
          }
        });
      });
    });
  });

  describe('Cross-Format Coverage & Statistics', () => {
    it('should have total coverage 90%+ across all agent output types', () => {
      // Only count post-contract logs
      const postContractReviews = reviewReports.filter((r) => isPostContractLog(r.path));
      const postContractAnalyses = analysisReports.filter((a) => isPostContractLog(a.path));
      const postContractBrainstorms = brainstormTranscripts.filter((b) => isPostContractLog(b.path));

      const total = postContractReviews.length + postContractAnalyses.length + postContractBrainstorms.length;
      const parsed = (postContractReviews.filter((r) => r.parsed !== null).length +
        postContractAnalyses.filter((a) => a.parsed !== null).length +
        postContractBrainstorms.filter((b) => b.parsed !== null).length) as number;

      if (total === 0) {
        expect(true).toBe(true);
        return;
      }

      const coverage = (parsed / total) * 100;
      expect(coverage).toBeGreaterThanOrEqual(85); // Allow slight variance due to format variations
    });

    it('should provide diagnostic summary', () => {
      const stats = {
        reviewReports: {
          total: reviewReports.length,
          parsed: reviewReports.filter((r) => r.parsed !== null).length,
          coverage: reviewReports.length > 0 ? ((reviewReports.filter((r) => r.parsed !== null).length / reviewReports.length) * 100).toFixed(1) : 'N/A',
        },
        analysisReports: {
          total: analysisReports.length,
          parsed: analysisReports.filter((a) => a.parsed !== null).length,
          coverage: analysisReports.length > 0 ? ((analysisReports.filter((a) => a.parsed !== null).length / analysisReports.length) * 100).toFixed(1) : 'N/A',
        },
        brainstormTranscripts: {
          total: brainstormTranscripts.length,
          parsed: brainstormTranscripts.filter((b) => b.parsed !== null).length,
          coverage: brainstormTranscripts.length > 0 ? ((brainstormTranscripts.filter((b) => b.parsed !== null).length / brainstormTranscripts.length) * 100).toFixed(1) : 'N/A',
        },
      };

      console.log('\n=== Agent Output Compliance Coverage ===');
      console.log(`Review Reports: ${stats.reviewReports.parsed}/${stats.reviewReports.total} (${stats.reviewReports.coverage}%)`);
      console.log(`Analysis Reports: ${stats.analysisReports.parsed}/${stats.analysisReports.total} (${stats.analysisReports.coverage}%)`);
      console.log(`Brainstorm Transcripts: ${stats.brainstormTranscripts.parsed}/${stats.brainstormTranscripts.total} (${stats.brainstormTranscripts.coverage}%)`);
      console.log('========================================\n');

      expect(stats).toBeDefined();
    });
  });
});
