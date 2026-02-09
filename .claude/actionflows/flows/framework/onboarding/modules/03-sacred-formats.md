# Module 3: Sacred Formats

**Level:** Beginner
**Duration:** ~15 min
**Prerequisites:** Modules 1-2

---

## Presentation

Now for something critical: **sacred formats**.

ActionFlows has TWO types of instructions:

1. **Sacred (Don't Touch)** — Breaking these breaks the dashboard
2. **Safe (Go Ahead)** — Change freely, system adapts

Why this distinction?

The dashboard PARSES certain outputs from the orchestrator. If those formats change, parsing breaks and visualization stops working.

Here's the rule:

```
┌─────────────────────────────────────────┐
│ If the dashboard PARSES it → Sacred    │
│ If the dashboard READS it → Safe       │
└─────────────────────────────────────────┘
```

Let me show you the sacred formats:

---

## Examples

### 1. Chain Compilation Table (P0 - Critical)

```markdown
## Chain: {Title}

| # | Action | Model | Key Inputs | Waits For | Status |
|---|--------|-------|------------|-----------|--------|
| 1 | code/  | haiku | task=X     | --        | Pending |
```

**Why sacred:** Dashboard parses this into ReactFlow nodes. If columns change, visualization breaks.

### 2. Step Completion Announcement (P0 - Critical)

```
>> Step 1 complete: code/ -- Implemented feature X. Continuing to Step 2...
```

**Why sacred:** Dashboard detects ">>" prefix to advance progress bar. If format changes, progress stops updating.

### 3. Log Folder Naming (P0 - Critical)

```
.claude/actionflows/logs/{action-type}/{description}_{YYYY-MM-DD-HH-MM-SS}/
```

**Why sacred:** Dashboard links executions to log folders using this pattern. Breaking it breaks history.

---

## Full List

Sacred Formats (14 total):
```
├── P0 (Critical)
│   ├── Chain Compilation Table
│   ├── Step Completion Announcement
│   └── Log Folder Naming Convention
├── P1 (High Value)
│   ├── Review Report Structure
│   └── Error Announcement Format
├── P2 (Important)
│   ├── Dual Output Format (action + second opinion)
│   └── Registry Update Format
└── System Types
    ├── Branded Type Conventions (SessionId, ChainId, StepId, UserId)
    ├── WebSocket Event Discriminated Unions
    ├── FLOWS.md Registry Structure
    ├── ACTIONS.md Registry Structure
    ├── CONTEXTS.md Routing Table
    ├── INDEX.md Table Structure
    └── Contract Version Header
```

You can see the full specifications in:
`.claude/actionflows/CONTRACT.md`

---

## Quiz

**Question:** Which of these can you safely change?

A. The columns in the chain compilation table
B. The routing triggers in CONTEXTS.md
C. The >> prefix in step completion announcements
D. The folder naming pattern for logs

(You can choose multiple)

---

## Expected Answer

**Correct:** B only

---

## Validation Responses

### If Correct
"Perfect! CONTEXTS.md is a routing configuration—the orchestrator READS it to make decisions. Changing it doesn't break parsing, so it's safe to evolve."

### If Wrong
"Close, but remember the rule: If the dashboard PARSES it (extracts structured data), it's sacred. The chain table, >> prefix, and log folder naming are all parsed by the backend. CONTEXTS.md is just READ by the orchestrator for routing decisions—safe to change."

---

## Key Takeaway

The CONTRACT.md file lists ALL sacred formats with exact structure.

If you want to change a sacred format:
1. Increment contract version (1.0 → 1.1)
2. Add parser variant for new version
3. Support both versions during migration (90 days minimum)
4. Update backend to use new parser
5. Update ORCHESTRATOR.md examples

But most of the time, you WON'T need to change these—they're designed to be stable. You'll customize the SAFE things (flows, actions, routing).

---

## Transition

"You've learned what's sacred. Next: what's SAFE to evolve (the good news!)."

Proceed to Module 4.
