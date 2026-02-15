# Design System Sync Flow

> Sync Figma design system variables (colors, fonts, spacing) to frontend CSS/TypeScript design tokens.

---

## When to Use

- Syncing Figma design tokens to codebase
- Updating design system after Figma changes
- Establishing design token single source of truth
- When human requests "sync design system" or "update design tokens from Figma"
- Design system governance workflows

---

## Required Inputs From Human

| Input | Description | Example |
|-------|-------------|---------|
| figmaFileKey | Figma file key containing design system | "ABC123XYZ" (from Figma URL) |
| nodeId | Root node ID for design system variables | "1-2" (from Figma URL) |
| targetPath | Path to design tokens file (optional) | "packages/app/src/styles/design-tokens.ts" (default) |

---

## Prerequisites

**CRITICAL:** Before executing this flow:
1. Figma MCP configured and connected
2. Valid Figma file with design system variables
3. Human has read access to Figma file
4. Target path exists or parent directory exists

If any prerequisite fails → Flow errors. Human must fix and re-run.

---

## Action Sequence

### Step 1: Extract Design Variables

**Action:** ORCHESTRATOR-DIRECT (Figma MCP)
**Model:** N/A (Orchestrator uses MCP tools)
**Waits for:** None

**Execution (Orchestrator Direct):**

1. **Load Figma MCP tools** via ToolSearch query="figma"
2. **Call mcp__figma__get_variable_defs:**
   - fileKey: {figmaFileKey from human}
   - nodeId: {nodeId from human}
   - clientFrameworks: "react"
   - clientLanguages: "typescript"
3. **Output variable definitions** to log folder (variables.json)
   - Example: `{"icon/default/secondary": "#949494", "spacing/base": "8px"}`

**Gate:** Design variables extracted. Token mappings ready.

---

### Step 2: Analyze Current Design Tokens

**Action:** `.claude/actionflows/actions/analyze/`
**Model:** sonnet
**Waits for:** Step 1

**Spawn after Step 1:**
```
Read your definition in .claude/actionflows/actions/analyze/agent.md

Input:
- aspect: design-token-drift
- scope: {targetPath from human}
- context: Compare Figma variables (Step 1) with current design tokens file

Workflow:
1. Read current design tokens file (targetPath)
2. Compare Figma variables with current tokens
3. Identify drift:
   - Added variables (in Figma, not in code)
   - Removed variables (in code, not in Figma)
   - Changed values (different values between Figma and code)
4. Classify impact:
   - Breaking changes (removed variables used in codebase)
   - Non-breaking additions (new variables)
   - Value updates (changed hex codes, spacing values)

Output: Drift analysis report with:
- Summary (X added, Y removed, Z changed)
- Detailed drift table (variable, Figma value, current value, impact)
- Breaking change warnings
- Migration recommendations (if breaking changes detected)
```

**Gate:** Drift analysis complete. Changes identified.

---

### Step 3: Plan Token Updates

**Action:** `.claude/actionflows/actions/plan/`
**Model:** sonnet
**Waits for:** Step 2

**Spawn after Step 2:**
```
Read your definition in .claude/actionflows/actions/plan/agent.md

Input:
- requirements: Design token update strategy from drift analysis (Step 2)
- context: Current token format, breaking changes, usage patterns
- depth: detailed

Output: Token update plan with:
1. Update strategy (replace all, merge, deprecate old)
2. File format (CSS variables, TypeScript constants, both)
3. Migration plan (if breaking changes):
   - Deprecated variable mappings
   - Backward compatibility approach
   - Migration timeline (immediate vs phased)
4. Verification steps (type-check, visual regression)
```

**Gate:** Token update plan delivered. Migration strategy ready.

---

### Step 4: HUMAN GATE

Present token update plan for approval.

- **Accept:** Proceed to Step 5 (Code)
- **Modify:** Human provides adjustments, loop back to Step 3 with modifications
- **Reject:** Flow ends (no code changes)

**Special attention:** If breaking changes detected, ensure human reviews migration plan.

---

### Step 5: Update Design Tokens

**Action:** `.claude/actionflows/actions/code/frontend/`
**Model:** haiku
**Waits for:** Human approves Step 4

