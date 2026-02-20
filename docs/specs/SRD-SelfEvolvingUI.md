# Self-Evolving Interface -- Software Requirements Document (SRD)

**Version:** 1.0 (Complete Specification)
**Date:** 2026-02-08
**Status:** Ready for Implementation
**Audience:** Architects, Developers, DevOps Engineers, Technical Leads

This SRD provides the technical architecture, implementation patterns, cross-cutting concerns, implementation sequence, and risk assessment for the Self-Evolving Interface feature area of the ActionFlows Dashboard. The design spans four architectural layers: **Button Rendering** (inline + toolbar), **Pattern Detection** (analysis + frequency + bookmarks), **Registry Sync** (central registry + behavior packs + layer resolution), and **Self-Modification Pipeline** (proposal + approval + execution + versioning).

**Key Metrics:**
- ~15 new API endpoints across 4 route modules
- ~12 new frontend components with ~6 custom hooks
- ~25 new shared type definitions
- ~8 new WebSocket event types
- 29-step implementation sequence (4 phases, ~13 weeks)

---

## EXECUTIVE SUMMARY

The Self-Evolving Interface adds adaptive capabilities to the ActionFlows Dashboard, enabling the system to learn from operator behavior and propose interface modifications. This SRD specifies the technical design across four layers:

**Living Universe Integration:**

The Self-Evolving Interface is the dashboard's **adaptive layer** within the larger Living Universe. Where the core system evolves through memory and learning (Layer 0), the Self-Evolving Interface evolves the **human-facing surface** through pattern detection and self-modification.

**Co-evolution at the UI Layer:**

- **Human behavior** = signal that the interface is or isn't well-suited to the workflow
- **Pattern detection** = the brain observing the signal
- **Interface proposals** = the brain suggesting how to reshape the UI (the physics of the interface)
- **Approved modifications** = the hands actually transforming the interface

This is the UI as a living organism: it watches, learns, and adapts to your workflow. Your journey through the universe shapes the interface itself.

**Layer 1: Button Rendering System**
- Inline contextual buttons on Claude responses (context detection, action routing)
- Persistent toolbar with learned shortcuts (frequency ordering, pin/unpin, persistence)
- Integration with existing `QuickActionBar`, `ConversationPanel`, and command system

**Layer 2: Pattern Detection Engine**
- Conversation analysis service (message classification, action sequence tracking)
- Frequency tracker (per-action counts, time windows, aggregation)
- Bookmark system (star icon, intent capture dialog, pattern engine feed)
- Confidence scoring (frequency + recency + consistency weighted formula)

**Layer 3: Registry & Behavior Pack Sync**
- Central registry storage (file-based + Redis, versioned entries)
- Behavior pack format (JSON schema, dependency declaration, install/uninstall)
- Layer resolution (core -> pack -> project precedence merge)
- WebSocket broadcast of registry changes

**Layer 4: Self-Modification Pipeline**
- Proposal generation (pattern -> concrete file changes with diff)
- Tiered approval (minor auto-apply, moderate single-click, major full-review)
- Atomic execution (all-or-nothing file writes, post-modification validation)
- Git-native versioning (branch per modification, commit metadata, revert support)

---

## SECTION 1: ARCHITECTURE OVERVIEW

### 1.1 System Structure

```
packages/
├── shared/src/
│   ├── selfEvolvingTypes.ts    # Common types: LayerSource, BehaviorPackId (avoids circular deps)
│   ├── buttonTypes.ts          # ButtonDefinition, ButtonAction, ButtonContext
│   ├── patternTypes.ts         # Pattern, PatternType, ConfidenceScore, Bookmark, PatternAction
│   ├── registryTypes.ts        # RegistryEntry, BehaviorPack
│   ├── modificationTypes.ts    # ModificationProposal, ModificationTier, ApprovalStatus, ModifierAction
│   └── events.ts               # (extend) 8 new event types (all extend BaseEvent)
│   # NOTE: All shared imports use .js extensions per ES module convention
│   # (e.g., import { X } from './types.js', import { Y } from './buttonTypes.js')
│
├── backend/src/
│   ├── routes/
│   │   ├── toolbar.ts          # Toolbar state CRUD (3 endpoints)
│   │   ├── patterns.ts         # Pattern query + bookmark CRUD (5 endpoints)
│   │   ├── registry.ts         # Registry CRUD + pack install (4 endpoints)
│   │   └── modifications.ts    # Proposal submit/approve/reject/revert (3 endpoints)
│   ├── services/
│   │   ├── patternAnalyzer.ts  # Conversation analysis + sequence detection
│   │   ├── frequencyTracker.ts # Action frequency counting + aggregation
│   │   ├── confidenceScorer.ts # Pattern confidence calculation
│   │   ├── registryStorage.ts  # File-based registry persistence
│   │   ├── layerResolver.ts    # Core -> Pack -> Project merge
│   │   ├── proposalGenerator.ts # Pattern -> modification proposal
│   │   ├── modificationExecutor.ts # Atomic file modification
│   │   ├── gitIntegration.ts   # Branch, commit, revert operations
│   │   └── rollbackService.ts  # Failure recovery
│   └── storage/
│       └── (extend)            # Add pattern + frequency + bookmark storage methods
│
├── app/src/
│   ├── components/
│   │   ├── PersistentToolbar/
│   │   │   └── PersistentToolbar.tsx    # Project-scoped persistent toolbar (new, NOT QuickActionBar)
│   │   ├── InlineButtons/
│   │   │   ├── InlineButtons.tsx        # Button row on Claude responses
│   │   │   └── InlineButtonItem.tsx     # Individual button with state
│   │   ├── StarBookmark/
│   │   │   ├── StarBookmark.tsx         # Star icon component
│   │   │   └── StarBookmarkDialog.tsx   # "Why are you starring?" dialog
│   │   ├── PatternDashboard/
│   │   │   └── PatternDashboard.tsx     # Pattern visualization screen
│   │   ├── RegistryBrowser/
│   │   │   ├── RegistryBrowser.tsx      # Browse + search registry
│   │   │   └── PackCard.tsx             # Behavior pack display card
│   │   ├── ApprovalDialog/
│   │   │   └── ApprovalDialog.tsx       # Modification review + approve/reject
│   │   └── ModificationHistory/
│   │       └── ModificationHistory.tsx  # Browse + revert past modifications
│   ├── hooks/
│   │   ├── useButtons.ts               # Button state + context detection
│   │   ├── usePatterns.ts              # Pattern data + subscription
│   │   ├── useFrequency.ts             # Frequency tracking + reporting
│   │   ├── useRegistry.ts              # Registry CRUD + pack management
│   │   ├── useModifications.ts         # Modification proposal lifecycle
│   │   └── useBookmarks.ts             # Star bookmark management
│   └── utils/
│       ├── buttonContextDetector.ts     # Response classification logic
│       └── toolbarOrdering.ts           # Frequency-based sort algorithm
```

### 1.2 Data Flow Architecture

```
Operator Interaction (click button, star response, execute action)
    ↓ (action event)
Frequency Tracker (backend service)
    ├→ Increment action counter in storage
    ├→ Update time-windowed aggregates
    └→ Emit FrequencyUpdatedEvent via WebSocket
        ↓
Pattern Analyzer (backend service, runs periodically or on threshold)
    ├→ Scan frequency data for threshold-exceeding actions
    ├→ Scan action sequences for repeated patterns
    ├→ Ingest bookmarks for intent-weighted analysis
    └→ Score confidence per detected pattern
        ↓ (confidence > threshold)
Proposal Generator (backend service)
    ├→ Map pattern to concrete modification
    ├→ Generate file diffs
    ├→ Classify modification tier (minor/moderate/major)
    └→ Emit ModificationProposedEvent via WebSocket
        ↓
Approval Flow (frontend + backend)
    ├→ Minor: auto-apply → Emit ModificationAppliedEvent
    ├→ Moderate: show approval toast → operator clicks approve
    └→ Major: show ApprovalDialog with diff → operator reviews
        ↓ (approved)
Modification Executor (backend service)
    ├→ Create git branch: self-evolve/{mod-id}
    ├→ Apply file changes atomically
    ├→ Run post-modification validation (type-check, lint)
    ├→ Commit with metadata
    └→ Emit ModificationCompletedEvent
        ↓ (failure)
Rollback Service
    ├→ Revert all file changes
    ├→ Delete git branch
    └→ Emit ModificationFailedEvent
```

### 1.3 Integration Points with Existing System

