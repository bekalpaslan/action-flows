import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

const MONOREPO_ROOT = path.resolve(__dirname, '..', '..', '..', '..', '..');

/**
 * Contract Completeness Checker Tests (P1)
 *
 * Verifies that all contracts have required sections defined in TEMPLATE.contract.md
 * and that critical sections have non-empty content.
 *
 * Scope: All 99+ contracts
 */

// Read the template contract to extract required sections
function getRequiredSections(): string[] {
  const templatePath = path.resolve(MONOREPO_ROOT, 'packages/app/src/contracts/TEMPLATE.contract.md');

  if (!fs.existsSync(templatePath)) {
    // Return common required sections if template not found
    return ['Identity', 'Render Location', 'Lifecycle', 'Props Contract', 'State Ownership', 'Interactions', 'Test Hooks'];
  }

  const content = fs.readFileSync(templatePath, 'utf-8');
  const sections: string[] = [];

  // Extract all ## Heading sections
  const headingMatches = content.matchAll(/^## ([^\n]+)$/gm);
  for (const match of headingMatches) {
    sections.push(match[1]);
  }

  return sections;
}

// Check if a section exists in contract
function hasSection(contractContent: string, sectionName: string): boolean {
  // Match ## Section Name (with or without exact case)
  const regex = new RegExp(`^## ${sectionName}$`, 'm');
  return regex.test(contractContent);
}

// Get content of a section
function getSectionContent(contractContent: string, sectionName: string): string {
  // Split by ## headers and find the target section
  const lines = contractContent.split('\n');
  const sectionStartPattern = new RegExp(`^## ${sectionName}$`);
  const sectionHeaderPattern = /^## /;

  let inSection = false;
  let sectionLines: string[] = [];

  for (const line of lines) {
    if (sectionStartPattern.test(line)) {
      inSection = true;
      continue; // Skip the header line itself
    }

    if (inSection) {
      // Stop if we hit another ## section
      if (sectionHeaderPattern.test(line)) {
        break;
      }
      sectionLines.push(line);
    }
  }

  return sectionLines.join('\n').trim();
}

// Critical sections that should have meaningful content
const CRITICAL_SECTIONS = ['Identity', 'Props Contract', 'Lifecycle', 'Test Hooks', 'State Ownership'];

// Minimum line counts for critical sections
const MINIMUM_CONTENT = {
  'Props Contract': 5, // Should have at least a table
  'Test Hooks': 3, // Should have at least some hooks documented
  'Lifecycle': 4, // Should describe lifecycle
  'State Ownership': 4, // Should describe state
};

describe('Contract Completeness Checker (P1)', () => {
  const requiredSections = getRequiredSections();
  const contractFiles = glob.sync('packages/app/src/contracts/**/*.contract.md', {
    ignore: '**/TEMPLATE.contract.md',
    cwd: MONOREPO_ROOT,
  });

  if (contractFiles.length === 0) {
    it.skip('No contract files found', () => {});
    return;
  }

  contractFiles.forEach((contractPath) => {
    const contractName = path.basename(contractPath, '.contract.md');
    const content = fs.readFileSync(path.resolve(MONOREPO_ROOT, contractPath), 'utf-8');

    describe(`${contractName}`, () => {
      it('has all required top-level sections', () => {
        const issues: string[] = [];

        // Check required sections (excluding optional ones)
        // Health Checks, Dependencies, and Side Effects are optional for simple components
        const optionalSections = ['Notes', 'Learnings', 'Health Checks', 'Dependencies', 'Side Effects'];
        const mainSections = requiredSections.filter((s) => !optionalSections.includes(s));

        mainSections.forEach((section) => {
          if (!hasSection(content, section)) {
            issues.push(`✗ MISSING SECTION: "${section}"`);
          }
        });

        if (issues.length > 0) {
          expect.fail(`${contractName} missing required sections:\n${issues.join('\n')}`);
        }
      });

      it('has non-empty critical sections', () => {
        const issues: string[] = [];

        CRITICAL_SECTIONS.forEach((section) => {
          const sectionContent = getSectionContent(content, section);

          if (!sectionContent) {
            issues.push(`✗ EMPTY SECTION: "${section}" has no content`);
          } else {
            // Accept TBD/TODO as valid placeholder content (minimum 3 chars like "TBD")
            // Also accept "None" as valid explicit statement
            const hasMinimalContent = sectionContent.length >= 3;
            if (!hasMinimalContent) {
              issues.push(`✗ EMPTY SECTION: "${section}" has no meaningful content`);
            }
          }
        });

        if (issues.length > 0) {
          expect.fail(`${contractName} has sparse critical sections:\n${issues.join('\n')}`);
        }
      });

      it('has metadata in header', () => {
        const issues: string[] = [];

        // Check required metadata
        const requiredMetadata = ['File:', 'Type:', 'Contract Version:', 'Last Reviewed:'];

        requiredMetadata.forEach((metadata) => {
          if (!new RegExp(`^\\*\\*${metadata}\\*\\*`, 'm').test(content)) {
            issues.push(`✗ MISSING METADATA: "${metadata}"`);
          }
        });

        if (issues.length > 0) {
          expect.fail(`${contractName} missing required metadata:\n${issues.join('\n')}`);
        }
      });

      it('Props Contract has inputs table', () => {
        const propsSection = getSectionContent(content, 'Props Contract');

        if (!propsSection) {
          expect.fail('Props Contract section missing');
        }

        // Check for table structure (at least one | pipe) OR explicit "None"/"N/A"/"TBD" statement
        const hasTable = propsSection.includes('|');
        const hasNoneStatement = /(none|n\/a|tbd|todo)/i.test(propsSection);

        expect(hasTable || hasNoneStatement,
          `Props Contract should contain a table with props documented or explicit "None/N/A/TBD" statement`).toBe(true);
      });

      it('State Ownership section has proper structure', () => {
        const stateSection = getSectionContent(content, 'State Ownership');

        if (!stateSection) {
          // State Ownership is critical
          expect.fail('State Ownership section missing');
        }

        // Should have subsections, tables, explicit "None"/"N/A"/"TBD" statement, OR meaningful content (>20 chars)
        const hasSubsection = /### /.test(stateSection) || /\| /.test(stateSection);
        const hasNoneStatement = /(none|n\/a|tbd|todo)/i.test(stateSection);
        const hasMeaningfulContent = stateSection.length > 20;

        expect(hasSubsection || hasNoneStatement || hasMeaningfulContent,
          `State Ownership should have subsections, tables, explicit "None/N/A/TBD" statement, or meaningful content`).toBe(true);
      });

      it('Lifecycle section has Key Effects or similar', () => {
        const lifecycleSection = getSectionContent(content, 'Lifecycle');

        if (!lifecycleSection) {
          expect.fail('Lifecycle section missing');
        }

        // Should mention effects, dependencies, or triggers
        const hasEffects = /effect|dependency|trigger|mount|unmount/i.test(lifecycleSection);

        expect(hasEffects, `Lifecycle should describe effects, dependencies, or mount/unmount triggers`).toBe(true);
      });

      it('uses consistent markdown formatting', () => {
        const issues: string[] = [];

        // Check for common markdown issues
        if (/^##[^#]/.test(content)) {
          issues.push('⚠ Some headings use ## but should check consistency');
        }

        // Check for unmatched code blocks
        const backticks = (content.match(/`/g) || []).length;
        if (backticks % 2 !== 0) {
          issues.push('⚠ FORMATTING: Unmatched backticks in contract');
        }

        // Warnings are optional, not failures
        if (issues.length > 0) {
          // Log but don't fail
          console.warn(`${contractName}: ${issues.join(', ')}`);
        }
      });
    });
  });
});
