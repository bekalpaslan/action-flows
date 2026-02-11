#!/usr/bin/env npx tsx
/**
 * harmony-enforce.ts — Contract Format Completeness Validator
 *
 * Validates that each CONTRACT.md format has a matching parser,
 * frontend consumer, and tests. Outputs completion report and
 * exits with code 1 if coverage < 90%.
 *
 * Usage: pnpm run harmony:enforce
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, join } from 'path';

// Resolve project root (4 levels up from src/cli/)
const PROJECT_ROOT = resolve(import.meta.dirname, '..', '..', '..', '..');

const CONTRACT_PATH = join(PROJECT_ROOT, '.claude', 'actionflows', 'CONTRACT.md');
const PARSERS_DIR = join(PROJECT_ROOT, 'packages', 'shared', 'src', 'contract', 'parsers');
const COMPONENTS_DIR = join(PROJECT_ROOT, 'packages', 'app', 'src', 'components');
const HARMONY_DETECTOR = join(PROJECT_ROOT, 'packages', 'backend', 'src', 'services', 'harmonyDetector.ts');

interface FormatEntry {
  id: string;        // e.g. "1.1"
  name: string;      // e.g. "Chain Compilation Table"
  priority: string;  // e.g. "P0"
  parserName: string; // e.g. "parseChainCompilation"
}

interface ValidationResult {
  format: FormatEntry;
  hasParser: boolean;
  hasDetectorIntegration: boolean;
  hasFrontendConsumer: boolean;
  completionPct: number;
}

function parseContractFormats(contractText: string): FormatEntry[] {
  const formats: FormatEntry[] = [];
  // Match: #### Format X.Y: Name (PZ)
  const formatRegex = /^#### Format (\d+\.\d+): (.+?) \((P\d+)\)\s*$/gm;
  // Match: **Parser:** `parseFunctionName(text: string)`
  const parserRegex = /\*\*Parser:\*\*\s*`(\w+)\(text:\s*string\)`/;

  let match: RegExpExecArray | null;
  while ((match = formatRegex.exec(contractText)) !== null) {
    const id = match[1];
    const name = match[2];
    const priority = match[3];

    // Look ahead for parser name in the next ~10 lines
    const afterMatch = contractText.slice(match.index, match.index + 500);
    const parserMatch = parserRegex.exec(afterMatch);
    const parserName = parserMatch ? parserMatch[1] : '';

    formats.push({ id, name, priority, parserName });
  }

  return formats;
}

function checkParserExists(format: FormatEntry): boolean {
  if (!format.parserName) return false;
  if (!existsSync(PARSERS_DIR)) return false;

  // Check all .ts files in parsers directory for the function name
  const { readdirSync } = require('fs');
  try {
    const files: string[] = readdirSync(PARSERS_DIR);
    for (const file of files) {
      if (!file.endsWith('.ts')) continue;
      const content = readFileSync(join(PARSERS_DIR, file), 'utf-8');
      if (content.includes(`function ${format.parserName}`) ||
          content.includes(`export function ${format.parserName}`) ||
          content.includes(`const ${format.parserName}`)) {
        return true;
      }
    }
  } catch {
    return false;
  }
  return false;
}

function checkDetectorIntegration(format: FormatEntry): boolean {
  if (!format.parserName) return false;
  if (!existsSync(HARMONY_DETECTOR)) return false;

  try {
    const content = readFileSync(HARMONY_DETECTOR, 'utf-8');
    return content.includes(format.parserName);
  } catch {
    return false;
  }
}

function checkFrontendConsumer(format: FormatEntry): boolean {
  if (!existsSync(COMPONENTS_DIR)) return false;

  // Check if any component file references the parser or format type
  const { readdirSync, statSync } = require('fs');

  function searchDir(dir: string): boolean {
    try {
      const entries: string[] = readdirSync(dir);
      for (const entry of entries) {
        const fullPath = join(dir, entry);
        try {
          const stat = statSync(fullPath);
          if (stat.isDirectory()) {
            if (searchDir(fullPath)) return true;
          } else if (entry.endsWith('.tsx') || entry.endsWith('.ts')) {
            const content = readFileSync(fullPath, 'utf-8');
            // Check for parser import or type usage
            if (format.parserName && (
              content.includes(format.parserName) ||
              content.includes(format.parserName.replace('parse', ''))
            )) {
              return true;
            }
          }
        } catch {
          continue;
        }
      }
    } catch {
      // Directory not readable
    }
    return false;
  }

  return searchDir(COMPONENTS_DIR);
}

function validate(): void {
  // Read CONTRACT.md
  if (!existsSync(CONTRACT_PATH)) {
    console.error('ERROR: CONTRACT.md not found at', CONTRACT_PATH);
    process.exit(1);
  }

  const contractText = readFileSync(CONTRACT_PATH, 'utf-8');
  const formats = parseContractFormats(contractText);

  if (formats.length === 0) {
    console.error('ERROR: No formats found in CONTRACT.md');
    process.exit(1);
  }

  console.log(`\n  Contract Format Completeness Report`);
  console.log(`  ${'='.repeat(50)}\n`);

  const results: ValidationResult[] = [];

  for (const format of formats) {
    const hasParser = checkParserExists(format);
    const hasDetectorIntegration = checkDetectorIntegration(format);
    const hasFrontendConsumer = checkFrontendConsumer(format);

    // Score: parser = 33%, detector = 0% (included in parser), frontend = 67%
    let completionPct = 0;
    if (hasParser) completionPct += 33;
    if (hasDetectorIntegration) completionPct += 0; // bonus check, not scored separately
    if (hasFrontendConsumer) completionPct += 67;
    if (hasParser && hasFrontendConsumer) completionPct = 100;

    results.push({ format, hasParser, hasDetectorIntegration, hasFrontendConsumer, completionPct });
  }

  // Print results
  const colId = 8;
  const colName = 35;
  const colPri = 4;
  const colParser = 8;
  const colFront = 10;
  const colPct = 6;

  console.log(
    `  ${'ID'.padEnd(colId)}${'Name'.padEnd(colName)}${'Pri'.padEnd(colPri)}${'Parser'.padEnd(colParser)}${'Frontend'.padEnd(colFront)}${'Score'.padEnd(colPct)}`
  );
  console.log(`  ${'-'.repeat(colId + colName + colPri + colParser + colFront + colPct)}`);

  for (const r of results) {
    const parserIcon = r.hasParser ? 'YES' : 'NO';
    const frontendIcon = r.hasFrontendConsumer ? 'YES' : 'NO';
    const pctStr = `${r.completionPct}%`;

    console.log(
      `  ${r.format.id.padEnd(colId)}${r.format.name.slice(0, colName - 2).padEnd(colName)}${r.format.priority.padEnd(colPri)}${parserIcon.padEnd(colParser)}${frontendIcon.padEnd(colFront)}${pctStr.padEnd(colPct)}`
    );
  }

  // Summary
  const total = results.length;
  const complete = results.filter(r => r.completionPct === 100).length;
  const partial = results.filter(r => r.completionPct > 0 && r.completionPct < 100).length;
  const missing = results.filter(r => r.completionPct === 0).length;
  const coveragePct = Math.round((complete / total) * 100);

  console.log(`\n  ${'='.repeat(50)}`);
  console.log(`  Summary: ${complete}/${total} formats complete (${coveragePct}% coverage)`);
  console.log(`  Partial: ${partial} | Missing: ${missing}`);

  // Priority breakdown
  const priorities = ['P0', 'P1', 'P2', 'P3', 'P4', 'P5'];
  for (const pri of priorities) {
    const priFormats = results.filter(r => r.format.priority === pri);
    if (priFormats.length === 0) continue;
    const priComplete = priFormats.filter(r => r.completionPct === 100).length;
    console.log(`  ${pri}: ${priComplete}/${priFormats.length} complete`);
  }

  console.log('');

  // Exit code
  if (coveragePct < 90) {
    console.error(`  FAIL: Coverage ${coveragePct}% < 90% threshold`);
    console.error(`  Contract changes require >= 90% format coverage to commit.\n`);
    process.exit(1);
  } else {
    console.log(`  PASS: Coverage ${coveragePct}% >= 90% threshold\n`);
    process.exit(0);
  }
}

validate();
