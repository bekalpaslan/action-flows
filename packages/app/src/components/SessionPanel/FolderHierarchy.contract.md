# FolderHierarchy Behavioral Contract

## Identity
**Component Name:** FolderHierarchy
**File Path:** packages/app/src/components/SessionPanel/FolderHierarchy.tsx
**Type:** Presentation
**Last Updated:** 2026-02-12

## Render Location
Hierarchical folder tree display within SessionPanel or workbench context. Shows file/folder structure for code editor or file browser integration.

## Lifecycle
- **Mount:** Loads folder structure from backend
- **Update:** Re-renders when folder structure changes
- **Unmount:** Cleans up

## Props Contract
```typescript
interface FolderHierarchyProps {
  root: FolderItem;
  onSelectFile?: (filePath: string) => void;
  expandedFolders?: Set<string>;
  onToggleFolder?: (folderPath: string) => void;
}
```

## State Ownership
- **Expanded folders:** Set of currently expanded folder paths
- **Selected item:** Currently selected file/folder
- **Drag state:** Drag-and-drop state if enabled

## Interactions
- **Click folder:** Expands/collapses folder
- **Click file:** Selects file and may open in editor
- **Drag file:** May enable drag-and-drop operations

## Test Hooks
- `data-testid="folder-hierarchy"` on main container
- `data-testid="folder-{path}"` on folder nodes
- `data-testid="file-{path}"` on file nodes
