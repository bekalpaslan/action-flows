/**
 * Regex patterns for detecting status and error formats
 * Used by harmony detection and message routing
 */

/**
 * Format 6.1: Error Announcement
 */
export const ErrorAnnouncementPatterns = {
  heading: /^## Error: (.+)$/m,
  step: /^\*\*Step:\*\* (\d+) — ([a-z\-_/]+)$/m,
  message: /^\*\*Message:\*\* (.+)$/m,
  context: /^\*\*Context:\*\* (.+)$/m,
  stackTrace: /^Stack trace:$/m,
  recoveryOptionsLabel: /^\*\*Recovery options:\*\*$/m,
  recoveryOption: /^- (Retry|Skip|Cancel) (.+)$/m,
} as const;

/**
 * Format 6.2: Context Routing Announcement
 */
export const ContextRoutingPatterns = {
  heading: /^## Routing: (.+)$/m,
  context: /^\*\*Context:\*\* (work|maintenance|explore|review|settings|pm|archive|harmony|editor)$/mi,
  confidence: /^\*\*Confidence:\*\* ([\d.]+)$/m,
  flow: /^\*\*Flow:\*\* (.+)$/m,
  actions: /^\*\*Actions:\*\* (.+)$/m,
  disambiguated: /^\*\*Disambiguated:\*\* (true|false)$/mi,
} as const;

export const StatusPatterns = {
  errorAnnouncement: ErrorAnnouncementPatterns,
  contextRouting: ContextRoutingPatterns,
} as const;
