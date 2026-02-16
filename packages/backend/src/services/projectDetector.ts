/**
 * Project Auto-Detection Service
 * Scans project directories to detect metadata for quick project registration
 */

import fs from 'fs/promises';
import path from 'path';
import type { ProjectAutoDetectionResult } from '@afw/shared';

/**
 * Project Detector
 * Static methods for auto-detecting project metadata
 */
export class ProjectDetector {
  /**
   * Detect project metadata from a working directory
   */
  static async detectProject(cwd: string): Promise<ProjectAutoDetectionResult> {
    const result: ProjectAutoDetectionResult = {
      name: null,
      actionflowsDetected: false,
      mcpConfigPath: null,
      suggestedFlags: [],
      projectType: null,
    };

    try {
      // Windows paths (e.g. D:/...) can't be resolved inside a Linux Docker container
      const isWindowsPathOnLinux = /^[A-Za-z]:[/\\]/.test(cwd) && process.platform !== 'win32';

      let realCwd: string;
      if (isWindowsPathOnLinux) {
        // Trust the path as-is — fs operations can't resolve host Windows paths in Docker
        realCwd = cwd;
      } else {
        // Validate path traversal - resolve realpath to prevent symlink escapes
        try {
          realCwd = await fs.realpath(cwd);
        } catch (error) {
          throw new Error('Directory does not exist or is not accessible');
        }

        // Check if directory exists and is actually a directory
        try {
          const stats = await fs.stat(realCwd);
          if (!stats.isDirectory()) {
            throw new Error('Path is not a directory');
          }
        } catch (error) {
          throw new Error('Directory does not exist or is not accessible');
        }
      }

      // Validate against path traversal attempts
      const normalizedCwd = path.normalize(realCwd);
      if (normalizedCwd.includes('..')) {
        throw new Error('Path traversal detected in cwd');
      }

      // Use realCwd for all subsequent operations
      cwd = realCwd;

      // Detect ActionFlows framework
      const actionflowsPath = path.join(cwd, '.claude', 'actionflows');
      try {
        const stats = await fs.stat(actionflowsPath);
        if (stats.isDirectory()) {
          result.actionflowsDetected = true;
        }
      } catch {
        // Not found - that's okay
      }

      // Detect project name from CLAUDE.md
      const claudeMdPath = path.join(cwd, '.claude', 'CLAUDE.md');
      try {
        const claudeMdContent = await fs.readFile(claudeMdPath, 'utf-8');
        // Parse "Name:" field with regex
        const nameMatch = claudeMdContent.match(/^[#\s]*Name:\s*(.+)$/im);
        if (nameMatch && nameMatch[1]) {
          result.name = nameMatch[1].trim();
        }
      } catch {
        // Not found - try package.json next
      }

      // Detect MCP config
      const mcpConfigPaths = [
        path.join(cwd, '.claude', 'settings.json'),
        path.join(cwd, 'claude.json'),
        path.join(cwd, '.claude', 'mcp.json'),
      ];

      for (const mcpPath of mcpConfigPaths) {
        try {
          const stats = await fs.stat(mcpPath);
          if (stats.isFile()) {
            result.mcpConfigPath = mcpPath;
            result.suggestedFlags.push('--mcp-config', mcpPath);
            break;
          }
        } catch {
          // Not found - continue
        }
      }

      // Detect package.json (Node.js project)
      const packageJsonPath = path.join(cwd, 'package.json');
      try {
        const packageJsonContent = await fs.readFile(packageJsonPath, 'utf-8');
        const packageJson = JSON.parse(packageJsonContent);

        // Use package name as fallback if no CLAUDE.md name
        if (!result.name && packageJson.name) {
          result.name = packageJson.name;
        }

        result.projectType = 'nodejs';
      } catch {
        // Not a Node.js project
      }

      // Detect monorepo
      const monorepoIndicators = [
        'pnpm-workspace.yaml',
        'lerna.json',
        'nx.json',
        'turbo.json',
      ];

      for (const indicator of monorepoIndicators) {
        try {
          const stats = await fs.stat(path.join(cwd, indicator));
          if (stats.isFile()) {
            result.projectType = 'monorepo';
            break;
          }
        } catch {
          // Not found - continue
        }
      }

      // Detect Python project
      const pythonIndicators = ['pyproject.toml', 'setup.py', 'requirements.txt'];
      for (const indicator of pythonIndicators) {
        try {
          const stats = await fs.stat(path.join(cwd, indicator));
          if (stats.isFile() && !result.projectType) {
            result.projectType = 'python';

            // Try to extract name from pyproject.toml
            if (indicator === 'pyproject.toml' && !result.name) {
              const content = await fs.readFile(path.join(cwd, indicator), 'utf-8');
              const nameMatch = content.match(/^name\s*=\s*["'](.+)["']/im);
              if (nameMatch && nameMatch[1]) {
                result.name = nameMatch[1];
              }
            }
            break;
          }
        } catch {
          // Not found - continue
        }
      }

      // If no project type detected, mark as 'other'
      if (!result.projectType) {
        result.projectType = 'other';
      }

      // Detect .git directory
      try {
        const stats = await fs.stat(path.join(cwd, '.git'));
        if (stats.isDirectory()) {
          // Git repo detected - could suggest git-related flags in the future
        }
      } catch {
        // Not a git repo
      }

      // Use directory name as absolute fallback for name
      if (!result.name) {
        result.name = path.basename(cwd);
      }

      return result;
    } catch (error) {
      // Return partial results even if some checks failed
      console.error('[ProjectDetector] Detection error:', error);

      // At minimum, use directory name
      if (!result.name) {
        result.name = path.basename(cwd);
      }

      return result;
    }
  }

  /**
   * Validate environment variable key (prevent command injection)
   */
  static validateEnvVarKey(key: string): boolean {
    // Allow only alphanumeric + underscore (standard env var naming)
    return /^[A-Z_][A-Z0-9_]*$/i.test(key);
  }

  /**
   * Validate environment variable value (prevent command injection)
   *
   * Note: Environment variables are just strings. Command injection happens
   * at spawn time, not at storage time. We validate the spawn command itself
   * in claudeCliManager, so env var values can be arbitrary strings.
   *
   * This method exists for API compatibility but always returns true.
   * If you need to restrict certain values, implement business logic checks
   * separately (e.g., max length, no null bytes).
   */
  static validateEnvVarValue(value: string): boolean {
    // Check for null bytes which could cause issues with subprocess communication
    if (value.includes('\0')) {
      return false;
    }

    // Check for excessive length (prevent DoS via large env vars)
    if (value.length > 10000) {
      return false;
    }

    return true;
  }
}
