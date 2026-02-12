/**
 * Zod Validation Schemas for Contract Formats
 * Runtime validation for all 17 orchestrator output types
 *
 * This module provides:
 * - Base schema for common fields (raw, contractVersion)
 * - Enum validation for verdict, severity, context values
 * - Range validation for scores (0-100), confidence (0.0-1.0), line numbers
 * - Format validation for dates (YYYY-MM-DD), commit hashes, action paths
 */

import { z } from 'zod';

// ============================================================================
// Base & Common Schemas
// ============================================================================

/**
 * Base schema - all parsed formats have these fields
 */
export const BaseParsedSchema = z.object({
  raw: z.string(),
  contractVersion: z.string(),
});

/**
 * Model enum - which AI model executed the step
 */
export const ModelStringSchema = z.enum(['opus', 'sonnet', 'haiku']);
export type ModelString = z.infer<typeof ModelStringSchema>;

/**
 * Status enum - execution status of a step
 */
export const StatusStringSchema = z.preprocess(
  (val) => typeof val === 'string' ? val.toLowerCase() : val,
  z.enum(['pending', 'running', 'completed', 'failed', 'skipped'])
);
export type StatusString = z.infer<typeof StatusStringSchema>;

/**
 * Verdict enum - review verdict
 */
export const VerdictSchema = z.enum(['APPROVED', 'NEEDS_CHANGES']);
export type Verdict = z.infer<typeof VerdictSchema>;

/**
 * Severity enum - severity of a finding
 */
export const SeveritySchema = z.enum(['critical', 'high', 'medium', 'low']);
export type Severity = z.infer<typeof SeveritySchema>;

/**
 * Context enum - routing context
 */
export const ContextEnumSchema = z.enum(['work', 'maintenance', 'explore', 'review', 'settings', 'pm', 'archive', 'harmony', 'editor']);
export type ContextEnum = z.infer<typeof ContextEnumSchema>;

/**
 * Classification enum - brainstorm classification
 */
export const ClassificationSchema = z.enum(['Technical', 'Functional', 'Framework']);
export type Classification = z.infer<typeof ClassificationSchema>;

// ============================================================================
// Range Validators
// ============================================================================

/**
 * Score (0-100)
 */
export const ScoreSchema = z.number().int().min(0).max(100);

/**
 * Confidence (0.0-1.0)
 */
export const ConfidenceSchema = z.number().min(0).max(1);

/**
 * Step number (positive integer)
 */
export const StepNumberSchema = z.number().int().positive();

/**
 * Line number (positive integer)
 */
export const LineNumberSchema = z.number().int().positive();

// ============================================================================
// Format Validators
// ============================================================================

/**
 * Date format (YYYY-MM-DD)
 */
export const DateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format');

/**
 * Commit hash (7-40 hex chars)
 */
export const CommitHashSchema = z.string().regex(/^[a-f0-9]{7,40}$/, 'Commit hash must be 7-40 hex characters');

/**
 * Action path (kebab-case with slashes, e.g. "code", "code/backend", "review/audit")
 */
export const ActionPathSchema = z.string().regex(/^[a-z0-9\-_]+(?:\/[a-z0-9\-_]+)*$/, 'Action path must be kebab-case with optional slashes');

// ============================================================================
// Format 1.x: Chain Management Schemas
// ============================================================================

/**
 * Format 1.1: Chain Compilation
 */
export const ChainStepParsedSchema = z.object({
  stepNumber: StepNumberSchema,
  action: z.string(),
  model: ModelStringSchema,
  keyInputs: z.string().nullable(),
  waitsFor: z.string().nullable(),
  status: StatusStringSchema,
});

export const StepDescriptionSchema = z.object({
  number: StepNumberSchema,
  action: z.string(),
  description: z.string(),
});

export const ChainCompilationSchema = BaseParsedSchema.extend({
  title: z.string().nullable(),
  request: z.string().nullable(),
  source: z.string().nullable(),
  steps: z.array(ChainStepParsedSchema).nullable(),
  executionMode: z.string().nullable(),
  stepDescriptions: z.array(StepDescriptionSchema).nullable(),
});

export type ChainCompilationValidated = z.infer<typeof ChainCompilationSchema>;

/**
 * Format 1.2: Chain Execution Start
 */
export const ChainExecutionStartSchema = BaseParsedSchema.extend({
  title: z.string().nullable(),
  stepNumber: StepNumberSchema.nullable(),
  action: z.string().nullable(),
  model: ModelStringSchema.nullable(),
  timestamp: z.number().nullable(),
});

export type ChainExecutionStartValidated = z.infer<typeof ChainExecutionStartSchema>;

/**
 * Format 1.3: Chain Status Update
 */
