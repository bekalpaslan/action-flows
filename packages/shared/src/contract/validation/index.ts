/**
 * Contract Validation Module
 * Exports all validation schemas and utilities
 */

export {
  // Base schemas
  BaseParsedSchema,
  ModelStringSchema,
  StatusStringSchema,
  VerdictSchema,
  SeveritySchema,
  ContextEnumSchema,
  ClassificationSchema,

  // Range validators
  ScoreSchema,
  ConfidenceSchema,
  StepNumberSchema,
  LineNumberSchema,

  // Format validators
  DateSchema,
  CommitHashSchema,
  ActionPathSchema,

  // Format 1.x schemas
  ChainStepParsedSchema,
  StepDescriptionSchema,
  ChainCompilationSchema,
  ChainExecutionStartSchema,
  ChainStatusChangeSchema,
  ChainStatusUpdateSchema,
  ExecutionCompleteSchema,

  // Format 2.x schemas
  StepCompletionSchema,
  DualOutputSchema,
  SecondOpinionSkipSchema,

  // Format 3.x schemas
  HumanGateSchema,
  LearningSurfaceSchema,
  SessionStartProtocolSchema,

  // Format 4.x schemas
  RegistryUpdateSchema,
  IndexEntrySchema,
  LearningEntrySchema,

  // Format 5.x schemas
  ReviewFindingSchema,
  ReviewFixSchema,
  ReviewFlagSchema,
  ReviewReportSchema,
  AnalysisSectionSchema,
  AnalysisReportSchema,
  BrainstormQuestionSchema,
  BrainstormTranscriptSchema,

  // Format 6.x schemas
  ErrorAnnouncementSchema,
  ContextRoutingSchema,

  // Validation utilities
  validateParsedFormat,
  validateWithLogging,
  collectValidationErrors,
} from './schemas.js';

export type {
  // Format 1.x types
  ChainCompilationValidated,
  ChainExecutionStartValidated,
  ChainStatusUpdateValidated,
  ExecutionCompleteValidated,

  // Format 2.x types
  StepCompletionValidated,
  DualOutputValidated,
  SecondOpinionSkipValidated,

  // Format 3.x types
  HumanGateValidated,
  LearningSurfaceValidated,
  SessionStartProtocolValidated,

  // Format 4.x types
  RegistryUpdateValidated,
  IndexEntryValidated,
  LearningEntryValidated,

  // Format 5.x types
  ReviewReportValidated,
  AnalysisReportValidated,
  BrainstormTranscriptValidated,

  // Format 6.x types
  ErrorAnnouncementValidated,
  ContextRoutingValidated,

  // Enums
  ModelString,
  StatusString,
  Verdict,
  Severity,
  ContextEnum,
  Classification,
} from './schemas.js';
