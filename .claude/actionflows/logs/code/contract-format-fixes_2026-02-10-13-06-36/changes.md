# Code Changes: Contract Format Fixes

## Files Modified

| File | Change |
|------|--------|
| `packages/app/src/contracts/components/Canvas/ChainDemo.contract.md` | Expanded from compact format (merged "State & Effects") to full 11-section template |
| `packages/app/src/contracts/components/Canvas/ChainLiveMonitor.contract.md` | Expanded from compact format (merged "State & Effects") to full 11-section template |
| `packages/app/src/contracts/components/Canvas/HybridFlowViz.contract.md` | Expanded from compact format (merged "State & Effects") to full 11-section template |
| `packages/app/src/contracts/components/Canvas/StepNode.contract.md` | Expanded from compact format (merged "State & Effects") to full 11-section template |
| `packages/app/src/contracts/components/DiscussButton/DiscussButton.contract.md` | Expanded from compact format (merged "State & Effects") to full 11-section template |
| `packages/app/src/contracts/components/DiscussButton/InlineButtons.contract.md` | Expanded from compact format (merged "State & Effects") to full 11-section template |
| `packages/app/src/contracts/components/DiscussButton/DiscussDialog.contract.md` | Expanded from compact format (merged "State & Effects") to full 11-section template |
| `packages/app/src/contracts/components/Terminal/ClaudeCliTerminal.contract.md` | Expanded from compact format (merged "State & Effects") to full 11-section template |
| `packages/app/src/contracts/components/Terminal/TerminalPanel.contract.md` | Expanded from compact format (merged "State & Effects") to full 11-section template |
| `packages/app/src/contracts/components/CodeEditor/CodeEditor.contract.md` | Removed TODO markers, moved to "Future Enhancements" section |
| `packages/app/src/contracts/components/Layout/WorkbenchLayout.contract.md` | Removed TODO markers, moved to "Future Enhancements" section |
| `packages/app/src/contracts/components/Layout/SessionSidebar.contract.md` | Removed TODO markers, moved to "Future Enhancements" section |
| `packages/app/src/contracts/components/FileExplorer/FileExplorer.contract.md` | Removed TODO markers, moved to "Future Enhancements" section |
| `packages/app/src/contracts/components/FileExplorer/FileTree.contract.md` | Removed TODO markers, moved to "Future Enhancements" section |
| `packages/app/src/contracts/components/SessionPanel/FolderHierarchy.contract.md` | Removed TODO markers, moved to "Future Enhancements" section |
| `packages/app/src/contracts/components/SessionPanel/ResizeHandle.contract.md` | Removed TODO markers, moved to "Future Enhancements" section |

## Files Created
None

## Summary

### Finding 1: Compact Format Contracts (9 contracts fixed)
**Issue:** 9 contracts used a compact format with merged sections (e.g., "## State & Effects" instead of separate "## State Ownership", "## Interactions", "## Side Effects").

**Contracts Expanded:**
- **Canvas batch:** ChainDemo, ChainLiveMonitor, HybridFlowViz, StepNode
- **DiscussButton batch:** DiscussButton, InlineButtons, DiscussDialog
- **Terminal batch:** ClaudeCliTerminal, TerminalPanel

**Expansion Details:**
Each compact contract was expanded to the full 11-section template:
1. Identity
2. Render Location
3. Lifecycle
4. Props Contract
5. State Ownership
6. Interactions
7. Side Effects
8. Test Hooks
9. Health Checks
10. Dependencies
11. Notes

The "## State & Effects" section was split into:
- **State Ownership** (Local State, Context Consumption, Derived State, Custom Hooks)
- **Interactions** (Parent Communication, Child Communication, Sibling Communication, Context Interaction)
- **Side Effects** (API Calls, WebSocket Events, Timers, LocalStorage, DOM Manipulation, Electron IPC)

### Finding 2: TODO/TBD Markers (7 contracts fixed)
**Issue:** 11 contracts had TODO/TBD/placeholder markers indicating incomplete documentation.

**Approach:** Removed TODO/TBD markers and moved future improvements to a new "### Future Enhancements" subsection under "## Notes".

**Contracts Fixed:**
- **CodeEditor.contract.md:** 2 TODO markers → Moved to "Future Enhancements" (Full diff viewer, Advanced conflict dialog)
- **WorkbenchLayout.contract.md:** 3 TODO markers → Moved to "Future Enhancements" (Backend API, WebSocket, click handlers)
- **SessionSidebar.contract.md:** 2 TODO markers → Moved to "Future Enhancements" (Custom modal, Toast notifications)
- **FileExplorer.contract.md:** 1 TODO marker → Moved to "Future Enhancements" (Context menu)
- **FileTree.contract.md:** 1 TODO marker → Moved to "Future Enhancements" (Reveal action, Keyboard nav)
- **FolderHierarchy.contract.md:** 2 TODO markers → Moved to "Future Enhancements" (Backend integration, Keyboard nav)
- **ResizeHandle.contract.md:** 1 TODO marker → Moved to "Future Enhancements" (Double-click reset)

**Note:** Some "placeholder" and "todo" references were left unchanged as they were:
- Valid UI text (e.g., `placeholder="test message"`)
- Task status values (e.g., `status: 'todo'` in PMWorkbench)
- Legitimate descriptions of current behavior (e.g., "placeholder implementation")

## Verification
- Type check: Pre-existing TypeScript errors unrelated to contract changes
- Notes: No code changes were made, only contract documentation updates

## Summary
- **Total contracts fixed:** 16
- **Compact format expanded:** 9 contracts
- **TODO markers removed:** 7 contracts (11 markers total)
- **All contracts now follow standard 11-section template**
