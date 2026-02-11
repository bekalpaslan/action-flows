#!/usr/bin/env node

/**
 * Color Token Migration Script
 *
 * Automatically replaces hardcoded color values with design token equivalents.
 * Uses PostCSS to parse CSS and match color values against design tokens.
 * Supports rgba(), rgb(), #hex, and hsl() color formats.
 *
 * Usage:
 *   node migrate-colors.js                    # Dry run (default)
 *   node migrate-colors.js --execute          # Apply changes
 *   node migrate-colors.js --execute --file "path/to/*.css"  # Specific files
 */

const fs = require('fs');
const fsAsync = fs.promises;
const path = require('path');

// Color mapping: hardcoded value -> token variable
const COLOR_MAP = {
  // Background colors
  '#000000': 'var(--app-bg-base)',
  '#1c1c1e': 'var(--app-bg-primary)',
  '#2c2c2e': 'var(--app-bg-secondary)',
  '#3a3a3c': 'var(--app-bg-tertiary)',
  '#48484a': 'var(--app-bg-quaternary)',

  // Text colors
  '#ffffff': 'var(--text-primary)',
  '#98989d': 'var(--text-secondary)',
  '#636366': 'var(--text-tertiary)',

  // System colors
  '#0a84ff': 'var(--system-blue)',
  '#bf5af2': 'var(--system-purple)',
  '#ff375f': 'var(--system-pink)',
  '#ff453a': 'var(--system-red)',
  '#ff9f0a': 'var(--system-orange)',
  '#ffd60a': 'var(--system-yellow)',
  '#32d74b': 'var(--system-green)',
  '#64d2ff': 'var(--system-teal)',
  '#5e5ce6': 'var(--system-indigo)',

  // Common rgba patterns (with tolerance)
  'rgba(28, 28, 30, 0.95)': 'var(--panel-bg-base)',
  'rgba(44, 44, 46, 0.92)': 'var(--panel-bg-elevated)',
  'rgba(58, 58, 60, 0.90)': 'var(--panel-bg-raised)',
  'rgba(0, 0, 0, 0.85)': 'var(--panel-bg-inset)',

  'rgba(100, 160, 255, 0.30)': 'var(--panel-border-color-default)',
  'rgba(100, 160, 255, 0.18)': 'var(--panel-border-color-subtle)',
  'rgba(100, 160, 255, 0.45)': 'var(--panel-border-color-strong)',
  'rgba(10, 132, 255, 0.55)': 'var(--panel-border-color-accent)',

  'rgba(10, 132, 255, 0.95)': 'var(--btn-bg-primary)',
  'rgba(120, 120, 128, 0.36)': 'var(--btn-bg-secondary)',
  'rgba(255, 255, 255, 0.08)': 'var(--btn-bg-tertiary)',
  'rgba(255, 69, 58, 0.95)': 'var(--btn-bg-danger)',

  'rgba(10, 132, 255, 1)': 'var(--btn-hover-primary)',
  'rgba(120, 120, 128, 0.42)': 'var(--btn-hover-secondary)',
  'rgba(255, 255, 255, 0.12)': 'var(--btn-hover-tertiary)',
  'rgba(255, 69, 58, 1)': 'var(--btn-hover-danger)',

  'rgba(118, 118, 128, 0.24)': 'var(--input-bg-default)',
  'rgba(118, 118, 128, 0.28)': 'var(--input-bg-hover)',
  'rgba(118, 118, 128, 0.32)': 'var(--input-bg-focus)',
  'rgba(118, 118, 128, 0.12)': 'var(--input-bg-disabled)',

  'rgba(255, 255, 255, 0.05)': 'var(--panel-header-bg)',
  'rgba(255, 255, 255, 0.08)': 'var(--glass-bg-light)',
  'rgba(255, 255, 255, 0.05)': 'var(--glass-bg-medium)',
  'rgba(0, 0, 0, 0.15)': 'var(--glass-bg-dark)',

  'rgba(255, 255, 255, 0.15)': 'var(--glow-color-default)',
  'rgba(10, 132, 255, 0.25)': 'var(--glow-color-accent)',
  'rgba(50, 215, 75, 0.25)': 'var(--glow-color-success)',
  'rgba(255, 159, 10, 0.25)': 'var(--glow-color-warning)',
  'rgba(255, 69, 58, 0.25)': 'var(--glow-color-error)',
  'rgba(191, 90, 242, 0.25)': 'var(--glow-color-purple)',
};

// Normalize rgba for fuzzy matching
function normalizeColor(color) {
  // Remove extra spaces
  return color.replace(/\s+/g, ' ').trim();
}

// Check if two colors match (with tolerance for opacity)
function colorsMatchWithTolerance(color1, color2, tolerance = 0.05) {
  // Exact match
  if (normalizeColor(color1) === normalizeColor(color2)) {
    return true;
  }

  // Try rgba parsing for tolerance matching
  const rgbaRegex = /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/;
  const m1 = color1.match(rgbaRegex);
  const m2 = color2.match(rgbaRegex);

  if (!m1 || !m2) return false;

  const [, r1, g1, b1, a1 = '1'] = m1;
  const [, r2, g2, b2, a2 = '1'] = m2;

  // Allow small differences in RGB (tolerance) and opacity
  return (
    Math.abs(parseInt(r1) - parseInt(r2)) <= 5 &&
    Math.abs(parseInt(g1) - parseInt(g2)) <= 5 &&
    Math.abs(parseInt(b1) - parseInt(b2)) <= 5 &&
    Math.abs(parseFloat(a1) - parseFloat(a2)) <= tolerance
  );
}

