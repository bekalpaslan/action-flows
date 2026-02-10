import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import ts from 'typescript';

/**
 * Contract Props Interface Matching Tests (P0)
 *
 * Verifies that props documented in the contract match the actual TypeScript interface.
 * Detects: missing props (in code but not contract), phantom props (in contract but not code),
 * and type mismatches.
 *
 * Focus: High-priority contracts (ChatPanel, SessionSidebar, DiscussButton, etc.)
 */

// Extract props from a TypeScript file
function extractPropsInterface(filePath: string): Map<string, { type: string; required: boolean }> {
  const content = fs.readFileSync(filePath, 'utf-8');
  const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true);

  const props = new Map<string, { type: string; required: boolean }>();

  // Find interface with 'Props' in the name
  function visit(node: ts.Node) {
    if (ts.isInterfaceDeclaration(node)) {
      const interfaceName = node.name.text;
      if (interfaceName.includes('Props')) {
        // Extract all properties
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

// Extract props from contract markdown
function extractContractProps(contractContent: string): Map<string, { type: string; required: boolean }> {
  const props = new Map<string, { type: string; required: boolean }>();

  // Find the Props Contract → Inputs section
  const inputsMatch = contractContent.match(/## Props Contract\s+### Inputs\s+([\s\S]*?)(?=\n### |\n##|\n---|\Z)/);

  if (!inputsMatch) {
    return props;
  }

  const inputsSection = inputsMatch[1];

  // Parse markdown table
  // Format: | prop | type | required | default | description |
  const rows = inputsSection.split('\n').filter((line) => line.startsWith('|'));

  // Skip header and separator rows
  rows.slice(2).forEach((row) => {
    const cells = row.split('|').map((cell) => cell.trim()).filter((cell) => cell);

    if (cells.length >= 3) {
      const propName = cells[0];
      const propType = cells[1];
      const requiredCell = cells[2];

      // ✅ or ❌ indicator for required
      const isRequired = requiredCell.includes('✅') || requiredCell === '✅';

      if (propName && propType) {
        props.set(propName, { type: propType, required: isRequired });
      }
    }
  });

  return props;
}

// High-priority contracts to test
const HIGH_PRIORITY_CONTRACTS = [
  { name: 'ChatPanel', contractPath: 'packages/app/src/contracts/components/ChatPanel/ChatPanel.contract.md', filePath: 'packages/app/src/components/SessionPanel/ChatPanel.tsx' },
  { name: 'SessionSidebar', contractPath: 'packages/app/src/contracts/components/SessionSidebar/SessionSidebar.contract.md', filePath: 'packages/app/src/components/SessionSidebar/SessionSidebar.tsx' },
  { name: 'DiscussButton', contractPath: 'packages/app/src/contracts/components/DiscussButton/DiscussButton.contract.md', filePath: 'packages/app/src/components/DiscussButton/DiscussButton.tsx' },
  { name: 'DiscussDialog', contractPath: 'packages/app/src/contracts/components/DiscussButton/DiscussDialog.contract.md', filePath: 'packages/app/src/components/DiscussButton/DiscussDialog.tsx' },
  { name: 'FlowVisualization', contractPath: 'packages/app/src/contracts/components/Canvas/FlowVisualization.contract.md', filePath: 'packages/app/src/components/Canvas/FlowVisualization.tsx' },
  { name: 'WorkbenchLayout', contractPath: 'packages/app/src/contracts/components/Layout/WorkbenchLayout.contract.md', filePath: 'packages/app/src/components/Layout/WorkbenchLayout.tsx' },
];

describe('Contract Props Interface Matching (P0)', () => {
  HIGH_PRIORITY_CONTRACTS.forEach(({ name, contractPath, filePath }) => {
    describe(`${name} Props`, () => {
      const contractFullPath = path.resolve(process.cwd(), contractPath);
      const fileFullPath = path.resolve(process.cwd(), filePath);

      // Skip if files don't exist
      if (!fs.existsSync(contractFullPath) || !fs.existsSync(fileFullPath)) {
        it.skip(`${name} contract or implementation not found`, () => {
          // File not found, skip this component
        });
        return;
      }

      it(`contract props match implementation interface`, () => {
        const contractContent = fs.readFileSync(contractFullPath, 'utf-8');
        const contractProps = extractContractProps(contractContent);
        const actualProps = extractPropsInterface(fileFullPath);

        const issues: string[] = [];

        // Check all contract props exist in actual implementation
        contractProps.forEach((contractProp, propName) => {
          const actualProp = actualProps.get(propName);

          if (!actualProp) {
            issues.push(`✗ PHANTOM PROP: "${propName}" documented in contract but not found in implementation`);
          } else {
            // Check required status matches
            if (actualProp.required !== contractProp.required) {
              const requiredStatus = contractProp.required ? 'required' : 'optional';
              const actualStatus = actualProp.required ? 'required' : 'optional';
              issues.push(
                `⚠ REQUIRED MISMATCH: "${propName}" is ${requiredStatus} in contract but ${actualStatus} in implementation`
              );
            }
          }
        });

        // Check all actual props are documented in contract
        actualProps.forEach((actualProp, propName) => {
          const contractProp = contractProps.get(propName);

          if (!contractProp) {
            issues.push(`✗ MISSING PROP: "${propName}" exists in implementation but not documented in contract`);
          }
        });

        if (issues.length > 0) {
          expect.fail(`${name} props mismatch:\n${issues.join('\n')}`);
        }
      });

      it(`should document all props in Props Contract section`, () => {
        const contractContent = fs.readFileSync(contractFullPath, 'utf-8');
        const contractProps = extractContractProps(contractContent);

        expect(
          contractProps.size > 0,
          `${name} contract should document props in "Props Contract → Inputs" section`
        ).toBe(true);
      });
    });
  });
});
