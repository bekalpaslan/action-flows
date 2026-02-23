import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

type FindingType = 'rawButton' | 'inlineStyle' | 'hardcodedColorTsx' | 'hardcodedColorCss';

interface FindingSummary {
  type: FindingType;
  total: number;
  byFile: Array<{ file: string; count: number }>;
}

const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);
const projectRoot = path.resolve(currentDir, '..');
const componentsRoot = path.join(projectRoot, 'src', 'components');
const strictMode = process.argv.includes('--strict');

const tsxExtensions = new Set(['.tsx']);
const cssExtensions = new Set(['.css']);
const ignoredTsxPattern = /(__tests__|\.test\.tsx$|\.a11y\.test\.tsx$|[\\/]primitives[\\/])/;
const ignoredCssPattern = /[\\/]primitives[\\/]/;

const rawButtonPattern = /<button\b/g;
const inlineStylePattern = /\bstyle=\{\{/g;
const hardcodedColorPattern = /#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/g;

function walk(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const absolutePath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(absolutePath));
      continue;
    }
    files.push(absolutePath);
  }

  return files;
}

function countMatches(content: string, pattern: RegExp): number {
  const matches = content.match(pattern);
  return matches ? matches.length : 0;
}

function topFiles(map: Map<string, number>): Array<{ file: string; count: number }> {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([file, count]) => ({ file, count }));
}

function summarize(
  type: FindingType,
  map: Map<string, number>
): FindingSummary {
  let total = 0;
  for (const count of map.values()) {
    total += count;
  }

  return {
    type,
    total,
    byFile: topFiles(map),
  };
}

function printSummary(summary: FindingSummary, title: string): void {
  console.log(`\n${title}: ${summary.total}`);
  if (summary.byFile.length === 0) {
    console.log('  - none');
    return;
  }

  for (const { file, count } of summary.byFile) {
    console.log(`  - ${file}: ${count}`);
  }
}

function relative(filePath: string): string {
  return path.relative(projectRoot, filePath).replaceAll('\\', '/');
}

const allFiles = walk(componentsRoot);

const rawButtonByFile = new Map<string, number>();
const inlineStyleByFile = new Map<string, number>();
const hardcodedColorTsxByFile = new Map<string, number>();
const hardcodedColorCssByFile = new Map<string, number>();

for (const file of allFiles) {
  const ext = path.extname(file);
  const rel = relative(file);
  const content = fs.readFileSync(file, 'utf8');

  if (tsxExtensions.has(ext) && !ignoredTsxPattern.test(file)) {
    const rawButtonCount = countMatches(content, rawButtonPattern);
    if (rawButtonCount > 0) {
      rawButtonByFile.set(rel, rawButtonCount);
    }

    const inlineStyleCount = countMatches(content, inlineStylePattern);
    if (inlineStyleCount > 0) {
      inlineStyleByFile.set(rel, inlineStyleCount);
    }

    const hardcodedColorCount = countMatches(content, hardcodedColorPattern);
    if (hardcodedColorCount > 0) {
      hardcodedColorTsxByFile.set(rel, hardcodedColorCount);
    }
  }

  if (cssExtensions.has(ext) && !ignoredCssPattern.test(file)) {
    const hardcodedColorCount = countMatches(content, hardcodedColorPattern);
    if (hardcodedColorCount > 0) {
      hardcodedColorCssByFile.set(rel, hardcodedColorCount);
    }
  }
}

const summaries = [
  summarize('rawButton', rawButtonByFile),
  summarize('inlineStyle', inlineStyleByFile),
  summarize('hardcodedColorTsx', hardcodedColorTsxByFile),
  summarize('hardcodedColorCss', hardcodedColorCssByFile),
];

console.log('ActionFlows UI Consistency Audit');
console.log(`Scope: ${componentsRoot}`);
console.log(`Mode: ${strictMode ? 'strict' : 'report-only'}`);

printSummary(summaries[0], 'Raw <button> usage (outside primitives)');
printSummary(summaries[1], 'Inline style objects in TSX');
printSummary(summaries[2], 'Hardcoded colors in TSX');
printSummary(summaries[3], 'Hardcoded colors in CSS');

const totalFindings = summaries.reduce((acc, item) => acc + item.total, 0);
const shouldFail = strictMode && totalFindings > 0;

if (shouldFail) {
  console.error(
    '\nUI consistency audit failed in strict mode. Replace raw styles with design tokens/primitives.'
  );
  process.exit(1);
}

if (!strictMode && totalFindings > 0) {
  console.log(
    '\nAudit completed with findings. Run with --strict to enforce in CI.'
  );
}

if (totalFindings === 0) {
  console.log('\nNo UI consistency issues found in audited scope.');
}
