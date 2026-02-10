# Analysis: Dashboard Components and Discuss Button Integration

**Analysis Type:** inventory
**Scope:** packages/app/src/components/ + CustomPromptButton system
**Date:** 2026-02-10
**Agent:** analyze/inventory

---

## Executive Summary

This analysis provides a complete inventory of all dashboard components and a deep dive into the existing CustomPromptButton system. The goal is to enable integration of a "Let's Discuss" button across major dashboard components.

### Key Findings

1. **94 component files** identified across the dashboard (TSX + TS)
2. **CustomPromptButton system** is mature and fully integrated with chat/session system
3. **42 major panel/widget components** identified as candidates for discuss button integration
4. **Clear integration pattern** exists via dialog → hook → chat system → backend API

---

## 1. Component Inventory

### 1.1 Total Component Count

- **Total files:** 94 (TSX + TS)
- **Component directories:** 44
- **Panel-level components:** 42 (candidates for discuss button)
- **Sub-components:** 52 (excluded from discuss button)

### 1.2 Major Panel/Widget Components (Discuss Button Candidates)

These are the primary dashboard components that users interact with and would benefit from contextual discussion:

#### Session & Chat Components
| Component | Path | Purpose | Panel Type |
|-----------|------|---------|------------|
| **ChatPanel** | SessionPanel/ChatPanel.tsx | Mobile-format chat interface with message bubbles | Primary Panel |
| **ConversationPanel** | ConversationPanel/ConversationPanel.tsx | Claude output display with response UI | Primary Panel |
| **SessionPane** | SessionPane/SessionPane.tsx | Session container/wrapper | Container |
| **SessionPanelLayout** | SessionPanel/SessionPanelLayout.tsx | Main 25-75 split layout manager | Layout |

#### Visualization Components
| Component | Path | Purpose | Panel Type |
|-----------|------|---------|------------|
| **FlowVisualization** | FlowVisualization/FlowVisualization.tsx | ReactFlow swimlane visualization | Primary Panel |
| **ChainDAG** | ChainDAG/ChainDAG.tsx | DAG graph visualization with ReactFlow | Primary Panel |
| **TimelineView** | TimelineView/TimelineView.tsx | Horizontal timeline with parallel steps | Primary Panel |
| **SquadPanel** | SquadPanel/SquadPanel.tsx | Orchestrator + subagents arrangement | Primary Panel |

#### Inspection & Details Components
| Component | Path | Purpose | Panel Type |
|-----------|------|---------|------------|
| **StepInspector** | StepInspector/StepInspector.tsx | Detailed step inspection side panel | Primary Panel |
| **HarmonyPanel** | HarmonyPanel/HarmonyPanel.tsx | Full harmony metrics dashboard | Primary Panel |
| **HarmonyIndicator** | HarmonyIndicator/HarmonyIndicator.tsx | Compact harmony status widget | Widget |
| **ChangePreview** | ChangePreview/ChangePreview.tsx | File change preview panel | Primary Panel |
| **DiffView** | CodeEditor/DiffView.tsx | Monaco side-by-side diff editor | Primary Panel |

#### Command & Control Components
| Component | Path | Purpose | Panel Type |
|-----------|------|---------|------------|
| **ControlButtons** | ControlButtons/ControlButtons.tsx | Session control buttons (pause/resume/cancel) | Widget |
| **CommandPalette** | CommandPalette/CommandPalette.tsx | Modal command search/execution | Modal |
| **QuickActionBar** | QuickActionBar/QuickActionBar.tsx | Quick action toolbar | Widget |
| **InlineButtons** | InlineButtons/InlineButtons.tsx | Context-aware button row (below messages) | Widget |

#### Registry & Settings Components
| Component | Path | Purpose | Panel Type |
|-----------|------|---------|------------|
| **RegistryBrowser** | RegistryBrowser/RegistryBrowser.tsx | Browse/manage registry entries and packs | Primary Panel |
| **SessionArchive** | SessionArchive/SessionArchive.tsx | Archived sessions browser | Primary Panel |
| **Settings** | Settings/QuickActionSettings.tsx | Settings configuration panel | Primary Panel |

#### Intel & Dossier Components
| Component | Path | Purpose | Panel Type |
|-----------|------|---------|------------|
| **DossierView** | IntelDossier/DossierView.tsx | Full dossier display with widgets | Primary Panel |
| **DossierList** | IntelDossier/DossierList.tsx | Dossier browser/list | Primary Panel |
| **DossierCard** | IntelDossier/DossierCard.tsx | Single dossier preview card | Widget |

#### Terminal & CLI Components
| Component | Path | Purpose | Panel Type |
|-----------|------|---------|------------|
| **TerminalPanel** | Terminal/TerminalPanel.tsx | xterm.js terminal emulator | Primary Panel |
| **ClaudeCliTerminal** | ClaudeCliTerminal/ClaudeCliTerminal.tsx | Claude CLI terminal interface | Primary Panel |