export const ChainStatusUpdateSchema = BaseParsedSchema.extend({
  title: z.string().nullable(),
  changes: z.string().nullable(),
  steps: z.array(ChainStepParsedSchema).nullable(),
});

export type ChainStatusUpdateValidated = z.infer<typeof ChainStatusUpdateSchema>;

/**
 * Format 1.4: Execution Complete
 */
export const ExecutionCompleteSchema = BaseParsedSchema.extend({
  title: z.string().nullable(),
  logsPath: z.string().nullable(),
  learnings: z.string().nullable(),
  totalSteps: z.number().int().positive().nullable(),
  completedSteps: z.number().int().min(0).nullable(),
  failedSteps: z.number().int().min(0).nullable(),
  steps: z.array(z.object({
    stepNumber: StepNumberSchema,
    action: z.string(),
    status: StatusStringSchema,
  })).nullable(),
});

export type ExecutionCompleteValidated = z.infer<typeof ExecutionCompleteSchema>;

// ============================================================================
// Format 2.x: Step Lifecycle Schemas
// ============================================================================

/**
 * Format 2.1: Step Completion
 */
export const StepCompletionSchema = BaseParsedSchema.extend({
  stepNumber: StepNumberSchema.nullable(),
  action: z.string().nullable(),
  result: z.string().nullable(),
  nextStep: z.string().nullable(),
});

export type StepCompletionValidated = z.infer<typeof StepCompletionSchema>;

/**
 * Format 2.2: Dual Output
 */
export const DualOutputSchema = BaseParsedSchema.extend({
  stepNumber: StepNumberSchema.nullable(),
  originalResult: z.string().nullable(),
  secondOpinionModel: ModelStringSchema.nullable(),
  secondOpinionResult: z.string().nullable(),
  comparison: z.string().nullable(),
});

export type DualOutputValidated = z.infer<typeof DualOutputSchema>;

/**
 * Format 2.3: Second Opinion Skip
 */
export const SecondOpinionSkipSchema = BaseParsedSchema.extend({
  stepNumber: StepNumberSchema.nullable(),
  skipReason: z.string().nullable(),
  originalResult: z.string().nullable(),
});

export type SecondOpinionSkipValidated = z.infer<typeof SecondOpinionSkipSchema>;

// ============================================================================
// Format 3.x: Human Interaction Schemas
// ============================================================================

/**
 * Format 3.1: Human Gate
 */
export const HumanGateSchema = BaseParsedSchema.extend({
  stepNumber: StepNumberSchema.nullable(),
  prompt: z.string().nullable(),
  context: z.string().nullable(),
  options: z.array(z.string()).nullable(),
});

export type HumanGateValidated = z.infer<typeof HumanGateSchema>;

/**
 * Format 3.2: Learning Surface
 */
export const LearningSurfaceSchema = BaseParsedSchema.extend({
  fromAction: z.string().nullable(),
  issue: z.string().nullable(),
  rootCause: z.string().nullable(),
  suggestedFix: z.string().nullable(),
  severity: SeveritySchema.nullable(),
});

export type LearningSurfaceValidated = z.infer<typeof LearningSurfaceSchema>;

/**
 * Format 3.3: Session Start Protocol
 */
export const SessionStartProtocolSchema = BaseParsedSchema.extend({
  projectName: z.string().nullable(),
  flowCount: z.number().int().min(0).nullable(),
  activeFlows: z.array(z.string()).nullable(),
  timestamp: z.number().nullable(),
});

export type SessionStartProtocolValidated = z.infer<typeof SessionStartProtocolSchema>;

// ============================================================================
// Format 4.x: Registry & Metadata Schemas
// ============================================================================

/**
 * Format 4.1: Registry Update
 */
export const RegistryUpdateSchema = BaseParsedSchema.extend({
  title: z.string().nullable(),
  file: z.string().nullable(),
  action: z.enum(['added', 'removed', 'modified']).nullable(),
  line: z.number().int().positive().nullable(),
  content: z.string().nullable(),
});

export type RegistryUpdateValidated = z.infer<typeof RegistryUpdateSchema>;

/**
 * Format 4.2: Index Entry
 */
export const IndexEntrySchema = BaseParsedSchema.extend({
  date: DateSchema.nullable(),
  pattern: z.string().nullable(),
  status: z.string().nullable(),
  commitHash: CommitHashSchema.nullable(),
});

export type IndexEntryValidated = z.infer<typeof IndexEntrySchema>;

/**
 * Format 4.3: Learning Entry
 */
export const LearningEntrySchema = BaseParsedSchema.extend({
  actionType: z.string().nullable(),
  issueTitle: z.string().nullable(),
  rootCause: z.string().nullable(),
  solution: z.string().nullable(),
  suggestedImprovement: z.string().nullable(),
});

export type LearningEntryValidated = z.infer<typeof LearningEntrySchema>;

