/**
 * Orchestrator Output Contract
 * Complete contract specification for all orchestrator output formats
 *
 * This package provides:
 * - TypeScript interfaces for all 17 formats (types/)
 * - Regex patterns for format detection (patterns/)
 * - Parser implementations (parsers/)
 * - Type guard functions (guards.ts)
 * - Contract version system (version.ts)
 */

// ============================================================================
// Version System
// ============================================================================
export { CONTRACT_VERSION, CONTRACT_VERSIONS, isSupportedVersion, getLatestVersion } from './version.js';

// ============================================================================
// Type Definitions
// ============================================================================
export type {
  // Chain Management Formats (1.x)
  ChainCompilationParsed,
  ChainStepParsed,
  StepDescription,
  ChainExecutionStartParsed,
  ChainStatusUpdateParsed,
  ExecutionCompleteParsed,
  CompletedStepSummary,

  // Step Lifecycle Formats (2.x)
  StepCompletionParsed,
  DualOutputParsed,
  SecondOpinionSkipParsed,

  // Human Interaction Formats (3.x)
  HumanGateParsed,
  LearningSurfaceParsed,
  SessionStartProtocolParsed,

  // Registry & Metadata Formats (4.x)
  RegistryUpdateParsed,
  IndexEntryParsed,
  LearningEntryParsed,

  // Action Output Formats (5.x)
  ReviewReportParsed,
  ReviewFinding,
  ReviewFix,
  ReviewFlag,
  AnalysisReportParsed,
  AnalysisSection,
  BrainstormTranscriptParsed,
  BrainstormQuestion,

  // Error & Status Formats (6.x)
  ErrorAnnouncementParsed,
  ContextRoutingParsed,
} from './types/index.js';

// ============================================================================
// Pattern Library
// ============================================================================
export { ChainPatterns } from './patterns/chainPatterns.js';
export { StepPatterns } from './patterns/stepPatterns.js';
export { HumanPatterns } from './patterns/humanPatterns.js';
export { RegistryPatterns } from './patterns/registryPatterns.js';
export { ActionPatterns } from './patterns/actionPatterns.js';
export { StatusPatterns } from './patterns/statusPatterns.js';

// ============================================================================
// Parser Functions
// ============================================================================
export {
  // Master parser
  parseOrchestratorOutput,
  type ParsedFormat,

  // Chain parsers (1.x)
  parseChainCompilation,
  parseChainExecutionStart,
  parseChainStatusUpdate,
  parseExecutionComplete,

  // Step parsers (2.x)
  parseStepCompletion,
  parseDualOutput,
  parseSecondOpinionSkip,

  // Human interaction parsers (3.x)
  parseHumanGate,
  parseLearningSurface,
  parseSessionStartProtocol,

  // Registry parsers (4.x)
  parseRegistryUpdate,
  parseIndexEntry,
  parseLearningEntry,

  // Action output parsers (5.x)
  parseReviewReport,
  parseAnalysisReport,
  parseBrainstormTranscript,

  // Status and error parsers (6.x)
  parseErrorAnnouncement,
  parseContextRouting,
} from './parsers/index.js';

// ============================================================================
// Type Guards
// ============================================================================
export {
  // Generic guard
  isParsedFormat,

  // Chain format guards
  isChainCompilationParsed,
  isChainExecutionStartParsed,
  isChainStatusUpdateParsed,
  isExecutionCompleteParsed,

  // Step format guards
  isStepCompletionParsed,
  isDualOutputParsed,
  isSecondOpinionSkipParsed,

  // Human interaction guards
  isHumanGateParsed,
  isLearningSurfaceParsed,
  isSessionStartProtocolParsed,

  // Registry guards
  isRegistryUpdateParsed,
  isIndexEntryParsed,
  isLearningEntryParsed,

  // Action output guards
  isReviewReportParsed,
  isAnalysisReportParsed,
  isBrainstormTranscriptParsed,

  // Status and error guards
  isErrorAnnouncementParsed,
  isContextRoutingParsed,
} from './guards.js';
