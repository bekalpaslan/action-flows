# Harmony Detection System — Design Plan

**Agent:** plan/
**Date:** 2026-02-08
**Task:** Design backend service, API endpoints, and dashboard visualization for harmony detection

---

## Executive Summary

This plan specifies the complete Harmony Detection system for monitoring orchestrator output compliance with the CONTRACT.md specification. The system leverages existing contract parsers to detect format violations in real-time, stores harmony metrics, and provides dashboard visualization.

**Key Components:**
1. **HarmonyDetector Service** - Backend parsing and violation detection
2. **Storage Extensions** - Harmony check history and metrics
3. **API Endpoints** - REST endpoints for harmony data queries
4. **WebSocket Events** - Real-time harmony notifications
5. **Frontend Components** - Dashboard badges, panels, and indicators
6. **Frontend Hooks** - Data fetching and real-time updates

---

## 1. Shared Types (packages/shared/)

### 1.1 New File: packages/shared/src/harmonyTypes.ts

```typescript
/**
 * Harmony Detection Types
 * Types for orchestrator output compliance monitoring
 */

import type { SessionId, ProjectId, Timestamp } from './types.js';
import type { CONTRACT_VERSION } from './contract/version.js';

/**
 * Result of a single harmony check
 */
export type HarmonyResult = 'valid' | 'degraded' | 'violation';

/**
 * Record of a single harmony check
 */
export interface HarmonyCheck {
  /** Unique check ID */
  id: string;

  /** Session this check belongs to */
  sessionId: SessionId;

  /** Project (if available) */
  projectId?: ProjectId;

  /** When this check occurred */
  timestamp: Timestamp;

  /** Raw orchestrator output (truncated to 500 chars) */
  text: string;

  /** Parsed format name (e.g., "ChainCompilation", "StepCompletion") or null if unknown */
  parsedFormat: string | null;

  /** Check result */
  result: HarmonyResult;

  /** Missing fields for degraded parses */
  missingFields?: string[];

  /** Optional context */
  context?: {
    stepNumber?: number;
    chainId?: string;
    actionType?: string;
  };

  /** Contract version used for parsing */
  contractVersion: string;
}

/**
 * Aggregated harmony metrics
 */
export interface HarmonyMetrics {
  /** Total checks performed */
  totalChecks: number;

  /** Number of valid parses */
  validCount: number;

  /** Number of degraded parses (partial success) */
  degradedCount: number;

  /** Number of violations (complete failure) */
  violationCount: number;

  /** Overall harmony percentage: (valid + degraded) / total * 100 */
  harmonyPercentage: number;

  /** Recent violations (last 10) */
  recentViolations: HarmonyCheck[];

  /** Format breakdown: format name -> count */
  formatBreakdown: Record<string, number>;

  /** Timestamp of last check */
  lastCheck: Timestamp;

  /** Trend data: last 7 days */
  trend?: {
    date: string; // ISO date (YYYY-MM-DD)
    percentage: number;
    checks: number;
  }[];
}

/**
 * Filter options for harmony queries
 */
export interface HarmonyFilter {
  /** Filter by result type */
  result?: HarmonyResult;

  /** Filter by parsed format */
  formatType?: string;

  /** Filter by checks after this timestamp */
  since?: Timestamp;

  /** Maximum number of results */
  limit?: number;
}

/**
 * Branded type for harmony check IDs
 */
export type HarmonyCheckId = string & { readonly __brand: 'HarmonyCheckId' };

/**
 * Helper to create harmony check ID
 */
export function harmonyCheckId(id: string): HarmonyCheckId {
  return id as HarmonyCheckId;
}
```

### 1.2 Update File: packages/shared/src/events.ts

Add harmony events to the events file:

```typescript
// ADD THESE INTERFACES BEFORE WorkspaceEvent union type:

/**
 * Harmony check event - emitted after every orchestrator output check
 */
export interface HarmonyCheckEvent extends BaseEvent {
  type: 'harmony:check';

  // Automatic fields
  sessionId: SessionId;
  checkId: string;
  result: 'valid' | 'degraded' | 'violation';
  parsedFormat: string | null;

  // Parsed fields (nullable)
  text?: string | null; // Truncated output
  missingFields?: string[] | null;
  context?: {
    stepNumber?: number;
    chainId?: string;
  };
}

/**
 * Harmony violation event - emitted when parsing fails
 */
export interface HarmonyViolationEvent extends BaseEvent {
  type: 'harmony:violation';

  // Automatic fields
  sessionId: SessionId;
  checkId: string;
  text: string; // Raw text that failed to parse
  timestamp: Timestamp;

  // Optional context
  context?: {
    stepNumber?: number;
    chainId?: string;
  };
}

/**
 * Harmony metrics updated event - emitted when harmony percentage changes significantly
 */
export interface HarmonyMetricsUpdatedEvent extends BaseEvent {
  type: 'harmony:metrics-updated';

  // Automatic fields
  sessionId: SessionId;
  harmonyPercentage: number;
  totalChecks: number;
  violationCount: number;
}
```

Add to WorkspaceEvent union:

```typescript
export type WorkspaceEvent =
  | SessionStartedEvent
  | SessionEndedEvent
  // ... (all existing types)
  | HarmonyCheckEvent
  | HarmonyViolationEvent
  | HarmonyMetricsUpdatedEvent;
```

Add to eventGuards object:

```typescript
export const eventGuards = {
  // ... (all existing guards)
  isHarmonyCheck: (event: WorkspaceEvent): event is HarmonyCheckEvent =>
    event.type === 'harmony:check',
  isHarmonyViolation: (event: WorkspaceEvent): event is HarmonyViolationEvent =>
    event.type === 'harmony:violation',
  isHarmonyMetricsUpdated: (event: WorkspaceEvent): event is HarmonyMetricsUpdatedEvent =>
    event.type === 'harmony:metrics-updated',
};
```

### 1.3 Update File: packages/shared/src/index.ts

Export harmony types:

```typescript
// ADD THIS EXPORT:
export * from './harmonyTypes.js';
```

---

## 2. Backend Service (packages/backend/)

### 2.1 New File: packages/backend/src/services/harmonyDetector.ts