// ============================================================================
// Format 5.x: Action Output Schemas
// ============================================================================

/**
 * Format 5.1: Review Report
 */
export const ReviewFindingSchema = z.object({
  number: z.number().int().positive(),
  file: z.string(),
  line: LineNumberSchema.nullable(),
  severity: SeveritySchema.nullable(),
  description: z.string(),
  suggestion: z.string(),
});

export const ReviewFixSchema = z.object({
  file: z.string(),
  fix: z.string(),
});

export const ReviewFlagSchema = z.object({
  issue: z.string(),
  reason: z.string(),
});

export const ReviewReportSchema = BaseParsedSchema.extend({
  scope: z.string().nullable(),
  verdict: VerdictSchema.nullable(),
  score: ScoreSchema.nullable(),
  summary: z.string().nullable(),
  findings: z.array(ReviewFindingSchema).nullable(),
  fixesApplied: z.array(ReviewFixSchema).nullable(),
  flagsForHuman: z.array(ReviewFlagSchema).nullable(),
});

export type ReviewReportValidated = z.infer<typeof ReviewReportSchema>;

/**
 * Format 5.2: Analysis Report
 */
export const AnalysisSectionSchema = z.object({
  number: z.number().int().positive(),
  title: z.string(),
  content: z.string(),
});

export const AnalysisReportSchema = BaseParsedSchema.extend({
  title: z.string().nullable(),
  aspect: z.string().nullable(), // Accept any string, not just enum
  scope: z.string().nullable(),
  date: DateSchema.nullable(),
  agent: z.string().nullable(),
  sections: z.array(AnalysisSectionSchema).nullable(),
  recommendations: z.array(z.string()).nullable(),
});

export type AnalysisReportValidated = z.infer<typeof AnalysisReportSchema>;

/**
 * Format 5.3: Brainstorm Transcript
 */
export const BrainstormQuestionSchema = z.object({
  number: z.number().int().positive(),
  question: z.string(),
  response: z.string(),
});

export const BrainstormTranscriptSchema = BaseParsedSchema.extend({
  idea: z.string().nullable(),
  classification: ClassificationSchema.nullable(),
  date: DateSchema.nullable(),
  initialContext: z.string().nullable(),
  questions: z.array(BrainstormQuestionSchema).nullable(),
  keyInsights: z.array(z.string()).nullable(),
  potentialIssues: z.array(z.string()).nullable(),
  suggestedNextSteps: z.array(z.string()).nullable(),
  openQuestions: z.array(z.string()).nullable(),
  duration: z.string().nullable(),
  depth: z.string().nullable(),
  consensus: z.string().nullable(),
});

export type BrainstormTranscriptValidated = z.infer<typeof BrainstormTranscriptSchema>;

// ============================================================================
// Format 6.x: Error & Status Schemas
// ============================================================================

/**
 * Format 6.1: Error Announcement
 */
export const ErrorAnnouncementSchema = BaseParsedSchema.extend({
  title: z.string().nullable(),
  stepNumber: StepNumberSchema.nullable(),
  action: ActionPathSchema.nullable(),
  message: z.string().nullable(),
  context: z.string().nullable(),
  stackTrace: z.string().nullable(),
  recoveryOptions: z.array(z.string()).nullable(),
});

export type ErrorAnnouncementValidated = z.infer<typeof ErrorAnnouncementSchema>;

/**
 * Format 6.2: Context Routing
 */
export const ContextRoutingSchema = BaseParsedSchema.extend({
  request: z.string().nullable(),
  context: ContextEnumSchema.nullable(),
  confidence: ConfidenceSchema.nullable(),
  flow: z.string().nullable(),
  actions: z.array(z.string()).nullable(),
  disambiguated: z.boolean().default(false),
});

export type ContextRoutingValidated = z.infer<typeof ContextRoutingSchema>;

// ============================================================================
// Validation Utility Functions
// ============================================================================

/**
 * Validate a parsed format against its schema
 * Returns success/failure tuple with errors if validation fails
 */
export function validateParsedFormat<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

/**
 * Validate with logging for development/debugging
 */
export function validateWithLogging<T>(
  schemaName: string,
  schema: z.ZodSchema<T>,
  data: unknown,
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = validateParsedFormat(schema, data);
  if (!result.success) {
    console.warn(`[Validation] ${schemaName} validation failed:`, result.error.issues);
  }
  return result;
}

/**
 * Collect all validation errors from multiple schemas
 * Useful for batch validation
 */
export function collectValidationErrors(
  validations: Array<{ success: false; error: z.ZodError } | { success: true; data: any }>,
): z.ZodError[] {
  return validations
    .filter((v): v is { success: false; error: z.ZodError } => !v.success)
    .map(v => v.error);
}
