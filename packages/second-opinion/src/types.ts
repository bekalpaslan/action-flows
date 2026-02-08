/**
 * Type definitions for the Second Opinion system
 *
 * NOTE: This system is designed with a future post-action hook pattern in mind.
 * See PostActionHook interface below -- SecondOpinionRunner could be generalized
 * to a framework-level hook system where multiple post-action hooks can be registered.
 */

// ============================================================================
// Ollama Client Types
// ============================================================================

export interface OllamaClientConfig {
  baseUrl: string; // default: "http://localhost:11434"
  defaultTimeoutMs: number; // default: 120_000
}

export interface OllamaGenerateRequest {
  model: string;
  prompt: string;
  system?: string;
  options?: {
    temperature?: number;
    num_predict?: number; // max tokens
    top_p?: number;
    stop?: string[];
  };
  stream?: boolean; // default: false for simplicity
}

export interface OllamaGenerateResponse {
  model: string;
  response: string;
  done: boolean;
  total_duration: number; // nanoseconds
  load_duration: number;
  prompt_eval_count: number;
  eval_count: number;
  eval_duration: number;
}

export interface OllamaModel {
  name: string;
  size: number;
  digest: string;
  modified_at: string;
}

export interface OllamaHealthCheck {
  available: boolean;
  models: string[];
  latencyMs: number;
}

// ============================================================================
// Second Opinion Configuration
// ============================================================================

export interface SecondOpinionModelConfig {
  primary: string; // e.g., "qwen2.5-coder:32b"
  fallbacks: string[]; // e.g., ["qwen2.5-coder:7b", "gemma3:4b"]
  maxTokens: number; // Max response tokens
  temperature: number; // Typically 0.3 for analytical tasks
  timeoutMs: number; // Per-model timeout
}

export type ActionType = 'review' | 'audit' | 'analyze' | 'plan' | 'code' | 'test' | 'commit';

// ============================================================================
// Second Opinion Request & Result
// ============================================================================

export interface SecondOpinionRequest {
  actionType: ActionType;
  originalInput: string; // What was being reviewed/analyzed
  claudeOutput: string; // Claude's output to critique
  modelOverride?: string; // Optional model override
}

export interface StructuredCritique {
  missedIssues: CritiqueIssue[];
  disagreements: CritiqueDisagreement[];
  strongAgreements: CritiqueAgreement[];
  additionalObservations: string[];
  confidenceScore: 'HIGH' | 'MEDIUM' | 'LOW';
  confidenceReason: string;
  rawResponse: string; // Full unstructured response from model
}

export interface CritiqueIssue {
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  location?: string; // file:line if applicable
}

export interface CritiqueDisagreement {
  originalFinding: string;
  reason: string;
}

export interface CritiqueAgreement {
  originalFinding: string;
  additionalEvidence: string;
}

export interface RunMetadata {
  modelUsed: string;
  latencyMs: number;
  promptTokens: number;
  responseTokens: number;
  fallbackUsed: boolean;
  timestamp: string;
}

export type SkipReason =
  | 'ollama_unavailable'
  | 'no_model_available'
  | 'timeout'
  | 'generation_error'
  | 'ineligible_action';

export type SecondOpinionResult =
  | {
      skipped: false;
      critique: StructuredCritique;
      metadata: RunMetadata;
    }
  | {
      skipped: true;
      reason: SkipReason;
      error?: string;
    };

// ============================================================================
// Future: Post-Action Hook Pattern
// ============================================================================

/**
 * DESIGN NOTE: Post-Action Hook Pattern
 *
 * This interface defines a generalized pattern for post-action processing.
 * The SecondOpinionRunner is designed to implement (or be easily adaptable to)
 * this interface for future framework-level hook system integration.
 *
 * Concept:
 * - Multiple hooks can be registered per action type
 * - Each hook decides whether to run based on context
 * - Hooks run sequentially or in parallel after action completes
 * - Hook failures never block the primary workflow
 *
 * Example future hooks:
 * - SecondOpinionHook (this system)
 * - QualityMetricsHook (collect quality metrics)
 * - NotificationHook (Slack/Discord notifications)
 * - AnalyticsHook (usage tracking)
 */
export interface PostActionHookContext {
  actionType: ActionType;
  actionInput: string;
  actionOutput: string;
  actionMetadata: Record<string, unknown>;
}

export interface PostActionHookResult {
  hookName: string;
  success: boolean;
  output?: unknown;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface PostActionHook {
  name: string;
  shouldRun(context: PostActionHookContext): boolean;
  run(context: PostActionHookContext): Promise<PostActionHookResult>;
}

/**
 * SecondOpinionRunner will implement this interface in a future refactor:
 *
 * class SecondOpinionHook implements PostActionHook {
 *   name = 'second-opinion';
 *   shouldRun(context) { return isEligibleAction(context.actionType); }
 *   async run(context) { ... }
 * }
 */
