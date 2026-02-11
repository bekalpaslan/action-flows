#!/usr/bin/env node

/**
 * Typography Token Migration — Final Pass
 *
 * Targets remaining hardcoded:
 * - font-size (px, rem, em values)
 * - font-weight (numeric: 200, 300, 400, 500, 600, 700, 800, 900)
 * - line-height (numeric: 1, 1.2, 1.25, 1.3, 1.4, 1.5, 1.6, 1.75, etc.)
 */

const fs = require('fs');
const path = require('path');

const LOG = {
  SUCCESS: '\x1b[32m✓\x1b[0m',
  WARN: '\x1b[33m⚠\x1b[0m',
  ERROR: '\x1b[31m✗\x1b[0m',
  INFO: '\x1b[36mℹ\x1b[0m',
  DIMMED: '\x1b[90m',
  RESET: '\x1b[0m'
};

const TYPOGRAPHY_TOKENS = {
  'font-size': {
    // px values - full scale
    '8px': 'var(--text-xs)',
    '9px': 'var(--text-xs)',
    '10px': 'var(--text-xs)',
    '11px': 'var(--text-xs)',
    '12px': 'var(--text-sm)',
    '13px': 'var(--text-sm)',
    '14px': 'var(--text-sm)',
    '15px': 'var(--text-base)',
    '16px': 'var(--text-lg)',
    '17px': 'var(--text-lg)',
    '20px': 'var(--text-xl)',
    '24px': 'var(--text-2xl)',
    '28px': 'var(--text-3xl)',
    '32px': 'var(--text-3xl)',
    '34px': 'var(--text-4xl)',
    '40px': 'var(--text-5xl)',
    '48px': 'var(--text-6xl)',
    '64px': 'var(--text-6xl)',
    // rem values - common sizes
    '0.5rem': 'var(--text-xs)',
    '0.6rem': 'var(--text-xs)',
    '0.625rem': 'var(--text-xs)',
    '0.65rem': 'var(--text-xs)',
    '0.7rem': 'var(--text-sm)',
    '0.75rem': 'var(--text-sm)',
    '0.8rem': 'var(--text-sm)',
    '0.875rem': 'var(--text-sm)',
    '0.9rem': 'var(--text-base)',
    '1rem': 'var(--text-base)',
    '1.125rem': 'var(--text-lg)',
    '1.25rem': 'var(--text-lg)',
    '1.33rem': 'var(--text-xl)',
    '1.5rem': 'var(--text-xl)',
    '1.66rem': 'var(--text-2xl)',
    '1.75rem': 'var(--text-2xl)',
    '2rem': 'var(--text-3xl)',
    '2.25rem': 'var(--text-4xl)',
    '2.5rem': 'var(--text-5xl)',
    '3rem': 'var(--text-6xl)',
    '4rem': 'var(--text-6xl)',
    // em values - common sizes
    '0.5em': 'var(--text-xs)',
    '0.6em': 'var(--text-xs)',
    '0.625em': 'var(--text-xs)',
    '0.65em': 'var(--text-xs)',
    '0.7em': 'var(--text-sm)',
    '0.75em': 'var(--text-sm)',
    '0.8em': 'var(--text-sm)',
    '0.85em': 'var(--text-sm)',
    '0.875em': 'var(--text-sm)',
    '0.9em': 'var(--text-base)',
    '1em': 'var(--text-base)',
    '1.125em': 'var(--text-lg)',
    '1.25em': 'var(--text-lg)',
    '1.5em': 'var(--text-xl)',
    '1.75em': 'var(--text-2xl)',
    '2em': 'var(--text-3xl)',
  },
  'font-weight': {
    '200': 'var(--font-thin)',
    '300': 'var(--font-light)',
    '400': 'var(--font-normal)',
    'normal': 'var(--font-normal)',
    '500': 'var(--font-medium)',
    '600': 'var(--font-semibold)',
    'bold': 'var(--font-bold)',
    '700': 'var(--font-bold)',
    '800': 'var(--font-extrabold)',
  },
  'line-height': {
    '1': 'var(--leading-tight)',
    '1.1': 'var(--leading-tight)',
    '1.2': 'var(--leading-tight)',
    '1.25': 'var(--leading-tight)',
    '1.3': 'var(--leading-snug)',
    '1.35': 'var(--leading-snug)',
    '1.4': 'var(--leading-normal)',
    '1.5': 'var(--leading-normal)',
    '1.6': 'var(--leading-relaxed)',
    '1.625': 'var(--leading-relaxed)',
    '1.75': 'var(--leading-loose)',
    '14px': 'var(--leading-normal)',
  },
};

