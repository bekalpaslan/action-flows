# Component Contract: FileIcon

**File:** `packages/app/src/components/FileExplorer/FileIcon.tsx`
**Type:** utility
**Parent Group:** FileExplorer
**Contract Version:** 1.0.0
**Last Reviewed:** 2026-02-10

---

## Identity

- **Component Name:** FileIcon
- **Introduced:** 2024-Q4 (estimated)
- **Description:** Pure presentation component that renders emoji icons for files and directories based on file type and extension. Supports 40+ file types with special handling for common filenames.

---

## Render Location

**Mounts Under:**
- FileTree (for each directory entry)
- ExploreWorkbench (for each tree item)

**Render Conditions:**
1. Always renders when provided `type` and `name` props
2. No conditional rendering logic

**Positioning:** inline (within parent flex/grid layout)
**Z-Index:** N/A

---

## Lifecycle

**Mount Triggers:**
- Parent renders directory entry or file list item

**Key Effects:**
- None (pure component, no side effects)

**Cleanup Actions:**
- None

**Unmount Triggers:**
- Parent re-renders without this entry
- Parent component unmounts

---

## Props Contract

### Inputs
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| type | `'file' \| 'directory'` | ✅ | N/A | Entry type (file or directory) |
| name | `string` | ✅ | N/A | File or directory name (for extension extraction) |

### Callbacks Up (to parent)
| Callback | Signature | Description |
|----------|-----------|-------------|
| N/A | N/A | No callbacks (pure presentation) |

### Callbacks Down (to children)
| Callback | Signature | Passed To | Description |
|----------|-----------|-----------|-------------|
| N/A | N/A | N/A | No children |

---

## State Ownership

### Local State
| State | Type | Initial | Updated By |
|-------|------|---------|------------|
| N/A | N/A | N/A | Stateless component |

### Context Consumption
| Context | Values Used |
|---------|-------------|
| N/A | No context usage |

### Derived State
| Name | Type | Dependencies | Computation |
|------|------|--------------|-------------|
| ext | `string` | `name` | `name.split('.').pop()?.toLowerCase()` |
| lowerName | `string` | `name` | `name.toLowerCase()` |
| icon | `string` | `ext`, `lowerName` | Lookup in `iconMap` or `specialFiles` |

### Custom Hooks
- None

---

## Interactions

### Parent Communication
- **Mechanism:** N/A (no communication, pure render)
- **Description:** Receives props, renders icon
- **Example:** N/A

### Child Communication
- **Child:** N/A
- **Mechanism:** N/A
- **Data Flow:** No children

### Sibling Communication
- **Sibling:** N/A
- **Mechanism:** N/A
- **Description:** No sibling interaction

### Context Interaction
- **Context:** N/A
- **Role:** N/A
- **Operations:** N/A

---

## Side Effects

### API Calls
| Endpoint | Method | Trigger | Response Handling |
|----------|--------|---------|-------------------|
| N/A | N/A | N/A | N/A |

### WebSocket Events
| Event Type | Trigger | Handler |
|------------|---------|---------|
| N/A | N/A | N/A |

### Timers
| Type | Duration | Purpose | Cleanup |
|------|----------|---------|---------|
| N/A | N/A | N/A | N/A |

### LocalStorage Operations
| Key | Operation | Trigger | Value |
|-----|-----------|---------|-------|
| N/A | N/A | N/A | N/A |

### DOM Manipulation
| Target | Operation | Trigger |
|--------|-----------|---------|
| N/A | N/A | N/A |

### Electron IPC (if applicable)
| Channel | Direction | Purpose |
|---------|-----------|---------|
| N/A | N/A | N/A |

---

## Test Hooks

**CSS Selectors:**
- `.file-icon`
- `.file-icon.directory-icon`

**Data Test IDs:**
- N/A

**ARIA Labels:**
- N/A (should add `aria-label` with file type description)

**Visual Landmarks:**
1. Directory icon (📁) — Folder emoji for all directories
2. File icons — Extension-specific emojis (see icon map below)

---

## Health Checks

### Critical Checks (Must Pass)

#### HC-FI-01: Icon Rendering
- **Type:** render
- **Target:** Icon span element
- **Condition:** Component renders `<span className="file-icon">{icon}</span>`
- **Failure Mode:** No icon renders, or renders incorrect icon
- **Automation Script:**
```javascript
// Chrome MCP script
const snapshot = await take_snapshot();
const hasIcon = snapshot.includes('file-icon');
assert(hasIcon, 'File icon should render');
```