#### Workbench Components (Context-Specific Panels)
| Component | Path | Purpose | Panel Type |
|-----------|------|---------|------------|
| **ArchiveWorkbench** | Workbench/ArchiveWorkbench.tsx | Archive context view | Workbench |
| **CanvasWorkbench** | Workbench/CanvasWorkbench.tsx | Canvas context view | Workbench |
| **EditorWorkbench** | Workbench/EditorWorkbench.tsx | Editor context view | Workbench |
| **ExploreWorkbench** | Workbench/ExploreWorkbench.tsx | Explore context view | Workbench |
| **HarmonyWorkbench** | Workbench/HarmonyWorkbench.tsx | Harmony context view | Workbench |
| **IntelWorkbench** | Workbench/IntelWorkbench.tsx | Intel dossier workbench | Workbench |
| **MaintenanceWorkbench** | Workbench/MaintenanceWorkbench.tsx | Maintenance context view | Workbench |
| **PMWorkbench** | Workbench/PMWorkbench.tsx | Project management workbench | Workbench |
| **ReviewWorkbench** | Workbench/ReviewWorkbench.tsx | Code review workbench | Workbench |
| **SettingsWorkbench** | Workbench/SettingsWorkbench.tsx | Settings workbench | Workbench |
| **WorkWorkbench** | Workbench/WorkWorkbench.tsx | Work context view | Workbench |
| **RespectWorkbench** | Workbench/RespectWorkbench/RespectWorkbench.tsx | Spatial boundary monitoring | Workbench |

#### Sidebar & Navigation Components
| Component | Path | Purpose | Panel Type |
|-----------|------|---------|------------|
| **SessionSidebar** | SessionSidebar/SessionSidebar.tsx | Session list sidebar | Sidebar |
| **DashboardSidebar** | DashboardSidebar/DashboardSidebar.tsx | Main dashboard sidebar | Sidebar |
| **TopBar** | TopBar/TopBar.tsx | Top navigation bar with tabs | Navigation |
| **PersistentToolbar** | PersistentToolbar/PersistentToolbar.tsx | Always-visible toolbar | Toolbar |

#### File & Tree Components
| Component | Path | Purpose | Panel Type |
|-----------|------|---------|------------|
| **FileExplorer** | FileExplorer/FileTree.tsx | File tree browser | Primary Panel |
| **SessionTree** | SessionTree/SessionTree.tsx | Session hierarchy tree | Widget |

### 1.3 Sub-Components (Excluded from Discuss Button)

These are small, reusable components that don't need individual discuss buttons:

#### Node & Edge Components (ReactFlow)
- AnimatedStepNode.tsx
- StepNode.tsx
- AnimatedFlowEdge.tsx
- SwimlaneBackground.tsx

#### Card & Item Components
- AgentCharacterCard.tsx
- AgentRow.tsx
- AgentAvatar.tsx
- LogBubble.tsx
- ChainBadge.tsx
- HarmonyBadge.tsx
- ModifierCard.tsx
- PackCard.tsx
- RegistryEntryCard.tsx
- SessionSidebarItem.tsx
- InlineButtonItem.tsx
- QuickActionButton.tsx
- PersistentToolbarButton.tsx
- WorkbenchTab.tsx

#### Dialog & Modal Components
- CustomPromptDialog.tsx
- DisambiguationModal.tsx
- ConflictDialog.tsx
- DossierCreationDialog.tsx
- ClaudeCliStartDialog.tsx
- StarBookmarkDialog.tsx

#### Form & Input Components
- CommandPaletteInput.tsx
- CommandPaletteResults.tsx
- ProjectForm.tsx
- ProjectSelector.tsx
- EditorTabs.tsx

#### Widget & Indicator Components
- GlowIndicator.tsx
- VimModeIndicator.tsx
- ThemeToggle.tsx
- Toast.tsx
- StarBookmark.tsx

#### Intel Dossier Widgets
- AlertPanelWidget.tsx
- CodeHealthMeterWidget.tsx
- FileTreeWidget.tsx
- InsightCardWidget.tsx
- SnippetPreviewWidget.tsx
- StatCardWidget.tsx
- UnknownWidget.tsx
- WidgetRenderer.tsx

#### Respect Workbench Sub-Components
- CategorySection.tsx
- ComponentHealthCard.tsx
- LiveSpatialMonitor.tsx
- RespectCheckControls.tsx

#### Utility Components
- AppContent.tsx
- WebSocketTest.tsx
- ChainDemo.tsx
- ChainLiveMonitor.tsx
- HistoryBrowser.tsx
- HybridFlowViz.tsx
- SquadPanelDemo.tsx
- DiscoveredSessionsList.tsx
- FolderHierarchy.tsx
- ResizeHandle.tsx
- FileIcon.tsx

---

## 2. CustomPromptButton System Deep Dive

### 2.1 System Architecture

The CustomPromptButton system enables users to create reusable prompt buttons that integrate with the chat/session system. It follows a clean separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                    USER INTERACTION                          │
│  RegistryBrowser → CustomPromptDialog → Create Button       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  BACKEND STORAGE                             │
│  POST /api/registry/entries → Store in Registry             │
│  WebSocket: Broadcast registry:changed event                │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  FRONTEND HOOK                               │
│  useCustomPromptButtons → Fetch & Subscribe → ButtonDefs    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  BUTTON DISPLAY                              │
│  InlineButtons → Filter by Context → Render Buttons         │
│  QuickActionBar → Merge with Core Buttons → Display         │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Key Components

#### A. CustomPromptDialog.tsx

**Location:** `packages/app/src/components/CustomPromptButton/CustomPromptDialog.tsx`

**Purpose:** Modal dialog for creating custom prompt buttons

