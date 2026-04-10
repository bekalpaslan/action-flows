# Framework Health Flow

> Validate framework structure and catch drift.

---

## Approach

CONTRACT.md is the **root law** of the framework. Every framework file — every action, flow, template, and document — is derived from it. The creation hierarchy is:

```
CONTRACT.md (the law — defines what outputs must be)
    ↓
TEMPLATE.*.md (the blueprint — structural pattern to follow)
    ↓
agent.md / instructions.md (the instance — derived from above)
```

This flow doesn't just check "are files present?" or "do sections exist?" — it validates that the framework is **in accordance with the contract**. A file can have every section and still be non-conformant if it wasn't derived from CONTRACT.md. The contract is what makes an output parseable, a format sacred, and a structure load-bearing.

Every analysis step in this flow traces back to this hierarchy. Registry drift means the map diverged from the territory. Cross-reference failures mean components point to laws that don't exist. Template non-conformance means an instance wasn't derived from its blueprint — which means it wasn't derived from the contract.

---

## When to Use

- Periodic health check (recommended: after every 5-10 chain executions)
- After bulk framework changes
- When orchestrator suspects structural inconsistencies

---

## Required Inputs From Human

| Input | Description | Example |
|-------|-------------|---------|
| *(none)* | Autonomous — no inputs required | — |

---

## Action Sequence

### Step 1: Registry ↔ Disk Drift

**Action:** `.claude/actionflows/actions/analyze/`
**Model:** sonnet

**Spawn:**
```
Read your definition in .claude/actionflows/actions/analyze/agent.md

Input:
- aspect: drift
- scope: .claude/actionflows/
- context: Verify structure matches registries. Check: every action in ACTIONS.md has agent.md + instructions.md on disk; every flow in FLOWS.md has instructions.md on disk; no stale entries; no orphan directories; CONTEXTS.md contexts match flow directory structure.
```

**Gate:** Drift report delivered with pass/fail for registry-to-disk consistency checks.

---

### Step 2: Cross-Reference Integrity

**Action:** `.claude/actionflows/actions/analyze/`
**Model:** sonnet

**Spawn:**
```
Read your definition in .claude/actionflows/actions/analyze/agent.md

Input:
- aspect: cross-references
- scope: .claude/actionflows/
- context: Validate all references between framework components. Check: flows→actions refs resolve (FLOWS.md action paths exist in ACTIONS.md); actions→contract format numbers resolve (format specs exist in CONTRACT.md); actions→routing metadata entries exist (every action in ACTIONS.md has an entry in ROUTING_METADATA.md); routing rules→contexts exist (context names in ROUTING_RULES.md match CONTEXTS.md definitions); context example flows→flow registry resolve (example flows listed in CONTEXTS.md exist in FLOWS.md).
```

**Gate:** Cross-reference report delivered with pass/fail per reference type (flows→actions, actions→contracts, actions→routing metadata, routing rules→contexts, context examples→flows).

---

### Step 3: Contract Derivation Conformance

**Action:** `.claude/actionflows/actions/analyze/`
**Model:** sonnet

**Spawn:**
```
Read your definition in .claude/actionflows/actions/analyze/agent.md

Input:
- aspect: contract-derivation
- scope: .claude/actionflows/actions/
- context: CONTRACT.md is the root law. TEMPLATE.agent.md is the blueprint derived from it. Every agent.md is an instance derived from the blueprint. Validate this derivation chain. First read CONTRACT.md to understand the format specs and output standards. Then read TEMPLATE.agent.md to know the required structure. Then check every agent.md file under actions/ for: (1) required sections present (Extends, Your Mission, Input Contract, Output Contract, Trace Contract, Steps to Complete This Action, Project Context, Constraints, Learnings Output); (2) Extends section references valid abstracts that exist on disk in _abstract/; (3) Input/Output/Trace Contracts are present and non-empty; (4) Trace Contract includes logging requirements table; (5) Output Contract references a valid contract format number that exists in CONTRACT.md — the agent must know which law governs its output.
```

**Gate:** Contract derivation report delivered with pass/fail per agent.md file, tracing conformance back through the hierarchy: CONTRACT.md → TEMPLATE → instance.

---

### Step 4: Spawn Block Structure Lint

**Action:** `.claude/actionflows/actions/analyze/`
**Model:** sonnet

**Spawn:**
```
Read your definition in .claude/actionflows/actions/analyze/agent.md

Input:
- aspect: spawn-block-lint
- scope: .claude/actionflows/flows/**/instructions.md
- context: For every instructions.md file under flows/, scan for all lines that match the pattern "**Spawn" (the spawn block header marker). For EACH individual `**Spawn` marker found, scan forward from that marker to the next blank line OR closing triple-backtick fence, and verify the string "Read your definition in" appears within that region. A spawn block that contains `**Spawn` but whose forward-scan region does not contain "Read your definition in" is an under-provisioned spawn block. Record each non-compliant spawn block as a separate violation with the file path AND the line number of the offending `**Spawn` marker. A file with two spawn blocks where one is compliant and one is not produces one violation record (not a clean bill). Emit a clean bill only if every individual spawn block in every file is compliant.
- notes: Current detection covers `**Spawn with:**`, `**Spawn after N:**`, and similar `**Spawn` prefixed variants. Alternative markers (e.g., `**Execute:**`, `**Run:**`) are NOT detected by this lint. If a new marker convention is introduced in flows, update the pattern here.
```

**Gate:** Lint report delivered listing any under-provisioned spawn block files, or confirming zero violations.

---

## Dependencies

```
┌─────────────────────────────────┐
│  Parallel Group 1               │
│  (all run together)             │
├─────────────────────────────────┤
│  Step 1: Registry Drift         │
│  Step 2: Cross-Refs             │
│  Step 3: Derivation             │
│  Step 4: Spawn Block Lint       │
└─────────────────────────────────┘
```

**Parallel groups:** Steps 1, 2, 3, and 4 are independent and run in parallel.

---

## Chains With

- ← Any flow can trigger this as a follow-up
- → `action-creation/` if missing action definitions found (Step 1)
- → `action-deletion/` if stale action entries found (Step 1)
- → Manual remediation for cross-reference failures (Step 2):
  - Missing contract format specs → add to CONTRACT.md
  - Dangling action references → update FLOWS.md or register missing actions
  - Missing routing metadata → add entries to ROUTING_METADATA.md
- → Manual remediation for contract derivation failures (Step 3):
  - Missing sections → update agent.md files using TEMPLATE.agent.md as blueprint
  - Invalid abstract references → fix Extends sections or create missing abstracts
  - Empty contracts → populate Input/Output/Trace Contract sections
  - Missing/invalid format number → ensure Output Contract references a valid CONTRACT.md format
