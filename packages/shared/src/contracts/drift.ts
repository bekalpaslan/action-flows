/**
 * Component Contract Drift Detector
 *
 * Detects mismatches between contracts and actual component files:
 * - Missing contracts (components without .contract.md)
 * - Orphaned contracts (contracts without matching components)
 * - Path mismatches (contract path != actual file path)
 * - Context coverage gaps (contexts without contracts)
 */

import { readdir, stat } from 'fs/promises';
import { join, relative, extname, basename } from 'path';
import type { ComponentBehavioralContract } from './schema.js';

/**
 * Result of drift detection analysis
 */
export interface DriftResult {
  missingContracts: string[];                      // components without contracts
  orphanedContracts: string[];                     // contracts without components
  pathMismatches: Array<{                          // contract path != actual path
    contract: string;
    expected: string;
    actual: string;
  }>;
  contextCoverage: {                               // context provider coverage
    total: number;
    covered: number;
    missing: string[];
  };
  summary: string;                                 // human-readable summary
}

/**
 * Recursively find all .tsx files in a directory
 * @param dir - Directory path
 * @param baseDir - Base directory for relative paths
 * @returns Array of relative file paths
 */
async function findTsxFiles(dir: string, baseDir?: string): Promise<string[]> {
  const base = baseDir || dir;
  const files: string[] = [];

  try {
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      const relativePath = relative(base, fullPath);

      if (entry.isDirectory()) {
        // Skip common non-component directories
        if (['__tests__', '.test', '.spec', 'styles', '__stories__'].some((skip) => entry.name.includes(skip))) {
          continue;
        }
        files.push(...(await findTsxFiles(fullPath, base)));
      } else if (entry.isFile() && extname(entry.name) === '.tsx') {
        files.push(relativePath);
      }
    }
  } catch (err) {
    // Directory may not exist or be inaccessible
    console.warn(`Warning: Could not read directory ${dir}:`, err instanceof Error ? err.message : String(err));
  }

  return files;
}

/**
 * Recursively find all .contract.md files in a directory
 * @param dir - Directory path
 * @param baseDir - Base directory for relative paths
 * @returns Map of component name to contract file path
 */
async function findContractFiles(dir: string, baseDir?: string): Promise<Map<string, string>> {
  const base = baseDir || dir;
  const contracts = new Map<string, string>();

  try {
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      const relativePath = relative(base, fullPath);

      if (entry.isDirectory()) {
        const subContracts = await findContractFiles(fullPath, base);
        subContracts.forEach((path, name) => contracts.set(name, path));
      } else if (entry.isFile() && entry.name.endsWith('.contract.md')) {
        // Extract component name from contract filename
        // e.g., "HarmonyBadge.contract.md" -> "HarmonyBadge"
        const componentName = entry.name.replace('.contract.md', '');
        contracts.set(componentName, relativePath);
      }
    }
  } catch (err) {
    console.warn(`Warning: Could not read contracts directory ${dir}:`, err instanceof Error ? err.message : String(err));
  }

  return contracts;
}

/**
 * Extract component name from .tsx file path
 * e.g., "components/HarmonyBadge/HarmonyBadge.tsx" -> "HarmonyBadge"
 * @param filePath - Path to .tsx file
 * @returns Component name
 */
function getComponentNameFromPath(filePath: string): string {
  const fileName = basename(filePath, '.tsx');
  return fileName;
}

/**
 * Normalize file paths for comparison (handles forward/backward slashes)
 * @param path - File path to normalize
 * @returns Normalized path
 */
function normalizePath(path: string): string {
  return path.replace(/\\/g, '/').toLowerCase();
}

/**
 * Check if a contract path corresponds to a component path
 * @param contractPath - Path from contract file
 * @param componentPath - Path to actual .tsx file
 * @returns true if paths match (accounting for extensions)
 */
function pathsMatch(contractPath: string, componentPath: string): boolean {
  const contractNorm = normalizePath(contractPath.replace(/\.tsx$/, ''));
  const componentNorm = normalizePath(componentPath.replace(/\.tsx$/, ''));
  return contractNorm === componentNorm;
}

/**
 * Detect drift between contracts and components
 * @param contractsDir - Path to contracts directory
 * @param componentsDir - Path to components directory
 * @param contextsDir - Path to contexts directory
 * @returns DriftResult with all detected mismatches
 */
