# Onboarding Questionnaire Design Plan

**Date:** 2026-02-08
**Context:** Framework Harmony System (Step 2: Onboarding Questionnaire)
**Purpose:** Design an interactive teaching document that wraps around bootstrap.md and teaches the orchestrator contract

---

## Executive Summary

The Onboarding Questionnaire is an **interactive flow** that teaches humans the ActionFlows framework through progressive disclosure. It wraps around bootstrap.md (the builder prompt) and CONTRACT.md (the format specifications), teaching both the behavioral contract and what's sacred vs safe to evolve.

**Key Design Principles:**
- Progressive teaching: Beginner → Intermediate → Advanced
- Interactive: Claude asks questions, validates understanding
- Teaching order from inventory: Sacred formats first, then behavioral patterns, then evolution
- One question at a time (per MEMORY.md interaction rules)
- Show before tell: Examples precede explanations
- Built as a flow, not a document
- Completion tracked with certificate/badge

---

## 1. Questionnaire Format

### Location
```
.claude/actionflows/flows/framework/onboarding/
├── instructions.md          # Flow definition (what the orchestrator reads)
├── modules/                 # Teaching content modules
│   ├── 01-welcome.md
│   ├── 02-core-cycle.md
│   ├── 03-sacred-formats.md
│   ├── 04-safe-evolution.md
│   ├── 05-sin-test.md
│   ├── 06-department-routing.md
│   ├── 07-review-pipeline.md
│   ├── 08-contract.md
│   ├── 09-harmony.md
│   └── 10-completion.md
└── templates/
    ├── quick-reference-card.md    # Output template
    └── completion-certificate.md  # Output template
```

### Format Type
**Interactive flow** — not a static document. The orchestrator walks the human through it conversationally.

