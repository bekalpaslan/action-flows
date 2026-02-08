/**
 * Low-level wrapper for Ollama REST API (localhost:11434)
 *
 * Ollama API reference:
 * - POST /api/generate  -- Generate a completion
 * - GET  /api/tags      -- List available models
 */

import type {
  OllamaClientConfig,
  OllamaGenerateRequest,
  OllamaGenerateResponse,
  OllamaModel,
  OllamaHealthCheck,
} from './types.js';

// ============================================================================
// Custom Error Classes
// ============================================================================

export class OllamaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OllamaError';
  }
}

export class OllamaUnavailableError extends OllamaError {
  constructor() {
    super('Ollama is not running or not reachable at the configured URL');
    this.name = 'OllamaUnavailableError';
  }
}

export class OllamaTimeoutError extends OllamaError {
  constructor(message: string) {
    super(message);
    this.name = 'OllamaTimeoutError';
  }
}

export class OllamaModelNotFoundError extends OllamaError {
  constructor(model: string, available: string[]) {
    super(`Model "${model}" not found. Available models: ${available.join(', ')}`);
    this.name = 'OllamaModelNotFoundError';
  }
}

// ============================================================================
// Ollama Client
// ============================================================================

const DEFAULT_CONFIG: OllamaClientConfig = {
  baseUrl: 'http://localhost:11434',
  defaultTimeoutMs: 120_000,
};

export class OllamaClient {
  private baseUrl: string;
  private defaultTimeoutMs: number;

  constructor(config?: Partial<OllamaClientConfig>) {
    this.baseUrl = config?.baseUrl ?? DEFAULT_CONFIG.baseUrl;
    this.defaultTimeoutMs = config?.defaultTimeoutMs ?? DEFAULT_CONFIG.defaultTimeoutMs;
  }

  /**
   * Check if Ollama is running and reachable
   */
  async isAvailable(): Promise<boolean> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout for availability check

    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        signal: controller.signal,
      });
      return response.ok;
    } catch {
      return false;
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * List all locally available models
   */
  async listModels(): Promise<OllamaModel[]> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new OllamaUnavailableError();
      }

      const data = (await response.json()) as { models: OllamaModel[] };
      return data.models || [];
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new OllamaTimeoutError('Ollama model list request timed out after 10s');
      }
      if (error instanceof OllamaError) {
        throw error;
      }
      throw new OllamaUnavailableError();
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Check if a specific model is available
   */
  async hasModel(modelName: string): Promise<boolean> {
    try {
      const models = await this.listModels();
      return models.some((m) => m.name === modelName);
    } catch {
      return false;
    }
  }

  /**
   * Generate a completion (non-streaming)
   */
  async generate(
    request: OllamaGenerateRequest,
    timeoutMs?: number
  ): Promise<OllamaGenerateResponse> {
    const effectiveTimeout = timeoutMs ?? this.defaultTimeoutMs;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), effectiveTimeout);

    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...request, stream: false }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new OllamaError(`Ollama returned ${response.status}: ${response.statusText}`);
      }

      return (await response.json()) as OllamaGenerateResponse;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new OllamaTimeoutError(`Ollama request timed out after ${effectiveTimeout}ms`);
      }
      if (error instanceof OllamaError) {
        throw error;
      }
      // Network errors or connection refused
      throw new OllamaUnavailableError();
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Health check with model availability and latency measurement
   */
  async healthCheck(): Promise<OllamaHealthCheck> {
    const startTime = Date.now();

    try {
      const available = await this.isAvailable();
      if (!available) {
        return { available: false, models: [], latencyMs: Date.now() - startTime };
      }

      const models = await this.listModels();
      return {
        available: true,
        models: models.map((m) => m.name),
        latencyMs: Date.now() - startTime,
      };
    } catch {
      return { available: false, models: [], latencyMs: Date.now() - startTime };
    }
  }
}
