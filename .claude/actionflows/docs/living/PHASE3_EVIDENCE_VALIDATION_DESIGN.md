# Phase 3: Evidence Validation — Design Specification

**Status:** Design Complete, Ready for Implementation
**Approach:** Option B (Bidirectional Hook + Service)
**Estimated Effort:** 7-10 hours (3 sub-phases)
**Design Date:** 2026-02-13

---

## Executive Summary

Phase 3 adds **evidence verification** to the immune system's Healing Layer (Gates 12-14), ensuring that closed learnings have valid, verifiable evidence. This prevents "paper closures" where learnings are marked resolved without actual fixes.

**Core Innovation:** Bidirectional validation — both forward (during dissolution) and backward (audit trail verification) — with non-blocking async validation that doesn't delay commits.

---

## Architecture Overview

### Component Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                     Orchestrator                                 │
│  (Triggers validation after chain completion)                    │
└─────────────────────┬────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│               Gate 13 Validator (Enhanced)                       │
│  - Extracts evidence from closure lines                          │
│  - Calls EvidenceVerifier for each closed learning               │
│  - Records validation results in trace metadata                  │
│  - Calculates harmony score based on evidence validity           │
└─────────────────────┬────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│              EvidenceVerifier Service (NEW)                      │
│  - validateCommitHash() — git rev-parse verification             │
│  - validateFile() — filesystem checks                            │
│  - validateReason() — text pattern matching                      │
│  - 1-minute caching layer for performance                        │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
1. Chain completes → Orchestrator surfaces learning
                  ↓
2. Gate 13 triggered → Parse closure evidence
                  ↓
3. Extract evidence → Type: commit|file|reason|escalated
                  ↓
4. Call EvidenceVerifier → Validate via git/filesystem/text
                  ↓
5. Record validation → Metadata + harmony score
                  ↓
6. Surface warnings → Orchestrator output (non-blocking)
```

---

## Phase 3A: Evidence Verifier Service

### 1.1 Class Structure

**File:** `packages/backend/src/services/evidenceVerifier.ts`

```typescript
/**
 * Evidence Verifier Service
 *
 * Validates evidence provided for closed learnings in LEARNINGS.md.
 * Supports 5 evidence types: commit hash, file reference, documented reason,
 * escalated status, and dissolution.
 *
 * ## Validation Methods
 *
 * - **Commit Hash:** Uses `git rev-parse --verify {hash}` to confirm existence
 * - **File Reference:** Checks filesystem with path.resolve() + fs.existsSync()
 * - **Documented Reason:** Text pattern matching (always valid if formatted correctly)
 * - **Escalated Status:** Recognizes architectural/design gap escalations (always valid)
 * - **Dissolution:** Same as commit hash, extracted from "Status: Closed" line
 *
 * ## Caching Strategy
 *
 * - Cache TTL: 60 seconds (1 minute)
 * - Cache key: `{type}:{value}` (e.g., "commit:c8a059b", "file:docs/MEMORY.md")
 * - Prevents repeated git calls for same hash within short timeframe
 * - Clears automatically on TTL expiration
 *
 * ## Error Handling
 *
 * - **Git unavailable:** Graceful degradation, mark as "unverified"
 * - **Commit not found:** Warn but don't crash (might be detached HEAD)
 * - **File missing:** Warn (file may have moved/deleted after closure)
 * - **Malformed hash:** Reject immediately (obviously incorrect format)
 */

import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

export interface EvidenceValidationResult {
  evidenceType: 'commit' | 'file' | 'reason' | 'escalated' | 'unknown';
  isValid: boolean;
  reason: string;
  timestamp: Date;
  sourceHash?: string;       // For commit evidence
  sourceFile?: string;        // For file evidence
  cached?: boolean;           // True if result came from cache
}

interface CacheEntry {
  result: EvidenceValidationResult;
  expiresAt: number;
}

export class EvidenceVerifier {
  private cache: Map<string, CacheEntry> = new Map();
  private readonly CACHE_TTL_MS = 60_000; // 1 minute
  private readonly workingDirectory: string;

  constructor(workingDirectory: string) {
    this.workingDirectory = workingDirectory;
  }

