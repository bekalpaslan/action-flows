/**
 * Contract Validation Schema Tests
 * Validates all Zod schemas for enum/range constraints
 */

import { describe, it, expect } from 'vitest';
import {
  ReviewReportSchema,
  ErrorAnnouncementSchema,
  ContextRoutingSchema,
  ScoreSchema,
  ConfidenceSchema,
  VerdictSchema,
  SeveritySchema,
  ContextEnumSchema,
  CommitHashSchema,
  DateSchema,
  ActionPathSchema,
  StatusStringSchema,
  validateParsedFormat,
} from '../validation/schemas.js';

describe('Zod Validation Schemas', () => {
  describe('Range Validators', () => {
    it('validates score (0-100)', () => {
      expect(ScoreSchema.safeParse(0).success).toBe(true);
      expect(ScoreSchema.safeParse(50).success).toBe(true);
      expect(ScoreSchema.safeParse(100).success).toBe(true);
      expect(ScoreSchema.safeParse(-1).success).toBe(false);
      expect(ScoreSchema.safeParse(101).success).toBe(false);
      expect(ScoreSchema.safeParse(85.5).success).toBe(false); // not int
    });

    it('validates confidence (0.0-1.0)', () => {
      expect(ConfidenceSchema.safeParse(0).success).toBe(true);
      expect(ConfidenceSchema.safeParse(0.5).success).toBe(true);
      expect(ConfidenceSchema.safeParse(1.0).success).toBe(true);
      expect(ConfidenceSchema.safeParse(-0.1).success).toBe(false);
      expect(ConfidenceSchema.safeParse(1.1).success).toBe(false);
    });
  });

  describe('Enum Validators', () => {
    it('validates verdict enum', () => {
      expect(VerdictSchema.safeParse('APPROVED').success).toBe(true);
      expect(VerdictSchema.safeParse('NEEDS_CHANGES').success).toBe(true);
      expect(VerdictSchema.safeParse('MAYBE').success).toBe(false);
      expect(VerdictSchema.safeParse('approved').success).toBe(false);
    });

    it('validates severity enum', () => {
      expect(SeveritySchema.safeParse('critical').success).toBe(true);
      expect(SeveritySchema.safeParse('high').success).toBe(true);
      expect(SeveritySchema.safeParse('medium').success).toBe(true);
      expect(SeveritySchema.safeParse('low').success).toBe(true);
      expect(SeveritySchema.safeParse('CRITICAL').success).toBe(false);
      expect(SeveritySchema.safeParse('unknown').success).toBe(false);
    });

    it('validates context enum', () => {
      expect(ContextEnumSchema.safeParse('work').success).toBe(true);
      expect(ContextEnumSchema.safeParse('maintenance').success).toBe(true);
      expect(ContextEnumSchema.safeParse('explore').success).toBe(true);
      expect(ContextEnumSchema.safeParse('review').success).toBe(true);
      expect(ContextEnumSchema.safeParse('settings').success).toBe(true);
      expect(ContextEnumSchema.safeParse('pm').success).toBe(true);
      expect(ContextEnumSchema.safeParse('archive').success).toBe(true);
      expect(ContextEnumSchema.safeParse('harmony').success).toBe(true);
      expect(ContextEnumSchema.safeParse('editor').success).toBe(true);
      expect(ContextEnumSchema.safeParse('invalid').success).toBe(false);
    });

    it('validates status enum with case normalization', () => {
      // Lowercase (standard format)
      expect(StatusStringSchema.safeParse('pending').success).toBe(true);
      expect(StatusStringSchema.safeParse('running').success).toBe(true);
      expect(StatusStringSchema.safeParse('completed').success).toBe(true);
      expect(StatusStringSchema.safeParse('failed').success).toBe(true);
      expect(StatusStringSchema.safeParse('skipped').success).toBe(true);

      // Capitalized (orchestrator output format) - should normalize to lowercase
      expect(StatusStringSchema.safeParse('Pending').success).toBe(true);
      expect(StatusStringSchema.safeParse('Running').success).toBe(true);
      expect(StatusStringSchema.safeParse('Completed').success).toBe(true);
      expect(StatusStringSchema.safeParse('Failed').success).toBe(true);
      expect(StatusStringSchema.safeParse('Skipped').success).toBe(true);

      // Invalid values
      expect(StatusStringSchema.safeParse('PENDING').success).toBe(true); // also normalizes
      expect(StatusStringSchema.safeParse('invalid').success).toBe(false);
      expect(StatusStringSchema.safeParse('').success).toBe(false);
    });
  });

  describe('Format Validators', () => {
    it('validates date format (YYYY-MM-DD)', () => {
      expect(DateSchema.safeParse('2026-02-11').success).toBe(true);
      expect(DateSchema.safeParse('2024-01-01').success).toBe(true);
      expect(DateSchema.safeParse('02-11-2026').success).toBe(false);
      expect(DateSchema.safeParse('2026/02/11').success).toBe(false);
      expect(DateSchema.safeParse('2026-2-11').success).toBe(false);
    });

    it('validates commit hash (7-40 hex chars)', () => {
      expect(CommitHashSchema.safeParse('abc1234').success).toBe(true);
      expect(CommitHashSchema.safeParse('abc123def456789012345678901234567890').success).toBe(true);
      expect(CommitHashSchema.safeParse('abc123').success).toBe(false); // too short
      expect(CommitHashSchema.safeParse('abc123def456789012345678901234567890xyz').success).toBe(false); // too long
      expect(CommitHashSchema.safeParse('xyz1234').success).toBe(false); // invalid hex
    });

    it('validates action path (kebab-case with slashes)', () => {
      expect(ActionPathSchema.safeParse('code').success).toBe(true);
      expect(ActionPathSchema.safeParse('code-backend').success).toBe(true);
      expect(ActionPathSchema.safeParse('code/backend').success).toBe(true);
      expect(ActionPathSchema.safeParse('code-review/audit').success).toBe(true);
      expect(ActionPathSchema.safeParse('code_backend').success).toBe(true);
      expect(ActionPathSchema.safeParse('CodeBackend').success).toBe(false); // CamelCase
      expect(ActionPathSchema.safeParse('code backend').success).toBe(false); // spaces
    });
  });

  describe('ReviewReportSchema', () => {
    it('validates correct review report', () => {
      const validReport = {
        raw: 'test',
        contractVersion: '1.0',
        scope: 'Test scope',
        verdict: 'APPROVED',
        score: 85,
        summary: 'Summary text',
        findings: null,
        fixesApplied: null,
        flagsForHuman: null,
      };

      const result = validateParsedFormat(ReviewReportSchema, validReport);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.verdict).toBe('APPROVED');
        expect(result.data.score).toBe(85);
      }
    });

    it('rejects invalid verdict', () => {
      const invalidReport = {
        raw: 'test',
        contractVersion: '1.0',
        scope: 'Test',
        verdict: 'MAYBE' as any,
        score: 85,
        summary: null,
        findings: null,
        fixesApplied: null,
        flagsForHuman: null,
      };

      const result = validateParsedFormat(ReviewReportSchema, invalidReport);
      expect(result.success).toBe(false);
    });

    it('rejects score out of range', () => {
      const invalidReport = {
        raw: 'test',
        contractVersion: '1.0',
        scope: 'Test',
        verdict: 'APPROVED',
        score: 150,
        summary: null,
        findings: null,
        fixesApplied: null,
        flagsForHuman: null,
      };

      const result = validateParsedFormat(ReviewReportSchema, invalidReport);
      expect(result.success).toBe(false);
    });
  });

  describe('ErrorAnnouncementSchema', () => {
    it('validates correct error announcement', () => {
      const validError = {
        raw: 'test',
        contractVersion: '1.0',
        title: 'Test Error',
        stepNumber: 5,
        action: 'code/backend',
        message: 'Something went wrong',
        context: 'Test context',
        stackTrace: null,
        recoveryOptions: ['Retry', 'Skip'],
      };

      const result = validateParsedFormat(ErrorAnnouncementSchema, validError);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.stepNumber).toBe(5);
        expect(result.data.recoveryOptions).toEqual(['Retry', 'Skip']);
      }
    });

    it('rejects invalid action path', () => {
      const invalidError = {
        raw: 'test',
        contractVersion: '1.0',
        title: 'Test Error',
        stepNumber: 5,
        action: 'Code Backend', // invalid: spaces
        message: 'Something went wrong',
        context: null,
        stackTrace: null,
        recoveryOptions: null,
      };

      const result = validateParsedFormat(ErrorAnnouncementSchema, invalidError);
      expect(result.success).toBe(false);
    });
  });

  describe('ContextRoutingSchema', () => {
    it('validates correct context routing', () => {
      const validRouting = {
        raw: 'test',
        contractVersion: '1.0',
        request: 'Fix bug in auth',
        context: 'maintenance' as const,
        confidence: 0.95,
        flow: 'audit-and-fix',
        actions: ['analyze', 'plan', 'code', 'review'],
        disambiguated: false,
      };

      const result = validateParsedFormat(ContextRoutingSchema, validRouting);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.context).toBe('maintenance');
        expect(result.data.confidence).toBe(0.95);
      }
    });

    it('rejects confidence out of range', () => {
      const invalidRouting = {
        raw: 'test',
        contractVersion: '1.0',
        request: 'Fix bug',
        context: 'work' as const,
        confidence: 1.5, // invalid: > 1.0
        flow: null,
        actions: null,
        disambiguated: false,
      };

      const result = validateParsedFormat(ContextRoutingSchema, invalidRouting);
      expect(result.success).toBe(false);
    });

    it('rejects invalid context', () => {
      const invalidRouting = {
        raw: 'test',
        contractVersion: '1.0',
        request: 'Fix bug',
        context: 'invalid' as any,
        confidence: 0.8,
        flow: null,
        actions: null,
        disambiguated: false,
      };

      const result = validateParsedFormat(ContextRoutingSchema, invalidRouting);
      expect(result.success).toBe(false);
    });
  });

  describe('Graceful degradation', () => {
    it('allows null/missing optional fields', () => {
      const minimalReport = {
        raw: 'test',
        contractVersion: '1.0',
        scope: null,
        verdict: null,
        score: null,
        summary: null,
        findings: null,
        fixesApplied: null,
        flagsForHuman: null,
      };

      const result = validateParsedFormat(ReviewReportSchema, minimalReport);
      expect(result.success).toBe(true);
    });

    it('allows extra fields (partial parse)', () => {
      const extraFieldsReport = {
        raw: 'test',
        contractVersion: '1.0',
        scope: null,
        verdict: 'APPROVED',
        score: 50,
        summary: null,
        findings: null,
        fixesApplied: null,
        flagsForHuman: null,
        extraField: 'should be ignored',
      };

      const result = validateParsedFormat(ReviewReportSchema, extraFieldsReport);
      // Zod by default strips extra fields with passthrough, so this should pass
      expect(result.success).toBe(true);
    });
  });
});
