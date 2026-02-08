# Module 8: The Contract

**Level:** Advanced
**Duration:** ~30 min
**Prerequisites:** Modules 1-7 (Beginner + Intermediate complete)

---

## Presentation

Welcome to Advanced level!

You've learned to USE and CUSTOMIZE the framework. Now let's learn to EVOLVE it.

We'll start with the CONTRACT—the harmony mechanism that keeps orchestrator and dashboard in sync.

---

## The Concept

ActionFlows is "living software"—it evolves through human-triggered Claude sessions. But evolution needs guardrails:

### Problem without contract:
```
┌─────────────┐                    ┌───────────┐
│ Orchestrator│ produces output →  │ Dashboard │
│             │                    │ (parses)  │
└─────────────┘                    └───────────┘
      ↓ (human changes output format)
┌─────────────┐                    ┌───────────┐
│ Orchestrator│ new format →       │ Dashboard │ ❌ Parsing breaks!
│             │                    │           │    Visualization fails.
└─────────────┘                    └───────────┘
```

### Solution with contract:
```
┌─────────────┐         ┌──────────┐         ┌───────────┐
│ Orchestrator│ ──────► │ CONTRACT │ ◄────── │ Dashboard │
│             │ follows │          │ follows │           │
└─────────────┘         └──────────┘         └───────────┘
                        (harmony bridge)
      ↓ (human changes format)
┌─────────────┐         ┌──────────┐         ┌───────────┐
│ Orchestrator│ ──────► │ CONTRACT │         │ Dashboard │
│             │ updated │ (updated)│         │ (updated) │
└─────────────┘         └──────────┘         └───────────┘
                                   ↓
                         Both sides update together
                         → Harmony maintained ✅
```

---

## Structure

CONTRACT.md defines EVERY output format the orchestrator produces:

```
.claude/actionflows/CONTRACT.md:
├── Format Catalog (by priority)
│   ├── P0 (Critical): Chain Compilation, Step Completion
│   ├── P1 (High): Review Reports, Error Announcements
│   ├── P2 (Important): Dual Output, Registry Updates
│   └── ...
│
└── For each format:
    ├── When produced
    ├── Required structure (markdown template)
    ├── Required fields (with types)
    ├── TypeScript interface (packages/shared/src/contract/types/)
    ├── Parser function (packages/shared/src/contract/parsers/)
    └── What breaks if changed
```

---

## Example: Chain Compilation Table (Format 1.1)

### Required structure:
```markdown
## Chain: {Brief Title}

**Request:** {One-line human intent}
**Source:** {flow-name/ | Composed from: ... | Meta-task}

| # | Action | Model | Key Inputs | Waits For | Status |
|---|--------|-------|------------|-----------|--------|
| 1 | action/ | model | input=value | -- | Pending |

**Execution:** {Sequential | Parallel: [...] | Single step}

What each step does:
1. **{Action}** -- {Description}

Execute?
```

### Required fields:
- Brief Title (string)
- Request (string)
- Source (enum)
- Table columns: #, Action, Model, Key Inputs, Waits For, Status
- Execution (enum)
- Numbered descriptions

### TypeScript interface:
`ChainCompilationParsed`

### Parser:
`parseChainCompilation()`

---

## Format Anatomy

Every contract format has:

1. **Structure template (markdown)**
   → What the orchestrator produces

2. **Required fields (with types)**
   → What MUST be present for parsing to succeed

3. **TypeScript interface**
   → Type-safe representation in code

4. **Parser function**
   → Converts markdown → TypeScript object

5. **Dashboard component**
   → Renders the parsed data

**All 5 must stay in sync. That's the contract.**

---

## Example Parsing

### Orchestrator produces:
```markdown
## Chain: Fix login bug

**Request:** Fix login validation bug
**Source:** bug-triage/

| # | Action | Model | Key Inputs | Waits For | Status |
|---|--------|-------|------------|-----------|--------|
| 1 | analyze/ | sonnet | scope=auth | -- | Pending |

**Execution:** Sequential

What each step does:
1. **analyze/** -- Diagnose root cause of validation failure

Execute?
```

### Backend parses:
```typescript
{
  type: 'ChainCompilation',
  title: 'Fix login bug',
  request: 'Fix login validation bug',
  source: { type: 'flow', name: 'bug-triage/' },
  steps: [
    {
      number: 1,
      action: 'analyze/',
      model: 'sonnet',
      inputs: { scope: 'auth' },
      waitsFor: [],
      status: 'Pending'
    }
  ],
  execution: { type: 'Sequential' }
}
```

### Dashboard renders:
[ReactFlow nodes with dependencies, progress bar, step cards]

---

## Quiz

**Question:** You want to add a new column "Timeout" to the chain table. What do you need to update?

A. CONTRACT.md only
B. CONTRACT.md and ORCHESTRATOR.md
C. CONTRACT.md, TypeScript interface, parser, ORCHESTRATOR.md, dashboard component
D. Just start using it—the dashboard will adapt

(Choose the best answer)

---

## Expected Answer

**Correct:** C

---

## Validation Responses

### If Correct
"Exactly! The contract requires ALL five parts to stay in sync: structure definition, TypeScript type, parser, ORCHESTRATOR.md example, dashboard component. Miss one and harmony breaks."

### If Wrong
"Not quite. Adding a column is a BREAKING change to the contract. You need to update: (1) CONTRACT.md structure, (2) TypeScript interface, (3) parser function, (4) ORCHESTRATOR.md examples, (5) dashboard rendering component. All five must stay in sync or harmony breaks."

---

## Key Takeaway

The contract is ActionFlows' evolution mechanism:
- Defines WHAT the orchestrator produces
- Specifies HOW the dashboard parses it
- Enables COORDINATED evolution (both sides update together)

**Without contract:** Changes break unpredictably
**With contract:** Changes are deliberate and synchronized

This is the foundation of "living software"—evolution with guardrails.

You can see all formats in:
`.claude/actionflows/CONTRACT.md`

---

## Transition

"Next module: How harmony detection auto-validates the contract."

Proceed to Module 9.