```
Existing System                          Self-Evolving Interface
─────────────────────────────────────────────────────────────────
ConversationPanel.tsx          ←──── InlineButtons.tsx (renders below messages)
QuickActionBar.tsx (session)   ←──── (session-scoped, not extended for persistent toolbar)
PersistentToolbar.tsx (new)    ←──── toolbarOrdering.ts (frequency-based sort, project-scoped)
QuickActionSettings.tsx        ←──── useRegistry.ts (pack-based presets)
commands.ts (shared)           ←──── buttonTypes.ts (ButtonAction maps to Command)
events.ts (shared)             ←──── 8 new event types added to WorkspaceEvent union
Storage interface              ←──── Extended with pattern/frequency/bookmark methods
ws/handler.ts                  ←──── New event subscriptions for pattern/modification
routes/toolbar.ts              ←──── Toolbar state is project-scoped via /api/toolbar/:projectId/config (NOT session-scoped SessionWindowConfig)
projects.ts                    ←──── Per-project registry overrides in Project model
                                     NOTE: Extending Project interface with registry override
                                     fields requires additional Storage/API changes (projects
                                     are persisted via the projects route). This is an
                                     additional dependency not included in the step plan.
```

---

## SECTION 2: BUTTON RENDERING SYSTEM DESIGN

### 2.0 Common Types

The following types are shared across multiple feature modules (buttons, registry, patterns). They live in a common types file to avoid circular dependencies between feature-specific type modules.

```typescript
// packages/shared/src/selfEvolvingTypes.ts
// (Alternatively, these can be added to the existing types.ts)

import { ProjectId } from './projects.js';

/** Source layer for behavior resolution — used by buttons, registry entries, and patterns */
export type LayerSource =
  | { type: 'core' }                                    // Built-in, non-deletable
  | { type: 'pack'; packId: BehaviorPackId }             // From installed pack
  | { type: 'project'; projectId: ProjectId };           // Per-project override

// BehaviorPackId is also defined here to avoid circular imports:
export type BehaviorPackId = string & { readonly __brand: 'BehaviorPackId' };
```

> **Note:** `LayerSource` is referenced by both `buttonTypes.ts` (in `ButtonDefinition.source`) and `registryTypes.ts` (in `RegistryEntry.source`). Defining it in a common file avoids a circular dependency between button types and registry types. `BehaviorPackId` is co-located here since `LayerSource` depends on it.

### 2.1 Shared Types

```typescript
// packages/shared/src/buttonTypes.ts
import { LayerSource } from './selfEvolvingTypes.js';

/** Branded type for button IDs */
export type ButtonId = string & { readonly __brand: 'ButtonId' };

/** Action types a button can trigger */
export type ButtonActionType =
  | 'command'        // Maps to existing Command system (pause, resume, retry, etc.)
  | 'api-call'       // Arbitrary API call (POST/GET with payload)
  | 'quick-action'   // Maps to existing QuickActionDefinition
  | 'clipboard'      // Copy content to clipboard
  | 'navigate'       // Navigate to a dashboard screen/tab
  | 'custom';        // Custom handler registered by behavior pack

/** Button action payload */
export interface ButtonAction {
  type: ButtonActionType;
  /** For 'command': the command type (pause, resume, etc.) — uses CommandTypeString from commands.ts */
  commandType?: CommandTypeString;
  /** For 'api-call': the endpoint path */
  endpoint?: string;
  /** For 'api-call': HTTP method */
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  /** Generic payload passed to the action handler */
  payload?: Record<string, unknown>;
}

/** Context categories for response classification */
export type ButtonContext =
  | 'code-change'
  | 'error-message'
  | 'analysis-report'
  | 'question-prompt'
  | 'file-modification'
  | 'general';

/** A single button definition */
export interface ButtonDefinition {
  id: ButtonId;
  label: string;
  icon?: string;               // Icon name or emoji
  action: ButtonAction;
  contexts: ButtonContext[];     // Which response types this button appears on
  shortcut?: string;            // Keyboard shortcut (e.g., "Ctrl+1")
  source: LayerSource;          // Where this button was defined
  priority: number;             // Sort order (lower = higher priority)
  enabled: boolean;
}

/** Button execution state */
export type ButtonState = 'idle' | 'loading' | 'success' | 'error';

/** Toolbar slot configuration */
export interface ToolbarSlot {
  buttonId: ButtonId;
  pinned: boolean;              // Manually pinned by operator
  position: number;             // Display order in toolbar
  usageCount: number;           // Total usage (for frequency sorting)
  lastUsed: Timestamp;          // Last usage time
}

/** Toolbar configuration (per-project or per-user) */
export interface ToolbarConfig {
  maxSlots: number;             // Maximum buttons displayed (default 10)
  slots: ToolbarSlot[];
  autoLearn: boolean;           // Automatically add frequent actions
  showUsageCount: boolean;      // Show usage badge on buttons
}
```

### 2.2 Context Detection Algorithm

```typescript
// packages/app/src/utils/buttonContextDetector.ts

interface ContextDetectionResult {
  context: ButtonContext;
  confidence: number;           // 0.0-1.0
  matchedIndicators: string[];  // Which rules matched
}

/**
 * Classifies a Claude response message to determine which
 * contextual buttons should be rendered.
 *
 * Detection rules (evaluated in priority order):
 * 1. Code fence + file path → 'code-change' (confidence 0.9)
 * 2. Error keywords (error, failed, exception, traceback) → 'error-message' (0.85)
 * 3. File path + modification verbs (created, modified, deleted) → 'file-modification' (0.8)
 * 4. Question indicators (?, "should I", "do you want") → 'question-prompt' (0.75)
 * 5. Analysis keywords (analysis, summary, recommendation) → 'analysis-report' (0.7)
 * 6. Fallback → 'general' (0.5)
 */
export function detectContext(messageContent: string): ContextDetectionResult {
  // Implementation: regex + keyword matching
  // Returns highest-confidence match
}
```

### 2.3 Button Rendering Integration

**Integration with `ConversationPanel.tsx`:**

The `InlineButtons` component renders as a child of each message item in the conversation panel. It receives the message content, runs context detection, filters the active button definitions by matching context, and renders the resulting buttons.

```typescript
// Rendering flow:
// 1. ConversationPanel renders message list
// 2. For each Claude response message:
//    a. detectContext(message.content) → ButtonContext
//    b. Filter activeButtons where button.contexts includes detected context
//    c. Render <InlineButtons buttons={filteredButtons} sessionId={sessionId} />
// 3. InlineButtons renders horizontal button row
// 4. Click → useButtonActions hook → routes to command/API/quick-action handler
```

**Persistent Toolbar (`PersistentToolbar.tsx`):**

> **Note:** The existing `QuickActionBar.tsx` is **session-scoped** -- it is embedded per-session tile and tied to `SessionId`/`SessionLifecycleState`. The persistent toolbar is a **new component** (`PersistentToolbar.tsx`) that is project-scoped and lives outside the session grid. It may reuse `QuickActionButton.tsx` styling.

The persistent toolbar is implemented as a new `PersistentToolbar.tsx` component that:
1. Uses a `ToolbarProvider` context that injects frequency-ordered buttons
2. Adds pin/unpin toggle on each button (long-press or right-click menu)
3. Adds a "Suggested" section for pattern-engine-recommended buttons not yet pinned
4. Stores toolbar state via `PUT /api/toolbar/:projectId/config` (project-scoped, not session-scoped)

### 2.4 Backend Endpoints

| Endpoint | Method | Purpose | Request Body | Response |
|----------|--------|---------|-------------|----------|
| `/api/toolbar/:projectId/config` | GET | Get toolbar config | - | `ToolbarConfig` |
| `/api/toolbar/:projectId/config` | PUT | Update toolbar config | `ToolbarConfig` | `ToolbarConfig` |
| `/api/toolbar/:projectId/track` | POST | Track button usage | `{ buttonId, sessionId }` | `{ usageCount }` |

---

## SECTION 3: PATTERN DETECTION ENGINE DESIGN

### 3.1 Frequency Tracker Service

```typescript
// packages/backend/src/services/frequencyTracker.ts
// Import note: ProjectId is from packages/shared/src/projects.ts
//              UserId and Timestamp are from packages/shared/src/types.ts

interface FrequencyRecord {
  actionType: string;           // Button ID, command type, or quick action ID
  projectId?: ProjectId;
  userId?: UserId;
  count: number;
  firstSeen: Timestamp;
  lastSeen: Timestamp;
  /** Per-day counts for the last 90 days */
  dailyCounts: Record<string, number>;
}

interface FrequencyQuery {
  projectId?: ProjectId;
  userId?: UserId;
  since?: Timestamp;
  minCount?: number;
  limit?: number;
  orderBy?: 'count' | 'lastSeen';
}

/**
 * Tracks action frequencies in the storage layer.
 *
 * On every action (button click, command, quick action):
 * 1. Increment total count for the action type
 * 2. Increment daily count for today
 * 3. Update lastSeen timestamp
 * 4. If count crosses a threshold, emit FrequencyThresholdEvent
 *
 * Cleanup: Daily job prunes dailyCounts older than retention period.
 */
export class FrequencyTracker {
  constructor(private storage: Storage) {}

  async track(actionType: string, projectId?: ProjectId, userId?: UserId): Promise<FrequencyRecord>;
  async query(query: FrequencyQuery): Promise<FrequencyRecord[]>;
  async getTopActions(projectId: ProjectId, limit: number): Promise<FrequencyRecord[]>;
  async cleanup(retentionDays: number): Promise<number>;
}
```

