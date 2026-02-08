/**
 * Parser Exports Index
 * Re-exports all parsers and provides master parseOrchestratorOutput function
 */

// Chain parsers
export {
  parseChainCompilation,
  parseChainExecutionStart,
  parseChainStatusUpdate,
  parseExecutionComplete,
} from './chainParser.js';

// Step parsers
export {
  parseStepCompletion,
  parseDualOutput,
  parseSecondOpinionSkip,
} from './stepParser.js';

// Human interaction parsers
export {
  parseHumanGate,
  parseLearningSurface,
  parseSessionStartProtocol,
} from './humanParser.js';

// Registry parsers
export {
  parseRegistryUpdate,
  parseIndexEntry,
  parseLearningEntry,
} from './registryParser.js';

// Action output parsers
export {
  parseReviewReport,
  parseAnalysisReport,
  parseBrainstormTranscript,
} from './actionParser.js';

// Status and error parsers
export {
  parseErrorAnnouncement,
  parseDepartmentRouting,
} from './statusParser.js';

// Import all parsers for master function
import { parseChainCompilation, parseChainExecutionStart, parseChainStatusUpdate, parseExecutionComplete } from './chainParser.js';
import { parseStepCompletion, parseDualOutput, parseSecondOpinionSkip } from './stepParser.js';
import { parseHumanGate, parseLearningSurface, parseSessionStartProtocol } from './humanParser.js';
import { parseRegistryUpdate, parseIndexEntry, parseLearningEntry } from './registryParser.js';
import { parseReviewReport, parseAnalysisReport, parseBrainstormTranscript } from './actionParser.js';
import { parseErrorAnnouncement, parseDepartmentRouting } from './statusParser.js';

/**
 * Union type of all parsed formats
 */
export type ParsedFormat =
  | ReturnType<typeof parseChainCompilation>
  | ReturnType<typeof parseChainExecutionStart>
  | ReturnType<typeof parseChainStatusUpdate>
  | ReturnType<typeof parseExecutionComplete>
  | ReturnType<typeof parseStepCompletion>
  | ReturnType<typeof parseDualOutput>
  | ReturnType<typeof parseSecondOpinionSkip>
  | ReturnType<typeof parseHumanGate>
  | ReturnType<typeof parseLearningSurface>
  | ReturnType<typeof parseSessionStartProtocol>
  | ReturnType<typeof parseRegistryUpdate>
  | ReturnType<typeof parseIndexEntry>
  | ReturnType<typeof parseLearningEntry>
  | ReturnType<typeof parseReviewReport>
  | ReturnType<typeof parseAnalysisReport>
  | ReturnType<typeof parseBrainstormTranscript>
  | ReturnType<typeof parseErrorAnnouncement>
  | ReturnType<typeof parseDepartmentRouting>;

/**
 * Master parser function
 * Tries all parsers in priority order and returns first match
 *
 * Priority order (P0-P5 from plan):
 * - P0: Chain Compilation, Step Completion
 * - P1: Review Report, Error Announcement
 * - P2: Dual Output, Registry Update, Learning Surface
 * - P3: Index Entry, Chain Execution Start, Analysis Report
 * - P4: Session Start, Execution Complete, Second Opinion Skip, Learning Entry, Chain Status Update
 * - P5: Brainstorm Transcript, Human Gate, Department Routing
 *
 * @param text - Raw orchestrator output text
 * @returns Parsed format object, or null if no parser matched
 */
export function parseOrchestratorOutput(text: string): ParsedFormat {
  // P0: Most common formats (chain compilation, step completion)
  const chainCompilation = parseChainCompilation(text);
  if (chainCompilation) return chainCompilation;

  const stepCompletion = parseStepCompletion(text);
  if (stepCompletion) return stepCompletion;

  // P1: High-value formats (review report, errors)
  const reviewReport = parseReviewReport(text);
  if (reviewReport) return reviewReport;

  const errorAnnouncement = parseErrorAnnouncement(text);
  if (errorAnnouncement) return errorAnnouncement;

  // P2: Second opinion and registry updates
  const dualOutput = parseDualOutput(text);
  if (dualOutput) return dualOutput;

  const registryUpdate = parseRegistryUpdate(text);
  if (registryUpdate) return registryUpdate;

  const learningSurface = parseLearningSurface(text);
  if (learningSurface) return learningSurface;

  // P3: Index entries, chain status, analysis
  const indexEntry = parseIndexEntry(text);
  if (indexEntry) return indexEntry;

  const chainExecutionStart = parseChainExecutionStart(text);
  if (chainExecutionStart) return chainExecutionStart;

  const analysisReport = parseAnalysisReport(text);
  if (analysisReport) return analysisReport;

  // P4: Session metadata, completion, learnings
  const sessionStart = parseSessionStartProtocol(text);
  if (sessionStart) return sessionStart;

  const executionComplete = parseExecutionComplete(text);
  if (executionComplete) return executionComplete;

  const secondOpinionSkip = parseSecondOpinionSkip(text);
  if (secondOpinionSkip) return secondOpinionSkip;

  const learningEntry = parseLearningEntry(text);
  if (learningEntry) return learningEntry;

  const chainStatusUpdate = parseChainStatusUpdate(text);
  if (chainStatusUpdate) return chainStatusUpdate;

  // P5: Low-priority or rare formats
  const brainstormTranscript = parseBrainstormTranscript(text);
  if (brainstormTranscript) return brainstormTranscript;

  const humanGate = parseHumanGate(text);
  if (humanGate) return humanGate;

  const departmentRouting = parseDepartmentRouting(text);
  if (departmentRouting) return departmentRouting;

  // No format matched
  return null;
}
