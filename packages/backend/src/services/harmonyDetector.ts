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
} from '@afw/shared';
import {
  parseOrchestratorOutput,
  CONTRACT_VERSION,
  isChainCompilationParsed,
  isChainExecutionStartParsed,
  isChainStatusUpdateParsed,
  isExecutionCompleteParsed,
  isStepCompletionParsed,
  isDualOutputParsed,
  isSecondOpinionSkipParsed,
  isHumanGateParsed,
  isLearningSurfaceParsed,
  isSessionStartProtocolParsed,
  isRegistryUpdateParsed,
  isIndexEntryParsed,
  isLearningEntryParsed,
  isReviewReportParsed,
  isAnalysisReportParsed,
  isBrainstormTranscriptParsed,
  isErrorAnnouncementParsed,
  isContextRoutingParsed,
} from '@afw/shared';
import { brandedTypes } from '@afw/shared';
import type { Storage } from '../storage/index.js';

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
   * Uses type guard functions to reliably identify formats
   */
  private getFormatName(parsed: any): string {
    // Check in order of specificity, checking for distinctive field combinations first
    // This prevents ambiguous matches (e.g., multiple formats checking 'title')

    // Chain formats (distinctive step/changes/logsPath fields)
    if (isChainExecutionStartParsed(parsed)) return 'ChainExecutionStart';
    if (isChainStatusUpdateParsed(parsed)) return 'ChainStatusUpdate';
    if (isExecutionCompleteParsed(parsed)) return 'ExecutionComplete';
    if (isChainCompilationParsed(parsed)) return 'ChainCompilation';

    // Step formats (distinctive output/skip/nextStep fields)
    if (isDualOutputParsed(parsed)) return 'DualOutput';
    if (isSecondOpinionSkipParsed(parsed)) return 'SecondOpinionSkip';
    if (isStepCompletionParsed(parsed)) return 'StepCompletion';

    // Human interaction formats (distinctive prompt/issue/protocol fields)
    if (isLearningSurfaceParsed(parsed)) return 'LearningSurface';
    if (isHumanGateParsed(parsed)) return 'HumanGate';
    if (isSessionStartProtocolParsed(parsed)) return 'SessionStartProtocol';

    // Registry formats (distinctive pattern/actionType/line fields)
    if (isIndexEntryParsed(parsed)) return 'IndexEntry';
    if (isLearningEntryParsed(parsed)) return 'LearningEntry';
    if (isRegistryUpdateParsed(parsed)) return 'RegistryUpdate';

    // Action output formats (distinctive findings/ideas/sections fields)
    if (isReviewReportParsed(parsed)) return 'ReviewReport';
    if (isAnalysisReportParsed(parsed)) return 'AnalysisReport';
    if (isBrainstormTranscriptParsed(parsed)) return 'BrainstormTranscript';

    // Error and routing formats
    if (isErrorAnnouncementParsed(parsed)) return 'ErrorAnnouncement';
    if (isContextRoutingParsed(parsed)) return 'ContextRouting';

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
    } as any;
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
    } as any;
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
      } as any;
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
