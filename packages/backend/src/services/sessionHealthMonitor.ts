/**
 * SessionHealthMonitor — heartbeat-based health detection (SESSION-04, D-09)
 * and resurrection from local conversation logs (SESSION-05, D-08).
 *
 * Polls all active sessions at HEARTBEAT_INTERVAL_MS. If a session has been
 * inactive longer than STALE_THRESHOLD_MS, verifies via Agent SDK. Dead
 * sessions trigger resurrection attempts (resume existing ID, then discover
 * from local session list).
 */
import { getSessionInfo, listSessions } from '@anthropic-ai/claude-agent-sdk';
import { backendSessionStore } from './sessionStore.js';
import type { SessionManager } from './sessionManager.js';
import type { ManagedSession } from './sessionStore.js';

/** Heartbeat interval — worst-case detection is 2x this value (< 30s per SESSION-04) */
const HEARTBEAT_INTERVAL_MS = 15_000;

/** Session considered stale if no activity for this duration */
const STALE_THRESHOLD_MS = 30_000;

export class SessionHealthMonitor {
  private manager: SessionManager;
  private projectDir: string;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private lastCheckTimes = new Map<string, string>();

  constructor(manager: SessionManager, projectDir: string) {
    this.manager = manager;
    this.projectDir = projectDir;
  }

