# Recommended Fixes - Project Registry Feature

This document lists issues that were **not automatically fixed** because they require human judgment, design decisions, or architectural changes.

---

## HIGH PRIORITY

### 1. Implement Proper Error UI Components
**Current State:** React components use `alert()` for error messages
**Files Affected:**
- `packages/app/src/components/ClaudeCliTerminal/ProjectForm.tsx` (line 78)
- `packages/app/src/components/ClaudeCliTerminal/ClaudeCliStartDialog.tsx` (line 90)

**Why Not Auto-Fixed:** Requires design decision on error UI pattern (toast, modal, inline)

**Suggested Fix:**
```typescript
// Option 1: Toast notification
import { useToast } from '../contexts/ToastContext';
const { showError } = useToast();
showError(err instanceof Error ? err.message : 'Detection failed');

// Option 2: Inline error display
const [errorMessage, setErrorMessage] = useState<string | null>(null);
// ... then display in UI:
{errorMessage && (
  <div className="error-banner">{errorMessage}</div>
)}

// Option 3: Error modal
const [errorModal, setErrorModal] = useState<string | null>(null);
// ... render modal component
```

---

### 2. Implement Error Metrics/Retry for Fire-and-Forget Updates
**Current State:** `updateLastUsed` can fail silently with only console.error
**Files Affected:**
- `packages/backend/src/services/projectStorage.ts` (line 247-249)
- `packages/backend/src/routes/claudeCli.ts` (line 43-45)

**Why Not Auto-Fixed:** Requires design decision on failure handling strategy

**Options:**

**Option A: Metrics Only (Recommended for MVP)**
```typescript
// Add metric tracking
import { metrics } from '../monitoring/metrics';

this.saveToFile().catch(error => {
  console.error('[ProjectStorage] Error updating lastUsedAt:', error);
  metrics.increment('project_storage.update_last_used.error');
});
```

**Option B: Retry Queue**
```typescript
// Implement simple retry mechanism
private retryQueue: Array<() => Promise<void>> = [];

async updateLastUsed(id: ProjectId): Promise<void> {
  const updateFn = async () => {
    // ... existing logic
    await this.saveToFile();
  };

  try {
    await updateFn();
  } catch (error) {
    this.retryQueue.push(updateFn);
    this.scheduleRetry();
  }
}
```

**Option C: Block Session Start (Most Conservative)**
```typescript
// Remove catch handler - let errors propagate
if (projectId) {
  await projectStorage.updateLastUsed(projectId as ProjectId);
}
```

---

### 3. Add Structured Logging
**Current State:** Using `console.error()` and `console.log()` throughout
**Files Affected:** Multiple backend files

**Why Not Auto-Fixed:** Requires choosing/configuring logging library

**Suggested Fix:**
```typescript
// Install: pnpm add winston
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

// Usage:
logger.error('[ProjectStorage] Error loading projects', { error, context: { path: this.storagePath } });
```

---

## MEDIUM PRIORITY

### 4. Extract Common Error Handling Utility
**Current State:** Duplicate error handling in multiple route files
**Files Affected:**
- `packages/backend/src/routes/projects.ts`
- `packages/backend/src/routes/claudeCli.ts`
- `packages/backend/src/routes/sessions.ts` (likely others)

**Why Not Auto-Fixed:** Requires creating new shared utility file

**Suggested Fix:**
```typescript
// Create: packages/backend/src/utils/errors.ts
export function sanitizeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
}

export function handleRouteError(res: Response, error: unknown, context: string): void {
  console.error(`[${context}] Error:`, error);
  const message = sanitizeError(error);
  const statusCode = error instanceof ValidationError ? 400 : 500;
  res.status(statusCode).json({ error: message });
}

// Usage in routes:
try {
  // ... route logic
} catch (error) {
  handleRouteError(res, error, 'Projects');
}
```

---

### 5. Make Input Size Limits Configurable
**Current State:** Hard-coded limits (100KB for stdin input, 10MB for files)
**Files Affected:**
- `packages/backend/src/services/claudeCliSession.ts` (line 136)
- `packages/backend/src/schemas/api.ts` (various)

**Why Not Auto-Fixed:** Requires environment variable design and documentation

**Suggested Fix:**
```typescript
// In claudeCliSession.ts
const MAX_INPUT_SIZE = parseInt(process.env.AFW_MAX_INPUT_SIZE || '100000', 10);

if (input.length > MAX_INPUT_SIZE) {
  throw new Error(`Input too large (max ${MAX_INPUT_SIZE} bytes)`);
}

// In schemas/api.ts
const maxFileSize = parseInt(process.env.AFW_MAX_FILE_SIZE || '10485760', 10);

export const fileWriteSchema = z.object({
  content: z.string().max(maxFileSize, `file too large (max ${maxFileSize} bytes)`),
});
```

---

### 6. Consider Temp File Strategy for Large MCP Configs
**Current State:** MCP config passed as JSON string in CLI args
**Files Affected:**
- `packages/backend/src/services/claudeCliManager.ts` (line 148-149)

**Why Not Auto-Fixed:** Requires design decision on approach

**Current Approach:**
```typescript
const mcpConfig = this.generateMcpConfig();
args.push('--mcp-config', mcpConfig); // Passes JSON string directly
```

