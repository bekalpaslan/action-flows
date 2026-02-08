/**
 * Second Opinion System - Public API
 *
 * A standalone utility for getting second opinions from local Ollama models
 * on ActionFlows agent outputs.
 */

// ============================================================================
// Core Classes
// ============================================================================

export { OllamaClient, OllamaError, OllamaUnavailableError, OllamaTimeoutError, OllamaModelNotFoundError } from './ollama-client.js';
export { SecondOpinionRunner } from './second-opinion.js';

// ============================================================================
// Configuration
// ============================================================================

export {
  MODEL_CONFIGS,
  INELIGIBLE_ACTIONS,
  ELIGIBLE_ACTIONS,
  AUTO_TRIGGER_ACTIONS,
  isEligibleAction,
  shouldAutoTrigger,
  getModelConfig,
  getAllModelsForAction,
} from './config.js';

// ============================================================================
// Prompt Templates
// ============================================================================

export {
  getReviewCritiquePrompt,
  getAuditCritiquePrompt,
  getAnalyzeCritiquePrompt,
  getPlanCritiquePrompt,
  getCodeCritiquePrompt,
  getCritiquePrompt,
} from './prompt-templates.js';

// ============================================================================
// Types
// ============================================================================

export type {
  // Ollama types
  OllamaClientConfig,
  OllamaGenerateRequest,
  OllamaGenerateResponse,
  OllamaModel,
  OllamaHealthCheck,
  // Second opinion types
  SecondOpinionModelConfig,
  ActionType,
  SecondOpinionRequest,
  SecondOpinionResult,
  StructuredCritique,
  CritiqueIssue,
  CritiqueDisagreement,
  CritiqueAgreement,
  RunMetadata,
  SkipReason,
  // Post-action hook types (future)
  PostActionHookContext,
  PostActionHookResult,
  PostActionHook,
} from './types.js';