### 3.2 Conversation Analyzer Service

```typescript
// packages/backend/src/services/patternAnalyzer.ts

interface ActionSequence {
  actions: string[];            // Ordered list of action types
  count: number;                // How many times this sequence appeared
  avgGapMs: number;             // Average time between actions in sequence
  lastOccurrence: Timestamp;
}

interface PatternAnalysisResult {
  frequencyPatterns: FrequencyRecord[];   // High-frequency individual actions
  sequencePatterns: ActionSequence[];      // Repeated action sequences
  bookmarkPatterns: BookmarkCluster[];     // Clusters from starred items
  proposedActions: ProposedAction[];       // Suggestions from analysis
}

/**
 * Analyzes operator behavior to detect patterns.
 *
 * Analysis modes:
 * 1. Frequency scan: Find actions above threshold (default: 5 uses/day)
 * 2. Sequence detection: Find 2-4 action sequences that repeat 3+ times
 * 3. Bookmark clustering: Group starred items by category + intent keywords
 * 4. Cross-correlation: Find actions that always follow specific events
 *
 * Runs periodically (default: every 30 minutes) or on-demand via API.
 */
export class PatternAnalyzer {
  constructor(
    private frequencyTracker: FrequencyTracker,
    private storage: Storage
  ) {}

  async analyze(projectId: ProjectId): Promise<PatternAnalysisResult>;
  async detectSequences(actionLog: ActionLogEntry[], minLength: number, minCount: number): Promise<ActionSequence[]>;
}
```

### 3.3 Confidence Scoring

```typescript
// packages/backend/src/services/confidenceScorer.ts

/**
 * Calculates confidence score for a detected pattern.
 *
 * Formula:
 *   confidence = (w_freq * frequencyScore) + (w_rec * recencyScore) + (w_con * consistencyScore)
 *
 * Where:
 *   frequencyScore = min(count / threshold, 1.0)
 *   recencyScore = max(0, 1.0 - (daysSinceLastSeen / decayDays))
 *   consistencyScore = occurrencesInLastN / N  (for sequence patterns)
 *
 * Default weights: w_freq=0.4, w_rec=0.3, w_con=0.3
 * Confidence threshold for proposal: 0.7
 * Confidence threshold for auto-apply: 0.9
 */
export function calculateConfidence(
  frequency: number,
  lastSeen: Timestamp,
  consistency: number,
  weights?: { frequency: number; recency: number; consistency: number }
): number;
```

### 3.4 Bookmark System

```typescript
// packages/shared/src/patternTypes.ts (partial)

export type BookmarkId = string & { readonly __brand: 'BookmarkId' };

export type BookmarkCategory =
  | 'useful-pattern'
  | 'good-output'
  | 'want-to-automate'
  | 'reference-material'
  | 'other';

export interface Bookmark {
  id: BookmarkId;
  sessionId: SessionId;
  messageIndex: number;         // Position in conversation
  messageContent: string;       // The Claude response that was starred
  category: BookmarkCategory;
  explanation: string;          // User's answer to "Why are you starring?"
  timestamp: Timestamp;
  userId?: UserId;
  projectId?: ProjectId;
  tags: string[];               // Auto-extracted or user-added tags
}
```

### 3.5 Pattern API Endpoints

| Endpoint | Method | Purpose | Request Body | Response |
|----------|--------|---------|-------------|----------|
| `/api/patterns/:projectId` | GET | Get detected patterns | Query: `?minConfidence=0.5&type=frequency` | `Pattern[]` |
| `/api/patterns/:projectId/analyze` | POST | Trigger analysis | `{ force?: boolean }` | `PatternAnalysisResult` |
| `/api/bookmarks` | POST | Create bookmark | `Bookmark` (sans id/timestamp) | `Bookmark` |
| `/api/bookmarks/:projectId` | GET | List bookmarks | Query: `?category=&since=` | `Bookmark[]` |
| `/api/bookmarks/:bookmarkId` | DELETE | Delete bookmark | - | `{ success: true }` |

### 3.6 New WebSocket Event Types

```typescript
// Added to packages/shared/src/events.ts WorkspaceEvent union
//
// NOTE: All new event types should extend BaseEvent (from events.ts) to inherit
// the optional `eventId` and `user` fields, matching existing event type patterns.
// The interfaces below show the required fields; in implementation, use
// `interface PatternDetectedEvent extends BaseEvent { ... }` pattern.

/** Emitted when a pattern's confidence crosses the proposal threshold */
export interface PatternDetectedEvent extends BaseEvent {
  type: 'pattern:detected';
  sessionId: SessionId;
  timestamp: Timestamp;
  patternId: string;
  patternType: 'frequency' | 'sequence' | 'bookmark-cluster';
  confidence: number;
  description: string;
}

/** Emitted when action frequency is updated */
export interface FrequencyUpdatedEvent extends BaseEvent {
  type: 'frequency:updated';
  sessionId: SessionId;
  timestamp: Timestamp;
  actionType: string;
  newCount: number;
  projectId?: string;
}

/** Emitted when a bookmark is created */
export interface BookmarkCreatedEvent extends BaseEvent {
  type: 'bookmark:created';
  sessionId: SessionId;
  timestamp: Timestamp;
  bookmarkId: string;
  category: BookmarkCategory;
}

/** Emitted when a modification is proposed */
export interface ModificationProposedEvent extends BaseEvent {
  type: 'modification:proposed';
  sessionId: SessionId;
  timestamp: Timestamp;
  proposalId: string;
  tier: 'minor' | 'moderate' | 'major';
  title: string;
  description: string;
}

/** Emitted when a modification is approved (manually or auto) */
export interface ModificationApprovedEvent extends BaseEvent {
  type: 'modification:approved';
  sessionId: SessionId;
  timestamp: Timestamp;
  proposalId: string;
  approvedBy: 'auto' | string;  // 'auto' for minor tier
}

/** Emitted when a modification is applied successfully */
export interface ModificationAppliedEvent extends BaseEvent {
  type: 'modification:applied';
  sessionId: SessionId;
  timestamp: Timestamp;
  proposalId: string;
  commitHash: string;
  filesModified: string[];
}

/** Emitted when a modification fails */
export interface ModificationFailedEvent extends BaseEvent {
  type: 'modification:failed';
  sessionId: SessionId;
  timestamp: Timestamp;
  proposalId: string;
  error: string;
  rolledBack: boolean;
}

/** Emitted when a registry entry changes */
export interface RegistryChangedEvent extends BaseEvent {
  type: 'registry:changed';
  sessionId: SessionId;
  timestamp: Timestamp;
  entryId: string;
  changeType: 'added' | 'updated' | 'removed' | 'pack-installed' | 'pack-uninstalled';
}
```

---

## SECTION 4: REGISTRY & BEHAVIOR PACK DESIGN

### 4.0 Action Type Definitions

The following action interfaces are used by `RegistryEntry.data` and must be explicitly defined. `ButtonAction` is defined in `buttonTypes.ts` (Section 2.1). `PatternAction` and `ModifierAction` are defined here:

```typescript
// packages/shared/src/patternTypes.ts (addition)

/** Action definition for a detected pattern — specifies what happens when the pattern triggers */
export interface PatternAction {
  /** Unique identifier for this pattern definition */
  patternId: string;
  /** Human-readable name */
  name: string;
  /** What type of pattern this represents */
  patternType: 'frequency' | 'sequence' | 'temporal' | 'error-recovery' | 'preference';
  /** Trigger conditions: when should this pattern activate? */
  trigger: {
    /** Minimum confidence score to activate */
    minConfidence: number;
    /** Action types that form the trigger sequence (for sequence patterns) */
    actionSequence?: string[];
    /** Minimum frequency count (for frequency patterns) */
    minFrequency?: number;
  };
  /** What action to take when pattern triggers */
  suggestedAction: ButtonAction;
  /** Whether this pattern can auto-trigger without user confirmation */
  autoTrigger: boolean;
}

// packages/shared/src/modificationTypes.ts (addition)

/** Action definition for a self-modification template */
export interface ModifierAction {
  /** Description of what this modifier does */
  description: string;
  /** Which tier this modifier produces */
  targetTier: ModificationTier;
  /** Template for generating file changes */
  fileChangeTemplates: Array<{
    filePath: string;
    changeType: 'create' | 'modify' | 'delete';
    /** Handlebars-style template for content/diff generation */
    template?: string;
    package: 'shared' | 'backend' | 'app' | 'mcp-server' | 'hooks';
  }>;
  /** Validation requirements */
  validation: {
    typeCheck: boolean;
    lint: boolean;
    test: boolean;
  };
}
```