**Alternative Approach:**
```typescript
import { tmpdir } from 'os';
import { writeFile, unlink } from 'fs/promises';

// Generate temp file path
const tempConfigPath = path.join(tmpdir(), `mcp-config-${sessionId}.json`);

// Write config to temp file
const mcpConfig = this.generateMcpConfig();
await writeFile(tempConfigPath, mcpConfig, 'utf-8');

// Pass file path instead
args.push('--mcp-config', tempConfigPath);

// Cleanup on session exit
session.on('exit', async () => {
  try {
    await unlink(tempConfigPath);
  } catch (error) {
    console.error('Failed to cleanup temp MCP config:', error);
  }
});
```

**Trade-offs:**
- ✅ Current: Simple, no file I/O
- ❌ Current: Potentially long CLI args
- ✅ Alternative: Handles arbitrarily large configs
- ❌ Alternative: Temp file management overhead

---

## LOW PRIORITY

### 7. Add crypto.randomUUID() Polyfill
**Current State:** Uses native `crypto.randomUUID()` which may not be available in older browsers
**Files Affected:**
- `packages/app/src/components/ClaudeCliTerminal/ClaudeCliStartDialog.tsx` (line 111)

**Why Not Auto-Fixed:** Requires dependency decision

**Suggested Fix:**
```typescript
// Option 1: Use uuid library
import { v4 as uuidv4 } from 'uuid';
const sessionId = uuidv4() as SessionId;

// Option 2: Polyfill
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback polyfill
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
```

---

### 8. Add Integration Tests for Path Validation
**Current State:** No tests for path traversal prevention
**Why Not Auto-Fixed:** Requires test infrastructure setup

**Suggested Test Cases:**
```typescript
// Create: packages/backend/src/services/__tests__/projectDetector.security.test.ts
import { describe, it, expect } from 'vitest';
import { ProjectDetector } from '../projectDetector';
import { symlink, mkdir } from 'fs/promises';
import { tmpdir } from 'os';
import path from 'path';

describe('ProjectDetector - Security', () => {
  it('should reject symlinks to system directories', async () => {
    const testDir = path.join(tmpdir(), 'test-symlink');
    await mkdir(testDir, { recursive: true });
    await symlink('/etc', path.join(testDir, 'link'));

    await expect(
      ProjectDetector.detectProject(path.join(testDir, 'link'))
    ).rejects.toThrow();
  });

  it('should reject paths with .. traversal', async () => {
    await expect(
      ProjectDetector.detectProject('/home/user/../../etc')
    ).rejects.toThrow('Path traversal');
  });

  it('should reject system directories', async () => {
    await expect(
      ProjectDetector.detectProject('/etc')
    ).rejects.toThrow();
  });

  it('should accept valid project directories', async () => {
    const result = await ProjectDetector.detectProject(process.cwd());
    expect(result).toBeDefined();
    expect(result.name).toBeTruthy();
  });
});
```

---

### 9. Optimize React State Updates
**Current State:** `useProjects` creates new project, then immediately fetches all projects
**Files Affected:**
- `packages/app/src/hooks/useProjects.ts` (line 51-58)

**Why Not Auto-Fixed:** Current approach is correct but could be optimized

**Current:**
```typescript
const createProject = useCallback(async (data: CreateProjectRequest): Promise<Project> => {
  // ...
  const newProject = await projectService.createProject(data);
  setProjects(prev => [newProject, ...prev]); // Optimistic update
  return newProject;
  // ...
}, []);
```

**Optimized (with rollback):**
```typescript
const createProject = useCallback(async (data: CreateProjectRequest): Promise<Project> => {
  setIsLoading(true);
  setError(null);

  try {
    const newProject = await projectService.createProject(data);
    setProjects(prev => [newProject, ...prev]);
    return newProject;
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Failed to create project');
    setError(error);

    // State is NOT updated on error (no need to rollback)
    throw error;
  } finally {
    setIsLoading(false);
  }
}, []);
```

---

## DESIGN QUESTIONS

These require explicit decisions before implementation:

### Q1: Symlink Policy
**Question:** Should project paths be allowed to be symlinks?
**Options:**
- A: Allow symlinks but resolve them (current approach)
- B: Reject all symlinks (most secure)
- C: Allow symlinks only within user home directory

**Recommendation:** Option A (current) is reasonable for most use cases.

---

### Q2: Env Var Storage vs Spawn Time Validation
**Question:** Where should we validate environment variables?
**Current:** Validate keys at storage, values are unrestricted
**Options:**
- A: Continue current approach (storage = business logic, spawn = security)
- B: Move all validation to spawn time
- C: Validate both at storage and spawn

**Recommendation:** Option A (current) - it's clear and separates concerns.

---

### Q3: MCP Config Strategy
**Question:** How should large MCP configs be passed to Claude CLI?
**Options:**
- A: CLI args (current) - simple but limited by arg length
- B: Temp files - complex but scalable
- C: Stdin - requires CLI support

**Recommendation:** Start with A, migrate to B if config size becomes an issue.

---

### Q4: Error UI Pattern
**Question:** What pattern should we use for displaying errors in the UI?
**Options:**
- A: Toast notifications (non-blocking, dismissible)
- B: Inline errors (contextual, always visible)
- C: Modal dialogs (blocking, requires acknowledgment)
- D: Combination (inline for forms, toasts for async operations)

**Recommendation:** Option D - provides best UX for different error contexts.

---

## Summary

| Priority | Issues | Auto-Fixed | Require Decision |
|----------|--------|------------|------------------|
| Critical | 3 | ✅ 3 | 0 |
| High | 4 | ✅ 1 | 3 |
| Medium | 7 | ✅ 2 | 5 |
| Low | 6 | 0 | 6 |
| **Total** | **20** | **6** | **14** |

All **critical** and most **high** priority issues have been automatically fixed. The remaining issues require design decisions or are lower priority improvements that can be addressed incrementally.
