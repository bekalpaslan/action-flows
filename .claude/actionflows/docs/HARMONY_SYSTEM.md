# Framework Harmony System

**Last Updated:** 2026-02-09

The complete 4-component system that keeps orchestrator and dashboard in sync.

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
**Purpose:** Interactive teaching of harmony concepts to humans
**Trigger:** Run `onboarding/` flow, complete Advanced level
**Target Audience:** New framework contributors, orchestrator maintainers

### 3. Harmony Detection
**Location:** `packages/backend/src/services/harmonyDetector.ts`
**Purpose:** Automated drift monitoring (real-time parsing validation)
**Types:** `packages/shared/src/harmonyTypes.ts`
**Usage:** Runs automatically on every orchestrator output, broadcasts violations via WebSocket
**Dashboard:** Real-time harmony panel shows parsing status

### 4. Philosophy Documentation
**Location:** Embedded across ORCHESTRATOR.md (lines 29-58), agent-standards/instructions.md (lines 48-67), onboarding modules
**Purpose:** Embed harmony concept everywhere it belongs
**Cross-References:** This document, CONTRACT.md header, onboarding Module 9

---

## Why This Matters

The contract is meaningless without the full system:
- **Humans** learn via onboarding questionnaire
- **Orchestrator** follows CONTRACT.md output specifications
- **Backend** validates via HarmonyDetector service
- **Dashboard** shows parsing status and harmony violations

This is **synchronized evolution** — not rigid specification.

---

## Learn More

- **System Architecture:** See `.claude/actionflows/docs/LIVING_SYSTEM.md` for the 7-layer living system architecture
- **Teaching:** Complete `.claude/actionflows/flows/framework/onboarding/` (Module 9)
- **Implementation:** Read `packages/backend/src/services/harmonyDetector.ts`
- **Monitoring:** Check dashboard harmony panel (real-time status)
- **Contract:** See `.claude/actionflows/CONTRACT.md` for format specifications