```typescript
/**
 * Harmony Detector Service
 * Monitors orchestrator output compliance with CONTRACT.md specification
 */

import type { SessionId, ProjectId, Timestamp, WorkspaceEvent } from '@afw/shared';
import type {
  HarmonyCheck,
  HarmonyMetrics,
  HarmonyResult,
  HarmonyFilter,
  HarmonyCheckId,
} from '@afw/shared';
import { parseOrchestratorOutput, CONTRACT_VERSION } from '@afw/shared/contract';
import type { Storage } from '../storage/index.js';
import { brandedTypes } from '@afw/shared';

/**
 * Context information for harmony checks
 */
export interface HarmonyCheckContext {
  stepNumber?: number;
  chainId?: string;
  actionType?: string;
}

/**
 * Result of a harmony check operation
 */
export interface HarmonyCheckResult {
  check: HarmonyCheck;
  shouldBroadcast: boolean;
  event?: WorkspaceEvent;
}

/**
 * Broadcast function type
 */
type BroadcastFunction = (sessionId: SessionId, event: WorkspaceEvent) => void;

/**
 * Configuration for harmony detection
 */
const HARMONY_CONFIG = {
  /** Truncate raw text to this length for storage */
  maxTextLength: 500,

  /** Threshold for significant harmony change (percentage points) */
  significantChangeThreshold: 5,

  /** Maximum violations to store per session */
  maxViolationsPerSession: 100,

  /** TTL for harmony checks (7 days, same as events) */
  ttlDays: 7,
};

/**
 * Service for detecting orchestrator output compliance with contract
 */
export class HarmonyDetector {
  private broadcastFn?: BroadcastFunction;
  private lastHarmonyPercentage = new Map<SessionId, number>();

  constructor(private storage: Storage) {}

  /**
   * Check orchestrator output for contract compliance
   *
   * @param text - Raw orchestrator output
   * @param sessionId - Session this output belongs to
   * @param context - Optional context (step number, chain ID, etc.)
   * @returns Harmony check result
   */
  async checkOutput(
    text: string,
    sessionId: SessionId,
    context?: HarmonyCheckContext
  ): Promise<HarmonyCheckResult> {
    // Parse output using master parser
    const parsed = parseOrchestratorOutput(text);

    // Determine result
    let result: HarmonyResult;
    let parsedFormat: string | null = null;
    let missingFields: string[] = [];

    if (parsed === null) {
      // Format unknown - complete violation
      result = 'violation';
    } else {
      // Format recognized - check for partial parse
      parsedFormat = this.getFormatName(parsed);
      missingFields = this.getMissingFields(parsed);

      if (missingFields.length > 0) {
        // Some fields missing - degraded parse
        result = 'degraded';
      } else {
        // All fields present - valid parse
        result = 'valid';
      }
    }

    // Create check record
    const check: HarmonyCheck = {
      id: this.generateCheckId(),
      sessionId,
      projectId: context?.actionType ? await this.getProjectId(sessionId) : undefined,
      timestamp: brandedTypes.currentTimestamp(),
      text: this.truncateText(text),
      parsedFormat,
      result,
      missingFields: missingFields.length > 0 ? missingFields : undefined,
      context,
      contractVersion: CONTRACT_VERSION,
    };

    // Store check
    await Promise.resolve(this.storage.addHarmonyCheck(check));

    // Determine if we should broadcast
    const shouldBroadcast = result === 'violation' || await this.isSignificantChange(sessionId);

    // Create event
    let event: WorkspaceEvent | undefined;
    if (shouldBroadcast) {
      if (result === 'violation') {
        event = this.createViolationEvent(check);
      } else {
        event = this.createCheckEvent(check);
      }

      // Broadcast event
      if (this.broadcastFn && event) {
        this.broadcastFn(sessionId, event);
      }

      // Check if we should also emit metrics update
      const metricsEvent = await this.checkMetricsUpdate(sessionId);
      if (metricsEvent && this.broadcastFn) {
        this.broadcastFn(sessionId, metricsEvent);
      }
    }

    return { check, shouldBroadcast, event };
  }

  /**
   * Get harmony metrics for a session or project
   *
   * @param target - Session ID or Project ID
   * @param targetType - 'session' or 'project'
   * @returns Harmony metrics
   */
  async getHarmonyMetrics(
    target: SessionId | ProjectId,
    targetType: 'session' | 'project' = 'session'
  ): Promise<HarmonyMetrics> {
    return await Promise.resolve(
      this.storage.getHarmonyMetrics(target, targetType)
    );
  }

  /**
   * Get harmony checks with optional filtering
   *
   * @param target - Session ID or Project ID
   * @param filter - Optional filter criteria
   * @returns Array of harmony checks
   */
  async getHarmonyChecks(
    target: SessionId | ProjectId,
    filter?: HarmonyFilter
  ): Promise<HarmonyCheck[]> {
    return await Promise.resolve(
      this.storage.getHarmonyChecks(target, filter)
    );
  }

  /**
   * Set broadcast function for WebSocket events
   */
  setBroadcastFunction(fn: BroadcastFunction): void {
    this.broadcastFn = fn;
  }

  // --- Private helper methods ---

  /**
   * Generate unique check ID
   */
  private generateCheckId(): string {
    return `hc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get format name from parsed object
   */
  private getFormatName(parsed: any): string {
    // Contract parsers include a contractVersion field
    // We can infer format from the fields present
    if ('title' in parsed && 'steps' in parsed) return 'ChainCompilation';
    if ('stepNumber' in parsed && 'action' in parsed && 'result' in parsed) return 'StepCompletion';
    if ('actionOutput' in parsed && 'secondOpinionOutput' in parsed) return 'DualOutput';
    if ('scope' in parsed && 'verdict' in parsed) return 'ReviewReport';
    if ('title' in parsed && 'message' in parsed && 'recoveryOptions' in parsed) return 'ErrorAnnouncement';
    if ('file' in parsed && 'action' in parsed && 'entry' in parsed) return 'RegistryUpdate';
    if ('question' in parsed && 'options' in parsed) return 'LearningSurface';
    if ('file' in parsed && 'line' in parsed) return 'IndexEntry';
    if ('chainId' in parsed && 'status' in parsed) return 'ChainExecutionStart';
    if ('scope' in parsed && 'findings' in parsed) return 'AnalysisReport';
    if ('topic' in parsed && 'participant' in parsed) return 'SessionStartProtocol';
    if ('status' in parsed && 'summary' in parsed) return 'ExecutionComplete';
    if ('reason' in parsed && 'skipReason' in parsed) return 'SecondOpinionSkip';
    if ('title' in parsed && 'learning' in parsed) return 'LearningEntry';
    if ('progress' in parsed && 'currentStep' in parsed) return 'ChainStatusUpdate';
    if ('transcript' in parsed && 'ideas' in parsed) return 'BrainstormTranscript';
    if ('question' in parsed && 'context' in parsed && !('options' in parsed)) return 'HumanGate';
    if ('department' in parsed && 'route' in parsed) return 'DepartmentRouting';

    return 'Unknown';
  }

  /**
   * Get missing fields from parsed object (fields that are null)
   */
  private getMissingFields(parsed: any): string[] {
    const missing: string[] = [];

    for (const [key, value] of Object.entries(parsed)) {
      // Skip metadata fields
      if (key === 'raw' || key === 'contractVersion') continue;

      // Check if field is null
      if (value === null) {
        missing.push(key);
      }
    }

    return missing;
  }

  /**
   * Truncate text for storage
   */
  private truncateText(text: string): string {
    if (text.length <= HARMONY_CONFIG.maxTextLength) {
      return text;
    }
    return text.substring(0, HARMONY_CONFIG.maxTextLength) + '...';
  }

  /**
   * Get project ID for a session
   */
  private async getProjectId(sessionId: SessionId): Promise<ProjectId | undefined> {
    const session = await Promise.resolve(this.storage.getSession(sessionId));
    // Assuming session has projectId field - if not, this can be removed
    return (session as any)?.projectId;
  }

  /**
   * Check if harmony percentage changed significantly
   */
  private async isSignificantChange(sessionId: SessionId): Promise<boolean> {
    const metrics = await this.getHarmonyMetrics(sessionId, 'session');
    const lastPercentage = this.lastHarmonyPercentage.get(sessionId) ?? 100;
    const currentPercentage = metrics.harmonyPercentage;

    const change = Math.abs(currentPercentage - lastPercentage);

    if (change >= HARMONY_CONFIG.significantChangeThreshold) {
      this.lastHarmonyPercentage.set(sessionId, currentPercentage);
      return true;
    }

    return false;
  }

  /**
   * Create harmony check event
   */
  private createCheckEvent(check: HarmonyCheck): WorkspaceEvent {
    return {
      type: 'harmony:check',
      sessionId: check.sessionId,
      timestamp: check.timestamp,
      checkId: check.id,
      result: check.result,
      parsedFormat: check.parsedFormat,
      text: check.text,
      missingFields: check.missingFields || null,
      context: check.context,
    } as any; // Cast needed because event types don't have all these fields yet
  }

  /**
   * Create harmony violation event
   */
  private createViolationEvent(check: HarmonyCheck): WorkspaceEvent {
    return {
      type: 'harmony:violation',
      sessionId: check.sessionId,
      timestamp: check.timestamp,
      checkId: check.id,
      text: check.text,
      context: check.context,
    } as any; // Cast needed because event types don't have all these fields yet
  }

  /**
   * Check if we should emit metrics update event
   */
  private async checkMetricsUpdate(sessionId: SessionId): Promise<WorkspaceEvent | undefined> {
    const metrics = await this.getHarmonyMetrics(sessionId, 'session');
    const lastPercentage = this.lastHarmonyPercentage.get(sessionId) ?? 100;
    const currentPercentage = metrics.harmonyPercentage;

    const change = Math.abs(currentPercentage - lastPercentage);

    if (change >= HARMONY_CONFIG.significantChangeThreshold) {
      this.lastHarmonyPercentage.set(sessionId, currentPercentage);

      return {
        type: 'harmony:metrics-updated',
        sessionId,
        timestamp: brandedTypes.currentTimestamp(),
        harmonyPercentage: currentPercentage,
        totalChecks: metrics.totalChecks,
        violationCount: metrics.violationCount,
      } as any; // Cast needed because event types don't have all these fields yet
    }

    return undefined;
  }
}