function getCSSFiles(dir) {
  const files = [];

  function walk(current) {
    try {
      const entries = fs.readdirSync(current, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(current, entry.name);

        if (entry.name === 'node_modules' || entry.name === 'design-tokens.css') {
          continue;
        }

        if (entry.isDirectory()) {
          walk(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.css')) {
          files.push(fullPath);
        }
      }
    } catch (err) {
      console.error(`${LOG.ERROR} Error reading directory ${current}:`, err.message);
    }
  }

  walk(dir);
  return files.sort();
}

function processCSSFile(content, filePath) {
  const replacements = [];
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    if (line.trim().startsWith('/*') || line.trim().startsWith('*') ||
        line.includes('--text-') || line.includes('--font-') || line.includes('--leading-')) {
      return;
    }

    const fontSizeMatch = line.match(/font-size\s*:\s*([^;!}]+)/i);
    if (fontSizeMatch) {
      const value = fontSizeMatch[1].trim();
      const normalized = value.toLowerCase();

      if (TYPOGRAPHY_TOKENS['font-size'][normalized]) {
        const token = TYPOGRAPHY_TOKENS['font-size'][normalized];
        replacements.push({
          lineNum: idx + 1,
          property: 'font-size',
          from: value,
          to: token,
          line,
          confidence: 'high'
        });
      }
    }

    const fontWeightMatch = line.match(/font-weight\s*:\s*([^;!}]+)/i);
    if (fontWeightMatch) {
      const value = fontWeightMatch[1].trim();
      const normalized = value.toLowerCase();

      if (TYPOGRAPHY_TOKENS['font-weight'][normalized]) {
        const token = TYPOGRAPHY_TOKENS['font-weight'][normalized];
        replacements.push({
          lineNum: idx + 1,
          property: 'font-weight',
          from: value,
          to: token,
          line,
          confidence: 'high'
        });
      }
    }

    const lineHeightMatch = line.match(/line-height\s*:\s*([^;!}]+)/i);
    if (lineHeightMatch) {
      const value = lineHeightMatch[1].trim();
      const normalized = value.toLowerCase();

      if (TYPOGRAPHY_TOKENS['line-height'][normalized]) {
        const token = TYPOGRAPHY_TOKENS['line-height'][normalized];
        replacements.push({
          lineNum: idx + 1,
          property: 'line-height',
          from: value,
          to: token,
          line,
          confidence: 'high'
        });
      }
    }
  });

  return replacements;
}

function applyReplacements(content, replacements) {
  if (replacements.length === 0) return content;

  let updated = content;

  const byProperty = {};
  replacements.forEach(r => {
    if (!byProperty[r.property]) byProperty[r.property] = [];
    byProperty[r.property].push(r);
  });

  for (const [property, reps] of Object.entries(byProperty)) {
    for (const rep of reps) {
      const regex = new RegExp(
        `(${property}\\s*:\\s*)${escapeRegex(rep.from)}([\\s;!])`,
        'g'
      );
      updated = updated.replace(regex, `$1${rep.to}$2`);
    }
  }

  return updated;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function main() {
  const appDir = process.argv[2] || 'D:/ActionFlowsDashboard/packages/app/src';
  const dryRun = process.argv[3] !== '--apply';

  console.log(`\n${'='.repeat(80)}`);
  console.log(`Typography Token Migration — Final Pass`);
  console.log(`${dryRun ? 'DRY RUN' : 'APPLY'} Mode`);
  console.log(`${'='.repeat(80)}\n`);

  const cssFiles = getCSSFiles(appDir);
  console.log(`${LOG.INFO} Found ${cssFiles.length} CSS files\n`);

  let totalReplacements = 0;
  let filesModified = 0;
  const fileReports = [];

  for (const filePath of cssFiles) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const replacements = processCSSFile(content, filePath);

      if (replacements.length > 0) {
        filesModified++;
        totalReplacements += replacements.length;

        const relPath = path.relative(appDir, filePath);
        console.log(`${LOG.SUCCESS} ${relPath}`);
        console.log(`  Found ${replacements.length} hardcoded value(s)`);

        const byProp = {};
        replacements.forEach(r => {
          if (!byProp[r.property]) byProp[r.property] = [];
          byProp[r.property].push(r);
        });

        for (const [prop, reps] of Object.entries(byProp)) {
          console.log(`  ${LOG.DIMMED}${prop}: ${reps.length}${LOG.RESET}`);
          reps.slice(0, 2).forEach(r => {
            console.log(`    • Line ${r.lineNum}: ${r.from} → ${r.to}`);
          });
          if (reps.length > 2) {
            console.log(`    • ... and ${reps.length - 2} more`);
          }
        }

        if (!dryRun) {
          const updated = applyReplacements(content, replacements);
          fs.writeFileSync(filePath, updated, 'utf8');
          console.log(`  ${LOG.SUCCESS} Updated`);
        }

        fileReports.push({
          file: relPath,
          count: replacements.length,
          replacements
        });

        console.log();
      }
    } catch (err) {
      console.error(`${LOG.ERROR} Error processing ${filePath}:`, err.message);
    }
  }

  console.log(`${'='.repeat(80)}`);
  console.log(`SUMMARY`);
  console.log(`${'='.repeat(80)}`);
  console.log(`Files with hardcoded values: ${filesModified}`);
  console.log(`Total replacements: ${totalReplacements}`);
  console.log(`Mode: ${dryRun ? 'DRY RUN (no changes)' : 'APPLIED'}`);
  console.log();

  const report = {
    timestamp: new Date().toISOString(),
    dryRun,
    appDir,
    totalFiles: cssFiles.length,
    filesModified,
    totalReplacements,
    files: fileReports
  };

  fs.writeFileSync(path.join(appDir, '..', 'typography-final-report.json'), JSON.stringify(report, null, 2));
  console.log(`${LOG.INFO} Report saved to typography-final-report.json\n`);
}

main();
