/**
 * Export Helper Utilities
 * Provides reusable export functions for session data, logs, and chain timelines
 * Uses Blob + anchor download pattern from TerminalPanel.tsx
 */

import type { Session, Chain, SessionId } from '@afw/shared';

/**
 * Download helper using Blob + anchor pattern
 * Creates a temporary anchor element and triggers download
 */
function downloadFile(content: string, filename: string, mimeType: string): void {
  try {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading file:', error);
    throw new Error(`Failed to download ${filename}`);
  }
}

/**
 * Generate timestamp-based filename suffix
 */
function getTimestampSuffix(): string {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
}

/**
 * Export session as JSON file
 * Downloads complete session object including all chains and metadata
 *
 * @param session - Session object to export
 */
export function exportSessionAsJSON(session: Session): void {
  if (!session || !session.id) {
    throw new Error('Invalid session: session and session.id are required');
  }

  const sessionId = session.id.slice(0, 8);
  const timestamp = getTimestampSuffix();
  const filename = `session-${sessionId}-${timestamp}.json`;

  const content = JSON.stringify(session, null, 2);
  downloadFile(content, filename, 'application/json');
}

/**
 * Export session logs as text file
 * Downloads terminal output logs for a session
 *
 * @param sessionId - Session identifier
 * @param logs - Terminal log content as string
 */
export function exportSessionLogs(sessionId: SessionId, logs: string): void {
  if (!sessionId) {
    throw new Error('Invalid sessionId: sessionId is required');
  }

  if (!logs || typeof logs !== 'string') {
    throw new Error('Invalid logs: logs must be a non-empty string');
  }

  const sessionIdShort = sessionId.slice(0, 8);
  const timestamp = getTimestampSuffix();
  const filename = `session-logs-${sessionIdShort}-${timestamp}.log`;

  downloadFile(logs, filename, 'text/plain');
}

/**
 * Export chain timeline as JSON file
 * Downloads chain execution timeline data including steps, status, and duration
 *
 * @param chains - Array of chains to export
 * @param sessionId - Optional session identifier for filename
 */
export function exportChainTimeline(chains: Chain[], sessionId?: SessionId): void {
  if (!Array.isArray(chains)) {
    throw new Error('Invalid chains: chains must be an array');
  }

  if (chains.length === 0) {
    throw new Error('No chains to export');
  }

  // Build timeline data structure
  const timeline = chains.map((chain) => ({
    id: chain.id,
    title: chain.title,
    status: chain.status,
    source: chain.source,
    ref: chain.ref,
    compiledAt: chain.compiledAt,
    startedAt: chain.startedAt,
    completedAt: chain.completedAt,
    duration: chain.duration,
    executionMode: chain.executionMode,
    steps: chain.steps.map((step) => ({
      stepNumber: step.stepNumber,
      action: step.action,
      model: step.model,
      status: step.status,
      description: step.description,
      startedAt: step.startedAt,
      completedAt: step.completedAt,
      duration: step.duration,
      error: step.error,
      learning: step.learning,
    })),
    successfulSteps: chain.successfulSteps,
    failedSteps: chain.failedSteps,
    skippedSteps: chain.skippedSteps,
    summary: chain.summary,
  }));

  const sessionIdPart = sessionId ? sessionId.slice(0, 8) : 'unknown';
  const timestamp = getTimestampSuffix();
  const filename = `chain-timeline-${sessionIdPart}-${timestamp}.json`;

  const content = JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      sessionId: sessionId || null,
      totalChains: chains.length,
      timeline,
    },
    null,
    2
  );

  downloadFile(content, filename, 'application/json');
}
