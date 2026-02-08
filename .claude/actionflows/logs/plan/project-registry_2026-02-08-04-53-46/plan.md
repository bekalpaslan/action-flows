# Implementation Plan: Project Registry Feature

## Overview

This plan implements a Project Registry feature that allows users to register projects with their configurations (cwd, CLI flags, MCP paths, env vars, etc.) so they can quickly start Claude CLI sessions from known projects instead of manually typing paths each time. The feature includes auto-detection of project metadata (.claude/actionflows/, CLAUDE.md, MCP configs), persistent JSON file storage, CRUD REST APIs, and an enhanced UI that replaces the current cwd text input with a project dropdown.

**Key Approach:** Shared types first → Backend (models, storage service, routes) → Frontend (API client, UI components) → Integration with existing CLI start flow

---

## Steps

### Step 1: Define Shared Types
- **Package:** `packages/shared/`
- **Files to create/modify:**
  - `packages/shared/src/projects.ts` (new)
  - `packages/shared/src/index.ts` (modify - export new types)
- **Changes:**
  - Create `ProjectId` branded type (same pattern as SessionId)
  - Create `Project` interface with all required fields:
    - `id: ProjectId` (UUID)
    - `name: string`
    - `cwd: string` (absolute path)
    - `defaultCliFlags: string[]`
    - `defaultPromptTemplate: string | null`
    - `mcpConfigPath: string | null`
    - `envVars: Record<string, string>`
    - `quickActionPresets: QuickActionDefinition[]`
    - `description: string | null`
    - `createdAt: Timestamp`
    - `lastUsedAt: Timestamp`
    - `actionflowsDetected: boolean`
  - Create `ProjectAutoDetectionResult` interface for auto-detection response:
    - `name: string | null`
    - `actionflowsDetected: boolean`
    - `mcpConfigPath: string | null`
    - `suggestedFlags: string[]`
    - `projectType: 'monorepo' | 'nodejs' | 'python' | 'other' | null`
  - Create `QuickActionDefinition` interface (reuse from sessionWindows if exists):
    - `id: string`
    - `label: string`
    - `icon: string`
    - `value: string`
    - `contextPatterns?: string[]`
    - `alwaysShow?: boolean`
  - Export all new types from `packages/shared/src/index.ts`
- **Depends on:** Nothing

### Step 2: Create Backend Validation Schemas
- **Package:** `packages/backend/`
- **Files to modify:**
  - `packages/backend/src/schemas/api.ts`
- **Changes:**
  - Import `path` module (already imported)
  - Create Zod schemas for project API validation:
    - `createProjectSchema`: validate POST /api/projects body
      - `name: z.string().min(1).max(200)`
      - `cwd: z.string().min(1).max(500).refine(path.isAbsolute)`
      - `defaultCliFlags: z.array(z.string().max(200)).max(50).optional()`
      - `defaultPromptTemplate: z.string().max(10000).optional().nullable()`
      - `mcpConfigPath: z.string().max(500).optional().nullable()`
      - `envVars: z.record(z.string().max(1000)).optional()`
      - `quickActionPresets: z.array(quickActionSchema).max(50).optional()`
      - `description: z.string().max(2000).optional().nullable()`
    - `updateProjectSchema`: validate PUT /api/projects/:id body
      - All fields from createProjectSchema, all optional
    - `autoDetectProjectSchema`: validate POST /api/projects/detect body
      - `cwd: z.string().min(1).max(500).refine(path.isAbsolute)`
  - Export TypeScript types: `CreateProjectRequest`, `UpdateProjectRequest`, `AutoDetectProjectRequest`
- **Depends on:** Step 1 (needs shared types for reference)

### Step 3: Create Project Auto-Detection Service
- **Package:** `packages/backend/`
- **Files to create:**
  - `packages/backend/src/services/projectDetector.ts` (new)
