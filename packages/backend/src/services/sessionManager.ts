/**
 * SessionManager — sole owner of Agent SDK calls (D-03).
 * Creates, resumes, suspends, stops, and forks persistent Claude sessions per workbench.
 * Includes hook event forwarding and disk-persistent session ID mapping.
 */
import {
  query,
  listSessions,
  getSessionMessages,
  getSessionInfo,
  forkSession as sdkForkSession,
} from '@anthropic-ai/claude-agent-sdk';
import type { Query, SDKMessage, SDKUserMessage } from '@anthropic-ai/claude-agent-sdk';
import { WebSocketHub } from '../ws/hub.js';
import { BackendSessionStore, backendSessionStore } from './sessionStore.js';
import type { ManagedSession } from './sessionStore.js';
import type { SessionStatus, SessionStatusEvent, WSEnvelope } from '@afw/shared';
import { WORKBENCH_PERSONALITIES, SYSTEM_CHANNEL } from '@afw/shared';

/** Grace period before suspending a background workbench session (ms) */
const GRACE_PERIOD_MS = 30_000;

export class SessionManager {
  private hub: WebSocketHub;
  private store: BackendSessionStore;
  private projectDir: string;
  private preWarmed = false;

  constructor(hub: WebSocketHub, store: BackendSessionStore, projectDir: string) {
    this.hub = hub;
    this.store = store;
    this.projectDir = projectDir;
  }

  /**
   * Initialize the session manager: enable disk persistence, load previous
   * session mappings, and pre-warm the Agent SDK.
   */
  async initialize(): Promise<void> {
    try {
      this.store.setProjectDir(this.projectDir);
      this.store.loadFromDisk();
      // Agent SDK does not export a startup() function.
      // Pre-warm by listing sessions (cheap operation that initializes the CLI process).
      await listSessions({ dir: this.projectDir, limit: 1 });
      this.preWarmed = true;
      console.log('[SessionManager] Pre-warmed Agent SDK');
    } catch (err) {
      console.warn('[SessionManager] Pre-warm failed:', err);
      // Graceful degradation — do not throw
    }
  }

  /**
   * Start (or resume) a session for a workbench.
   * Creates a new Agent SDK query with streaming input for multi-turn conversation.
   */
  async startSession(workbenchId: string): Promise<void> {
    const session = this.store.getOrCreate(workbenchId);

    // Already active — nothing to do
    if (session.status === 'idle' || session.status === 'running') {
      return;
    }

    // Clear any pending grace timeout (user switched back)
    this.store.clearGraceTimeout(workbenchId);

    // Create abort controller for this session
    const abortController = new AbortController();

    // Update status to connecting
    session.status = 'connecting';
    session.abortController = abortController;
    this.store.set(workbenchId, session);
    this.broadcastStatus(workbenchId, 'connecting');

    // Get stored sessionId for resume (SESSION-03 persistence)
    const existingSessionId = session.sessionId ?? undefined;

    // Get personality prompt (SESSION-08)
    const personality = WORKBENCH_PERSONALITIES[workbenchId] ?? 'You are a helpful assistant.';

    // Create streaming input using queue + resolver pattern (RESEARCH.md Pattern 2)
    const inputQueue: SDKUserMessage[] = [];
    let inputResolver: ((value: IteratorResult<SDKUserMessage, void>) => void) | null = null;

    async function* createInputStream(): AsyncGenerator<SDKUserMessage, void> {
      while (true) {
        if (inputQueue.length > 0) {
          yield inputQueue.shift()!;
        } else {
          // Wait for next message
          const result = await new Promise<IteratorResult<SDKUserMessage, void>>((resolve) => {
            inputResolver = resolve;
          });
          inputResolver = null;
          if (result.done) return;
          yield result.value;
        }
      }
    }

    // Store sendMessage function on the managed session for external callers
    session.sendMessage = (text: string) => {
      const msg: SDKUserMessage = {
        type: 'user',
        message: { role: 'user', content: [{ type: 'text', text }] },
        parent_tool_use_id: null,
      };
      if (inputResolver) {
        inputResolver({ value: msg, done: false });
      } else {
        inputQueue.push(msg);
      }
    };

    try {
      // Call Agent SDK query with streaming input
      const queryInstance = query({
        prompt: createInputStream(),
        options: {
          resume: existingSessionId,
          cwd: this.projectDir,
          abortController,
          persistSession: true,
          includeHookEvents: true,   // STATUS-03: forward hook_started/hook_response to frontend
          settingSources: ['user', 'project', 'local'],
          systemPrompt: personality,
          permissionMode: 'bypassPermissions',
          allowDangerouslySkipPermissions: true,
          stderr: (data: string) => console.error('[SessionManager]', workbenchId, data),
        },
      });

      // Store query reference
      session.queryRef = queryInstance;
      session.startedAt = new Date().toISOString();
      session.status = 'idle';
      this.store.set(workbenchId, session);

      // Consume the stream in the background (runs for session lifetime)
      this.consumeStream(workbenchId, queryInstance).catch((err) => {
        console.error('[SessionManager] Stream error for', workbenchId, err);
      });

      // Broadcast connected status
      this.broadcastStatus(workbenchId, 'idle');
    } catch (err) {
      session.status = 'error';
      session.error = err instanceof Error ? err.message : String(err);
      this.store.set(workbenchId, session);
      this.broadcastStatus(workbenchId, 'error');
      console.error('[SessionManager] Failed to start session for', workbenchId, err);
    }
  }

