/**
 * High-level second-opinion runner
 * Orchestrates the full flow: availability check -> model resolution -> prompt generation -> Ollama call
 */

import { OllamaClient, OllamaError, OllamaTimeoutError, OllamaUnavailableError } from './ollama-client.js';
import { getModelConfig, isEligibleAction } from './config.js';
import { getCritiquePrompt } from './prompt-templates.js';
import type { SecondOpinionRequest, SecondOpinionResult, StructuredCritique, RunMetadata } from './types.js';

// ============================================================================
// Second Opinion Runner
// ============================================================================

export class SecondOpinionRunner {
  private client: OllamaClient;

  constructor(client?: OllamaClient) {
    this.client = client ?? new OllamaClient();
  }

  /**
   * Run a second-opinion critique
   * NEVER throws - all errors are captured in the skip result
   */
  async run(request: SecondOpinionRequest): Promise<SecondOpinionResult> {
    const startTime = Date.now();

    try {
      // Check eligibility
      if (!isEligibleAction(request.actionType)) {
        return {
          skipped: true,
          reason: 'ineligible_action',
        };
      }

      // Check Ollama availability
      const available = await this.client.isAvailable();
      if (!available) {
        return {
          skipped: true,
          reason: 'ollama_unavailable',
        };
      }

      // Resolve model with fallback chain
      const modelConfig = getModelConfig(request.actionType);
      const allModels = request.modelOverride
        ? [request.modelOverride]
        : [modelConfig.primary, ...modelConfig.fallbacks];

      // Build critique prompt (same for all models)
      const prompt = getCritiquePrompt(request.actionType, request.originalInput, request.claudeOutput);

      // Try each model in the fallback chain — handles both "not installed" and "timeout"
      for (let i = 0; i < allModels.length; i++) {
        const candidateModel = allModels[i];
        if (!candidateModel) {
          continue;
        }
        const isLast = i === allModels.length - 1;

        const hasModel = await this.client.hasModel(candidateModel);
        if (!hasModel) {
          if (isLast) {
            return {
              skipped: true,
              reason: 'no_model_available',
              error: `None of the configured models are available: ${allModels.join(', ')}`,
            };
          }
          continue;
        }

        try {
          const response = await this.client.generate(
            {
              model: candidateModel,
              prompt,
              options: {
                temperature: modelConfig.temperature,
                num_predict: modelConfig.maxTokens,
              },
            },
            modelConfig.timeoutMs
          );

          // Success — parse and return
          const critique = this.parseResponse(response.response);
          const metadata: RunMetadata = {
            modelUsed: candidateModel,
            latencyMs: Date.now() - startTime,
            promptTokens: response.prompt_eval_count || 0,
            responseTokens: response.eval_count || 0,
            fallbackUsed: i > 0,
            timestamp: new Date().toISOString(),
          };

          return {
            skipped: false,
            critique,
            metadata,
          };
        } catch (modelError) {
          // If this is the last model, let the outer catch handle it
          if (isLast) {
            throw modelError;
          }
          // Otherwise, try the next model in the fallback chain
          continue;
        }
      }

      // Should not reach here, but satisfy TypeScript
      return {
        skipped: true,
        reason: 'no_model_available',
        error: `Exhausted all models: ${allModels.join(', ')}`,
      };
    } catch (error) {
      // Graceful error handling - never throw
      if (error instanceof OllamaTimeoutError) {
        return {
          skipped: true,
          reason: 'timeout',
          error: error.message,
        };
      }

      if (error instanceof OllamaUnavailableError) {
        return {
          skipped: true,
          reason: 'ollama_unavailable',
          error: error.message,
        };
      }

      if (error instanceof OllamaError) {
        return {
          skipped: true,
          reason: 'generation_error',
          error: error.message,
        };
      }

      return {
        skipped: true,
        reason: 'generation_error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Parse the raw model response into a structured critique
   * This is a best-effort parser - if parsing fails, returns a minimal structure
   * with the raw response included
   */
  private parseResponse(rawResponse: string): StructuredCritique {
    // Default structure
    const critique: StructuredCritique = {
      missedIssues: [],
      disagreements: [],
      strongAgreements: [],
      additionalObservations: [],
      confidenceScore: 'MEDIUM',
      confidenceReason: 'Unable to parse confidence score from response',
      rawResponse,
    };

    try {
      // Extract confidence score
      const confidenceMatch = rawResponse.match(/confidence.*?:\s*(HIGH|MEDIUM|LOW)/i);
      if (confidenceMatch?.[1]) {
        critique.confidenceScore = confidenceMatch[1].toUpperCase() as 'HIGH' | 'MEDIUM' | 'LOW';
      }

      // Extract confidence reason (text after confidence score until next section or end)
      const confidenceReasonMatch = rawResponse.match(
        /confidence.*?:\s*(?:HIGH|MEDIUM|LOW)\s*\n(.+?)(?:\n#|$)/is
      );
      if (confidenceReasonMatch?.[1]) {
        critique.confidenceReason = confidenceReasonMatch[1].trim();
      }

      // Extract missed issues
      const missedSection = this.extractSection(rawResponse, 'Missed Issues');
      if (missedSection) {
        critique.missedIssues = this.parseMissedIssues(missedSection);
      }

      // Extract disagreements
      const disagreementsSection = this.extractSection(rawResponse, 'Disagreements');
      if (disagreementsSection) {
        critique.disagreements = this.parseDisagreements(disagreementsSection);
      }

      // Extract strong agreements
      const agreementsSection = this.extractSection(rawResponse, 'Strong Agreements');
      if (agreementsSection) {
        critique.strongAgreements = this.parseAgreements(agreementsSection);
      }

      // Extract additional observations
      const observationsSection = this.extractSection(rawResponse, 'Additional Observations');
      if (observationsSection) {
        critique.additionalObservations = this.parseObservations(observationsSection);
      }
    } catch (error) {
      // Parsing errors are non-fatal - we still have the raw response
      console.warn('Failed to parse second opinion response:', error);
    }

    return critique;
  }

  private extractSection(text: string, sectionName: string): string | null {
    const regex = new RegExp(`###\\s*${sectionName}\\s*\\n([\\s\\S]*?)(?=\\n###|$)`, 'i');
    const match = text.match(regex);
    return match?.[1]?.trim() ?? null;
  }

  private parseMissedIssues(section: string): StructuredCritique['missedIssues'] {
    const issues: StructuredCritique['missedIssues'] = [];
    const lines = section.split('\n').filter((line) => line.trim().startsWith('-'));

    for (const line of lines) {
      const severityMatch = line.match(/\[severity:\s*(HIGH|MEDIUM|LOW)\]/i);
      const severity = (severityMatch?.[1]?.toUpperCase() ?? 'MEDIUM') as 'HIGH' | 'MEDIUM' | 'LOW';

      const locationMatch = line.match(/\(([^)]+:\d+)\)/);
      const location = locationMatch?.[1] ?? undefined;

      const description = line
        .replace(/\[severity:\s*(?:HIGH|MEDIUM|LOW)\]/i, '')
        .replace(/\([^)]+:\d+\)/, '')
        .replace(/^-\s*/, '')
        .trim();

      if (description) {
        issues.push({ severity, description, location });
      }
    }

    return issues;
  }

  private parseDisagreements(section: string): StructuredCritique['disagreements'] {
    const disagreements: StructuredCritique['disagreements'] = [];
    const lines = section.split('\n').filter((line) => line.trim().startsWith('-'));

    for (const line of lines) {
      const findingMatch = line.match(/\[finding:\s*"([^"]+)"\]/i);
      const originalFinding = findingMatch?.[1] ?? '';

      const reason = line
        .replace(/\[finding:\s*"[^"]+"\]/i, '')
        .replace(/^-\s*/, '')
        .trim();

      if (originalFinding || reason) {
        disagreements.push({ originalFinding, reason });
      }
    }

    return disagreements;
  }

  private parseAgreements(section: string): StructuredCritique['strongAgreements'] {
    const agreements: StructuredCritique['strongAgreements'] = [];
    const lines = section.split('\n').filter((line) => line.trim().startsWith('-'));

    for (const line of lines) {
      const findingMatch = line.match(/\[finding:\s*"([^"]+)"\]/i);
      const originalFinding = findingMatch?.[1] ?? '';

      const additionalEvidence = line
        .replace(/\[finding:\s*"[^"]+"\]/i, '')
        .replace(/^-\s*/, '')
        .trim();

      if (originalFinding || additionalEvidence) {
        agreements.push({ originalFinding, additionalEvidence });
      }
    }

    return agreements;
  }

  private parseObservations(section: string): string[] {
    return section
      .split('\n')
      .filter((line) => line.trim().startsWith('-'))
      .map((line) => line.replace(/^-\s*/, '').trim())
      .filter((obs) => obs.length > 0);
  }
}