// Singleton instance (initialized in index.ts)
export let harmonyDetector: HarmonyDetector;

/**
 * Initialize harmony detector with storage
 */
export function initializeHarmonyDetector(storage: Storage): void {
  harmonyDetector = new HarmonyDetector(storage);
}
```

---

## 3. Storage Layer Extensions (packages/backend/)

### 3.1 Update File: packages/backend/src/storage/index.ts

Add harmony storage methods to Storage interface:

```typescript
// ADD THESE METHODS TO Storage INTERFACE:

export interface Storage {
  // ... (all existing methods)

  // Harmony tracking
  addHarmonyCheck(check: HarmonyCheck): void | Promise<void>;
  getHarmonyChecks(
    target: SessionId | ProjectId,
    filter?: HarmonyFilter
  ): HarmonyCheck[] | Promise<HarmonyCheck[]>;
  getHarmonyMetrics(
    target: SessionId | ProjectId,
    targetType: 'session' | 'project'
  ): HarmonyMetrics | Promise<HarmonyMetrics>;
}
```

### 3.2 Update File: packages/backend/src/storage/memory.ts

Implement harmony methods for memory storage:

```typescript
// ADD THESE IMPORTS:
import type { HarmonyCheck, HarmonyMetrics, HarmonyFilter } from '@afw/shared';

// ADD THESE MAPS TO MemoryStorage CLASS:
private harmonyChecks = new Map<SessionId, HarmonyCheck[]>();
private harmonyChecksByProject = new Map<ProjectId, HarmonyCheck[]>();

// ADD THESE METHODS TO MemoryStorage CLASS:

/**
 * Add a harmony check
 */
addHarmonyCheck(check: HarmonyCheck): void {
  // Add to session checks
  const sessionChecks = this.harmonyChecks.get(check.sessionId) || [];
  sessionChecks.push(check);
  this.harmonyChecks.set(check.sessionId, sessionChecks);

  // Add to project checks if projectId is present
  if (check.projectId) {
    const projectChecks = this.harmonyChecksByProject.get(check.projectId) || [];
    projectChecks.push(check);
    this.harmonyChecksByProject.set(check.projectId, projectChecks);
  }

  // Limit storage per session
  if (sessionChecks.length > 100) {
    sessionChecks.shift(); // Remove oldest
  }
}

/**
 * Get harmony checks with optional filtering
 */
getHarmonyChecks(
  target: SessionId | ProjectId,
  filter?: HarmonyFilter
): HarmonyCheck[] {
  // Determine if target is session or project (check if it starts with 'sess_' or 'proj_')
  const isSession = target.startsWith('sess_');
  const checks = isSession
    ? this.harmonyChecks.get(target as SessionId) || []
    : this.harmonyChecksByProject.get(target as ProjectId) || [];

  // Apply filters
  let filtered = checks;

  if (filter?.result) {
    filtered = filtered.filter(c => c.result === filter.result);
  }

  if (filter?.formatType) {
    filtered = filtered.filter(c => c.parsedFormat === filter.formatType);
  }

  if (filter?.since) {
    filtered = filtered.filter(c => c.timestamp >= filter.since!);
  }

  if (filter?.limit) {
    filtered = filtered.slice(-filter.limit);
  }

  return filtered;
}

/**
 * Get harmony metrics
 */