  /** Start the periodic health check interval. */
  start(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }
    this.heartbeatTimer = setInterval(() => {
      this.checkAllSessions().catch((err) => {
        console.error('[SessionHealth] Unhandled error in health check loop:', err);
      });
    }, HEARTBEAT_INTERVAL_MS);
    console.log(`[SessionHealth] Health monitor started (${HEARTBEAT_INTERVAL_MS}ms interval)`);
  }

  /** Stop the periodic health check interval. */
  stop(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    console.log('[SessionHealth] Health monitor stopped');
  }

  /**
   * Check all sessions that should be active (idle or running).
   * Each check is independent — one failure does not block others.
   */
  private async checkAllSessions(): Promise<void> {
    const allSessions = backendSessionStore.getAll();

    for (const [workbenchId, session] of allSessions) {
      // Only check sessions that should be alive
      if (session.status !== 'idle' && session.status !== 'running') {
        continue;
      }

      try {
        await this.checkSession(workbenchId, session);
      } catch (err) {
        console.error(`[SessionHealth] Error checking session ${workbenchId}:`, err);
      }
    }
  }

  /**
   * Check a single session for staleness. If stale, verify via Agent SDK
   * and trigger disconnection handling if the session is dead.
   */
  private async checkSession(workbenchId: string, session: ManagedSession): Promise<void> {
    const now = Date.now();
    this.lastCheckTimes.set(workbenchId, new Date().toISOString());

    // Check if session has been inactive beyond threshold
    if (!session.lastActivity) {
      // No activity ever recorded — session just started, skip
      return;
    }

    const lastActivityMs = new Date(session.lastActivity).getTime();
    const elapsed = now - lastActivityMs;

    if (elapsed < STALE_THRESHOLD_MS) {
      // Session has recent activity — healthy
      return;
    }

    // Session is stale — verify via Agent SDK
    if (!session.sessionId) {
      // No session ID to verify — treat as disconnected
      await this.handleDisconnectedSession(workbenchId, session.sessionId);
      return;
    }

    try {
      const info = await getSessionInfo(session.sessionId, { dir: this.projectDir });
      if (!info) {
        // Session not found — disconnected
        await this.handleDisconnectedSession(workbenchId, session.sessionId);
      }
      // Session info returned — session file exists on disk, likely healthy
      // (The stale activity may just mean the agent is idle, which is fine)
    } catch {
      // SDK call failed — session is dead
      await this.handleDisconnectedSession(workbenchId, session.sessionId);
    }
  }

  /**
   * Handle a disconnected session: update status, clean up, attempt resurrection.
   */
  private async handleDisconnectedSession(
    workbenchId: string,
    sessionId: string | null,
  ): Promise<void> {
    console.log(`[SessionHealth] Detected disconnection for ${workbenchId}`);

    // Stop the session to clean up (aborts stream, clears refs)
    try {
      await this.manager.stopSession(workbenchId);
    } catch (err) {
      console.error(`[SessionHealth] Failed to stop disconnected session ${workbenchId}:`, err);
    }

    // Attempt resurrection
    await this.attemptResurrection(workbenchId, sessionId);
  }

  /**
   * Attempt to resurrect a disconnected session (SESSION-05).
   * Strategy:
   *   1. If we have a sessionId, try resuming it via startSession
   *   2. If that fails, discover recent sessions from local JSONL files
   *   3. If a matching session is found, update the store and try again
   *   4. If nothing works, leave the session in error state
   */
  private async attemptResurrection(
    workbenchId: string,
    sessionId: string | null,
  ): Promise<void> {
    console.log(`[SessionHealth] Attempting resurrection for ${workbenchId}`);

    // Strategy 1: Resume with existing session ID
    if (sessionId) {
      try {
        await this.manager.startSession(workbenchId);
        console.log(`[SessionHealth] Resurrection succeeded for ${workbenchId} (resume)`);
        return;
      } catch (err) {
        console.warn(`[SessionHealth] Resume failed for ${workbenchId}:`, err);
        // Fall through to discovery
      }
    }

    // Strategy 2: Discover recent sessions from local conversation logs
    try {
      const recentSessions = await listSessions({ dir: this.projectDir, limit: 5 });

      if (recentSessions.length > 0) {
        // Use the most recent session as a recovery candidate
        const candidate = recentSessions[0];
        if (candidate) {
          console.log(
            `[SessionHealth] Found recovery candidate for ${workbenchId}: ${candidate.sessionId}`,
          );

          // Update the store with the discovered session ID
          const session = backendSessionStore.getOrCreate(workbenchId);
          session.sessionId = candidate.sessionId;
          backendSessionStore.set(workbenchId, session);

          // Try starting with the new session ID
          try {
            await this.manager.startSession(workbenchId);
            console.log(`[SessionHealth] Resurrection succeeded for ${workbenchId} (discovery)`);
            return;
          } catch (err) {
            console.warn(`[SessionHealth] Discovery-based resume failed for ${workbenchId}:`, err);
          }
        }
      }
    } catch (err) {
      console.warn(`[SessionHealth] Session discovery failed for ${workbenchId}:`, err);
    }

    // All strategies exhausted — leave in error state
    console.log(`[SessionHealth] No recoverable session for ${workbenchId}`);
    const session = backendSessionStore.getOrCreate(workbenchId);
    session.status = 'error';
    session.error = 'Session disconnected — resurrection failed';
    backendSessionStore.set(workbenchId, session);
  }

  /**
   * Return a summary of all session health statuses for API consumers.
   */
  getHealthStatus(): Record<string, { status: string; lastCheck: string | null; healthy: boolean }> {
    const result: Record<string, { status: string; lastCheck: string | null; healthy: boolean }> = {};
    const allSessions = backendSessionStore.getAll();

    for (const [workbenchId, session] of allSessions) {
      result[workbenchId] = {
        status: session.status,
        lastCheck: this.lastCheckTimes.get(workbenchId) ?? null,
        healthy: session.status === 'idle' || session.status === 'running',
      };
    }

    return result;
  }
}

/** Module-level singleton */
export let sessionHealthMonitor: SessionHealthMonitor | null = null;

/** Initialize the SessionHealthMonitor singleton */
export function initSessionHealthMonitor(
  manager: SessionManager,
  projectDir: string,
): SessionHealthMonitor {
  sessionHealthMonitor = new SessionHealthMonitor(manager, projectDir);
  return sessionHealthMonitor;
}
