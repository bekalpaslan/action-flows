import type { Capability } from '@afw/shared';
import { toCapabilityId } from '@afw/shared';

/**
 * Canvas Render Capability
 *
 * Phase 2B of Inspiration Roadmap — Thread 4 (Live Canvas)
 *
 * Allows backend to invoke artifact rendering in the dashboard's Live Canvas.
 * This capability will be registered by the LiveCanvas component.
 */
export const canvasCapability: Capability = {
  id: toCapabilityId('dashboard.canvas.render'),
  name: 'Canvas Render',
  description: 'Render an artifact in the Live Canvas',
  provider: 'dashboard',
  invokable: true,
};

/**
 * Input for canvas render invocation
 */
export interface CanvasRenderInput {
  /** ID of the artifact to render */
  artifactId: string;
  /** Whether to bring the canvas into focus */
  focus?: boolean;
  /** Optional viewport settings */
  viewport?: {
    width?: number;
    height?: number;
  };
}

/**
 * Result of canvas render invocation
 */
export interface CanvasRenderResult {
  /** Whether the render was successful */
  success: boolean;
  /** The artifact ID that was rendered */
  artifactId: string;
  /** Timestamp of when the render completed */
  renderedAt: string;
  /** Any warnings during render */
  warnings?: string[];
}
