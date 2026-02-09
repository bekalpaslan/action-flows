/**
 * Regex patterns for detecting human interaction formats
 * Used by harmony detection and message routing
 */

/**
 * Format 3.1: Human Gate Presentation
 */
export const HumanGatePatterns = {
  heading: /^### Step (\d+): HUMAN GATE$/m,
  content: /^(.+)$/m,
  prompt: /^(.+)\?$/m,
} as const;

/**
 * Format 3.2: Learning Surface Presentation
 */
export const LearningSurfacePatterns = {
  heading: /^## Agent Learning$/m,
  from: /^\*\*From:\*\* ([a-z\-_/]+) \((haiku|sonnet|opus)\)$/m,
  issue: /^\*\*Issue:\*\* "(.+)"$/m,
  rootCause: /^\*\*Root cause:\*\* "(.+)"$/m,
  suggestedFix: /^\*\*Suggested fix:\*\* (.+)$/m,
  prompt: /^Implement\?$/m,
} as const;

/**
 * Format 3.3: Session-Start Protocol Acknowledgment
 */
export const SessionStartProtocolPatterns = {
  heading: /^## Session Started$/m,
  configLabel: /^Loaded configuration:$/m,
  project: /^- Project: (.+)$/m,
  flows: /^- Flows: (\d+)$/m,
  actions: /^- Actions: (\d+)$/m,
  pastExecutions: /^- Past executions: (\d+)$/m,
  ready: /^Ready to route requests\.$/m,
} as const;

export const HumanPatterns = {
  humanGate: HumanGatePatterns,
  learningSurface: LearningSurfacePatterns,
  sessionStartProtocol: SessionStartProtocolPatterns,
} as const;
