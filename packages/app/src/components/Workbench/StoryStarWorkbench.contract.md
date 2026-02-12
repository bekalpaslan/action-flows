# StoryStarWorkbench Behavioral Contract

## Identity
**Component Name:** StoryStarWorkbench
**File Path:** packages/app/src/components/Workbench/StoryStarWorkbench.tsx
**Type:** Feature
**Last Updated:** 2026-02-12

## Render Location
Rendered as dynamic content within WorkbenchLayout when workbenchId='story'. Main content area when Story star is active.

## Lifecycle
- **Mount:** Loads user stories, narratives, and documentation
- **Update:** Re-renders when story data changes
- **Unmount:** Cleans up

## Props Contract
```typescript
interface StoryStarWorkbenchProps {
  workbenchId: 'story';
}
```

## State Ownership
- **Stories:** Array of user stories and narratives
- **Current story:** Active story being read/edited
- **View mode:** Read/edit/compare view state
- **Search query:** Story search text
- **Favorites:** Array of favorited stories

## Interactions
- **Click story:** Opens story details
- **Edit story:** Switches to edit mode
- **Create story:** Opens new story form
- **Save story:** Persists changes
- **Share story:** Opens sharing dialog
- **Mark favorite:** Toggles story favorite status

## Test Hooks
- `data-testid="story-star-workbench"` on main container
- `data-testid="story-list"` on stories list
- `data-testid="story-{id}"` on individual story
- `data-testid="story-editor"` on edit view
- `data-testid="story-viewer"` on read view
