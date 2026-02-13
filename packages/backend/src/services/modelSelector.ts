/**
 * Model Selector Service
 *
 * Phase 2 — Agent Personalities completion (Thread 5)
 * Selects appropriate model tier and prompt adjustments based on agent personality.
 */

import type { AgentPersonality, AgentTone, AgentSpeed } from '@afw/shared';

interface ModelSelection {
  /** Suggested model tier */
  suggestedModel: 'haiku' | 'sonnet' | 'opus';
  /** Personality-aware prompt prefix to prepend to agent spawn */
  promptPrefix: string;
  /** Estimated relative speed factor (1.0 = normal) */
  speedFactor: number;
}

/**
 * Model Selector Service
 *
 * Analyzes agent personality and recommends:
 * - Appropriate model tier (haiku/sonnet/opus)
 * - Personality-aware prompt prefix
 * - Speed factor estimate
 */
class ModelSelector {
  /**
   * Select model and generate prompt adjustments based on personality
   *
   * @param personality Agent personality profile
   * @returns ModelSelection with suggested model, prompt prefix, and speed factor
   */
  select(personality: AgentPersonality): ModelSelection {
    const { tone, speedPreference } = personality;

    // Bold + Fast → Sonnet with high speed
    if (tone === 'bold' && speedPreference === 'fast') {
      return {
        suggestedModel: 'sonnet',
        promptPrefix: 'You are a bold, action-oriented agent. Ship fast, iterate later.',
        speedFactor: 1.2,
      };
    }

    // Skeptical + Slow → Opus with thorough analysis
    if (tone === 'skeptical' && speedPreference === 'slow') {
      return {
        suggestedModel: 'opus',
        promptPrefix: 'You are a thorough, skeptical agent. Question everything. Miss nothing.',
        speedFactor: 0.8,
      };
    }

    // Curious + Balanced → Sonnet with exploration
    if (tone === 'curious' && speedPreference === 'balanced') {
      return {
        suggestedModel: 'sonnet',
        promptPrefix: 'You are a curious, lateral-thinking agent. Explore widely before concluding.',
        speedFactor: 1.0,
      };
    }

    // Decisive + Balanced → Opus with clarity
    if (tone === 'decisive' && speedPreference === 'balanced') {
      return {
        suggestedModel: 'opus',
        promptPrefix: 'You are a decisive agent. Analyze clearly, recommend confidently.',
        speedFactor: 1.0,
      };
    }

    // Cautious → Slower speed, more careful
    if (tone === 'cautious') {
      return {
        suggestedModel: 'opus',
        promptPrefix: 'You are a cautious agent. Verify assumptions, avoid risks.',
        speedFactor: 0.9,
      };
    }

    // Bold (any speed) → Action-oriented
    if (tone === 'bold') {
      return {
        suggestedModel: 'sonnet',
        promptPrefix: 'You are a bold, action-oriented agent. Ship fast, iterate later.',
        speedFactor: 1.1,
      };
    }

    // Curious (any speed) → Exploration-focused
    if (tone === 'curious') {
      return {
        suggestedModel: 'sonnet',
        promptPrefix: 'You are a curious, lateral-thinking agent. Explore widely before concluding.',
        speedFactor: 1.0,
      };
    }

    // Skeptical (any speed) → Thorough analysis
    if (tone === 'skeptical') {
      return {
        suggestedModel: 'opus',
        promptPrefix: 'You are a thorough, skeptical agent. Question everything. Miss nothing.',
        speedFactor: 0.85,
      };
    }

    // Decisive (any speed) → Clear recommendations
    if (tone === 'decisive') {
      return {
        suggestedModel: 'sonnet',
        promptPrefix: 'You are a decisive agent. Analyze clearly, recommend confidently.',
        speedFactor: 1.05,
      };
    }

    // Fast preference → Prioritize speed
    if (speedPreference === 'fast') {
      return {
        suggestedModel: 'sonnet',
        promptPrefix: 'You are an efficient agent. Prioritize implementation velocity.',
        speedFactor: 1.15,
      };
    }

    // Slow preference → Prioritize thoroughness
    if (speedPreference === 'slow') {
      return {
        suggestedModel: 'opus',
        promptPrefix: 'You are a thorough agent. Take time to analyze deeply.',
        speedFactor: 0.85,
      };
    }

    // Balanced/Balanced or any default → No special adjustments
    return {
      suggestedModel: 'sonnet',
      promptPrefix: '',
      speedFactor: 1.0,
    };
  }

  /**
   * Generate a natural-language prompt prefix describing the personality
   *
   * @param personality Agent personality profile
   * @returns Human-readable description of the personality traits
   */
  generatePromptPrefix(personality: AgentPersonality): string {
    const { tone, speedPreference, riskTolerance, communicationStyle } = personality;

    const parts: string[] = [];

    // Tone description
    switch (tone) {
      case 'bold':
        parts.push('You are bold and action-oriented');
        break;
      case 'cautious':
        parts.push('You are cautious and risk-aware');
        break;
      case 'curious':
        parts.push('You are curious and exploration-focused');
        break;
      case 'skeptical':
        parts.push('You are skeptical and thorough');
        break;
      case 'decisive':
        parts.push('You are decisive and clear');
        break;
      case 'balanced':
        parts.push('You are balanced and pragmatic');
        break;
    }

    // Speed preference
    if (speedPreference === 'fast') {
      parts.push('prioritize speed and iteration');
    } else if (speedPreference === 'slow') {
      parts.push('take time for deep analysis');
    }

    // Risk tolerance
    if (riskTolerance === 'high') {
      parts.push('comfortable with calculated risks');
    } else if (riskTolerance === 'low') {
      parts.push('minimize risk and verify carefully');
    }

    // Communication style
    if (communicationStyle === 'terse') {
      parts.push('communicate concisely');
    } else if (communicationStyle === 'detailed') {
      parts.push('provide comprehensive explanations');
    } else if (communicationStyle === 'poetic') {
      parts.push('communicate with rich descriptions');
    }

    return parts.join(', ') + '.';
  }
}

export const modelSelector = new ModelSelector();
