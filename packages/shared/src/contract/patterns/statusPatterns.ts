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
 * Format 6.2: Department Routing Announcement
 */
export const DepartmentRoutingPatterns = {
  heading: /^## Routing: (.+)$/m,
  department: /^\*\*Department:\*\* (Framework|Engineering|QA|Human)$/m,
  flow: /^\*\*Flow:\*\* (.+)$/m,
  actions: /^\*\*Actions:\*\* (.+)$/m,
  explanation: /^(.+)$/m,
} as const;

export const StatusPatterns = {
  errorAnnouncement: ErrorAnnouncementPatterns,
  departmentRouting: DepartmentRoutingPatterns,
} as const;
