# Analysis Summary: Discuss Button Integration

**Date:** 2026-02-10
**Analyst:** analyze/inventory agent
**Log Path:** `.claude/actionflows/logs/analyze/discuss-button-integration_2026-02-10-02-39-23/`

---

## Quick Stats

- **Total Components:** 94 files (TSX + TS)
- **Major Panels:** 42 candidates for discuss button
- **Sub-Components:** 52 (excluded from discuss button)
- **Existing System:** CustomPromptButton system (fully mature)
- **Integration Pattern:** Component-level button (recommended)

---

## Key Findings

### 1. CustomPromptButton System is Production-Ready

The existing system for custom prompt buttons provides a complete blueprint:
- **Dialog:** CustomPromptDialog.tsx for creating buttons
- **Hook:** useCustomPromptButtons.ts for fetching/managing
- **Integration:** InlineButtons.tsx for context-aware display
- **Backend:** Full REST API + WebSocket sync
- **Real-time Updates:** Registry changes broadcast via WebSocket

### 2. Integration Pattern Identified

**Recommended: Component-Level Button**
- Add button to component header/toolbar
- Opens lightweight dialog for message composition
- Auto-includes component context (name, state, data)
- Sends to chat with full context attached

**Alternative: Registry-Based Button**
- Create core ButtonDefinition entry
- Uses existing InlineButtons system
- Appears below messages only
- Less discoverable, no component-specific context

### 3. Priority Tiers Defined

**Tier 1 (Critical - Implement First):**
1. ChatPanel
2. FlowVisualization (PILOT)
3. ChainDAG
4. StepInspector
5. HarmonyPanel

**Tier 2 (High-Value):**
- DiffView, RegistryBrowser, SquadPanel, TimelineView
- All 12 Workbench components

**Tier 3 (Secondary):**
- DossierView, TerminalPanel, CommandPalette, SessionArchive, FileExplorer

**Tier 4 (Optional):**
- Widget components (HarmonyIndicator, ControlButtons, etc.)

---

## Implementation Roadmap

### Phase 1: Core Infrastructure (Est. 4-6 hours)

**Create New Components:**
1. `DiscussButton/DiscussButton.tsx` - Reusable button component
2. `DiscussButton/DiscussDialog.tsx` - Message composition dialog
3. `DiscussButton/DiscussButton.css` - Styling
4. `hooks/useDiscussButton.ts` - Hook for state management
5. `shared/discussTypes.ts` - ComponentContext type definition

**Extend Existing Systems:**
- Update ChatContext to accept componentContext
- Extend backend message endpoint for context storage
- Add context serialization helpers

### Phase 2: Pilot Integration (Est. 2-3 hours)

**Target:** FlowVisualization component
- Add discuss button to header
- Test full flow: button → dialog → message → chat
- Validate context serialization
- Refine UX based on feedback

### Phase 3: Tier 1 Rollout (Est. 8-12 hours)

**Integrate Discuss Button Into:**
- ChatPanel (integrate with input area)
- ChainDAG (header toolbar)
- StepInspector (header toolbar)
- HarmonyPanel (header toolbar)

**Document:**
- Integration guide for future components
- Component-specific context examples
- Troubleshooting common issues

### Phase 4: Tier 2 & 3 Expansion (Est. 20-30 hours)

**Systematic Rollout:**
- DiffView, RegistryBrowser, SquadPanel, TimelineView
- All 12 Workbench components
- DossierView, TerminalPanel, CommandPalette, etc.

### Phase 5: Polish & Enhancement (Est. 4-6 hours)

**Add:**
- Keyboard shortcut (Ctrl+/)
- Smart context detection
- Component-specific quick prompts
- Discussion history tracking
- Usage analytics

---

## Component Context Examples

When user clicks discuss button, include relevant state:

**FlowVisualization:**
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

**StepInspector:**
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

**HarmonyPanel:**
```typescript
{
  component: 'HarmonyPanel',
  harmonyPercentage: 94,
  totalChecks: 15,
  violationCount: 1,
  degradedCount: 0,
}
```

---

## Key Files to Study

**CustomPromptButton System (Reference Implementation):**
- `components/CustomPromptButton/CustomPromptDialog.tsx`
- `components/CustomPromptButton/CustomPromptDialog.css`
- `hooks/useCustomPromptButtons.ts`
- `components/InlineButtons/InlineButtons.tsx`
- `components/RegistryBrowser/RegistryBrowser.tsx`

**Chat Integration:**
- `components/SessionPanel/ChatPanel.tsx`
- `hooks/useChatMessages.ts`
- `services/claudeCliService.ts`

**Type Definitions:**
- `shared/src/buttonTypes.ts`
- `shared/src/types.ts`

