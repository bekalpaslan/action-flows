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
  const regex = new RegExp(`^## ${sectionName}$([\s\S]*?)(?=^## [^#]|$)`, 'm');
  const match = contractContent.match(regex);
  return match ? match[1].trim() : '';
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
        const mainSections = requiredSections.filter((s) => s !== 'Notes' && s !== 'Learnings');

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
          const lineCount = sectionContent.split('\n').length;

          if (!sectionContent) {
            issues.push(`✗ EMPTY SECTION: "${section}" has no content`);
          } else if (section in MINIMUM_CONTENT) {
            const minLines = MINIMUM_CONTENT[section as keyof typeof MINIMUM_CONTENT];
            if (lineCount < minLines) {
              issues.push(
                `⚠ SPARSE SECTION: "${section}" has only ${lineCount} lines (minimum ${minLines} expected)`
              );
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

        // Check for table structure (at least one | pipe)
        const hasTable = propsSection.includes('|');

        expect(hasTable, `Props Contract should contain a table with props documented`).toBe(true);
      });

      it('State Ownership section has proper structure', () => {
        const stateSection = getSectionContent(content, 'State Ownership');

        if (!stateSection) {
          // State Ownership is critical
          expect.fail('State Ownership section missing');
        }

        // Should have subsections or at least mention state variables
        const hasSubsection = /### /.test(stateSection) || /\| /.test(stateSection);

        expect(hasSubsection, `State Ownership should have subsections or tables`).toBe(true);
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
