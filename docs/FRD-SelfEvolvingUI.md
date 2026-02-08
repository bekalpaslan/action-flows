# Functional Requirements Document (FRD)
## Self-Evolving Interface — ActionFlows Dashboard

**Document Version:** 1.0
**Date:** 2026-02-08
**Author:** Agent (Planning)
**Status:** Complete
**Audience:** Product Owners, Developers, Architects, UX Designers

---

## Executive Summary

The **Self-Evolving Interface** is a new feature area for the ActionFlows Dashboard that enables the dashboard to learn from operator behavior and progressively adapt its own UI, framework behaviors, and backend logic. Rather than requiring manual customization, the system observes conversation patterns, tracks action frequencies, accepts explicit user bookmarks, and proposes interface modifications through a controlled self-modification pipeline.

The system spans four interconnected feature areas: an inline **Button System** for contextual actions on Claude responses, a **Pattern Detection Engine** that analyzes user behavior to surface automation opportunities, a **Registry Model** for managing blessed behaviors as composable packs, and a **Self-Modification Pipeline** that enables full-stack changes (UI, framework, backend) with tiered approval and git-native versioning.

---

## 1. Executive Summary

### Vision

The ActionFlows Dashboard currently provides monitoring and control for AI agent orchestration. The Self-Evolving Interface extends this by making the dashboard itself an adaptive system: it watches how operators interact, detects repeated patterns, and proposes interface modifications that reduce friction. Over time, the dashboard evolves from a generic monitoring tool into a personalized command center tailored to each project and operator.

### Status

**Draft -- Not Yet Implemented**

This document specifies a greenfield feature area. No components, types, or endpoints exist yet. The Button System is designated as the first prototype target.

### Key Metrics (Planned)

- **New Shared Types:** ~25 type definitions (button definitions, pattern records, registry entries, modification proposals)
- **New Backend Endpoints:** ~15 endpoints across 4 route modules (buttons, patterns, registry, modifications)
- **New Frontend Components:** ~12 components (button toolbar, star bookmark, pattern dashboard, approval dialog, modification diff viewer)
- **New WebSocket Events:** ~8 event types (pattern detected, button added, modification proposed, approval result)
- **New Hooks:** ~6 custom hooks (useButtons, usePatterns, useRegistry, useModificationPipeline)

### Primary Use Cases

1. **Contextual Actions:** Operator sees inline action buttons on Claude responses (e.g., "Run tests", "Apply fix", "Retry with different model") and clicks to execute immediately
2. **Toolbar Shortcuts:** Frequently used actions appear as persistent toolbar buttons, learned from operator behavior
3. **Explicit Bookmarking:** Operator stars a Claude response; system asks "Why are you starring this?" and feeds the answer into the pattern engine
4. **Pattern Surfacing:** System detects that operator always runs tests after code changes, proposes an auto-test button
5. **Behavior Pack Installation:** Operator browses a registry of community-contributed behavior packs (e.g., "Code Review Shortcuts", "Deployment Pipeline") and installs them
6. **Self-Modification:** System proposes adding a new sidebar panel based on detected usage patterns; operator reviews the diff, approves, and the change auto-applies
7. **Project Customization:** Per-project behaviors override global defaults; operator can publish project customizations back to the registry as a behavior pack

---

## 2. Project Overview

### What is the Self-Evolving Interface?

A system that enables the ActionFlows Dashboard to observe operator behavior, detect patterns, and propose interface modifications. It closes the feedback loop between human usage and dashboard capabilities, making the tool progressively smarter.

### Why It Exists

- **Without Self-Evolving Interface:** Operators repeatedly perform the same multi-step actions; the dashboard remains static regardless of usage patterns; customization requires manual configuration or code changes
- **With Self-Evolving Interface:** The dashboard learns which actions are frequent, surfaces shortcuts automatically, and can modify its own UI/framework/backend through an approval pipeline

### Who Uses It

1. **Orchestrator Operators:** Primary users who benefit from learned shortcuts and contextual buttons
2. **Developers:** Install behavior packs, review proposed modifications, customize per-project behaviors
3. **Community Contributors:** Author and publish behavior packs to the registry

### Core Capabilities