  /**
   * Consume the Agent SDK query stream, forwarding messages to frontend via WebSocket.
   * Handles hook events, result messages, and status transitions.
   */
  private async consumeStream(workbenchId: string, queryInstance: Query): Promise<void> {
    const session = this.store.get(workbenchId);
    if (!session) return;

    let isFirstMessage = true;

    try {
      for await (const message of queryInstance) {
        // On first message, extract and persist the session_id
        if (isFirstMessage && 'session_id' in message && typeof message.session_id === 'string') {
          session.sessionId = message.session_id;
          this.store.set(workbenchId, session); // Persists to disk
          isFirstMessage = false;
        } else if (isFirstMessage) {
          isFirstMessage = false;
        }

        // Update last activity
        session.lastActivity = new Date().toISOString();

        // Broadcast the raw message to frontend
        this.broadcastEnvelope(SYSTEM_CHANNEL, 'session:message', {
          workbenchId,
          message,
        });

        // Handle specific message types
        const msgType = (message as Record<string, unknown>).type as string | undefined;
        const msgSubtype = (message as Record<string, unknown>).subtype as string | undefined;

        if (msgType === 'result') {
          // Agent finished processing — back to idle
          session.status = 'idle';
          this.broadcastStatus(workbenchId, 'idle');
        } else if (msgType === 'assistant') {
          // Agent is processing — mark as running
          if (session.status !== 'running') {
            session.status = 'running';
            this.broadcastStatus(workbenchId, 'running');
          }
        } else if (msgType === 'system' && msgSubtype === 'hook_started') {
          // STATUS-03: Forward hook lifecycle to frontend
          this.broadcastEnvelope(SYSTEM_CHANNEL, 'session:hook', {
            workbenchId,
            hookType: 'started',
            message,
          });
        } else if (msgType === 'system' && msgSubtype === 'hook_response') {
          // STATUS-03: Forward hook results to frontend
          this.broadcastEnvelope(SYSTEM_CHANNEL, 'session:hook', {
            workbenchId,
            hookType: 'response',
            message,
          });
        }
      }

      // Stream ended — if not already stopped/suspended, mark as stopped
      if (session.status !== 'stopped' && session.status !== 'suspended') {
        session.status = 'stopped';
        this.broadcastStatus(workbenchId, 'stopped');
      }
    } catch (err: unknown) {
      // Check if this is an abort (expected when session is stopped/suspended)
      const isAbort =
        (err instanceof Error && err.name === 'AbortError') ||
        session.abortController?.signal.aborted;

      if (isAbort) {
        console.debug('[SessionManager] Stream aborted for', workbenchId, '(expected)');
      } else {
        session.status = 'error';
        session.error = err instanceof Error ? err.message : String(err);
        this.store.set(workbenchId, session);
        this.broadcastStatus(workbenchId, 'error');
        console.error('[SessionManager] Stream error for', workbenchId, err);
      }
    }
  }

  /**
   * Suspend a workbench session (abort stream but preserve session ID for resume).
   */
  async suspendSession(workbenchId: string): Promise<void> {
    const session = this.store.get(workbenchId);
    if (!session || (!session.queryRef && !session.abortController)) return;

    session.abortController?.abort();
    session.queryRef = null;
    session.abortController = null;
    session.sendMessage = undefined;
    session.status = 'suspended';
    this.store.set(workbenchId, session);
    this.broadcastStatus(workbenchId, 'suspended');
    console.log('[SessionManager] Suspended session for', workbenchId);
  }

  /**
   * Stop a workbench session completely. Preserves sessionId for future resume (SESSION-03).
   */
  async stopSession(workbenchId: string): Promise<void> {
    const session = this.store.get(workbenchId);
    if (!session) return;

    this.store.clearGraceTimeout(workbenchId);
    session.abortController?.abort();
    session.queryRef = null;
    session.abortController = null;
    session.sendMessage = undefined;
    session.status = 'stopped';
    session.error = null;
    this.store.set(workbenchId, session);
    this.broadcastStatus(workbenchId, 'stopped');
    console.log('[SessionManager] Stopped session for', workbenchId);
    // sessionId is NOT cleared — preserved for resume on next start (SESSION-03)
  }

