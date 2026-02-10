# Discuss Button Integration Checklist

**Track implementation progress across all dashboard components**

---

## Infrastructure (Phase 1)

**Core Components**
- [ ] Create `components/DiscussButton/DiscussButton.tsx`
- [ ] Create `components/DiscussButton/DiscussDialog.tsx`
- [ ] Create `components/DiscussButton/DiscussButton.css`
- [ ] Create `components/DiscussButton/index.ts`

**Hooks**
- [ ] Create `hooks/useDiscussButton.ts`

**Type Definitions**
- [ ] Create `shared/src/discussTypes.ts` (ComponentContext interface)

**Chat Integration**
- [ ] Extend ChatContext with component context support
- [ ] Update backend message endpoint to store context
- [ ] Add context serialization helpers

**Tests**
- [ ] Create `components/DiscussButton/DiscussButton.test.tsx`
- [ ] Create `components/DiscussButton/DiscussDialog.test.tsx`
- [ ] Create `hooks/useDiscussButton.test.ts`

---

## Tier 1: Critical Components (Week 1)

### Session & Chat
- [ ] **ChatPanel** (SessionPanel/ChatPanel.tsx)
  - Button placement: Integrate with input area
  - Context: sessionId, messageCount, cliRunning, lastMessage
  - Priority: HIGH
  - Est. time: 2 hours

### Visualization
- [x] **FlowVisualization** (FlowVisualization/FlowVisualization.tsx) [PILOT]
  - Button placement: Header toolbar (right)
  - Context: chainId, stepCount, status, currentStep, swimlanes
  - Priority: HIGH
  - Est. time: 3 hours (includes learning)

- [ ] **ChainDAG** (ChainDAG/ChainDAG.tsx)
  - Button placement: Header toolbar (right)
  - Context: chainId, stepCount, parallelGroups, selectedStep
  - Priority: HIGH
  - Est. time: 2 hours

### Inspection
- [ ] **StepInspector** (StepInspector/StepInspector.tsx)
  - Button placement: Header toolbar (right)
  - Context: stepNumber, action, status, duration, model
  - Priority: HIGH
  - Est. time: 2 hours

- [ ] **HarmonyPanel** (HarmonyPanel/HarmonyPanel.tsx)
  - Button placement: Header toolbar (right)
  - Context: harmonyPercentage, totalChecks, violationCount, degradedCount
  - Priority: HIGH
  - Est. time: 2 hours

---

## Tier 2: High-Value Components (Week 2-3)

### Editors & Diffs
- [ ] **DiffView** (CodeEditor/DiffView.tsx)
  - Button placement: Header toolbar (right)
  - Context: filePath, linesAdded, linesRemoved, hasPreviousVersion
  - Priority: MEDIUM
  - Est. time: 2 hours

- [ ] **ChangePreview** (ChangePreview/ChangePreview.tsx)
  - Button placement: Header toolbar (right)
  - Context: changes, fileCount, addedLines, removedLines
  - Priority: MEDIUM
  - Est. time: 2 hours

### Registry & Settings
- [ ] **RegistryBrowser** (RegistryBrowser/RegistryBrowser.tsx)
  - Button placement: Header toolbar (right)
  - Context: entryCount, packCount, activeTab, filters
  - Priority: MEDIUM
  - Est. time: 2 hours

### Squad & Timeline
- [ ] **SquadPanel** (SquadPanel/SquadPanel.tsx)
  - Button placement: Header toolbar (right)
  - Context: orchestrator, subagentCount, expandedAgent
  - Priority: MEDIUM
  - Est. time: 2 hours

- [ ] **TimelineView** (TimelineView/TimelineView.tsx)
  - Button placement: Header toolbar (right)
  - Context: chainId, timeRange, stepCount, selectedStep
  - Priority: MEDIUM
  - Est. time: 2 hours

### Workbench Components (12 total)
- [ ] **ArchiveWorkbench** (Workbench/ArchiveWorkbench.tsx)
  - Context: archivedCount, selectedSession
  - Est. time: 1.5 hours

- [ ] **CanvasWorkbench** (Workbench/CanvasWorkbench.tsx)
  - Context: canvasType, itemCount
  - Est. time: 1.5 hours

- [ ] **EditorWorkbench** (Workbench/EditorWorkbench.tsx)
  - Context: openFiles, activeFile, editorMode
  - Est. time: 1.5 hours

- [ ] **ExploreWorkbench** (Workbench/ExploreWorkbench.tsx)
  - Context: currentPath, fileCount, selectedFile
  - Est. time: 1.5 hours

