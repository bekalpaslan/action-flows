# Design to Code Flow

> Convert Figma designs into React components with proper styling and structure.

---

## When to Use

- Converting Figma designs to React components
- Implementing UI from design mockups
- Syncing design changes to existing components
- When human provides Figma URL and requests "convert to code" or "implement design"
- Design-driven development workflows

---

## Required Inputs From Human

| Input | Description | Example |
|-------|-------------|---------|
| figmaUrl | Figma design URL | `https://figma.com/design/:fileKey/:fileName?node-id=1-2` |
| targetComponent | Target React component name/path | "ChatPanel" or "packages/app/src/components/ChatPanel.tsx" |
| mode | Execution mode | "generate-only" (default) or "generate-and-integrate" |

---

## Prerequisites

**CRITICAL:** Before executing this flow:
1. Figma MCP configured and connected
2. Valid Figma URL with accessible design file
3. Human has read access to the Figma file
4. Target component path exists (or parent directory exists for new components)

If any prerequisite fails → Flow errors. Human must fix and re-run.

---

## Action Sequence

### Step 1: Extract Figma Design Context

**Action:** ORCHESTRATOR-DIRECT (Figma MCP)
**Model:** N/A (Orchestrator uses MCP tools)
**Waits for:** None

**Execution (Orchestrator Direct):**

The orchestrator extracts design context using Figma MCP tools:

1. **Parse Figma URL** to extract fileKey and nodeId
2. **Load Figma MCP tools** via ToolSearch query="figma"
3. **Call mcp__figma__get_design_context:**
   - fileKey: {from URL}
   - nodeId: {from URL}
   - clientFrameworks: "react"
   - clientLanguages: "typescript"
4. **Call mcp__figma__get_screenshot** for visual reference
5. **Call mcp__figma__get_variable_defs** for design tokens
6. **Output design context** to log folder with:
   - Component structure (hierarchy, children)
   - Generated code snippets from Figma
   - Design tokens (colors, fonts, spacing)
   - Assets (images, icons)
   - Recommended props interface

**Gate:** Design context extracted. Code snippets and tokens ready.

---

### Step 2: Plan Component Architecture

**Action:** `.claude/actionflows/actions/plan/`
**Model:** sonnet
**Waits for:** Step 1

**Spawn after Step 1:**
```
Read your definition in .claude/actionflows/actions/plan/agent.md

Input:
- requirements: Design React component architecture from Figma context (Step 1)
- context: Figma design structure, tokens, existing codebase patterns
- depth: detailed

Output: Component implementation plan with:
1. Component file structure (single file vs multi-file)
2. Props interface design
3. State management approach (local state, context, none)
4. Design token import strategy
5. Child component breakdown (if complex)
6. Styling approach (CSS modules, inline, design tokens)
7. Accessibility considerations (ARIA, semantic HTML)
```

**Gate:** Component plan delivered. Architecture ready for coding.

---

### Step 3: HUMAN GATE

Present component plan for approval.

- **Accept:** Proceed to Step 4 (Code)
- **Modify:** Human provides adjustments, loop back to Step 2 with modifications
- **Reject:** Flow ends (no code changes)

---

### Step 4: Generate Component Code

**Action:** `.claude/actionflows/actions/code/frontend/`
**Model:** haiku
**Waits for:** Human approves Step 3

**Spawn after Human approves Step 3:**
```
Read your definition in .claude/actionflows/actions/code/frontend/agent.md

Input:
- task: Create React component from approved plan (Step 3)
- context: Figma-generated code, design tokens, component plan
- output_path: {targetComponent from human}
- style: Match existing ActionFlows component patterns

Implementation:
1. Use Figma-generated code as base structure
2. Adapt to ActionFlows conventions (TypeScript, props interface, exports)
3. Import design tokens from Step 1 variable definitions
4. Apply accessibility patterns (semantic HTML, ARIA)
5. Ensure responsive design if indicated in Figma
6. Add JSDoc comments for complex logic
```

**Gate:** Component code generated. File(s) created.

---

### Step 5: Create Code Connect Mapping

**Action:** ORCHESTRATOR-DIRECT (Figma MCP)
**Model:** N/A (Orchestrator uses MCP tools)
**Waits for:** Step 4

**Execution (Orchestrator Direct):**

The orchestrator creates a Figma Code Connect mapping linking the Figma node to the generated component:

