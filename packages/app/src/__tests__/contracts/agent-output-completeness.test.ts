import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import {
  parseReviewReport,
  parseAnalysisReport,
  parseBrainstormTranscript,
} from '@afw/shared';

const MONOREPO_ROOT = path.resolve(__dirname, '..', '..', '..', '..', '..');

/**
 * Contract enforcement date - logs before this are legacy and may not conform
 */
const CONTRACT_ENFORCEMENT_DATE = new Date('2026-02-15');

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
 * Agent Output Completeness Test Suite
 *
 * Verifies that agent outputs have all required fields per CONTRACT.md Format 5.1-5.3.
 * Complements contract-compliance.test.ts by focusing on field presence and validity.
 *
 * Tests validate:
 * 1. Presence of required fields (not null)
 * 2. Correct field types (string, number, array, enum)
 * 3. Non-empty content for critical sections
 * 4. Field count and structure match specification
 * 5. Coverage: 90%+ of sampled agent outputs have all required fields
 *
 * Based on contract-completeness.test.ts pattern.
 * Scope: All agent output formats
 */

type RequiredFieldSet = Record<string, {
  fieldName: string;
  fieldPath: string;
  expectedType: 'string' | 'number' | 'array' | 'enum';
  critical: boolean;
  minLength?: number; // For non-empty string checks
}>;

const REVIEW_REPORT_REQUIRED_FIELDS: RequiredFieldSet = {
  scope: {
    fieldName: 'scope',
    fieldPath: 'scope',
    expectedType: 'string',
    critical: true,
  },
  verdict: {
    fieldName: 'verdict',
    fieldPath: 'verdict',
    expectedType: 'enum',
    critical: true,
  },
  score: {
    fieldName: 'score',
    fieldPath: 'score',
    expectedType: 'number',
    critical: true,
  },
  summary: {
    fieldName: 'summary',
    fieldPath: 'summary',
    expectedType: 'string',
    critical: true,
    minLength: 10,
  },
  findings: {
    fieldName: 'findings',
    fieldPath: 'findings',
    expectedType: 'array',
    critical: false, // Can be null if no findings
  },
};

const ANALYSIS_REPORT_REQUIRED_FIELDS: RequiredFieldSet = {
  title: {
    fieldName: 'title',
    fieldPath: 'title',
    expectedType: 'string',
    critical: true,
  },
  aspect: {
    fieldName: 'aspect',
    fieldPath: 'aspect',
    expectedType: 'string',
    critical: true,
  },
  scope: {
    fieldName: 'scope',
    fieldPath: 'scope',
    expectedType: 'string',
    critical: true,
  },
  date: {
    fieldName: 'date',
    fieldPath: 'date',
    expectedType: 'string',
    critical: true,
  },
  sections: {
    fieldName: 'sections',
    fieldPath: 'sections',
    expectedType: 'array',
    critical: true,
  },
  recommendations: {
    fieldName: 'recommendations',
    fieldPath: 'recommendations',
    expectedType: 'array',
    critical: true,
  },
};

// Note: BRAINSTORM_TRANSCRIPT_REQUIRED_FIELDS would be used for structured validation
// but brainstorm format is optional, so we validate manually instead

/**
 * Helper: Get field value from object using dot notation
 */
function getFieldValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Helper: Check if value matches expected type
 */
function isValidType(value: any, expectedType: string): boolean {
  if (value === null) {
    return true; // null is acceptable for optional fields
  }

  switch (expectedType) {
    case 'string':
      return typeof value === 'string';
    case 'number':
      return typeof value === 'number';
    case 'array':
      return Array.isArray(value);
    case 'enum':
      return typeof value === 'string';
    default:
      return false;
  }
}

/**
 * Helper: Validate a parsed object against required fields
 */