  /**
   * Validate commit hash using git rev-parse
   * Accepts both short (7-char) and long (40-char) hashes
   */
  async validateCommitHash(hash: string): Promise<EvidenceValidationResult> {
    // Check cache first
    const cacheKey = `commit:${hash}`;
    const cached = this.checkCache(cacheKey);
    if (cached) {
      return { ...cached, cached: true };
    }

    // Validate hash format (7-40 hex chars)
    if (!/^[a-f0-9]{7,40}$/i.test(hash)) {
      const result: EvidenceValidationResult = {
        evidenceType: 'commit',
        isValid: false,
        reason: `Malformed commit hash: "${hash}" (expected 7-40 hex characters)`,
        timestamp: new Date(),
        sourceHash: hash,
      };
      this.setCache(cacheKey, result);
      return result;
    }

    try {
      // Run git rev-parse to verify commit exists
      execSync(`git rev-parse --verify ${hash}`, {
        cwd: this.workingDirectory,
        stdio: 'pipe',
        timeout: 5000, // 5 second timeout
      });

      const result: EvidenceValidationResult = {
        evidenceType: 'commit',
        isValid: true,
        reason: `Commit ${hash} verified in repository`,
        timestamp: new Date(),
        sourceHash: hash,
      };
      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      // Check if git is unavailable vs commit not found
      const errorMsg = error instanceof Error ? error.message : String(error);

      if (errorMsg.includes('not a git repository') || errorMsg.includes('git: command not found')) {
        return {
          evidenceType: 'commit',
          isValid: false,
          reason: 'Git unavailable (graceful degradation)',
          timestamp: new Date(),
          sourceHash: hash,
        };
      }

      const result: EvidenceValidationResult = {
        evidenceType: 'commit',
        isValid: false,
        reason: `Commit ${hash} not found in repository`,
        timestamp: new Date(),
        sourceHash: hash,
      };
      this.setCache(cacheKey, result);
      return result;
    }
  }

