# Quick Reference: Discuss Button Integration

**Fast lookup guide for implementing discuss buttons across dashboard components**

---

## TL;DR

Add a "Let's Discuss" button to each major dashboard component that:
- Opens a dialog for message composition
- Auto-includes component context (name, state, data)
- Sends message to ChatPanel with full context
- Uses existing CustomPromptButton system as blueprint

---

## 5-Minute Integration Guide

### Step 1: Import Dependencies

```tsx
import { useState } from 'react';
import { useDiscussButton } from '../../hooks/useDiscussButton';
```

### Step 2: Add Hook to Component

```tsx
export function YourComponent({ /* props */ }) {
  const { openDiscuss, DiscussDialog } = useDiscussButton({
    componentName: 'YourComponent',
    getContext: () => ({
      // Add relevant state/data here
      status: currentStatus,
      itemCount: items.length,
    }),
  });

  // ... rest of component ...
}
```

### Step 3: Add Button to JSX

```tsx
<div className="component-header">
  <h3>Component Title</h3>
  <button
    className="discuss-button"
    onClick={openDiscuss}
    title="Discuss this with Claude"
  >
    💬 Let's Discuss
  </button>
</div>

{/* Add dialog at end of component */}
<DiscussDialog />
```

### Step 4: Done!

Test by clicking button, typing message, and verifying it appears in ChatPanel with context.

---

## Component Categories & Placement

### Panel Components (Header Toolbar)
**Add button to header, right side**

Examples: FlowVisualization, ChainDAG, StepInspector, HarmonyPanel

```tsx
<div className="component-header">
  <h3>Panel Title</h3>
  <div className="header-actions">
    <button className="discuss-button" onClick={openDiscuss}>
      💬 Let's Discuss
    </button>
  </div>
</div>
```

### Modal Components (Integrate with Actions)
**Add to modal footer actions**

Examples: CommandPalette, SessionArchive

```tsx
<div className="modal-footer">
  <button className="discuss-button" onClick={openDiscuss}>
    💬 Discuss
  </button>
  <button className="close-button" onClick={onClose}>
    Close
  </button>
</div>
```

### Widget Components (Small Icon)
**Add small icon button, top-right corner**

Examples: HarmonyIndicator, DossierCard, ControlButtons

```tsx
<div className="widget-container">
  <button
    className="discuss-button discuss-button--small discuss-button--icon-only"
    onClick={openDiscuss}
    title="Discuss this widget"
    aria-label="Discuss with Claude"
  >
    💬
  </button>
  {/* Widget content */}
</div>
```

---

## Context Examples by Component Type

### Visualization Components
```typescript
getContext: () => ({
  component: 'FlowVisualization',
  chainId: chain.id,
  stepCount: chain.steps.length,
  status: chain.status,
  currentStep: selectedStepNumber,
  swimlanes: swimlaneNames,
})
```

### Inspector/Detail Components
```typescript
getContext: () => ({
  component: 'StepInspector',
  stepNumber: step.stepNumber,
  action: step.action,
  status: step.status,
  duration: step.duration,
  model: step.model,
})
```

### Panel/Dashboard Components
```typescript
getContext: () => ({
  component: 'HarmonyPanel',
  harmonyPercentage: metrics.harmonyPercentage,
  totalChecks: metrics.totalChecks,
  violationCount: metrics.violationCount,
  degradedCount: metrics.degradedCount,
})
```

### Editor Components
```typescript
getContext: () => ({
  component: 'DiffView',
  filePath: path,
  linesAdded: diffData.linesAdded,
  linesRemoved: diffData.linesRemoved,
  hasPreviousVersion: diffData.hasPreviousVersion,
})
```

---

## CSS Classes

```css
/* Base button */
.discuss-button { }

/* States */
.discuss-button:hover { }
.discuss-button:active { }
.discuss-button:disabled { }

/* Variants */
.discuss-button--small { }       /* Widget size */
.discuss-button--icon-only { }   /* Icon without text */
.discuss-button--floating { }    /* Floating position */
```

---

## Priority Components (Do These First)

### Tier 1: Critical (Week 1)
1. ✅ FlowVisualization (PILOT)
2. ⬜ ChatPanel
3. ⬜ ChainDAG
4. ⬜ StepInspector
5. ⬜ HarmonyPanel