- Inline contextual buttons rendered on Claude response messages
- Persistent toolbar of learned shortcut actions
- Conversation analysis for action frequency tracking
- Explicit bookmark system with intent capture ("why did you star this?")
- Central registry of blessed behaviors (core + community packs)
- Per-project customization layer with publish-back capability
- Full-stack self-modification pipeline (UI + Framework + Backend)
- Tiered approval system (minor UI changes auto-apply, major changes require confirmation)
- Git-native versioning of all modifications

---

## 3. Feature Philosophy

> **Cross-reference:** See parent [FRD.md](./FRD.md) Section 3 (Framework Philosophy) for the delegation model context that this feature area extends.

### 3.1 Progressive Autonomy

The Self-Evolving Interface follows a **progressive autonomy** model. Initial interactions are fully manual (operator clicks buttons). Over time, the system proposes automations based on observed patterns. The operator always retains veto power through the tiered approval system.

**Autonomy Progression:**
1. **Manual:** Operator discovers and clicks contextual buttons
2. **Suggested:** System surfaces "You do this often -- add a shortcut?" prompts
3. **Semi-Automatic:** Minor UI tweaks (button placement, toolbar order) auto-apply
4. **Supervised Automatic:** Major modifications (new components, backend changes) proposed with diff review

### 3.2 Safety-First Modification

All self-modifications are:
- **Reversible:** Every change creates a git commit; operator can revert
- **Scoped:** Changes target specific files; blast radius is bounded
- **Tiered:** Severity determines approval threshold
- **Auditable:** Full history of what changed, why, and who approved

### 3.3 Registry as Source of Truth

The behavior registry serves as the canonical list of what the system can do. Modifications that pass approval are registered; unregistered behaviors cannot execute. This prevents drift between what the system "knows" it can do and what it actually does.

### 3.4 Relationship to ActionFlows Framework

The Self-Evolving Interface builds on top of the existing ActionFlows orchestration model:
- **Buttons** map to ActionFlows commands (pause, resume, retry) and custom quick actions
- **Patterns** align with the framework's flow/chain model (detecting repeated flow usage)
- **Registry** extends the existing action registry (`ACTIONS.md`) into a runtime-accessible data model
- **Self-Modification** uses the existing `code-and-review/` flow for implementing proposed changes

---

## 4. User Personas & Stories

### Persona 1: Power Operator

**Role:** Daily user of the ActionFlows Dashboard for orchestrating AI workflows
**Technical Level:** Expert (familiar with ActionFlows framework, Claude, and the codebase)
**Primary Tools:** Dashboard sessions, terminal, quick action bar

**User Stories:**
- "As a power operator, I want inline action buttons on Claude responses so I can execute follow-up actions without typing commands"
- "As a power operator, I want a persistent toolbar of my most-used actions so I can access them from any screen"
- "As a power operator, I want to star interesting Claude responses and explain why, so the system learns what I find valuable"
- "As a power operator, I want the system to detect my repeated patterns and propose shortcuts so I work more efficiently"

**Key Workflows:**
1. Read Claude response -> Click inline "Run tests" button -> See test results in terminal
2. Star a response -> System asks "Why?" -> Type "Good refactoring pattern" -> Pattern engine records intent
3. Notice toolbar suggestion -> Review proposed shortcut -> Approve -> Button appears in toolbar

### Persona 2: Project Customizer

**Role:** Developer who configures dashboard behavior per project
**Technical Level:** Advanced (understands behavior packs and registry model)
**Primary Tools:** Registry browser, behavior pack editor, project settings

**User Stories:**
- "As a project customizer, I want to install community behavior packs so I get project-type-specific shortcuts"
- "As a project customizer, I want to override global behaviors for my project without affecting other projects"
- "As a project customizer, I want to publish my project customizations as a behavior pack so others can use them"
- "As a project customizer, I want to see which behaviors are active in my project and where they came from (core, pack, custom)"

**Key Workflows:**
1. Open registry browser -> Search "React testing" -> Install pack -> See new buttons appear
2. Customize a behavior -> Mark as project-specific -> Test -> Publish to registry
3. Review active behaviors -> See origin labels (core/pack/project) -> Disable unwanted ones

### Persona 3: Modification Reviewer

**Role:** Reviews and approves proposed self-modifications
**Technical Level:** Advanced (can read diffs, understands component architecture)
**Primary Tools:** Modification proposal viewer, diff viewer, approval dialog

