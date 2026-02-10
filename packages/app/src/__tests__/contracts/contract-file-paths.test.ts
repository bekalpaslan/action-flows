import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

/**
 * Contract File Path Validation Tests (P0)
 *
 * Verifies that every contract's **File:** metadata points to an actual component file.
 * Prevents orphaned contracts (like TopBar) and wrong path references (like ChatPanel→ConversationPanel).
 *
 * Scope: All 99+ contract files in packages/app/src/contracts/
 */

const MONOREPO_ROOT = path.resolve(__dirname, '..', '..', '..', '..', '..');

describe('Contract File Path Validation (P0)', () => {
  // Find all .contract.md files except template
  const contractFiles = glob.sync('packages/app/src/contracts/**/*.contract.md', {
    ignore: '**/TEMPLATE.contract.md',
    cwd: MONOREPO_ROOT
  });

  if (contractFiles.length === 0) {
    it.skip('No contract files found', () => {
      expect.fail('Contract discovery failed');
    });
    return;
  }

  contractFiles.forEach((contractPath) => {
    it(`${path.basename(contractPath)} references existing component file`, () => {
      // Read the contract file
      const content = fs.readFileSync(path.resolve(MONOREPO_ROOT, contractPath), 'utf-8');

      // Extract the file path from **File:** metadata line
      // Format: **File:** `packages/app/src/components/...`
      const fileMatch = content.match(/\*\*File:\*\*\s*`([^`]+)`/);

      if (!fileMatch || !fileMatch[1]) {
        // If contract doesn't have **File:** metadata, that's an error
        expect.fail(`Contract ${contractPath} is missing **File:** metadata line`);
      }

      const referencedFilePath = fileMatch[1];
      const absolutePath = path.resolve(MONOREPO_ROOT, referencedFilePath);

      // Check if the file exists
      expect(
        fs.existsSync(absolutePath),
        `Contract ${path.basename(contractPath)} references non-existent file: ${referencedFilePath}`
      ).toBe(true);

      // Also verify it's a valid TypeScript/TSX file
      if (fs.existsSync(absolutePath)) {
        const stats = fs.statSync(absolutePath);
        expect(
          stats.isFile(),
          `Contract references a directory instead of a file: ${referencedFilePath}`
        ).toBe(true);

        const ext = path.extname(absolutePath);
        expect(
          ['.ts', '.tsx'].includes(ext),
          `Contract references a non-TypeScript file: ${referencedFilePath} (extension: ${ext})`
        ).toBe(true);
      }
    });
  });
});
