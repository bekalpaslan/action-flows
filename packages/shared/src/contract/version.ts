/**
 * Contract Version System
 * Defines the current contract version and version history
 */

/**
 * Current contract version
 * Increment when changing output format structure
 */
export const CONTRACT_VERSION = '1.0';

/**
 * Contract version history
 */
export const CONTRACT_VERSIONS = {
  '1.0': {
    date: '2026-02-08',
    description: 'Initial contract specification with 17 formats',
    breaking: false,
  },
  // Future versions...
} as const;

/**
 * Check if a version is supported
 */
export function isSupportedVersion(version: string): boolean {
  return version in CONTRACT_VERSIONS;
}

/**
 * Get the latest version
 */
export function getLatestVersion(): string {
  const versions = Object.keys(CONTRACT_VERSIONS);
  return versions[versions.length - 1] ?? '';
}