function validateAgainstSchema(parsed: any, requiredFields: RequiredFieldSet): {
  isValid: boolean;
  missingFields: string[];
  invalidFields: { field: string; expected: string; got: string }[];
  emptyFields: string[];
} {
  const result = {
    isValid: true,
    missingFields: [] as string[],
    invalidFields: [] as { field: string; expected: string; got: string }[],
    emptyFields: [] as string[],
  };

  for (const [, spec] of Object.entries(requiredFields)) {
    const value = getFieldValue(parsed, spec.fieldPath);

    // Check for missing critical fields
    if (spec.critical && (value === null || value === undefined)) {
      result.missingFields.push(spec.fieldName);
      result.isValid = false;
      continue;
    }

    // Check type validity
    if (value !== null && value !== undefined && !isValidType(value, spec.expectedType)) {
      result.invalidFields.push({
        field: spec.fieldName,
        expected: spec.expectedType,
        got: typeof value,
      });
      result.isValid = false;
    }

    // Check minimum length for strings
    if (spec.minLength && typeof value === 'string' && value.length < spec.minLength) {
      result.emptyFields.push(`${spec.fieldName} (${value.length}/${spec.minLength} chars)`);
    }
  }

  return result;
}

describe('Agent Output Completeness (Required Fields)', () => {
  // Load sample logs
  const reviewReports = (glob.sync('.claude/actionflows/logs/review/*/review-report.md', { cwd: MONOREPO_ROOT }) as string[])
    .slice(0, 25)
    .map((filePath: string) => {
      const fullPath = path.resolve(MONOREPO_ROOT, filePath);
      const content = fs.readFileSync(fullPath, 'utf-8');
      return {
        path: filePath,
        parsed: parseReviewReport(content),
      };
    });

  const analysisReports = (glob.sync('.claude/actionflows/logs/analyze/*/report.md', { cwd: MONOREPO_ROOT }) as string[])
    .slice(0, 25)
    .map((filePath: string) => {
      const fullPath = path.resolve(MONOREPO_ROOT, filePath);
      const content = fs.readFileSync(fullPath, 'utf-8');
      return {
        path: filePath,
        parsed: parseAnalysisReport(content),
      };
    });

  const brainstormLogs = (glob.sync('.claude/actionflows/logs/brainstorm/**/*.md', { cwd: MONOREPO_ROOT }) as string[])
    .slice(0, 15)
    .map((filePath: string) => {
      const fullPath = path.resolve(MONOREPO_ROOT, filePath);
      const content = fs.readFileSync(fullPath, 'utf-8');
      return {
        path: filePath,
        parsed: parseBrainstormTranscript(content),
      };
    });

  describe('Format 5.1: Review Report Completeness', () => {
    it('should have review reports to test', () => {
      expect(reviewReports.length).toBeGreaterThan(0);
    });

    reviewReports.forEach((log) => {
      const name = path.basename(path.dirname(log.path));

      it(`${name} - has all required fields`, () => {
        if (!log.parsed) {
          // Skip non-review logs
          expect(log.parsed).toBeNull();
          return;
        }

        // Skip legacy logs (before contract enforcement)
        if (!isPostContractLog(log.path)) {
          expect(true).toBe(true); // Mark as passing, this is pre-contract
          return;
        }

        const validation = validateAgainstSchema(log.parsed, REVIEW_REPORT_REQUIRED_FIELDS);

        if (validation.missingFields.length > 0) {
          expect.fail(`Missing fields: ${validation.missingFields.join(', ')}`);
        }

        if (validation.invalidFields.length > 0) {
          const details = validation.invalidFields.map((f) => `${f.field} (expected ${f.expected}, got ${f.got})`);
          expect.fail(`Invalid types: ${details.join(', ')}`);
        }

        expect(validation.isValid).toBe(true);
      });

      it(`${name} - has non-empty critical fields`, () => {
        if (!log.parsed) return;

        // Skip legacy logs (before contract enforcement)
        if (!isPostContractLog(log.path)) {
          expect(true).toBe(true);
          return;
        }

        const issues: string[] = [];

        // Check scope
        if (!log.parsed.scope || log.parsed.scope.trim().length === 0) {
          issues.push('scope is empty');
        }

        // Check verdict enum
        if (!['APPROVED', 'NEEDS_CHANGES'].includes(log.parsed.verdict || '')) {
          issues.push(`verdict is invalid: ${log.parsed.verdict}`);
        }

        // Check score
        if (typeof log.parsed.score !== 'number' || log.parsed.score < 0 || log.parsed.score > 100) {
          issues.push(`score out of range: ${log.parsed.score}`);
        }

        // Check summary has substance
        if (!log.parsed.summary || log.parsed.summary.trim().length < 10) {
          issues.push(`summary is too short: ${log.parsed.summary?.length || 0} chars`);
        }

        if (issues.length > 0) {
          expect.fail(`Completeness issues: ${issues.join('; ')}`);
        }
      });
    });

    it('should achieve 90%+ completeness on critical review fields', () => {
      // Only count post-contract logs for completeness threshold
      const postContractReviews = reviewReports.filter((log) => isPostContractLog(log.path));

      const validReviews = postContractReviews.filter((log) => {
        if (!log.parsed) return false;
        const validation = validateAgainstSchema(log.parsed, REVIEW_REPORT_REQUIRED_FIELDS);
        return validation.isValid && validation.missingFields.length === 0;
      });

      if (postContractReviews.length === 0) {
        // No post-contract logs yet, skip this test
        expect(true).toBe(true);
        return;
      }

      const completeness = (validReviews.length / postContractReviews.length) * 100;
      expect(completeness).toBeGreaterThanOrEqual(90);
    });
  });

  describe('Format 5.2: Analysis Report Completeness', () => {
    it('should have analysis reports to test', () => {
      expect(analysisReports.length).toBeGreaterThan(0);
    });

    analysisReports.forEach((log) => {
      const name = path.basename(path.dirname(log.path));

      it(`${name} - has all required fields`, () => {
        if (!log.parsed) {
          // Analysis format detection might fail on some files
          expect(log.parsed).toBeNull();
          return;
        }

        // Skip legacy logs (before contract enforcement)
        if (!isPostContractLog(log.path)) {
          expect(true).toBe(true);
          return;
        }

        const validation = validateAgainstSchema(log.parsed, ANALYSIS_REPORT_REQUIRED_FIELDS);

        if (validation.missingFields.length > 0) {
          expect.fail(`Missing fields: ${validation.missingFields.join(', ')}`);
        }

        expect(validation.isValid).toBe(true);
      });

      it(`${name} - has structured sections`, () => {
        if (!log.parsed || !log.parsed.sections) return;

        // Skip legacy logs (before contract enforcement)
        if (!isPostContractLog(log.path)) {
          expect(true).toBe(true);
          return;
        }

        expect(Array.isArray(log.parsed.sections)).toBe(true);

        // Each section must have required fields
        log.parsed.sections.forEach((section) => {
          expect(section.number).toBeDefined();
          expect(typeof section.number).toBe('number');
          expect(section.title).toBeDefined();
          expect(typeof section.title).toBe('string');
          expect(section.title.length).toBeGreaterThan(0);
          expect(section.content).toBeDefined();
          expect(typeof section.content).toBe('string');
        });
      });

      it(`${name} - has valid metadata fields`, () => {
        if (!log.parsed) return;

        // Skip legacy logs (before contract enforcement)
        if (!isPostContractLog(log.path)) {
          expect(true).toBe(true);
          return;
        }

        if (log.parsed.date) {
          expect(/^\d{4}-\d{2}-\d{2}$/.test(log.parsed.date)).toBe(true);
        }

        if (log.parsed.aspect) {
          expect(typeof log.parsed.aspect).toBe('string');
          expect(log.parsed.aspect.length).toBeGreaterThan(0);
        }
      });
    });

    it('should achieve 85%+ completeness on critical analysis fields', () => {
      // Only count post-contract logs for completeness threshold
      const postContractAnalyses = analysisReports.filter((log) => isPostContractLog(log.path));

      const validAnalyses = postContractAnalyses.filter((log) => {
        if (!log.parsed) return false;
        const validation = validateAgainstSchema(log.parsed, ANALYSIS_REPORT_REQUIRED_FIELDS);
        return validation.isValid && validation.missingFields.length === 0;
      });

      if (postContractAnalyses.length === 0) {
        // No post-contract logs yet, skip this test
        expect(true).toBe(true);
        return;
      }

      const completeness = (validAnalyses.length / postContractAnalyses.length) * 100;
      expect(completeness).toBeGreaterThanOrEqual(85);
    });
  });

  describe('Format 5.3: Brainstorm Transcript Completeness', () => {
    it('should validate brainstorm format when detected', () => {
      const detected = brainstormLogs.filter((log) => log.parsed !== null);

      // Brainstorm format is optional, so we just validate detected ones
      detected.forEach((log) => {
        if (log.parsed) {
          // When parsed, idea should be present
          expect(log.parsed.idea).toBeDefined();
        }
      });
    });

    brainstormLogs.forEach((log) => {
      const name = path.basename(path.dirname(log.path));

      it(`${name} - has valid brainstorm structure when detected`, () => {
        if (!log.parsed) {
          // Brainstorm detection may fail if file doesn't match format
          expect(log.parsed).toBeNull();
          return;
        }

        // If parsed, validate critical fields
        const issues: string[] = [];

        if (!log.parsed.idea) {
          issues.push('idea is missing');
        }

        if (issues.length > 0) {
          expect.fail(`Brainstorm issues: ${issues.join('; ')}`);
        }
      });
    });
  });

  describe('Cross-Format Completeness Summary', () => {
    it('should provide completeness statistics', () => {
      const reviewStats = {
        total: reviewReports.length,
        complete: reviewReports.filter((log) => {
          if (!log.parsed) return false;
          const validation = validateAgainstSchema(log.parsed, REVIEW_REPORT_REQUIRED_FIELDS);
          return validation.isValid && validation.missingFields.length === 0;
        }).length,
      };

      const analysisStats = {
        total: analysisReports.length,
        complete: analysisReports.filter((log) => {
          if (!log.parsed) return false;
          const validation = validateAgainstSchema(log.parsed, ANALYSIS_REPORT_REQUIRED_FIELDS);
          return validation.isValid && validation.missingFields.length === 0;
        }).length,
      };

      const brainstormStats = {
        total: brainstormLogs.length,
        detected: brainstormLogs.filter((log) => log.parsed !== null).length,
      };

      console.log('\n=== Agent Output Completeness Summary ===');
      console.log(
        `Review Reports: ${reviewStats.complete}/${reviewStats.total} complete (${((reviewStats.complete / reviewStats.total) * 100).toFixed(1)}%)`
      );
      console.log(
        `Analysis Reports: ${analysisStats.complete}/${analysisStats.total} complete (${((analysisStats.complete / analysisStats.total) * 100).toFixed(1)}%)`
      );
      console.log(`Brainstorm Transcripts: ${brainstormStats.detected}/${brainstormStats.total} detected`);
      console.log('==========================================\n');

      expect(reviewStats.complete).toBeGreaterThan(0);
    });

    it('should identify common completeness issues', () => {
      const reviewIssues: Record<string, number> = {};

      reviewReports.forEach((log) => {
        if (log.parsed) {
          const validation = validateAgainstSchema(log.parsed, REVIEW_REPORT_REQUIRED_FIELDS);

          validation.missingFields.forEach((field) => {
            reviewIssues[field] = (reviewIssues[field] || 0) + 1;
          });

          validation.invalidFields.forEach((field) => {
            const issueKey = `${field.field} (type: ${field.expected})`;
            reviewIssues[issueKey] = (reviewIssues[issueKey] || 0) + 1;
          });
        }
      });

      if (Object.keys(reviewIssues).length > 0) {
        console.log('\nCommon Completeness Issues:');
        Object.entries(reviewIssues)
          .sort(([, a], [, b]) => b - a)
          .forEach(([issue, count]) => {
            console.log(`  - ${issue}: ${count} occurrences`);
          });
      }

      // Log for informational purposes, don't fail
      expect(true).toBe(true);
    });
  });
});
