/**
 * Regex patterns for detecting registry formats
 * Used by harmony detection and message routing
 */

/**
 * Format 4.1: Registry Update
 */
export const RegistryUpdatePatterns = {
  heading: /^## Registry Update: (.+)$/m,
  file: /^\*\*File:\*\* (.+)$/m,
  line: /^\*\*Line:\*\* (added|removed|updated): "(.+)"$/m,
  done: /^Done\.$/m,
} as const;

/**
 * Format 4.2: INDEX.md Entry
 */
export const IndexEntryPatterns = {
  tableRow: /^\| (\d{4}-\d{2}-\d{2}) \| (.+) \| (.+) \| (Success|Failed) — (.+) \(([a-f0-9]{7,40})\) \|$/m,
} as const;

/**
 * Format 4.3: LEARNINGS.md Entry
 */
export const LearningEntryPatterns = {
  actionTypeHeading: /^### ([A-Z][a-z]+)$/m,
  issueTitleHeading: /^#### (.+)$/m,
  context: /^\*\*Context:\*\* (.+)$/m,
  problem: /^\*\*Problem:\*\* (.+)$/m,
  rootCause: /^\*\*Root Cause:\*\* (.+)$/m,
  solution: /^\*\*Solution:\*\* (.+)$/m,
  date: /^\*\*Date:\*\* (\d{4}-\d{2}-\d{2})$/m,
  source: /^\*\*Source:\*\* ([a-z\-_/]+) in (.+)$/m,
} as const;

export const RegistryPatterns = {
  registryUpdate: RegistryUpdatePatterns,
  indexEntry: IndexEntryPatterns,
  learningEntry: LearningEntryPatterns,
} as const;