  /**
   * Validate file reference using filesystem
   * Resolves relative paths against working directory
   */
  async validateFile(filePath: string): Promise<EvidenceValidationResult> {
    // Check cache first
    const cacheKey = `file:${filePath}`;
    const cached = this.checkCache(cacheKey);
    if (cached) {
      return { ...cached, cached: true };
    }

    try {
      // Resolve path relative to working directory
      const resolvedPath = path.resolve(this.workingDirectory, filePath);

      // Normalize path for cross-platform consistency
      const normalizedPath = path.normalize(resolvedPath);

      // Check if file exists
      const exists = fs.existsSync(normalizedPath);

      const result: EvidenceValidationResult = {
        evidenceType: 'file',
        isValid: exists,
        reason: exists
          ? `File exists: ${filePath}`
          : `File not found: ${filePath} (may have been moved/deleted)`,
        timestamp: new Date(),
        sourceFile: normalizedPath,
      };
      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      const result: EvidenceValidationResult = {
        evidenceType: 'file',
        isValid: false,
        reason: `Error checking file: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date(),
        sourceFile: filePath,
      };
      this.setCache(cacheKey, result);
      return result;
    }
  }

  /**
   * Validate documented reason
   * Always valid if formatted correctly (text validation only)
   */
  async validateReason(reason: string): Promise<EvidenceValidationResult> {
    // Check cache first
    const cacheKey = `reason:${reason}`;
    const cached = this.checkCache(cacheKey);
    if (cached) {
      return { ...cached, cached: true };
    }

    // Documented reasons are always valid if they have substance
    const isValid = reason.trim().length > 10; // At least 10 chars of explanation

    const result: EvidenceValidationResult = {
      evidenceType: 'reason',
      isValid,
      reason: isValid
        ? `Documented reason provided: "${reason.substring(0, 50)}..."`
        : `Documented reason too short: "${reason}"`,
      timestamp: new Date(),
    };
    this.setCache(cacheKey, result);
    return result;
  }

  /**
   * Validate escalated status
   * Always valid (architectural gaps are legitimate closures)
   */
  async validateEscalated(escalationReason: string): Promise<EvidenceValidationResult> {
    return {
      evidenceType: 'escalated',
      isValid: true,
      reason: `Learning escalated: ${escalationReason}`,
      timestamp: new Date(),
    };
  }

  /**
   * Validate all evidence for a learning entry
   * Parses evidence string and routes to appropriate validator
   */
  async validateAll(evidenceString: string): Promise<EvidenceValidationResult> {
    // Pattern 1: Commit hash
    const commitMatch = evidenceString.match(/Evidence:\s+commit\s+([a-f0-9]{7,40})/i);
    if (commitMatch) {
      return this.validateCommitHash(commitMatch[1]);
    }

    // Pattern 2: File reference
    const fileMatch = evidenceString.match(/Evidence:\s+file\s+([^\s]+)/i);
    if (fileMatch) {
      return this.validateFile(fileMatch[1]);
    }

    // Pattern 3: Documented reason
    const docMatch = evidenceString.match(/Evidence:\s+documented\s+(?:in|as)\s+([^\n]+)/i);
    if (docMatch) {
      return this.validateReason(docMatch[1]);
    }

    // Pattern 4: Escalated status
    const escalatedMatch = evidenceString.match(/Status:\s+Escalated\s+\(([^)]+)\)/i);
    if (escalatedMatch) {
      return this.validateEscalated(escalatedMatch[1]);
    }

    // Pattern 5: Dissolution (commit within closed status)
    const dissolutionMatch = evidenceString.match(/Status:\s+Closed.*?Evidence:\s+commit\s+([a-f0-9]{7,40})/is);
    if (dissolutionMatch) {
      return this.validateCommitHash(dissolutionMatch[1]);
    }

    // Unknown evidence format
    return {
      evidenceType: 'unknown',
      isValid: false,
      reason: 'Evidence format not recognized',
      timestamp: new Date(),
    };
  }

  /**
   * Check cache for recent validation result
   */
  private checkCache(key: string): EvidenceValidationResult | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.result;
  }

  /**
   * Store validation result in cache
   */
  private setCache(key: string, result: EvidenceValidationResult): void {
    this.cache.set(key, {
      result,
      expiresAt: Date.now() + this.CACHE_TTL_MS,
    });
  }

  /**
   * Clear all cached results (for testing)
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics (for monitoring)
   */
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()),
    };
  }
}
```

### 1.2 Unit Tests

**File:** `packages/backend/src/services/__tests__/evidenceVerifier.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { EvidenceVerifier } from '../evidenceVerifier.js';
import * as path from 'path';

describe('EvidenceVerifier', () => {
  let verifier: EvidenceVerifier;
  const workingDir = path.resolve(__dirname, '../../../..');

  beforeEach(() => {
    verifier = new EvidenceVerifier(workingDir);
  });

  describe('validateCommitHash', () => {
    it('validates real commit hash', async () => {
      // Use a known commit from the project
      const result = await verifier.validateCommitHash('333d065');
      expect(result.evidenceType).toBe('commit');
      expect(result.isValid).toBe(true);
      expect(result.sourceHash).toBe('333d065');
    });

    it('rejects malformed hash', async () => {
      const result = await verifier.validateCommitHash('zzz123');
      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('Malformed');
    });

    it('rejects non-existent hash', async () => {
      const result = await verifier.validateCommitHash('abc1234');
      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('not found');
    });

    it('uses cache on second call', async () => {
      await verifier.validateCommitHash('333d065');
      const result = await verifier.validateCommitHash('333d065');
      expect(result.cached).toBe(true);
    });
  });

  describe('validateFile', () => {
    it('validates existing file', async () => {
      const result = await verifier.validateFile('README.md');
      expect(result.evidenceType).toBe('file');
      expect(result.isValid).toBe(true);
    });

    it('rejects non-existent file', async () => {
      const result = await verifier.validateFile('does-not-exist.md');
      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('not found');
    });

    it('handles nested paths', async () => {
      const result = await verifier.validateFile('.claude/actionflows/LEARNINGS.md');
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateReason', () => {
    it('validates documented reason', async () => {
      const result = await verifier.validateReason('documented in MEMORY.md section 3');
      expect(result.evidenceType).toBe('reason');
      expect(result.isValid).toBe(true);
    });

    it('rejects too-short reason', async () => {
      const result = await verifier.validateReason('fix');
      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('too short');
    });
  });

  describe('validateEscalated', () => {
    it('always validates escalated status', async () => {
      const result = await verifier.validateEscalated('architectural gap');
      expect(result.evidenceType).toBe('escalated');
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateAll', () => {
    it('routes commit evidence correctly', async () => {
      const result = await verifier.validateAll('Evidence: commit 333d065');
      expect(result.evidenceType).toBe('commit');
    });

    it('routes file evidence correctly', async () => {
      const result = await verifier.validateAll('Evidence: file README.md');
      expect(result.evidenceType).toBe('file');
    });

    it('routes documented evidence correctly', async () => {
      const result = await verifier.validateAll('Evidence: documented in MEMORY.md');
      expect(result.evidenceType).toBe('reason');
    });

    it('routes escalated evidence correctly', async () => {
      const result = await verifier.validateAll('Status: Escalated (architectural gap)');
      expect(result.evidenceType).toBe('escalated');
    });

    it('handles dissolution pattern', async () => {
      const result = await verifier.validateAll('Status: Closed (dissolved) — Evidence: commit 333d065');
      expect(result.evidenceType).toBe('commit');
    });

    it('rejects unknown format', async () => {
      const result = await verifier.validateAll('Some random text');
      expect(result.evidenceType).toBe('unknown');
      expect(result.isValid).toBe(false);
    });
  });

  describe('caching', () => {
    it('clears cache on clearCache()', async () => {
      await verifier.validateCommitHash('333d065');
      expect(verifier.getCacheStats().size).toBe(1);
      verifier.clearCache();
      expect(verifier.getCacheStats().size).toBe(0);
    });
  });
});
```

---

## Phase 3B: Enhanced Gate 13 Validator

### 2.1 Enhanced Validator

**File:** `packages/backend/src/services/checkpoints/gate13-learning-surface.ts` (modifications)

Add the following imports and logic to the existing Gate 13 validator:

```typescript
import { EvidenceVerifier } from '../evidenceVerifier.js';

// Initialize evidence verifier (singleton pattern)
let evidenceVerifier: EvidenceVerifier | null = null;

function getEvidenceVerifier(): EvidenceVerifier {
  if (!evidenceVerifier) {
    // Use working directory from project config
    const workingDir = process.cwd(); // Or read from config
    evidenceVerifier = new EvidenceVerifier(workingDir);
  }
  return evidenceVerifier;
}

/**
 * Extract evidence strings from orchestrator output for closed learnings
 * Returns map of learning ID -> evidence string
 */
function extractEvidenceStrings(orchestratorOutput: string): Map<string, string> {
  const evidenceMap = new Map<string, string>();
  const learningIds = extractLearningIds(orchestratorOutput);

  for (const id of learningIds) {
    // Match the entire learning entry (from L00X to next L00X or end)
    const entryPattern = new RegExp(
      `(${id}[\\s\\S]*?)(?=\\n###\\s+L\\d{3}|$)`,
      'i'
    );
    const entryMatch = orchestratorOutput.match(entryPattern);

    if (entryMatch) {
      const entryText = entryMatch[1];

      // Check if this learning is closed
      if (/Status:\s+Closed/i.test(entryText)) {
        // Extract evidence portion
        const evidenceMatch = entryText.match(
          /Evidence:\s+[^\n]+|Status:\s+Escalated\s+\([^)]+\)/i
        );

        if (evidenceMatch) {
          evidenceMap.set(id, evidenceMatch[0]);
        }
      }
    }
  }

  return evidenceMap;
}

/**
 * Validate evidence for all closed learnings
 * Returns validation results map
 */
async function validateClosureEvidence(
  orchestratorOutput: string
): Promise<Map<string, EvidenceValidationResult>> {
  const verifier = getEvidenceVerifier();
  const evidenceStrings = extractEvidenceStrings(orchestratorOutput);
  const validationResults = new Map<string, EvidenceValidationResult>();

  for (const [learningId, evidenceString] of evidenceStrings) {
    const result = await verifier.validateAll(evidenceString);
    validationResults.set(learningId, result);
  }

  return validationResults;
}

/**
 * Calculate harmony score based on evidence validity
 * Base: 100 (no closures)
 * Valid evidence: +0 (neutral)
 * Invalid evidence: -20 per learning
 * Unverified evidence: -10 per learning
 * Malformed evidence: -25 per learning
 */
function calculateEvidenceHarmonyScore(
  validationResults: Map<string, EvidenceValidationResult>,
  baseViolations: number
): number {
  let penalty = baseViolations * 20; // Base violations from format checks

  for (const result of validationResults.values()) {
    if (!result.isValid) {
      if (result.reason.includes('Malformed')) {
        penalty += 25; // Critical penalty for malformed evidence
      } else if (result.reason.includes('graceful degradation')) {
        penalty += 10; // Warning penalty for unverified evidence
      } else {
        penalty += 20; // Standard penalty for invalid evidence
      }
    }
  }

  return Math.max(0, 100 - penalty);
}
```

**Updated validateLearningSurface() function:**

Replace the existing section 3 (closure evidence check) and section 4 (harmony score) with:

```typescript
    // 3. If LEARNINGS.md update mentioned, validate closure evidence
    const learningsModified = /LEARNINGS\.md|learnings registry/i.test(orchestratorOutput);
    const closedCount = (orchestratorOutput.match(/Status:\s+Closed/gi) || []).length;

