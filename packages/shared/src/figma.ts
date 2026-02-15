/**
 * Figma Integration Types
 * Types for Figma design link storage and MCP integration
 */

import type { Timestamp } from './types.js';

/**
 * FigmaLink - Stored reference to a Figma design linked to a chain/session
 */
export interface FigmaLink {
  /** Unique link ID */
  id: string;

  /** Figma file key (extracted from URL) */
  fileKey: string;

  /** Optional node ID within the file */
  nodeId?: string;

  /** Full Figma URL */
  url: string;

  /** Human-readable title for the design */
  title: string;

  /** Associated chain ID (if linked to a chain) */
  chainId?: string;

  /** Associated session ID (if linked to a session) */
  sessionId?: string;

  /** When this link was created */
  createdAt: Timestamp;
}

/**
 * FigmaDesignSpec - Extracted design specification from Figma
 * Output format for analyze/figma-extraction action
 */
export interface FigmaDesignSpec {
  /** Component tree structure from Figma */
  componentTree: Record<string, unknown>;

  /** CSS styles extracted from Figma nodes */
  styles: Record<string, string>;

  /** Design tokens (colors, spacing, typography) */
  tokens: Record<string, string>;

  /** Screenshot URL (if available) */
  screenshotUrl?: string;
}

/**
 * FigmaConfig - Configuration for Figma MCP integration
 */
export interface FigmaConfig {
  /** Whether Figma integration is enabled */
  enabled: boolean;
}