### Relationship to bootstrap.md
**Wraps around bootstrap.md:**
- Bootstrap creates the framework (builder phase)
- Onboarding teaches the human how to use and evolve it (user phase)
- Bootstrap happens FIRST (optional, if framework doesn't exist yet)
- Onboarding happens SECOND (after bootstrap or when framework already exists)

**Integration point:**
The onboarding flow can optionally call bootstrap if framework doesn't exist:
- Check: Does `.claude/actionflows/` exist?
- No → Offer to bootstrap first → Run bootstrap → Then continue onboarding
- Yes → Framework exists, proceed directly to teaching

---

## 2. Questionnaire Structure

### Module 1: Welcome & Orientation (Beginner, 10 min)

**Location:** `modules/01-welcome.md`

**Claude presents:**
```
Welcome to ActionFlows! I'm going to teach you how this framework works through a series of interactive modules.

This framework has three parts:
1. Orchestrator (coordinator) — Routes requests, compiles chains, spawns agents
2. Dashboard (visualizer) — Shows real-time progress, logs, and quality metrics
3. Contract (harmony bridge) — Keeps orchestrator output and dashboard parsing in sync

We'll go through this in levels:
- Beginner (5 modules, ~45 min) — How to use the framework safely
- Intermediate (4 modules, ~95 min) — How to customize flows and actions
- Advanced (5 modules, ~165 min) — How to evolve the framework itself

You can skip levels if you're already familiar, or go back anytime.

Ready to start?
```

**Human responds:** (Any acknowledgment)

**Claude asks:**
```
First, let me understand your role. Which best describes you?

1. Project manager — I'll be requesting work, approving chains
2. Developer — I'll be customizing flows and adding actions
3. Framework architect — I'll be evolving ActionFlows itself
4. All of the above

This helps me tailor the teaching.
```

**Human responds:** (1-4)

**Claude stores:** `role = {response}` (used to emphasize relevant sections)

**Completion marker:** Module 1 complete → proceed to Module 2

---

### Module 2: The Core Cycle (Beginner, 10 min)

**Location:** `modules/02-core-cycle.md`

**Claude presents:**
```
Let me show you how a request flows through the system.

Example: You say "implement login rate limiting"

Here's what happens:

Phase 1: Compilation
─────────────────────
Orchestrator:
1. Reads routing tables → "implement" = Engineering department
2. Finds matching flow → code-and-review/
3. Builds chain table:

## Chain: Implement login rate limiting

**Request:** Implement login rate limiting
**Source:** code-and-review/

| # | Action | Model | Key Inputs | Waits For | Status |
|---|--------|-------|------------|-----------|--------|
| 1 | code/    | haiku | feature=rate-limiting | -- | Pending |
| 2 | review/  | sonnet | changes from #1 | #1 | Pending |
| 3 | commit/  | haiku | approved changes | #2 | Pending |

**Execution:** Sequential

What each step does:
1. **code/** -- Implements rate limiting middleware and tests
2. **review/** -- Reviews code for security, correctness, and standards
3. **commit/** -- Commits approved changes with conventional commit message

Execute?

Phase 2: Approval
─────────────────
You review this plan. You can:
- Say "Execute" → orchestrator runs all steps
- Say "Add a test step" → orchestrator recompiles with test/
- Say "Cancel" → orchestrator aborts

Phase 3: Execution
──────────────────
After you approve:
- Orchestrator spawns agents for each step
- Progress appears in real-time:
  >> Step 1 complete: code/ -- Implemented rate limiting. Continuing to Step 2...
  >> Step 2 complete: review/ -- APPROVED 95%. Continuing to Step 3...
  >> Step 3 complete: commit/ -- Changes committed (a1b2c3d).

Done!
```

**Claude asks:**
```
Quiz: What happens when you say "Execute"?

A. Orchestrator writes code immediately
B. Orchestrator compiles a more detailed plan
C. Orchestrator spawns agents to run each step
D. Orchestrator asks for more input

(Choose A, B, C, or D)
```

**Expected answer:** C

**Claude validates:**
- If correct: "Exactly! The orchestrator COORDINATES but NEVER produces content. It spawns specialized agents for each step."
- If wrong: "Not quite. The orchestrator is a coordinator, not a worker. It spawns agents to execute each step. The orchestrator itself never writes code or produces content—that's called 'The Sin Test' and we'll cover it soon."

**Claude synthesizes:**
```
This three-phase cycle is the foundation:
1. Compilation → See the plan before work starts
2. Approval → You control what happens
3. Execution → Orchestrator handles it autonomously

The key benefit: You get visibility and control BEFORE work starts, then trust the system to execute correctly.
```

**Completion marker:** Module 2 complete → proceed to Module 3

---

### Module 3: Sacred Formats (Beginner, 15 min)

**Location:** `modules/03-sacred-formats.md`

**Claude presents:**
```
Now for something critical: **sacred formats**.

ActionFlows has TWO types of instructions:

1. Sacred (Don't Touch) — Breaking these breaks the dashboard
2. Safe (Go Ahead) — Change freely, system adapts

Why this distinction?

The dashboard PARSES certain outputs from the orchestrator. If those formats change, parsing breaks and visualization stops working.

Here's the rule:
┌─────────────────────────────────────────┐
│ If the dashboard PARSES it → Sacred    │
│ If the dashboard READS it → Safe       │
└─────────────────────────────────────────┘

Let me show you the sacred formats:
```

**Claude shows (with examples):**

**1. Chain Compilation Table** (P0 - Critical)
```markdown
## Chain: {Title}

| # | Action | Model | Key Inputs | Waits For | Status |
|---|--------|-------|------------|-----------|--------|
| 1 | code/  | haiku | task=X     | --        | Pending |
```
**Why sacred:** Dashboard parses this into ReactFlow nodes. If columns change, visualization breaks.

**2. Step Completion Announcement** (P0 - Critical)
```
>> Step 1 complete: code/ -- Implemented feature X. Continuing to Step 2...
```
**Why sacred:** Dashboard detects ">>" prefix to advance progress bar. If format changes, progress stops updating.

**3. Log Folder Naming** (P0 - Critical)
```
.claude/actionflows/logs/{action-type}/{description}_{YYYY-MM-DD-HH-MM-SS}/
```
**Why sacred:** Dashboard links executions to log folders using this pattern. Breaking it breaks history.

**Claude presents full list:**
```
Sacred Formats (14 total):
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
    ├── ORGANIZATION.md Routing Table
    ├── INDEX.md Table Structure
    └── Contract Version Header

You can see the full specifications in:
.claude/actionflows/CONTRACT.md
```

**Claude asks:**
```
Quiz: Which of these can you safely change?

A. The columns in the chain compilation table
B. The routing triggers in ORGANIZATION.md
C. The >> prefix in step completion announcements
D. The folder naming pattern for logs

(You can choose multiple)
```

**Expected answer:** B only

**Claude validates:**
- If correct: "Perfect! ORGANIZATION.md is a routing configuration—the orchestrator READS it to make decisions. Changing it doesn't break parsing, so it's safe to evolve."
- If wrong: "Close, but remember the rule: If the dashboard PARSES it (extracts structured data), it's sacred. The chain table, >> prefix, and log folder naming are all parsed by the backend. ORGANIZATION.md is just READ by the orchestrator for routing decisions—safe to change."

**Claude synthesizes:**
```
Key takeaway: The CONTRACT.md file lists ALL sacred formats with exact structure.

If you want to change a sacred format:
1. Increment contract version (1.0 → 1.1)
2. Add parser variant for new version
3. Support both versions during migration (90 days minimum)
4. Update backend to use new parser
5. Update ORCHESTRATOR.md examples

But most of the time, you WON'T need to change these—they're designed to be stable. You'll customize the SAFE things (flows, actions, routing).
```

**Completion marker:** Module 3 complete → proceed to Module 4

---

### Module 4: Safe Evolution (Beginner, 10 min)

**Location:** `modules/04-safe-evolution.md`

**Claude presents:**
```
Now the good news: MOST things are safe to evolve!

Here's what you can freely change without breaking anything:
```

**Claude shows examples:**

**1. Adding New Flows**
```markdown
Example: You want a "security-audit/" flow

Steps:
1. Create directory: .claude/actionflows/flows/qa/security-audit/
2. Write instructions.md defining the action sequence
3. Add entry to FLOWS.md:

## QA Department

| Flow | Purpose | Chain |
|------|---------|-------|
| security-audit/ | Comprehensive security review | audit → analyze → report |

Done! Orchestrator reads FLOWS.md at session-start and your flow is available immediately.
```

**2. Adding New Actions**
```markdown
Example: You want a "deploy/" action

Steps:
1. Create directory: .claude/actionflows/actions/deploy/
2. Write agent.md (agent instructions)
3. Write instructions.md (when to use, inputs, dependencies)
4. Add entry to ACTIONS.md

Done! Action can be used in flows or composed into dynamic chains.
```

**3. Modifying Agent Instructions**
```markdown
You can edit any agent.md file to improve instructions.

Guardrails:
✅ Add new steps
✅ Refine project context
✅ Improve error handling
✅ Update examples

❌ Don't remove "Extends" section (agent-standards)
❌ Don't remove "Learnings" output format
❌ Don't remove required inputs

Changes take effect on next agent spawn—no framework update needed.
```

**4. Customizing Routing**
```markdown
Edit ORGANIZATION.md to change how requests route:

| Human Says | Department | Flow/Action |
|------------|-----------|-------------|
| "secure X" | QA        | security-audit/ |

Add triggers, change departments, redirect flows—all safe.
```

**Claude shows complete safe list:**
```
Safe to Evolve (8 categories):
1. Adding/editing flows
2. Adding/editing actions
3. Adding/editing departments
4. Modifying agent instructions (within standards)
5. Editing ORCHESTRATOR.md philosophy sections
6. Customizing project.config.md values
7. Adding custom checklists
8. Extending abstract actions
```

**Claude asks:**
```
Quiz: You want to add a "test-coverage/" flow. What do you do?

A. Edit CONTRACT.md first to define the flow format
B. Create flow directory, write instructions.md, update FLOWS.md
C. Ask Claude to spawn an agent to create the flow
D. Edit ORCHESTRATOR.md to recognize the new flow

(Choose the best answer)
```

**Expected answer:** B

**Claude validates:**
- If correct: "Exactly! Flows are safe to create directly. No contract changes needed, no orchestrator update required. Just create the files and update the registry."
- If wrong: "Not quite. Flows are SAFE evolution—no contract changes needed. You just create the flow directory with instructions.md, then add an entry to FLOWS.md. The orchestrator reads FLOWS.md at session-start, so your flow is available immediately."

**Claude synthesizes:**
```
The framework is designed for easy evolution. Most customization is in the SAFE zone:
- Add flows for your project's workflows
- Add actions for project-specific tasks
- Customize routing for your team's language
- Refine agent instructions based on learnings

The SACRED formats stay stable while everything else evolves freely.
```

**Completion marker:** Module 4 complete → proceed to Module 5

---

### Module 5: The Sin Test (Beginner, 10 min)

**Location:** `modules/05-sin-test.md`

**Claude presents:**
```
Time for the most important rule: The Sin Test

The orchestrator has ONE job: coordinate work.

Before EVERY action, the orchestrator asks itself:

┌──────────────────────────────────────────────────┐
│ Am I about to produce content?                   │
│ (write, analyze, review, code, rewrite, document)│
│                                                  │
│         YES → It's a sin. STOP.                  │
│              Compile a chain. Spawn an agent.    │
│                                                  │
│         NO  → Am I coordinating?                 │
│              (routing, compiling chain,          │
│               updating registry line,            │
│               presenting plan)                   │
│                                                  │
│         YES → Proceed. This is your job.         │
└──────────────────────────────────────────────────┘

Why is this rule absolute?

The orchestrator produces LOW-QUALITY work when it does tasks itself. It's optimized for coordination, not creation. Agents are specialized and produce BETTER output.

Quality difference:
- Orchestrator writes code directly → 70% quality
- Orchestrator spawns code/ agent → 95% quality

The sin test protects quality.
```

**Claude shows examples:**

**Sin Example 1: Writing Code Directly** ❌
```
Human: "Add error handling to login.ts"

BAD Orchestrator Response:
"I'll add try-catch blocks to login.ts..."
[proceeds to edit code directly]

WHY IT'S A SIN: Producing content (writing code)
```

**Correct Response:** ✅
```
GOOD Orchestrator Response:
## Chain: Add error handling to login.ts

| # | Action | Model | Key Inputs | Waits For | Status |
|---|--------|-------|------------|-----------|--------|
| 1 | code/  | haiku | file=login.ts, task=add-error-handling | -- | Pending |

Execute?

WHY IT'S CORRECT: Coordinating (compiling chain, spawning agent)
```

**Sin Example 2: Analyzing Code Directly** ❌
```
Human: "What's the test coverage?"

BAD Orchestrator Response:
"Let me check the test files..."
[reads tests, calculates coverage, writes analysis]

WHY IT'S A SIN: Producing content (analyzing and reporting)
```

**Correct Response:** ✅
```
GOOD Orchestrator Response:
## Chain: Analyze test coverage

| # | Action | Model | Key Inputs | Waits For | Status |
|---|--------|-------|------------|-----------|--------|
| 1 | analyze/ | sonnet | aspect=coverage | -- | Pending |

Execute?

WHY IT'S CORRECT: Coordinating (spawning analyze agent)
```

**Exemptions (Only 2):**

**Exemption 1: Registry Line Edits** ✅
```
Orchestrator CAN directly edit single lines in:
- logs/INDEX.md (execution history)
- logs/LEARNINGS.md (learnings catalog)
- FLOWS.md (flow registry)
- ACTIONS.md (action registry)

Why exempt? These are bookkeeping, not content creation.

Threshold: If change exceeds 5 lines or 1 file → compile chain instead.
```

**Exemption 2: Quick Triage Mode** ✅
```
Solo developer, trivial fix, 1-3 files, obvious change:
Orchestrator CAN implement directly (read, edit, fix)

But MUST still delegate commit to commit/ action.

Why exempt? Full chain compilation is overhead for typo fixes.

Use sparingly. When in doubt → compile chain.
```

**Claude asks:**
```
Quiz: The orchestrator starts writing a detailed analysis report in the conversation. What should you do?

A. Let it finish—it's being helpful
B. Say "it's a sin" to trigger a reset
C. Approve the analysis and ask for changes
D. Ignore it and move on

(Choose the best answer)
```

**Expected answer:** B

**Claude validates:**
- If correct: "Perfect! 'It's a sin' is your reset command. The orchestrator will stop, acknowledge the boundary violation, compile a proper chain with an analyze/ agent, and execute correctly."
- If wrong: "Actually, this is a boundary violation. The orchestrator is producing content (analysis) instead of coordinating. Say 'it's a sin'—this is a reset command. The orchestrator will stop, compile a chain with analyze/, and delegate properly."

**Claude synthesizes:**
```
The Sin Test is the framework's foundation:
- Orchestrator = coordinator (never produces content)
- Agents = specialists (produce high-quality output)

If orchestrator violates this boundary, say "it's a sin" to reset.

Remember: The sin test exists to PROTECT QUALITY. Agents produce better output than the orchestrator because they're specialized.

This is the beginner-level explanation. At the advanced level, you'll learn WHY this boundary is load-bearing for the framework's architecture.
```

**Claude asks:**
```
You've completed the Beginner level! You now know:
✅ The core cycle (compilation → approval → execution)
✅ Sacred formats (don't change these)
✅ Safe evolution (change these freely)
✅ The sin test (orchestrator coordinates, never produces)

Quick reference card: [Link to quick-ref.md]

Ready for Intermediate level, or do you want to:
- Review beginner concepts
- Skip to Advanced
- Take a break and continue later
- Test my understanding with a quiz

What would you like to do?
```

**Human responds:** (Choice)

**Completion marker:** Module 5 complete → Beginner level done → Generate quick reference card → Offer level choice

---

### Module 6: Department Routing (Intermediate, 15 min)

**Location:** `modules/06-department-routing.md`

**Claude presents:**
```
Welcome to Intermediate level!

You've learned to USE the framework safely. Now let's learn to CUSTOMIZE it.

We'll start with department routing—how requests map to flows.
```

**Claude shows structure:**
```
ORGANIZATION.md defines departments and routing:

Departments:
├── Framework — ActionFlows itself (flows, actions, orchestrator)
├── Engineering — Code, features, bug fixes
├── QA — Testing, auditing, quality checks
└── Human — Ideation, decision-making, brainstorming

Routing Table:
| Human Says | Department | Flow/Action |
|------------|-----------|-------------|
| "implement X" | Engineering | code-and-review/ |
| "fix bug X" | Engineering | bug-triage/ |
| "audit security" | QA | audit-and-fix/ |
| "I have an idea" | Human | ideation/ |

This is the FIRST routing decision in the orchestrator's workflow.
```

**Claude walks through example:**
```
Request: "implement rate limiting"

Step 1: Match trigger
─────────────────────
Orchestrator scans routing table:
"implement" → Engineering department

Step 2: Find flow
─────────────────
Orchestrator reads FLOWS.md:

## Engineering Department

| Flow | Purpose | Chain |
|------|---------|-------|
| code-and-review/ | Implement features with quality checks | code → review → commit |
| bug-triage/ | Diagnose and fix bugs | analyze → code → review → commit |

Match: "implement" + "feature" → code-and-review/

Step 3: Build chain
───────────────────
Orchestrator loads code-and-review/ instructions:

Action sequence: code → review → commit
[Builds chain table as you've seen]

Step 4: Present for approval
─────────────────────────────
[Shows chain to human]
```

**Claude teaches customization:**
```
You can customize routing by editing ORGANIZATION.md:

Add new triggers:
| "secure X" | QA | security-audit/ |
| "deploy X" | Engineering | deploy-pipeline/ |

Change department:
| "review docs" | QA | docs-review/ |  (was Engineering)

Add new department:
## DevOps Department
- Owns: Deployment, infrastructure, monitoring
- Triggers: "deploy", "scale", "monitor"
```

**Claude asks:**
```
Practice: You want requests like "check dependencies" to route to a new flow called "dependency-audit/".

What would you add to ORGANIZATION.md?

A. | "check dependencies" | Framework | dependency-audit/ |
B. | "check dependencies" | QA | dependency-audit/ |
C. | "check dependencies" | Engineering | dependency-audit/ |
D. Any of the above, depending on who should own dependency audits

(Choose the best answer)
```

**Expected answer:** D

**Claude validates:**
- If correct: "Exactly! Department choice depends on your team's structure. QA owns auditing in most projects, but Engineering or a DevOps department could own it too. The routing table is YOUR configuration—structure it for your team."
- If wrong: "Good thinking, but there's no single right answer. Department choice depends on your project's organization. QA typically owns audits, but Engineering or DevOps could too. The routing table is flexible—structure it for your team."

**Claude synthesizes:**
```
Department routing is the framework's entry point:
1. Human intent → Routing trigger
2. Routing trigger → Department
3. Department → Flow (or dynamic action composition)

Customize it by editing ORGANIZATION.md. Changes take effect at next session-start (no framework restart needed).
```

**Completion marker:** Module 6 complete → proceed to Module 7

---

### Module 7: The Review Pipeline (Intermediate, 20 min)

**Location:** `modules/07-review-pipeline.md`

**Claude presents:**
```
Now let's talk about quality—how ActionFlows maintains high standards through the review pipeline.

The system has TWO quality layers:
1. Primary review (review/ or audit/ agent)
2. Second opinion (local AI critiques primary review)

Let me show you how this works:
```

**Claude shows example:**
```
Standard code-and-review/ flow:

Without second opinion:
┌─────────┐    ┌────────┐    ┌────────┐
│ code/   │ →  │review/ │ →  │commit/ │
└─────────┘    └────────┘    └────────┘

With second opinion (AUTO-INSERTED):
┌─────────┐    ┌────────┐    ┌──────────────────┐    ┌────────┐
│ code/   │ →  │review/ │ →  │second-opinion/   │    │commit/ │
└─────────┘    └────────┘    └──────────────────┘    └────────┘
                                      │
                                      │ (critiques review)
                                      │
                                      ↓ (doesn't block commit)
```

**Critical rule:**
```
Chain compilation shows:
| # | Action | Waits For |
|---|--------|-----------|
| 1 | code/  | --        |
| 2 | review/ | #1       |
| 3 | second-opinion/ | #2 |
| 4 | commit/ | #2       |  ← Waits for #2 (review), NOT #3 (second-opinion)

Why? Second opinion NEVER blocks workflow. It critiques in parallel, but work continues.
```

**Claude shows dual output:**
```
After steps 2-3 complete, orchestrator presents:

### Dual Output: review/ + Second Opinion

**Original (review/ via Claude Sonnet):**
Verdict: APPROVED
Score: 95%

Summary: Code implements rate limiting correctly. Clean, well-tested, follows conventions.

**Second Opinion (llama3:70b via Ollama):**
Key findings:
- Missed issues: 2 (error message inconsistency, missing edge case test)
- Disagreements: 0
- Notable: Redis connection error handling could be more graceful

**Full reports:**
- Original: `.claude/actionflows/logs/review/rate-limiting_2026-02-08-12-30-45/report.md`
- Critique: `.claude/actionflows/logs/second-opinion/rate-limiting-critique_2026-02-08-12-31-10/critique.md`

Continuing to Step 4...
```

**Why second opinion?**
```
Primary review (Claude) catches 95% of issues.
Second opinion (local LLM) catches what Claude might miss:
- Different perspective
- Different training data
- Different biases

Result: Higher quality, better learning surface for humans.

Cost: ~30 seconds per review (runs locally via Ollama)
```

**Skipping second opinion:**
```
You can suppress when approving chain:
Human: "Execute, skip second opinions"

Orchestrator removes second-opinion/ steps.

Use when:
- Trivial changes
- Time-sensitive fixes
- Ollama not available
```

**Action modes:**
```
Review actions support TWO modes:

1. review-only (default)
   - Assesses code
   - Reports findings
   - Doesn't change code

2. review-and-fix (extended)
   - Assesses code
   - Reports findings
   - FIXES trivial issues (typos, formatting, doc errors)
   - Flags complex issues for human

Orchestrator chooses mode based on fix complexity.

You can override: "Use review-and-fix mode"
```

**Claude asks:**
```
Quiz: You approve a chain with review/ step. What happens with second opinion?

A. Orchestrator asks if you want second opinion
B. Second opinion is auto-inserted and runs after review
C. Second opinion is skipped unless you request it
D. Second opinion blocks commit until critique is done

(Choose the best answer)
```

**Expected answer:** B

**Claude validates:**
- If correct: "Perfect! Second opinion is automatically inserted after review/ and audit/ actions. It runs in parallel with commit (doesn't block). You can suppress with 'skip second opinions' when approving."
- If wrong: "Not quite. Second opinion is AUTO-INSERTED after every review/ or audit/ action. It runs automatically unless you explicitly suppress it ('skip second opinions'). And critically, it NEVER blocks workflow—commit waits for review (#2), not second-opinion (#3)."

**Claude synthesizes:**
```
The review pipeline is ActionFlows' quality mechanism:

Primary review → High-quality baseline (95%)
Second opinion → Catches edge cases (+3-5%)
Dual output → Human sees both perspectives

Result: Better code, better learning, evolving quality standards.

This is why the framework produces high-quality output consistently—multiple perspectives, clear reports, actionable findings.
```

**Completion marker:** Module 7 complete → proceed to Module 8

---

### Module 8: The Contract (Advanced, 30 min)

**Location:** `modules/08-contract.md`

**Claude presents:**
```
Welcome to Advanced level!

You've learned to USE and CUSTOMIZE the framework. Now let's learn to EVOLVE it.

We'll start with the CONTRACT—the harmony mechanism that keeps orchestrator and dashboard in sync.
```

**Claude explains concept:**
```
ActionFlows is "living software"—it evolves through human-triggered Claude sessions. But evolution needs guardrails:

Problem without contract:
┌─────────────┐                    ┌───────────┐
│ Orchestrator│ produces output →  │ Dashboard │
│             │                    │ (parses)  │
└─────────────┘                    └───────────┘
      ↓ (human changes output format)
┌─────────────┐                    ┌───────────┐
│ Orchestrator│ new format →       │ Dashboard │ ❌ Parsing breaks!
│             │                    │           │    Visualization fails.
└─────────────┘                    └───────────┘

Solution with contract:
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

**Claude shows structure:**
```
CONTRACT.md defines EVERY output format the orchestrator produces:

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

Example: Chain Compilation Table (Format 1.1)

Required structure:
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

Required fields:
- Brief Title (string)
- Request (string)
- Source (enum)
- Table columns: #, Action, Model, Key Inputs, Waits For, Status
- Execution (enum)
- Numbered descriptions

TypeScript interface: ChainCompilationParsed
Parser: parseChainCompilation()
```

**Claude teaches format anatomy:**
```
Every contract format has:

1. Structure template (markdown)
   → What the orchestrator produces

2. Required fields (with types)
   → What MUST be present for parsing to succeed

3. TypeScript interface
   → Type-safe representation in code

4. Parser function
   → Converts markdown → TypeScript object

5. Dashboard component
   → Renders the parsed data

All 5 must stay in sync. That's the contract.
```

**Claude shows example parsing:**
```
Orchestrator produces:
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

Backend parses:
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

Dashboard renders:
[ReactFlow nodes with dependencies, progress bar, step cards]
```

**Claude asks:**
```
Quiz: You want to add a new column "Timeout" to the chain table. What do you need to update?

A. CONTRACT.md only
B. CONTRACT.md and ORCHESTRATOR.md
C. CONTRACT.md, TypeScript interface, parser, ORCHESTRATOR.md, dashboard component
D. Just start using it—the dashboard will adapt

(Choose the best answer)
```

**Expected answer:** C

**Claude validates:**
- If correct: "Exactly! The contract requires ALL five parts to stay in sync: structure definition, TypeScript type, parser, ORCHESTRATOR.md example, dashboard component. Miss one and harmony breaks."
- If wrong: "Not quite. Adding a column is a BREAKING change to the contract. You need to update: (1) CONTRACT.md structure, (2) TypeScript interface, (3) parser function, (4) ORCHESTRATOR.md examples, (5) dashboard rendering component. All five must stay in sync or harmony breaks."

**Claude synthesizes:**
```
The contract is ActionFlows' evolution mechanism:
- Defines WHAT the orchestrator produces
- Specifies HOW the dashboard parses it
- Enables COORDINATED evolution (both sides update together)

Without contract: Changes break unpredictably
With contract: Changes are deliberate and synchronized

This is the foundation of "living software"—evolution with guardrails.

You can see all formats in:
.claude/actionflows/CONTRACT.md

Next module: How harmony detection auto-validates the contract.
```

**Completion marker:** Module 8 complete → proceed to Module 9

---

### Module 9: Harmony & The Living Model (Advanced, 25 min)

**Location:** `modules/09-harmony.md`

**Claude presents:**
```
Final advanced topic: Harmony—how the framework detects and maintains sync between orchestrator and dashboard.

Harmony means: Orchestrator output matches contract specification.
```

**Claude explains harmony detection:**
```
How it works:

Step 1: Orchestrator produces output
────────────────────────────────────
## Chain: Fix bug
| # | Action | Model | Waits For | Status |
|---|--------|-------|-----------|--------|
| 1 | code/  | haiku | --        | Pending |

Step 2: Backend tries to parse using contract parser
─────────────────────────────────────────────────────
const parsed = parseChainCompilation(orchestratorOutput);

Step 3: Parser validates structure
───────────────────────────────────
Required fields present? ✅
- Title: "Fix bug" ✅
- Table with columns: #, Action, Model, Waits For, Status ✅
- ... ❌ Missing "Key Inputs" column!

Step 4: Harmony status
───────────────────────
Parse failed → Harmony ❌

Dashboard shows: "Parsing incomplete—some data unavailable"
Backend logs: "Chain compilation validation failed: missing Key Inputs column"

Step 5: Human investigates
──────────────────────────
Was orchestrator wrong? → Update ORCHESTRATOR.md to include column
Was contract outdated? → Update CONTRACT.md to make column optional

After fix:
Parse succeeds → Harmony ✅
```

**Claude shows harmony states:**
```
Three harmony states:

1. In Harmony ✅
   - Orchestrator output matches contract
   - Dashboard parses successfully
   - All features work

2. Out of Harmony ❌
   - Orchestrator output doesn't match contract
   - Dashboard parsing fails (graceful degradation)
   - Some features unavailable

3. Migration (version mismatch) ⚠️
   - Orchestrator uses contract v1.1
   - Dashboard supports v1.0 and v1.1
   - Both versions work during transition
```

**Claude explains living software model:**
```
ActionFlows is LIVING SOFTWARE:

Traditional software:
- Human writes code
- Code is static
- Changes require manual editing
- Bugs accumulate
- Quality degrades over time

Living software:
- Human triggers Claude to evolve the system
- System adapts through agent learnings
- Changes happen via orchestrated chains
- Quality improves over time
- Framework evolves based on usage

The harmony system enables this:
```

**Claude shows evolution workflow:**
```
Scenario: You want to add risk scoring to review reports

Step 1: Define new format in CONTRACT.md
────────────────────────────────────────
### Format 5.4: Review Report with Risk Score

Structure:
## Review Report: {scope}

**Risk Score:** {low | medium | high | critical}

[existing fields...]

Required fields: risk_score (enum)
TypeScript: ReviewReportParsed { riskScore: 'low' | 'medium' | 'high' | 'critical'; ... }

Step 2: Add parser
──────────────────
packages/shared/src/contract/parsers/review.ts:

export function parseReviewReport(markdown: string): ReviewReportParsed {
  // Extract risk score
  const riskMatch = markdown.match(/\*\*Risk Score:\*\* (low|medium|high|critical)/);
  const riskScore = riskMatch?.[1] || 'medium';  // default if missing

  return {
    riskScore,
    // ... existing fields
  };
}

Step 3: Update ORCHESTRATOR.md
───────────────────────────────
Add example showing review/ agents must include risk score.

Step 4: Update dashboard component
───────────────────────────────────
packages/app/src/components/ReviewReportViewer.tsx:

<RiskBadge level={report.riskScore} />

Step 5: Test harmony
────────────────────
Run review/ action → Check parsing succeeds → Verify risk badge renders

Step 6: Increment CONTRACT_VERSION if needed
─────────────────────────────────────────────
If change breaks old parsers:
CONTRACT_VERSION: 1.0 → 1.1

Support both versions for 90 days.

Done! Risk scoring is now part of the framework.
```

**Claude shows what's sacred vs not:**
```
Sacred (contract-defined, harmony-critical):
├── Output formats (chain tables, step announcements, reports)
├── Branded types (SessionId, ChainId, StepId)
├── WebSocket events (discriminated unions)
└── Log folder naming patterns

Not sacred (evolve freely):
├── ORCHESTRATOR.md philosophy sections
├── Agent instructions (within standards)
├── Flow definitions
├── Department routing
└── project.config.md values

The boundary: If the dashboard PARSES it → sacred
                If the dashboard READS it → not sacred
```

**Claude asks:**
```
Quiz: Dashboard shows "parsing incomplete" for a chain compilation. What do you check?

A. Is ORCHESTRATOR.md correct?
B. Did the orchestrator omit required fields from the contract?
C. Is the contract outdated—should it be updated?
D. All of the above

(Choose the best answer)
```

**Expected answer:** D

**Claude validates:**
- If correct: "Perfect! Harmony violations need investigation: Was orchestrator wrong? Was contract outdated? Check both sides, decide which needs updating, make coordinated change."
- If wrong: "Close! Harmony violations require investigating BOTH sides. Check: (1) Did orchestrator omit contract-required fields? (2) Is contract specification outdated? Then decide which side needs updating and make the change. Sometimes orchestrator is wrong, sometimes contract is outdated."

**Claude synthesizes:**
```
Harmony is ActionFlows' evolution guardrail:

Living software = Continuous evolution
Harmony system = Synchronized evolution

The contract keeps orchestrator and dashboard in sync while allowing both to evolve freely.

Key insights:
1. Evolution is encouraged (not prevented)
2. Guardrails ensure changes are deliberate
3. Harmony detection auto-validates sync
4. Human decides what needs updating

This is what makes ActionFlows different from traditional frameworks—it's designed to evolve through use, with built-in mechanisms to prevent drift.
```

**Completion marker:** Module 9 complete → proceed to Module 10

---

### Module 10: Completion (5 min)

**Location:** `modules/10-completion.md`

**Claude presents:**
```
Congratulations! You've completed the ActionFlows onboarding questionnaire.

Here's what you learned:

Beginner Level ✅
├── The core cycle (compilation → approval → execution)
├── Sacred formats (contract-defined, dashboard-parsed)
├── Safe evolution (flows, actions, routing—change freely)
├── The sin test (orchestrator coordinates, never produces)
└── Quick reference card

Intermediate Level ✅
├── Department routing (ORGANIZATION.md)
├── Adding flows and actions
├── Review pipeline (primary + second opinion)
├── Action modes (assess vs assess+fix)
└── Learning surfaces (framework feedback loop)

Advanced Level ✅
├── The contract (harmony bridge)
├── Format anatomy (structure, types, parsers, components)
├── Harmony detection (auto-validation)
├── Living software model (synchronized evolution)
└── What's sacred vs safe (the boundary rule)

You now understand:
✅ How to use ActionFlows safely
✅ How to customize flows and actions
✅ How to evolve the framework without breaking harmony
✅ The philosophy of living software
```

**Claude generates outputs:**
```
Saving completion artifacts:

1. Quick Reference Card
   Location: .claude/actionflows/logs/onboarding/quick-reference_{datetime}.md

   Contains:
   - Sacred formats list
   - Safe evolution checklist
   - The sin test (simple version)
   - Emergency commands ("it's a sin")
   - Common request examples
   - When to compile chains vs quick triage

2. Completion Certificate
   Location: .claude/actionflows/logs/onboarding/completion_{datetime}.md

   Contains:
   - Completion date
   - Modules completed
   - Level achieved (Beginner/Intermediate/Advanced)
   - Next steps
   - Where to get help

3. Registry Update
   Adding entry to logs/INDEX.md:
   | {date} | Onboarding questionnaire | onboarding/ | Completed — {level} level |
```

**Claude offers next steps:**
```
Recommended next steps:

1. Try a simple request
   Example: "I have an idea—add keyboard shortcuts to the dashboard"
   Watch orchestrator compile chain, approve, observe execution

2. Customize routing
   Edit ORGANIZATION.md to add triggers for your team's language

3. Create a custom flow
   Try: "Create a flow called docs-review/ for reviewing documentation"

4. Join the evolution loop
   When agents report learnings, approve the fixes—watch framework improve

5. Read CONTRACT.md
   Browse all formats to see what's defined

Need help?
- Show me examples
- Explain X again
- What if I want to Y?
```

**Claude asks:**
```
Before we finish, what would you like to do?

1. Review a specific module (which one?)
2. Get quiz on key concepts
3. See example of a real request flow
4. Start using ActionFlows immediately
5. Save and exit

What's your choice?
```

**Human responds:** (Choice)

**Completion marker:** Onboarding complete → Save artifacts → Update registry → Done

---

## 3. Interactive Mechanics

### How Each Module Works

**Standard pattern:**
1. **Present** — Show concept with examples
2. **Explain** — 1-2 sentence summary
3. **Demonstrate** — Walk through concrete example
4. **Quiz** — Ask teaching question
5. **Validate** — Check answer, provide feedback
6. **Synthesize** — "Key takeaway: ..." summary

**Conversation flow:**
- Claude presents module content
- Claude asks ONE question
- WAIT for human response (critical—never batch questions)
- Validate answer
- Continue to next concept or next module

**Module completion:**
Each module ends with:
- Summary of what was learned
- Transition to next module
- Option to skip/go back

### Question Design

**Teaching questions (quiz format):**
- Multiple choice (A/B/C/D)
- One correct answer or "best answer"
- Designed to test understanding, not memorization
- Wrong answers reveal common misconceptions

**Expected answers:**
- Stored in module files
- Claude checks human response against expected
- Provides targeted feedback based on what was chosen

**Validation responses:**
- Correct: Reinforce why it's correct
- Incorrect: Gently explain misconception, guide to correct understanding

### Navigation Options

**Skip ahead:**
```
Human: "Skip to Advanced"
Claude: "Understood. Skipping Intermediate level. Starting Module 8: The Contract..."
```

**Go back:**
```
Human: "Go back to sacred formats"
Claude: "Returning to Module 3: Sacred Formats..."
```

**Review:**
```
Human: "Explain the sin test again"
Claude: [Re-presents Module 5 content]
```

**Pause:**
```
Human: "Take a break"
Claude: "Understood. Your progress is saved:
- Completed: Modules 1-7
- Next: Module 8 (The Contract)
- Resume anytime by saying: 'Continue onboarding'"
```

---

## 4. File Structure

### Files to Create

**Flow definition:**
```
.claude/actionflows/flows/framework/onboarding/instructions.md
```
Defines the flow for orchestrator (how to spawn the onboarding action).

**Module content files:**
```
.claude/actionflows/flows/framework/onboarding/modules/
├── 01-welcome.md                 # Module 1 content
├── 02-core-cycle.md              # Module 2 content
├── 03-sacred-formats.md          # Module 3 content
├── 04-safe-evolution.md          # Module 4 content
├── 05-sin-test.md                # Module 5 content
├── 06-department-routing.md      # Module 6 content
├── 07-review-pipeline.md         # Module 7 content
├── 08-contract.md                # Module 8 content
├── 09-harmony.md                 # Module 9 content
└── 10-completion.md              # Module 10 content
```

Each module.md contains:
- Presentation content (what Claude says)
- Examples (code/markdown blocks)
- Quiz questions with expected answers
- Validation responses (correct/incorrect)
- Key takeaways

**Template files:**
```
.claude/actionflows/flows/framework/onboarding/templates/
├── quick-reference-card.md       # Output after Beginner level
└── completion-certificate.md     # Output after completion
```

**Action definition:**
```
.claude/actionflows/actions/onboarding/
├── agent.md              # Agent instructions (how to facilitate onboarding)
└── instructions.md       # Action metadata (when to use, inputs, dependencies)
```

**Output location:**
```
.claude/actionflows/logs/onboarding/{completion}_{YYYY-MM-DD-HH-MM-SS}/
├── quick-reference.md           # Generated after Beginner
├── completion-certificate.md    # Generated at end
└── session-log.md              # Transcript of Q&A
```

---

## 5. Integration with Bootstrap

### Relationship

**Bootstrap (builder phase):**
- Runs FIRST (if framework doesn't exist)
- Agent reads project code
- Agent creates framework structure
- Agent writes ORCHESTRATOR.md, CLAUDE.md, registries, actions, flows
- Output: Working ActionFlows framework

**Onboarding (user phase):**
- Runs SECOND (after bootstrap or when framework exists)
- Agent teaches human how to use framework
- Agent validates understanding through quizzes
- Output: Educated human, quick reference card, completion certificate

### Integration Point

**Onboarding flow checks if framework exists:**

```markdown
# Onboarding Flow

## Step 0: Check Framework Status

Action: Orchestrator-Direct Check

Check: Does `.claude/actionflows/` directory exist?

If NO:
  → Present: "ActionFlows framework not found. Would you like me to bootstrap it first?"
  → Wait for human response
  → If yes: Compile bootstrap chain → Execute → Then continue to Step 1
  → If no: "Onboarding requires ActionFlows framework. Aborting."

If YES:
  → Proceed to Step 1
```

**Bootstrap already mentions onboarding:**

Add to bootstrap.md completion (Step 10):
```
## Step 10: Verify Everything Works

[existing verification steps...]

Finally, recommend onboarding:

The framework is ready. To learn how to use it, I recommend running the onboarding questionnaire:

"I want to learn ActionFlows"

This will guide you through an interactive teaching session covering:
- How to use the framework safely
- How to customize flows and actions
- How to evolve the framework without breaking it
```

### Bootstrap.md Reference

The onboarding modules will reference bootstrap.md in Module 9 (Living Software Model):
```
The bootstrap process is how ActionFlows gets added to a NEW project.

Bootstrap agent:
- Reads project files to discover stack
- Decides which actions/flows/departments are needed
- Creates framework structure
- Writes ORCHESTRATOR.md (orchestration rules for future orchestrator)
- Verifies everything works

Bootstrap is a special case: The agent creating the framework IS a worker.
Once created, the orchestrator using it is a coordinator.

You can see the full bootstrap process in:
.claude/bootstrap.md
```

---

## 6. Registry Updates

### FLOWS.md

Add entry:
```markdown
## Framework Department

| Flow | Purpose | Chain |
|------|---------|-------|
| onboarding/ | Interactive teaching session for ActionFlows | onboarding (single step, foreground) |
```

### ACTIONS.md

Add entry:
```markdown
## Framework Actions

| Action | Purpose | Model | Requires | Gate |
|--------|---------|-------|----------|------|
| onboarding/ | Facilitate interactive onboarding questionnaire | opus | (none) | Yes—human pace |
```

### ORGANIZATION.md

Add routing trigger:
```markdown
| Human Says | Department | Flow/Action |
|------------|-----------|-------------|
| "teach me ActionFlows" | Framework | onboarding/ |
| "I want to learn ActionFlows" | Framework | onboarding/ |
| "explain the framework" | Framework | onboarding/ |
| "onboarding" | Framework | onboarding/ |
```

---

## 7. Implementation Details

### Flow Definition (instructions.md)

**File:** `.claude/actionflows/flows/framework/onboarding/instructions.md`

```markdown
# Onboarding Flow

> Interactive teaching session for ActionFlows framework—progressive disclosure from beginner to advanced.

---

## When to Use

- Human wants to learn ActionFlows
- New team member needs framework training
- Human asks "how does this work?"
- After bootstrap completion (optional but recommended)

---

## Required Inputs From Human

| Input | Description | Example |
|-------|-------------|---------|
| (none) | Flow is self-contained | (onboarding agent asks all questions) |

---

## Action Sequence

### Step 0: Check Framework Status

**Action:** Orchestrator-Direct Check

Check if `.claude/actionflows/` exists:
- YES → Proceed to Step 1
- NO → Offer to bootstrap first → Compile bootstrap chain → Then Step 1

---

### Step 1: Facilitate Onboarding

**Action:** `onboarding/`
**Model:** opus
**Run Mode:** FOREGROUND (human-paced conversation)

**Spawn with:**
```
Read your definition in .claude/actionflows/actions/onboarding/agent.md

IMPORTANT: You are a spawned subagent executor.
Do NOT read .claude/actionflows/ORCHESTRATOR.md — it is not for you.
Do NOT delegate work or compile chains. Execute your agent.md directly.

Project Context:
{inject from project.config.md}

Input:
- (none—agent is self-contained)
```

**Gate:** Human completes all modules or exits early

---

## Dependencies

```
Step 0 → Step 1 (conditional bootstrap chain between them)
```

---

## Chains With

After onboarding, human may want to:
- Try a request → Any flow
- Customize framework → flow-creation/ or action-creation/
- Bootstrap a different project → (run bootstrap.md in that project)
```

---

### Action Definition (agent.md)

**File:** `.claude/actionflows/actions/onboarding/agent.md`

```markdown
# Onboarding Agent

You are the onboarding agent for ActionFlows Dashboard. You facilitate interactive teaching through progressive disclosure.

---

## Extends

This agent follows:
- `_abstract/agent-standards` — Core behavioral principles
- `_abstract/create-log-folder` — Datetime log folder for outputs

When you need to:
- Follow behavioral standards → Read: `.claude/actionflows/actions/_abstract/agent-standards/instructions.md`
- Create log folder → Read: `.claude/actionflows/actions/_abstract/create-log-folder/instructions.md`

---

## Your Mission

Teach humans how to use, customize, and evolve ActionFlows through an interactive questionnaire with three levels:
- Beginner (5 modules, ~45 min)
- Intermediate (4 modules, ~95 min)
- Advanced (5 modules, ~165 min)

Use progressive disclosure: show examples, explain concepts, quiz understanding, validate learning.

---

## Steps to Complete This Action

### 1. Create Log Folder

> **Follow:** `.claude/actionflows/actions/_abstract/create-log-folder/instructions.md`

Create folder: `.claude/actionflows/logs/onboarding/completion_{YYYY-MM-DD-HH-MM-SS}/`

---

### 2. Load Module Content

Read all module files:
- `.claude/actionflows/flows/framework/onboarding/modules/01-welcome.md`
- `.claude/actionflows/flows/framework/onboarding/modules/02-core-cycle.md`
- ... (all 10 modules)

Each module contains:
- Presentation content
- Examples
- Quiz questions
- Expected answers
- Validation responses

---

### 3. Execute Interactive Session

**Critical rule:** ONE QUESTION AT A TIME. Present module content, ask ONE question, WAIT for response, validate, proceed.

**For each module:**

1. **Present** — Show module content (concepts, examples, explanations)
2. **Quiz** — Ask ONE teaching question
3. **Wait** — STOP and wait for human response
4. **Validate** — Check answer against expected, provide feedback
5. **Synthesize** — Key takeaway summary
6. **Transition** — Move to next module or offer navigation

**Navigation commands:**
- "Skip to {level/module}" → Jump ahead
- "Go back to {module}" → Return to previous
- "Review {topic}" → Re-present relevant module
- "Take a break" → Save progress, exit
- "Continue onboarding" → Resume from saved position

**Level completion:**
After Beginner (Module 5): Generate quick reference card
After Intermediate (Module 7): Offer to continue or pause
After Advanced (Module 10): Generate completion certificate

---

### 4. Generate Outputs

**After Beginner level:**
Create: `.claude/actionflows/logs/onboarding/completion_{datetime}/quick-reference.md`

Use template: `.claude/actionflows/flows/framework/onboarding/templates/quick-reference-card.md`

**After completion:**
Create: `.claude/actionflows/logs/onboarding/completion_{datetime}/completion-certificate.md`

Use template: `.claude/actionflows/flows/framework/onboarding/templates/completion-certificate.md`

**Session log:**
Create: `.claude/actionflows/logs/onboarding/completion_{datetime}/session-log.md`

Contains:
- Module progression
- Quiz questions asked
- Human responses
- Validation feedback
- Navigation choices

---

### 5. Update Registry

Add entry to `logs/INDEX.md`:
```
| {YYYY-MM-DD} | ActionFlows onboarding | onboarding/ | Completed — {level} level |
```

---

## Project Context

- **Project:** ActionFlows Dashboard monorepo
- **Framework:** Living software—evolves through use
- **Teaching approach:** Progressive disclosure, show-before-tell, interactive validation
- **Foreground execution:** Human-paced conversation, no timeout pressure
- **One question at a time:** Critical interaction rule (per MEMORY.md)

---

## Constraints

### DO
- Present examples before explanations
- Ask ONE question at a time, WAIT for response
- Validate understanding through quizzes
- Provide targeted feedback (different for correct vs incorrect)
- Offer navigation options (skip, back, review, pause)
- Be conversational and encouraging
- Track progress and save state

### DO NOT
- Batch multiple questions together
- Rush through modules
- Skip validation steps
- Assume understanding without testing
- Use overly technical jargon (match level to audience)
- Implement code or make framework changes
- Read ORCHESTRATOR.md (you're a spawned subagent)

---

## Learnings Output

**Your completion message to the orchestrator MUST include:**

```
## Learnings

**Issue:** {What happened}
**Root Cause:** {Why}
**Suggestion:** {How to prevent}

[FRESH EYE] {Any discoveries outside your explicit instructions}

Or: None — execution proceeded as expected.
```
```

---

### Action Metadata (instructions.md)

**File:** `.claude/actionflows/actions/onboarding/instructions.md`

```markdown
# Onboarding Action

> Facilitate interactive teaching session for ActionFlows framework.

---

## When to Use

- Human requests onboarding, training, or teaching
- New team member needs framework education
- After bootstrap completion (recommended)
- Human asks "how does this work?"

---

## Required Inputs

| Input | Description | Example |
|-------|-------------|---------|
| (none) | Action is self-contained | (agent asks all questions interactively) |

---

## Model Selection

**Model:** opus
**Reason:** Teaching requires high-quality explanations, adaptive responses, and patient interaction.

---

## Run Mode

**Foreground only** — Never spawned with `run_in_background=True`

This is a human-paced conversation. Agent waits for responses at each step.

---

## Output

```
.claude/actionflows/logs/onboarding/completion_{YYYY-MM-DD-HH-MM-SS}/
├── quick-reference.md          # After Beginner level
├── completion-certificate.md   # After full completion
└── session-log.md              # Transcript
```

---

## Dependencies

- Requires: `.claude/actionflows/flows/framework/onboarding/modules/` (all module files)
- Reads: `CONTRACT.md`, `bootstrap.md`, `ORCHESTRATOR.md` (to teach about them)
- Does NOT require: Any other actions (self-contained)

---

## Chains With

After onboarding, human may:
- Request work → Any flow
- Create custom flow → flow-creation/
- Create custom action → action-creation/
```

---

### Module Content Files

**Example:** `.claude/actionflows/flows/framework/onboarding/modules/03-sacred-formats.md`

```markdown
# Module 3: Sacred Formats

**Level:** Beginner
**Duration:** ~15 min
**Prerequisites:** Modules 1-2

---

## Presentation

Now for something critical: **sacred formats**.

ActionFlows has TWO types of instructions:

1. Sacred (Don't Touch) — Breaking these breaks the dashboard
2. Safe (Go Ahead) — Change freely, system adapts

Why this distinction?

The dashboard PARSES certain outputs from the orchestrator. If those formats change, parsing breaks and visualization stops working.

Here's the rule:
┌─────────────────────────────────────────┐
│ If the dashboard PARSES it → Sacred    │
│ If the dashboard READS it → Safe       │
└─────────────────────────────────────────┘

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
    ├── ORGANIZATION.md Routing Table
    ├── INDEX.md Table Structure
    └── Contract Version Header

You can see the full specifications in:
.claude/actionflows/CONTRACT.md

---

## Quiz

**Question:** Which of these can you safely change?

A. The columns in the chain compilation table
B. The routing triggers in ORGANIZATION.md
C. The >> prefix in step completion announcements
D. The folder naming pattern for logs

(You can choose multiple)

---

## Expected Answer

**Correct:** B only

---

## Validation Responses

### If Correct
"Perfect! ORGANIZATION.md is a routing configuration—the orchestrator READS it to make decisions. Changing it doesn't break parsing, so it's safe to evolve."

### If Wrong
"Close, but remember the rule: If the dashboard PARSES it (extracts structured data), it's sacred. The chain table, >> prefix, and log folder naming are all parsed by the backend. ORGANIZATION.md is just READ by the orchestrator for routing decisions—safe to change."

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
```

**All 10 modules follow this structure:**
- Presentation (what Claude says)
- Examples (with formatting)
- Quiz (teaching question)
- Expected answer
- Validation responses (correct/incorrect)
- Key takeaway
- Transition

---

### Template Files

**Quick Reference Card:** `.claude/actionflows/flows/framework/onboarding/templates/quick-reference-card.md`

```markdown
# ActionFlows Quick Reference Card

**Generated:** {YYYY-MM-DD}
**For:** {Human name if provided, otherwise "ActionFlows User"}
**Level:** Beginner

---

## Sacred vs Safe

### Sacred (Don't Touch)
If the dashboard PARSES it → Sacred

**Critical formats:**
- Chain Compilation Table (columns: #, Action, Model, Key Inputs, Waits For, Status)
- Step Completion Announcement (`>> Step N complete: action/ -- result. Continuing...`)
- Log Folder Naming (`.claude/actionflows/logs/{action}/{desc}_{datetime}/`)

**See full list:** `.claude/actionflows/CONTRACT.md`

### Safe (Change Freely)
If the dashboard READS it → Safe

**Change freely:**
- Add/edit flows (FLOWS.md)
- Add/edit actions (agent.md, instructions.md)
- Customize routing (ORGANIZATION.md)
- Modify agent instructions (within standards)
- Update project config (project.config.md)

---

## The Sin Test (Simple Version)

**Rule:** Orchestrator coordinates, never produces content.

**If orchestrator starts writing code, analysis, or documentation:**
Say: "It's a sin"

**Orchestrator will:**
1. Stop
2. Acknowledge boundary
3. Compile proper chain
4. Spawn specialized agent

**Why:** Agents produce higher quality (95%) than orchestrator doing work itself (70%).

---

## Common Request Examples

### Request a Feature
```
Human: "Implement login rate limiting"

Orchestrator:
- Reads routing: "implement" → Engineering → code-and-review/
- Compiles chain: code → review → commit
- Presents for approval
- You: "Execute"
- Orchestrator spawns agents
```

### Fix a Bug
```
Human: "Fix validation error in auth.ts"

Orchestrator:
- Routing: "fix" → Engineering → bug-triage/
- Compiles chain: analyze → code → review → commit
- Presents for approval
```

### Audit Code
```
Human: "Audit security of API routes"

Orchestrator:
- Routing: "audit" → QA → audit-and-fix/
- Compiles chain: audit → remediate (if critical) → report
- Presents for approval
```

---

## Emergency Commands

| Command | What It Does |
|---------|-------------|
| "It's a sin" | Reset orchestrator boundary violation |
| "Cancel" | Abort current chain |
| "Skip second opinions" | Suppress second-opinion steps |
| "Show me the chain again" | Re-display chain compilation |
| "Go back" | Return to previous decision point |

---

## When to Compile Chains vs Quick Triage

### Compile Full Chain (delegate)
- 4+ files affected
- Requires analysis or design
- Cross-package changes
- Any uncertainty

### Quick Triage (orchestrator may handle)
- 1-3 files affected
- Obvious, mechanical fix
- Single package
- 100% confident

**When in doubt → Compile chain**

---

## Where to Get Help

- Show examples: "Show me an example of X"
- Explain again: "Explain {topic} again"
- Review onboarding: "Review sacred formats"
- Read docs: `.claude/actionflows/CONTRACT.md`, `ORCHESTRATOR.md`, `ORGANIZATION.md`

---

## Next Steps

1. Try a request: "I have an idea—{your idea}"
2. Customize routing: Edit ORGANIZATION.md
3. Create a flow: "Create a flow called {flow-name}/"
4. Join evolution loop: Approve agent learnings

---

**Completed:** Beginner Level
**Next:** Intermediate Level (department routing, review pipeline, action modes)
**Resume anytime:** "Continue onboarding to Intermediate"
```

---

**Completion Certificate:** `.claude/actionflows/flows/framework/onboarding/templates/completion-certificate.md`

```markdown
# ActionFlows Onboarding Completion Certificate

**Recipient:** {Human name if provided, otherwise "ActionFlows User"}
**Completion Date:** {YYYY-MM-DD}
**Level Achieved:** {Beginner | Intermediate | Advanced}
**Session Duration:** {calculated from log}

---

## Modules Completed

### Beginner Level ✅
- [x] Module 1: Welcome & Orientation
- [x] Module 2: The Core Cycle
- [x] Module 3: Sacred Formats
- [x] Module 4: Safe Evolution
- [x] Module 5: The Sin Test

### Intermediate Level ✅
- [x] Module 6: Department Routing
- [x] Module 7: The Review Pipeline
- [x] Module 8: Learning Surfaces
- [x] Module 9: Action Modes

### Advanced Level ✅
- [x] Module 10: The Contract
- [x] Module 11: Harmony Detection
- [x] Module 12: Living Software Model
- [x] Module 13: Format Evolution
- [x] Module 14: Bootstrap Process

---

## You Now Understand

✅ How to use ActionFlows safely
✅ How to customize flows and actions
✅ How to evolve the framework without breaking harmony
✅ The philosophy of living software
✅ What's sacred vs what's safe
✅ The sin test and orchestrator boundaries
✅ Department routing and flow composition
✅ Review pipeline and second opinions
✅ Contract-based harmony system

---

## Generated Artifacts

- **Quick Reference Card:** `.claude/actionflows/logs/onboarding/completion_{datetime}/quick-reference.md`
- **Session Log:** `.claude/actionflows/logs/onboarding/completion_{datetime}/session-log.md`
- **This Certificate:** `.claude/actionflows/logs/onboarding/completion_{datetime}/completion-certificate.md`

---

## Recommended Next Steps

1. **Try a real request**
   Example: "I have an idea—{your idea}"
   Watch the orchestrator compile chain, approve, observe execution

2. **Customize for your project**
   - Edit ORGANIZATION.md (add routing triggers)
   - Create custom flow (for your team's workflow)
   - Add project-specific action

3. **Join the evolution loop**
   - When agents report learnings, approve fixes
   - Watch framework improve based on usage
   - Contribute to living software model

4. **Explore the contract**
   - Read: `.claude/actionflows/CONTRACT.md`
   - Browse all format specifications
   - Understand harmony boundaries

5. **Bootstrap another project** (if relevant)
   - Copy bootstrap.md to new project
   - Run bootstrap agent
   - Run onboarding there

---

## Support

**Need help?**
- Show examples: "Show me an example of X"
- Explain concepts: "Explain {topic} again"
- Review modules: "Review {module name}"
- Read docs: CONTRACT.md, ORCHESTRATOR.md, ORGANIZATION.md

**Found a bug or have feedback?**
- Report learnings through the framework
- Orchestrator will surface for improvement

---

**Congratulations on completing ActionFlows onboarding!**

You're now equipped to use, customize, and evolve this living software system.

---

**Session:** {session-id}
**Framework Version:** {contract-version}
**Generated by:** ActionFlows onboarding/ action
```

---

## 8. Summary

This plan provides everything needed to implement the onboarding questionnaire:

### What Gets Created (File Paths)

**1. Flow structure:**
- `.claude/actionflows/flows/framework/onboarding/instructions.md`
- `.claude/actionflows/flows/framework/onboarding/modules/01-welcome.md`
- `.claude/actionflows/flows/framework/onboarding/modules/02-core-cycle.md`
- `.claude/actionflows/flows/framework/onboarding/modules/03-sacred-formats.md`
- `.claude/actionflows/flows/framework/onboarding/modules/04-safe-evolution.md`
- `.claude/actionflows/flows/framework/onboarding/modules/05-sin-test.md`
- `.claude/actionflows/flows/framework/onboarding/modules/06-department-routing.md`
- `.claude/actionflows/flows/framework/onboarding/modules/07-review-pipeline.md`
- `.claude/actionflows/flows/framework/onboarding/modules/08-contract.md`
- `.claude/actionflows/flows/framework/onboarding/modules/09-harmony.md`
- `.claude/actionflows/flows/framework/onboarding/modules/10-completion.md`

**2. Templates:**
- `.claude/actionflows/flows/framework/onboarding/templates/quick-reference-card.md`
- `.claude/actionflows/flows/framework/onboarding/templates/completion-certificate.md`

**3. Action:**
- `.claude/actionflows/actions/onboarding/agent.md`
- `.claude/actionflows/actions/onboarding/instructions.md`

**4. Registry updates:**
- Add entry to `.claude/actionflows/FLOWS.md`
- Add entry to `.claude/actionflows/ACTIONS.md`
- Add routing triggers to `.claude/actionflows/ORGANIZATION.md`

### Key Design Features

1. **Progressive disclosure:** Beginner → Intermediate → Advanced
2. **Interactive validation:** Quiz questions test understanding
3. **One question at a time:** Critical interaction rule (MEMORY.md)
4. **Show before tell:** Examples precede explanations
5. **Navigation flexibility:** Skip, back, review, pause
6. **Graceful outputs:** Quick reference card, completion certificate
7. **Integration with bootstrap:** Optional bootstrap-first workflow
8. **Living software teaching:** Framework as evolving system

### Teaching Order

**Beginner (45 min):** Use safely
**Intermediate (95 min):** Customize flows/actions
**Advanced (165 min):** Evolve framework

Total: ~5 hours for full completion (can pause/resume)

---

**Plan complete. Ready for implementation by code/ agent.**