// Find best token match for a color value
function findTokenMatch(colorValue) {
  const normalized = normalizeColor(colorValue);

  // Exact match
  if (COLOR_MAP[normalized]) {
    return { token: COLOR_MAP[normalized], confidence: 'high' };
  }

  // Fuzzy match
  for (const [mapColor, token] of Object.entries(COLOR_MAP)) {
    if (colorsMatchWithTolerance(normalized, mapColor)) {
      return { token, confidence: 'medium' };
    }
  }

  return null;
}

// Process CSS file and extract color replacements
function processCSSFile(content, filePath) {
  const replacements = [];

  // Regex for CSS color properties (background-color, color, border-color, box-shadow, etc)
  const colorPropertyRegex = /(background-color|color|border-color|border|box-shadow|text-shadow|outline|background):\s*([^;}\n]+)/gi;

  let match;
  while ((match = colorPropertyRegex.exec(content)) !== null) {
    const property = match[1];
    const value = match[2].trim();

    // Look for color values in the property value
    const colorValueRegex = /(#[0-9a-f]{3,8}|rgba?\([^)]+\)|hsl\([^)]+\))/gi;
    let colorMatch;

    while ((colorMatch = colorValueRegex.exec(value)) !== null) {
      const colorValue = colorMatch[1];
      const tokenMatch = findTokenMatch(colorValue);

      if (tokenMatch) {
        replacements.push({
          property,
          oldValue: colorValue,
          newValue: tokenMatch.token,
          fullProperty: value,
          confidence: tokenMatch.confidence,
          position: match.index + match[0].indexOf(colorValue),
        });
      }
    }
  }

  return replacements;
}

// Apply replacements to CSS content
function applyReplacements(content, replacements) {
  let result = content;

  // Group replacements by old value
  const grouped = {};
  for (const replacement of replacements) {
    if (!grouped[replacement.oldValue]) {
      grouped[replacement.oldValue] = replacement.newValue;
    }
  }

  // Apply replacements with word boundaries for values
  for (const [oldValue, newValue] of Object.entries(grouped)) {
    // Escape special regex characters
    const escaped = oldValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Use word boundaries or specific patterns for color values
    let pattern;
    if (oldValue.startsWith('#')) {
      // Hex colors must be followed by word boundary or space/semicolon
      pattern = new RegExp(`\\b${escaped}(?=[\\s;,/)]|$)`, 'g');
    } else if (oldValue.startsWith('rgba') || oldValue.startsWith('rgb')) {
      // Function colors - require specific context
      pattern = new RegExp(`${escaped}`, 'g');
    } else {
      pattern = new RegExp(`${escaped}`, 'g');
    }

    result = result.replace(pattern, newValue);
  }

  return result;
}

// Get CSS files recursively
function getCSSFiles(dir, exclude = []) {
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

// Main migration function
async function migrateDirFiles(pattern, dryRun = true) {
  try {
    // Get CSS files
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

      const highConfidence = replacements.filter(r => r.confidence === 'high').length;
      const mediumConfidence = replacements.filter(r => r.confidence === 'medium').length;

      console.log(`\n${path.relative(process.cwd(), file)}`);
      console.log(`  High confidence: ${highConfidence}, Medium: ${mediumConfidence}`);

      allReplacements.push({
        file,
        count: replacements.length,
        highConfidence,
        mediumConfidence,
        replacements,
      });

      if (!dryRun) {
        const newContent = applyReplacements(content, replacements);
        fs.writeFileSync(file, newContent, 'utf8');
        filesModified++;
      }
    }

    // Generate summary report
    const totalReplacements = allReplacements.reduce((sum, f) => sum + f.count, 0);
    const totalHighConfidence = allReplacements.reduce((sum, f) => sum + f.highConfidence, 0);
    const totalMediumConfidence = allReplacements.reduce((sum, f) => sum + f.mediumConfidence, 0);

    console.log(`\n${'='.repeat(60)}`);
    console.log('MIGRATION REPORT');
    console.log(`${'='.repeat(60)}`);
    console.log(`Files processed: ${allReplacements.length}`);
    console.log(`Total color replacements: ${totalReplacements}`);
    console.log(`  ✓ High confidence: ${totalHighConfidence}`);
    console.log(`  ~ Medium confidence: ${totalMediumConfidence}`);

    if (dryRun) {
      console.log(`\n[DRY RUN] No files modified. Run with --execute to apply changes.`);
    } else {
      console.log(`\n[EXECUTED] ${filesModified} files modified.`);
    }

    // Write detailed report
    const reportPath = path.join(process.cwd(), 'color-migration-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(allReplacements, null, 2), 'utf8');
    console.log(`\nDetailed report: ${reportPath}`);

  } catch (error) {
    console.error('Error during migration:', error.message);
    process.exit(1);
  }
}

// CLI argument parsing
async function main() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--execute');

  // Find file pattern argument (first non-flag argument)
  let pattern = 'packages/app/src/**/*.css';
  for (const arg of args) {
    if (!arg.startsWith('--')) {
      pattern = arg;
      break;
    }
  }

  console.log(`Color Token Migration Script`);
  console.log(`Pattern: ${pattern}`);
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'EXECUTE'}\n`);

  await migrateDirFiles(pattern, dryRun);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { findTokenMatch, processCSSFile, applyReplacements };