    let evidenceValidationResults = new Map<string, EvidenceValidationResult>();

    if (learningsModified && closedCount > 0) {
      selected = 'LEARNINGS_UPDATED';

      // Validate evidence for all closed learnings
      evidenceValidationResults = await validateClosureEvidence(orchestratorOutput);

      // Check for invalid evidence
      for (const [learningId, result] of evidenceValidationResults) {
        if (!result.isValid) {
          violations.push(
            `Learning ${learningId} closed with invalid evidence: ${result.reason}`
          );
        }
      }
    }

    // 4. Calculate harmony score (includes evidence validation)
    const harmonyScore = calculateEvidenceHarmonyScore(evidenceValidationResults, violations.length);
```

**Updated metadata section (line 116-127):**

```typescript
      metadata: {
        hasLearningHeader,
        hasFromField,
        hasIssueField,
        hasRootCause,
        hasSuggestedFix,
        hasStatus,
        learningsModified,
        learningIdsDetected: extractLearningIds(orchestratorOutput),
        violationCount: violations.length,
        closedCount,
        evidenceValidated: evidenceValidationResults.size,
        evidenceInvalidCount: Array.from(evidenceValidationResults.values()).filter(r => !r.isValid).length,
        evidenceResults: Array.from(evidenceValidationResults.entries()).map(([id, result]) => ({
          learningId: id,
          evidenceType: result.evidenceType,
          isValid: result.isValid,
          reason: result.reason,
          cached: result.cached,
        })),
      },
```

### 2.2 Evidence Extraction Regex Patterns

**Comprehensive Pattern Reference:**

```typescript
// Pattern 1: Commit hash (short or long)
// Example: "Evidence: commit c8a059b" or "Evidence: commit abc123def456..."
const COMMIT_PATTERN = /Evidence:\s+commit\s+([a-f0-9]{7,40})/i;

// Pattern 2: File reference
// Example: "Evidence: file docs/living/IMMUNE_SYSTEM.md"
const FILE_PATTERN = /Evidence:\s+file\s+([^\s]+)/i;

// Pattern 3: Documented reason (in/as variations)
// Example: "Evidence: documented in MEMORY.md" or "Evidence: documented as lesson"
const DOCUMENTED_PATTERN = /Evidence:\s+documented\s+(?:in|as)\s+([^\n]+)/i;

// Pattern 4: Escalated status
// Example: "Status: Escalated (architectural gap)"
const ESCALATED_PATTERN = /Status:\s+Escalated\s+\(([^)]+)\)/i;

