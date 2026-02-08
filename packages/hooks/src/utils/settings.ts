/**
 * Settings utility for reading configuration
 * Reads from .claude/settings.json or environment variables
 * Returns workspace config with sensible defaults
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import type { UserId } from '@afw/shared';
import { brandedTypes } from '@afw/shared';

interface WorkspaceConfig {
  backendUrl: string;
  user?: string;
  enabled: boolean;
}

export interface HookSettings {
  backendUrl: string;
  user: UserId;
  enabled: boolean;
}

/**
 * Attempts to read .claude/settings.json from workspace root
 * Returns null if file doesn't exist or can't be parsed
 */
function readSettingsFile(): Partial<WorkspaceConfig> | null {
  try {
    // Try to find workspace root by going up from cwd
    let currentDir = process.cwd();
    const root = path.parse(currentDir).root;

    while (currentDir !== root) {
      const settingsPath = path.join(currentDir, '.claude', 'settings.json');

      if (fs.existsSync(settingsPath)) {
        const content = fs.readFileSync(settingsPath, 'utf-8');
        const parsed = JSON.parse(content);
        return parsed as Partial<WorkspaceConfig>;
      }

      currentDir = path.dirname(currentDir);
    }

    return null;
  } catch (error) {
    // Silently fail if file can't be read or parsed
    return null;
  }
}

/**
 * Reads hook settings from .claude/settings.json and environment variables
 * Returns defaults if file not found
 */
export function readSettings(): HookSettings {
  // Try to read from settings file first
  const fileSettings = readSettingsFile();

  // Fall back to environment variables, then system username or anonymous
  const backendUrl = fileSettings?.backendUrl || process.env.AFW_BACKEND_URL || 'http://localhost:3001';
  const user =
    fileSettings?.user ||
    process.env.AFW_USER ||
    process.env.USER ||
    process.env.USERNAME ||
    os.userInfo().username ||
    'anonymous';
  const enabled = fileSettings?.enabled !== false && process.env.AFW_ENABLED !== 'false';

  return {
    backendUrl,
    user: brandedTypes.userId(user),
    enabled,
  };
}

/**
 * Validates that all required settings are present and valid
 */
export function validateSettings(settings: HookSettings): void {
  if (!settings.backendUrl) {
    throw new Error('backendUrl is required in .claude/settings.json or AFW_BACKEND_URL');
  }

  try {
    new URL(settings.backendUrl);
  } catch (error) {
    throw new Error(`Invalid backendUrl: ${settings.backendUrl}`);
  }
}