**User Stories:**
- "As a reviewer, I want to see a clear diff of proposed changes before they apply"
- "As a reviewer, I want to understand WHY a modification is being proposed (what pattern triggered it)"
- "As a reviewer, I want auto-applied minor changes to be logged so I can review them retroactively"
- "As a reviewer, I want to reject a proposal and explain why, so the pattern engine learns from my feedback"

**Key Workflows:**
1. Receive modification notification -> Open diff viewer -> Review changes -> Approve/Reject
2. Browse modification history -> See auto-applied changes -> Revert if unwanted
3. Reject proposal with reason -> Pattern engine adjusts -> Future proposals are more relevant

---

## 5. Functional Areas

### 5.1 Button System

**Priority:** HIGH -- First prototype target
**Packages Affected:** Shared (types), Backend (endpoints), Frontend (components, hooks)

#### 5.1.1 Inline Contextual Buttons

**Purpose:** Render action buttons directly on Claude response messages in the conversation panel.

**Functional Requirements:**

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| BTN-01 | Render inline buttons on Claude response messages | HIGH | TODO |
| BTN-02 | Button definitions include: label, icon, action type, payload | HIGH | TODO |
| BTN-03 | Buttons are context-sensitive (different buttons for code responses vs. error responses vs. analysis responses) | HIGH | TODO |
| BTN-04 | Clicking a button executes the associated action (command, API call, or quick action) | HIGH | TODO |
| BTN-05 | Button state reflects action result (loading, success, error) | MEDIUM | TODO |
| BTN-06 | Custom button definitions can be registered by behavior packs | MEDIUM | TODO |
| BTN-07 | Buttons support keyboard shortcuts (e.g., Ctrl+1 for first button) | LOW | TODO |

**Context Detection Rules:**

| Response Type | Detected By | Suggested Buttons |
|--------------|------------|-------------------|
| Code block with changes | Regex for code fences + file paths | "Apply", "Run Tests", "Review" |
| Error message | Keywords: error, failed, exception, stack trace | "Retry", "Skip", "Debug" |
| Analysis/report | Keywords: analysis, summary, recommendation | "Bookmark", "Apply Recommendations" |
| Question/prompt | Question mark, "should I", "do you want" | "Yes", "No", "Explain More" |
| File modification | File path references + "created", "modified" | "Open File", "Show Diff", "Revert" |

**Key Features:**
- Buttons render as a horizontal row below each Claude response
- Context detection runs on response content to determine which buttons to show
- Actions map to existing command system (`PauseCommand`, `RetryCommand`, etc.) or custom handlers
- Button click state provides visual feedback (spinner while executing, checkmark on success)

**Gaps (to be addressed in implementation):**
- No existing component for inline message actions in `ConversationPanel.tsx`
- Context detection logic does not exist; needs new utility module
- Button action routing needs to integrate with existing command queue and quick action system

#### 5.1.2 Persistent Toolbar

**Purpose:** A toolbar of learned shortcuts that persists across sessions and screens.

**Functional Requirements:**

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| TBR-01 | Display a persistent toolbar of shortcut buttons | HIGH | TODO |
| TBR-02 | Toolbar buttons are learned from action frequency (most-used actions get toolbar slots) | HIGH | TODO |
| TBR-03 | Operator can manually pin/unpin buttons to toolbar | HIGH | TODO |
| TBR-04 | Toolbar displays at most 8-12 buttons (configurable) | MEDIUM | TODO |
| TBR-05 | Toolbar order reflects usage frequency (most-used first) | MEDIUM | TODO |
| TBR-06 | Toolbar persists across sessions (stored in project config or user preferences) | HIGH | TODO |
| TBR-07 | Toolbar supports drag-and-drop reordering | LOW | TODO |
| TBR-08 | Toolbar buttons show usage count badge (optional, configurable) | LOW | TODO |

**Key Features:**
- A new `PersistentToolbar.tsx` component provides the persistent toolbar of learned shortcuts
- Toolbar state persisted via backend API (project-level or user-level storage)
- Frequency tracking feeds from pattern detection engine
- Manual pin/unpin gives operator direct control