**Fields:**
- `label` (required) - Button display text (max 100 chars)
- `prompt` (required) - Text sent when clicked (max 2000 chars)
- `icon` (optional) - Emoji or icon (max 10 chars, defaults to 💬)
- `contextPatterns` (optional) - Regex patterns for context detection (one per line)
- `alwaysShow` (optional) - Checkbox to ignore context detection

**Key Methods:**
- `onSubmit(label, prompt, icon?, contextPatterns?, alwaysShow?)` - Callback with form data
- `onCancel()` - Close dialog without saving
- Form validation: Both label and prompt must be non-empty

**Design Pattern:** Follows StarBookmarkDialog pattern for consistency

**Example Integration:**
```tsx
import { CustomPromptDialog } from '../CustomPromptButton';

const [showDialog, setShowDialog] = useState(false);

const handleCreate = async (label, prompt, icon, contextPatterns, alwaysShow) => {
  // POST to /api/registry/entries
  // payload: { type: 'custom-prompt', data: { definition: {...} } }
};

{showDialog && (
  <CustomPromptDialog
    onSubmit={handleCreate}
    onCancel={() => setShowDialog(false)}
    isLoading={isCreating}
  />
)}
```

---

#### B. useCustomPromptButtons Hook

**Location:** `packages/app/src/hooks/useCustomPromptButtons.ts`

**Purpose:** Fetches custom prompt entries from registry and converts to ButtonDefinitions

**Signature:**
```typescript
function useCustomPromptButtons(projectId?: ProjectId): {
  buttons: ButtonDefinition[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}
```

**Key Features:**
1. **Fetches from backend:** `GET /api/registry/entries?type=custom-prompt&enabled=true&projectId=...`
2. **Converts to ButtonDefinitions:** Maps registry entries to button format
3. **Context pattern conversion:** Uses `convertPatternsToContexts()` to infer ButtonContext from regex patterns
4. **WebSocket subscription:** Listens for `registry:changed` events and auto-refetches
5. **Real-time sync:** Buttons update when registry changes (create/delete/toggle)

**Context Inference Logic:**
```typescript
function convertPatternsToContexts(patterns?: string[]): ButtonContext[] {
  // Analyzes regex patterns to infer contexts:
  // - .ts/.tsx/.js/.py → 'code-change', 'file-modification'
  // - error/bug/fix → 'error-message'
  // - report/analysis → 'analysis-report'
  // - .md/readme/doc → 'file-modification'
  // - Default: 'general'
}
```

**WebSocket Integration:**
```typescript
useEffect(() => {
  const handleRegistryEvent = (event: WorkspaceEvent) => {
    if (event.type === 'registry:changed') {
      fetchCustomPrompts(); // Auto-refresh
    }
  };
  const unsubscribe = wsContext.onEvent(handleRegistryEvent);
  return unsubscribe;
}, [wsContext, fetchCustomPrompts]);
```

---

#### C. InlineButtons Integration

**Location:** `packages/app/src/components/InlineButtons/InlineButtons.tsx`

**Purpose:** Displays context-aware buttons below Claude response messages

**Integration Pattern:**
```tsx
import { useCustomPromptButtons } from '../../hooks/useCustomPromptButtons';

export function InlineButtons({ messageContent, sessionId, buttons, projectId, ... }) {
  // 1. Fetch custom prompt buttons
  const { buttons: customPromptButtons } = useCustomPromptButtons(projectId);

  // 2. Merge with provided buttons
  const allButtons = useMemo(
    () => [...buttons, ...customPromptButtons],
    [buttons, customPromptButtons]
  );

  // 3. Detect context from message content
  const detectedContext = useMemo(() => {
    return detectContext(messageContent).context;
  }, [messageContent]);

  // 4. Filter buttons by matching context
  const filteredButtons = useMemo(() => {
    return allButtons
      .filter(button => button.enabled && button.contexts.includes(detectedContext))
      .sort((a, b) => a.priority - b.priority);
  }, [allButtons, detectedContext]);

  // 5. Render filtered buttons
  return (
    <div className="inline-buttons-container">
      {filteredButtons.map(button => (
        <InlineButtonItem key={button.id} button={button} sessionId={sessionId} />
      ))}
    </div>
  );
}
```

**Key Points:**
- Custom prompts automatically merge with core buttons
- Context detection filters buttons to relevant ones
- Priority sorting ensures consistent ordering
- Empty state renders nothing (no buttons = no container)

---

#### D. RegistryBrowser Integration

**Location:** `packages/app/src/components/RegistryBrowser/RegistryBrowser.tsx`

**Purpose:** Browse/manage registry entries + create custom prompts

**Create Flow:**
```tsx
const [showCustomPromptDialog, setShowCustomPromptDialog] = useState(false);
const [isCreatingPrompt, setIsCreatingPrompt] = useState(false);

const handleCreateCustomPrompt = async (
  label: string,
  prompt: string,
  icon?: string,
  contextPatterns?: string[],
  alwaysShow?: boolean
) => {
  setIsCreatingPrompt(true);
  try {
    const response = await fetch(`${BACKEND_URL}/api/registry/entries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: label,
        description: `Custom prompt: ${prompt.substring(0, 50)}...`,
        type: 'custom-prompt',
        source: { type: 'project', projectId: projectId || '' },
        version: '1.0.0',
        status: 'active',
        enabled: true,
        data: {
          type: 'custom-prompt',
          definition: { label, prompt, icon, contextPatterns, alwaysShow },
        },
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create custom prompt');
    }

    await fetchData(); // Refresh entries list
    setShowCustomPromptDialog(false);
    showToast('Custom prompt created!', 'success');
  } catch (error) {
    showToast(`Failed: ${error.message}`, 'error');
  } finally {
    setIsCreatingPrompt(false);
  }
};

