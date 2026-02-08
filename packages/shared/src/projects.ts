/**
 * Project Registry Types
 * Types for managing registered projects with their configurations
 */

import type { Timestamp } from './types.js';
import type { QuickActionDefinition } from './sessionWindows.js';

/**
 * ProjectId - Branded type for project identifiers (UUID)
 */
export type ProjectId = string & { readonly __brand: 'ProjectId' };

/**
 * Project - Registered project configuration
 */
export interface Project {
  /** Unique project ID (UUID) */
  id: ProjectId;

  /** Project name */
  name: string;

  /** Working directory (absolute path) */
  cwd: string;

  /** Default CLI flags for this project */
  defaultCliFlags: string[];

  /** Default prompt template for new sessions */
  defaultPromptTemplate: string | null;

  /** Path to MCP config file (if exists) */
  mcpConfigPath: string | null;

  /** Environment variables for this project */
  envVars: Record<string, string>;

  /** Quick action presets for this project */
  quickActionPresets: QuickActionDefinition[];

  /** Project description */
  description: string | null;

  /** When the project was created */
  createdAt: Timestamp;

  /** Last time this project was used to start a session */
  lastUsedAt: Timestamp;

  /** Whether ActionFlows framework was detected in this project */
  actionflowsDetected: boolean;
}

/**
 * Project auto-detection result
 */
export interface ProjectAutoDetectionResult {
  /** Detected project name (from CLAUDE.md or package.json) */
  name: string | null;

  /** Whether .claude/actionflows/ directory was detected */
  actionflowsDetected: boolean;

  /** Detected MCP config path */
  mcpConfigPath: string | null;

  /** Suggested CLI flags based on detection */
  suggestedFlags: string[];

  /** Detected project type */
  projectType: 'monorepo' | 'nodejs' | 'python' | 'other' | null;
}
