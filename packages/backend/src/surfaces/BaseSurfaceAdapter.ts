/**
 * Base Surface Adapter
 * Abstract class that all surface adapters must implement
 * Part of Phase 2A — Multi-Surface Orchestration (Thread 1)
 */

import type { SurfaceId, SurfaceConfig, SurfaceMessage, SurfaceInput } from '@afw/shared';

/**
 * BaseSurfaceAdapter defines the contract for all surface adapters
 * Each adapter translates between ActionFlows and external surface formats
 */
export abstract class BaseSurfaceAdapter {
  /** Unique identifier for this surface type */
  abstract readonly surfaceId: SurfaceId;

  /** Configuration for this surface */
  abstract readonly config: SurfaceConfig;

  /**
   * Initialize the adapter (connect to external service)
   * This is called once when the adapter is registered
   */
  abstract initialize(): Promise<void>;

  /**
   * Translate incoming message from external format to SurfaceInput
   * @param externalMessage - Message in the external surface's format
   * @returns Standardized SurfaceInput for ActionFlows orchestrator
   */
  abstract translateIn(externalMessage: unknown): SurfaceInput;

  /**
   * Translate outgoing message from SurfaceMessage to external format
   * @param message - Standardized message from ActionFlows
   * @returns Message in the external surface's format
   */
  abstract translateOut(message: SurfaceMessage): unknown;

  /**
   * Send a message to the external surface
   * @param message - SurfaceMessage to send
   */
  abstract send(message: SurfaceMessage): Promise<void>;

  /**
   * Cleanup resources when adapter is shutting down
   */
  abstract shutdown(): Promise<void>;
}