// Pattern 5: Dissolution (commit within closed status)
// Example: "Status: Closed (dissolved) — Evidence: commit c8a059b"
const DISSOLUTION_PATTERN = /Status:\s+Closed.*?Evidence:\s+commit\s+([a-f0-9]{7,40})/is;

// Pattern 6: Learning entry boundary (for extracting full entry text)
const LEARNING_ENTRY_PATTERN = /(L\d{3}[\s\S]*?)(?=\n###\s+L\d{3}|$)/i;

// Pattern 7: Closure status check (any closed learning)
const CLOSURE_STATUS_PATTERN = /Status:\s+Closed/i;
```

---

## Phase 3C: Orchestrator Integration

### 3.1 ORCHESTRATOR.md Update

**Location:** `.claude/actionflows/ORCHESTRATOR.md`

**Section:** Add after "Post-Chain Completion Protocol (Mandatory)"

```markdown
### Evidence Validation Trigger (Gate 13 Enhancement)

When LEARNINGS.md is modified with closed learnings:

1. **Automatic Validation** — Gate 13 validator extracts evidence and validates via EvidenceVerifier
2. **Non-Blocking** — Validation happens async, doesn't delay commits
3. **Warning Surface** — If invalid evidence detected, surface warnings in completion summary

**Warning Format:**

```
⚠️ Evidence Validation Warnings:
- L001: Commit hash not found (abc1234 does not exist in repository)
- L012: File not found (docs/missing.md may have been moved/deleted)
```

**When to Escalate:**

- If >50% of closed learnings have invalid evidence → Surface in completion summary
- If evidence validation fails completely (git unavailable) → Note graceful degradation
- Never block commits on evidence validation failures (soft warnings only)
```

### 3.2 Warning Output Format

**Standard Format (added to Format 1.5: Chain Completion Summary):**

```markdown
## Evidence Validation Summary

**Learnings Validated:** 5 closed
**Evidence Status:**
- ✅ Valid: 3 learnings
- ⚠️ Invalid: 1 learning
- 🔍 Unverified: 1 learning (git unavailable)

**Warnings:**
- L012: File evidence invalid — docs/old-file.md not found (may have been moved)

**Harmony Impact:** -20 points (1 invalid evidence)
```

### 3.3 Health Score Integration

**File:** `packages/backend/src/services/healthScoreCalculator.ts`

Add Gate 13 harmony score to health calculation:

```typescript
/**
 * Calculate Gate 13 (Learning Surface) contribution to health score
 * Weight: 15% (high importance for learning capture)
 */
async function calculateGate13Health(chainId: ChainId): Promise<number> {
  const traces = await gateCheckpoint.getGateTraces(chainId, 'gate-13');
  if (traces.length === 0) return 100; // No learnings = neutral

  // Get most recent trace
  const latestTrace = traces[traces.length - 1];
  const harmonyScore = latestTrace.validationResult?.harmonyScore ?? 100;

  // Evidence validation affects harmony score (calculated in gate13 validator)
  // Invalid evidence: -20 points per learning
  // Unverified evidence: -10 points per learning
  // Malformed evidence: -25 points per learning

  return harmonyScore;
}
```

---

## Implementation Plan

### Phase 3A: Evidence Verifier Service (3-4 hours)

**Tasks:**

1. Create `packages/backend/src/services/evidenceVerifier.ts` ✓
2. Implement `validateCommitHash()` with git rev-parse ✓
3. Implement `validateFile()` with filesystem checks ✓
4. Implement `validateReason()` with text validation ✓
5. Implement `validateEscalated()` (always valid) ✓
6. Implement `validateAll()` routing logic ✓
7. Add caching layer (1-minute TTL) ✓
8. Write unit tests (`__tests__/evidenceVerifier.test.ts`) ✓

**Validation Criteria:**
- All 5 evidence types validated correctly
- Caching reduces git calls by >80% for repeated hashes
- Graceful degradation when git unavailable
- Cross-platform path handling (Windows/Linux/macOS)

### Phase 3B: Gate 13 Enhancement (2-3 hours)

**Tasks:**

1. Import EvidenceVerifier into gate13-learning-surface.ts ✓
2. Add `extractEvidenceStrings()` helper ✓
3. Add `validateClosureEvidence()` async validator ✓
4. Update `calculateHarmonyScore()` with evidence penalties ✓
5. Enhance metadata with validation results ✓
6. Test with existing LEARNINGS.md (5 closed entries)

**Validation Criteria:**
- All 5 closed learnings validated (L001, L013, L014, L016, L017, L018-L024)
- Gate 13 trace includes evidence validation results
- Harmony score adjusts based on validity
- No performance regression (<100ms for 5 validations)

### Phase 3C: Orchestrator Integration (2-3 hours)

**Tasks:**

1. Update ORCHESTRATOR.md with validation trigger ✓
2. Define warning output format ✓
3. Integrate Gate 13 harmony score into health calculator ✓
4. Test end-to-end flow (chain → learning → validation → warning)

**Validation Criteria:**
- Orchestrator surfaces warnings for invalid evidence
- Warnings are non-blocking (don't delay commits)
- Health score reflects evidence validity
- Dashboard displays Gate 13 trace with validation details

---

## Success Criteria

After Phase 3 implementation:

- ✅ All 5 closed learnings in LEARNINGS.md have validated evidence
- ✅ Git commit hashes verified via `git rev-parse`
- ✅ File references checked against filesystem
- ✅ Gate 13 harmony score reflects evidence validity
- ✅ Orchestrator surfaces clear warnings for invalid evidence
- ✅ No false positives (valid evidence marked as invalid)
- ✅ Graceful degradation if git unavailable
- ✅ Caching prevents performance issues (<100ms for 5 validations)
- ✅ Cross-platform support (Windows/Linux/macOS paths)

---

## Risk Assessment & Mitigation

### Risk R1: Git Calls Slow Down Gate 13 Validation

**Impact:** Medium
**Probability:** Low
**Mitigation:**
- 1-minute cache prevents repeated calls
- Async validation doesn't block orchestrator
- 5-second timeout on git operations
- Cache hit rate expected >80% in practice

**Fallback:** If performance issues detected, increase cache TTL to 5 minutes

### Risk R2: False Positives (Valid Hash Marked Invalid)

**Impact:** High
**Probability:** Low
**Mitigation:**
- Strict validation patterns (7-40 hex chars)
- Accept both short and long hashes
- Unit tests cover edge cases
- Graceful degradation message distinguishes "not found" from "unverifiable"

**Fallback:** Manual review of warnings during Phase 3C testing

### Risk R3: File Paths Hardcoded (Cross-Platform Issues)

**Impact:** Medium
**Probability:** Medium
**Mitigation:**
- Use `path.resolve()` for relative paths
- Use `path.normalize()` for cross-platform consistency
- Test on Windows (MINGW64) and Linux paths
- Accept both forward and backslashes

**Fallback:** Add path normalization utility if edge cases emerge

### Risk R4: Orchestrator Warning Spam

**Impact:** Low
**Probability:** Medium
**Mitigation:**
- Batch warnings (all learnings in single section)
- Only warn once per session (not on every chain)
- Threshold: Only surface if >1 invalid evidence
- Non-blocking warnings (don't interrupt flow)

**Fallback:** Add `--suppress-evidence-warnings` flag to orchestrator if needed

---

## Testing Strategy

### Unit Tests (Vitest)

**File:** `packages/backend/src/services/__tests__/evidenceVerifier.test.ts`

**Coverage:**
- ✅ validateCommitHash() with real commit
- ✅ validateCommitHash() with malformed hash
- ✅ validateCommitHash() with non-existent hash
- ✅ validateCommitHash() caching behavior
- ✅ validateFile() with existing file
- ✅ validateFile() with non-existent file
- ✅ validateFile() with nested paths
- ✅ validateReason() with valid reason
- ✅ validateReason() with too-short reason
- ✅ validateEscalated() always valid
- ✅ validateAll() routing logic (5 patterns)
- ✅ Cache expiration after 1 minute

**Target Coverage:** >95%

### Integration Tests

**Scenario 1: Valid Evidence (All Passing)**

```typescript
const learningsOutput = `
### L001: Test Learning
- Evidence: commit 333d065
- Status: Closed (dissolved)
`;

// Expected: harmonyScore = 100, no violations
```

**Scenario 2: Invalid Commit Hash**

```typescript
const learningsOutput = `
### L025: Test Learning
- Evidence: commit zzz1234
- Status: Closed
`;

// Expected: harmonyScore = 75, 1 violation (malformed hash)
```

**Scenario 3: Missing File**

```typescript
const learningsOutput = `
### L026: Test Learning
- Evidence: file docs/missing.md
- Status: Closed
`;

// Expected: harmonyScore = 80, 1 violation (file not found)
```

**Scenario 4: Git Unavailable (Graceful Degradation)**

```typescript
// Run test in non-git directory
const learningsOutput = `
### L027: Test Learning
- Evidence: commit abc1234
- Status: Closed
`;

// Expected: harmonyScore = 90, 1 warning (unverified)
```

### E2E Test

**File:** `test/e2e/evidence-validation.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test('Evidence validation in Gate 13', async ({ page }) => {
  // 1. Start session
  await page.goto('http://localhost:5173');

  // 2. Create session with learning-dissolution flow
  // 3. Wait for chain completion
  // 4. Check Gate 13 trace for evidence validation
  // 5. Verify harmony score reflects evidence validity
  // 6. Check warning surface in orchestrator output
});
```

---

## Performance Benchmarks

### Target Metrics

- **Validation Time:** <100ms for 5 learnings (with cache)
- **Cache Hit Rate:** >80% in production workload
- **Git Call Overhead:** <50ms per unique commit hash
- **File Check Overhead:** <10ms per file reference
- **Memory Footprint:** <5MB cache overhead

### Monitoring

Add telemetry to EvidenceVerifier:

```typescript
interface ValidationMetrics {
  totalValidations: number;
  cacheHits: number;
  cacheMisses: number;
  avgGitCallMs: number;
  avgFileCheckMs: number;
  validationErrors: number;
}
```

Log metrics every 100 validations for performance monitoring.

---

## Future Enhancements (Post-Phase 3)

### Phase 3D: Learning Re-opening (Optional)

**Trigger:** Evidence becomes invalid after closure

**Example:** Commit gets rebased/squashed, file gets moved/deleted

**Action:** Auto-re-open learning with new entry:

```markdown
### L028: Evidence Invalidated for L001
- **From:** evidence-validator (automatic)
- **Issue:** Evidence for L001 became invalid (commit c8a059b no longer exists)
- **Root Cause:** Commit was rebased/squashed in git history cleanup
- **Fix:** Re-verify fix or update evidence to new commit hash
- **Status:** Open
```

**Implementation:** Add daily cron job that re-validates all closed learnings and re-opens if evidence becomes stale.

### Phase 4: Health Protocol Integration

**Trigger:** Staleness detection (learnings >30 days without evidence updates)

**Action:** Auto-trigger `learning-dissolution/` flow for stale learnings

**Dashboard:** Learning backlog health widget (shows stale vs fresh closures)

**Metrics:**
- Closure freshness score (0-100)
- Average evidence age (days)
- Stale learning count
- Re-opening rate (how often evidence becomes invalid)

---

## Appendix A: Harmony Score Calculation

### Formula

```
Base Score = 100

For each learning closure:
  If evidence is valid:
    Score += 0 (neutral)

  If evidence is invalid:
    If malformed (wrong format):
      Score -= 25 (critical penalty)
    Else if unverified (git unavailable):
      Score -= 10 (warning penalty)
    Else (not found):
      Score -= 20 (standard penalty)

Final Score = max(0, Base Score - penalties)
```

### Examples

**Example 1: All Valid (5 learnings)**
```
Base: 100
Penalties: 0
Final: 100
```

**Example 2: 1 Invalid Commit (5 learnings)**
```
Base: 100
Penalties: -20 (1 invalid)
Final: 80
```

**Example 3: 2 Malformed + 1 Not Found (5 learnings)**
```
Base: 100
Penalties: -25 (malformed) -25 (malformed) -20 (not found) = -70
Final: 30
```

**Example 4: Git Unavailable (5 learnings)**
```
Base: 100
Penalties: -10 × 5 = -50
Final: 50 (graceful degradation)
```

---

## Appendix B: Evidence Type Decision Tree

```
Evidence string received
    ↓
Contains "commit [hash]"?
    YES → validateCommitHash()
    NO  ↓
Contains "file [path]"?
    YES → validateFile()
    NO  ↓
Contains "documented in/as [text]"?
    YES → validateReason()
    NO  ↓
Contains "Status: Escalated"?
    YES → validateEscalated()
    NO  ↓
Contains "Status: Closed ... commit [hash]"?
    YES → validateCommitHash() (dissolution pattern)
    NO  ↓
Unknown format → evidenceType: 'unknown', isValid: false
```

---

## Appendix C: Regex Pattern Reference Table

| Evidence Type | Pattern | Example Input | Captured Group |
|---------------|---------|---------------|----------------|
| Commit | `/Evidence:\s+commit\s+([a-f0-9]{7,40})/i` | `Evidence: commit c8a059b` | `c8a059b` |
| File | `/Evidence:\s+file\s+([^\s]+)/i` | `Evidence: file docs/MEMORY.md` | `docs/MEMORY.md` |
| Documented | `/Evidence:\s+documented\s+(?:in\|as)\s+([^\n]+)/i` | `Evidence: documented in MEMORY.md` | `MEMORY.md` |
| Escalated | `/Status:\s+Escalated\s+\(([^)]+)\)/i` | `Status: Escalated (architectural gap)` | `architectural gap` |
| Dissolution | `/Status:\s+Closed.*?Evidence:\s+commit\s+([a-f0-9]{7,40})/is` | `Status: Closed — Evidence: commit abc123` | `abc123` |

**Note:** All patterns are case-insensitive (`/i` flag) except dissolution which is also multiline (`/is` flags).

---

## Appendix D: Configuration Options

### Environment Variables

```bash
# Evidence validation cache TTL (default: 60 seconds)
EVIDENCE_CACHE_TTL_SECONDS=60