- **Changes:**
  - Create `ProjectDetector` class with static methods
  - `detectProject(cwd: string): Promise<ProjectAutoDetectionResult>`
    - Use Node.js `fs.promises` to check for files/directories
    - Check `.claude/actionflows/` → set `actionflowsDetected`
    - Check `.claude/CLAUDE.md` → parse "Name:" field with regex
    - Check `.claude/settings.json`, `claude.json`, `.claude/mcp.json` → set `mcpConfigPath`
    - Check `package.json` → fallback project name, detect monorepo (pnpm-workspace.yaml, lerna.json)
    - Check `pyproject.toml`, `setup.py` → detect Python project
    - Check `.git/` → detect if it's a git repo
    - Suggest default flags based on detection (e.g., `--mcp-config` if MCP found)
    - Return `ProjectAutoDetectionResult`
  - Add path traversal validation (reuse pattern from claudeCliManager)
  - Add error handling for permission denied, path not found
- **Depends on:** Step 1 (needs `ProjectAutoDetectionResult` type)

### Step 4: Create Project Storage Service (File-based JSON)
- **Package:** `packages/backend/`
- **Files to create:**
  - `packages/backend/src/services/projectStorage.ts` (new)
- **Changes:**
  - Create `ProjectStorage` class
  - Constructor:
    - Determine storage path based on platform:
      - Windows: `process.env.APPDATA + '/actionflows/projects.json'`
      - macOS/Linux: `process.env.HOME + '/.actionflows/projects.json'`
    - Create directory if it doesn't exist
    - Load projects from file into in-memory Map on startup
  - Private methods:
    - `loadFromFile(): Promise<void>` - read JSON, populate in-memory Map
    - `saveToFile(): Promise<void>` - write in-memory Map to JSON (atomic write with temp file)
  - Public CRUD methods:
    - `getAllProjects(): Promise<Project[]>` - return all projects sorted by lastUsedAt desc
    - `getProject(id: ProjectId): Promise<Project | null>`
    - `createProject(data: Omit<Project, 'id' | 'createdAt' | 'lastUsedAt'>): Promise<Project>` - generate UUID, timestamps
    - `updateProject(id: ProjectId, data: Partial<Project>): Promise<Project>` - update + save
    - `deleteProject(id: ProjectId): Promise<boolean>` - remove + save
    - `updateLastUsed(id: ProjectId): Promise<void>` - update lastUsedAt + save
  - Singleton export: `export const projectStorage = new ProjectStorage()`
  - Add file locking mechanism (use lockfile or in-memory mutex) to prevent concurrent writes
- **Depends on:** Step 1 (needs `Project`, `ProjectId` types)

### Step 5: Create Project API Routes
- **Package:** `packages/backend/`
- **Files to create:**
  - `packages/backend/src/routes/projects.ts` (new)
- **Files to modify:**
  - `packages/backend/src/index.ts` (register router)
- **Changes:**
  - Create Express router with CRUD endpoints:
    - `GET /api/projects` - list all projects (sorted by lastUsedAt desc)
      - Returns: `{ count: number, projects: Project[] }`
    - `GET /api/projects/:id` - get single project
      - Validate `:id` param with validateSessionIdParam pattern
      - Returns: `{ project: Project }`
      - 404 if not found
    - `POST /api/projects` - create new project
      - Validate body with `createProjectSchema`
      - Apply writeLimiter middleware
      - Call `projectStorage.createProject()`
      - Returns: `{ success: true, project: Project }`
    - `PUT /api/projects/:id` - update project
      - Validate `:id` param and body with `updateProjectSchema`
      - Apply writeLimiter middleware
      - Call `projectStorage.updateProject()`
      - Returns: `{ success: true, project: Project }`
      - 404 if not found
    - `DELETE /api/projects/:id` - delete project
      - Validate `:id` param
      - Apply writeLimiter middleware
      - Call `projectStorage.deleteProject()`
      - Returns: `{ success: true, deleted: true }`
      - 404 if not found
    - `POST /api/projects/detect` - auto-detect project metadata
      - Validate body with `autoDetectProjectSchema`
      - Apply writeLimiter middleware
      - Call `ProjectDetector.detectProject(cwd)`
      - Returns: `{ success: true, detected: ProjectAutoDetectionResult }`
  - Register router in `packages/backend/src/index.ts`:
    - Import: `import projectsRouter from './routes/projects.js'`
    - Add: `app.use('/api/projects', projectsRouter)`