// UI Elements:
<button onClick={() => setShowCustomPromptDialog(true)}>
  + Custom Prompt
</button>

{showCustomPromptDialog && (
  <CustomPromptDialog
    onSubmit={handleCreateCustomPrompt}
    onCancel={() => setShowCustomPromptDialog(false)}
    isLoading={isCreatingPrompt}
  />
)}
```

---

### 2.3 Data Flow

#### Creation Flow
```
1. User clicks "+ Custom Prompt" in RegistryBrowser
2. CustomPromptDialog opens with form
3. User fills: label, prompt, icon, contextPatterns, alwaysShow
4. User clicks "Create Button"
5. RegistryBrowser POSTs to /api/registry/entries
6. Backend stores entry + broadcasts registry:changed event
7. useCustomPromptButtons receives WebSocket event
8. Hook refetches entries from backend
9. InlineButtons merges new button into available buttons
10. Button appears in relevant contexts immediately
```

#### Display Flow
```
1. Component renders with useCustomPromptButtons(projectId)
2. Hook fetches GET /api/registry/entries?type=custom-prompt&enabled=true
3. Hook converts entries to ButtonDefinition[] format
4. Hook subscribes to registry:changed events
5. InlineButtons merges custom + core buttons
6. detectContext() analyzes message content
7. Filter buttons by matching context
8. Sort by priority
9. Render matching buttons
```

#### Update Flow (Registry Changes)
```
1. Registry changes (create/delete/toggle entry)
2. Backend broadcasts registry:changed event via WebSocket
3. useCustomPromptButtons receives event
4. Hook calls refetch()
5. Fresh button list returned
6. InlineButtons re-renders with updated buttons
7. UI updates immediately (no page refresh needed)
```

---

### 2.4 Type Definitions

#### ButtonDefinition (from @afw/shared)

**Location:** `packages/shared/src/buttonTypes.ts`

```typescript
export interface ButtonDefinition {
  id: ButtonId;                    // Unique identifier (branded string)
  label: string;                   // Display text
  icon?: string;                   // Emoji or icon name
  action: ButtonAction;            // What happens on click
  contexts: ButtonContext[];       // Where to show (context filtering)
  shortcut?: string;               // Keyboard shortcut
  source: LayerSource;             // Where defined (core/pack/project)
  priority: number;                // Sort order (lower = higher priority)
  enabled: boolean;                // Toggle on/off
}
```

#### ButtonAction
```typescript
export interface ButtonAction {
  type: ButtonActionType;          // command | api-call | quick-action | clipboard | navigate | custom
  commandType?: CommandTypeString; // For 'command' type
  endpoint?: string;               // For 'api-call' type
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  target?: string;                 // For 'navigate' type
  payload?: Record<string, unknown>; // Generic payload
}
```

#### ButtonContext (Context Categories)
```typescript
export type ButtonContext =
  | 'code-change'          // Code modifications and patches
  | 'error-message'        // Error logs and failure diagnostics
  | 'analysis-report'      // Analysis results and assessments
  | 'question-prompt'      // Questions and user prompts
  | 'file-modification'    // File create/update/delete operations
  | 'general';             // Generic content
```

#### CustomPromptDefinition (Registry Data)
```typescript
export interface CustomPromptDefinition {
  label: string;               // Button label (shown in UI)
  prompt: string;              // Text to send when clicked
  icon?: string;               // Optional emoji/icon
  contextPatterns?: string[];  // Optional regex patterns for context detection
  alwaysShow?: boolean;        // Optional: show in all contexts
}
```

---

### 2.5 Backend API Integration

#### POST /api/registry/entries
**Purpose:** Create a new custom prompt button

**Request Body:**
```json
{
  "name": "Explain Code",
  "description": "Custom prompt: Please explain this code in detail...",
  "type": "custom-prompt",
  "source": { "type": "project", "projectId": "proj-123" },
  "version": "1.0.0",
  "status": "active",
  "enabled": true,
  "data": {
    "type": "custom-prompt",
    "definition": {
      "label": "Explain Code",
      "prompt": "Please explain this code in detail, including what each function does...",
      "icon": "💬",
      "contextPatterns": [".*\\.tsx$", ".*\\.ts$"],
      "alwaysShow": false
    }
  }
}
```

**Response:** Created registry entry with generated ID

#### GET /api/registry/entries
**Purpose:** Fetch custom prompt buttons

**Query Params:**
- `type=custom-prompt` - Filter by entry type
- `enabled=true` - Only enabled entries
- `projectId=proj-123` - Scope to project

**Response:**
```json
[
  {
    "id": "entry-abc123",
    "name": "Explain Code",
    "type": "custom-prompt",
    "enabled": true,
    "source": { "type": "project", "projectId": "proj-123" },
    "data": {
      "definition": {
        "label": "Explain Code",
        "prompt": "Please explain...",
        "icon": "💬",
        "contextPatterns": [".*\\.tsx$"],
        "alwaysShow": false
      }
    }
  }
]
```

#### PATCH /api/registry/entries/:id
**Purpose:** Toggle enabled status

**Request Body:**
```json
{ "enabled": true }
```

#### DELETE /api/registry/entries/:id
**Purpose:** Delete a custom prompt button

**Response:** 204 No Content

#### WebSocket Events
**Event:** `registry:changed`

**Payload:**
```json
{
  "type": "registry:changed",
  "entryId": "entry-abc123",
  "operation": "create" | "update" | "delete",
  "timestamp": "2026-02-10T02:39:23Z"
}
```

---

## 3. Integration Pattern for "Let's Discuss" Button

### 3.1 Recommended Approach

Based on the existing CustomPromptButton system, here's the recommended pattern for adding a "Let's Discuss" button to dashboard components:

#### Option A: Component-Level Button (Recommended)

Each major panel component gets its own discuss button that:
1. Appears in the component's header/toolbar area
2. Opens a lightweight dialog for message composition
3. Auto-populates context about the component (name, current state, data)
4. Sends message to chat with component context attached

**Advantages:**
- Always visible (no context filtering needed)
- Component-specific context (knows what user is viewing)
- Can include component state/data in message
- More discoverable than context-aware buttons

**Example Integration:**
```tsx
import { useState } from 'react';
import { useChatContext } from '../../contexts/ChatContext';

