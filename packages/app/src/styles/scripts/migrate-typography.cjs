#!/usr/bin/env node

/**
 * Typography Token Migration Script
 *
 * Automatically replaces hardcoded font-size, font-weight, and line-height values
 * with design token equivalents.
 *
 * Usage:
 *   node migrate-typography.js                # Dry run (default)
 *   node migrate-typography.js --execute      # Apply changes
 */

const fs = require('fs');
const path = require('path');

// Font size mappings
const FONT_SIZE_MAP = {
  // Exact px matches
  '11px': 'var(--text-xs)',
  '12px': 'var(--text-xs)',
  '13px': 'var(--text-sm)',
  '14px': 'var(--text-sm)',
  '15px': 'var(--text-base)',
  '16px': 'var(--text-base)',
  '17px': 'var(--text-lg)',
  '18px': 'var(--text-lg)',
  '20px': 'var(--text-xl)',
  '24px': 'var(--text-2xl)',
  '28px': 'var(--text-3xl)',
  '32px': 'var(--text-4xl)',
  '34px': 'var(--text-4xl)',
  '40px': 'var(--text-5xl)',
  '48px': 'var(--text-6xl)',

  // rem equivalents
  '0.6875rem': 'var(--text-xs)',
  '0.8125rem': 'var(--text-sm)',
  '0.9375rem': 'var(--text-base)',
  '1.0625rem': 'var(--text-lg)',
  '1.25rem': 'var(--text-xl)',
  '1.5rem': 'var(--text-2xl)',
  '1.75rem': 'var(--text-3xl)',
  '2.125rem': 'var(--text-4xl)',
  '2.5rem': 'var(--text-5xl)',
  '3rem': 'var(--text-6xl)',

  // em-based (relative to parent)
  '0.75em': 'var(--text-xs)',
  '0.875em': 'var(--text-sm)',
  '1em': 'var(--text-base)',
  '1.125em': 'var(--text-lg)',
  '1.5em': 'var(--text-2xl)',
};

// Font weight mappings
const FONT_WEIGHT_MAP = {
  'thin': 'var(--font-thin)',
  '100': 'var(--font-thin)',
  'light': 'var(--font-light)',
  '300': 'var(--font-light)',
  'normal': 'var(--font-normal)',
  '400': 'var(--font-normal)',
  'medium': 'var(--font-medium)',
  '500': 'var(--font-medium)',
  'semibold': 'var(--font-semibold)',
  '600': 'var(--font-semibold)',
  'bold': 'var(--font-bold)',
  '700': 'var(--font-bold)',
  'extrabold': 'var(--font-extrabold)',
  '800': 'var(--font-extrabold)',
};

// Line height mappings
const LINE_HEIGHT_MAP = {
  '1': 'var(--leading-tight)',
  '1.2': 'var(--leading-tight)',
  '1.25': 'var(--leading-tight)',
  '1.3': 'var(--leading-snug)',
  '1.35': 'var(--leading-snug)',
  '1.4': 'var(--leading-normal)',
  '1.5': 'var(--leading-normal)',
  '1.6': 'var(--leading-relaxed)',
  '1.625': 'var(--leading-relaxed)',
  '1.75': 'var(--leading-loose)',
};

function processCSSFile(content, filePath) {
  const replacements = [];

  // Process font-size properties
  const fontSizeRegex = /font-size:\s*([^;}\n]+)/g;
  let match;

  while ((match = fontSizeRegex.exec(content)) !== null) {
    const value = match[1].trim();
    const normalized = normalizeValue(value);

    if (FONT_SIZE_MAP[normalized]) {
      replacements.push({
        type: 'font-size',
        oldValue: value,
        newValue: FONT_SIZE_MAP[normalized],
        position: match.index + match[0].indexOf(value),
        confidence: 'high',
      });
    }
  }

  // Process font-weight properties
  const fontWeightRegex = /font-weight:\s*([^;}\n]+)/g;
  while ((match = fontWeightRegex.exec(content)) !== null) {
    const value = match[1].trim();
    if (FONT_WEIGHT_MAP[value]) {
      replacements.push({
        type: 'font-weight',
        oldValue: value,
        newValue: FONT_WEIGHT_MAP[value],
        position: match.index + match[0].indexOf(value),
        confidence: 'high',
      });
    }
  }

  // Process line-height properties
  const lineHeightRegex = /line-height:\s*([^;}\n]+)/g;
  while ((match = lineHeightRegex.exec(content)) !== null) {
    const value = match[1].trim();
    const normalized = normalizeValue(value);

    if (LINE_HEIGHT_MAP[normalized]) {
      replacements.push({
        type: 'line-height',
        oldValue: value,
        newValue: LINE_HEIGHT_MAP[normalized],
        position: match.index + match[0].indexOf(value),
        confidence: 'high',
      });
    }
  }

  return replacements;
}

