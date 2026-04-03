/**
 * Violation Reporter
 *
 * Fire-and-forget POST of design system violation events to the backend API.
 * Used by both PreToolUse and PostToolUse hooks to track violations.
 *
 * All errors are caught silently -- violation reporting must never
 * interfere with hook execution or agent workflow.
 */

const BACKEND_URL = process.env.AFW_BACKEND_URL || 'http://localhost:3001';

/**
 * Reports a design system violation to the backend.
 * Fire-and-forget: does not await response, catches all errors silently.
 *
 * @param filePath - The file path where the violation was detected
 * @param violations - Array of violation message strings
 * @param sessionId - The Claude session ID
 * @param severity - Violation severity level (default: 'error')
 */
export function reportViolation(
  filePath: string,
  violations: string[],
  sessionId: string,
  severity: 'error' | 'warning' = 'error',
): void {
  const url = `${BACKEND_URL.replace(/\/$/, '')}/api/validation/violations`;

  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filePath,
      violations,
      sessionId,
      severity,
      timestamp: new Date().toISOString(),
    }),
    signal: AbortSignal.timeout(3000),
  }).catch((error) => {
    // Silent failure -- log at debug level only
    if (process.env.DEBUG) {
      console.error(`[ViolationReporter] Failed to report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });
}