- **Depends on:** Step 2 (validation schemas), Step 3 (detector), Step 4 (storage)

### Step 6: Update Claude CLI Start Flow to Accept Project Metadata
- **Package:** `packages/backend/`
- **Files to modify:**
  - `packages/backend/src/services/claudeCliManager.ts`
  - `packages/backend/src/routes/claudeCli.ts`
  - `packages/backend/src/schemas/api.ts`
- **Changes:**
  - Modify `claudeCliStartSchema` to accept optional `projectId`:
    - `projectId: z.string().optional()`
    - `envVars: z.record(z.string().max(1000)).optional()`
    - `mcpConfigPath: z.string().max(500).optional()`
  - Modify `claudeCliManager.startSession()` signature:
    - Add optional params: `envVars?: Record<string, string>`, `mcpConfigPath?: string`
    - If `mcpConfigPath` is provided, use it instead of generating MCP config
    - If `envVars` is provided, merge with spawn environment
  - Modify `POST /api/claude-cli/start` route:
    - If `projectId` is provided in body, call `projectStorage.updateLastUsed(projectId)`
    - Pass `envVars` and `mcpConfigPath` to `claudeCliManager.startSession()`
  - Security: Validate all env var keys/values for command injection patterns
- **Depends on:** Step 4 (projectStorage), Step 5 (projectId concept)

### Step 7: Create Frontend Project API Client
- **Package:** `packages/app/`
- **Files to create:**
  - `packages/app/src/services/projectService.ts` (new)
- **Changes:**
  - Create `ProjectService` class (follow pattern from `claudeCliService.ts`)
  - Constructor: accept `baseUrl` (default `http://localhost:3001`)
  - Methods:
    - `listProjects(): Promise<Project[]>` - GET /api/projects
    - `getProject(id: ProjectId): Promise<Project>` - GET /api/projects/:id
    - `createProject(data: CreateProjectRequest): Promise<Project>` - POST /api/projects
    - `updateProject(id: ProjectId, data: UpdateProjectRequest): Promise<Project>` - PUT /api/projects/:id
    - `deleteProject(id: ProjectId): Promise<void>` - DELETE /api/projects/:id
    - `detectProject(cwd: string): Promise<ProjectAutoDetectionResult>` - POST /api/projects/detect
  - Singleton export: `export const projectService = new ProjectService()`
  - Add error handling (throw Error with server error message)
- **Depends on:** Step 1 (shared types), Step 5 (API routes)

### Step 8: Create Frontend Project Management Hook
- **Package:** `packages/app/`
- **Files to create:**
  - `packages/app/src/hooks/useProjects.ts` (new)
- **Changes:**
  - Create `useProjects()` hook (follow pattern from `useClaudeCliSessions.ts`)
  - State:
    - `projects: Project[]` (sorted by lastUsedAt desc)
    - `isLoading: boolean`
    - `error: Error | null`
  - Methods:
    - `loadProjects(): Promise<void>` - fetch all projects
    - `createProject(data: CreateProjectRequest): Promise<Project>`
    - `updateProject(id: ProjectId, data: UpdateProjectRequest): Promise<Project>`
    - `deleteProject(id: ProjectId): Promise<void>`
    - `detectProject(cwd: string): Promise<ProjectAutoDetectionResult>`
  - `useEffect` to load projects on mount
  - Return: `{ projects, loadProjects, createProject, updateProject, deleteProject, detectProject, isLoading, error }`
- **Depends on:** Step 7 (projectService)

### Step 9: Create Project Selection UI Component
- **Package:** `packages/app/`
- **Files to create:**
  - `packages/app/src/components/ClaudeCliTerminal/ProjectSelector.tsx` (new)
- **Changes:**
  - Create `ProjectSelector` component
  - Props:
    - `projects: Project[]`
    - `selectedProjectId: ProjectId | null`
    - `onSelectProject: (project: Project | null) => void`
    - `onAddNewProject: () => void`
  - UI:
    - Dropdown/select showing project names (sorted by lastUsedAt)
    - Show `name` and `cwd` (truncated) for each project
    - "Add New Project..." option at bottom (with "+" icon)
    - When selected, call `onSelectProject` with full Project object
    - Show project details when hovered (description, last used, flags preview)
  - Styling: Match existing dark theme from ClaudeCliStartDialog
