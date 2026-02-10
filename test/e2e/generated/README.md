# Generated Test Scaffolds

This directory contains auto-generated Chrome MCP test scaffolds created from behavioral contracts.

## Overview

These test files are **scaffolds**, not complete tests. They provide:
- Test structure matching Chrome MCP pattern
- Health check automation scripts from contracts
- Type-safe test steps with assertions
- TODO comments for manual completion

## Usage

1. **Review generated tests** — Check that health checks match expectations
2. **Implement setup logic** — Navigate to component, create fixtures
3. **Fill in dynamic parameters** — Extract UIDs from snapshots
4. **Implement helpers** — Add missing helper functions to `chrome-mcp-helpers.ts`
5. **Test manually** — Execute via Claude: "run test X"

## Regeneration

Regenerate all scaffolds:
```bash
pnpm run generate:tests
```

Regenerate specific component:
```bash
pnpm run generate:tests --component=AnimatedStepNode
```

Preview without writing:
```bash
pnpm run generate:tests --dry-run
```

**Warning:** Regeneration overwrites existing files (backups saved as `.backup`)

## Generated Files

Each `.test.ts` file corresponds to one behavioral contract with health checks.

## Manual Tests

Manual tests (not generated) are in the parent directory:
- `../chrome-mcp-happy-path.test.ts`
- `../chrome-mcp-respect-check.test.ts`

## Source

Generator: `scripts/generate-test-scaffolds.ts`
Contracts: `packages/app/src/contracts/`
Last generated: 2026-02-10T18:48:34.067Z