export function FlowVisualization({ chain, ... }) {
  const [showDiscussDialog, setShowDiscussDialog] = useState(false);
  const { sendMessage } = useChatContext();

  const handleDiscuss = async (message: string) => {
    const context = {
      component: 'FlowVisualization',
      chainId: chain.id,
      stepCount: chain.steps.length,
      status: chain.status,
    };
    await sendMessage(message, { componentContext: context });
    setShowDiscussDialog(false);
  };

  return (
    <div className="flow-visualization">
      <div className="flow-header">
        <h3>Flow Visualization</h3>
        <button
          className="discuss-button"
          onClick={() => setShowDiscussDialog(true)}
          title="Discuss this visualization with Claude"
        >
          💬 Let's Discuss
        </button>
      </div>
      {/* ... rest of component ... */}

      {showDiscussDialog && (
        <DiscussDialog
          componentName="Flow Visualization"
          onSubmit={handleDiscuss}
          onCancel={() => setShowDiscussDialog(false)}
        />
      )}
    </div>
  );
}
```

#### Option B: Registry-Based Button (Alternative)

Create a core registry entry for "Let's Discuss" button that:
1. Uses ButtonDefinition with `type: 'quick-action'`
2. Appears in InlineButtons with `alwaysShow: true`
3. Sends a generic "discuss this" prompt

**Advantages:**
- Leverages existing button infrastructure
- Centralized management
- Can be disabled/customized per project

**Disadvantages:**
- Only appears below messages (not on components)
- No component-specific context
- Less discoverable

---

### 3.2 Required Components for Integration

To fully implement the "Let's Discuss" button system, you'll need:

#### New Components to Create

1. **DiscussDialog.tsx**
   - Lightweight modal for message composition
   - Pre-filled component context (read-only display)
   - Text area for user message
   - Submit/Cancel buttons
   - Similar to CustomPromptDialog but simpler (no form fields)

2. **useDiscussButton.ts** (Hook)
   - Manages discuss dialog state
   - Sends message with component context
   - Handles chat integration
   - Returns `{ openDiscuss, DiscussDialog component }`

3. **ComponentContext Type** (Type Definition)
   ```typescript
   interface ComponentContext {
     component: string;        // Component name
     data?: Record<string, unknown>; // Component-specific data
     state?: string;           // Current state (if applicable)
     metadata?: {              // Optional metadata
       timestamp: string;
       sessionId?: SessionId;
       chainId?: ChainId;
       stepNumber?: StepNumber;
     };
   }
   ```

#### Integration Points

**ChatContext or ChatService:**
- Add `sendMessage(message: string, options?: { componentContext?: ComponentContext })`
- Backend should log component context for debugging
- Claude should receive context as system message

**Backend API:**
- Extend message endpoint to accept `componentContext`
- Store context with message in session history
- Include context when streaming to Claude

---

### 3.3 Component-Specific Context Examples

When a user clicks "Let's Discuss" on different components, the context should be tailored:

#### FlowVisualization Context
```typescript
{
  component: 'FlowVisualization',
  chainId: 'chain-123',
  stepCount: 5,
  status: 'in_progress',
  currentStep: 3,
  swimlanes: ['orchestrator', 'analyze', 'code'],
}
```

#### StepInspector Context
```typescript
{
  component: 'StepInspector',
  stepNumber: 3,
  action: 'analyze/architecture',
  status: 'completed',
  duration: 45000,
  model: 'claude-sonnet-4.5',
}
```

#### HarmonyPanel Context
```typescript
{
  component: 'HarmonyPanel',
  harmonyPercentage: 94,
  totalChecks: 15,
  violationCount: 1,
  degradedCount: 0,
}
```

#### DiffView Context
```typescript
{
  component: 'DiffView',
  filePath: 'packages/app/src/components/ChatPanel.tsx',
  linesAdded: 42,
  linesRemoved: 18,
  hasPreviousVersion: true,
}
```

---

### 3.4 Implementation Checklist

**Phase 1: Core Infrastructure**
- [ ] Create `DiscussDialog.tsx` component
- [ ] Create `useDiscussButton.ts` hook
- [ ] Define `ComponentContext` type in shared
- [ ] Extend `ChatContext` with component context support
- [ ] Update backend message endpoint

**Phase 2: Component Integration (High Priority)**
- [ ] ChatPanel
- [ ] FlowVisualization
- [ ] ChainDAG
- [ ] StepInspector
- [ ] HarmonyPanel
- [ ] RegistryBrowser
- [ ] DiffView
- [ ] SquadPanel

**Phase 3: Component Integration (Medium Priority)**
- [ ] TimelineView
- [ ] DossierView
- [ ] TerminalPanel
- [ ] CommandPalette
- [ ] SessionArchive
- [ ] FileExplorer
- [ ] All Workbench components

**Phase 4: Component Integration (Low Priority)**
- [ ] ConversationPanel
- [ ] ControlButtons
- [ ] QuickActionBar
- [ ] HarmonyIndicator
- [ ] Settings

**Phase 5: Polish & Testing**
- [ ] Add keyboard shortcut (e.g., Ctrl+/)
- [ ] Add button styling/theming
- [ ] Add tooltip with component context preview
- [ ] Test context serialization
- [ ] Test chat integration
- [ ] Add analytics/tracking

---

## 4. Key Integration Points

### 4.1 Where to Add the Button in Components

Based on component analysis, here are the recommended button placements:

#### Panel Components with Headers
**Pattern:** Add button to header toolbar area (right side)

**Example Components:**
- FlowVisualization
- ChainDAG
- HarmonyPanel
- RegistryBrowser
- DiffView
- All Workbench components

**JSX Location:**
```tsx
<div className="component-header">
  <h3>Component Title</h3>
  <div className="header-actions">
    {/* Existing action buttons */}
    <button className="discuss-button" onClick={handleDiscuss}>
      💬 Let's Discuss
    </button>
  </div>