  /**
   * Handle workbench switch: reactivate the new workbench session,
   * schedule suspension of the previous one after grace period (D-01, D-02).
   */
  handleWorkbenchSwitch(newWorkbenchId: string, previousWorkbenchId: string): void {
    // Clear any existing grace timeout for the new workbench (user switched back)
    this.store.clearGraceTimeout(newWorkbenchId);

    // Reactivate suspended session for the new workbench
    const newSession = this.store.get(newWorkbenchId);
    if (newSession?.status === 'suspended' && newSession.sessionId) {
      this.startSession(newWorkbenchId).catch((err) => {
        console.error('[SessionManager] Failed to reactivate session for', newWorkbenchId, err);
      });
    }

    // Schedule suspension for the previous workbench after grace period
    const prevSession = this.store.get(previousWorkbenchId);
    if (prevSession && (prevSession.status === 'idle' || prevSession.status === 'running')) {
      // Broadcast suspended status immediately (visual feedback)
      this.broadcastStatus(previousWorkbenchId, 'suspended');

      // Set grace timeout to actually suspend after GRACE_PERIOD_MS
      const timeout = setTimeout(() => {
        this.suspendSession(previousWorkbenchId).catch((err) => {
          console.error('[SessionManager] Failed to suspend session for', previousWorkbenchId, err);
        });
      }, GRACE_PERIOD_MS);

      prevSession.graceTimeout = timeout;
    }
  }

  /**
   * Fork a session to create a new branch (SESSION-09).
   * Returns the new session ID or null if fork failed.
   */
  async forkSession(workbenchId: string): Promise<string | null> {
    const session = this.store.get(workbenchId);
    if (!session?.sessionId) return null;

    try {
      const result = await sdkForkSession(session.sessionId, {
        dir: this.projectDir,
      });
      console.log('[SessionManager] Forked session for', workbenchId, '-> new ID:', result.sessionId);
      return result.sessionId;
    } catch (err) {
      console.error('[SessionManager] Failed to fork session for', workbenchId, err);
      return null;
    }
  }

  /**
   * Get message history for a workbench session (SESSION-07).
   */
  async getSessionHistory(workbenchId: string): Promise<unknown[]> {
    const session = this.store.get(workbenchId);
    if (!session?.sessionId) return [];

    try {
      const messages = await getSessionMessages(session.sessionId, {
        dir: this.projectDir,
        limit: 50,
      });
      return messages;
    } catch (err) {
      console.error('[SessionManager] Failed to get session history for', workbenchId, err);
      return [];
    }
  }

  /**
   * List all sessions associated with this project (SESSION-07).
   */
  async listWorkbenchSessions(): Promise<unknown[]> {
    try {
      const sessions = await listSessions({ dir: this.projectDir, limit: 20 });
      return sessions;
    } catch (err) {
      console.error('[SessionManager] Failed to list sessions:', err);
      return [];
    }
  }

  /**
   * Broadcast a SessionStatusEvent to all connected frontend clients.
   */
  private broadcastStatus(
    workbenchId: string,
    status: SessionStatus,
    extra?: Partial<SessionStatusEvent>,
  ): void {
    const session = this.store.get(workbenchId);
    const payload: SessionStatusEvent = {
      workbenchId,
      sessionId: session?.sessionId ?? null,
      status,
      startedAt: session?.startedAt ?? null,
      lastActivity: session?.lastActivity ?? null,
      error: session?.error ?? null,
      ...extra,
    };
    this.broadcastEnvelope(SYSTEM_CHANNEL, 'session:status', payload);
  }

  /**
   * Build and broadcast a WSEnvelope message to all clients.
   */
  private broadcastEnvelope(channel: string, type: string, payload: unknown): void {
    const envelope: WSEnvelope = {
      channel,
      type,
      payload,
      ts: new Date().toISOString(),
    };
    this.hub.broadcastAll(JSON.stringify(envelope));
  }

  /**
   * Gracefully shutdown all sessions: abort streams, clear timeouts, persist state.
   */
  async shutdown(): Promise<void> {
    console.log('[SessionManager] Shutting down all sessions...');
    const allSessions = this.store.getAll();
    for (const [workbenchId, session] of allSessions) {
      if (session.abortController) {
        session.abortController.abort();
        session.queryRef = null;
        session.abortController = null;
        session.sendMessage = undefined;
      }
    }
    this.store.clearAllGraceTimeouts();
    this.store.saveToDisk();
    console.log('[SessionManager] Shutdown complete');
  }
}

/** Module-level singleton */
export let sessionManager: SessionManager | null = null;

/** Initialize the SessionManager singleton */
export function initSessionManager(hub: WebSocketHub, projectDir: string): SessionManager {
  sessionManager = new SessionManager(hub, backendSessionStore, projectDir);
  return sessionManager;
}
