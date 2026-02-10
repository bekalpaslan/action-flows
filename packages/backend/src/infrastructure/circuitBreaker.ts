/**
 * Generic Circuit Breaker Pattern Implementation
 *
 * Prevents cascading failures by opening the circuit after a threshold of failures,
 * allowing the system to fail fast and giving failing components time to recover.
 *
 * States:
 * - CLOSED: Normal operation, all requests pass through
 * - OPEN: Circuit is open, requests fail fast without attempting operation
 * - HALF_OPEN: Testing if the service has recovered
 */

import type { CircuitState, CircuitBreakerStats, Timestamp } from '@afw/shared';
import { brandedTypes } from '@afw/shared';
import { telemetry } from '../services/telemetry.js';

interface CircuitBreakerConfig {
  name: string;
  failureThreshold?: number; // Number of failures before opening circuit (default: 5)
  resetTimeout?: number; // Time in ms before attempting recovery (default: 30000ms)
  onStateChange?: (state: CircuitState) => void;
}

/**
 * Generic circuit breaker that protects operations from cascading failures
 */
export class CircuitBreaker<T> {
  private state: CircuitState = 'closed';
  private failureCount = 0;
  private failureThreshold: number;
  private resetTimeout: number;
  private lastFailureTime: number = 0;
  private totalTrips = 0; // Total number of times circuit has opened
  private name: string;
  private onStateChange?: (state: CircuitState) => void;

  constructor(config: CircuitBreakerConfig) {
    this.name = config.name;
    this.failureThreshold = config.failureThreshold ?? 5;
    this.resetTimeout = config.resetTimeout ?? 30000; // 30 seconds
    this.onStateChange = config.onStateChange;

    telemetry.log('info', 'circuitBreaker', `Circuit breaker initialized: ${this.name}`, {
      failureThreshold: this.failureThreshold,
      resetTimeout: this.resetTimeout,
    });
  }

  /**
   * Execute an operation through the circuit breaker
   * @param operation The async operation to execute
   * @param fallback Optional fallback operation if circuit is open
   * @returns Result of the operation or fallback
   */
  async execute(
    operation: () => Promise<T>,
    fallback?: () => Promise<T>
  ): Promise<T> {
    // Check if we should attempt recovery (half-open state)
    if (this.state === 'open') {
      const now = Date.now();
      if (now - this.lastFailureTime >= this.resetTimeout) {
        this.transitionTo('half-open');
      }
    }

    // If circuit is open and no fallback, fail fast
    if (this.state === 'open') {
      telemetry.log('warn', 'circuitBreaker', `Circuit is OPEN for ${this.name}, failing fast`, {
        name: this.name,
        failureCount: this.failureCount,
        lastFailureTime: this.lastFailureTime,
      });

      if (fallback) {
        telemetry.log('info', 'circuitBreaker', `Using fallback for ${this.name}`, { name: this.name });
        return await fallback();
      }

      throw new Error(`Circuit breaker is OPEN for ${this.name}`);
    }

    // Attempt the operation
    try {
      const result = await operation();

      // Success - reset failure count
      if (this.state === 'half-open') {
        // Recovery successful, close the circuit
        this.transitionTo('closed');
        this.failureCount = 0;
        telemetry.log('info', 'circuitBreaker', `Circuit CLOSED for ${this.name} (recovery successful)`, {
          name: this.name,
        });
      } else if (this.failureCount > 0) {
        // Partial recovery in closed state
        this.failureCount = 0;
        telemetry.log('debug', 'circuitBreaker', `Reset failure count for ${this.name}`, {
          name: this.name,
        });
      }

      return result;
    } catch (error) {
      this.recordFailure();

      // If we were in half-open and failed, go back to open
      if (this.state === 'half-open') {
        this.transitionTo('open');
        this.lastFailureTime = Date.now();
        telemetry.log('error', 'circuitBreaker', `Recovery attempt failed for ${this.name}, reopening circuit`, {
          name: this.name,
          error: error instanceof Error ? error.message : String(error),
        });
      }

      // Check if we should open the circuit
      if (this.state === 'closed' && this.failureCount >= this.failureThreshold) {
        this.transitionTo('open');
        this.lastFailureTime = Date.now();
        this.totalTrips++;
        telemetry.log('error', 'circuitBreaker', `Circuit OPENED for ${this.name} (threshold reached)`, {
          name: this.name,
          failureCount: this.failureCount,
          failureThreshold: this.failureThreshold,
          totalTrips: this.totalTrips,
        });
      }

      // Use fallback if available
      if (fallback) {
        telemetry.log('info', 'circuitBreaker', `Using fallback for ${this.name} after failure`, {
          name: this.name,
          error: error instanceof Error ? error.message : String(error),
        });
        return await fallback();
      }

      // Re-throw if no fallback
      throw error;
    }
  }

  /**
   * Get current circuit state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Get circuit breaker statistics
   */
  getStats(): CircuitBreakerStats {
    return {
      name: this.name,
      state: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime > 0 ? brandedTypes.timestamp(new Date(this.lastFailureTime)) : null,
      totalTrips: this.totalTrips,
    };
  }

  /**
   * Manually reset the circuit breaker to closed state
   */
  reset(): void {
    this.transitionTo('closed');
    this.failureCount = 0;
    this.lastFailureTime = 0;
    telemetry.log('info', 'circuitBreaker', `Circuit manually RESET for ${this.name}`, {
      name: this.name,
    });
  }

  /**
   * Record a failure
   */
  private recordFailure(): void {
    this.failureCount++;
    telemetry.log('debug', 'circuitBreaker', `Failure recorded for ${this.name}`, {
      name: this.name,
      failureCount: this.failureCount,
      failureThreshold: this.failureThreshold,
    });
  }

  /**
   * Transition to a new state and notify listeners
   */
  private transitionTo(newState: CircuitState): void {
    const oldState = this.state;
    this.state = newState;

    telemetry.log('info', 'circuitBreaker', `Circuit state transition for ${this.name}: ${oldState} → ${newState}`, {
      name: this.name,
      oldState,
      newState,
    });

    if (this.onStateChange) {
      this.onStateChange(newState);
    }
  }
}