export async function detectDrift(
  contractsDir: string,
  componentsDir: string,
  contextsDir: string,
): Promise<DriftResult> {
  // Find all component files
  const componentFiles = await findTsxFiles(componentsDir);
  const componentNames = new Set(componentFiles.map((file) => getComponentNameFromPath(file)));

  // Find all contract files
  const contractMap = await findContractFiles(contractsDir);
  const contractNames = new Set(contractMap.keys());

  // =========================================================================
  // 1. Missing Contracts
  // =========================================================================
  const missingContracts: string[] = [];
  for (const file of componentFiles) {
    const componentName = getComponentNameFromPath(file);
    if (!contractNames.has(componentName)) {
      missingContracts.push(file);
    }
  }

  // =========================================================================
  // 2. Orphaned Contracts
  // =========================================================================
  const orphanedContracts: string[] = [];
  for (const [name, contractPath] of contractMap.entries()) {
    if (!componentNames.has(name)) {
      orphanedContracts.push(contractPath);
    }
  }

  // =========================================================================
  // 3. Path Mismatches
  // =========================================================================
  const pathMismatches: Array<{
    contract: string;
    expected: string;
    actual: string;
  }> = [];

  for (const [componentName, contractPath] of contractMap.entries()) {
    // Find the actual component file with this name
    const actualFiles = componentFiles.filter((f) => getComponentNameFromPath(f) === componentName);

    if (actualFiles.length > 0) {
      // We expect contract path to match the actual component path
      const matchedAny = actualFiles.some((actual) => pathsMatch(contractPath, actual));

      if (!matchedAny && actualFiles.length > 0) {
        pathMismatches.push({
          contract: contractPath,
          expected: actualFiles[0] ?? '', // Report first match
          actual: contractPath,
        });
      }
    }
  }

  // =========================================================================
  // 4. Context Coverage
  // =========================================================================
  let contextsCovered = 0;
  let contextsMissing = 0;
  const missingContextContracts: string[] = [];

  try {
    const contextFiles = await findTsxFiles(contextsDir);

    for (const contextFile of contextFiles) {
      const contextName = getComponentNameFromPath(contextFile);
      if (contractMap.has(contextName)) {
        contextsCovered++;
      } else {
        contextsMissing++;
        missingContextContracts.push(contextFile);
      }
    }
  } catch (err) {
    // Contexts directory may not exist
    contextsMissing = -1; // Indicate directory not found
  }

  // =========================================================================
  // Generate Summary
  // =========================================================================
  const lines: string[] = [];
  lines.push('# Contract Drift Report\n');

  if (missingContracts.length > 0) {
    lines.push(`## Missing Contracts (${missingContracts.length})`);
    lines.push('Components without corresponding .contract.md files:');
    missingContracts.slice(0, 10).forEach((file) => lines.push(`- ${file}`));
    if (missingContracts.length > 10) {
      lines.push(`... and ${missingContracts.length - 10} more`);
    }
    lines.push('');
  }

  if (orphanedContracts.length > 0) {
    lines.push(`## Orphaned Contracts (${orphanedContracts.length})`);
    lines.push('Contracts without corresponding component files:');
    orphanedContracts.slice(0, 10).forEach((file) => lines.push(`- ${file}`));
    if (orphanedContracts.length > 10) {
      lines.push(`... and ${orphanedContracts.length - 10} more`);
    }
    lines.push('');
  }

  if (pathMismatches.length > 0) {
    lines.push(`## Path Mismatches (${pathMismatches.length})`);
    lines.push('Contracts with paths that don\'t match component locations:');
    pathMismatches.slice(0, 5).forEach((mm) => {
      lines.push(`- Contract: ${mm.contract}`);
      lines.push(`  Expected: ${mm.expected}`);
    });
    if (pathMismatches.length > 5) {
      lines.push(`... and ${pathMismatches.length - 5} more`);
    }
    lines.push('');
  }

  if (contextsMissing > 0) {
    lines.push(`## Context Coverage`);
    if (contextsMissing === -1) {
      lines.push('⚠️ Contexts directory not accessible');
    } else {
      const contextTotal = contextsCovered + contextsMissing;
      lines.push(`- Covered: ${contextsCovered}/${contextTotal} context providers`);
      if (missingContextContracts.length > 0) {
        lines.push('Missing contracts for contexts:');
        missingContextContracts.forEach((file) => lines.push(`  - ${file}`));
      }
    }
    lines.push('');
  }

  const summary = lines.join('\n').trim();

  return {
    missingContracts,
    orphanedContracts,
    pathMismatches,
    contextCoverage: {
      total: (contextsMissing === -1 ? 0 : contextsCovered + contextsMissing),
      covered: contextsCovered,
      missing: missingContextContracts,
    },
    summary,
  };
}

/**
 * Generate a detailed drift report as markdown
 * @param result - DriftResult from detectDrift
 * @returns Formatted markdown report
 */
export function formatDriftReport(result: DriftResult): string {
  const lines: string[] = [];

  lines.push('# Contract Drift Analysis\n');

  // Summary statistics
  const totalIssues = result.missingContracts.length + result.orphanedContracts.length + result.pathMismatches.length;
  lines.push(`## Overview`);
  lines.push(`- **Total Issues:** ${totalIssues}`);
  lines.push(`- **Missing Contracts:** ${result.missingContracts.length}`);
  lines.push(`- **Orphaned Contracts:** ${result.orphanedContracts.length}`);
  lines.push(`- **Path Mismatches:** ${result.pathMismatches.length}`);
  lines.push(`- **Context Coverage:** ${result.contextCoverage.covered}/${result.contextCoverage.total}\n`);

  // Detailed findings
  if (result.missingContracts.length > 0) {
    lines.push('## Missing Contracts\n');
    result.missingContracts.forEach((file) => {
      lines.push(`- \`${file}\``);
    });
    lines.push('');
  }

  if (result.orphanedContracts.length > 0) {
    lines.push('## Orphaned Contracts\n');
    result.orphanedContracts.forEach((file) => {
      lines.push(`- \`${file}\``);
    });
    lines.push('');
  }

  if (result.pathMismatches.length > 0) {
    lines.push('## Path Mismatches\n');
    result.pathMismatches.forEach((mm) => {
      lines.push(`- **Contract:** \`${mm.contract}\``);
      lines.push(`  **Expected:** \`${mm.expected}\``);
    });
    lines.push('');
  }

  if (result.contextCoverage.missing.length > 0) {
    lines.push('## Missing Context Contracts\n');
    result.contextCoverage.missing.forEach((file) => {
      lines.push(`- \`${file}\``);
    });
    lines.push('');
  }

  return lines.join('\n');
}
