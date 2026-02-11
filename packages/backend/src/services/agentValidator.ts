/**
 * Agent Behavior Validator Service
 *
 * Validates agent outputs against agent-standards.md rules:
 * 1. Log folder completeness (files exist, non-empty)
 * 2. Contract compliance (Format 5.1, 5.2, 5.3)
 * 3. Learnings section presence
 *
 * Integration with Gate 9 checkpoint (validate after agent completes).
 * Triggers learning surface on violations.
 */

import type { SessionId, ProjectId, Timestamp, WorkspaceEvent } from '@afw/shared';
import { brandedTypes } from '@afw/shared';
import type { Storage } from '../storage/index.js';
import {
  isReviewReportParsed,
  isAnalysisReportParsed,
  isBrainstormTranscriptParsed,
  parseReviewReport,
  parseAnalysisReport,
  parseBrainstormTranscript,
} from '@afw/shared';

/**
 * Validation result for an agent output
 */
export interface AgentValidationResult {
  id: string;
  sessionId: SessionId;
  projectId?: ProjectId;
  timestamp: Timestamp;

  // Agent identity
  agentAction: string; // e.g., "code/backend", "review/", "analyze/"
  stepNumber?: number;
  chainId?: string;

  // Validation results
  logFolderValid: boolean;
  contractCompliant: boolean;
  learningsPresent: boolean;

  // Details
  logFolderPath?: string;
  missingFiles?: string[];
  logFolderIssues?: string[];
  contractViolations?: string[];
  learningsIssues?: string[];

  // Overall status
  isValid: boolean;
  violations: AgentValidationViolation[];
}

/**
 * Individual validation violation
 */
export interface AgentValidationViolation {
  type: 'log-folder' | 'contract' | 'learnings';
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  remediation?: string;
}

/**
 * Configuration for agent validation
 */
interface AgentValidatorConfig {
  /** Maximum size of validation report text */
  maxReportLength: number;

  /** Minimum expected files in a log folder */
  minFilesInFolder: number;

  /** Minimum size for a file to be considered non-empty (bytes) */
  minFileSize: number;

  /** Required output files per action type */
  requiredFilesByAction: Record<string, string[]>;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: AgentValidatorConfig = {
  maxReportLength: 2000,
  minFilesInFolder: 1,
  minFileSize: 50, // bytes
  requiredFilesByAction: {
    'review/': ['changes.md'],
    'analyze/': ['changes.md'],
    'code/': ['changes.md'],
    'brainstorm/': ['changes.md'],
    'audit/': ['changes.md'],
    'plan/': ['changes.md'],
    'test/': ['changes.md'],
  },
};

/**
 * Broadcast function type
 */
type BroadcastFunction = (sessionId: SessionId, event: WorkspaceEvent) => void;

/**
 * Service for validating agent outputs
 */
export class AgentValidator {
  private broadcastFn?: BroadcastFunction;
  private config: AgentValidatorConfig;