1. **Parse Figma URL** to extract fileKey and nodeId
2. **Load Figma MCP tools** via ToolSearch
3. **Call mcp__figma__add_code_connect_map:**
   - nodeId: {from URL}
   - fileKey: {from URL}
   - source: {component file path from Step 4}
   - componentName: {React component name}
   - label: "React"
4. **Output mapping confirmation** to log folder

**Gate:** Code Connect mapping established. Figma design linked to code.

---

### Step 6: Review Component

**Action:** `.claude/actionflows/actions/review/`
**Model:** sonnet
**Waits for:** Step 5

**Spawn after Step 5:**
```
Read your definition in .claude/actionflows/actions/review/agent.md

Input:
- scope: Generated component from Step 4
- type: component-review
- context: Figma design, component plan from Step 3

Review and report:
1. Code quality (TypeScript correctness, prop types, exports)
2. Design fidelity (matches Figma design?)
3. Accessibility (ARIA, semantic HTML, keyboard nav)
4. Design token usage (are tokens imported and used?)
5. ActionFlows patterns (follows codebase conventions?)
6. Recommendations (improvements, edge cases, testing needs)
```

**Gate:** Component reviewed. Issues documented.

---

### Step 7: Mode Branch

**If mode = "generate-only":**
- Flow ends after review
- Component ready for manual integration

**If mode = "generate-and-integrate":**
- Continue to Step 8 (Integration)

---

### Step 8: Integrate Component (generate-and-integrate mode only)

**Action:** `.claude/actionflows/actions/code/frontend/`
**Model:** haiku
**Waits for:** Step 6

**Spawn after Step 6 (if mode = generate-and-integrate):**
```
Read your definition in .claude/actionflows/actions/code/frontend/agent.md

Input:
- task: Wire generated component into parent component or view
- context: Component from Step 4, target integration point
- integration_strategy: Import component, add to parent JSX, pass props

Implementation:
1. Identify parent component (from human input or analysis)
2. Import new component
3. Add to parent JSX with appropriate props
4. Wire up event handlers or state if needed
5. Verify type safety (TypeScript checks pass)
```

**Gate:** Component integrated. Fully wired.

---

## Dependencies

### Mode: generate-only
```
Step 1 (figma-extract) → Step 2 (plan) → Step 3 (HUMAN GATE) → Step 4 (code/frontend) → Step 5 (figma-map) → Step 6 (review) → END
```

### Mode: generate-and-integrate
```
Step 1 (figma-extract) → Step 2 (plan) → Step 3 (HUMAN GATE) → Step 4 (code/frontend) → Step 5 (figma-map) → Step 6 (review) → Step 8 (code/frontend/integration) → END
```

---

## Chains With

- ← Triggered when human provides Figma URL + "convert to code"
- → code-and-review/ (for refinements after integration)
- → post-completion/ (after component integrated and tested)

---

## Example: Generate-Only Mode

```
Human: "Convert this Figma design to a React component: https://figma.com/design/ABC123/Dashboard?node-id=1-2"

Orchestrator Routes to: design-to-code/, mode=generate-only

Step 1: Orchestrator extracts Figma context
- Parses URL → fileKey=ABC123, nodeId=1-2
- Calls get_design_context → returns component structure + code
- Calls get_screenshot → visual reference
- Calls get_variable_defs → color tokens, spacing

Step 2: Plan component
- Single-file component: DashboardHeader.tsx
- Props: { title: string, onClose: () => void }
- Uses design tokens for colors
- Accessibility: semantic header, ARIA labels

Step 3: HUMAN GATE
Approve? → YES

Step 4: Generate code
- Creates packages/app/src/components/DashboardHeader.tsx
- Imports design tokens
- TypeScript interface for props
- JSX from Figma code adapted to ActionFlows patterns

Step 5: Figma mapping
- Orchestrator calls add_code_connect_map
- Links Figma node to DashboardHeader.tsx

Step 6: Review
- Code quality: ✅ APPROVED
- Design fidelity: Matches Figma
- Accessibility: ✅ semantic HTML, ARIA
- Flow ends

Output: DashboardHeader.tsx ready for use
```

---

## Notes

- **Figma extraction and mapping are orchestrator-direct:** Not delegated. Orchestrator uses MCP tools.
- **Design tokens:** Extract from Figma variables, import into component.
- **Code fidelity:** Use Figma-generated code as base, adapt to ActionFlows patterns.
- **Accessibility:** Always include ARIA labels, semantic HTML, keyboard navigation.
- **Integration mode:** Use "generate-and-integrate" when component should be wired immediately.
