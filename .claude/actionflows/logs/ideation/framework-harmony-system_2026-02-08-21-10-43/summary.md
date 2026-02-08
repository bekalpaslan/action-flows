# Ideation Summary: Framework Harmony System

## Idea Description
An onboarding questionnaire for new projects managed by ActionFlows Dashboard, evolved into a three-part Framework Harmony System that ensures the orchestrator and dashboard stay in sync. The system teaches humans the behavioral contract, enforces it at runtime, and auto-detects drift.

## Classification
Framework

## Key Decisions
- Questionnaire **wraps around** bootstrap.md (doesn't replace it)
- Scope expanded to a **4-step system**: Contract → Questionnaire → Detection → Documentation
- The dashboard needs to understand **all** orchestrator output formats
- Contract is both **manually defined** (source of truth) and **auto-validated** against ORCHESTRATOR.md
- The application is a "living model" — humans trigger Claude to evolve it, but guardrails and consistent backend algorithms keep things in harmony

## The Four Steps

### Step 1: Orchestrator Contract (Priority: First)
Formal spec of every output format the orchestrator produces. The dashboard depends on these for visualization:
- Chain compilation tables
- Step completion announcements (`>> Step N complete: ...`)
- Dual output (action + second opinion)
- Registry updates
- Learning surfaces
- Human gates
- Execution start/complete formats

Defines required fields, structure, and parseable patterns. This is the source of truth.

### Step 2: Onboarding Questionnaire (Priority: Second)
Wraps around bootstrap.md and the orchestrator contract. Teaches humans:
- All major behavioral patterns the orchestrator follows
- Which instructions are sensitive/load-bearing for dashboard health
- What formats are sacred (breaking them breaks visualization)
- What's safe to evolve
- Progressive teaching approach with examples

### Step 3: Harmony Detection (Priority: Third)
Backend pattern recognition that detects orchestrator drift from the contract:
- Extends existing partial detection in the backend
- Auto-flags "out of harmony" states
- Dashboard visualizes harmony status
- Agents still appear as visualizations when tasks start (normal usage works regardless)
- Decorative information requires orchestrator cooperation — detection catches when that breaks

### Step 4: Philosophy Documentation (Priority: Fourth)
Embed the harmony concept into:
- Docs
- Prompts
- Agent instructions
- ORCHESTRATOR.md
- Any other relevant places

Elaborate about the structure and philosophy behind this way of working.

## Core Philosophy
This is a **living software** shaped by humans triggering Claude to change things. The Framework Harmony System ensures:
- Guardrails stay in place
- Backend algorithms remain consistent
- Orchestrator output stays parseable
- Dashboard visualization stays accurate
- Out-of-harmony states are auto-detectable
- Evolution is encouraged but within the contract

## Open Questions
- What format should the contract spec use? (JSON schema? Markdown with regex patterns? TypeScript types?)
- How should harmony violations surface? (Dashboard alert? Slack notification? Auto-correction?)
- Should the questionnaire be a flow (ideation-style interactive) or a standalone script?
- How granular should the contract be? (Field-level? Section-level? Message-level?)

## Concrete Next Steps
1. Audit all current orchestrator output formats and catalog them with exact structure
2. Design the contract spec format (likely TypeScript types in `packages/shared/`)
3. Create the contract document with all formats defined
4. Build backend parsing that validates orchestrator output against the contract
5. Design the onboarding questionnaire flow that teaches the contract
6. Add harmony detection to the backend pattern recognition system
7. Update ORCHESTRATOR.md, agent instructions, and docs with the harmony philosophy

## Session Artifacts
- Context inventory: `actionflows/logs/analyze/framework-inventory-for-onboarding-questionnaire_2026-02-08-20-47-50/report.md`
- This summary: `actionflows/logs/ideation/framework-harmony-system_2026-02-08-21-10-43/summary.md`

## Origin
- Brainstorming session: 2026-02-08
- Started as: "onboarding questionnaire"
- Evolved into: Framework Harmony System (4-part)
- Classification: Framework