- **Depends on:** Step 1 (Project type), Step 8 (useProjects hook)

### Step 10: Create Project Form UI Component
- **Package:** `packages/app/`
- **Files to create:**
  - `packages/app/src/components/ClaudeCliTerminal/ProjectForm.tsx` (new)
- **Changes:**
  - Create `ProjectForm` component
  - Props:
    - `mode: 'create' | 'edit'`
    - `initialData?: Partial<Project>`
    - `onSave: (data: CreateProjectRequest | UpdateProjectRequest) => Promise<void>`
    - `onCancel: () => void`
    - `isLoading: boolean`
  - UI:
    - Form fields:
      - `cwd` input (text, required) + "Browse" button (Electron file dialog)
      - "Detect" button next to cwd (calls auto-detection)
      - `name` input (text, required, auto-filled from detection)
      - `description` textarea (optional)
      - `defaultPromptTemplate` textarea (optional)
      - `defaultCliFlags` multi-checkbox (same pattern as ClaudeCliStartDialog flags)
      - `mcpConfigPath` input (text, optional, auto-filled from detection)
      - `envVars` key-value pair inputs (dynamic add/remove rows)
      - `quickActionPresets` section (expand/collapse, dynamic add/remove)
    - "Save" and "Cancel" buttons
    - Show auto-detection results (detected project type, actionflows badge)
  - State management for form fields (React controlled components)
  - Validation: required fields, absolute path for cwd
  - Styling: Match existing dark theme
- **Depends on:** Step 1 (Project types), Step 8 (detectProject method)

### Step 11: Replace ClaudeCliStartDialog with Project-Aware Version
- **Package:** `packages/app/`
- **Files to modify:**
  - `packages/app/src/components/ClaudeCliTerminal/ClaudeCliStartDialog.tsx`
- **Changes:**
  - Import `useProjects` hook, `ProjectSelector`, `ProjectForm` components
  - Add state:
    - `mode: 'select-project' | 'add-project' | 'edit-project'` (default 'select-project')
    - `selectedProject: Project | null`
    - `formData: Partial<Project>`
  - UI flow:
    1. **Select Project Mode (default):**
       - Show `<ProjectSelector />` instead of cwd text input
       - When project selected, pre-fill fields:
         - `cwd` (read-only, show full path)
         - `prompt` (use `defaultPromptTemplate` if exists)
         - `selectedFlags` (use `defaultCliFlags`)
       - Show "Edit Project" button to switch to edit mode
       - Show "Add New Project" button to switch to add mode
    2. **Add Project Mode:**
       - Show `<ProjectForm mode="create" />` (full screen dialog)
       - On save, create project via `createProject()`, switch back to select mode
       - On cancel, switch back to select mode
    3. **Edit Project Mode:**
       - Show `<ProjectForm mode="edit" initialData={selectedProject} />`
       - On save, update project via `updateProject()`, switch back to select mode
       - On cancel, switch back to select mode
  - When "Start Session" clicked:
    - If project selected, pass `projectId`, `envVars`, `mcpConfigPath` to API
    - Update project's `lastUsedAt` timestamp (handled by backend)
  - Maintain backward compatibility: allow manual cwd input if no project selected (fallback mode)
- **Depends on:** Step 8 (useProjects), Step 9 (ProjectSelector), Step 10 (ProjectForm)

### Step 12: Update ClaudeCliService to Pass Project Metadata
- **Package:** `packages/app/`
- **Files to modify:**
  - `packages/app/src/services/claudeCliService.ts`
- **Changes:**
  - Modify `startSession()` method signature:
    - Add optional params: `projectId?: ProjectId`, `envVars?: Record<string, string>`, `mcpConfigPath?: string`
  - Include new fields in POST body to `/api/claude-cli/start`
  - Update TypeScript types to match
- **Depends on:** Step 6 (backend API changes), Step 1 (ProjectId type)

