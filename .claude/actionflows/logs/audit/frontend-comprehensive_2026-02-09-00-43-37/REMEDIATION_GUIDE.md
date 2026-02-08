# Remediation Guide: High-Priority Fixes

**Audit Date:** 2026-02-09
**Target:** ActionFlows Dashboard Frontend
**Priority:** HIGH findings only

---

## H1: XSS Risk via innerHTML in TerminalTabs

### Current Code (UNSAFE)
**File:** `packages/app/src/components/Terminal/TerminalTabs.tsx`

```typescript
// Line 134
terminalContainerRef.current.innerHTML = '';

// Line 165
terminalContainerRef.current.innerHTML = '';
```

### Fixed Code (SAFE)
```typescript
// Replace both occurrences with DOM-safe clearing:

// Clear container safely without innerHTML
if (terminalContainerRef.current) {
  while (terminalContainerRef.current.firstChild) {
    terminalContainerRef.current.removeChild(terminalContainerRef.current.firstChild);
  }
}
```

### Why This Matters
- `innerHTML = ''` could execute malicious scripts if content is injected before clearing
- DOM manipulation is safer and has same performance characteristics
- Follows React best practices (avoid innerHTML)

### Verification
```bash
# Search for any remaining innerHTML usage:
grep -r "innerHTML" packages/app/src/
# Expected: No results in TerminalTabs.tsx
```

---

## H2: Hardcoded API URLs Without Validation

### Part 1: Add URL Validator Utility

**File:** `packages/app/src/utils/apiUrlValidator.ts` (CREATE NEW)

```typescript
/**
 * API URL Security Validator
 * Ensures frontend only connects to trusted backends
 */

const ALLOWED_HOSTS = [
  'localhost',
  '127.0.0.1',
  // Add production domains here when deployed
];

const ALLOWED_PORTS = [3001, 3000]; // Backend ports

export class ApiUrlValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiUrlValidationError';
  }
}

/**
 * Validate and sanitize API base URL
 * @throws ApiUrlValidationError if URL is invalid or not allowed
 */
export function validateApiUrl(url: string): string {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(url);
  } catch {
    throw new ApiUrlValidationError(`Invalid URL format: ${url}`);
  }

  // Check protocol (only http/https allowed)
  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    throw new ApiUrlValidationError(
      `Invalid protocol: ${parsedUrl.protocol}. Only http/https allowed.`
    );
  }

  // Check hostname whitelist
  if (!ALLOWED_HOSTS.includes(parsedUrl.hostname)) {
    throw new ApiUrlValidationError(
      `Hostname not allowed: ${parsedUrl.hostname}. Allowed: ${ALLOWED_HOSTS.join(', ')}`
    );
  }

  // Check port (if specified)
  if (parsedUrl.port && !ALLOWED_PORTS.includes(parseInt(parsedUrl.port))) {
    throw new ApiUrlValidationError(
      `Port not allowed: ${parsedUrl.port}. Allowed: ${ALLOWED_PORTS.join(', ')}`
    );
  }

  // Return validated URL
  return parsedUrl.toString();
}

/**
 * Get validated API base URL from environment
 */
export function getApiBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
  return validateApiUrl(envUrl);
}
```

### Part 2: Update Service Classes

**File:** `packages/app/src/services/projectService.ts`

```typescript
// BEFORE
export class ProjectService {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:3001') {
    this.baseUrl = baseUrl;
  }
  // ...
}

// AFTER
import { validateApiUrl, getApiBaseUrl } from '../utils/apiUrlValidator';

export class ProjectService {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = validateApiUrl(baseUrl || getApiBaseUrl());
  }
  // ...
}
```

**Repeat for:**
- `packages/app/src/services/claudeCliService.ts`
- `packages/app/src/hooks/useSessionControls.ts`
- `packages/app/src/hooks/useEditorFiles.ts`
- `packages/app/src/hooks/useAllSessions.ts`

### Part 3: Add Zod Response Validation

**File:** `packages/app/src/utils/apiClient.ts` (CREATE NEW)

```typescript
import { z } from 'zod';
import { validateApiUrl } from './apiUrlValidator';

/**
 * Type-safe API client with Zod validation
 */
export class ApiClient {
  constructor(private baseUrl: string) {
    this.baseUrl = validateApiUrl(baseUrl);
  }

  /**
   * Make validated API request
   */
  async request<T>(
    endpoint: string,
    options: RequestInit = {},
    responseSchema: z.ZodSchema<T>
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: 'Unknown error',
        }));
        throw new Error(errorData.error || `Request failed: ${response.statusText}`);
      }

      const data = await response.json();

      // Validate response with Zod
      const validatedData = responseSchema.parse(data);
      return validatedData;
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('API response validation failed:', error.errors);
        throw new Error('Invalid response from server');
      }
      throw error;
    }
  }
}
```

