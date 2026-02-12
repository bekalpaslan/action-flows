/**
 * Edge Case Tests for Parser Regex Patterns
 * Tests the 7 identified edge cases from remediation plan Phase A, Step 3
 */

import { describe, it, expect } from 'vitest';
import {
  parseChainCompilation,
  parseExecutionComplete,
  parseErrorAnnouncement,
  parseContextRouting,
  parseAnalysisReport,
} from '../parsers/index.js';
import { parseIndexEntry } from '../parsers/registryParser.js';

describe('Parser Edge Cases - Phase A, Step 3', () => {
  describe('Issue 2: Commit hash length (7 chars → 7-40 chars)', () => {
    it('should accept 7-character commit hash (short form)', () => {
      const text = `| 2026-02-09 | Test Feature | code → review | ✅ Complete (abc1234) |`;
      // This would be parsed by indexParser's parseIndexEntry
      // Format: | date | description | flow | status (hash) |
      const match = text.match(/\(([a-f0-9]{7,40})\)/);
      expect(match?.[1]).toBe('abc1234');
    });

    it('should accept 40-character commit hash (full SHA-1)', () => {
      const text = `| 2026-02-09 | Test Feature | code → review | ✅ Complete (abc123def456789012345678901234567890) |`;
      const match = text.match(/\(([a-f0-9]{7,40})\)/);
      expect(match?.[1]).toBe('abc123def456789012345678901234567890');
      expect(match?.[1]).toHaveLength(40);
    });

    it('should accept hashes between 7-40 characters', () => {
      const text20 = `| 2026-02-09 | Feature | flow | ✅ Complete (abc123def456789abcdef12) |`;
      const match20 = text20.match(/\(([a-f0-9]{7,40})\)/);
      expect(match20?.[1]).toHaveLength(20);

      const text15 = `| 2026-02-09 | Feature | flow | ✅ Complete (abc123def45678ab) |`;
      const match15 = text15.match(/\(([a-f0-9]{7,40})\)/);
      expect(match15?.[1]).toHaveLength(15);
    });

    it('should reject hashes shorter than 7 characters', () => {
      const text = `| 2026-02-09 | Feature | flow | ✅ Complete (abc123) |`;
      const match = text.match(/\(([a-f0-9]{7,40})\)/);
      expect(match).toBeNull();
    });

    it('should reject hashes longer than 40 characters', () => {
      const text = `| 2026-02-09 | Feature | flow | ✅ Complete (abc123def456789012345678901234567890extra) |`;
      const match = text.match(/\(([a-f0-9]{7,40})\)/);
      expect(match).toBeNull();
    });
  });

  describe('Issue 3: Confidence score pattern (strict float validation)', () => {
    it('should accept integer confidence (0 to 1)', () => {
      const text = `**Confidence:** 1`;
      const match = text.match(/\*\*Confidence:\*\* (\d+(?:\.\d+)?)$/m);
      expect(match?.[1]).toBe('1');
    });

    it('should accept decimal confidence (0.85)', () => {
      const text = `**Confidence:** 0.85`;
      const match = text.match(/\*\*Confidence:\*\* (\d+(?:\.\d+)?)$/m);
      expect(match?.[1]).toBe('0.85');
    });

    it('should accept leading zero decimal (0.5)', () => {
      const text = `**Confidence:** 0.5`;
      const match = text.match(/\*\*Confidence:\*\* (\d+(?:\.\d+)?)$/m);
      expect(match?.[1]).toBe('0.5');
    });

    it('should reject invalid float like "1.2.3" (multiple dots)', () => {
      const text = `**Confidence:** 1.2.3`;
      const match = text.match(/\*\*Confidence:\*\* (\d+(?:\.\d+)?)$/m);
      expect(match).toBeNull();
    });

    it('should reject invalid float like "..5" (multiple leading dots)', () => {
      const text = `**Confidence:** ..5`;
      const match = text.match(/\*\*Confidence:\*\* (\d+(?:\.\d+)?)$/m);
      expect(match).toBeNull();
    });

    it('should reject scientific notation like "1e-2" (not valid confidence)', () => {
      const text = `**Confidence:** 1e-2`;
      const match = text.match(/\*\*Confidence:\*\* (\d+(?:\.\d+)?)$/m);
      expect(match).toBeNull();
    });

    it('should reject scientific notation like "5e2" (not valid confidence)', () => {
      const text = `**Confidence:** 5e2`;
      const match = text.match(/\*\*Confidence:\*\* (\d+(?:\.\d+)?)$/m);
      expect(match).toBeNull();
    });
  });

  describe('Issue 4: Table row pattern with pipes in cell content', () => {
    it('should parse table row with simple cell content', () => {
      const text = `| 1 | code | haiku | input=x | -- | Pending |`;
      const match = text.match(/^\| (\d+) \| ([a-z\-_/]+) \| (haiku|sonnet|opus) \| ([^|]+) \| (--|#\d+(?:,#\d+)*) \| (Pending|Done|Awaiting) \|$/m);
      expect(match?.[1]).toBe('1');
      expect(match?.[4]).toBe('input=x');
    });

    it('should handle table row with pipe character in cell content (e.g., "x|y")', () => {
      const text = `| 1 | code | haiku | input=x|y | -- | Pending |`;
      // Old pattern would fail; new pattern uses [^|]+ to stop at pipe
      const match = text.match(/^\| (\d+) \| ([a-z\-_/]+) \| (haiku|sonnet|opus) \| ([^|]+) \| (--|#\d+(?:,#\d+)*) \| (Pending|Done|Awaiting) \|$/m);
      expect(match).not.toBeNull();
      expect(match?.[4]).toBe('input=x');
    });

    it('should handle paths with pipes like "a|b/c|d"', () => {
      const text = `| 2 | review | sonnet | path/to/file|name|version | #1 | Done |`;
      const match = text.match(/^\| (\d+) \| ([a-z\-_/]+) \| (haiku|sonnet|opus) \| ([^|]+) \| (--|#\d+(?:,#\d+)*) \| (Pending|Done|Awaiting) \|$/m);
      expect(match).not.toBeNull();
      expect(match?.[4]).toBe('path/to/file');
    });

    it('should handle complex content with operators', () => {
      const text = `| 3 | audit | opus | operation=filter|map|reduce | #1,#2 | Awaiting |`;
      const match = text.match(/^\| (\d+) \| ([a-z\-_/]+) \| (haiku|sonnet|opus) \| ([^|]+) \| (--|#\d+(?:,#\d+)*) \| (Pending|Done|Awaiting) \|$/m);
      expect(match).not.toBeNull();
      expect(match?.[4]).toBe('operation=filter');
    });
  });

  describe('Issue 5: Step description pattern (trailing slash requirement)', () => {
    it('should parse step description with action "code" (no slash)', () => {
      const text = `1. **code** -- Some description here`;
      const match = text.match(/^(\d+)\. \*\*([a-z\-_/]+)\*\* -- (.+)$/m);
      expect(match?.[1]).toBe('1');
      expect(match?.[2]).toBe('code');
      expect(match?.[3]).toBe('Some description here');
    });

    it('should parse step description with action "review" (no slash)', () => {
      const text = `2. **review** -- Another description`;
      const match = text.match(/^(\d+)\. \*\*([a-z\-_/]+)\*\* -- (.+)$/m);
      expect(match?.[1]).toBe('2');
      expect(match?.[2]).toBe('review');
      expect(match?.[3]).toBe('Another description');
    });

    it('should parse step description with action "code/analyze" (with slash)', () => {
      const text = `3. **code/analyze** -- Description with slash`;
      const match = text.match(/^(\d+)\. \*\*([a-z\-_/]+)\*\* -- (.+)$/m);
      expect(match?.[1]).toBe('3');
      expect(match?.[2]).toBe('code/analyze');
      expect(match?.[3]).toBe('Description with slash');
    });

    it('should parse step description with hyphens and underscores', () => {
      const text = `4. **code-generate_docs** -- Complex action name`;
      const match = text.match(/^(\d+)\. \*\*([a-z\-_/]+)\*\* -- (.+)$/m);
      expect(match?.[1]).toBe('4');
      expect(match?.[2]).toBe('code-generate_docs');
    });
  });

  describe('Issue 6: Recovery options pattern (optional details, case-insensitive)', () => {
    it('should parse recovery option with details', () => {
      const text = `- Retry with exponential backoff`;
      const match = text.match(/^- (Retry|Skip|Cancel)(?: (.+))?$/mi);
      expect(match?.[1]).toBe('Retry');
      expect(match?.[2]).toBe('with exponential backoff');
    });

    it('should parse recovery option without details', () => {
      const text = `- Skip`;
      const match = text.match(/^- (Retry|Skip|Cancel)(?: (.+))?$/mi);
      expect(match?.[1]).toBe('Skip');
      expect(match?.[2]).toBeUndefined();
    });

    it('should handle lowercase action names', () => {
      const text = `- retry the failed step`;
      const match = text.match(/^- (Retry|Skip|Cancel)(?: (.+))?$/mi);
      expect(match?.[1]).toBe('retry');
      expect(match?.[2]).toBe('the failed step');
    });

    it('should handle mixed case action names', () => {
      const text = `- CANCEL operations`;
      const match = text.match(/^- (Retry|Skip|Cancel)(?: (.+))?$/mi);
      expect(match?.[1]).toBe('CANCEL');
      expect(match?.[2]).toBe('operations');
    });

    it('should parse all three recovery options', () => {
      const options = [
        `- Retry`,
        `- Skip optional step`,
        `- Cancel entire chain`,
      ];

      const pattern = /^- (Retry|Skip|Cancel)(?: (.+))?$/mi;
      expect(options[0]?.match(pattern)?.[1]).toBe('Retry');
      expect(options[1]?.match(pattern)?.[1]).toBe('Skip');
      expect(options[2]?.match(pattern)?.[1]).toBe('Cancel');
    });
  });

  describe('Issue 7: Analysis aspect pattern (flexible enum)', () => {
    it('should accept hardcoded aspects: coverage', () => {
      const text = `**Aspect:** coverage`;
      const match = text.match(/^\*\*Aspect:\*\* (.+)$/m);
      expect(match?.[1]).toBe('coverage');
    });

    it('should accept hardcoded aspects: dependencies', () => {
      const text = `**Aspect:** dependencies`;
      const match = text.match(/^\*\*Aspect:\*\* (.+)$/m);
      expect(match?.[1]).toBe('dependencies');
    });

    it('should accept hardcoded aspects: structure', () => {
      const text = `**Aspect:** structure`;
      const match = text.match(/^\*\*Aspect:\*\* (.+)$/m);
      expect(match?.[1]).toBe('structure');
    });

    it('should accept hardcoded aspects: drift', () => {
      const text = `**Aspect:** drift`;
      const match = text.match(/^\*\*Aspect:\*\* (.+)$/m);
      expect(match?.[1]).toBe('drift');
    });

    it('should accept hardcoded aspects: inventory', () => {
      const text = `**Aspect:** inventory`;
      const match = text.match(/^\*\*Aspect:\*\* (.+)$/m);
      expect(match?.[1]).toBe('inventory');
    });

    it('should accept hardcoded aspects: impact', () => {
      const text = `**Aspect:** impact`;
      const match = text.match(/^\*\*Aspect:\*\* (.+)$/m);
      expect(match?.[1]).toBe('impact');
    });

    it('should accept NEW aspects like "consistency"', () => {
      const text = `**Aspect:** consistency`;
      const match = text.match(/^\*\*Aspect:\*\* (.+)$/m);
      expect(match?.[1]).toBe('consistency');
    });

    it('should accept custom aspect names like "performance-analysis"', () => {
      const text = `**Aspect:** performance-analysis`;
      const match = text.match(/^\*\*Aspect:\*\* (.+)$/m);
      expect(match?.[1]).toBe('performance-analysis');
    });

    it('should accept multi-word aspects like "code quality"', () => {
      const text = `**Aspect:** code quality`;
      const match = text.match(/^\*\*Aspect:\*\* (.+)$/m);
      expect(match?.[1]).toBe('code quality');
    });

    it('should reject empty aspect', () => {
      const text = `**Aspect:** `;
      const match = text.match(/^\*\*Aspect:\*\* (.+)$/m);
      expect(match).toBeNull();
    });
  });

  describe('Integration: Real-world parser scenarios', () => {
    it('should parse ChainCompilation with pipes in input parameters', () => {
      const text = `## Chain: Test Feature
**Request:** Implement feature
**Source:** orchestrator
| # | Action | Model | Key Inputs | Waits For | Status |
| 1 | code | haiku | input=a|b|c | -- | Pending |
1. **code** -- Generate code
Execute?`;
      const parsed = parseChainCompilation(text);
      expect(parsed).not.toBeNull();
      expect(parsed?.steps?.[0]?.keyInputs).toBe('input=a');
    });

    it('should parse ExecutionComplete with pipes in result field', () => {
      const text = `## Done: Test Feature
| # | Action | Status | Result |
| 1 | code | Done | result=x|y |
**Logs:** \`path/to/logs\`
**Learnings:** Feature completed`;
      const parsed = parseExecutionComplete(text);
      expect(parsed).not.toBeNull();
    });

    it('should parse ContextRouting with various confidence values', () => {
      const text = `## Routing: Test request
**Context:** work
**Confidence:** 0.95
**Flow:** code-and-review
**Actions:** code, review, commit
**Disambiguated:** true`;
      const parsed = parseContextRouting(text);
      expect(parsed).not.toBeNull();
    });

    it('should parse ErrorAnnouncement with recovery options without details', () => {
      const text = `## Error: Compilation failed
**Step:** 2 — code
**Message:** TypeScript error
**Context:** packages/shared/src
**Recovery options:**
- Retry
- Skip
- Cancel`;
      const parsed = parseErrorAnnouncement(text);
      expect(parsed).not.toBeNull();
    });

    it('should parse AnalysisReport with new aspect type', () => {
      const text = `# Codebase Health Check
**Aspect:** performance-bottlenecks
**Scope:** packages/backend
**Date:** 2026-02-09
**Agent:** analyze

## 1. Database Queries
Content here

## Recommendations
- Optimize queries`;
      const parsed = parseAnalysisReport(text);
      expect(parsed).not.toBeNull();
      expect(parsed?.aspect).toBe('performance-bottlenecks');
    });
  });
});