> **Note:** These three action types (`ButtonAction` from Section 2.1, `PatternAction`, and `ModifierAction`) correspond to the three variants of the discriminated union in `RegistryEntry.data`.

### 4.1 Registry Types

```typescript
// packages/shared/src/registryTypes.ts
import { LayerSource } from './selfEvolvingTypes.js';

export type RegistryEntryId = string & { readonly __brand: 'RegistryEntryId' };
export type BehaviorPackId = string & { readonly __brand: 'BehaviorPackId' };

/** Registry entry types */
export type RegistryEntryType = 'button' | 'pattern' | 'modifier' | 'pack';

/** A single entry in the behavior registry */
export interface RegistryEntry {
  id: RegistryEntryId;
  name: string;
  description: string;
  type: RegistryEntryType;
  source: LayerSource;
  version: string;              // Semver (e.g., "1.0.0")
  status: 'active' | 'inactive';
  /** Type-specific data — discriminated union matching the existing event type pattern in events.ts */
  data:
    | { type: 'button'; definition: ButtonDefinition }
    | { type: 'pattern'; definition: PatternDefinition }
    | { type: 'modifier'; definition: ModifierDefinition };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/** Behavior pack definition */
export interface BehaviorPack {
  id: BehaviorPackId;
  name: string;
  description: string;
  author: string;
  version: string;
  tags: string[];
  compatibility: {
    minDashboardVersion: string;
    projectTypes?: string[];     // e.g., ['node', 'python', 'react']
  };
  entries: RegistryEntry[];
  dependencies?: BehaviorPackId[];
}

/** Result of layer resolution */
export interface ResolvedBehavior {
  entry: RegistryEntry;
  effectiveSource: LayerSource;  // Which layer won
  overriddenBy?: LayerSource[];  // What was overridden
}
```

### 4.2 Registry Storage

```typescript
// packages/backend/src/services/registryStorage.ts

/**
 * File-based registry storage with optional Redis caching.
 *
 * Storage locations:
 * - Core entries: data/registry/core.json (shipped with dashboard)
 * - Pack entries: data/registry/packs/{packId}.json
 * - Project overrides: data/registry/projects/{projectId}.json
 *
 * On startup: Load all JSON files into memory map.
 * On mutation: Write to file + invalidate Redis cache (if enabled).
 * On query: Memory-first, file-fallback.
 */
export class RegistryStorage {
  private entries: Map<RegistryEntryId, RegistryEntry>;
  private packs: Map<BehaviorPackId, BehaviorPack>;

  async loadAll(): Promise<void>;
  async getEntry(id: RegistryEntryId): Promise<RegistryEntry | undefined>;
  async listEntries(filter?: { type?: RegistryEntryType; source?: LayerSource['type'] }): Promise<RegistryEntry[]>;
  async addEntry(entry: RegistryEntry): Promise<void>;
  async updateEntry(id: RegistryEntryId, updates: Partial<RegistryEntry>): Promise<void>;
  async removeEntry(id: RegistryEntryId): Promise<void>;
  async installPack(pack: BehaviorPack): Promise<void>;
  async uninstallPack(packId: BehaviorPackId): Promise<void>;
  async getInstalledPacks(): Promise<BehaviorPack[]>;
}
```

### 4.3 Layer Resolution Engine

```typescript
// packages/backend/src/services/layerResolver.ts

/**
 * Resolves the effective set of behaviors by merging layers.
 *
 * Resolution algorithm:
 * 1. Load all core entries
 * 2. For each installed pack (in install order):
 *    a. Add new entries (no conflict)
 *    b. For entries with matching IDs: pack overrides core
 * 3. For each project override:
 *    a. Add new entries (no conflict)
 *    b. For entries with matching IDs: project overrides pack/core
 * 4. Return merged set with provenance tracking
 *
 * Conflict detection:
 * - Same ID, different sources: higher layer wins
 * - Same ID, same source: later version wins
 * - Pack-pack conflict: log warning, last-installed wins
 */
export class LayerResolver {
  constructor(private registryStorage: RegistryStorage) {}

  async resolve(projectId: ProjectId): Promise<ResolvedBehavior[]>;
  async resolveButtons(projectId: ProjectId): Promise<ButtonDefinition[]>;
  async resolvePatterns(projectId: ProjectId): Promise<PatternDefinition[]>;
  async getConflicts(projectId: ProjectId): Promise<RegistryConflict[]>;
}
```

### 4.4 Registry API Endpoints

| Endpoint | Method | Purpose | Request Body | Response |
|----------|--------|---------|-------------|----------|
| `/api/registry` | GET | List all entries | Query: `?type=button&source=core` | `RegistryEntry[]` |
| `/api/registry/:projectId/resolved` | GET | Get resolved behaviors for project | - | `ResolvedBehavior[]` |
| `/api/registry/packs` | POST | Install behavior pack | `BehaviorPack` | `{ installed: true }` |
| `/api/registry/packs/:packId` | DELETE | Uninstall behavior pack | - | `{ uninstalled: true }` |

---

## SECTION 5: SELF-MODIFICATION PIPELINE DESIGN

### 5.1 Modification Proposal Types

```typescript
// packages/shared/src/modificationTypes.ts

export type ProposalId = string & { readonly __brand: 'ProposalId' };

/** Modification tiers determine approval requirements */
export type ModificationTier = 'minor' | 'moderate' | 'major';

/** Current status of a modification proposal */
export type ProposalStatus =
  | 'pending'           // Awaiting approval
  | 'auto-approved'     // Minor tier, auto-applied
  | 'approved'          // Explicitly approved by operator
  | 'rejected'          // Rejected with reason
  | 'applying'          // Currently being applied
  | 'applied'           // Successfully applied
  | 'failed'            // Application failed
  | 'rolled-back';      // Applied then reverted

/** A single file change within a modification */
export interface FileChange {
  filePath: string;             // Relative to project root
  changeType: 'create' | 'modify' | 'delete';
  /** For 'modify': the unified diff */
  diff?: string;
  /** For 'create': the full file content */
  content?: string;
  /** Package affected */
  package: 'shared' | 'backend' | 'app' | 'mcp-server' | 'hooks';
}

/** A complete modification proposal */
export interface ModificationProposal {
  id: ProposalId;
  title: string;
  description: string;
  rationale: string;            // Why this modification is proposed
  sourcePatternId?: string;     // Which pattern triggered it (if any)
  tier: ModificationTier;
  status: ProposalStatus;
  fileChanges: FileChange[];
  /** Validation requirements for this modification */
  validation: {
    typeCheck: boolean;
    lint: boolean;
    test: boolean;
  };
  /** Git metadata */
  git?: {
    branch: string;
    commitHash?: string;
    commitMessage: string;
  };
  /** Approval tracking */
  approvedBy?: string;
  rejectedBy?: string;
  rejectionReason?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### 5.2 Tier Classification Rules

```typescript
// packages/backend/src/services/proposalGenerator.ts (partial)

/**
 * Classifies a modification into a tier based on affected files.
 *
 * Rules:
 * - MINOR: Only CSS/style changes, button ordering, toolbar config
 *   Files: *.css, *.scss, toolbarConfig, quickActionPresets
 *
 * - MODERATE: New frontend component, hook, or utility.
 *   Config changes. No backend or shared type changes.
 *   Files: packages/app/src/**
 *
 * - MAJOR: Any change to backend routes, shared types, framework files,
 *   or infrastructure config.
 *   Files: packages/backend/**, packages/shared/**, .claude/**,
 *          package.json, tsconfig.json
 */
function classifyTier(fileChanges: FileChange[]): ModificationTier {
  const hasBackendChanges = fileChanges.some(f => f.package === 'backend' || f.package === 'shared');
  const hasFrameworkChanges = fileChanges.some(f => f.filePath.startsWith('.claude/'));
  const hasConfigChanges = fileChanges.some(f =>
    f.filePath.endsWith('package.json') || f.filePath.endsWith('tsconfig.json')
  );

  if (hasBackendChanges || hasFrameworkChanges || hasConfigChanges) return 'major';

  const isStyleOnly = fileChanges.every(f =>
    f.filePath.endsWith('.css') || f.filePath.endsWith('.scss') ||
    f.filePath.includes('toolbar') || f.filePath.includes('quickAction')
  );

  if (isStyleOnly) return 'minor';
  return 'moderate';
}
```

### 5.3 Modification Executor

```typescript
// packages/backend/src/services/modificationExecutor.ts