### Step 13: Update useClaudeCliSessions Hook
- **Package:** `packages/app/`
- **Files to modify:**
  - `packages/app/src/hooks/useClaudeCliSessions.ts`
- **Changes:**
  - Modify `startSession()` method signature:
    - Add optional params: `projectId?: ProjectId`, `envVars?: Record<string, string>`, `mcpConfigPath?: string`
  - Pass new params to `claudeCliService.startSession()`
- **Depends on:** Step 12 (claudeCliService changes)

### Step 14: Add TypeScript Build & Type Checking
- **Package:** All packages
- **Files to modify:**
  - None (verification step only)
- **Changes:**
  - Run `pnpm type-check` to ensure all packages compile
  - Fix any type errors from new interfaces
  - Ensure `packages/shared/src/index.ts` exports all new types
  - Ensure `packages/backend` and `packages/app` import from `@afw/shared`
- **Depends on:** All previous steps

### Step 15: Integration Testing
- **Package:** All packages
- **Files to create:**
  - `packages/backend/src/__tests__/projects.test.ts` (new)
- **Changes:**
  - Write integration tests for project CRUD:
    - Test POST /api/projects (create project)
    - Test GET /api/projects (list projects)
    - Test PUT /api/projects/:id (update project)
    - Test DELETE /api/projects/:id (delete project)
    - Test POST /api/projects/detect (auto-detection)
    - Test project sorting by lastUsedAt
  - Write tests for projectStorage:
    - Test file persistence (create → read → verify JSON file)
    - Test concurrent writes (mutex locking)
  - Write tests for projectDetector:
    - Test detection of .claude/actionflows/
    - Test parsing of CLAUDE.md
    - Test MCP config detection
  - Manual UI testing:
    - Test project dropdown selection
    - Test "Add New Project" flow
    - Test auto-detection in form
    - Test starting a session from a registered project
    - Test updating lastUsedAt timestamp
- **Depends on:** All previous steps

---

## Dependency Graph

```
Step 1 (Shared Types)
  ↓
Step 2 (Validation Schemas)  Step 3 (Auto-Detection Service)
  ↓                                    ↓
Step 4 (Storage Service) ←───────────┘
  ↓
Step 5 (Backend Routes)
  ↓
Step 6 (Update CLI Start Flow) ←─────┐
  ↓                                   │
Step 7 (Frontend API Client)         │
  ↓                                   │
Step 8 (useProjects Hook)             │
  ↓                                   │
Step 9 (ProjectSelector UI)  Step 10 (ProjectForm UI)
  ↓                              ↓
Step 11 (Replace Start Dialog) ←┘
  ↓
Step 12 (Update claudeCliService)
  ↓
Step 13 (Update useClaudeCliSessions)
  ↓
Step 14 (Type Checking) → Step 15 (Testing)
```

**Parallel Work Opportunities:**
- Steps 2 and 3 can run in parallel (both depend only on Step 1)
- Steps 9 and 10 can run in parallel (both depend on Step 8)
- Step 7 can start as soon as Step 5 is complete (independent of Step 6)

---

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| **File-based storage race conditions** | Medium - Concurrent writes could corrupt projects.json | Implement file locking (lockfile package) or in-memory mutex to serialize writes. Use atomic write pattern (write to temp file, then rename). |
| **Path traversal in cwd validation** | High - Security vulnerability if malicious cwd provided | Reuse robust validation from `claudeCliManager.validateCwd()`. Normalize paths, deny system directories, check for `..` traversal. |
| **Command injection via env vars** | High - Malicious env vars could execute commands | Validate env var keys (alphanumeric + underscore only) and values (escape special chars). Use Zod schema to limit length and character set. |
| **Breaking change to claudeCliService API** | Medium - Existing code may break if signature changes | Make all new parameters optional. Maintain backward compatibility by keeping existing `startSession(sessionId, cwd, prompt, flags)` signature working. |
| **Large projects.json file** | Low - Performance degradation if many projects | Limit max projects to 100. Add pagination to API if needed. Consider DB migration in future. |
| **Electron IPC for file dialog** | Medium - File browse button requires Electron IPC | Check if Electron `dialog.showOpenDialog` is already available in main process. If not, add IPC handler. Gracefully degrade to text input only if IPC unavailable. |
| **Auto-detection permission errors** | Low - fs.access may throw on restricted directories | Wrap all fs operations in try-catch. Return partial detection results if some checks fail. Log errors but don't throw. |
| **Platform differences in config paths** | Medium - Path logic may not work on all platforms | Test on Windows, macOS, Linux. Use `process.platform` checks. Provide env var override (`AFW_PROJECT_CONFIG_PATH`) for custom locations. |
| **UI complexity in ProjectForm** | Medium - Many fields may overwhelm users | Use collapsible sections for advanced fields (envVars, quickActions). Provide "Simple" vs "Advanced" mode toggle. Save defaults for most users. |
| **lastUsedAt not updating** | Low - Sorting may be incorrect if update fails | Log warning if updateLastUsed fails. Don't block session start on this failure (fire-and-forget pattern). |

