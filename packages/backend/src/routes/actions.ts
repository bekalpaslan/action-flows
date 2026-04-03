/**
 * Actions Catalog API Route
 * Parses .claude/actionflows/ACTIONS.md and serves as structured JSON.
 * Consumed by FlowComposer (Phase 9 Plan 03) for action selection.
 *
 * Endpoints:
 * - GET /api/actions - Returns parsed action catalog
 */

import { Router, Request, Response } from 'express';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';

const router = Router();

interface ParsedAction {
  name: string;
  description: string;
  category: string;
}

/**
 * Parse ACTIONS.md markdown into structured action objects.
 * Detects category headers (## Abstract Actions, ## Generic Actions, etc.)
 * and extracts action names and descriptions from table rows.
 */
function parseActionsMarkdown(content: string): ParsedAction[] {
  const actions: ParsedAction[] = [];
  let currentCategory = '';

  for (const line of content.split('\n')) {
    // Detect category headers (## Abstract Actions, ## Generic Actions, etc.)
    const categoryMatch = line.match(/^##\s+(.+)$/);
    if (categoryMatch) {
      currentCategory = categoryMatch[1]!.trim();
      continue;
    }

    // Parse table rows: | action-name/ | Purpose | ... |
    const rowMatch = line.match(/^\|\s*`?([^|`]+?)`?\s*\|\s*([^|]+?)\s*\|/);
    if (rowMatch && currentCategory && !rowMatch[1]!.includes('Action') && !rowMatch[1]!.includes('---') && !rowMatch[1]!.includes('Name')) {
      const name = rowMatch[1]!.trim().replace(/\/$/, '').replace(/`/g, '');
      const description = rowMatch[2]!.trim();
      if (name && description && name !== '---' && !name.startsWith('-')) {
        actions.push({ name, description, category: currentCategory });
      }
    }
  }

  return actions;
}

let cachedActions: ParsedAction[] | null = null;

/**
 * GET /api/actions
 * Returns parsed action catalog from ACTIONS.md
 */
router.get('/', (_req: Request, res: Response) => {
  try {
    if (!cachedActions) {
      // Resolve monorepo root by walking up from cwd
      let monorepoRoot = process.cwd();
      while (!existsSync(join(monorepoRoot, 'packages'))) {
        const parent = dirname(monorepoRoot);
        if (parent === monorepoRoot) break; // filesystem root
        monorepoRoot = parent;
      }

      const actionsPath = join(monorepoRoot, '.claude', 'actionflows', 'ACTIONS.md');
      const content = readFileSync(actionsPath, 'utf-8');
      cachedActions = parseActionsMarkdown(content);
    }

    res.json({
      success: true,
      actions: cachedActions,
      total: cachedActions.length,
    });
  } catch (error) {
    console.error('[Actions API] Error reading ACTIONS.md:', error);
    res.json({
      success: true,
      actions: [],
      total: 0,
    });
  }
});

export default router;