# Git operation timeout (default: 5 seconds)
EVIDENCE_GIT_TIMEOUT_MS=5000

# Working directory for git/file operations (default: process.cwd())
EVIDENCE_WORKING_DIR=/path/to/project

# Disable evidence validation (for testing)
EVIDENCE_VALIDATION_DISABLED=false

# Minimum reason length (default: 10 characters)
EVIDENCE_MIN_REASON_LENGTH=10
```

### Runtime Configuration

```typescript
// packages/backend/src/config.ts
export const evidenceConfig = {
  cacheTtlSeconds: parseInt(process.env.EVIDENCE_CACHE_TTL_SECONDS || '60', 10),
  gitTimeoutMs: parseInt(process.env.EVIDENCE_GIT_TIMEOUT_MS || '5000', 10),
  workingDir: process.env.EVIDENCE_WORKING_DIR || process.cwd(),
  disabled: process.env.EVIDENCE_VALIDATION_DISABLED === 'true',
  minReasonLength: parseInt(process.env.EVIDENCE_MIN_REASON_LENGTH || '10', 10),
};
```

---

## Appendix E: Deployment Checklist

### Pre-Deployment

- [ ] Run unit tests: `pnpm test evidenceVerifier`
- [ ] Run integration tests: `pnpm test gate13`
- [ ] Verify git available in deployment environment
- [ ] Check LEARNINGS.md for test cases (5 closed learnings)
- [ ] Review error logs for evidence validation warnings

### Deployment Steps

1. **Deploy Phase 3A** (Evidence Verifier Service)
   - [ ] Create `evidenceVerifier.ts`
   - [ ] Create `evidenceVerifier.test.ts`
   - [ ] Run tests locally
   - [ ] Commit: `feat: add evidence verifier service (Phase 3A)`

2. **Deploy Phase 3B** (Gate 13 Enhancement)
   - [ ] Update `gate13-learning-surface.ts`
   - [ ] Test with real LEARNINGS.md
   - [ ] Verify harmony score calculation
   - [ ] Commit: `feat: enhance Gate 13 with evidence validation (Phase 3B)`

3. **Deploy Phase 3C** (Orchestrator Integration)
   - [ ] Update `ORCHESTRATOR.md`
   - [ ] Update `healthScoreCalculator.ts`
   - [ ] Test end-to-end flow
   - [ ] Commit: `feat: integrate evidence validation into orchestrator (Phase 3C)`

### Post-Deployment Validation

- [ ] Check Gate 13 traces in dashboard
- [ ] Verify warnings surface for invalid evidence
- [ ] Monitor performance (validation time <100ms)
- [ ] Check cache hit rate (>80%)
- [ ] Verify no false positives (all real commits pass)

### Rollback Plan

If evidence validation causes issues:

1. **Soft Rollback:** Set `EVIDENCE_VALIDATION_DISABLED=true` in env
2. **Hard Rollback:** Revert commits for Phase 3B/3C (keep 3A service)
3. **Investigation:** Review logs, check git availability, verify regex patterns
4. **Fix Forward:** Patch issues and redeploy

---

**End of Design Document**

**Next Step:** Implementation via code/ action (Phases 3A → 3B → 3C)
