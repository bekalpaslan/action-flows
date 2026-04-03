/**
 * Backend store mapping WorkbenchId to session metadata.
 * Runtime state is in-memory. Session ID mappings persist to disk
 * so sessions can be resumed after backend restart.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import type { SessionStatus } from '@afw/shared';

export interface ManagedSession {
  workbenchId: string;
  sessionId: string | null;
  status: SessionStatus;
  startedAt: string | null;
  lastActivity: string | null;
  error: string | null;
  graceTimeout: ReturnType<typeof setTimeout> | null;
  abortController: AbortController | null;
  sendMessage?: (text: string) => void;
  queryRef?: unknown; // The Query async generator reference
}

/** Shape of the persisted JSON file */
interface PersistedSessionMap {
  [workbenchId: string]: string; // workbenchId -> sessionId
}

export class BackendSessionStore {
  private sessions = new Map<string, ManagedSession>();
  private persistPath: string | null = null;

  /** Set the project directory -- enables disk persistence */
  setProjectDir(projectDir: string): void {
    this.persistPath = join(projectDir, '.claude', 'afw-sessions.json');
  }

  get(workbenchId: string): ManagedSession | undefined {
    return this.sessions.get(workbenchId);
  }

  set(workbenchId: string, session: ManagedSession): void {
    this.sessions.set(workbenchId, session);
    // Persist session ID mapping to disk whenever a session is set
    if (session.sessionId) {
      this.saveToDisk();
    }
  }

  getAll(): Map<string, ManagedSession> {
    return new Map(this.sessions);
  }

  getOrCreate(workbenchId: string): ManagedSession {
    let session = this.sessions.get(workbenchId);
    if (!session) {
      // Check if we have a persisted sessionId for this workbench
      const persistedId = this.loadPersistedSessionId(workbenchId);
      session = {
        workbenchId,
        sessionId: persistedId,
        status: 'stopped',
        startedAt: null,
        lastActivity: null,
        error: null,
        graceTimeout: null,
        abortController: null,
      };
      this.sessions.set(workbenchId, session);
    }
    return session;
  }

  clearGraceTimeout(workbenchId: string): void {
    const session = this.sessions.get(workbenchId);
    if (session?.graceTimeout) {
      clearTimeout(session.graceTimeout);
      session.graceTimeout = null;
    }
  }

  clearAllGraceTimeouts(): void {
    for (const session of this.sessions.values()) {
      if (session.graceTimeout) {
        clearTimeout(session.graceTimeout);
        session.graceTimeout = null;
      }
    }
  }

  /** Count sessions with a given status */
  countByStatus(status: SessionStatus): number {
    let count = 0;
    for (const s of this.sessions.values()) {
      if (s.status === status) count++;
    }
    return count;
  }

  /** Load all persisted session ID mappings from disk into in-memory store */
  loadFromDisk(): void {
    if (!this.persistPath) return;
    try {
      if (!existsSync(this.persistPath)) return;
      const raw = readFileSync(this.persistPath, 'utf-8');
      const data: PersistedSessionMap = JSON.parse(raw) as PersistedSessionMap;
      for (const [workbenchId, sessionId] of Object.entries(data)) {
        if (typeof sessionId === 'string' && sessionId.length > 0) {
          const existing = this.sessions.get(workbenchId);
          if (existing) {
            existing.sessionId = sessionId;
          } else {
            this.sessions.set(workbenchId, {
              workbenchId,
              sessionId,
              status: 'stopped',
              startedAt: null,
              lastActivity: null,
              error: null,
              graceTimeout: null,
              abortController: null,
            });
          }
        }
      }
      console.log(`[SessionStore] Loaded ${Object.keys(data).length} persisted session mappings`);
    } catch (err) {
      console.warn('[SessionStore] Failed to load persisted sessions:', err);
    }
  }

  /** Save current workbenchId->sessionId mappings to disk */
  saveToDisk(): void {
    if (!this.persistPath) return;
    try {
      const data: PersistedSessionMap = {};
      for (const [workbenchId, session] of this.sessions.entries()) {
        if (session.sessionId) {
          data[workbenchId] = session.sessionId;
        }
      }
      const dir = dirname(this.persistPath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
      writeFileSync(this.persistPath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.warn('[SessionStore] Failed to persist sessions:', err);
    }
  }

  /** Read a single persisted sessionId without loading all */
  private loadPersistedSessionId(workbenchId: string): string | null {
    if (!this.persistPath) return null;
    try {
      if (!existsSync(this.persistPath)) return null;
      const raw = readFileSync(this.persistPath, 'utf-8');
      const data: PersistedSessionMap = JSON.parse(raw) as PersistedSessionMap;
      return data[workbenchId] ?? null;
    } catch {
      return null;
    }
  }
}

export const backendSessionStore = new BackendSessionStore();