- [ ] **HarmonyWorkbench** (Workbench/HarmonyWorkbench.tsx)
  - Context: harmonyMetrics, checksRunning
  - Est. time: 1.5 hours

- [ ] **IntelWorkbench** (Workbench/IntelWorkbench.tsx)
  - Context: dossierCount, activeDossier
  - Est. time: 1.5 hours

- [ ] **MaintenanceWorkbench** (Workbench/MaintenanceWorkbench.tsx)
  - Context: maintenanceTasks, issueCount
  - Est. time: 1.5 hours

- [ ] **PMWorkbench** (Workbench/PMWorkbench.tsx)
  - Context: projectStats, milestones, tasks
  - Est. time: 1.5 hours

- [ ] **ReviewWorkbench** (Workbench/ReviewWorkbench.tsx)
  - Context: reviewCount, activeReview, reviewType
  - Est. time: 1.5 hours

- [ ] **SettingsWorkbench** (Workbench/SettingsWorkbench.tsx)
  - Context: settingsCategory, unsavedChanges
  - Est. time: 1.5 hours

- [ ] **WorkWorkbench** (Workbench/WorkWorkbench.tsx)
  - Context: workItems, activeItem
  - Est. time: 1.5 hours

- [ ] **RespectWorkbench** (Workbench/RespectWorkbench/RespectWorkbench.tsx)
  - Context: spatialChecks, boundaryViolations
  - Est. time: 1.5 hours

---

## Tier 3: Secondary Components (Week 4)

### Intel & Dossier
- [ ] **DossierView** (IntelDossier/DossierView.tsx)
  - Button placement: Header toolbar (right)
  - Context: dossierId, status, analysisCount, targets
  - Priority: LOW
  - Est. time: 2 hours

- [ ] **DossierList** (IntelDossier/DossierList.tsx)
  - Button placement: Header toolbar (right)
  - Context: dossierCount, filterType, selectedDossier
  - Priority: LOW
  - Est. time: 2 hours

### Terminal & CLI
- [ ] **TerminalPanel** (Terminal/TerminalPanel.tsx)
  - Button placement: Floating (bottom-right)
  - Context: terminalId, commandHistory, currentDirectory
  - Priority: LOW
  - Est. time: 2 hours

- [ ] **ClaudeCliTerminal** (ClaudeCliTerminal/ClaudeCliTerminal.tsx)
  - Button placement: Header toolbar (right)
  - Context: cliVersion, projectPath, isRunning
  - Priority: LOW
  - Est. time: 2 hours

### Command & Archive
- [ ] **CommandPalette** (CommandPalette/CommandPalette.tsx)
  - Button placement: Modal footer actions
  - Context: query, resultCount, selectedCommand
  - Priority: LOW
  - Est. time: 2 hours

- [ ] **SessionArchive** (SessionArchive/SessionArchive.tsx)
  - Button placement: Modal footer actions
  - Context: archivedCount, selectedSession, dateRange
  - Priority: LOW
  - Est. time: 2 hours

### File & Tree
- [ ] **FileExplorer** (FileExplorer/FileTree.tsx)
  - Button placement: Header toolbar (right)
  - Context: currentPath, fileCount, selectedFile
  - Priority: LOW
  - Est. time: 2 hours

### Other Panels
- [ ] **ConversationPanel** (ConversationPanel/ConversationPanel.tsx)
  - Button placement: Header toolbar (right)
  - Context: sessionId, messageCount, conversationState
  - Priority: LOW
  - Est. time: 2 hours

- [ ] **SessionPane** (SessionPane/SessionPane.tsx)
  - Button placement: Header toolbar (right)
  - Context: sessionId, status, chainsCount
  - Priority: LOW
  - Est. time: 2 hours

---

## Tier 4: Widget Components (Optional)

### Small Widgets (Icon-Only Button)
- [ ] **HarmonyIndicator** (HarmonyIndicator/HarmonyIndicator.tsx)
  - Button placement: Top-right corner (small icon)
  - Context: harmonyPercentage, status
  - Priority: OPTIONAL
  - Est. time: 1 hour

- [ ] **DossierCard** (IntelDossier/DossierCard.tsx)
  - Button placement: Top-right corner (small icon)
  - Context: dossierId, name, status
  - Priority: OPTIONAL
  - Est. time: 1 hour

