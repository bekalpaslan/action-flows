/**
 * Type Guard Functions
 * Runtime type narrowing for all parsed formats
 */

import type {
  ChainCompilationParsed,
  ChainExecutionStartParsed,
  ChainStatusUpdateParsed,
  ExecutionCompleteParsed,
} from './types/chainFormats.js';
import type {
  StepCompletionParsed,
  DualOutputParsed,
  SecondOpinionSkipParsed,
} from './types/stepFormats.js';
import type {
  HumanGateParsed,
  LearningSurfaceParsed,
  SessionStartProtocolParsed,
} from './types/humanFormats.js';
import type {
  RegistryUpdateParsed,
  IndexEntryParsed,
  LearningEntryParsed,
} from './types/registryFormats.js';
import type {
  ReviewReportParsed,
  AnalysisReportParsed,
  BrainstormTranscriptParsed,
} from './types/actionFormats.js';
import type {
  ErrorAnnouncementParsed,
  ContextRoutingParsed,
} from './types/statusFormats.js';

/**
 * Generic parser result guard
 * All parsed formats have raw and contractVersion fields
 */
export function isParsedFormat(obj: unknown): obj is { raw: string; contractVersion: string } {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'raw' in obj &&
    'contractVersion' in obj &&
    typeof (obj as any).raw === 'string' &&
    typeof (obj as any).contractVersion === 'string'
  );
}

/**
 * Chain format guards
 */

export function isChainCompilationParsed(obj: unknown): obj is ChainCompilationParsed {
  return (
    isParsedFormat(obj) &&
    ('title' in obj || 'steps' in obj)
  );
}

export function isChainExecutionStartParsed(obj: unknown): obj is ChainExecutionStartParsed {
  return (
    isParsedFormat(obj) &&
    'title' in obj &&
    'stepNumber' in obj
  );
}

export function isChainStatusUpdateParsed(obj: unknown): obj is ChainStatusUpdateParsed {
  return (
    isParsedFormat(obj) &&
    'title' in obj &&
    'changes' in obj
  );
}

export function isExecutionCompleteParsed(obj: unknown): obj is ExecutionCompleteParsed {
  return (
    isParsedFormat(obj) &&
    'title' in obj &&
    'logsPath' in obj
  );
}

/**
 * Step format guards
 */

export function isStepCompletionParsed(obj: unknown): obj is StepCompletionParsed {
  return (
    isParsedFormat(obj) &&
    'stepNumber' in obj &&
    'action' in obj &&
    'result' in obj &&
    'nextStep' in obj
  );
}

export function isDualOutputParsed(obj: unknown): obj is DualOutputParsed {
  return (
    isParsedFormat(obj) &&
    'stepNumber' in obj &&
    'originalResult' in obj &&
    'secondOpinionModel' in obj
  );
}

export function isSecondOpinionSkipParsed(obj: unknown): obj is SecondOpinionSkipParsed {
  return (
    isParsedFormat(obj) &&
    'stepNumber' in obj &&
    'skipReason' in obj
  );
}

/**
 * Human interaction format guards
 */

export function isHumanGateParsed(obj: unknown): obj is HumanGateParsed {
  return (
    isParsedFormat(obj) &&
    'stepNumber' in obj &&
    'prompt' in obj
  );
}

export function isLearningSurfaceParsed(obj: unknown): obj is LearningSurfaceParsed {
  return (
    isParsedFormat(obj) &&
    'fromAction' in obj &&
    'issue' in obj &&
    'suggestedFix' in obj
  );
}

export function isSessionStartProtocolParsed(obj: unknown): obj is SessionStartProtocolParsed {
  return (
    isParsedFormat(obj) &&
    'projectName' in obj &&
    'flowCount' in obj
  );
}

/**
 * Registry format guards
 */

export function isRegistryUpdateParsed(obj: unknown): obj is RegistryUpdateParsed {
  return (
    isParsedFormat(obj) &&
    'title' in obj &&
    'file' in obj &&
    'action' in obj &&
    'line' in obj
  );
}

export function isIndexEntryParsed(obj: unknown): obj is IndexEntryParsed {
  return (
    isParsedFormat(obj) &&
    'date' in obj &&
    'pattern' in obj &&
    'commitHash' in obj
  );
}

export function isLearningEntryParsed(obj: unknown): obj is LearningEntryParsed {
  return (
    isParsedFormat(obj) &&
    'actionType' in obj &&
    'issueTitle' in obj &&
    'solution' in obj
  );
}

/**
 * Action output format guards
 */

export function isReviewReportParsed(obj: unknown): obj is ReviewReportParsed {
  return (
    isParsedFormat(obj) &&
    'scope' in obj &&
    'verdict' in obj &&
    'score' in obj &&
    'findings' in obj
  );
}

export function isAnalysisReportParsed(obj: unknown): obj is AnalysisReportParsed {
  return (
    isParsedFormat(obj) &&
    'title' in obj &&
    'aspect' in obj &&
    'sections' in obj
  );
}

export function isBrainstormTranscriptParsed(obj: unknown): obj is BrainstormTranscriptParsed {
  return (
    isParsedFormat(obj) &&
    'idea' in obj &&
    'classification' in obj &&
    'questions' in obj
  );
}

/**
 * Status and error format guards
 */

export function isErrorAnnouncementParsed(obj: unknown): obj is ErrorAnnouncementParsed {
  return (
    isParsedFormat(obj) &&
    'title' in obj &&
    'message' in obj &&
    'recoveryOptions' in obj
  );
}

export function isContextRoutingParsed(obj: unknown): obj is ContextRoutingParsed {
  return (
    isParsedFormat(obj) &&
    'request' in obj &&
    'context' in obj &&
    'confidence' in obj &&
    'disambiguated' in obj
  );
}

