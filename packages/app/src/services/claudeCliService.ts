/**
 * Claude CLI Service
 * Frontend API client for Claude Code CLI session management
 */

import type { SessionId, ClaudeCliSession } from '@afw/shared';

/**
 * Claude CLI Service
 * Provides API methods for controlling Claude CLI sessions
 */
export class ClaudeCliService {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:3001') {
    this.baseUrl = baseUrl;
  }

  /**
   * Start a new Claude CLI session
   */
  async startSession(
    sessionId: SessionId,
    cwd: string,
    prompt?: string,
    flags?: string[]
  ): Promise<ClaudeCliSession> {
    const response = await fetch(`${this.baseUrl}/api/claude-cli/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId,
        cwd,
        prompt,
        flags,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `Failed to start Claude CLI session: ${response.statusText}`);
    }

    const data = await response.json();
    return data.session;
  }

  /**
   * Send input to Claude CLI session
   */
  async sendInput(sessionId: SessionId, input: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/claude-cli/${sessionId}/input`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ input }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `Failed to send input: ${response.statusText}`);
    }
  }

  /**
   * Stop a Claude CLI session
   */
  async stopSession(sessionId: SessionId, signal?: 'SIGTERM' | 'SIGINT' | 'SIGKILL'): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/claude-cli/${sessionId}/stop`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ signal }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `Failed to stop session: ${response.statusText}`);
    }
  }

  /**
   * Get Claude CLI session status
   */
  async getSessionStatus(sessionId: SessionId): Promise<{
    session: ClaudeCliSession;
    uptime: number;
    isRunning: boolean;
  }> {
    const response = await fetch(`${this.baseUrl}/api/claude-cli/${sessionId}/status`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `Failed to get session status: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * List all active Claude CLI sessions
   */
  async listSessions(): Promise<ClaudeCliSession[]> {
    const response = await fetch(`${this.baseUrl}/api/claude-cli/sessions`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `Failed to list sessions: ${response.statusText}`);
    }

    const data = await response.json();
    return data.sessions;
  }
}

// Singleton instance
export const claudeCliService = new ClaudeCliService();