**Relationship to Existing Components:**
- `QuickActionBar.tsx` is **session-scoped** (embedded in each session tile, tied to `SessionId` and `SessionLifecycleState`). It is not a standalone toolbar.
- The persistent toolbar is a **new component** (`PersistentToolbar.tsx`) that lives outside the session grid and is project-scoped
- `PersistentToolbar.tsx` may reuse `QuickActionButton.tsx` styling and rendering patterns
- `QuickActionSettings.tsx` provides configuration UI that may be extended for persistent toolbar settings
- The persistent toolbar extends the learned/frequency-based ordering concept independent of session lifecycle

---

### 5.2 Pattern Detection Engine

**Priority:** HIGH -- Required for toolbar learning and modification proposals
**Packages Affected:** Shared (types), Backend (services, endpoints), Frontend (hooks, components)

#### 5.2.1 Conversation Analysis

**Functional Requirements:**

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| PAT-01 | Analyze conversation messages to detect repeated action sequences | HIGH | TODO |
| PAT-02 | Track action frequency per session, per project, and globally | HIGH | TODO |
| PAT-03 | Detect "trigger-response" patterns (e.g., after every code change, operator runs tests) | HIGH | TODO |
| PAT-04 | Confidence scoring for detected patterns (frequency, recency, consistency) | MEDIUM | TODO |
| PAT-05 | Pattern decay: reduce confidence for patterns not seen recently | MEDIUM | TODO |
| PAT-06 | Pattern categories: workflow patterns, preference patterns, error recovery patterns | MEDIUM | TODO |

**Pattern Types:**

| Pattern Type | Description | Example | Detection Method |
|-------------|-------------|---------|-----------------|
| **Frequency** | Action executed often | "Run tests" clicked 15 times today | Count threshold |
| **Sequence** | Actions always follow each other | Code change -> test -> review | Markov chain / n-gram |
| **Temporal** | Actions at specific times/intervals | Deploy every Friday afternoon | Time-series analysis |
| **Error Recovery** | Actions taken after specific errors | Test failure -> retry with --verbose | Error-action correlation |
| **Preference** | Consistent choices from options | Always chooses "sonnet" over "haiku" for reviews | Choice tracking |

#### 5.2.2 Action Frequency Tracking

**Functional Requirements:**

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FRQ-01 | Track every button click, command execution, and quick action with timestamp | HIGH | TODO |
| FRQ-02 | Aggregate frequencies by action type, time window, project, and user | HIGH | TODO |
| FRQ-03 | Provide API endpoints for querying frequency data | MEDIUM | TODO |
| FRQ-04 | Expose frequency data to frontend for toolbar ordering and pattern visualization | MEDIUM | TODO |
| FRQ-05 | Retain frequency data for configurable duration (default 90 days) | LOW | TODO |

#### 5.2.3 Explicit Bookmarks (Star System)

**Functional Requirements:**

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| STR-01 | Display a star icon on every Claude response message | HIGH | TODO |
| STR-02 | Clicking star opens a dialog: "Why are you starring this?" | HIGH | TODO |
| STR-03 | User's explanation is stored alongside the response content | HIGH | TODO |
| STR-04 | Starred items are tagged and indexed for pattern engine consumption | HIGH | TODO |
| STR-05 | Starred items can be browsed, filtered, and searched | MEDIUM | TODO |
| STR-06 | Star data feeds pattern detection (starred responses inform what user values) | MEDIUM | TODO |
| STR-07 | Export starred items as a collection (for sharing or review) | LOW | TODO |

**Star Dialog Flow:**
1. Operator clicks star icon on a Claude response
2. Dialog appears: "Why are you starring this?" with category selector and free-text field
3. Categories: "Useful pattern", "Good output", "Want to automate", "Reference material", "Other"
4. Operator types explanation and selects category
5. System stores: response content, timestamp, category, explanation, session context
6. Pattern engine ingests the bookmark and adjusts its models

---

### 5.3 Registry Model

**Priority:** MEDIUM -- Required for behavior pack management and self-modification scoping
**Packages Affected:** Shared (types), Backend (storage, endpoints), Frontend (browser component)

#### 5.3.1 Central Registry of Blessed Behaviors

**Functional Requirements:**

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| REG-01 | Maintain a central registry of all registered behaviors (buttons, patterns, modifications) | HIGH | TODO |
| REG-02 | Registry entries have: id, name, description, type, source (core/pack/project), version, status (active/inactive) | HIGH | TODO |
| REG-03 | Core framework behaviors are pre-registered and cannot be deleted (only disabled) | HIGH | TODO |
| REG-04 | Registry supports CRUD operations via API | HIGH | TODO |
| REG-05 | Registry entries are versioned (semver) | MEDIUM | TODO |
| REG-06 | Registry changes are broadcast via WebSocket events | MEDIUM | TODO |