**Major Panel Components (Integration Targets):**
- `components/FlowVisualization/FlowVisualization.tsx`
- `components/ChainDAG/ChainDAG.tsx`
- `components/StepInspector/StepInspector.tsx`
- `components/HarmonyPanel/HarmonyPanel.tsx`

---

## Design Decisions

### Button Placement

**Panel Components with Headers:**
- Add to header toolbar (right side)
- Example: FlowVisualization, ChainDAG, HarmonyPanel

**Panel Components without Headers:**
- Floating button (bottom-right)
- Example: TerminalPanel

**Widget Components:**
- Small icon button (top-right corner)
- Example: HarmonyIndicator, DossierCard

### Button Styling

**Consistent Design:**
- Icon: 💬 (speech bubble emoji)
- Label: "Let's Discuss" or "Discuss"
- Position: Top-right of panels
- Size: Medium (standard button)
- Color: Accent color (blue/purple)

**States:**
- Hover: Slight scale + glow
- Active: Pressed effect
- Disabled: Greyed out (when chat unavailable)

### Context Handling

**Include:**
- Component name (for routing)
- Current state (status, data)
- Relevant IDs (sessionId, chainId, stepNumber)
- Timestamp (for debugging)

**Exclude:**
- Circular references (JSON stringify safe)
- Large data structures (summarize instead)
- Sensitive data (credentials, tokens)

---

## Success Metrics

**Track:**
1. Discuss button usage (clicks per component)
2. Message completion rate (dialog → send)
3. Most discussed components (popularity)
4. Average context size (performance)
5. User feedback (qualitative)

**Goals:**
- 80%+ of users discover discuss button within first session
- 50%+ of users use discuss button at least once
- 20%+ of chat messages include component context
- <100ms context serialization time
- 95%+ message send success rate

---

## Risks & Mitigations

### Risk 1: Performance Impact
**Risk:** Context serialization slows down rendering
**Mitigation:** Lazy load dialog, debounce context updates, cache context

### Risk 2: Context Overload
**Risk:** Too much context confuses Claude or clutters messages
**Mitigation:** Summarize large data, allow user to edit context before sending

### Risk 3: Poor Discoverability
**Risk:** Users don't notice or understand discuss button
**Mitigation:** Onboarding tooltip, keyboard shortcut, prominent placement

### Risk 4: Integration Complexity
**Risk:** Adding button to 42 components is time-consuming
**Mitigation:** Create reusable HOC/hook, generate boilerplate, document pattern

### Risk 5: Backend Overload
**Risk:** Context storage increases database size
**Mitigation:** Set retention policy, compress context, limit size

---

## Open Questions

1. **Should context be editable in the dialog?**
   - Pro: User can remove sensitive data
   - Con: More complex UI

2. **Should discuss button be toggleable per component?**
   - Pro: User can hide if not useful
   - Con: More settings to manage

3. **Should we track discussion history per component?**
   - Pro: User can see past discussions
   - Con: More storage, more UI complexity

4. **Should we support multi-component discussions?**
   - Pro: Compare visualizations, relate panels
   - Con: Complex UX, harder to implement

5. **Should we pre-fill common questions?**
   - Pro: Faster workflow, better UX
   - Con: Requires learning user patterns

---

## Next Steps

### Immediate (This Week)
1. Create DiscussButton component infrastructure
2. Implement DiscussDialog with context display
3. Create useDiscussButton hook
4. Extend ChatContext for component context

### Short-Term (Next 2 Weeks)
1. Pilot integration with FlowVisualization
2. Test full flow end-to-end
3. Refine UX based on feedback
4. Roll out to Tier 1 components (ChatPanel, ChainDAG, StepInspector, HarmonyPanel)

### Medium-Term (Next Month)
1. Integrate with Tier 2 components (Workbenches, DiffView, etc.)
2. Add keyboard shortcut support
3. Implement component-specific quick prompts
4. Add usage analytics

### Long-Term (Next Quarter)
1. Complete Tier 3 & 4 integration
2. Build discussion history tracking
3. Implement smart context detection
4. Add multi-component discussion support

---

## Conclusion

The discuss button feature is highly feasible and builds on a mature CustomPromptButton system. The recommended approach (component-level button) provides better discoverability and context-awareness than the alternative (registry-based button).

**Estimated Total Effort:** 40-60 hours for full implementation across all tiers
**Expected Value:** High - improves user experience, enables contextual discussion, leverages existing infrastructure
**Risk Level:** Low - well-understood pattern, existing system to learn from

**Recommendation:** Proceed with Phase 1 (infrastructure) + Phase 2 (pilot) immediately. Validate UX before scaling to all components.

---

**Full Analysis:** See `ANALYSIS.md` in this directory for complete details, component inventory, and integration patterns.
