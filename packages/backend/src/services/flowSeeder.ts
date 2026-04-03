/**
 * Flow Seeder Service
 * Parses .claude/actionflows/FLOWS.md and seeds flows into storage on startup.
 * Idempotent: only seeds when no flows exist in storage.
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import type { Timestamp } from '@afw/shared';
import { storage } from '../storage/index.js';

const FLOWS_KEY_PREFIX = 'flow:';

interface ParsedFlow {
  name: string;
  description: string;
  category: string;
  chain: string;
}

/**
 * Parse FLOWS.md markdown into structured flow objects.
 * Detects context headers (## work, ## explore, etc.) and table rows within each context.
 */
function parseFlowsMarkdown(content: string): ParsedFlow[] {
  const flows: ParsedFlow[] = [];
  let currentCategory = '';

  for (const line of content.split('\n')) {
    // Detect context headers like "## work" or "## explore"
    const categoryMatch = line.match(/^##\s+(\w+)\s*$/);
    if (categoryMatch) {
      currentCategory = categoryMatch[1]!.toLowerCase();
      continue;
    }

    // Parse table rows: | flow-name/ | Purpose text | chain -> steps |
    const rowMatch = line.match(/^\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|$/);
    if (rowMatch && currentCategory && !rowMatch[1]!.includes('Flow') && !rowMatch[1]!.includes('---')) {
      const name = rowMatch[1]!.trim().replace(/\/$/, '');
      const description = rowMatch[2]!.trim();
      const chain = rowMatch[3]!.trim();
      if (name && description && name !== 'Name' && !name.startsWith('-')) {
        flows.push({ name, description, category: currentCategory, chain });
      }
    }
  }

  return flows;
}

/**
 * Seed flows from FLOWS.md into storage.
 * Only seeds if no flows exist yet (idempotent).
 * @returns Number of flows seeded
 */
export async function seedFlowsFromMarkdown(): Promise<number> {
  // Only seed if no flows exist yet (idempotent)
  if (storage.keys) {
    const existingKeys = await Promise.resolve(storage.keys(`${FLOWS_KEY_PREFIX}*`));
    if (existingKeys.length > 0) {
      console.log(`[FlowSeeder] ${existingKeys.length} flows already in storage, skipping seed`);
      return 0;
    }
  }

  // Resolve FLOWS.md path relative to monorepo root
  let monorepoRoot = process.cwd();
  // Walk up until we find the packages/ directory (monorepo root marker)
  const { existsSync } = await import('fs');
  const { dirname } = await import('path');
  while (!existsSync(join(monorepoRoot, 'packages'))) {
    const parent = dirname(monorepoRoot);
    if (parent === monorepoRoot) break; // filesystem root
    monorepoRoot = parent;
  }

  const flowsPath = join(monorepoRoot, '.claude', 'actionflows', 'FLOWS.md');
  let content: string;
  try {
    content = readFileSync(flowsPath, 'utf-8');
  } catch {
    console.warn('[FlowSeeder] FLOWS.md not found at', flowsPath, '- skipping seed');
    return 0;
  }

  const parsed = parseFlowsMarkdown(content);
  const now = new Date().toISOString() as Timestamp;
  let seeded = 0;

  for (const flow of parsed) {
    const id = flow.name.replace(/[^a-z0-9-]/gi, '-').toLowerCase();
    const flowData = {
      id,
      name: flow.name,
      description: flow.description,
      category: flow.category,
      tags: [],
      version: '1.0.0',
      usageCount: 0,
      chainTemplate: flow.chain,
      registeredAt: now,
      modifiedAt: now,
    };

    if (storage.set) {
      await Promise.resolve(storage.set(`${FLOWS_KEY_PREFIX}${id}`, JSON.stringify(flowData)));
      seeded++;
    }
  }

  console.log(`[FlowSeeder] Seeded ${seeded} flows from FLOWS.md`);
  return seeded;
}