**Registry Entry Types:**

| Entry Type | Description | Example |
|-----------|-------------|---------|
| `button` | A button definition (inline or toolbar) | "Run Tests" button with test command payload |
| `pattern` | A detected or defined behavior pattern | "After code change, run tests" sequence |
| `modifier` | A self-modification template | "Add sidebar panel for test results" |
| `pack` | A collection of related entries | "React Development Pack" with 10 buttons + 3 patterns |

#### 5.3.2 Behavior Packs

**Functional Requirements:**

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| BPK-01 | Define behavior packs as collections of registry entries | HIGH | TODO |
| BPK-02 | Packs have metadata: name, description, author, version, compatibility, tags | HIGH | TODO |
| BPK-03 | Install/uninstall packs with dependency resolution | HIGH | TODO |
| BPK-04 | Packs can declare dependencies on other packs or core behaviors | MEDIUM | TODO |
| BPK-05 | Pack conflicts (two packs define same button ID) are detected and surfaced | MEDIUM | TODO |
| BPK-06 | Community packs are fetched from a remote registry (Phase 2) | LOW | TODO |

#### 5.3.3 Per-Project Customizations

**Functional Requirements:**

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| PPC-01 | Override any registry entry at the project level | HIGH | TODO |
| PPC-02 | Project overrides take precedence over global/pack entries | HIGH | TODO |
| PPC-03 | Merge strategy: project additions append to pack entries; project overrides replace | MEDIUM | TODO |
| PPC-04 | Publish project customizations back to registry as a new behavior pack | MEDIUM | TODO |
| PPC-05 | View layer resolution: show where each active behavior comes from (core -> pack -> project) | MEDIUM | TODO |
| PPC-06 | Reset project customizations to pack/global defaults | LOW | TODO |

**Layer Resolution Order:**
```
1. Core Framework (built-in, non-deletable)
   ↓ overridden by
2. Behavior Packs (installed collections)
   ↓ overridden by
3. Project Customizations (per-project overrides)
```

---

### 5.4 Self-Modification Pipeline

**Priority:** MEDIUM -- Requires pattern detection and registry as prerequisites
**Packages Affected:** All packages (modifications can target any package)

#### 5.4.1 Modification Proposal Generation

**Functional Requirements:**

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| MOD-01 | Pattern engine generates modification proposals when confidence exceeds threshold | HIGH | TODO |
| MOD-02 | Proposals include: title, description, rationale (which pattern triggered it), affected files, diff preview | HIGH | TODO |
| MOD-03 | Proposals are categorized by tier: minor (UI-only), moderate (UI + config), major (backend/framework changes) | HIGH | TODO |
| MOD-04 | Proposals target specific files with concrete changes (not abstract suggestions) | MEDIUM | TODO |
| MOD-05 | Proposals can be generated manually by operator ("I want to add a button for X") | MEDIUM | TODO |

#### 5.4.2 Tiered Approval System

**Functional Requirements:**

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| APR-01 | Minor modifications (CSS changes, button reorder, toolbar adjustment) auto-apply with notification | HIGH | TODO |
| APR-02 | Moderate modifications (new component, config change) require single approval | HIGH | TODO |
| APR-03 | Major modifications (backend route, shared type change, framework update) require explicit review with diff | HIGH | TODO |
| APR-04 | Approval dialog shows: what changes, why, which files, full diff | HIGH | TODO |
| APR-05 | Rejection includes reason field; reason feeds back to pattern engine | MEDIUM | TODO |
| APR-06 | Auto-applied changes are logged and reviewable retroactively | MEDIUM | TODO |
| APR-07 | Approval thresholds are configurable per project | LOW | TODO |

**Tier Definitions:**

| Tier | Scope | Examples | Approval |
|------|-------|---------|----------|
| **Minor** | UI-only, no logic changes | Button position, toolbar order, CSS tweak | Auto-apply + notification |
| **Moderate** | UI + configuration | New button component, quick action preset, theme change | Single approval click |
| **Major** | Backend, shared types, framework | New API endpoint, type definition, framework behavior | Full diff review + explicit approval |

#### 5.4.3 Full-Stack Modification Execution