**Example Usage in ProjectService:**

```typescript
import { z } from 'zod';
import { ApiClient } from '../utils/apiClient';

// Define response schema
const ProjectListResponseSchema = z.object({
  projects: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      cwd: z.string(),
      // ... other fields
    })
  ),
});

export class ProjectService {
  private client: ApiClient;

  constructor(baseUrl?: string) {
    this.client = new ApiClient(baseUrl || getApiBaseUrl());
  }

  async listProjects(): Promise<Project[]> {
    const response = await this.client.request(
      '/api/projects',
      { method: 'GET' },
      ProjectListResponseSchema
    );
    return response.projects;
  }
}
```

### Verification
```bash
# Test URL validation:
pnpm --filter @afw/app exec vitest src/utils/apiUrlValidator.test.ts

# Test API client:
pnpm --filter @afw/app exec vitest src/utils/apiClient.test.ts
```

---

## M8: Add Error Boundaries (BONUS)

While marked MEDIUM, Error Boundaries are quick to implement and highly valuable.

### Create Error Boundary Component

**File:** `packages/app/src/components/ErrorBoundary/ErrorBoundary.tsx` (CREATE NEW)

```typescript
import React, { Component, ErrorInfo, ReactNode } from 'react';
import './ErrorBoundary.css';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="error-boundary-fallback">
            <h2>Something went wrong</h2>
            <details>
              <summary>Error details</summary>
              <pre>{this.state.error?.message}</pre>
            </details>
            <button onClick={() => this.setState({ hasError: false, error: null })}>
              Try again
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
```

### Apply to App.tsx

**File:** `packages/app/src/App.tsx`

```typescript
// BEFORE
function App() {
  return (
    <WebSocketProvider url="ws://localhost:3001/ws">
      <AppContent />
    </WebSocketProvider>
  );
}

// AFTER
import { ErrorBoundary } from './components/ErrorBoundary/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary onError={(error, info) => {
      // Optional: Send to error tracking service
      console.error('App-level error:', error, info);
    }}>
      <WebSocketProvider url="ws://localhost:3001/ws">
        <AppContent />
      </WebSocketProvider>
    </ErrorBoundary>
  );
}
```

### Add to Critical Sections

Wrap these components in ErrorBoundary:
- `<CodeEditor />` (file editing is critical)
- `<TerminalTabs />` (terminal output)
- `<FileExplorer />` (file tree)

---

## Testing Checklist

### H1: innerHTML Fix
- [ ] Run app and open multiple terminal tabs
- [ ] Verify terminals clear properly when switching
- [ ] Check DevTools console for errors
- [ ] No visual regressions

### H2: URL Validation
- [ ] Set `VITE_API_BASE_URL=http://evil.com` → Should throw error
- [ ] Set `VITE_API_BASE_URL=https://localhost:3001` → Should work
- [ ] Test with missing env var → Should default to localhost:3001
- [ ] Check network tab for only allowed hosts

### M8: Error Boundaries
- [ ] Throw error in child component → Error boundary catches it
- [ ] Click "Try again" → Component recovers
- [ ] No app crashes

---

## Deployment Steps

1. **Create feature branch:**
   ```bash
   git checkout -b fix/frontend-audit-high-priority
   ```

2. **Apply fixes in order:**
   - H1: innerHTML fix (15 min)
   - H2: URL validation (2 hrs)
   - M8: Error boundaries (30 min)

3. **Run tests:**
   ```bash
   pnpm test
   pnpm type-check
   ```

4. **Create PR with audit reference:**
   ```
   Title: fix: Apply high-priority frontend audit fixes

   Addresses findings from 2026-02-09 frontend audit:
   - H1: Remove XSS risk in TerminalTabs innerHTML usage
   - H2: Add API URL validation and response schemas
   - M8: Implement Error Boundaries for critical components

   Audit ref: .claude/actionflows/logs/audit/frontend-comprehensive_2026-02-09-00-43-37/
   ```

5. **Deploy after review**

---

## Estimated Timeline

| Task | Effort | Priority |
|------|--------|----------|
| H1: innerHTML fix | 15 min | 🔴 HIGH |
| H2: URL validation utility | 1 hr | 🔴 HIGH |
| H2: Service class updates | 1 hr | 🔴 HIGH |
| H2: Zod response schemas | 2 hrs | 🟡 MEDIUM |
| M8: Error boundaries | 30 min | 🟡 MEDIUM |
| **TOTAL** | **4.75 hrs** | |

**Recommended approach:** Ship H1+H2 validation immediately, add Zod schemas in follow-up PR.

---

## Questions?

Refer to:
- Full audit report: `audit-report.md`
- Executive summary: `EXECUTIVE_SUMMARY.md`
- ActionFlows documentation: `.claude/actionflows/`
