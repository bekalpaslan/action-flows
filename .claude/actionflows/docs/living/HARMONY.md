# System Health Monitoring

**Last Updated:** 2026-02-09

The complete 4-component system that keeps orchestrator and dashboard in sync.

> System health is the **immune system** of the ActionFlows framework. Drift between output and parsing is an **evolutionary signal** -- the system trying to grow beyond its current structure. The system health layer detects these signals and triggers healing or evolution, ensuring the system grows safely without breaking sync between the brain's expectations and the agents' outputs.

---

## The Four Components

### 1. Orchestrator Contract
**Location:** `.claude/actionflows/CONTRACT.md`
**Purpose:** Formal specification of all output formats (orchestrator outputs + agent outputs)
**Implementation:** `packages/shared/src/contract/` (types, parsers, patterns, guards)
**Consumed By:** Orchestrator (must produce formats), Agents (review/analyze/brainstorm), Frontend (must parse)

**Key Concept:** If dashboard PARSES it → contract-defined (sacred). If dashboard READS it → not contract-defined (evolve freely).

### 2. Onboarding Questionnaire
**Location:** `.claude/actionflows/flows/framework/onboarding/modules/09-harmony.md`
**Purpose:** Interactive teaching of system health concepts to humans
**Trigger:** Run `onboarding/` flow, complete Advanced level
**Target Audience:** New framework contributors, orchestrator maintainers

### 3. Harmony Detection
**Location:** `packages/backend/src/services/harmonyDetector.ts`
**Purpose:** Automated drift monitoring (real-time parsing validation)
**Types:** `packages/shared/src/harmonyTypes.ts`
**Usage:** Runs automatically on every orchestrator output, broadcasts violations via WebSocket
**Dashboard:** Real-time system health panel shows parsing status

### 4. Conceptual Documentation
**Location:** Embedded across ORCHESTRATOR.md (lines 29-58), agent-standards/instructions.md (lines 48-67), onboarding modules
**Purpose:** Embed system health concept everywhere it belongs
**Cross-References:** This document, CONTRACT.md header, onboarding Module 9

---

## Why This Matters

The contract is meaningless without the full system:
- **Humans** learn via onboarding questionnaire
- **Orchestrator** follows CONTRACT.md output specifications
- **Backend** validates via HarmonyDetector service
- **Dashboard** shows parsing status and system health violations

This is **synchronized evolution** — not rigid specification.

---

## Learn More

- **System Architecture:** See `.claude/actionflows/docs/living/SYSTEM.md` for the layered system architecture
- **Teaching:** Complete `.claude/actionflows/flows/framework/onboarding/` (Module 9)
- **Implementation:** Read `packages/backend/src/services/harmonyDetector.ts`
- **Monitoring:** Check dashboard system health panel (real-time status)
- **Contract:** See `.claude/actionflows/CONTRACT.md` for format specifications
