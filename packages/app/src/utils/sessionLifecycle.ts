import type { SessionId, SessionLifecycleState } from '@afw/shared';

/**
 * Lifecycle transition events
 */
export type LifecycleTransition =
  | 'start'
  | 'pause'
  | 'resume'
  | 'waitForInput'
  | 'receiveInput'
  | 'end';

/**
 * Lifecycle state change event
 */
export interface LifecycleStateChange {
  sessionId: SessionId;
  fromState: SessionLifecycleState;
  toState: SessionLifecycleState;
  transition: LifecycleTransition;
  timestamp: number;
}

/**
 * State transition callback
 */
export type StateChangeCallback = (change: LifecycleStateChange) => void;

/**
 * Valid state transitions map
 */
const VALID_TRANSITIONS: Record<
  SessionLifecycleState,
  Partial<Record<LifecycleTransition, SessionLifecycleState>>
> = {
  created: {
    start: 'active',
    end: 'ended',
  },
  active: {
    pause: 'paused',
    waitForInput: 'waiting-for-input',
    end: 'ended',
  },
  paused: {
    resume: 'active',
    end: 'ended',
  },
  'waiting-for-input': {
    receiveInput: 'active',
    end: 'ended',
  },
  ended: {
    // No transitions from ended state
  },
};

/**
 * Session Lifecycle State Machine
 *
 * Manages session state transitions with validation and event hooks
 */
export class SessionLifecycleStateMachine {
  private state: SessionLifecycleState;
  private sessionId: SessionId;
  private listeners: Set<StateChangeCallback> = new Set();
  private autoArchiveTimer: ReturnType<typeof setTimeout> | null = null;
  private autoArchiveDelayMs: number;

  constructor(
    sessionId: SessionId,
    initialState: SessionLifecycleState = 'created',
    autoArchiveDelayMs: number = 60000 // 60 seconds default
  ) {
    this.sessionId = sessionId;
    this.state = initialState;
    this.autoArchiveDelayMs = autoArchiveDelayMs;
  }

  /**
   * Get current state
   */
  getState(): SessionLifecycleState {
    return this.state;
  }

  /**
   * Get session ID
   */
  getSessionId(): SessionId {
    return this.sessionId;
  }

  /**
   * Attempt a state transition
   */
  transition(event: LifecycleTransition): boolean {
    const fromState = this.state;
    const validTransitions = VALID_TRANSITIONS[fromState];
    const toState = validTransitions[event];

    if (!toState) {
      console.warn(
        `[SessionLifecycle] Invalid transition: ${event} from state ${fromState} for session ${this.sessionId}`
      );
      return false;
    }

    // Update state
    this.state = toState;

    // Emit state change event
    const change: LifecycleStateChange = {
      sessionId: this.sessionId,
      fromState,
      toState,
      transition: event,
      timestamp: Date.now(),
    };

    this.listeners.forEach(listener => listener(change));

    // Handle auto-archive on end
    if (toState === 'ended') {
      this.scheduleAutoArchive();
    }

    return true;
  }

  /**
   * Start session
   */
  start(): boolean {
    return this.transition('start');
  }

  /**
   * Pause session
   */
  pause(): boolean {
    return this.transition('pause');
  }

  /**
   * Resume session
   */
  resume(): boolean {
    return this.transition('resume');
  }

  /**
   * Wait for user input
   */
  waitForInput(): boolean {
    return this.transition('waitForInput');
  }

  /**
   * Receive user input
   */
  receiveInput(): boolean {
    return this.transition('receiveInput');
  }

  /**
   * End session
   */
  end(): boolean {
    return this.transition('end');
  }

  /**
   * Add state change listener
   */
  addListener(callback: StateChangeCallback): () => void {
    this.listeners.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Remove state change listener
   */
  removeListener(callback: StateChangeCallback): void {
    this.listeners.delete(callback);
  }

  /**
   * Clear all listeners
   */
  clearListeners(): void {
    this.listeners.clear();
  }

  /**
   * Schedule auto-archive after delay
   */
  private scheduleAutoArchive(): void {
    // Cancel existing timer if any
    if (this.autoArchiveTimer !== null) {
      clearTimeout(this.autoArchiveTimer);
    }

    // Schedule archive
    this.autoArchiveTimer = setTimeout(() => {
      this.listeners.forEach(listener =>
        listener({
          sessionId: this.sessionId,
          fromState: 'ended',
          toState: 'ended',
          transition: 'end',
          timestamp: Date.now(),
        })
      );
    }, this.autoArchiveDelayMs);
  }

  /**
   * Cancel auto-archive timer
   */
  cancelAutoArchive(): void {
    if (this.autoArchiveTimer !== null) {
      clearTimeout(this.autoArchiveTimer);
      this.autoArchiveTimer = null;
    }
  }

  /**
   * Destroy state machine (cleanup)
   */
  destroy(): void {
    this.cancelAutoArchive();
    this.clearListeners();
  }
}

/**
 * Get badge configuration for lifecycle state
 */
export function getLifecycleBadgeConfig(state: SessionLifecycleState): {
  label: string;
  color: string;
  pulse: boolean;
} {
  switch (state) {
    case 'created':
      return { label: 'Created', color: '#6b7280', pulse: false };
    case 'active':
      return { label: 'Active', color: '#3b82f6', pulse: true };
    case 'paused':
      return { label: 'Paused', color: '#f59e0b', pulse: false };
    case 'waiting-for-input':
      return { label: 'Waiting', color: '#8b5cf6', pulse: true };
    case 'ended':
      return { label: 'Ended', color: '#10b981', pulse: false };
    default:
      return { label: 'Unknown', color: '#6b7280', pulse: false };
  }
}