/**
 * Applies a modification proposal atomically.
 *
 * Execution sequence:
 * 1. Validate all target files exist (for modify/delete) or parent dirs exist (for create)
 * 2. Create backup of all files to be modified/deleted
 * 3. Create git branch: self-evolve/{proposalId}
 * 4. Apply all file changes in order
 * 5. Run post-modification validation (if configured):
 *    a. pnpm type-check (TypeScript)
 *    b. pnpm lint (ESLint)
 *    c. pnpm test (Vitest, if validation.test is true)
 * 6. If validation passes: commit changes with metadata
 * 7. If validation fails: rollback all changes, delete branch
 *
 * Atomicity: If ANY file change fails, ALL changes are reverted.
 */
export class ModificationExecutor {
  constructor(
    private gitIntegration: GitIntegration,
    private rollbackService: RollbackService
  ) {}

  async execute(proposal: ModificationProposal): Promise<ExecutionResult>;
  private async applyFileChanges(changes: FileChange[]): Promise<void>;
  private async validate(proposal: ModificationProposal): Promise<ValidationResult>;
}
```

### 5.4 Git Integration

```typescript
// packages/backend/src/services/gitIntegration.ts

/**
 * Git operations for the self-modification pipeline.
 *
 * Branch naming: self-evolve/{proposalId}
 * Commit format:
 *   self-evolve({tier}): {title}
 *
 *   {description}
 *
 *   Source-Pattern: {patternId or 'manual'}
 *   Approval: {auto | userId}
 *   Tier: {minor | moderate | major}
 *   Files-Changed: {count}
 *
 * Safety rules:
 * - Never force-push
 * - Never modify main/master branch directly
 * - Always create a new branch
 * - Revert creates a new commit (not reset --hard)
 */