**Spawn after Human approves Step 4:**
```
Read your definition in .claude/actionflows/actions/code/frontend/agent.md

Input:
- task: Update design tokens file from Figma variables (Step 1)
- context: Approved update plan (Step 4), Figma variables, current token file
- output_path: {targetPath from human}

Implementation:
1. Generate new token file format:
   - TypeScript: `export const designTokens = { colors: {...}, spacing: {...} }`
   - CSS: `:root { --color-primary: #...; }`
2. Apply Figma variable mappings from Step 1
3. Maintain backward compatibility if plan requires it:
   - Keep deprecated variables with @deprecated JSDoc
   - Add mapping comments (/* Figma: icon/default/secondary */)
4. Ensure type safety (TypeScript exports)
5. Format code (Prettier-compatible)
```

**Gate:** Design tokens file updated. Code written.

---

### Step 6: Create Design System Rules (Optional)

**Action:** ORCHESTRATOR-DIRECT (Figma MCP)
**Model:** N/A (Orchestrator uses MCP tools)
**Waits for:** Step 5

**Execution (Orchestrator Direct, if Figma supports create_design_system_rules):**

1. **Call mcp__figma__create_design_system_rules** (if available)
   - Generates design governance rules in Figma based on codebase usage
2. **Skip if tool not available** (Figma plugin-specific feature)

**Gate:** Design system rules created (or skipped).

---

### Step 7: Review Changes

**Action:** `.claude/actionflows/actions/review/`
**Model:** sonnet
**Waits for:** Step 6

**Spawn after Step 6:**
```
Read your definition in .claude/actionflows/actions/review/agent.md

Input:
- scope: Updated design tokens file from Step 5
- type: design-token-review
- context: Drift analysis, update plan, Figma variables

Review and report:
1. Token accuracy (all Figma variables mapped?)
2. Breaking changes (are deprecated tokens handled?)
3. Type safety (TypeScript exports correct?)
4. Format consistency (matches existing patterns?)
5. Migration readiness (if breaking changes, is migration clear?)
6. Recommendations (visual regression tests, component updates needed)
```

**Gate:** Token changes reviewed. Issues documented.

---

## Dependencies

```
Step 1 (figma-variables) → Step 2 (analyze drift) → Step 3 (plan) → Step 4 (HUMAN GATE) → Step 5 (code/frontend) → Step 6 (figma-rules) → Step 7 (review) → END
```

---

## Chains With

- ← Triggered when human requests "sync design tokens" or "update from Figma"
- → code-and-review/ (for component updates using new tokens)
- → post-completion/ (after tokens updated and committed)

---

## Example: Token Sync with Breaking Changes

```
Human: "Sync design tokens from Figma file ABC123, node 1-2"

Orchestrator Routes to: design-system-sync/

Step 1: Extract Figma variables
- Orchestrator calls get_variable_defs
- Returns: {"color/primary": "#007AFF", "spacing/base": "8px"}

Step 2: Analyze drift
- Current tokens: {"primaryColor": "#0066CC", "baseSpacing": "8px"}
- Drift detected:
  - color/primary changed: #0066CC → #007AFF
  - primaryColor deprecated (renamed to color/primary)
- Impact: Breaking (components use primaryColor)

Step 3: Plan token update
- Strategy: Merge with deprecation
- Keep primaryColor as alias to color/primary
- Add @deprecated JSDoc with migration note
- Migration timeline: Phased (1 sprint)

Step 4: HUMAN GATE
Breaking changes detected. Approve migration plan?
→ APPROVED

Step 5: Update tokens
- Writes design-tokens.ts:
  ```typescript
  export const designTokens = {
    colors: {
      primary: "#007AFF", // Figma: color/primary
    },
    spacing: {
      base: "8px",
    },
  };

  /** @deprecated Use designTokens.colors.primary */
  export const primaryColor = designTokens.colors.primary;
  ```

Step 6: Design system rules
- Skipped (tool not available)

Step 7: Review
- Token accuracy: ✅ all variables mapped
- Breaking changes: ✅ handled with deprecation
- Migration: Clear, phased over 1 sprint
- Flow ends

Output: design-tokens.ts updated, backward compatible
```

---

## Notes

- **Figma variables are orchestrator-extracted:** Orchestrator uses MCP tools directly.
- **Breaking changes:** Always use human gate for approval when deprecations detected.
- **Design token format:** Prefer TypeScript exports for type safety.
- **Visual regression:** Recommend visual tests after token updates (color changes especially).
- **Migration strategy:** Phased deprecation > immediate removal.
