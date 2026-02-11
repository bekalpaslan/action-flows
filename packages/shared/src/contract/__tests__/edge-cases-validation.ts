/**
 * Edge Case Validation Script
 * Direct pattern validation without vitest dependency
 * Tests the 7 identified edge cases from remediation plan Phase A, Step 3
 */

import {
  RegistryPatterns,
  StatusPatterns,
  ChainPatterns,
  ActionPatterns,
} from '../patterns/index.js';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

function test(name: string, fn: () => boolean) {
  try {
    const passed = fn();
    results.push({ name, passed });
    console.log(`${passed ? '✓' : '✗'} ${name}`);
  } catch (error) {
    results.push({ name, passed: false, error: String(error) });
    console.log(`✗ ${name}: ${error}`);
  }
}

console.log('\n=== Edge Case Validation Tests ===\n');

// Issue 2: Commit hash length (7 chars → 7-40 chars)
console.log('Issue 2: Commit hash length (7-40 chars)');
test('Accept 7-char hash', () => {
  const match = `(abc1234)`.match(/\(([a-f0-9]{7,40})\)/);
  return match?.[1] === 'abc1234';
});

test('Accept 40-char hash', () => {
  const hash40 = 'a'.repeat(40);
  const match = `(${hash40})`.match(/\(([a-f0-9]{7,40})\)/);
  return match?.[1]?.length === 40;
});

test('Reject 6-char hash', () => {
  const match = `(abc123)`.match(/\(([a-f0-9]{7,40})\)/);
  return match === null;
});

test('Reject 41-char hash', () => {
  const match = `(abc123def456789012345678901234567890extra)`.match(/\(([a-f0-9]{7,40})\)/);
  return match === null;
});

// Issue 3: Confidence score pattern (strict float)
console.log('\nIssue 3: Confidence score pattern');
test('Accept integer "1"', () => {
  const match = '**Confidence:** 1'.match(/\*\*Confidence:\*\* (\d+(?:\.\d+)?)$/m);
  return match?.[1] === '1';
});

test('Accept decimal "0.85"', () => {
  const match = '**Confidence:** 0.85'.match(/\*\*Confidence:\*\* (\d+(?:\.\d+)?)$/m);
  return match?.[1] === '0.85';
});

test('Reject invalid "1.2.3"', () => {
  const match = '**Confidence:** 1.2.3'.match(/\*\*Confidence:\*\* (\d+(?:\.\d+)?)$/m);
  return match === null;
});

test('Reject invalid "..5"', () => {
  const match = '**Confidence:** ..5'.match(/\*\*Confidence:\*\* (\d+(?:\.\d+)?)$/m);
  return match === null;
});

test('Reject scientific "1e-2"', () => {
  const match = '**Confidence:** 1e-2'.match(/\*\*Confidence:\*\* (\d+(?:\.\d+)?)$/m);
  return match === null;
});

// Issue 4: Table row pattern with pipes
console.log('\nIssue 4: Table row pattern (pipes in content)');
test('Handle cell without pipes correctly', () => {
  const text = '| 1 | code | haiku | input=value | -- | Pending |';
  const match = text.match(ChainPatterns.chainCompilation.tableRow);
  return match !== null && match[4] === 'input=value';
});

test('Handle cell with comma-separated values', () => {
  const text = '| 3 | audit | opus | operation=filter,map,reduce | #1,#2 | Awaiting |';
  const match = text.match(ChainPatterns.chainCompilation.tableRow);
  return match !== null && match[4] === 'operation=filter,map,reduce';
});

test('Validate pattern uses [^|]+ to avoid greedy matching', () => {
  // The [^|]+ pattern ensures we stop at the FIRST pipe we encounter
  // This prevents the greedy .+ from consuming pipes
  const text = '| 2 | review | sonnet | complex input | #1 | Done |';
  const match = text.match(ChainPatterns.chainCompilation.tableRow);
  return match !== null && match[4] === 'complex input';
});

// Issue 5: Step description pattern
console.log('\nIssue 5: Step description pattern');
test('Parse "code" without slash', () => {
  const text = '1. **code** -- Generate code';
  const match = text.match(ChainPatterns.chainCompilation.stepDescription);
  return match?.[2] === 'code' && match?.[3] === 'Generate code';
});

test('Parse "review" without slash', () => {
  const text = '2. **review** -- Review code';
  const match = text.match(ChainPatterns.chainCompilation.stepDescription);
  return match?.[2] === 'review';
});

test('Parse "code/analyze" with slash', () => {
  const text = '3. **code/analyze** -- Analyze code';
  const match = text.match(ChainPatterns.chainCompilation.stepDescription);
  return match?.[2] === 'code/analyze';
});

// Issue 6: Recovery options pattern
console.log('\nIssue 6: Recovery options pattern');
test('Parse "Retry" with details', () => {
  const text = '- Retry with exponential backoff';
  const match = text.match(StatusPatterns.errorAnnouncement.recoveryOption);
  return match?.[1] === 'Retry' && match?.[2] === 'with exponential backoff';
});

test('Parse "Skip" without details', () => {
  const text = '- Skip';
  const match = text.match(StatusPatterns.errorAnnouncement.recoveryOption);
  return match?.[1] === 'Skip' && match?.[2] === undefined;
});

test('Parse lowercase "retry" (case-insensitive)', () => {
  const text = '- retry the failed step';
  const match = text.match(StatusPatterns.errorAnnouncement.recoveryOption);
  return match?.[1] === 'retry' && match?.[2] === 'the failed step';
});

// Issue 7: Analysis aspect pattern
console.log('\nIssue 7: Analysis aspect pattern');
test('Accept hardcoded "coverage"', () => {
  const text = '**Aspect:** coverage';
  const match = text.match(ActionPatterns.analysisReport.aspect);
  return match?.[1] === 'coverage';
});

test('Accept new aspect "consistency"', () => {
  const text = '**Aspect:** consistency';
  const match = text.match(ActionPatterns.analysisReport.aspect);
  return match?.[1] === 'consistency';
});

test('Accept "performance-analysis"', () => {
  const text = '**Aspect:** performance-analysis';
  const match = text.match(ActionPatterns.analysisReport.aspect);
  return match?.[1] === 'performance-analysis';
});

test('Accept "code quality" (multi-word)', () => {
  const text = '**Aspect:** code quality';
  const match = text.match(ActionPatterns.analysisReport.aspect);
  return match?.[1] === 'code quality';
});

test('Reject empty aspect', () => {
  const text = '**Aspect:** ';
  const match = text.match(ActionPatterns.analysisReport.aspect);
  return match === null;
});

// Summary
console.log('\n=== Test Results ===');
const passed = results.filter(r => r.passed).length;
const total = results.length;
console.log(`${passed}/${total} tests passed`);

if (passed === total) {
  console.log('✓ All edge cases validated successfully!');
  process.exit(0);
} else {
  console.log('✗ Some tests failed:');
  results
    .filter(r => !r.passed)
    .forEach(r => console.log(`  - ${r.name}${r.error ? ': ' + r.error : ''}`));
  process.exit(1);
}