- [ ] **ControlButtons** (ControlButtons/ControlButtons.tsx)
  - Button placement: Inline with controls
  - Context: sessionId, availableCommands
  - Priority: OPTIONAL
  - Est. time: 1 hour

- [ ] **QuickActionBar** (QuickActionBar/QuickActionBar.tsx)
  - Button placement: Inline with actions
  - Context: activeActions, sessionId
  - Priority: OPTIONAL
  - Est. time: 1 hour

- [ ] **InlineButtons** (InlineButtons/InlineButtons.tsx)
  - Button placement: Inline with buttons
  - Context: detectedContext, buttonsShown
  - Priority: OPTIONAL
  - Est. time: 1 hour

### Navigation & Sidebar
- [ ] **SessionSidebar** (SessionSidebar/SessionSidebar.tsx)
  - Button placement: Sidebar header
  - Context: sessionCount, activeSession
  - Priority: OPTIONAL
  - Est. time: 1 hour

- [ ] **DashboardSidebar** (DashboardSidebar/DashboardSidebar.tsx)
  - Button placement: Sidebar header
  - Context: activeView, pinnedItems
  - Priority: OPTIONAL
  - Est. time: 1 hour

- [ ] **TopBar** (TopBar/TopBar.tsx)
  - Button placement: Right side of bar
  - Context: activeTab, workbenchType
  - Priority: OPTIONAL
  - Est. time: 1 hour

- [ ] **PersistentToolbar** (PersistentToolbar/PersistentToolbar.tsx)
  - Button placement: Inline with toolbar items
  - Context: toolbarItems, pinnedCount
  - Priority: OPTIONAL
  - Est. time: 1 hour

### Settings & Config
- [ ] **Settings** (Settings/QuickActionSettings.tsx)
  - Button placement: Header toolbar (right)
  - Context: settingsCategory, unsavedChanges
  - Priority: OPTIONAL
  - Est. time: 1 hour

---

## Summary Statistics

### Total Components: 42

**By Priority:**
- Tier 1 (Critical): 5 components
- Tier 2 (High-Value): 18 components
- Tier 3 (Secondary): 11 components
- Tier 4 (Optional): 8 components

**By Type:**
- Panel Components: 28
- Modal Components: 2
- Widget Components: 8
- Sidebar/Navigation: 4

**Estimated Time:**
- Infrastructure: 8-10 hours
- Tier 1: 11 hours
- Tier 2: 32 hours
- Tier 3: 22 hours
- Tier 4: 8 hours
- **Total: 81-83 hours**

---

## Progress Tracking

**Week 1 (Phase 1 + Tier 1)**
- [ ] Day 1-2: Infrastructure (8-10 hours)
- [ ] Day 3: FlowVisualization pilot (3 hours)
- [ ] Day 4: ChatPanel + ChainDAG (4 hours)
- [ ] Day 5: StepInspector + HarmonyPanel (4 hours)

**Week 2-3 (Tier 2)**
- [ ] DiffView, ChangePreview, RegistryBrowser (6 hours)
- [ ] SquadPanel, TimelineView (4 hours)
- [ ] All 12 Workbench components (18 hours)

**Week 4 (Tier 3)**
- [ ] Intel & Dossier components (4 hours)
- [ ] Terminal & CLI components (4 hours)
- [ ] Command, Archive, File components (6 hours)
- [ ] Other panels (6 hours)

**Future (Tier 4)**
- [ ] Widget components (8 hours)
- [ ] Navigation & sidebar (4 hours)
- [ ] Settings (1 hour)

---

## Completion Criteria

**For each component:**
1. ✅ Discuss button added to UI
2. ✅ Button properly styled and positioned
3. ✅ useDiscussButton hook integrated
4. ✅ Component context defined
5. ✅ Dialog opens on click
6. ✅ Message sends to chat
7. ✅ Context included in message
8. ✅ Keyboard accessible (tab, enter)
9. ✅ ARIA labels added
10. ✅ Tests passing
11. ✅ Code reviewed
12. ✅ Deployed to staging

---

## Notes

**Lessons Learned:**
- Document patterns discovered during integration
- Note any common issues and solutions
- Track time estimates vs. actuals
- Gather user feedback

**Open Issues:**
- List blockers or questions here
- Track dependencies on other work
- Note technical debt or improvements

**Future Enhancements:**
- Smart context detection
- Component-specific quick prompts
- Discussion history tracking
- Multi-component discussions

---

**Last Updated:** 2026-02-10
**Checklist Version:** 1.0.0
**Status:** Ready for Implementation