function normalizeValue(value) {
  return value.toLowerCase().trim();
}

function applyReplacements(content, replacements) {
  let result = content;

  // Group replacements by type
  const byType = {
    'font-size': {},
    'font-weight': {},
    'line-height': {}
  };

  for (const replacement of replacements) {
    byType[replacement.type][replacement.oldValue] = replacement.newValue;
  }

  // Apply font-size replacements with value boundaries
  for (const [oldValue, newValue] of Object.entries(byType['font-size'])) {
    const escaped = oldValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Match font-size: value; or font-size: value !important; pattern
    const pattern = new RegExp(`(font-size:\\s*)${escaped}(?=[\\s;!)]|$)`, 'g');
    result = result.replace(pattern, `$1${newValue}`);
  }

  // Apply font-weight replacements
  for (const [oldValue, newValue] of Object.entries(byType['font-weight'])) {
    const escaped = oldValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`(font-weight:\\s*)${escaped}(?=[\\s;!)]|$)`, 'g');
    result = result.replace(pattern, `$1${newValue}`);
  }

  // Apply line-height replacements
  for (const [oldValue, newValue] of Object.entries(byType['line-height'])) {
    const escaped = oldValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`(line-height:\\s*)${escaped}(?=[\\s;!)]|$)`, 'g');
    result = result.replace(pattern, `$1${newValue}`);
  }

  return result;
}

// Get CSS files recursively
function getCSSFiles(dir) {
  const files = [];

  function walk(currentPath) {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);
      const relativePath = path.relative(process.cwd(), fullPath);

      // Skip node_modules and design-tokens
      if (relativePath.includes('node_modules') ||
          fullPath.includes('design-tokens.css') ||
          fullPath.includes('cosmic-tokens.css')) {
        continue;
      }

      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.css')) {
        files.push(fullPath);
      }
    }
  }

  walk(dir);
  return files;
}

async function migrateFiles(pattern, dryRun = true) {
  try {
    const basePath = pattern.replace('/**/*.css', '');
    const files = getCSSFiles(basePath);

    if (files.length === 0) {
      console.log(`No CSS files found in: ${basePath}`);
      return;
    }

    console.log(`Found ${files.length} CSS files to process\n`);

    const allReplacements = [];
    let filesModified = 0;

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      const replacements = processCSSFile(content, file);

      if (replacements.length === 0) continue;

      const bySizes = replacements.filter(r => r.type === 'font-size').length;
      const byWeights = replacements.filter(r => r.type === 'font-weight').length;
      const byLineHeights = replacements.filter(r => r.type === 'line-height').length;

      console.log(`\n${path.relative(process.cwd(), file)}`);
      console.log(`  Font sizes: ${bySizes}, Font weights: ${byWeights}, Line heights: ${byLineHeights}`);

      allReplacements.push({
        file,
        count: replacements.length,
        bySizes,
        byWeights,
        byLineHeights,
        replacements,
      });

      if (!dryRun) {
        const newContent = applyReplacements(content, replacements);
        fs.writeFileSync(file, newContent, 'utf8');
        filesModified++;
      }
    }

    // Summary
    const totalReplacements = allReplacements.reduce((sum, f) => sum + f.count, 0);
    const totalSizes = allReplacements.reduce((sum, f) => sum + f.bySizes, 0);
    const totalWeights = allReplacements.reduce((sum, f) => sum + f.byWeights, 0);
    const totalLineHeights = allReplacements.reduce((sum, f) => sum + f.byLineHeights, 0);

    console.log(`\n${'='.repeat(60)}`);
    console.log('TYPOGRAPHY MIGRATION REPORT');
    console.log(`${'='.repeat(60)}`);
    console.log(`Files processed: ${allReplacements.length}`);
    console.log(`Total replacements: ${totalReplacements}`);
    console.log(`  Font sizes: ${totalSizes}`);
    console.log(`  Font weights: ${totalWeights}`);
    console.log(`  Line heights: ${totalLineHeights}`);

    if (dryRun) {
      console.log(`\n[DRY RUN] No files modified. Run with --execute to apply changes.`);
    } else {
      console.log(`\n[EXECUTED] ${filesModified} files modified.`);
    }

    // Write report
    const reportPath = path.join(process.cwd(), 'typography-migration-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(allReplacements, null, 2), 'utf8');
    console.log(`\nDetailed report: ${reportPath}`);

  } catch (error) {
    console.error('Error during migration:', error.message);
    process.exit(1);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--execute');

  let pattern = 'packages/app/src/**/*.css';
  for (const arg of args) {
    if (!arg.startsWith('--')) {
      pattern = arg;
      break;
    }
  }

  console.log(`Typography Token Migration Script`);
  console.log(`Pattern: ${pattern}`);
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'EXECUTE'}\n`);

  await migrateFiles(pattern, dryRun);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { processCSSFile, applyReplacements };