**Functional Requirements:**

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| EXE-01 | Execute approved modifications across any package (shared, backend, frontend) | HIGH | TODO |
| EXE-02 | Modifications are atomic: either all files change or none do | HIGH | TODO |
| EXE-03 | Each modification creates a git commit with descriptive message | HIGH | TODO |
| EXE-04 | Modifications are applied via the existing code-and-review flow when complexity warrants | MEDIUM | TODO |
| EXE-05 | Post-modification validation: type-check, lint, test (configurable) | MEDIUM | TODO |
| EXE-06 | Failed modifications are automatically rolled back | MEDIUM | TODO |
| EXE-07 | Modification history is browsable with ability to revert any past change | MEDIUM | TODO |

#### 5.4.4 Git-Native Versioning

**Functional Requirements:**

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| GIT-01 | Every modification creates a git commit on a dedicated branch (e.g., `self-evolve/{modification-id}`) | HIGH | TODO |
| GIT-02 | Commit message includes modification metadata (tier, source pattern, approval status) | HIGH | TODO |
| GIT-03 | Operator can revert any self-modification via git (cherry-pick revert) | HIGH | TODO |
| GIT-04 | Modification branches can be reviewed as PRs before merging to main | MEDIUM | TODO |
| GIT-05 | Batch modifications are grouped into a single branch/commit | LOW | TODO |

---

## 6. Feature Catalog

### Complete Feature Matrix

| Feature | Component/Module | Package | Status | Notes |
|---------|------------------|---------|--------|-------|
| **Button System** | | | | |
| Inline contextual buttons | InlineButtons.tsx (new) | Frontend | TODO | Renders on Claude responses |
| Button context detection | buttonContextDetector.ts (new) | Frontend | TODO | Regex + keyword analysis |
| Button definition types | buttonTypes.ts (new) | Shared | TODO | ButtonDefinition, ButtonAction |
| Button click handler | useButtonActions.ts (new) | Frontend | TODO | Routes to command/API/quick action |
| Button state management | useButtonState.ts (new) | Frontend | TODO | Loading, success, error states |
| Persistent toolbar | PersistentToolbar.tsx (new) | Frontend | TODO | New project-scoped toolbar with learned buttons |
| Toolbar frequency ordering | toolbarOrdering.ts (new) | Frontend | TODO | Sort by usage frequency |
| Toolbar pin/unpin | PersistentToolbar.tsx (new) | Frontend | TODO | Manual toolbar control |
| Toolbar persistence API | routes/toolbar.ts (new) | Backend | TODO | Store/retrieve toolbar state |
| **Pattern Detection** | | | | |
| Conversation analyzer | patternAnalyzer.ts (new) | Backend | TODO | NLP-lite conversation scanning |
| Action frequency tracker | frequencyTracker.ts (new) | Backend | TODO | Per-action, per-project counts |
| Sequence detector | sequenceDetector.ts (new) | Backend | TODO | N-gram action sequence matching |
| Pattern confidence scorer | confidenceScorer.ts (new) | Backend | TODO | Frequency + recency + consistency |
| Pattern storage | storage (extend) | Backend | TODO | Extend Storage interface |
| Pattern API endpoints | routes/patterns.ts (new) | Backend | TODO | CRUD + query patterns |
| Pattern WebSocket events | events.ts (extend) | Shared | TODO | PatternDetectedEvent, etc. |
| Star bookmark UI | StarBookmark.tsx (new) | Frontend | TODO | Star icon + dialog |
| Star bookmark API | routes/bookmarks.ts (new) | Backend | TODO | Store/query bookmarks |
| Pattern dashboard | PatternDashboard.tsx (new) | Frontend | TODO | Visualize detected patterns |
| **Registry Model** | | | | |
| Registry types | registryTypes.ts (new) | Shared | TODO | RegistryEntry, BehaviorPack |
| Registry storage | registryStorage.ts (new) | Backend | TODO | File-based + optional Redis |
| Registry API endpoints | routes/registry.ts (new) | Backend | TODO | CRUD + install/uninstall packs |
| Registry browser UI | RegistryBrowser.tsx (new) | Frontend | TODO | Browse, search, install packs |
| Layer resolution engine | layerResolver.ts (new) | Backend | TODO | Core -> Pack -> Project merge |
| Pack definition format | packFormat.ts (new) | Shared | TODO | Pack schema and validation |
| Project customization UI | ProjectBehaviors.tsx (new) | Frontend | TODO | Per-project override management |
| **Self-Modification Pipeline** | | | | |
| Modification proposal types | modificationTypes.ts (new) | Shared | TODO | Proposal, Tier, Approval |
| Proposal generator | proposalGenerator.ts (new) | Backend | TODO | Pattern -> concrete file changes |
| Approval flow API | routes/modifications.ts (new) | Backend | TODO | Submit, approve, reject, revert |
| Approval dialog UI | ApprovalDialog.tsx (new) | Frontend | TODO | Diff view + approve/reject |
| Modification executor | modificationExecutor.ts (new) | Backend | TODO | Apply changes atomically |
| Git integration | gitIntegration.ts (new) | Backend | TODO | Branch, commit, revert |
| Modification history UI | ModificationHistory.tsx (new) | Frontend | TODO | Browse + revert past changes |
| Rollback service | rollbackService.ts (new) | Backend | TODO | Automated rollback on failure |
| Post-modification validator | modificationValidator.ts (new) | Backend | TODO | Type-check, lint, test |