</div>
```

#### Panel Components without Headers
**Pattern:** Add floating button (bottom-right corner) or integrate with existing toolbar

**Example Components:**
- ChatPanel (integrate with input area)
- TerminalPanel (floating button)
- CommandPalette (integrate with results)

#### Widget Components
**Pattern:** Small icon button (top-right corner of widget)

**Example Components:**
- HarmonyIndicator
- ControlButtons
- DossierCard

---

### 4.2 Chat Integration Points

**Primary Chat Component:** `ChatPanel.tsx`

**Message Sending:**
```typescript
// In ChatPanel.tsx
const handleSendMessage = async (message: string, context?: ComponentContext) => {
  const fullMessage = context
    ? `[Context: ${context.component}]\n${message}`
    : message;

  await claudeCliService.sendMessage(sessionId, fullMessage, cwd);
  addUserMessage(fullMessage, context);
};
```

**Backend Integration:**
```typescript
// Backend endpoint: POST /api/sessions/:sessionId/messages
{
  "message": "Can you explain why step 3 failed?",
  "componentContext": {
    "component": "StepInspector",
    "stepNumber": 3,
    "action": "analyze/architecture",
    "status": "failed"
  }
}
```

---

### 4.3 CSS Class Naming Convention

To maintain consistency, use this naming pattern:

```css
/* Button */
.discuss-button {
  /* Base button styles */
}

/* Button states */
.discuss-button:hover { }
.discuss-button:active { }
.discuss-button:disabled { }

/* Button variants */
.discuss-button--small { }    /* For widget components */
.discuss-button--floating { } /* For floating buttons */
.discuss-button--icon-only { } /* Icon without text */

