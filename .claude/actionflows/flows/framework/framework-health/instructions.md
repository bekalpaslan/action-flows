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

## Dependencies

```
┌─────────────────────────┐
│  Parallel Group 1       │
│  (all run together)     │
├─────────────────────────┤
│  Step 1: Registry Drift │
│  Step 2: Cross-Refs     │
│  Step 3: Derivation     │
└─────────────────────────┘
```

**Parallel groups:** Steps 1, 2, and 3 are independent and run in parallel.

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