**Legend:** TODO -- Not yet implemented

---

## 7. Improvement Backlog

### HIGH PRIORITY

#### 1. Button System Prototype
- **Scope:** Inline buttons on Claude responses + persistent toolbar extension
- **Effort:** 3-4 weeks (includes ConversationPanel upgrade prerequisite)
- **Impact:** Immediate UX improvement; reduces clicks and typing for common actions
- **Details:**
  - Define `ButtonDefinition` and `ButtonAction` types in shared package
  - Implement context detection utility for classifying Claude responses
  - Create `InlineButtons` component rendering below `ConversationPanel` messages
  - Extend `QuickActionBar` with frequency-based ordering
  - Add toolbar state persistence endpoint to backend

#### 2. Action Frequency Tracking
- **Scope:** Backend service + storage extension + API
- **Effort:** 1-2 weeks
- **Impact:** Foundation for all pattern detection; enables toolbar learning
- **Details:**
  - Track button clicks, command executions, quick action triggers
  - Store frequency data in existing storage layer (Memory/Redis)
  - Expose query API for frontend consumption
  - Aggregate by action type, project, user, time window

#### 3. Star Bookmark System
- **Scope:** Frontend component + backend storage + API
- **Effort:** 1-2 weeks
- **Impact:** Explicit user signal for pattern engine; rich training data
- **Details:**
  - Star icon on Claude responses in `ConversationPanel`
  - "Why are you starring?" dialog with categories
  - Backend storage and retrieval API
  - Integration with pattern detection engine

### MEDIUM PRIORITY

#### 4. Pattern Detection Engine Core
- **Scope:** Backend analysis services + confidence scoring
- **Effort:** 3-4 weeks
- **Impact:** Enables automated shortcut suggestions and modification proposals
- **Details:**
  - Conversation analysis for repeated action sequences
  - N-gram sequence detection
  - Confidence scoring with frequency, recency, consistency weights
  - Pattern decay for stale patterns

#### 5. Registry Model Foundation
- **Scope:** Types + storage + CRUD API + browser UI
- **Effort:** 2-3 weeks
- **Impact:** Enables behavior pack ecosystem and self-modification scoping
- **Details:**
  - Define registry entry types and behavior pack format
  - Implement file-based registry storage with optional Redis
  - CRUD API endpoints
  - Frontend browser component with search and install

#### 6. Self-Modification Pipeline (Minor Tier)
- **Scope:** Auto-apply for UI-only changes + notification
- **Effort:** 2 weeks
- **Impact:** First end-to-end self-modification capability
- **Details:**
  - Proposal generation from pattern engine output
  - Minor tier auto-apply (CSS, button order, toolbar changes)
  - Notification system for auto-applied changes
  - Retroactive review UI

### LOW PRIORITY

#### 7. Behavior Pack Ecosystem
- **Scope:** Pack authoring, publishing, remote registry
- **Effort:** 4-6 weeks
- **Impact:** Community-driven extensibility
- **Details:**
  - Pack definition format and validation
  - Pack publishing workflow
  - Remote registry integration (Phase 2)
  - Dependency resolution

