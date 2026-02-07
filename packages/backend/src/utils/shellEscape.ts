/**
 * Import these utilities before ANY use of child_process exec/spawn
 * Provides safe escaping and validation for shell command execution
 * This prevents command injection attacks
 */

/**
 * Dangerous characters that could enable command injection
 */
export const BLOCKED_CHARS = {
  unix: /[;&|`$()[\]{}<>\\!*?]/g,
  windows: /[;&|`$()[\]{}<>!*?]/g,
};

/**
 * Escapes a single shell argument by wrapping in single quotes and escaping internal single quotes
 * This is safe for both Unix and Windows when used with proper shell invocation
 *
 * @param arg The argument to escape
 * @returns The escaped argument safe for shell execution
 */
export function escapeShellArg(arg: string): string {
  if (!arg) return "''";

  // For Unix-like shells: wrap in single quotes and escape any single quotes inside
  // Single quotes preserve everything literally except you can't include a single quote
  // To include a single quote, end the quoted string, add an escaped single quote, and start a new quoted string
  return `'${arg.replace(/'/g, "'\\''")}'`;
}

/**
 * Validates a command against an allowlist of permitted executables
 * Ensures only pre-approved commands can be executed
 *
 * @param cmd The command to validate (just the executable, not full command line)
 * @param allowlist Array of permitted command executables
 * @returns true if the command is in the allowlist, false otherwise
 */
export function validateCommand(cmd: string, allowlist: string[]): boolean {
  if (!cmd || typeof cmd !== 'string') {
    return false;
  }

  // Extract the base command (first part before any space or path separator)
  const baseCmdMatch = cmd.match(/^([^\s\/\\]+)(?:\.exe)?/i);
  const baseCmd = baseCmdMatch ? baseCmdMatch[1].toLowerCase() : cmd.toLowerCase();

  // Check if command is in allowlist (case-insensitive)
  return allowlist.some(allowed => allowed.toLowerCase() === baseCmd);
}

/**
 * Sanitizes user input to remove potentially dangerous shell characters
 * Use this as an additional layer of defense when escaping alone may not be sufficient
 *
 * @param input The user input to sanitize
 * @param platform The platform ('unix' or 'windows'). Defaults to 'unix'
 * @returns The sanitized input with dangerous characters removed
 */
export function sanitizeInput(input: string, platform: 'unix' | 'windows' = 'unix'): string {
  if (!input) return '';

  const blockedPattern = platform === 'windows' ? BLOCKED_CHARS.windows : BLOCKED_CHARS.unix;
  return input.replace(blockedPattern, '');
}

/**
 * Validates that a command line doesn't contain suspicious patterns
 * Provides an additional check for common injection attempts
 *
 * @param commandLine The full command line to check
 * @returns true if the command line appears safe, false if it contains injection patterns
 */
export function isCommandLineSafe(commandLine: string): boolean {
  if (!commandLine || typeof commandLine !== 'string') {
    return false;
  }

  // Check for common injection patterns
  const injectionPatterns = [
    /;\s*rm\s+-rf/i,           // Dangerous rm command
    /;\s*dd\s+if=/i,           // Dangerous dd command
    />\s*\/dev\/sda/i,         // Writing to block devices
    /\$\(.*\)/,                // Command substitution
    /`[^`]*`/,                 // Backtick command substitution
    /\|\s*nc\s+/i,             // Piping to netcat
    />\s*\/etc\//i,            // Writing to system directories
  ];

  return !injectionPatterns.some(pattern => pattern.test(commandLine));
}
