# PersistentToolbar Component - File Manifest

## Created Files

### Component Files
1. **packages/app/src/components/PersistentToolbar/PersistentToolbar.tsx** (152 lines)
   - Main toolbar component with config management
   - Imports: React hooks, shared types, utilities, subcomponents, CSS

2. **packages/app/src/components/PersistentToolbar/PersistentToolbarButton.tsx** (122 lines)
   - Individual button component
   - Features: Icon rendering, pin indicator, usage badge, context menu

3. **packages/app/src/components/PersistentToolbar/PersistentToolbar.css** (103 lines)
   - Toolbar container styling
   - CSS Grid layout, responsive breakpoints, animations

4. **packages/app/src/components/PersistentToolbar/PersistentToolbarButton.css** (180 lines)
   - Button styling with hover/active states
   - Context menu, badges, responsive design

5. **packages/app/src/components/PersistentToolbar/index.ts** (6 lines)
   - Export barrel file for clean imports

### Documentation
- **logs/code/persistent-toolbar_2026-02-08-19-31-35/changes.md** - Detailed implementation summary
- **logs/code/persistent-toolbar_2026-02-08-19-31-35/MANIFEST.md** - This file

## Component Summary

**PersistentToolbar**: Project-scoped toolbar with frequency-based button ordering
- Manages toolbar configuration per project
- Persists button usage statistics
- Supports pin/unpin via right-click context menu
- Responsive grid layout for variable button counts

**PersistentToolbarButton**: Individual button component with
- Icon + label rendering
- Pin indicator (📌)
- Usage count badge
- Context menu (pin/unpin/remove)
- Loading and disabled states

## Integration Checklist

- [ ] Backend API endpoints implemented (GET/PUT /api/toolbar/:projectId/config)
- [ ] Button definitions populated in parent component
- [ ] ProjectId branded type passed correctly
- [ ] onButtonClick handler implemented for button actions
- [ ] CSS variables verified in theme
- [ ] E2E tests written for pin/unpin functionality
- [ ] Documentation updated in docs/ directory

## Usage Example

```tsx
import { PersistentToolbar } from '@afw/app/components/PersistentToolbar';
import type { ProjectId, ButtonDefinition } from '@afw/shared';

function MyComponent() {
  const projectId: ProjectId = 'some-uuid' as ProjectId;
  const buttons: ButtonDefinition[] = [/* button definitions */];

  return (
    <PersistentToolbar
      projectId={projectId}
      buttons={buttons}
      onButtonClick={(button) => {
        // Handle button click action
      }}
    />
  );
}
```

## Type Definitions

```typescript
interface PersistentToolbarProps {
  projectId: ProjectId;
  buttons: ButtonDefinition[];
  onButtonClick?: (button: ButtonDefinition) => void;
}

interface PersistentToolbarButtonProps {
  button: ButtonDefinition;
  slot?: ToolbarSlot;
  onClick: () => void;
  onTogglePin: (pinned: boolean) => void;
  onRemove: () => void;
}
```