#### 8. Full-Stack Self-Modification (Major Tier)
- **Scope:** Backend/shared type modifications with full approval flow
- **Effort:** 4-6 weeks
- **Impact:** Complete self-evolution capability
- **Details:**
  - Git branch creation per modification
  - Full diff review in approval dialog
  - Post-modification validation (type-check, lint, test)
  - Automated rollback on failure
  - Integration with code-and-review flow

#### 9. Pattern Visualization Dashboard
- **Scope:** Dedicated dashboard screen for pattern insights
- **Effort:** 2-3 weeks
- **Impact:** Operator visibility into what the system has learned
- **Details:**
  - Action frequency charts
  - Detected sequence visualizations
  - Confidence score trends
  - Bookmark collection browser

#### 10. Multi-User Pattern Sharing
- **Scope:** Cross-user pattern aggregation and sharing
- **Effort:** 2-3 weeks
- **Impact:** Team-wide learning from individual operator behavior
- **Details:**
  - Aggregate patterns across users for same project
  - Share learned shortcuts within team
  - Privacy controls for individual vs. shared patterns

---

## 8. Non-Functional Requirements Preview

*Detailed specifications in SRD-SelfEvolvingUI.md; summary here:*

### Performance
- **Pattern detection latency:** < 500ms for conversation analysis (background process, non-blocking)
- **Button rendering:** < 50ms to detect context and render buttons on a new message
- **Registry query:** < 100ms for local registry lookups
- **Modification execution:** < 30s for minor tier; < 5min for major tier (includes validation)

### Security
- **Modification scoping:** Self-modifications cannot access system paths or files outside project directory
- **Approval enforcement:** Major modifications always require explicit human approval; no bypass
- **Registry integrity:** Core behaviors are immutable; pack installations are validated
- **Git safety:** Modifications never force-push or modify main branch directly

### Scalability
- **Pattern storage:** Configurable retention (default 90 days) with automatic cleanup
- **Registry size:** Supports 1000+ entries with indexed search
- **Frequency data:** Aggregated to prevent unbounded growth

### Reliability
- **Modification atomicity:** All-or-nothing application; rollback on partial failure
- **Pattern engine isolation:** Pattern detection failure does not affect core dashboard functionality
- **Registry corruption recovery:** Rebuild from git history if registry file is corrupted

---

## 9. Glossary

### Self-Evolving Interface Terms

**Inline Button:** An action button rendered directly on a Claude response message in the conversation panel. Context-sensitive based on response content.

**Persistent Toolbar:** A fixed toolbar of shortcut buttons that persists across sessions. Populated by learned actions and manual pins.

**Pattern:** A detected behavioral regularity in operator actions. Characterized by type (frequency, sequence, temporal, error recovery, preference) and confidence score.

**Confidence Score:** A 0.0-1.0 metric indicating how certain the system is that a detected pattern is genuine. Incorporates frequency, recency, and consistency.

**Star Bookmark:** An explicit operator signal on a Claude response. Includes category and explanation text that feeds the pattern detection engine.

**Behavior Pack:** A collection of related registry entries (buttons, patterns, modifiers) that can be installed as a unit. Has metadata: name, author, version, tags.

**Registry Entry:** A single registered behavior in the central registry. Has an ID, type, source (core/pack/project), version, and active/inactive status.

**Layer Resolution:** The process of merging behaviors from core, installed packs, and project customizations. Project overrides take highest precedence.

**Modification Proposal:** A concrete suggestion for changing dashboard code, generated by the pattern engine or manually by the operator. Includes affected files, diff preview, and tier classification.

**Modification Tier:** Classification of a proposed modification by impact scope: minor (UI-only, auto-apply), moderate (UI + config, single approval), major (any backend/shared change, full review).

**Self-Modification:** The act of the dashboard changing its own source code through the modification pipeline. Always versioned via git and subject to tiered approval.

---

## Appendix: Status Legend

**Status Markers Used Throughout:**

- TODO -- Feature planned but not yet implemented (entire document)

Note: Since the Self-Evolving Interface is a greenfield feature area, all items are marked TODO. Status markers will be updated as implementation progresses.

---

**Document Generated:** 2026-02-08
**Analysis Sources:** Existing FRD.md (ActionFlows Dashboard), codebase analysis, feature requirements specification
**Next Phase:** SRD-SelfEvolvingUI.md (Software Requirements Document) with detailed technical specifications