/* Dialog */
.discuss-dialog { }
.discuss-dialog__backdrop { }
.discuss-dialog__header { }
.discuss-dialog__body { }
.discuss-dialog__context { }  /* Context display area */
.discuss-dialog__input { }    /* Message text area */
.discuss-dialog__actions { }  /* Submit/Cancel buttons */
```

---

## 5. Recommendations

### 5.1 Priority Tiers for Integration

**Tier 1: Critical Components (Implement First)**
These components are the most frequently used and would benefit most:
1. ChatPanel
2. FlowVisualization
3. ChainDAG
4. StepInspector
5. HarmonyPanel

**Tier 2: High-Value Components (Implement Second)**
6. DiffView
7. RegistryBrowser
8. SquadPanel
9. TimelineView
10. All Workbench components

**Tier 3: Secondary Components (Implement Third)**
11. DossierView
12. TerminalPanel
13. CommandPalette
14. SessionArchive
15. FileExplorer

**Tier 4: Widget Components (Optional)**
16. HarmonyIndicator
17. ControlButtons
18. QuickActionBar
19. DossierCard
20. SessionSidebar

### 5.2 Design Considerations

1. **Button Visibility:**
   - Use consistent icon (💬 or 🗨️)
   - Keep label short ("Discuss" or "Ask Claude")
   - Position consistently (top-right of panels)

2. **Context Quality:**
   - Include relevant component state
   - Serialize data carefully (avoid circular refs)
   - Add timestamps for debugging

3. **User Experience:**
   - Show loading state during message send
   - Provide visual feedback (button pulse)
   - Auto-focus chat panel after send
   - Consider keyboard shortcut (Ctrl+/)

4. **Performance:**
   - Lazy load DiscussDialog component
   - Debounce context serialization
   - Cache component context between renders

5. **Accessibility:**
   - Add ARIA labels
   - Support keyboard navigation
   - Provide screen reader text

### 5.3 Future Enhancements

1. **Smart Context Detection:**
   - Analyze component props/state to auto-suggest questions
   - Pre-fill common questions based on component type
   - Learn from user discussion patterns

2. **Multi-Component Context:**
   - Allow discussing multiple components together
   - Compare visualizations (e.g., DAG vs Timeline)
   - Reference other panels in discussion

3. **Discussion History:**
   - Track which components were discussed
   - Show discussion badges on components
   - Link discussions to session logs

4. **Quick Prompts:**
   - Component-specific prompt templates
   - "Why is this step failing?" (StepInspector)
   - "Explain this pattern" (FlowVisualization)
   - "How can I improve this?" (HarmonyPanel)

---

## 6. Files Reference

### 6.1 Existing Files to Study

**CustomPromptButton System:**
- `packages/app/src/components/CustomPromptButton/CustomPromptDialog.tsx`
- `packages/app/src/components/CustomPromptButton/CustomPromptDialog.css`
- `packages/app/src/hooks/useCustomPromptButtons.ts`
- `packages/app/src/components/InlineButtons/InlineButtons.tsx`
- `packages/app/src/components/InlineButtons/InlineButtonItem.tsx`
- `packages/app/src/components/RegistryBrowser/RegistryBrowser.tsx`

**Chat/Message Integration:**
- `packages/app/src/components/SessionPanel/ChatPanel.tsx`
- `packages/app/src/components/ConversationPanel/ConversationPanel.tsx`
- `packages/app/src/hooks/useChatMessages.ts`
- `packages/app/src/services/claudeCliService.ts`

**Type Definitions:**
- `packages/shared/src/buttonTypes.ts`
- `packages/shared/src/types.ts`

**Major Panel Components:**
- `packages/app/src/components/FlowVisualization/FlowVisualization.tsx`
- `packages/app/src/components/ChainDAG/ChainDAG.tsx`
- `packages/app/src/components/StepInspector/StepInspector.tsx`
- `packages/app/src/components/HarmonyPanel/HarmonyPanel.tsx`
- `packages/app/src/components/SquadPanel/SquadPanel.tsx`

### 6.2 New Files to Create

**Core Components:**
- `packages/app/src/components/DiscussButton/DiscussButton.tsx`
- `packages/app/src/components/DiscussButton/DiscussDialog.tsx`
- `packages/app/src/components/DiscussButton/DiscussButton.css`
- `packages/app/src/components/DiscussButton/index.ts`

**Hooks:**
- `packages/app/src/hooks/useDiscussButton.ts`

**Types:**
- `packages/shared/src/discussTypes.ts` (ComponentContext interface)

**Tests:**
- `packages/app/src/components/DiscussButton/DiscussButton.test.tsx`
- `packages/app/src/components/DiscussButton/DiscussDialog.test.tsx`
- `packages/app/src/hooks/useDiscussButton.test.ts`

---

## 7. Next Steps

### 7.1 Immediate Actions

1. **Create DiscussButton component infrastructure**
   - Implement DiscussDialog.tsx
   - Implement useDiscussButton.ts hook
   - Define ComponentContext type

2. **Integrate with ChatPanel**
   - Add component context support to message sending
   - Update backend message endpoint
   - Test context serialization

3. **Pilot Integration (Tier 1 Component)**
   - Choose FlowVisualization as pilot
   - Add discuss button to header
   - Test full flow end-to-end
   - Gather feedback

4. **Expand to Tier 1 Components**
   - Roll out to ChatPanel, ChainDAG, StepInspector, HarmonyPanel
   - Refine patterns based on pilot learnings
   - Document integration guide

### 7.2 Long-Term Strategy

1. **Standardize Integration Pattern**
   - Create reusable HOC or hook for quick integration
   - Generate integration checklist
   - Build component-specific context helpers

2. **Measure Success**
   - Track discuss button usage
   - Analyze most discussed components
   - Identify friction points

3. **Iterate on UX**
   - A/B test button placement
   - Experiment with context display
   - Add smart prompt suggestions

---

## Appendix A: Component Directory Structure

```
packages/app/src/components/
├── ChainBadge/
│   ├── ChainBadge.tsx
│   └── index.ts
├── ChainDAG/
│   ├── ChainDAG.tsx          [PANEL - Add discuss button]
│   ├── StepNode.tsx
│   ├── layout.ts
│   └── index.ts
├── ChangePreview/
│   ├── ChangePreview.tsx     [PANEL - Add discuss button]
│   ├── types.ts
│   └── index.ts
├── ClaudeCliTerminal/
│   ├── ClaudeCliTerminal.tsx [PANEL - Add discuss button]
│   ├── ClaudeCliStartDialog.tsx
│   ├── ProjectForm.tsx
│   ├── ProjectSelector.tsx
│   └── DiscoveredSessionsList.tsx
├── CodeEditor/
│   ├── DiffView.tsx          [PANEL - Add discuss button]
│   ├── EditorTabs.tsx
│   └── ConflictDialog.tsx
├── CommandPalette/
│   ├── CommandPalette.tsx    [MODAL - Add discuss option]
│   ├── CommandPaletteInput.tsx
│   ├── CommandPaletteResults.tsx
│   └── index.ts
├── ConversationPanel/
│   ├── ConversationPanel.tsx [PANEL - Add discuss button]
│   └── index.ts
├── CustomPromptButton/       [REFERENCE - Study this system]
│   ├── CustomPromptDialog.tsx
│   ├── CustomPromptDialog.css
│   ├── CustomPromptDialog.test.tsx
│   └── index.ts
├── DashboardSidebar/
│   ├── DashboardSidebar.tsx  [SIDEBAR - Optional discuss]
│   └── index.ts
├── FileExplorer/
│   ├── FileTree.tsx          [PANEL - Add discuss button]
│   ├── FileIcon.tsx
│   └── index.ts
├── FlowVisualization/
│   ├── FlowVisualization.tsx [PANEL - Add discuss button - PILOT]
│   ├── AnimatedStepNode.tsx
│   ├── AnimatedFlowEdge.tsx
│   └── SwimlaneBackground.tsx
├── HarmonyPanel/
│   ├── HarmonyPanel.tsx      [PANEL - Add discuss button]
│   └── index.ts
├── HarmonyIndicator/
│   ├── HarmonyIndicator.tsx  [WIDGET - Small discuss icon]
│   └── index.ts
├── InlineButtons/            [REFERENCE - Study integration]
│   ├── InlineButtons.tsx
│   ├── InlineButtonItem.tsx
│   └── index.ts
├── IntelDossier/
│   ├── DossierView.tsx       [PANEL - Add discuss button]
│   ├── DossierList.tsx       [PANEL - Add discuss button]
│   ├── DossierCard.tsx       [WIDGET - Small discuss icon]
│   ├── DossierCreationDialog.tsx
│   ├── WidgetRenderer.tsx
│   └── widgets/
│       ├── AlertPanelWidget.tsx
│       ├── CodeHealthMeterWidget.tsx
│       ├── FileTreeWidget.tsx
│       ├── InsightCardWidget.tsx
│       ├── SnippetPreviewWidget.tsx
│       ├── StatCardWidget.tsx
│       └── UnknownWidget.tsx
├── RegistryBrowser/
│   ├── RegistryBrowser.tsx   [PANEL - Add discuss button]
│   ├── PackCard.tsx
│   └── RegistryEntryCard.tsx
├── SessionArchive/
│   └── SessionArchive.tsx    [MODAL - Add discuss option]
├── SessionPanel/
│   ├── ChatPanel.tsx         [PANEL - Add discuss button - PRIORITY]
│   ├── SessionPanelLayout.tsx
│   ├── SessionInfoPanel.tsx
│   ├── LeftPanelStack.tsx
│   ├── RightVisualizationArea.tsx
│   ├── FolderHierarchy.tsx
│   ├── ResizeHandle.tsx
│   └── types.ts
├── SquadPanel/
│   ├── SquadPanel.tsx        [PANEL - Add discuss button]
│   ├── AgentRow.tsx
│   ├── AgentCharacterCard.tsx
│   ├── AgentAvatar.tsx
│   ├── AgentLogPanel.tsx
│   ├── LogBubble.tsx
│   └── types.ts
├── StepInspector/
│   ├── StepInspector.tsx     [PANEL - Add discuss button - PRIORITY]
│   └── index.ts
├── Terminal/
│   ├── TerminalPanel.tsx     [PANEL - Add discuss button]
│   └── index.ts
├── TimelineView/
│   ├── TimelineView.tsx      [PANEL - Add discuss button]
│   └── index.ts
└── Workbench/                [ALL - Add discuss button]
    ├── WorkbenchLayout.tsx
    ├── ArchiveWorkbench.tsx
    ├── CanvasWorkbench.tsx
    ├── EditorWorkbench.tsx
    ├── ExploreWorkbench.tsx
    ├── HarmonyWorkbench.tsx
    ├── IntelWorkbench.tsx
    ├── MaintenanceWorkbench.tsx
    ├── PMWorkbench.tsx
    ├── ReviewWorkbench.tsx
    ├── SettingsWorkbench.tsx
    ├── WorkWorkbench.tsx
    └── RespectWorkbench/
        ├── RespectWorkbench.tsx
        ├── CategorySection.tsx
        ├── ComponentHealthCard.tsx
        ├── LiveSpatialMonitor.tsx
        └── RespectCheckControls.tsx