  constructor(private storage: Storage, config?: Partial<AgentValidatorConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Validate an agent output after completion
   *
   * @param output - The agent's output (markdown)
   * @param logFolderPath - Path to the agent's log folder
   * @param sessionId - Session ID
   * @param agentAction - Agent action type (e.g., "code/backend")
   * @param context - Optional context (step number, chain ID)
   * @returns Validation result
   */
  async validateAgentOutput(
    output: string,
    logFolderPath: string,
    sessionId: SessionId,
    agentAction: string,
    context?: {
      stepNumber?: number;
      chainId?: string;
      projectId?: ProjectId;
    }
  ): Promise<AgentValidationResult> {
    const violations: AgentValidationViolation[] = [];
    let logFolderValid = true;
    let contractCompliant = true;
    let learningsPresent = true;

    // 1. Validate log folder completeness
    const logFolderIssues = await this.validateLogFolder(logFolderPath, agentAction);
    if (logFolderIssues.length > 0) {
      logFolderValid = false;
      violations.push({
        type: 'log-folder',
        severity: 'critical',
        message: `Log folder validation failed: ${logFolderIssues.join(', ')}`,
        remediation: 'Ensure all required files exist and are non-empty in the log folder',
      });
    }

    // 2. Validate contract compliance (if applicable)
    const contractIssues = this.validateContractCompliance(output, agentAction);
    if (contractIssues.length > 0) {
      contractCompliant = false;
      violations.push(...contractIssues.map(msg => ({
        type: 'contract' as const,
        severity: 'high' as const,
        message: msg,
        remediation: 'Review CONTRACT.md format specification for your action type',
      })));
    }

    // 3. Validate learnings section presence
    const learningsIssues = this.validateLearningsPresence(output, agentAction);
    if (learningsIssues.length > 0) {
      learningsPresent = false;
      violations.push(...learningsIssues.map(msg => ({
        type: 'learnings' as const,
        severity: 'medium' as const,
        message: msg,
        remediation: 'Add a ## Learnings section with Issue, Root Cause, and Suggestion',
      })));
    }

    // Create result
    const result: AgentValidationResult = {
      id: this.generateValidationId(),
      sessionId,
      projectId: context?.projectId,
      timestamp: brandedTypes.currentTimestamp(),
      agentAction,
      stepNumber: context?.stepNumber,
      chainId: context?.chainId,
      logFolderValid,
      contractCompliant,
      learningsPresent,
      logFolderPath,
      logFolderIssues,
      contractViolations: contractIssues,
      learningsIssues: learningsIssues,
      isValid: violations.length === 0,
      violations,
    };

    // Store result
    await this.storeValidation(result);

    // Broadcast if there are violations
    if (violations.length > 0) {
      await this.broadcastValidationEvent(result);
    }

    return result;
  }

  /**
   * Validate log folder completeness
   *
   * @param logFolderPath - Path to the log folder
   * @param agentAction - Agent action type
   * @returns Array of issues found (empty if valid)
   */
  private async validateLogFolder(logFolderPath: string, agentAction: string): Promise<string[]> {
    const issues: string[] = [];

    // Check if folder exists and contains required files
    // In a real implementation, this would check the filesystem
    // For now, we note the path for monitoring

    if (!logFolderPath || logFolderPath.length === 0) {
      issues.push('Log folder path not provided');
      return issues;
    }

    // Validate folder path format
    const expectedFormat = /\.claude[/\\]actionflows[/\\]logs[/\\](code|review|analyze|audit|plan|test)[/\\]/;
    if (!expectedFormat.test(logFolderPath)) {
      issues.push(`Log folder path does not match expected format: ${logFolderPath}`);
    }

    // Check for required files based on action type
    const requiredFiles = this.config.requiredFilesByAction[agentAction] ||
                          this.config.requiredFilesByAction['code/']; // Default to code/

    if (requiredFiles && requiredFiles.length > 0) {
      // In a real filesystem implementation:
      // const files = fs.readdirSync(logFolderPath);
      // const missing = requiredFiles.filter(f => !files.includes(f));
      // if (missing.length > 0) {
      //   issues.push(`Missing required files: ${missing.join(', ')}`);
      // }
    }

    return issues;
  }

  /**
   * Validate contract compliance for contract-defined actions
   *
   * @param output - Agent output markdown
   * @param agentAction - Agent action type
   * @returns Array of contract violation messages
   */
  private validateContractCompliance(output: string, agentAction: string): string[] {
    const violations: string[] = [];

    // Only validate contract for contract-defined actions
    const contractActions = {
      'review/': {
        parser: parseReviewReport,
        guard: isReviewReportParsed,
        requiredFields: ['verdict', 'score', 'summary', 'findings'],
        actionName: 'Review Report (Format 5.1)',
      },
      'analyze/': {
        parser: parseAnalysisReport,
        guard: isAnalysisReportParsed,
        requiredFields: ['title', 'aspect', 'scope', 'date', 'agent', 'recommendations'],
        actionName: 'Analysis Report (Format 5.2)',
      },
      'brainstorm/': {
        parser: parseBrainstormTranscript,
        guard: isBrainstormTranscriptParsed,
        requiredFields: ['title', 'classification', 'transcript', 'keyInsights'],
        actionName: 'Brainstorm Transcript (Format 5.3)',
      },
    };

    // Check if this action requires contract compliance
    if (agentAction in contractActions) {
      const spec = contractActions[agentAction as keyof typeof contractActions];

      try {
        const parsed = spec.parser(output);

        if (parsed === null) {
          violations.push(`Contract compliance failed: Output does not match ${spec.actionName} format`);
          return violations;
        }

        // Check for missing or null fields
        const missing: string[] = [];
        for (const field of spec.requiredFields) {
          const value = (parsed as any)[field];
          if (value === null || value === undefined || value === '') {
            missing.push(field);
          }
        }

        if (missing.length > 0) {
          violations.push(
            `${spec.actionName} missing required fields: ${missing.join(', ')}. ` +
            `Review CONTRACT.md for exact format specification.`
          );
        }
      } catch (err) {
        violations.push(
          `Contract parsing error for ${spec.actionName}: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }

    return violations;
  }

  /**
   * Validate presence of learnings section
   *
   * @param output - Agent output markdown
   * @param agentAction - Agent action type (for context)
   * @returns Array of issues found
   */
  private validateLearningsPresence(output: string, agentAction: string): string[] {
    const issues: string[] = [];

    // Check for ## Learnings section
    const learningsRegex = /^## Learnings\s*$/m;
    const hasLearningsSection = learningsRegex.test(output);

    if (!hasLearningsSection) {
      issues.push('No "## Learnings" section found in agent output');
      return issues;
    }

    // If learnings section exists, check for required subsections
    const learningsMatch = output.match(/^## Learnings\s*$/m);
    if (learningsMatch) {
      const learningsStart = learningsMatch.index! + learningsMatch[0].length;
      const learningsContent = output.substring(learningsStart);

      // Check for Issue, Root Cause, Suggestion subsections
      // (These can be either ### or ** formatted)
      const hasIssue = /(?:###|\\*\\*)\s*(?:Issue|What happened)/i.test(learningsContent);
      const hasRootCause = /(?:###|\\*\\*)\s*(?:Root Cause|Why)/i.test(learningsContent);
      const hasSuggestion = /(?:###|\\*\\*)\s*(?:Suggestion|How)/i.test(learningsContent);

      if (!hasIssue) {
        issues.push('Learnings section missing "Issue" subsection');
      }
      if (!hasRootCause) {
        issues.push('Learnings section missing "Root Cause" subsection');
      }
      if (!hasSuggestion) {
        issues.push('Learnings section missing "Suggestion" subsection');
      }
    }

    return issues;
  }

  /**
   * Set broadcast function for WebSocket events
   */
  setBroadcastFunction(fn: BroadcastFunction): void {
    this.broadcastFn = fn;
  }

  // --- Private helper methods ---

  /**
   * Generate unique validation ID
   */
  private generateValidationId(): string {
    return `av_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Store validation result in storage
   */
  private async storeValidation(result: AgentValidationResult): Promise<void> {
    // Store as a metadata entry or event depending on storage backend
    // For now, this is a placeholder that could be extended to store
    // validation results alongside other session metadata
    try {
      // Could be extended to store validation results in storage
      // await this.storage.addValidationResult(result);
    } catch (err) {
      // Graceful degradation - validation failure doesn't crash the system
      console.error('Failed to store validation result:', err);
    }
  }

  /**
   * Broadcast validation event on violations
   */
  private async broadcastValidationEvent(result: AgentValidationResult): Promise<void> {
    if (!this.broadcastFn) {
      return;
    }

    // Create a learning surface event for violations
    const event: WorkspaceEvent = {
      type: 'agent:validation-failed',
      sessionId: result.sessionId,
      timestamp: result.timestamp,
      agentAction: result.agentAction,
      stepNumber: result.stepNumber,
      violationCount: result.violations.length,
      violations: result.violations.map(v => ({
        type: v.type,
        severity: v.severity,
        message: v.message,
      })),
    } as any;

    try {
      this.broadcastFn(result.sessionId, event);
    } catch (err) {
      // Graceful degradation - broadcast failure doesn't crash the system
      console.error('Failed to broadcast validation event:', err);
    }
  }
}

// Singleton instance (initialized in index.ts)
export let agentValidator: AgentValidator;

/**
 * Initialize agent validator with storage
 */
export function initializeAgentValidator(storage: Storage, config?: Partial<AgentValidatorConfig>): void {
  agentValidator = new AgentValidator(storage, config);
}