export class GitIntegration {
  async createBranch(name: string): Promise<void>;
  async commit(message: string, files: string[]): Promise<string>;  // Returns commit hash
  async revert(commitHash: string): Promise<string>;                // Returns revert commit hash
  async deleteBranch(name: string): Promise<void>;
  async getCurrentBranch(): Promise<string>;
  async hasStagedChanges(): Promise<boolean>;
}
```

### 5.5 Modification API Endpoints

| Endpoint | Method | Purpose | Request Body | Response |
|----------|--------|---------|-------------|----------|
| `/api/modifications` | POST | Submit proposal | `ModificationProposal` (sans status/git) | `ModificationProposal` |
| `/api/modifications/:proposalId/approve` | POST | Approve proposal | `{ approvedBy: string }` | `ModificationProposal` |
| `/api/modifications/:proposalId/reject` | POST | Reject proposal | `{ rejectedBy: string, reason: string }` | `ModificationProposal` |
| `/api/modifications/:proposalId/revert` | POST | Revert applied modification | - | `{ reverted: true, revertCommit: string }` |
| `/api/modifications` | GET | List proposals | Query: `?status=pending&tier=major` | `ModificationProposal[]` |

---

## SECTION 6: CROSS-CUTTING CONCERNS

### 6.1 Approval Flow Architecture

**Minor Tier (Auto-Apply):**
1. Proposal generated with tier=minor
2. Backend auto-sets status to `auto-approved`
3. Executor applies changes immediately
4. WebSocket broadcasts `ModificationAppliedEvent`
5. Frontend shows toast notification: "Auto-applied: {title}"
6. Change appears in modification history for retroactive review

**Moderate Tier (Single Approval):**
1. Proposal generated with tier=moderate
2. WebSocket broadcasts `ModificationProposedEvent`
3. Frontend shows approval toast with summary
4. Operator clicks "Approve" or "Reject" on toast
5. On approve: executor applies; on reject: status set to `rejected`

**Major Tier (Full Review):**
1. Proposal generated with tier=major
2. WebSocket broadcasts `ModificationProposedEvent`
3. Frontend shows `ApprovalDialog` with:
   - Title and rationale
   - List of affected files
   - Full diff viewer (Monaco diff editor)
   - Source pattern information
4. Operator reviews diff, then clicks "Approve" or "Reject"
5. On reject: operator provides reason text
6. Rejection reason feeds back to pattern engine (negative signal)

### 6.2 Versioning Strategy

All self-modifications use git-native versioning:

- **Branch per modification:** `self-evolve/{proposalId}` isolates changes
- **Commit metadata:** Tier, source pattern, approval status in commit message body
- **Revert as new commit:** Never destructive; revert creates a new commit
- **History browsable:** `ModificationHistory` component queries git log for `self-evolve(` prefix
- **PR integration (Phase 2):** Major modifications can be reviewed as pull requests before merge

### 6.3 Error Handling

**Pattern Detection Failures:**
- Pattern analyzer runs in background; failures logged, no user impact
- Frequency tracker retries on storage write failure (3 attempts, exponential backoff)
- If pattern analysis consistently fails, emit `WarningOccurredEvent` and disable analysis for that project

**Modification Execution Failures:**
- Pre-execution validation catches obvious issues (missing files, syntax errors)
- Post-execution validation catches type errors, lint violations, test failures
- On any failure: rollback service reverts all file changes, deletes git branch
- `ModificationFailedEvent` broadcast with error details
- Failed proposals can be retried after manual fix

**Registry Corruption:**
- Registry files are JSON; parse errors are caught and logged
- Fallback: rebuild registry from git history (scan for `self-evolve(` commits)
- Core entries are shipped as a static fallback file

### 6.4 Security Architecture

**Modification Scoping:**
- File changes are validated against project root directory
- Path validation reuses existing `validatePath.ts` middleware
- System paths (`/etc`, `C:\Windows`, etc.) are denied
- Files outside project directory are denied

**Approval Enforcement:**
- Major tier modifications ALWAYS require explicit approval
- There is no API endpoint to bypass approval for major tier
- Auto-approval only applies to minor tier (hardcoded in executor)
- Approval status is tracked and auditable

**Registry Integrity:**
- Core entries have `source.type === 'core'` and cannot be deleted via API
- Pack installations validate JSON schema before persisting
- Pack entries are sandboxed: they can only define buttons, patterns, and modifiers (not arbitrary code)

**Git Safety:**
- `GitIntegration` never calls `git push --force`
- Modifications never target `main` or `master` branch
- All operations use `git checkout -b` (new branch) not `git checkout` (existing)

### 6.5 Performance Targets

| Operation | Target | Strategy |
|-----------|--------|----------|
| Context detection (per message) | < 10ms | Regex-based, no external calls |
| Button rendering (per message) | < 50ms | Pre-filtered button list, memoized |
| Frequency tracking (per action) | < 5ms | In-memory counter, async storage write |
| Pattern analysis (full scan) | < 5s | Background service, non-blocking |
| Registry resolution (per project) | < 100ms | Cached in memory, invalidated on change |
| Modification execution (minor) | < 10s | File write only, no validation |
| Modification execution (major) | < 5min | Includes type-check + lint + test |
| Git operations (branch + commit) | < 3s | Local git only, no remote push |

### 6.6 Storage Extensions

The existing `Storage` interface is extended with new methods:

```typescript
// Added to packages/backend/src/storage/index.ts

interface Storage {
  // ... existing methods ...

  // Frequency tracking
  trackAction(actionType: string, projectId?: string, userId?: string): void | Promise<void>;
  getFrequency(actionType: string, projectId?: string): FrequencyRecord | Promise<FrequencyRecord | undefined>;
  getTopActions(projectId: string, limit: number): FrequencyRecord[] | Promise<FrequencyRecord[]>;

  // Bookmarks
  addBookmark(bookmark: Bookmark): void | Promise<void>;
  getBookmarks(projectId: string, filter?: BookmarkFilter): Bookmark[] | Promise<Bookmark[]>;
  removeBookmark(bookmarkId: string): void | Promise<void>;

  // Patterns (detected)
  addPattern(pattern: DetectedPattern): void | Promise<void>;
  getPatterns(projectId: string, filter?: PatternFilter): DetectedPattern[] | Promise<DetectedPattern[]>;

  // Modification proposals
  addProposal(proposal: ModificationProposal): void | Promise<void>;
  getProposal(proposalId: string): ModificationProposal | Promise<ModificationProposal | undefined>;
  updateProposal(proposalId: string, updates: Partial<ModificationProposal>): void | Promise<void>;
  listProposals(filter?: ProposalFilter): ModificationProposal[] | Promise<ModificationProposal[]>;
}
```

Both Memory and Redis implementations must be extended to support these methods.

> **Architecture Recommendation: Composition Pattern**
>
> Rather than adding ~12 new methods directly to the existing `Storage` interface (which already has ~20 methods), it is recommended to use a **composition pattern** with a separate `SelfEvolvingStorage` interface:
>
> ```typescript
> interface SelfEvolvingStorage {
>   frequency: FrequencyStorage;   // trackAction, getFrequency, getTopActions
>   bookmarks: BookmarkStorage;    // addBookmark, getBookmarks, removeBookmark
>   patterns: PatternStorage;      // addPattern, getPatterns
>   proposals: ProposalStorage;    // addProposal, getProposal, updateProposal, listProposals
> }
> ```
>
> This isolates the self-evolving feature storage from core `Storage`, reduces blast radius when extending, and allows independent Memory/Redis implementations per feature area. The `SelfEvolvingStorage` can be injected alongside the base `Storage` into services that need it.

---

## SECTION 7: IMPLEMENTATION SEQUENCE

### 7.1 29-Step Plan (4 Phases, ~13 Weeks)

#### Phase 1: Button System (Weeks 1-4, 9 steps)

**Priority: HIGH -- First prototype target**

0. **Prerequisite: Upgrade ConversationPanel to render full message history** -- **2-3 days**
   - `ConversationPanel.tsx` currently only renders `session.lastPrompt` (most recent prompt/response)
   - InlineButtons requires iterating over full conversation history to attach buttons per-message
   - Upgrade the component to render a scrollable message list from session events
   - This is a **dependency** that must be completed before Step 3 (InlineButtons integration)

1. Define shared button types (`buttonTypes.ts`) -- **1 day**
   - `ButtonId`, `ButtonAction`, `ButtonContext`, `ButtonDefinition`, `ToolbarConfig`
2. Implement context detection utility (`buttonContextDetector.ts`) -- **2 days**
   - Regex rules for 6 context types, confidence scoring
3. Create `InlineButtons` component -- **2 days**
   - Horizontal button row, renders below ConversationPanel messages
   - Integrates with context detector
4. Create `useButtonActions` hook -- **1 day**
   - Routes button clicks to command queue, API calls, or quick actions
5. Implement toolbar state API (`routes/toolbar.ts`) -- **1 day**
   - GET/PUT config, POST track usage
6. Create `PersistentToolbar` component with frequency ordering -- **2 days**
   - New project-scoped toolbar component (reuses `QuickActionButton.tsx` styling)
   - Wrap with toolbar provider, pin/unpin support
7. Create `toolbarOrdering.ts` utility -- **1 day**
   - Frequency-based sort, pinned-first logic
8. Review button system integration -- **1 day**
   - E2E test: message -> context detect -> button render -> click -> action execute

#### Phase 2: Pattern Detection (Weeks 5-7, 8 steps)

9. Define shared pattern types (`patternTypes.ts`) -- **1 day**
   - `BookmarkId`, `BookmarkCategory`, `Bookmark`, `PatternType`, `ConfidenceScore`
10. Extend Storage interface with frequency + bookmark methods -- **2 days**
    - Memory implementation first, Redis follows
11. Implement `FrequencyTracker` service -- **2 days**
    - track(), query(), getTopActions(), cleanup()
12. Implement bookmark API (`routes/bookmarks.ts` via `routes/patterns.ts`) -- **1 day**
    - POST create, GET list, DELETE remove
13. Create `StarBookmark` component + dialog -- **2 days**
    - Star icon on messages, "Why?" dialog with categories
14. Implement `PatternAnalyzer` service -- **3 days**
    - Frequency scan, sequence detection, bookmark clustering
15. Implement `ConfidenceScorer` -- **1 day**
    - Weighted formula, configurable weights and thresholds
16. Add new WebSocket event types -- **1 day**
    - `PatternDetectedEvent`, `FrequencyUpdatedEvent`, `BookmarkCreatedEvent`

#### Phase 3: Registry Model (Weeks 8-10, 6 steps)

17. Define shared registry types (`registryTypes.ts`) -- **1 day**
    - `RegistryEntryId`, `BehaviorPackId`, `RegistryEntry`, `BehaviorPack`, `LayerSource`
18. Implement `RegistryStorage` service -- **2 days**
    - File-based persistence, memory cache, CRUD operations
19. Implement `LayerResolver` service -- **2 days**
    - Core -> Pack -> Project resolution, conflict detection
20. Implement registry API (`routes/registry.ts`) -- **2 days**
    - GET list, GET resolved, POST install pack, DELETE uninstall pack
21. Create `RegistryBrowser` component -- **2 days**
    - Browse entries, search, install/uninstall packs, view provenance
22. Add `RegistryChangedEvent` to WebSocket events -- **0.5 day**

#### Phase 4: Self-Modification Pipeline (Weeks 11-13, 6 steps)

23. Define shared modification types (`modificationTypes.ts`) -- **1 day**
    - `ProposalId`, `ModificationTier`, `ProposalStatus`, `FileChange`, `ModificationProposal`
24. Implement `ProposalGenerator` service -- **2 days**
    - Pattern-to-proposal mapping, tier classification, diff generation
25. Implement `GitIntegration` service -- **2 days**
    - Branch creation, commit, revert, safety guards
26. Implement `ModificationExecutor` + `RollbackService` -- **3 days**
    - Atomic execution, post-modification validation, failure recovery
27. Implement modification API (`routes/modifications.ts`) -- **2 days**
    - POST submit, POST approve, POST reject, POST revert, GET list
28. Create `ApprovalDialog` + `ModificationHistory` components -- **3 days**
    - Diff viewer (Monaco diff), approve/reject with reason, history browser with revert

### 7.2 Dependency Graph

```
Phase 1: Button System (Weeks 1-4)
    ├── Step 0: ConversationPanel upgrade (prerequisite for InlineButtons)
    ├── Steps 1-2: Shared types + context detection (parallel-safe, parallel with Step 0)
    ├── Steps 3-4: InlineButtons + useButtonActions (depends on 0, 1-2)
    ├── Steps 5-7: Toolbar API + ordering (depends on 1)
    └── Step 8: Review (depends on 3-7)
        ↓
Phase 2: Pattern Detection (Weeks 4-6)
    ├── Steps 9-10: Shared types + storage extension (parallel-safe)
    ├── Steps 11-12: FrequencyTracker + bookmark API (depends on 10)
    ├── Step 13: StarBookmark component (depends on 9, 12)
    ├── Steps 14-15: PatternAnalyzer + ConfidenceScorer (depends on 11)
    └── Step 16: WebSocket events (depends on 9)
        ↓
Phase 3: Registry Model (Weeks 7-9)
    ├── Step 17: Shared types (depends on Phase 2 types)
    ├── Steps 18-19: Storage + resolver (depends on 17)
    ├── Steps 20-21: API + browser (depends on 18-19)
    └── Step 22: WebSocket events (depends on 17)
        ↓
Phase 4: Self-Modification Pipeline (Weeks 10-12)
    ├── Step 23: Shared types (depends on Phase 3 types)
    ├── Step 24: ProposalGenerator (depends on Phase 2 analyzer + Phase 3 registry)
    ├── Steps 25-26: Git + executor (depends on 23)
    ├── Step 27: API (depends on 24-26)
    └── Step 28: UI components (depends on 27)
```

### 7.3 Critical Path Analysis

**Serial Dependencies (minimum elapsed time):**
1. Button shared types (1 day)
2. Context detector (2 days)
3. InlineButtons component (2 days)
4. Pattern shared types (1 day)
5. Storage extension (2 days)
6. FrequencyTracker (2 days)
7. PatternAnalyzer (3 days)
8. Registry types (1 day)
9. Registry storage + resolver (4 days)
10. Modification types (1 day)
11. ProposalGenerator + executor (5 days)

**Critical path: ~25 working days (5 weeks)** (includes ConversationPanel upgrade prerequisite)

**Parallelizable (after Phase 1 types):**
- Toolbar API + ordering (parallel with InlineButtons)
- StarBookmark component (parallel with FrequencyTracker)
- RegistryBrowser (parallel with API implementation)
- ApprovalDialog (parallel with API implementation)

**Optimized total: ~13 weeks** (5 weeks critical path + 8 weeks parallel and buffer)

---

## SECTION 8: RISK ASSESSMENT

### 8.1 Architectural Risks

| Risk | Impact | Likelihood | Mitigation | Detection |
|------|--------|-----------|-----------|-----------|
| Context detection false positives (wrong buttons shown) | LOW | HIGH | Confidence threshold + user feedback loop | User testing, analytics |
| Pattern engine detects noise as patterns | MEDIUM | MEDIUM | High confidence threshold (0.7), decay function | Monitoring proposal rejection rate |
| Self-modification breaks type safety | HIGH | MEDIUM | Post-modification type-check gate | CI-like validation in executor |
| Registry corruption from concurrent writes | MEDIUM | LOW | File-level locking, atomic writes | Checksum validation on load |
| Behavior pack conflicts (two packs define same button) | MEDIUM | MEDIUM | Conflict detection in LayerResolver | Warning events, UI indicators |

### 8.2 Data Integrity Risks

| Risk | Impact | Likelihood | Mitigation | Detection |
|------|--------|-----------|-----------|-----------|
| Frequency data loss on process restart | MEDIUM | HIGH (memory mode) | Periodic flush to disk, Redis for prod | Monitoring frequency counts |
| Bookmark data loss | MEDIUM | LOW | File-based persistence, backup on write | Bookmark count monitoring |
| Modification commit on wrong branch | HIGH | LOW | Verify branch name before commit | Pre-commit hook check |
| Rollback fails mid-execution | HIGH | LOW | Backup files before modification | Backup existence check |

### 8.3 Security Risks

| Risk | Impact | Likelihood | Mitigation | Detection |
|------|--------|-----------|-----------|-----------|
| Self-modification writes outside project dir | HIGH | LOW | Path validation (reuse validatePath.ts) | Security audit, path tests |
| Behavior pack contains malicious definitions | MEDIUM | LOW | Schema validation, no code execution in packs | Pack install validation |
| Major modification auto-approved (bypass) | HIGH | LOW | Tier classification is server-side, not client-controllable | API audit, tier classification tests |
| Pattern engine trained on adversarial data | LOW | LOW | Bookmark intent validation, frequency thresholds | Anomaly detection in pattern analysis |
| Shell command execution from Express server | HIGH | MEDIUM | ModificationExecutor runs `pnpm type-check`, `pnpm lint`, `pnpm test` as child processes from the Express backend. This is architecturally unusual for a web server and carries shell injection risk if proposal data is not sanitized. **Mitigation:** Spawn validation commands in an isolated worker process; sanitize all input passed to shell; use a fixed allowlist of commands (never interpolate proposal data into shell strings); consider a dedicated validation microservice. | Command execution audit, input sanitization tests |

### 8.4 Performance Risks

| Risk | Impact | Likelihood | Mitigation | Detection |
|------|--------|-----------|-----------|-----------|
| Pattern analysis blocks main thread | MEDIUM | MEDIUM | Run analysis in background worker/interval | Event loop lag monitoring |
| Large registry slows resolution | LOW | LOW | Memory cache, indexed lookup | Resolution time monitoring |
| Frequency tracking overhead per action | LOW | MEDIUM | Async storage writes, batching | Request latency monitoring |
| Git operations slow on large repos | MEDIUM | MEDIUM | Local operations only (no push), shallow ops | Operation time measurement |

### 8.5 Mitigation Checklist

**Before Phase 1 Deploy (Button System):**
- [ ] Context detection unit tests (all 6 context types)
- [ ] Button click -> action execution integration test
- [ ] Toolbar persistence round-trip test (save/load config)
- [ ] Button rendering performance test (100 messages)

**Before Phase 2 Deploy (Pattern Detection):**
- [ ] Frequency tracker accuracy test (10K actions)
- [ ] Pattern analyzer false positive rate < 20%
- [ ] Bookmark CRUD test
- [ ] Pattern analysis performance test (< 5s for 90 days of data)

**Before Phase 3 Deploy (Registry):**
- [ ] Layer resolution correctness test (core + 3 packs + project overrides)
- [ ] Pack install/uninstall round-trip test
- [ ] Conflict detection test (overlapping pack entries)
- [ ] Registry corruption recovery test

**Before Phase 4 Deploy (Self-Modification):**
- [ ] Tier classification correctness test (all 3 tiers)
- [ ] Atomic execution test (partial failure -> full rollback)
- [ ] Git branch lifecycle test (create -> commit -> revert -> delete)
- [ ] Post-modification validation test (type-check, lint, test gates)
- [ ] Path validation test (no writes outside project dir)
- [ ] Major tier cannot be auto-approved test

---

## SECTION 9: QUALITY ASSURANCE

### 9.1 Testing Strategy

**Unit Tests (80% target for shared types):**

```typescript
describe('ButtonContextDetector', () => {
  test('detects code-change context from code fences', () => {
    const content = '```typescript\nconst x = 1;\n```\nModified `src/index.ts`';
    const result = detectContext(content);
    expect(result.context).toBe('code-change');
    expect(result.confidence).toBeGreaterThan(0.8);
  });

  test('detects error-message from error keywords', () => {
    const content = 'Error: Module not found\n  at resolve (module.js:123)';
    const result = detectContext(content);
    expect(result.context).toBe('error-message');
  });

  test('falls back to general for ambiguous content', () => {
    const content = 'Here is some general information about the topic.';
    const result = detectContext(content);
    expect(result.context).toBe('general');
    expect(result.confidence).toBeLessThan(0.6);
  });
});

describe('ConfidenceScorer', () => {
  test('high frequency + recent + consistent = high confidence', () => {
    const score = calculateConfidence(100, recentTimestamp, 0.9);
    expect(score).toBeGreaterThan(0.8);
  });

  test('old pattern decays', () => {
    const score = calculateConfidence(100, thirtyDaysAgo, 0.9);
    expect(score).toBeLessThan(0.7);
  });
});

describe('TierClassification', () => {
  test('CSS-only changes are minor', () => {
    const changes = [{ filePath: 'packages/app/src/styles/buttons.css', package: 'app', changeType: 'modify' }];
    expect(classifyTier(changes)).toBe('minor');
  });

  test('backend changes are major', () => {
    const changes = [{ filePath: 'packages/backend/src/routes/toolbar.ts', package: 'backend', changeType: 'create' }];
    expect(classifyTier(changes)).toBe('major');
  });

  test('new frontend component is moderate', () => {
    const changes = [{ filePath: 'packages/app/src/components/NewWidget.tsx', package: 'app', changeType: 'create' }];
    expect(classifyTier(changes)).toBe('moderate');
  });
});
```

**Integration Tests:**

```typescript
describe('Button System E2E', () => {
  test('message context detection triggers correct buttons', async () => {
    // 1. Create session
    const session = await api.post('/api/sessions', { cwd: TEST_DIR });

    // 2. Post event with code change message
    await api.post('/api/events', {
      type: 'step:completed',
      sessionId: session.data.id,
      output: '```typescript\nconst x = 1;\n```',
    });

    // 3. Verify context detector classifies correctly
    const context = detectContext('```typescript\nconst x = 1;\n```');
    expect(context.context).toBe('code-change');

    // 4. Verify buttons filtered for code-change context
    const buttons = activeButtons.filter(b => b.contexts.includes('code-change'));
    expect(buttons.length).toBeGreaterThan(0);
  });
});

describe('Modification Pipeline E2E', () => {
  test('minor modification auto-applies', async () => {
    const proposal = await api.post('/api/modifications', {
      title: 'Reorder toolbar buttons',
      tier: 'minor',
      fileChanges: [{ filePath: 'data/toolbar-config.json', changeType: 'modify', package: 'app' }],
    });

    // Minor tier should auto-approve
    expect(proposal.data.status).toBe('auto-approved');

    // Wait for execution
    await waitForEvent('modification:applied');

    // Verify the change was committed
    expect(proposal.data.git.commitHash).toBeDefined();
  });

  test('major modification requires approval', async () => {
    const proposal = await api.post('/api/modifications', {
      title: 'Add new API endpoint',
      tier: 'major',
      fileChanges: [{ filePath: 'packages/backend/src/routes/newRoute.ts', changeType: 'create', package: 'backend' }],
    });

    expect(proposal.data.status).toBe('pending');

    // Approve
    await api.post(`/api/modifications/${proposal.data.id}/approve`, { approvedBy: 'test-user' });

    // Wait for execution
    await waitForEvent('modification:applied');
  });
});
```

### 9.2 Code Review Checklist

**For Self-Evolving Interface PRs:**

- [ ] **Types:**
  - Branded types for all IDs (ButtonId, BookmarkId, RegistryEntryId, ProposalId)
  - Discriminated unions for new event types
  - Zod schemas for all new API endpoints
  - No `any` types

- [ ] **Security:**
  - Path validation on all file operations in ModificationExecutor
  - Major tier cannot be auto-approved
  - Registry entries cannot execute arbitrary code
  - Git operations never force-push

- [ ] **Performance:**
  - Context detection < 10ms per message
  - Frequency tracking is async (non-blocking)
  - Pattern analysis runs in background
  - Registry resolution is cached

- [ ] **Atomicity:**
  - Modification execution is all-or-nothing
  - Rollback service tested for partial failures
  - Git branch cleanup on failure

### 9.3 Security Audit Checklist

**Before Self-Evolving Interface Production Deploy:**

- [ ] **Self-Modification Safety:**
  - [ ] File writes validated against project root
  - [ ] System paths denied
  - [ ] No code execution from behavior packs
  - [ ] Tier classification is server-side
  - [ ] Major tier requires human approval (no bypass)

- [ ] **Git Safety:**
  - [ ] Never force-push
  - [ ] Never modify main/master directly
  - [ ] Branch naming follows `self-evolve/` prefix
  - [ ] Revert creates new commit, not reset

- [ ] **Data Integrity:**
  - [ ] Registry JSON validated on load
  - [ ] Frequency data has retention limits
  - [ ] Bookmark content sanitized
  - [ ] Proposal diffs validated before execution

---

## SECTION 10: LEARNINGS & IMPROVEMENT AREAS

### 10.1 Technical Debt (Anticipated)

| Item | Severity | Impact | Fix | Effort |
|------|----------|--------|-----|--------|
| Context detection is regex-based (no NLP) | MEDIUM | False positives for edge cases | Phase 2: Add lightweight NLP classification | 2 weeks |
| Pattern analysis is single-threaded | MEDIUM | Blocks for large datasets | Worker threads or background process | 1 week |
| No remote registry for community packs | LOW | Manual pack installation only | Phase 2: Remote pack registry | 3 weeks |
| Modification executor does not support rollback across multiple commits | LOW | Cannot revert batch modifications as a unit | Implement batch modification tracking | 1 week |

### 10.2 Phase 2+ Improvements

1. **NLP-Based Context Detection** (2 weeks)
   - Replace regex with lightweight ML classifier
   - Train on operator feedback (which buttons were actually useful)

2. **Remote Pack Registry** (3 weeks)
   - Central server for community behavior packs
   - Versioning, compatibility checks, reviews

3. **Multi-User Pattern Aggregation** (2 weeks)
   - Aggregate patterns across team members
   - Privacy controls for shared vs. private patterns

4. **Modification Preview Mode** (1 week)
   - Preview self-modifications in isolated sandbox
   - Hot-reload preview before committing

5. **Pattern Visualization Dashboard** (2 weeks)
   - Charts showing action frequencies over time
   - Sequence diagram for detected patterns
   - Confidence trend lines

### 10.3 Design Learnings

**Lesson 1: Tiered Approval Prevents Modification Fatigue**
- Without tiers, every small change requires approval -> operator ignores notifications
- Minor auto-apply + notification keeps operator informed without blocking

**Lesson 2: Git-Native Versioning Is Non-Negotiable**
- Self-modification without version control is irrecoverable
- Every change must be a commit; every revert must be a new commit

**Lesson 3: Registry as Gatekeeper Prevents Drift**
- Without a registry, the system can "learn" behaviors that conflict with each other
- Registry ensures all active behaviors are explicitly registered and resolvable

**Lesson 4: Explicit Bookmarks Are More Valuable Than Implicit Patterns**
- Implicit pattern detection has noise; explicit bookmarks carry operator intent
- Star + "Why?" question bridges implicit observation and explicit signal

---

## APPENDIX A: API ENDPOINT SUMMARY

**~15 New Endpoints across 4 modules:**

| Module | Count | Methods |
|--------|-------|---------|
| Toolbar | 3 | GET /config, PUT /config, POST /track |
| Patterns & Bookmarks | 5 | GET /patterns, POST /analyze, POST /bookmarks, GET /bookmarks, DELETE /bookmarks |
| Registry | 4 | GET /entries, GET /resolved, POST /packs, DELETE /packs |
| Modifications | 5 | POST /submit, POST /approve, POST /reject, POST /revert, GET /list |

---

## APPENDIX B: SHARED TYPE DEFINITIONS

**~30 New Type Definitions across 5 modules:**

- selfEvolvingTypes.ts (2): LayerSource, BehaviorPackId (common types to avoid circular deps)
- buttonTypes.ts (8): ButtonId, ButtonActionType, ButtonAction, ButtonContext, ButtonDefinition, ButtonState, ToolbarSlot, ToolbarConfig
- patternTypes.ts (7): BookmarkId, BookmarkCategory, Bookmark, PatternType, ConfidenceScore, ActionSequence, PatternAction
- registryTypes.ts (4): RegistryEntryId, RegistryEntryType, RegistryEntry, BehaviorPack
- modificationTypes.ts (6): ProposalId, ModificationTier, ProposalStatus, FileChange, ModificationProposal, ModifierAction

**8 New Event Types (added to events.ts):**

- PatternDetectedEvent
- FrequencyUpdatedEvent
- BookmarkCreatedEvent
- ModificationProposedEvent
- ModificationApprovedEvent
- ModificationAppliedEvent
- ModificationFailedEvent
- RegistryChangedEvent

---

## APPENDIX C: DEFERRED REQUIREMENTS

The following LOW-priority FRD requirements are **not included** in the 13-week implementation plan. They are listed here for traceability and may be addressed in future phases.

| FRD ID | Requirement | FRD Section | Priority | Reason for Deferral |
|--------|-------------|-------------|----------|---------------------|
| BTN-07 | Buttons support keyboard shortcuts (e.g., Ctrl+1 for first button) | 5.1.1 Inline Contextual Buttons | LOW | Accessibility enhancement; not required for core button functionality |
| TBR-07 | Toolbar supports drag-and-drop reordering | 5.1.2 Persistent Toolbar | LOW | UX polish; manual pin/unpin provides sufficient control |
| TBR-08 | Toolbar buttons show usage count badge (optional, configurable) | 5.1.2 Persistent Toolbar | LOW | Informational feature; frequency data is available via API if needed |
| STR-07 | Export starred items as a collection (for sharing or review) | 5.2.3 Explicit Bookmarks | LOW | Export/sharing capability; bookmarks are browsable without export |
| FRQ-05 | Retain frequency data for configurable duration (default 90 days) | 5.2.2 Action Frequency Tracking | LOW | Default retention is hardcoded; configurability is a convenience feature |
| PAT-06 | Pattern categories: workflow patterns, preference patterns, error recovery patterns | 5.2.1 Conversation Analysis | LOW | Pattern type discrimination exists in PatternType enum; explicit categorization is additive |

> **Note:** These requirements remain valid and may be implemented as incremental improvements after the core 4-phase plan is complete. They should be re-evaluated during Phase 2+ planning.

---

## CONCLUSION

This SRD provides a complete technical specification for the Self-Evolving Interface across four layers:

1. **Button Rendering:** Inline contextual buttons with regex-based context detection, new persistent toolbar (`PersistentToolbar.tsx`) with frequency ordering, integration with existing command system (note: `QuickActionBar` is session-scoped and is not extended for the persistent toolbar)
2. **Pattern Detection:** Frequency tracking, sequence detection, bookmark system with intent capture, confidence scoring with configurable thresholds and decay
3. **Registry & Behavior Packs:** Central registry with file-based storage, behavior pack install/uninstall, three-layer resolution (core -> pack -> project), conflict detection
4. **Self-Modification Pipeline:** Proposal generation from patterns, tiered approval (minor/moderate/major), atomic execution with rollback, git-native versioning with branch-per-modification

**Critical Success Factors:**
- Context detection accuracy (< 20% false positive rate)
- Pattern confidence threshold tuning (0.7 proposal, 0.9 auto-apply)
- Modification atomicity (all-or-nothing with rollback)
- Git safety (never force-push, never modify main directly)
- Tiered approval enforcement (major tier always requires human review)

**Implementation:** 29 steps across 4 phases (~13 weeks), critical path ~5 weeks, with significant parallelization opportunity in UI components.

---

**Document Status:** COMPLETE
**Approval:** Ready for Phase 1 Implementation (Button System)
**Next Steps:** Begin Phase 1 Step 1 (Define shared button types)

---

**Cross-References:**
- [FRD-SelfEvolvingUI.md](./FRD-SelfEvolvingUI.md) -- Functional requirements for Self-Evolving Interface
- [FRD.md](./FRD.md) -- ActionFlows Dashboard functional requirements (existing system)
- [SRD.md](./SRD.md) -- ActionFlows Dashboard software requirements (existing system)
- [DOCS_INDEX.md](./DOCS_INDEX.md) -- Documentation index