```

---

## Appendix B: ButtonDefinition Example for Discuss Button

If implementing as a registry-based button (Option B):

```typescript
const discussButtonDefinition: ButtonDefinition = {
  id: 'btn-discuss-component' as ButtonId,
  label: "Let's Discuss",
  icon: '💬',
  action: {
    type: 'quick-action',
    payload: {
      value: 'I have a question about this component.',
      componentContextEnabled: true,
    },
  },
  contexts: ['general'], // Or use alwaysShow
  source: { type: 'core' },
  priority: 50, // Lower priority than critical actions
  enabled: true,
};

// Registry entry format:
{
  "id": "btn-discuss-component",
  "name": "Component Discussion Button",
  "description": "Allows discussing any component with Claude",
  "type": "button",
  "source": { "type": "core" },
  "version": "1.0.0",
  "status": "active",
  "enabled": true,
  "data": {
    "type": "button",
    "definition": {
      "label": "Let's Discuss",
      "icon": "💬",
      "action": {
        "type": "quick-action",
        "payload": {
          "value": "I have a question about this component.",
          "componentContextEnabled": true
        }
      },
      "contexts": ["general"],
      "priority": 50,
      "enabled": true
    }
  }
}
```

---

## Analysis Complete

**Total Components Analyzed:** 94
**Major Panels Identified:** 42
**Integration Pattern:** Component-level button (recommended)
**Pilot Component:** FlowVisualization
**Estimated Integration Time:** 2-3 hours per Tier 1 component

**Next Action:** Create DiscussButton component infrastructure + pilot integration with FlowVisualization.
