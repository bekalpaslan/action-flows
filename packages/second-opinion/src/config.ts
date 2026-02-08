/**
 * Model configurations and action mappings for second-opinion system
 */

import type { ActionType, SecondOpinionModelConfig } from './types.js';

// ============================================================================
// Model Configurations per Action Type
// ============================================================================

export const MODEL_CONFIGS: Record<string, SecondOpinionModelConfig> = {
  review: {
    primary: 'qwen2.5-coder:32b',
    fallbacks: ['qwen2.5-coder:7b', 'gemma3:4b'],
    maxTokens: 4096,
    temperature: 0.3,
    timeoutMs: 120_000, // 2 minutes (32B is slow)
  },
  audit: {
    primary: 'qwen2.5-coder:32b',
    fallbacks: ['qwen2.5-coder:7b', 'gemma3:4b'],
    maxTokens: 4096,
    temperature: 0.2,
    timeoutMs: 180_000, // 3 minutes (deep analysis)
  },
  analyze: {
    primary: 'qwen2.5-coder:7b',
    fallbacks: ['gemma3:4b'],
    maxTokens: 2048,
    temperature: 0.3,
    timeoutMs: 60_000, // 1 minute
  },
  plan: {
    primary: 'qwen2.5-coder:7b',
    fallbacks: ['gemma3:4b'],
    maxTokens: 3072,
    temperature: 0.4,
    timeoutMs: 90_000, // 1.5 minutes
  },
  code: {
    primary: 'qwen2.5-coder:7b',
    fallbacks: ['gemma3:4b'],
    maxTokens: 2048,
    temperature: 0.3,
    timeoutMs: 60_000, // 1 minute
  },
};

// ============================================================================
// Eligibility Checks
// ============================================================================

/**
 * Actions that should NEVER get second opinions
 */
export const INELIGIBLE_ACTIONS: ActionType[] = ['test', 'commit'];

/**
 * Actions that are eligible for second opinions
 */
export const ELIGIBLE_ACTIONS: ActionType[] = ['review', 'audit', 'analyze', 'plan', 'code'];

/**
 * Actions that auto-trigger second opinions when available
 */
export const AUTO_TRIGGER_ACTIONS: ActionType[] = ['review', 'audit'];

/**
 * Check if an action type is eligible for second opinions
 */
export function isEligibleAction(actionType: ActionType): boolean {
  return ELIGIBLE_ACTIONS.includes(actionType);
}

/**
 * Check if an action type should auto-trigger second opinions
 */
export function shouldAutoTrigger(actionType: ActionType): boolean {
  return AUTO_TRIGGER_ACTIONS.includes(actionType);
}

/**
 * Get model configuration for an action type
 * @throws Error if action type is ineligible or not configured
 */
export function getModelConfig(actionType: ActionType): SecondOpinionModelConfig {
  if (!isEligibleAction(actionType)) {
    throw new Error(`Action type "${actionType}" is not eligible for second opinions`);
  }

  const config = MODEL_CONFIGS[actionType];
  if (!config) {
    throw new Error(`No model configuration found for action type "${actionType}"`);
  }

  return config;
}

/**
 * Get all configured model names (primary + all fallbacks) for an action
 */
export function getAllModelsForAction(actionType: ActionType): string[] {
  try {
    const config = getModelConfig(actionType);
    return [config.primary, ...config.fallbacks];
  } catch {
    return [];
  }
}