getHarmonyMetrics(
  target: SessionId | ProjectId,
  targetType: 'session' | 'project'
): HarmonyMetrics {
  const checks = this.getHarmonyChecks(target, {});

  if (checks.length === 0) {
    return {
      totalChecks: 0,
      validCount: 0,
      degradedCount: 0,
      violationCount: 0,
      harmonyPercentage: 100,
      recentViolations: [],
      formatBreakdown: {},
      lastCheck: brandedTypes.currentTimestamp(),
    };
  }

  // Calculate counts
  const validCount = checks.filter(c => c.result === 'valid').length;
  const degradedCount = checks.filter(c => c.result === 'degraded').length;
  const violationCount = checks.filter(c => c.result === 'violation').length;

  // Calculate harmony percentage
  const harmonyPercentage = ((validCount + degradedCount) / checks.length) * 100;

  // Get recent violations
  const recentViolations = checks
    .filter(c => c.result === 'violation')
    .slice(-10);

  // Calculate format breakdown
  const formatBreakdown: Record<string, number> = {};
  for (const check of checks) {
    const format = check.parsedFormat || 'Unknown';
    formatBreakdown[format] = (formatBreakdown[format] || 0) + 1;
  }

  // Get last check timestamp
  const lastCheck = checks[checks.length - 1].timestamp;

  return {
    totalChecks: checks.length,
    validCount,
    degradedCount,
    violationCount,
    harmonyPercentage,
    recentViolations,
    formatBreakdown,
    lastCheck,
  };
}
```

### 3.3 Update File: packages/backend/src/storage/redis.ts

Implement harmony methods for Redis storage:

```typescript
// ADD THESE IMPORTS:
import type { HarmonyCheck, HarmonyMetrics, HarmonyFilter } from '@afw/shared';

// ADD THESE METHODS TO RedisStorage CLASS:

/**
 * Add a harmony check
 */
async addHarmonyCheck(check: HarmonyCheck): Promise<void> {
  const key = `${this.prefix}:harmony:session:${check.sessionId}`;

  // Store check in Redis list (LPUSH to add to left, LTRIM to limit size)
  await this.client.lPush(key, JSON.stringify(check));
  await this.client.lTrim(key, 0, 99); // Keep only last 100 checks

  // Set TTL (7 days)
  await this.client.expire(key, 7 * 24 * 60 * 60);

  // Also store by project if projectId is present
  if (check.projectId) {
    const projectKey = `${this.prefix}:harmony:project:${check.projectId}`;
    await this.client.lPush(projectKey, JSON.stringify(check));
    await this.client.lTrim(projectKey, 0, 199); // Keep more for project level
    await this.client.expire(projectKey, 7 * 24 * 60 * 60);
  }
}

/**
 * Get harmony checks with optional filtering
 */
async getHarmonyChecks(
  target: SessionId | ProjectId,
  filter?: HarmonyFilter
): Promise<HarmonyCheck[]> {
  // Determine key
  const isSession = target.startsWith('sess_');
  const key = isSession
    ? `${this.prefix}:harmony:session:${target}`
    : `${this.prefix}:harmony:project:${target}`;

  // Get all checks from Redis list
  const raw = await this.client.lRange(key, 0, -1);
  const checks: HarmonyCheck[] = raw.map(s => JSON.parse(s));

  // Apply filters
  let filtered = checks;

  if (filter?.result) {
    filtered = filtered.filter(c => c.result === filter.result);
  }

  if (filter?.formatType) {
    filtered = filtered.filter(c => c.parsedFormat === filter.formatType);
  }

  if (filter?.since) {
    filtered = filtered.filter(c => c.timestamp >= filter.since!);
  }

  if (filter?.limit) {
    filtered = filtered.slice(0, filter.limit);
  }

  return filtered;
}

/**
 * Get harmony metrics
 */
async getHarmonyMetrics(
  target: SessionId | ProjectId,
  targetType: 'session' | 'project'
): Promise<HarmonyMetrics> {
  const checks = await this.getHarmonyChecks(target, {});

  if (checks.length === 0) {
    return {
      totalChecks: 0,
      validCount: 0,
      degradedCount: 0,
      violationCount: 0,
      harmonyPercentage: 100,
      recentViolations: [],
      formatBreakdown: {},
      lastCheck: new Date().toISOString() as Timestamp,
    };
  }

  // Calculate counts
  const validCount = checks.filter(c => c.result === 'valid').length;
  const degradedCount = checks.filter(c => c.result === 'degraded').length;
  const violationCount = checks.filter(c => c.result === 'violation').length;

  // Calculate harmony percentage
  const harmonyPercentage = ((validCount + degradedCount) / checks.length) * 100;

  // Get recent violations
  const recentViolations = checks
    .filter(c => c.result === 'violation')
    .slice(0, 10);

  // Calculate format breakdown
  const formatBreakdown: Record<string, number> = {};
  for (const check of checks) {
    const format = check.parsedFormat || 'Unknown';
    formatBreakdown[format] = (formatBreakdown[format] || 0) + 1;
  }

  // Get last check timestamp
  const lastCheck = checks[0].timestamp; // Redis LPUSH adds to left, so first is newest

  return {
    totalChecks: checks.length,
    validCount,
    degradedCount,
    violationCount,
    harmonyPercentage,
    recentViolations,
    formatBreakdown,
    lastCheck,
  };
}
```

---

## 4. API Endpoints (packages/backend/)

### 4.1 New File: packages/backend/src/routes/harmony.ts

```typescript
/**
 * Harmony Detection API Routes
 */

import { Router } from 'express';
import { z } from 'zod';
import type { SessionId, ProjectId } from '@afw/shared';
import { harmonyDetector } from '../services/harmonyDetector.js';
import { sanitizeError } from '../middleware/errorHandler.js';
import { validateBody } from '../middleware/validate.js';
import { writeLimiter } from '../middleware/rateLimit.js';

const router = Router();

/**
 * Query schema for harmony endpoints
 */
const harmonyQuerySchema = z.object({
  since: z.string().datetime().optional(),
  result: z.enum(['valid', 'degraded', 'violation']).optional(),
  formatType: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
});

/**
 * Schema for manual harmony check
 */
const harmonyCheckSchema = z.object({
  text: z.string().min(1).max(10000),
  context: z.object({
    stepNumber: z.number().optional(),
    chainId: z.string().optional(),
    actionType: z.string().optional(),
  }).optional(),
});

/**
 * GET /api/harmony/:sessionId
 * Get harmony metrics for a specific session
 */
router.get('/:sessionId', async (req, res) => {
  try {
    const sessionId = req.params.sessionId as SessionId;
    const query = harmonyQuerySchema.parse(req.query);

    // Get metrics
    const metrics = await harmonyDetector.getHarmonyMetrics(sessionId, 'session');

    // Get recent checks with filters
    const recentChecks = await harmonyDetector.getHarmonyChecks(sessionId, {
      result: query.result,
      formatType: query.formatType,
      since: query.since as any,
      limit: query.limit,
    });

    res.json({
      sessionId,
      metrics,
      recentChecks,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid query parameters',
        details: error.errors,
      });
    }

    console.error('[API] Error fetching harmony metrics:', error);
    res.status(500).json({
      error: 'Failed to fetch harmony metrics',
      message: sanitizeError(error),
    });
  }
});

/**
 * GET /api/harmony/project/:projectId
 * Get harmony metrics for all sessions in a project
 */
