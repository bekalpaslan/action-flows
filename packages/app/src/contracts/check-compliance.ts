#!/usr/bin/env node

/**
 * Contract Compliance Checker CLI (P1)
 *
 * Runs all contract compliance tests and generates a report.
 * Usage:
 *   pnpm contract:compliance
 *   pnpm contract:compliance --contract ChatPanel
 *   pnpm contract:compliance --detailed
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import ts from 'typescript';

interface ComplianceResult {
  contract: string;
  filePath: string;
  filePathExists: boolean;
  propsMatch: boolean;
  propsIssues: string[];
  cssMatch: boolean;
  cssIssues: string[];
  completeness: number; // 0-100 percentage
  completenessIssues: string[];
  passed: boolean;
}

// ============================================================================
// File Path Validation
// ============================================================================

function validateFilePath(contractPath: string): { exists: boolean; file: string } {
  const content = fs.readFileSync(contractPath, 'utf-8');
  const fileMatch = content.match(/\*\*File:\*\*\s*`([^`]+)`/);

  if (!fileMatch || !fileMatch[1]) {
    return { exists: false, file: 'N/A (missing metadata)' };
  }

  const referencedFile = fileMatch[1];
  const absolutePath = path.resolve(process.cwd(), referencedFile);
  const exists = fs.existsSync(absolutePath);

  return { exists, file: referencedFile };
}

// ============================================================================
// Props Matching
// ============================================================================

function extractPropsInterface(filePath: string): Map<string, { type: string; required: boolean }> {
  const content = fs.readFileSync(filePath, 'utf-8');
  const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true);

  const props = new Map<string, { type: string; required: boolean }>();

  function visit(node: ts.Node) {
    if (ts.isInterfaceDeclaration(node)) {
      const interfaceName = node.name.text;
      if (interfaceName.includes('Props')) {
        node.members.forEach((member) => {
          if (ts.isPropertySignature(member)) {
            const propName = member.name?.getText(sourceFile) || '';
            const propType = member.type?.getText(sourceFile) || 'unknown';
            const isRequired = !member.questionToken;

            props.set(propName, { type: propType, required: isRequired });
          }
        });
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return props;
}

function extractContractProps(contractContent: string): Map<string, { type: string; required: boolean }> {
  const props = new Map<string, { type: string; required: boolean }>();

  const inputsMatch = contractContent.match(
    /## Props Contract\s+### Inputs\s+([\s\S]*?)(?=\n### |\n##|\n---|\Z)/
  );

  if (!inputsMatch) {
    return props;
  }

  const inputsSection = inputsMatch[1];
  const rows = inputsSection.split('\n').filter((line) => line.startsWith('|'));

  rows.slice(2).forEach((row) => {
    const cells = row.split('|').map((cell) => cell.trim()).filter((cell) => cell);

    if (cells.length >= 3) {
      const propName = cells[0];
      const propType = cells[1];
      const requiredCell = cells[2];

      const isRequired = requiredCell.includes('✅') || requiredCell === '✅';

      if (propName && propType) {
        props.set(propName, { type: propType, required: isRequired });
      }
    }
  });

  return props;
}

function validateProps(contractPath: string, filePath: string): { match: boolean; issues: string[] } {
  if (!fs.existsSync(filePath)) {
    return { match: false, issues: [`File not found: ${filePath}`] };
  }

  try {
    const contractContent = fs.readFileSync(contractPath, 'utf-8');
    const contractProps = extractContractProps(contractContent);
    const actualProps = extractPropsInterface(filePath);

    const issues: string[] = [];

    contractProps.forEach((contractProp, propName) => {
      const actualProp = actualProps.get(propName);
      if (!actualProp) {
        issues.push(`  ✗ Phantom prop: "${propName}" in contract but not in code`);
      }
    });

    actualProps.forEach((actualProp, propName) => {
      const contractProp = contractProps.get(propName);
      if (!contractProp) {
        issues.push(`  ✗ Missing prop: "${propName}" in code but not documented`);
      }
    });

    return { match: issues.length === 0, issues };
  } catch (err) {
    return { match: false, issues: [`Error parsing props: ${String(err).slice(0, 100)}`] };
  }
}

// ============================================================================
// CSS Class Validation
// ============================================================================

function extractCSSClasses(stylesheetPath: string): Set<string> {
  if (!fs.existsSync(stylesheetPath)) {
    return new Set();
  }

  const content = fs.readFileSync(stylesheetPath, 'utf-8');
  const classes = new Set<string>();

  const classMatches = content.match(/\.([a-zA-Z0-9_-]+)/g);

  if (classMatches) {
    classMatches.forEach((match) => {
      const className = match.slice(1);
      classes.add(className);
    });
  }

  return classes;
}

function extractContractCSS(contractContent: string): string[] {
  const classes: string[] = [];

  const testHooksMatch = contractContent.match(/## Test Hooks\s+([\s\S]*?)(?=\n## |\n---|\Z)/);

  if (!testHooksMatch) {
    return classes;
  }

  const testHooksSection = testHooksMatch[1];
  const cssMatch = testHooksSection.match(/(?:CSS|Selectors|Classes).*?:\s+([\s\S]*?)(?:\n\n|\n###|\Z)/i);

  if (!cssMatch) {
    return classes;
  }

  const cssSection = cssMatch[1];
  const lines = cssSection.split('\n');

  lines.forEach((line) => {
    const listMatch = line.match(/^-\s*`\.([a-zA-Z0-9_-]+)`/);
    if (listMatch) {
      classes.push(listMatch[1]);
    }

    const inlineMatch = line.match(/`\.([a-zA-Z0-9_-]+)`/);
    if (inlineMatch) {
      classes.push(inlineMatch[1]);
    }

    const bareMatch = line.match(/^-\s*\.([a-zA-Z0-9_-]+)$/);
    if (bareMatch) {
      classes.push(bareMatch[1]);
    }
  });

  return [...new Set(classes)];
}

function validateCSS(contractPath: string, filePath: string): { match: boolean; issues: string[] } {
  const contractContent = fs.readFileSync(contractPath, 'utf-8');
  const documentedClasses = extractContractCSS(contractContent);

  if (documentedClasses.length === 0) {
    return { match: true, issues: [] };
  }

  // Try to find stylesheet (same dir, .css or .module.css)
  const dir = path.dirname(filePath);
  const base = path.basename(filePath, path.extname(filePath));
  const stylesheetCandidates = [
    path.join(dir, `${base}.css`),
    path.join(dir, `${base}.module.css`),
  ];

  let stylesheetPath: string | null = null;
  for (const candidate of stylesheetCandidates) {
    if (fs.existsSync(candidate)) {
      stylesheetPath = candidate;
      break;
    }
  }

  if (!stylesheetPath) {
    return {
      match: false,
      issues: [`  ⚠ Stylesheet not found for ${base} (documented ${documentedClasses.length} CSS classes)`],
    };
  }

  const actualClasses = extractCSSClasses(stylesheetPath);
  const issues: string[] = [];

  documentedClasses.forEach((className) => {
    if (!actualClasses.has(className)) {
      issues.push(`  ✗ Phantom CSS class: ".${className}" documented but not in stylesheet`);
    }
  });

  const undocumentedCount = Array.from(actualClasses).filter((c) => !documentedClasses.includes(c)).length;
  if (undocumentedCount > documentedClasses.length * 0.5) {
    issues.push(`  ⚠ ${undocumentedCount} undocumented CSS classes (50%+ drift)`);
  }

  return { match: issues.length === 0, issues };
}

// ============================================================================
// Completeness Check
// ============================================================================

function validateCompleteness(contractContent: string): { score: number; issues: string[] } {
  const issues: string[] = [];
  let score = 100;

  const sections = ['Identity', 'Lifecycle', 'Props Contract', 'State Ownership', 'Test Hooks'];

  sections.forEach((section) => {
    const hasSection = new RegExp(`^## ${section}$`, 'm').test(contractContent);
    if (!hasSection) {
      issues.push(`  ✗ Missing section: "${section}"`);
      score -= 15;
    }
  });

  const metadata = ['File:', 'Type:', 'Contract Version:'];
  metadata.forEach((meta) => {
    if (!new RegExp(`^\\*\\*${meta}\\*\\*`, 'm').test(contractContent)) {
      issues.push(`  ✗ Missing metadata: "${meta}"`);
      score -= 5;
    }
  });

  return { score: Math.max(0, score), issues };
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const filterContract = args.find((arg) => !arg.startsWith('--'))?.replace('--contract=', '') || null;
  const detailed = args.includes('--detailed');

  const contractFiles = glob.sync('packages/app/src/contracts/**/*.contract.md', {
    ignore: '**/TEMPLATE.contract.md',
    cwd: process.cwd(),
  });

  let filtered = contractFiles;
  if (filterContract) {
    filtered = contractFiles.filter((f) => f.includes(filterContract));
  }

  if (filtered.length === 0) {
    console.error(`No contracts found${filterContract ? ` matching "${filterContract}"` : ''}`);
    process.exit(1);
  }

  const results: ComplianceResult[] = [];

  console.log(`Checking ${filtered.length} contract(s)...\n`);

  for (const contractPath of filtered) {
    const contractName = path.basename(contractPath, '.contract.md');
    const content = fs.readFileSync(contractPath, 'utf-8');

    const filePathResult = validateFilePath(contractPath);
    const propsResult = filePathResult.exists ? validateProps(contractPath, filePathResult.file) : { match: false, issues: ['File not found'] };
    const cssResult = filePathResult.exists ? validateCSS(contractPath, filePathResult.file) : { match: false, issues: ['File not found'] };
    const completenessResult = validateCompleteness(content);

    const passed = filePathResult.exists && propsResult.match && cssResult.match && completenessResult.score === 100;

    results.push({
      contract: contractName,
      filePath: filePathResult.file,
      filePathExists: filePathResult.exists,
      propsMatch: propsResult.match,
      propsIssues: propsResult.issues,
      cssMatch: cssResult.match,
      cssIssues: cssResult.issues,
      completeness: completenessResult.score,
      completenessIssues: completenessResult.issues,
      passed,
    });

    // Print result
    const status = passed ? '✅' : '❌';
    console.log(`${status} ${contractName}`);

    if (detailed || !passed) {
      if (!filePathResult.exists) {
        console.log(`  ✗ File not found: ${filePathResult.file}`);
      }
      if (!propsResult.match) {
        propsResult.issues.forEach((issue) => console.log(issue));
      }
      if (!cssResult.match) {
        cssResult.issues.forEach((issue) => console.log(issue));
      }
      if (completenessResult.score < 100) {
        console.log(`  Completeness: ${completenessResult.score}%`);
        completenessResult.issues.forEach((issue) => console.log(issue));
      }
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  const passed = results.filter((r) => r.passed).length;
  const failed = results.length - passed;

  console.log(`Results: ${passed}/${results.length} passed`);

  if (failed > 0) {
    console.log(`         ${failed} failed`);
    process.exit(1);
  } else {
    console.log('✅ All contracts pass compliance checks!');
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
