/**
 * Terminal Buffer Service
 * Manages terminal output buffers per session with configurable limits
 */

import type { SessionId, StepNumber, TerminalOutputEvent } from '@afw/shared';

interface TerminalLine {
  output: string;
  stream: 'stdout' | 'stderr';
  timestamp: string;
  stepNumber?: StepNumber;
  action?: string;
}

class TerminalBufferService {
  // Buffer limit per session (50,000 lines as per spec)
  private readonly MAX_LINES = 50000;

  // In-memory buffers: sessionId -> TerminalLine[]
  private buffers: Map<SessionId, TerminalLine[]> = new Map();

  /**
   * Append output to session's terminal buffer
   */
  append(
    sessionId: SessionId,
    output: string,
    stream: 'stdout' | 'stderr',
    stepNumber?: StepNumber,
    action?: string
  ): void {
    if (!this.buffers.has(sessionId)) {
      this.buffers.set(sessionId, []);
    }

    const buffer = this.buffers.get(sessionId)!;
    const line: TerminalLine = {
      output,
      stream,
      timestamp: new Date().toISOString(),
      stepNumber,
      action,
    };

    buffer.push(line);

    // Enforce buffer limit - truncate oldest lines
    if (buffer.length > this.MAX_LINES) {
      const excess = buffer.length - this.MAX_LINES;
      buffer.splice(0, excess);
      console.log(`[Terminal] Truncated ${excess} lines from session ${sessionId} buffer`);
    }
  }

  /**
   * Get buffer for a session
   */
  getBuffer(sessionId: SessionId): TerminalLine[] {
    return this.buffers.get(sessionId) || [];
  }

  /**
   * Get buffer with limit (for late-joining clients)
   */
  getRecentBuffer(sessionId: SessionId, limit: number = 1000): TerminalLine[] {
    const buffer = this.buffers.get(sessionId) || [];
    return buffer.slice(-limit);
  }

  /**
   * Clear buffer for a session
   */
  clear(sessionId: SessionId): void {
    this.buffers.delete(sessionId);
    console.log(`[Terminal] Cleared buffer for session ${sessionId}`);
  }

  /**
   * Get buffer size for a session
   */
  getBufferSize(sessionId: SessionId): number {
    return this.buffers.get(sessionId)?.length || 0;
  }

  /**
   * Check if buffer is near limit
   */
  isNearLimit(sessionId: SessionId, threshold: number = 0.9): boolean {
    const size = this.getBufferSize(sessionId);
    return size >= this.MAX_LINES * threshold;
  }
}

// Singleton instance
export const terminalBuffer = new TerminalBufferService();