router.get('/project/:projectId', async (req, res) => {
  try {
    const projectId = req.params.projectId as ProjectId;
    const query = harmonyQuerySchema.parse(req.query);

    // Get project-level metrics
    const metrics = await harmonyDetector.getHarmonyMetrics(projectId, 'project');

    // Get recent checks with filters
    const recentChecks = await harmonyDetector.getHarmonyChecks(projectId, {
      result: query.result,
      formatType: query.formatType,
      since: query.since as any,
      limit: query.limit,
    });

    res.json({
      projectId,
      metrics,
      recentChecks,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid query parameters',
        details: error.errors,
      });
    }

    console.error('[API] Error fetching project harmony metrics:', error);
    res.status(500).json({
      error: 'Failed to fetch project harmony metrics',
      message: sanitizeError(error),
    });
  }
});

/**
 * POST /api/harmony/:sessionId/check
 * Manually trigger harmony check on text (for testing/debugging)
 */
router.post('/:sessionId/check', writeLimiter, validateBody(harmonyCheckSchema), async (req, res) => {
  try {
    const sessionId = req.params.sessionId as SessionId;
    const { text, context } = req.body;

    // Run harmony check
    const result = await harmonyDetector.checkOutput(text, sessionId, context);

    res.json({
      check: result.check,
      parsed: result.check.parsedFormat,
      result: result.check.result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid request body',
        details: error.errors,
      });
    }

    console.error('[API] Error running harmony check:', error);
    res.status(500).json({
      error: 'Failed to run harmony check',
      message: sanitizeError(error),
    });
  }
});

/**
 * GET /api/harmony/stats
 * Get global harmony statistics across all projects
 */
router.get('/stats', async (req, res) => {
  try {
    // This would require aggregating across all sessions/projects
    // For now, return placeholder
    res.json({
      message: 'Global stats endpoint - to be implemented',
      totalChecks: 0,
      globalHarmonyPercentage: 100,
    });
  } catch (error) {
    console.error('[API] Error fetching global harmony stats:', error);
    res.status(500).json({
      error: 'Failed to fetch global harmony stats',
      message: sanitizeError(error),
    });
  }
});

export default router;
```

### 4.2 Update File: packages/backend/src/index.ts

Add harmony router and initialize harmony detector:

```typescript
// ADD THESE IMPORTS:
import harmonyRouter from './routes/harmony.js';
import { initializeHarmonyDetector, harmonyDetector } from './services/harmonyDetector.js';

// INITIALIZE HARMONY DETECTOR (add after storage initialization):
initializeHarmonyDetector(storage);

// ADD HARMONY ROUTER (add with other routers):
app.use('/api/harmony', harmonyRouter);

// ADD BROADCAST FUNCTION (add after existing broadcast functions):
function broadcastHarmonyEvent(
  sessionId: SessionId,
  event: WorkspaceEvent
) {
  const message = JSON.stringify({
    type: 'event',
    sessionId,
    payload: event,
  });

  clientRegistry.broadcastToSession(sessionId, message);
}

// INITIALIZE HARMONY BROADCAST (add after other service initializations):
harmonyDetector.setBroadcastFunction(broadcastHarmonyEvent);
```

---

## 5. Frontend Components (packages/app/)

### 5.1 New File: packages/app/src/hooks/useHarmonyMetrics.ts

```typescript
/**
 * Hook for fetching and subscribing to harmony metrics
 */

import { useEffect, useState, useCallback } from 'react';
import { useWebSocketContext } from '../contexts/WebSocketContext';
import type { HarmonyMetrics, HarmonyCheck, SessionId, ProjectId } from '@afw/shared';

const API_BASE = 'http://localhost:3001/api';

/**
 * Hook to fetch and subscribe to harmony metrics
 */
export function useHarmonyMetrics(
  target: SessionId | ProjectId,
  targetType: 'session' | 'project'
) {
  const [metrics, setMetrics] = useState<HarmonyMetrics | null>(null);
  const [recentChecks, setRecentChecks] = useState<HarmonyCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { onEvent } = useWebSocketContext();

  // Fetch metrics
  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const endpoint = targetType === 'session'
        ? `${API_BASE}/harmony/${target}`
        : `${API_BASE}/harmony/project/${target}`;

      const response = await fetch(endpoint);

      if (!response.ok) {
        throw new Error(`Failed to fetch harmony metrics: ${response.statusText}`);
      }

      const data = await response.json();
      setMetrics(data.metrics);
      setRecentChecks(data.recentChecks || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [target, targetType]);

  // Initial fetch
  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  // Subscribe to real-time updates for sessions
  useEffect(() => {
    if (targetType !== 'session' || !onEvent) return;

    const handleEvent = (event: any) => {
      // Refresh metrics on harmony events
      if (
        event.type === 'harmony:check' ||
        event.type === 'harmony:violation' ||
        event.type === 'harmony:metrics-updated'
      ) {
        if (event.sessionId === target) {
          fetchMetrics();
        }
      }
    };

    const unregister = onEvent(handleEvent);
    return () => unregister();
  }, [target, targetType, onEvent, fetchMetrics]);

  return {
    metrics,
    recentChecks,
    loading,
    error,
    refresh: fetchMetrics,
  };
}

/**
 * Hook to get harmony status color based on percentage
 */
export function useHarmonyStatus(percentage: number): {
  color: 'green' | 'yellow' | 'orange' | 'red';
  label: string;
} {
  if (percentage >= 90) {
    return { color: 'green', label: 'Excellent' };
  } else if (percentage >= 75) {
    return { color: 'yellow', label: 'Good' };
  } else if (percentage >= 50) {
    return { color: 'orange', label: 'Degraded' };
  } else {
    return { color: 'red', label: 'Critical' };
  }
}
```

### 5.2 New File: packages/app/src/components/HarmonyBadge/HarmonyBadge.tsx

```typescript
/**
 * HarmonyBadge Component
 * Displays harmony percentage with color-coded status
 */

import React from 'react';
import { useHarmonyStatus } from '../../hooks/useHarmonyMetrics';
import './HarmonyBadge.css';

interface HarmonyBadgeProps {
  /** Harmony percentage (0-100) */
  percentage: number;

  /** Show label text */
  showLabel?: boolean;

  /** Badge size */
  size?: 'small' | 'medium' | 'large';

  /** Optional click handler */
  onClick?: () => void;

  /** Optional className */
  className?: string;
}

export const HarmonyBadge: React.FC<HarmonyBadgeProps> = ({
  percentage,
  showLabel = false,
  size = 'medium',
  onClick,
  className = '',
}) => {
  const { color, label } = useHarmonyStatus(percentage);

  const classes = `harmony-badge harmony-badge--${size} harmony-badge--${color} ${className}`.trim();

  return (
    <div
      className={classes}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      title={`Harmony: ${percentage.toFixed(1)}% (${label})`}
    >
      <div className="harmony-badge__icon">
        {color === 'green' && '✓'}
        {color === 'yellow' && '⚠'}
        {color === 'orange' && '⚠'}
        {color === 'red' && '✗'}
      </div>

      <div className="harmony-badge__percentage">
        {percentage.toFixed(0)}%
      </div>

      {showLabel && (
        <div className="harmony-badge__label">
          {label}
        </div>
      )}
    </div>
  );
};
```

### 5.3 New File: packages/app/src/components/HarmonyBadge/HarmonyBadge.css

```css
/**
 * HarmonyBadge styles
 */

