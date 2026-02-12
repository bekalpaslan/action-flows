# ReviewStarWorkbench Behavioral Contract

## Identity
**Component Name:** ReviewStarWorkbench
**File Path:** packages/app/src/components/Workbench/ReviewStarWorkbench.tsx
**Type:** Feature
**Last Updated:** 2026-02-12

## Render Location
Rendered as dynamic content within WorkbenchLayout when workbenchId='review'. Main content area when Review star is active.

## Lifecycle
- **Mount:** Loads pull requests, code reviews, and feedback items
- **Update:** Re-renders when reviews update or comments added
- **Unmount:** Cleans up subscriptions

## Props Contract
```typescript
interface ReviewStarWorkbenchProps {
  workbenchId: 'review';
}
```

## State Ownership
- **Review queue:** Array of pending reviews
- **Current review:** Active review item
- **Comments:** Review comments and feedback
- **Filter state:** Pending/approved/changes-requested filters
- **Sort order:** Sort by date, priority, etc.

## Interactions
- **Click review:** Opens review details
- **Add comment:** Submits review feedback
- **Approve button:** Marks review as approved
- **Filter controls:** Updates review visibility
- **Diff viewer:** Shows code changes

## Test Hooks
- `data-testid="review-star-workbench"` on main container
- `data-testid="review-queue"` on reviews list
- `data-testid="review-item-{id}"` on individual review
- `data-testid="review-diff"` on diff viewer
- `data-testid="comment-thread"` on comment section
