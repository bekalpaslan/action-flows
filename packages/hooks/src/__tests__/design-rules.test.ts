import { describe, it, expect } from 'vitest';
import {
  CRITICAL_PATTERNS,
  WARNING_PATTERNS,
  VALIDATED_EXTENSIONS,
  SKIP_PATTERNS,
  type DesignRule,
} from '../utils/design-rules.js';

/**
 * Helper: find a pattern by rule name and test against input.
 * Resets lastIndex before each test (global flag regex is stateful).
 */
function matchesRule(rules: DesignRule[], ruleName: string, input: string): boolean {
  const rule = rules.find((r) => r.rule === ruleName);
  if (!rule) throw new Error(`Rule "${ruleName}" not found`);
  rule.pattern.lastIndex = 0;
  return rule.pattern.test(input);
}

function matchesAnySkip(skipPatterns: RegExp[], input: string): boolean {
  return skipPatterns.some((p) => {
    p.lastIndex = 0;
    return p.test(input);
  });
}

describe('CRITICAL_PATTERNS', () => {
  describe('no-raw-hex', () => {
    it('matches color: #fff', () => {
      expect(matchesRule(CRITICAL_PATTERNS, 'no-raw-hex', 'color: #fff')).toBe(true);
    });

    it('matches background-color: #1a2b3c', () => {
      expect(matchesRule(CRITICAL_PATTERNS, 'no-raw-hex', 'background-color: #1a2b3c')).toBe(true);
    });

    it('matches fill: #abc', () => {
      expect(matchesRule(CRITICAL_PATTERNS, 'no-raw-hex', 'fill: #abc')).toBe(true);
    });

    it('matches stroke: #FF00FF', () => {
      expect(matchesRule(CRITICAL_PATTERNS, 'no-raw-hex', 'stroke: #FF00FF')).toBe(true);
    });

    it('does not match var(--color-primary)', () => {
      expect(matchesRule(CRITICAL_PATTERNS, 'no-raw-hex', 'var(--color-primary)')).toBe(false);
    });

    it('does not match color: var(--color-text)', () => {
      expect(matchesRule(CRITICAL_PATTERNS, 'no-raw-hex', 'color: var(--color-text)')).toBe(false);
    });
  });

  describe('no-raw-color-fn', () => {
    it('matches color: rgb(255, 0, 0)', () => {
      expect(matchesRule(CRITICAL_PATTERNS, 'no-raw-color-fn', 'color: rgb(255, 0, 0)')).toBe(true);
    });

    it('matches background: rgba(0,0,0,0.5)', () => {
      expect(matchesRule(CRITICAL_PATTERNS, 'no-raw-color-fn', 'background: rgba(0,0,0,0.5)')).toBe(true);
    });

    it('does not match color: var(--color-text)', () => {
      expect(matchesRule(CRITICAL_PATTERNS, 'no-raw-color-fn', 'color: var(--color-text)')).toBe(false);
    });
  });

  describe('no-inline-style', () => {
    it('matches style={{ color: "red" }}', () => {
      expect(matchesRule(CRITICAL_PATTERNS, 'no-inline-style', 'style={{ color: "red" }}')).toBe(true);
    });

    it('does not match className="text-body"', () => {
      expect(matchesRule(CRITICAL_PATTERNS, 'no-inline-style', 'className="text-body"')).toBe(false);
    });
  });
});

describe('WARNING_PATTERNS', () => {
  describe('hex-outside-tokens', () => {
    it("matches '#fff'", () => {
      expect(matchesRule(WARNING_PATTERNS, 'hex-outside-tokens', "'#fff'")).toBe(true);
    });

    it('matches "#1a2b3c"', () => {
      expect(matchesRule(WARNING_PATTERNS, 'hex-outside-tokens', '"#1a2b3c"')).toBe(true);
    });

    it('does not match #fff without quotes', () => {
      expect(matchesRule(WARNING_PATTERNS, 'hex-outside-tokens', '#fff')).toBe(false);
    });

    it('does not match var(--color-primary)', () => {
      expect(matchesRule(WARNING_PATTERNS, 'hex-outside-tokens', 'var(--color-primary)')).toBe(false);
    });
  });
});

describe('VALIDATED_EXTENSIONS', () => {
  it('includes .tsx', () => {
    expect(VALIDATED_EXTENSIONS).toContain('.tsx');
  });

  it('includes .css', () => {
    expect(VALIDATED_EXTENSIONS).toContain('.css');
  });

  it('does not include .ts', () => {
    expect(VALIDATED_EXTENSIONS).not.toContain('.ts');
  });

  it('does not include .js', () => {
    expect(VALIDATED_EXTENSIONS).not.toContain('.js');
  });

  it('does not include .json', () => {
    expect(VALIDATED_EXTENSIONS).not.toContain('.json');
  });
});

describe('SKIP_PATTERNS', () => {
  it('matches Component.test.tsx', () => {
    expect(matchesAnySkip(SKIP_PATTERNS, 'Component.test.tsx')).toBe(true);
  });

  it('matches design-tokens.css', () => {
    expect(matchesAnySkip(SKIP_PATTERNS, 'design-tokens.css')).toBe(true);
  });

  it('matches __tests__/foo.tsx', () => {
    expect(matchesAnySkip(SKIP_PATTERNS, '__tests__/foo.tsx')).toBe(true);
  });

  it('matches file.spec.ts', () => {
    expect(matchesAnySkip(SKIP_PATTERNS, 'file.spec.ts')).toBe(true);
  });

  it('does not match Component.tsx', () => {
    expect(matchesAnySkip(SKIP_PATTERNS, 'Component.tsx')).toBe(false);
  });

  it('does not match styles.css', () => {
    expect(matchesAnySkip(SKIP_PATTERNS, 'styles.css')).toBe(false);
  });

  it('does not match utils.ts', () => {
    expect(matchesAnySkip(SKIP_PATTERNS, 'utils.ts')).toBe(false);
  });
});