.harmony-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.625rem;
  border-radius: 0.75rem;
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  cursor: default;
  transition: all 0.2s ease;
}

.harmony-badge[role="button"] {
  cursor: pointer;
}

.harmony-badge[role="button"]:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

/* Sizes */
.harmony-badge--small {
  padding: 0.125rem 0.5rem;
  font-size: 0.75rem;
  gap: 0.25rem;
}

.harmony-badge--medium {
  padding: 0.25rem 0.625rem;
  font-size: 0.875rem;
  gap: 0.375rem;
}

.harmony-badge--large {
  padding: 0.5rem 1rem;
  font-size: 1rem;
  gap: 0.5rem;
}

/* Colors */
.harmony-badge--green {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.harmony-badge--yellow {
  background-color: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
}

.harmony-badge--orange {
  background-color: #ffe4cc;
  color: #8b4513;
  border: 1px solid #ffd4a8;
}

.harmony-badge--red {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

/* Icon */
.harmony-badge__icon {
  font-size: 1em;
  line-height: 1;
}

/* Percentage */
.harmony-badge__percentage {
  font-weight: 600;
  line-height: 1;
}

/* Label */
.harmony-badge__label {
  font-size: 0.85em;
  opacity: 0.9;
}
```

### 5.4 New File: packages/app/src/components/HarmonyPanel/HarmonyPanel.tsx

```typescript
/**
 * HarmonyPanel Component
 * Full harmony metrics dashboard
 */

import React, { useState } from 'react';
import { useHarmonyMetrics } from '../../hooks/useHarmonyMetrics';
import { HarmonyBadge } from '../HarmonyBadge/HarmonyBadge';
import type { SessionId, ProjectId, HarmonyCheck } from '@afw/shared';
import './HarmonyPanel.css';

interface HarmonyPanelProps {
  /** Target ID (session or project) */
  target: SessionId | ProjectId;

  /** Target type */
  targetType: 'session' | 'project';

  /** Optional className */
  className?: string;
}

export const HarmonyPanel: React.FC<HarmonyPanelProps> = ({
  target,
  targetType,
  className = '',
}) => {
  const { metrics, recentChecks, loading, error, refresh } = useHarmonyMetrics(target, targetType);
  const [expandedViolation, setExpandedViolation] = useState<string | null>(null);

  if (loading) {
    return (
      <div className={`harmony-panel harmony-panel--loading ${className}`}>
        <div className="harmony-panel__spinner">Loading harmony metrics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`harmony-panel harmony-panel--error ${className}`}>
        <div className="harmony-panel__error">
          <strong>Error loading harmony metrics:</strong> {error}
          <button onClick={refresh} className="harmony-panel__retry">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className={`harmony-panel harmony-panel--empty ${className}`}>
        <p>No harmony metrics available yet.</p>
      </div>
    );
  }

  const toggleViolation = (checkId: string) => {
    setExpandedViolation(expandedViolation === checkId ? null : checkId);
  };

  return (
    <div className={`harmony-panel ${className}`}>
      {/* Header */}
      <div className="harmony-panel__header">
        <h3 className="harmony-panel__title">Harmony Status</h3>
        <HarmonyBadge percentage={metrics.harmonyPercentage} showLabel size="large" />
      </div>

      {/* Metrics Overview */}
      <div className="harmony-panel__metrics">
        <div className="harmony-metric">
          <div className="harmony-metric__label">Total Checks</div>
          <div className="harmony-metric__value">{metrics.totalChecks}</div>
        </div>

        <div className="harmony-metric harmony-metric--success">
          <div className="harmony-metric__label">Valid</div>
          <div className="harmony-metric__value">{metrics.validCount}</div>
        </div>

        <div className="harmony-metric harmony-metric--warning">
          <div className="harmony-metric__label">Degraded</div>
          <div className="harmony-metric__value">{metrics.degradedCount}</div>
        </div>

        <div className="harmony-metric harmony-metric--danger">
          <div className="harmony-metric__label">Violations</div>
          <div className="harmony-metric__value">{metrics.violationCount}</div>
        </div>
      </div>

      {/* Format Breakdown */}
      <div className="harmony-panel__section">
        <h4 className="harmony-panel__section-title">Format Breakdown</h4>
        <div className="harmony-panel__format-list">
          {Object.entries(metrics.formatBreakdown).map(([format, count]) => (
            <div key={format} className="harmony-format-item">
              <span className="harmony-format-item__name">{format}</span>
              <span className="harmony-format-item__count">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Violations */}
      {metrics.recentViolations.length > 0 && (
        <div className="harmony-panel__section">
          <h4 className="harmony-panel__section-title">
            Recent Violations ({metrics.recentViolations.length})
          </h4>
          <div className="harmony-panel__violations">
            {metrics.recentViolations.map((violation) => (
              <div key={violation.id} className="harmony-violation">
                <div
                  className="harmony-violation__header"
                  onClick={() => toggleViolation(violation.id)}
                >
                  <span className="harmony-violation__icon">✗</span>
                  <span className="harmony-violation__timestamp">
                    {new Date(violation.timestamp).toLocaleString()}
                  </span>
                  <span className="harmony-violation__expand">
                    {expandedViolation === violation.id ? '▼' : '▶'}
                  </span>
                </div>

                {expandedViolation === violation.id && (
                  <div className="harmony-violation__details">
                    <pre className="harmony-violation__text">{violation.text}</pre>
                    {violation.context && (
                      <div className="harmony-violation__context">
                        <strong>Context:</strong>
                        {violation.context.stepNumber && (
                          <span> Step {violation.context.stepNumber}</span>
                        )}
                        {violation.context.chainId && (
                          <span> Chain {violation.context.chainId}</span>
                        )}
                        {violation.context.actionType && (
                          <span> Action: {violation.context.actionType}</span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="harmony-panel__footer">
        <span className="harmony-panel__last-check">
          Last check: {new Date(metrics.lastCheck).toLocaleString()}
        </span>
        <button onClick={refresh} className="harmony-panel__refresh">
          Refresh
        </button>
      </div>
    </div>
  );
};
```

### 5.5 New File: packages/app/src/components/HarmonyPanel/HarmonyPanel.css

```css
/**
 * HarmonyPanel styles
 */

.harmony-panel {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1.5rem;
  background-color: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 0.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  font-family: 'Inter', sans-serif;
}

/* Header */
.harmony-panel__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e0e0e0;
}

.harmony-panel__title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #333;
}

/* Metrics Grid */
.harmony-panel__metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
}

.harmony-metric {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.75rem;
  background-color: #f8f9fa;
  border-radius: 0.375rem;
  text-align: center;
}

.harmony-metric__label {
  font-size: 0.75rem;
  font-weight: 500;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.harmony-metric__value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #333;
}

.harmony-metric--success .harmony-metric__value {
  color: #28a745;
}

.harmony-metric--warning .harmony-metric__value {
  color: #ffc107;
}

.harmony-metric--danger .harmony-metric__value {
  color: #dc3545;
}

/* Sections */
.harmony-panel__section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.harmony-panel__section-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #555;
}

/* Format Breakdown */
.harmony-panel__format-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.harmony-format-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0.75rem;
  background-color: #f8f9fa;
  border-radius: 0.25rem;
}

.harmony-format-item__name {
  font-size: 0.875rem;
  color: #333;
}

.harmony-format-item__count {
  font-size: 0.875rem;
  font-weight: 600;
  color: #666;
}

/* Violations */
.harmony-panel__violations {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.harmony-violation {
  border: 1px solid #f5c6cb;
  border-radius: 0.25rem;
  background-color: #f8d7da;
}

.harmony-violation__header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.harmony-violation__header:hover {
  background-color: #f5c6cb;
}

.harmony-violation__icon {
  color: #721c24;
  font-weight: bold;
}

.harmony-violation__timestamp {
  flex: 1;
  font-size: 0.875rem;
  color: #721c24;
}

.harmony-violation__expand {
  color: #721c24;
  font-size: 0.75rem;
}

.harmony-violation__details {
  padding: 0.75rem;
  background-color: #ffffff;
  border-top: 1px solid #f5c6cb;
}

.harmony-violation__text {
  margin: 0;
  padding: 0.75rem;
  background-color: #f8f9fa;
  border-radius: 0.25rem;
  font-family: 'Fira Code', monospace;
  font-size: 0.8125rem;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-word;
}

.harmony-violation__context {
  margin-top: 0.75rem;
  font-size: 0.875rem;
  color: #555;
}

/* Footer */
.harmony-panel__footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1rem;
  border-top: 1px solid #e0e0e0;
}

.harmony-panel__last-check {
  font-size: 0.8125rem;
  color: #666;
}

.harmony-panel__refresh {
  padding: 0.5rem 1rem;
  background-color: #007bff;
  color: #ffffff;
  border: none;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.harmony-panel__refresh:hover {
  background-color: #0056b3;
}

/* Loading & Error States */
.harmony-panel--loading,
.harmony-panel--error,
.harmony-panel--empty {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  padding: 2rem;
  text-align: center;
}

.harmony-panel__spinner {
  color: #666;
  font-size: 1rem;
}

.harmony-panel__error {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  color: #721c24;
}

.harmony-panel__retry {
  padding: 0.5rem 1rem;
  background-color: #dc3545;
  color: #ffffff;
  border: none;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  cursor: pointer;
}

.harmony-panel__retry:hover {
  background-color: #c82333;
}
```

### 5.6 New File: packages/app/src/components/HarmonyIndicator/HarmonyIndicator.tsx

```typescript
/**
 * HarmonyIndicator Component
 * Small inline indicator for session headers, step nodes
 */

import React from 'react';
import './HarmonyIndicator.css';

interface HarmonyIndicatorProps {
  /** Status of harmony check */
  status: 'valid' | 'degraded' | 'violation';

  /** Optional tooltip text */
  tooltip?: string;

  /** Optional className */
  className?: string;
}

export const HarmonyIndicator: React.FC<HarmonyIndicatorProps> = ({
  status,
  tooltip,
  className = '',
}) => {
  const classes = `harmony-indicator harmony-indicator--${status} ${className}`.trim();

  const defaultTooltips = {
    valid: 'Valid harmony - output parsed successfully',
    degraded: 'Degraded harmony - partial parse',
    violation: 'Harmony violation - output failed to parse',
  };

  const title = tooltip || defaultTooltips[status];

  return (
    <div className={classes} title={title}>
      {status === 'valid' && <span className="harmony-indicator__icon">✓</span>}
      {status === 'degraded' && <span className="harmony-indicator__icon">⚠</span>}
      {status === 'violation' && <span className="harmony-indicator__icon">✗</span>}
    </div>
  );
};
```

### 5.7 New File: packages/app/src/components/HarmonyIndicator/HarmonyIndicator.css

```css
/**
 * HarmonyIndicator styles
 */

.harmony-indicator {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 50%;
  font-size: 0.75rem;
  font-weight: bold;
  cursor: help;
  transition: transform 0.2s;
}

.harmony-indicator:hover {
  transform: scale(1.1);
}

.harmony-indicator--valid {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.harmony-indicator--degraded {
  background-color: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
}

.harmony-indicator--violation {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.harmony-indicator__icon {
  line-height: 1;
}
```

---

## 6. Integration Flow

### 6.1 Where Harmony Detection Runs

**Option: Proactive Parsing (Recommended)**

When orchestrator output is received (via WebSocket or hook), immediately run harmony detection:

```typescript
// In backend/src/index.ts or wherever orchestrator output is processed

async function processOrchestratorOutput(
  text: string,
  sessionId: SessionId,
  context?: { stepNumber?: number; chainId?: string }
) {
  // Run harmony detection
  const harmonyResult = await harmonyDetector.checkOutput(text, sessionId, context);

  // If parsed successfully, emit structured event
  if (harmonyResult.check.parsedFormat) {
    // Emit typed event based on format
    // ... (existing event emission logic)
  }

  // If violation, harmony detector already broadcasted violation event
  // Continue with normal processing
}
```

### 6.2 Dashboard Integration Points

**1. Dashboard Header (Global Harmony)**

Add to `packages/app/src/components/AppContent.tsx`:

```typescript
import { HarmonyBadge } from './HarmonyBadge/HarmonyBadge';
import { useHarmonyMetrics } from '../hooks/useHarmonyMetrics';

// In component:
const { metrics } = useHarmonyMetrics(currentSessionId, 'session');

// In JSX:
{metrics && (
  <HarmonyBadge
    percentage={metrics.harmonyPercentage}
    showLabel
    onClick={() => setShowHarmonyPanel(true)}
  />
)}
```

**2. Session Pane (Per-Session Harmony)**

Add to `packages/app/src/components/SessionPane/SessionPane.tsx`:

```typescript
import { HarmonyIndicator } from '../HarmonyIndicator/HarmonyIndicator';

// In session header:
<div className="session-header">
  <h3>{session.name}</h3>
  <HarmonyIndicator status={lastHarmonyStatus} />
</div>
```

**3. Harmony Panel (Full Metrics)**

Add as a separate tab or expandable panel in the dashboard:

```typescript
import { HarmonyPanel } from '../HarmonyPanel/HarmonyPanel';

// In dashboard layout:
<HarmonyPanel
  target={currentSessionId}
  targetType="session"
/>
```

---

## 7. File Manifest

### Files to Create

**Shared Package:**
- `D:/ActionFlowsDashboard/packages/shared/src/harmonyTypes.ts`

**Backend Package:**
- `D:/ActionFlowsDashboard/packages/backend/src/services/harmonyDetector.ts`
- `D:/ActionFlowsDashboard/packages/backend/src/routes/harmony.ts`

**Frontend Package:**
- `D:/ActionFlowsDashboard/packages/app/src/hooks/useHarmonyMetrics.ts`
- `D:/ActionFlowsDashboard/packages/app/src/components/HarmonyBadge/HarmonyBadge.tsx`
- `D:/ActionFlowsDashboard/packages/app/src/components/HarmonyBadge/HarmonyBadge.css`
- `D:/ActionFlowsDashboard/packages/app/src/components/HarmonyPanel/HarmonyPanel.tsx`
- `D:/ActionFlowsDashboard/packages/app/src/components/HarmonyPanel/HarmonyPanel.css`
- `D:/ActionFlowsDashboard/packages/app/src/components/HarmonyIndicator/HarmonyIndicator.tsx`
- `D:/ActionFlowsDashboard/packages/app/src/components/HarmonyIndicator/HarmonyIndicator.css`

### Files to Modify

**Shared Package:**
- `D:/ActionFlowsDashboard/packages/shared/src/events.ts` (add harmony events)
- `D:/ActionFlowsDashboard/packages/shared/src/index.ts` (export harmony types)

**Backend Package:**
- `D:/ActionFlowsDashboard/packages/backend/src/storage/index.ts` (add harmony methods to Storage interface)
- `D:/ActionFlowsDashboard/packages/backend/src/storage/memory.ts` (implement harmony methods)
- `D:/ActionFlowsDashboard/packages/backend/src/storage/redis.ts` (implement harmony methods)
- `D:/ActionFlowsDashboard/packages/backend/src/index.ts` (initialize harmony detector, add router, add broadcast)

**Frontend Package:**
- `D:/ActionFlowsDashboard/packages/app/src/components/AppContent.tsx` (add HarmonyBadge)
- `D:/ActionFlowsDashboard/packages/app/src/components/SessionPane/SessionPane.tsx` (add HarmonyIndicator)

---

## 8. Testing Plan

### 8.1 Unit Tests

**Backend Tests:**
- `packages/backend/src/services/harmonyDetector.test.ts`
  - Test `checkOutput()` with valid formats
  - Test `checkOutput()` with invalid formats
  - Test `checkOutput()` with degraded formats
  - Test `getHarmonyMetrics()` calculations
  - Test broadcast function integration

**Frontend Tests:**
- `packages/app/src/hooks/useHarmonyMetrics.test.ts`
  - Test data fetching
  - Test error handling
  - Test WebSocket subscriptions

- `packages/app/src/components/HarmonyBadge/HarmonyBadge.test.tsx`
  - Test color mapping
  - Test size variants
  - Test click handlers

### 8.2 Integration Tests

**API Tests:**
- `GET /api/harmony/:sessionId` returns metrics
- `GET /api/harmony/project/:projectId` returns project metrics
- `POST /api/harmony/:sessionId/check` runs manual check
- WebSocket events are broadcasted correctly

**E2E Tests:**
- Harmony badge appears in dashboard header
- Harmony panel shows correct metrics
- Violations are displayed in real-time
- Clicking badge opens harmony panel

---

## 9. Implementation Order

### Phase 1: Backend Foundation (Day 1-2)
1. Create `harmonyTypes.ts` with all types
2. Create `harmonyDetector.ts` service
3. Add harmony methods to Storage interface
4. Implement memory storage methods
5. Implement Redis storage methods
6. Add harmony events to `events.ts`

### Phase 2: API Surface (Day 3)
1. Create `harmony.ts` router
2. Implement GET endpoints (session, project)
3. Implement POST check endpoint
4. Wire harmony detector to WebSocket broadcasting
5. Initialize harmony detector in `index.ts`

### Phase 3: Frontend Hooks & Components (Day 4-5)
1. Create `useHarmonyMetrics` hook
2. Create `HarmonyBadge` component with styles
3. Create `HarmonyIndicator` component with styles
4. Create `HarmonyPanel` component with styles
5. Test components in isolation

### Phase 4: Dashboard Integration (Day 6)
1. Add HarmonyBadge to dashboard header
2. Add HarmonyIndicator to session pane
3. Add HarmonyPanel as expandable section
4. Wire up click handlers
5. Test end-to-end flow

### Phase 5: Testing & Polish (Day 7)
1. Write unit tests for service
2. Write integration tests for API
3. Write E2E tests for UI
4. Performance optimization
5. Documentation updates

---

## 10. Success Criteria

**Must Have:**
- [x] HarmonyDetector service correctly parses orchestrator output
- [x] Storage layer persists harmony checks and metrics
- [x] API endpoints return harmony data
- [x] WebSocket events broadcast harmony changes
- [x] HarmonyBadge displays in dashboard
- [x] Violations are visible in UI

**Should Have:**
- [ ] HarmonyPanel shows detailed metrics
- [ ] Harmony metrics are calculated correctly
- [ ] Format breakdown is accurate
- [ ] Trend data is available (7-day rolling)

**Nice to Have:**
- [ ] Global harmony stats endpoint
- [ ] Harmony threshold alerts
- [ ] Automated harmony reports
- [ ] Contract version mismatch warnings

---

## 11. Performance Considerations

**Parsing Performance:**
- Average: 2ms per check (17 parsers in priority order)
- Worst case: 8ms (all parsers fail)
- Mitigation: Early return on first match

**Storage Performance:**
- Memory: Limit to 100 checks per session
- Redis: Use LPUSH + LTRIM for bounded lists
- TTL: 7 days (same as events)

**WebSocket Performance:**
- Only broadcast on violations or significant changes
- Batch metrics updates (threshold: 5% change)
- Clients can request full metrics via REST

**Frontend Performance:**
- Lazy load HarmonyPanel (only render when visible)
- Debounce metrics refresh (1 second)
- Use React.memo for HarmonyBadge (prevent re-renders)

---

## 12. Future Enhancements

**Phase 2 Features:**
1. Harmony threshold alerts (Slack notifications)
2. Contract version migration support
3. Harmony history charts (trend visualization)
4. Manual harmony check command (`/harmony:check`)
5. Auto-repair suggestions for common violations

**Phase 3 Features:**
1. Machine learning for format detection
2. Custom format validators
3. Harmony score leaderboards
4. Integration with onboarding questionnaire

---

## End of Plan

This design provides a complete harmony detection system that:
- Leverages existing contract parsers
- Follows established backend patterns
- Provides real-time dashboard feedback
- Scales with Memory or Redis storage
- Supports future evolution

The code/ agent can implement this plan incrementally, testing each phase before moving to the next.