#### HC-FI-02: Directory Icon
- **Type:** render-condition
- **Target:** Directory entries
- **Condition:** `type === 'directory'` renders 📁 emoji
- **Failure Mode:** Directories show file icons instead of folder icon
- **Automation Script:**
```javascript
// Chrome MCP script
const snapshot = await take_snapshot();
const hasFolder = snapshot.includes('📁');
assert(hasFolder, 'Directory should show folder icon');
```

#### HC-FI-03: Extension Mapping
- **Type:** logic
- **Target:** File extension to icon mapping
- **Condition:** Known extensions return correct icons (e.g., .ts → 🔷, .py → 🐍)
- **Failure Mode:** Known file types show generic 📄 icon
- **Automation Script:**
```javascript
// Chrome MCP script
// Test with TypeScript file
const tsIcon = FileIcon({ type: 'file', name: 'index.ts' });
assert(tsIcon.includes('🔷'), 'TypeScript files should show diamond icon');
```

### Warning Checks (Should Pass)

#### HC-FI-04: Special Filename Handling
- **Type:** logic
- **Target:** Special filenames (package.json, README.md, etc.)
- **Condition:** Special files override extension-based icons
- **Failure Mode:** Special files show extension icon instead of special icon

#### HC-FI-05: Unknown Extension Fallback
- **Type:** fallback
- **Target:** Unrecognized file extensions
- **Condition:** Unknown extensions render generic 📄 icon
- **Failure Mode:** No icon renders for unknown types

### Performance Benchmarks

| Metric | Threshold | Unit | Description |
|--------|-----------|------|-------------|
| icon-lookup | 1 | ms | Time to compute icon from extension |
| render-time | 5 | ms | Time to render icon component |

---

## Dependencies

**Required Contexts:**
- None

**Required Hooks:**
- None

**Child Components:**
- None

**Required Props:**
- `type` (required)
- `name` (required)

---

## Notes

### Icon Map (40+ supported types)

**Programming Languages:**
- TypeScript (.ts) → 🔷
- TSX (.tsx) → ⚛️
- JavaScript (.js) → 🟨
- JSX (.jsx) → ⚛️
- Python (.py) → 🐍
- Java (.java) → ☕
- C/C++ (.c, .cpp, .h, .hpp) → 🔧
- Go (.go) → 🐹
- Rust (.rs) → 🦀
- Ruby (.rb) → 💎
- PHP (.php) → 🐘

**Markup & Data:**
- HTML (.html) → 🌐
- CSS (.css, .scss, .sass) → 🎨
- JSON (.json) → 📦
- XML (.xml) → 📄
- YAML (.yaml, .yml) → ⚙️
- TOML (.toml) → ⚙️

**Documentation:**
- Markdown (.md, .mdx) → 📝
- Text (.txt) → 📄
- PDF (.pdf) → 📕

**Images:**
- PNG, JPG, JPEG, GIF, ICO (.png, .jpg, .jpeg, .gif, .ico) → 🖼️
- SVG (.svg) → 🎨

**Config:**
- Environment (.env) → 🔐
- Gitignore (.gitignore) → 🚫
- Docker (.dockerignore, dockerfile) → 🐳
- ESLint (.eslintrc) → ✅
- Prettier (.prettierrc) → ✨
- Babel (.babelrc) → 🔄

**Build:**
- Lock files (.lock) → 🔒
- Package files (.package) → 📦
- Makefile (makefile) → 🔨

**Shell:**
- Shell (.sh, .bash, .zsh) → 🐚
- PowerShell (.ps1) → 💻

**Database:**
- SQL (.sql, .db, .sqlite) → 🗄️

**Special Filenames:**
- package.json → 📦
- tsconfig.json → 🔷
- README.md → 📖
- LICENSE → 📜
- Dockerfile → 🐳
- Makefile → 🔨
- .gitignore → 🚫
- .env → 🔐

**Fallback:**
- Unknown extensions → 📄

### Future Enhancements
- Add ARIA labels for screen readers
- Support custom icon mappings via props
- Add icon size variants
- Add color variants for different file states (modified, deleted, new)

---

**Contract Authored:** 2026-02-10
**Last Updated:** 2026-02-10
**Version:** 1.0.0