### Tier 2: High-Value (Week 2-3)
- DiffView
- RegistryBrowser
- SquadPanel
- TimelineView
- All Workbench components (12 total)

### Tier 3: Secondary (Week 4)
- DossierView, TerminalPanel, CommandPalette
- SessionArchive, FileExplorer

### Tier 4: Optional (Future)
- Widget components (HarmonyIndicator, etc.)

---

## Common Issues & Solutions

### Issue: Button not visible
**Solution:** Check z-index, ensure parent container has `position: relative`

### Issue: Context too large
**Solution:** Summarize data, only include essential fields

### Issue: Dialog not opening
**Solution:** Check useDiscussButton hook is called at component top-level

### Issue: Message not reaching ChatPanel
**Solution:** Verify ChatContext is available, check backend logs

### Issue: Circular reference in context
**Solution:** Use `JSON.stringify` test, remove circular refs

---

## Testing Checklist

**For each component:**
- [ ] Button renders correctly
- [ ] Button has proper hover/active states
- [ ] Button opens dialog on click
- [ ] Dialog displays component name
- [ ] Dialog displays context preview
- [ ] Message can be typed
- [ ] Message sends successfully
- [ ] Message appears in ChatPanel
- [ ] Context is included in message
- [ ] Dialog closes after send
- [ ] Button is keyboard accessible
- [ ] Button has aria-label

---

## Reference Files

**Study These (Blueprint):**
- `components/CustomPromptButton/CustomPromptDialog.tsx`
- `hooks/useCustomPromptButtons.ts`
- `components/InlineButtons/InlineButtons.tsx`

**Modify These (Integration):**
- `hooks/useDiscussButton.ts` (create this)
- `components/DiscussButton/` (create this directory)
- Your component file (add button + hook)

**Type Definitions:**
- `shared/src/buttonTypes.ts`
- `shared/src/discussTypes.ts` (create this)

---

## Example: Complete FlowVisualization Integration

```tsx
import { useState, useMemo } from 'react';
import ReactFlow, { /* ... */ } from 'reactflow';
import { useDiscussButton } from '../../hooks/useDiscussButton';
import type { Chain } from '@afw/shared';
import './FlowVisualization.css';

export interface FlowVisualizationProps {
  chain: Chain;
  onStepClick?: (stepNumber: number) => void;
  enableAnimations?: boolean;
}

export const FlowVisualization: React.FC<FlowVisualizationProps> = ({
  chain,
  onStepClick,
  enableAnimations = true,
}) => {
  const [selectedStep, setSelectedStep] = useState<number | null>(null);

  // Add discuss button hook
  const { openDiscuss, DiscussDialog } = useDiscussButton({
    componentName: 'Flow Visualization',
    getContext: () => ({
      component: 'FlowVisualization',
      chainId: chain.id,
      stepCount: chain.steps.length,
      status: chain.status,
      currentStep: selectedStep,
      swimlanes: getSwimlaneNames(chain),
      enabledAnimations: enableAnimations,
    }),
  });

  // ... rest of component logic ...

  return (
    <div className="flow-visualization">
      {/* Add button to header */}
      <div className="flow-header">
        <h3>Flow Visualization</h3>
        <div className="flow-header-actions">
          <button
            className="discuss-button"
            onClick={openDiscuss}
            title="Discuss this visualization with Claude"
          >
            💬 Let's Discuss
          </button>
        </div>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        /* ... */
      >
        {/* ... ReactFlow children ... */}
      </ReactFlow>

      {/* Add dialog at end */}
      <DiscussDialog />
    </div>
  );
};
```

---

## Help & Resources

**Questions?**
- See full analysis: `ANALYSIS.md`
- See summary: `SUMMARY.md`
- Ask in #actionflows-dev channel

**Need Help?**
- Review CustomPromptButton system (packages/app/src/components/CustomPromptButton/)
- Check existing integrations (InlineButtons, QuickActionBar)
- Consult integration guide (docs/DISCUSS_BUTTON_GUIDE.md)

**Found a Bug?**
- Check console for errors
- Verify hook is called correctly
- Test context serialization with `JSON.stringify(context)`
- Log issue in project tracker

---

**Last Updated:** 2026-02-10
**Version:** 1.0.0
**Status:** Ready for Implementation
