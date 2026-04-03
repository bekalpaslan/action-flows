/**
 * Design System Validation Rules
 *
 * Shared regex patterns for PreToolUse (block) and PostToolUse (warn) hooks.
 * Enforces design token usage and prevents raw CSS values in agent output.
 *
 * Rule strictness: Moderate (D-03) -- blocks raw hex/rgb in CSS property context,
 * warns on hex strings elsewhere. Skips test files, config, and token definitions.
 */

/**
 * Shape of a design validation rule.
 * Each rule has a name, a regex pattern, and a human-readable message.
 */
export interface DesignRule {
  /** Unique rule identifier */
  rule: string;
  /** Regex pattern to match violations (uses global flag) */
  pattern: RegExp;
  /** Human-readable violation message */
  message: string;
}

/**
 * Critical patterns -- blocked by PreToolUse (exit 2).
 * These represent definite design system violations in CSS property contexts.
 */
export const CRITICAL_PATTERNS: DesignRule[] = [
  {
    rule: 'no-raw-hex',
    pattern: /(?:color|background(?:-color)?|border(?:-color)?|fill|stroke|outline-color)\s*:\s*#[0-9a-fA-F]{3,8}\b/g,
    message: 'Raw hex color detected. Use var(--color-*) design tokens.',
  },
  {
    rule: 'no-raw-color-fn',
    pattern: /(?:color|background(?:-color)?|border(?:-color)?|fill|stroke)\s*:\s*(?:rgb|rgba|hsl|hsla)\s*\(/g,
    message: 'Raw color function detected. Use var(--color-*) design tokens.',
  },
  {
    rule: 'no-inline-style',
    pattern: /style\s*=\s*\{\s*\{/g,
    message: 'Inline style attribute detected. Use Tailwind classes with design tokens.',
  },
];

/**
 * Warning patterns -- surfaced by PostToolUse (advise only, no block).
 * These represent potential design system concerns outside CSS property contexts.
 */
export const WARNING_PATTERNS: DesignRule[] = [
  {
    rule: 'hex-outside-tokens',
    pattern: /['"]#[0-9a-fA-F]{3,8}['"]/g,
    message: 'Hex color string found. Consider using a design token reference.',
  },
];

/**
 * File extensions that hooks should validate.
 * Only .tsx (React components) and .css (stylesheets) are checked.
 * Plain .ts logic files, .js, .json etc. are excluded (D-04).
 */
export const VALIDATED_EXTENSIONS: string[] = ['.tsx', '.css'];

/**
 * File path patterns to skip validation on.
 * Test files, config files, design token definitions, and framework internals.
 */
export const SKIP_PATTERNS: RegExp[] = [
  /\.test\./,
  /\.spec\./,
  /\.config\./,
  /design-tokens/,
  /theme\.css/,
  /__tests__/,
  /__mocks__/,
  /node_modules/,
];
