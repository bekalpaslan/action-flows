import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const MONOREPO_ROOT = path.resolve(__dirname, '..', '..', '..', '..', '..');

/**
 * Contract CSS Class Existence Validation Tests (P1)
 *
 * Verifies that CSS classes documented in contract's Test Hooks section exist
 * in the actual component stylesheet.
 *
 * Prevents: E2E test failures due to class name changes (like .conversation-* → .chat-panel*)
 *
 * Focus: High-priority components (ChatPanel, DiscussButton, FlowVisualization)
 */

// Extract CSS classes from a stylesheet (CSS or CSS Module)
function extractCSSClasses(stylesheetPath: string): Set<string> {
  if (!fs.existsSync(stylesheetPath)) {
    return new Set();
  }

  const content = fs.readFileSync(stylesheetPath, 'utf-8');
  const classes = new Set<string>();

  // Match all .classname patterns in CSS
  // This is a simple regex approach that handles most CSS
  const classMatches = content.match(/\.([a-zA-Z0-9_-]+)/g);

  if (classMatches) {
    classMatches.forEach((match) => {
      // Remove the leading dot
      const className = match.slice(1);
      classes.add(className);
    });
  }

  return classes;
}

// Extract CSS selectors documented in contract
function extractContractCSS(contractContent: string): string[] {
  const classes: string[] = [];

  // Find Test Hooks section
  const testHooksMatch = contractContent.match(/## Test Hooks\s+([\s\S]*?)(?=\n## |\n---|\Z)/);

  if (!testHooksMatch) {
    return classes;
  }

  const testHooksSection = testHooksMatch[1];

  // Look for "CSS Selectors:" or "CSS Classes:" or similar sections
  const cssMatch = testHooksSection.match(/(?:CSS|Selectors|Classes).*?:\s+([\s\S]*?)(?:\n\n|\n###|\Z)/i);

  if (!cssMatch) {
    return classes;
  }

  const cssSection = cssMatch[1];

  // Extract class names from markdown list or table
  const lines = cssSection.split('\n');

  lines.forEach((line) => {
    // Format: - `.classname`
    const listMatch = line.match(/^-\s*`\.([a-zA-Z0-9_-]+)`/);
    if (listMatch) {
      classes.push(listMatch[1]);
    }

    // Format: `.classname`
    const inlineMatch = line.match(/`\.([a-zA-Z0-9_-]+)`/);
    if (inlineMatch) {
      classes.push(inlineMatch[1]);
    }

    // Format: .classname (no backticks)
    const bareMatch = line.match(/^-\s*\.([a-zA-Z0-9_-]+)$/);
    if (bareMatch) {
      classes.push(bareMatch[1]);
    }
  });

  return [...new Set(classes)]; // Remove duplicates
}

// Test components with their contract and stylesheet paths
const TEST_COMPONENTS = [
  {
    name: 'ChatPanel',
    contractPath: 'packages/app/src/contracts/components/ChatPanel/ChatPanel.contract.md',
    stylesheetPath: 'packages/app/src/components/SessionPanel/ChatPanel.css',
  },
  {
    name: 'DiscussButton',
    contractPath: 'packages/app/src/contracts/components/DiscussButton/DiscussButton.contract.md',
    stylesheetPath: 'packages/app/src/components/DiscussButton/DiscussButton.css',
  },
  {
    name: 'FlowVisualization',
    contractPath: 'packages/app/src/contracts/components/Canvas/FlowVisualization.contract.md',
    stylesheetPath: 'packages/app/src/components/Canvas/FlowVisualization.css',
  },
];

describe('Contract CSS Class Existence Validation (P1)', () => {
  TEST_COMPONENTS.forEach(({ name, contractPath, stylesheetPath }) => {
    describe(`${name} CSS Classes`, () => {
      const contractFullPath = path.resolve(MONOREPO_ROOT, contractPath);
      const stylesheetFullPath = path.resolve(MONOREPO_ROOT, stylesheetPath);

      // Skip if contract doesn't exist
      if (!fs.existsSync(contractFullPath)) {
        it.skip(`${name} contract not found`, () => {});
        return;
      }

      it(`all documented CSS classes exist in stylesheet`, () => {
        const contractContent = fs.readFileSync(contractFullPath, 'utf-8');
        const documentedClasses = extractContractCSS(contractContent);
        const actualClasses = extractCSSClasses(stylesheetFullPath);

        const issues: string[] = [];

        if (documentedClasses.length === 0) {
          // No CSS documented, skip this check
          expect(true).toBe(true);
          return;
        }

        // Check all documented classes exist in actual stylesheet
        documentedClasses.forEach((className) => {
          if (!actualClasses.has(className)) {
            issues.push(`✗ PHANTOM CLASS: ".${className}" documented in contract but not found in stylesheet`);
          }
        });

        // Warn if there's significant undocumented CSS (>50% drift)
        const undocumentedClasses = Array.from(actualClasses).filter((c) => !documentedClasses.includes(c));

        if (undocumentedClasses.length > documentedClasses.length * 0.5) {
          issues.push(
            `⚠ HIGH CSS DRIFT: ${undocumentedClasses.length} undocumented classes (50%+ of ${documentedClasses.length} documented)`
          );
        }

        if (issues.length > 0) {
          expect.fail(`${name} CSS mismatch:\n${issues.join('\n')}`);
        }
      });

      it(`stylesheet should exist`, () => {
        // CSS is optional but if documented, stylesheet should exist
        const contractContent = fs.readFileSync(contractFullPath, 'utf-8');
        const documentedClasses = extractContractCSS(contractContent);

        if (documentedClasses.length > 0) {
          expect(
            fs.existsSync(stylesheetFullPath),
            `Contract documents ${documentedClasses.length} CSS classes but stylesheet not found at: ${stylesheetPath}`
          ).toBe(true);
        }
      });
    });
  });
});