---

## Verification Checklist

- [ ] **Type check passes across all packages** (`pnpm type-check`)
- [ ] **Existing tests pass** (`pnpm test`)
- [ ] **New backend tests pass** (projects CRUD, storage, detector)
- [ ] **Backend API endpoints respond correctly:**
  - [ ] GET /api/projects returns projects sorted by lastUsedAt
  - [ ] POST /api/projects creates new project and saves to file
  - [ ] PUT /api/projects/:id updates project
  - [ ] DELETE /api/projects/:id removes project
  - [ ] POST /api/projects/detect returns detection results
- [ ] **Frontend UI functionality:**
  - [ ] Project dropdown shows all projects sorted by last used
  - [ ] Selecting a project pre-fills cwd, prompt, flags
  - [ ] "Add New Project" opens project form
  - [ ] Auto-detection button populates form fields
  - [ ] Saving a project adds it to dropdown
  - [ ] Starting a session from project updates lastUsedAt
  - [ ] Edit project flow updates existing project
- [ ] **File persistence:**
  - [ ] projects.json is created in correct location (APPDATA or HOME)
  - [ ] Projects persist across backend restarts
  - [ ] Atomic writes prevent corruption
- [ ] **Security validation:**
  - [ ] Path traversal attempts are rejected
  - [ ] Command injection in env vars is prevented
  - [ ] cwd validation blocks system directories
- [ ] **Backward compatibility:**
  - [ ] Existing Claude CLI start flow still works without project
  - [ ] Manual cwd input is still available
- [ ] **Cross-platform:**
  - [ ] Config path resolves correctly on Windows, macOS, Linux
  - [ ] File operations work on all platforms

---

## Post-Implementation Enhancements (Future)

- **Project Import/Export:** Allow users to export projects as JSON and import them on different machines
- **Project Templates:** Pre-defined project templates for common setups (Node.js monorepo, Python project, etc.)
- **Project Search:** Search/filter projects by name, description, or tags
- **Project Tags:** Add tagging system for organizing projects by category
- **Recent Projects:** Quick access list of 5 most recently used projects
- **Project Analytics:** Track usage stats (session count, success rate) per project
- **MCP Config Generator:** UI wizard to build MCP configs instead of manual JSON
- **Environment Profiles:** Multiple env var profiles per project (dev, staging, prod)
- **Git Integration:** Auto-detect current branch, offer to create new branch per session
- **Database Migration:** Move from JSON file to SQLite or Redis for better scalability

---

## Notes

- **Architecture Decision:** File-based JSON storage chosen for simplicity and portability. No Redis/database dependency for user config data. Easy to backup/sync via cloud storage.
- **UI Pattern:** Follow existing patterns from `ClaudeCliStartDialog` and `SessionWindowCard` for consistent dark theme styling.
- **Security First:** Path validation and command injection prevention are critical. Reuse proven patterns from `claudeCliManager`.
- **Backward Compatibility:** All new parameters are optional. Existing code that doesn't use projects will continue to work.
- **Progressive Enhancement:** Start with simple dropdown, add advanced features (auto-detection, env vars, quick actions) incrementally.
- **Type Safety:** Leverage branded types (`ProjectId`) to prevent mixing project IDs with session IDs at compile time.
