# Contract Coverage Dashboard Architecture Analysis

**Date:** 2026-02-10
**Agent:** Analysis Agent
**Aspect:** structure + inventory
**Scope:** Dashboard architecture for Contract Coverage Dashboard integration

---

## 1. Workbench Pattern Analysis

### Registration Mechanism

**Workbench IDs are defined in:** `packages/shared/src/workbenchTypes.ts`

```typescript
export type WorkbenchId =
  | 'work'
  | 'maintenance'
  | 'explore'
  | 'review'
  | 'archive'
  | 'settings'
  | 'pm'
  | 'harmony'
  | 'editor'
  | 'intel'
  | 'respect'
  | 'canvas';
```

**Workbench config registry:** `DEFAULT_WORKBENCH_CONFIGS` in the same file defines:
- `id`: WorkbenchId
- `label`: Display name
- `icon`: Single letter or emoji
- `hasNotifications`: Boolean
- `notificationCount`: Number
- `glowColor`: Hex color for notifications
- `tooltip`: Description
- `routable`: Whether orchestrator can route to this workbench
- `triggers`: Keywords for routing
- `flows`: Available flows
- `routingExamples`: Sample user requests

### Mounting Pattern

**Workbenches are mounted in:** `packages/app/src/components/Workbench/WorkbenchLayout.tsx`

The `renderWorkbenchContent()` function contains a switch statement that maps workbench IDs to components:

```typescript
switch (workbench) {
  case 'harmony':
    return <HarmonyWorkbench sessionId={activeSessionId} />;
  // ... other cases
}
```

**Props Pattern:** Most workbenches receive:
- Optional `sessionId` (if session-capable)
- Optional `projectId`
- Callbacks for parent communication

**Example - HarmonyWorkbench props:**
```typescript
interface HarmonyWorkbenchProps {
  sessionId?: SessionId;
  projectId?: ProjectId;
  onViolationClick?: (check: HarmonyCheck) => void;
  onTriggerCheck?: () => void;
}
```

### Component Structure

Workbench components follow a consistent pattern:
1. **Header bar** with title, actions, and context
2. **Main content area** with panels/sections
3. **DiscussButton integration** for AI assistance
4. **Custom hooks** for data fetching (e.g., `useHarmonyMetrics`)
5. **CSS modules** (`.workbench-name.css`)

---

## 2. Sidebar Navigation

### Sidebar Structure

**File:** `packages/app/src/components/AppSidebar/AppSidebar.tsx`

Workbenches are organized into **collapsible groups**:

```typescript
const WORKBENCH_GROUPS = {
  dashboard: {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'D',
    workbenches: ['work', 'maintenance', 'explore', 'review'],
    defaultExpanded: true,
  },
  features: {
    id: 'features',
    label: 'Features',
    icon: 'F',
    workbenches: ['intel', 'canvas', 'editor'],
    defaultExpanded: false,
  },
  management: {
    id: 'management',
    label: 'Management',
    icon: 'M',
    workbenches: ['pm', 'archive', 'harmony', 'respect'],
    defaultExpanded: false,
  },
};

const STANDALONE_WORKBENCHES = ['settings'];
```

**Adding a new workbench to navigation requires:**

1. **Add WorkbenchId** to `packages/shared/src/workbenchTypes.ts`
2. **Add config entry** to `DEFAULT_WORKBENCH_CONFIGS`
3. **Add to group** in `AppSidebar.tsx` (or standalone array)
4. **Add case** to `renderWorkbenchContent()` in `WorkbenchLayout.tsx`
5. **Export component** from `packages/app/src/components/Workbench/index.ts`

---

## 3. Data Flow Analysis

### Current Pattern: Backend API

**HarmonyWorkbench uses backend API:**

```typescript
// File: packages/app/src/hooks/useHarmonyMetrics.ts
const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const response = await fetch(`${apiBase}/harmony/${target}`);
```

**Backend API pattern (Express routes):**
- Location: `packages/backend/src/routes/*.ts`
- Pattern: Express Router with Zod validation
- Example: `packages/backend/src/routes/harmony.ts`

**Endpoints:**
- `GET /api/harmony/:sessionId` - Get metrics for session
- `GET /api/harmony/project/:projectId` - Get metrics for project
- `GET /api/harmony/stats` - Global statistics
- `POST /api/harmony/:sessionId/check` - Manual check

### Data Source Options for Contract Coverage

**Option A: Backend API Endpoint** (Recommended)
- ✅ Consistent with existing patterns
- ✅ Real-time data via WebSocket
- ✅ Centralized validation logic
- ✅ Can trigger health checks on demand
- ❌ Requires backend service implementation

**Option B: Frontend-only (Pre-generated JSON)**
- ✅ Zero backend dependency
- ✅ Can use existing `health:check:ci` output
- ✅ Fast initial load
- ❌ No real-time updates
- ❌ Stale data between checks

**Option C: Frontend Direct (TSX/WASM)**
- ✅ Self-contained
- ✅ No API calls
- ❌ Duplicates validation logic
- ❌ Large bundle size
- ❌ Not aligned with architecture

**Recommended Strategy: Hybrid Approach**

1. **Backend API endpoint** at `/api/contracts/health`
   - Endpoint reads existing health check output JSON
   - Caches results with TTL
   - Provides real-time WebSocket updates when CI runs
   - Can trigger on-demand validation

2. **Frontend caching**
   - Store last health check result in localStorage
   - Show stale data immediately on load
   - Fetch fresh data in background

---

## 4. Existing Health Check System

### CLI Scripts

**Location:** `scripts/health-check-ci.ts`

**Output format:**
```typescript
interface CIHealthCheckResult {
  passed: boolean;
  timestamp: string;
  summary: {
    totalContracts: number;
    validContracts: number;
    warningContracts: number;
    errorContracts: number;
    totalHealthChecks: number;
    componentCoverage: number;
  };
  details: {
    errors: ContractDetail[];
    warnings: ContractDetail[];
    valid: ContractDetail[];
  };
}
```

**Available via:**
- `pnpm run health:check` - Human-readable
- `pnpm run health:check:ci` - JSON output

**Data includes:**
- Contract validation results
- Component coverage percentage
- Health check counts
- Drift detection (components without contracts)

---

## 5. Contract System Overview

### Contract Storage

**Contracts location:** `packages/app/src/contracts/components/`

**Structure:**
```
contracts/
  components/
    Workbench/
      HarmonyWorkbench.contract.md
      PMWorkbench.contract.md
      ...
```

**Contract format:** Markdown with structured sections
- Identity
- Render Location
- Lifecycle
- Props Contract
- State Ownership
- Interactions
- Side Effects
- Test Hooks
- Health Checks (with automation scripts)
- Dependencies

### Validation System

**Shared package:** `packages/shared/src/contracts/`

**Functions:**
- `parseAllContracts(dir)` - Parse all .contract.md files
- `validateAllContracts(parsed)` - Validate structure
- `detectDrift(contractsDir, componentsDir, contextsDir)` - Find missing contracts

---

## 6. Recommended Integration Approach

### Phase 1: Add "Coverage" Workbench

**Step 1.1: Add WorkbenchId**

Edit `packages/shared/src/workbenchTypes.ts`:

```typescript
export type WorkbenchId =
  | 'work'
  | 'maintenance'
  | 'explore'
  | 'review'
  | 'archive'
  | 'settings'
  | 'pm'
  | 'harmony'
  | 'editor'
  | 'intel'
  | 'respect'
  | 'canvas'
  | 'coverage';  // NEW

export const WORKBENCH_IDS = [..., 'coverage'] as const;
```

**Step 1.2: Add Config**

In same file, add to `DEFAULT_WORKBENCH_CONFIGS`:

```typescript
coverage: {
  id: 'coverage',
  label: 'Coverage',
  icon: '✓',  // or 'Cv'
  hasNotifications: true,
  notificationCount: 0,
  glowColor: '#00bcd4',
  tooltip: 'Contract coverage and component health monitoring',
  routable: false,
  triggers: [],
  flows: [],
  routingExamples: [],
}
```

**Step 1.3: Add to Sidebar Group**

Edit `packages/app/src/components/AppSidebar/AppSidebar.tsx`:

```typescript
management: {
  id: 'management',
  label: 'Management',
  icon: 'M',
  workbenches: ['pm', 'archive', 'harmony', 'respect', 'coverage'],  // Add here
  defaultExpanded: false,
}
```

**Step 1.4: Create Component**

Create `packages/app/src/components/Workbench/CoverageWorkbench.tsx`:

```typescript
import React from 'react';
import { DiscussButton, DiscussDialog } from '../DiscussButton';
import { useDiscussButton } from '../../hooks/useDiscussButton';
import { useCoverageMetrics } from '../../hooks/useCoverageMetrics';
import './CoverageWorkbench.css';

export interface CoverageWorkbenchProps {
  // No required props
}

export function CoverageWorkbench({}: CoverageWorkbenchProps): React.ReactElement {
  const { metrics, loading, error, refresh } = useCoverageMetrics();
  const { isDialogOpen, openDialog, closeDialog, handleSend } = useDiscussButton({
    componentName: 'CoverageWorkbench',
    getContext: () => ({ coverage: metrics?.componentCoverage ?? 0 }),
  });

  return (
    <div className="coverage-workbench">
      <header className="coverage-workbench__header">
        <h1>Contract Coverage Dashboard</h1>
        <DiscussButton componentName="CoverageWorkbench" onClick={openDialog} size="small" />
      </header>

      <div className="coverage-workbench__content">
        {/* Metrics cards */}
        {/* Health check list */}
        {/* Drift detection */}
      </div>

      <DiscussDialog
        isOpen={isDialogOpen}
        componentName="CoverageWorkbench"
        onSend={handleSend}
        onClose={closeDialog}
      />
    </div>
  );
}
```

**Step 1.5: Register in WorkbenchLayout**

Edit `packages/app/src/components/Workbench/WorkbenchLayout.tsx`:

```typescript
import { CoverageWorkbench } from './CoverageWorkbench';

// In renderWorkbenchContent():
case 'coverage':
  return <CoverageWorkbench />;
```

**Step 1.6: Export**

Edit `packages/app/src/components/Workbench/index.ts`:

```typescript
export { CoverageWorkbench } from './CoverageWorkbench';
export type { CoverageWorkbenchProps } from './CoverageWorkbench';
```

### Phase 2: Backend API Endpoint

**Step 2.1: Create Route**

Create `packages/backend/src/routes/contracts.ts`:

```typescript
import { Router } from 'express';
import { execSync } from 'child_process';

const router = Router();

router.get('/health', async (req, res) => {
  try {
    // Run health check and parse JSON output
    const output = execSync('pnpm run health:check:ci', { encoding: 'utf-8' });
    const result = JSON.parse(output);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Health check failed' });
  }
});

export default router;
```

**Step 2.2: Register Route**

Edit `packages/backend/src/index.ts`:

```typescript
import contractsRouter from './routes/contracts.js';

app.use('/api/contracts', contractsRouter);
```

**Step 2.3: Create Custom Hook**

Create `packages/app/src/hooks/useCoverageMetrics.ts`:

```typescript
import { useState, useEffect, useCallback } from 'react';

export function useCoverageMetrics() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/contracts/health');
      const data = await response.json();
      setMetrics(data);
      setError(null);
    } catch (err) {
      setError('Failed to load coverage metrics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { metrics, loading, error, refresh };
}
```

### Phase 3: Dashboard UI Components

**Component hierarchy:**

```
CoverageWorkbench
  ├── CoverageHeader (title, refresh, DiscussButton)
  ├── CoverageSummaryCards
  │   ├── TotalContractsCard
  │   ├── CoveragePercentageCard
  │   ├── ValidationStatusCard
  │   └── HealthChecksCard
  ├── ContractsList
  │   ├── ContractCard (for each contract)
  │   │   ├── ComponentName
  │   │   ├── ValidationStatus
  │   │   ├── HealthCheckCount
  │   │   └── ActionsDropdown (view, run checks, fix)
  │   └── EmptyState (if no contracts)
  ├── DriftPanel
  │   └── ComponentsWithoutContracts[]
  └── HealthCheckRunner (trigger panel)
```

**Visual design notes:**
- Follow HarmonyWorkbench pattern (header + main content + sidebar)
- Use cards for metrics (similar to PM workbench)
- Color coding: green (valid), yellow (warnings), red (errors)
- Real-time updates via WebSocket (future enhancement)

---

## 7. Key Files to Create/Modify

### Files to Create

1. **Component:**
   - `packages/app/src/components/Workbench/CoverageWorkbench.tsx`
   - `packages/app/src/components/Workbench/CoverageWorkbench.css`

2. **Hook:**
   - `packages/app/src/hooks/useCoverageMetrics.ts`

3. **Backend:**
   - `packages/backend/src/routes/contracts.ts`

4. **Contract:**
   - `packages/app/src/contracts/components/Workbench/CoverageWorkbench.contract.md`

### Files to Modify

1. **Workbench Registration:**
   - `packages/shared/src/workbenchTypes.ts` (add 'coverage' to WorkbenchId)
   - `packages/app/src/components/AppSidebar/AppSidebar.tsx` (add to management group)
   - `packages/app/src/components/Workbench/WorkbenchLayout.tsx` (add case)
   - `packages/app/src/components/Workbench/index.ts` (export component)

2. **Backend:**
   - `packages/backend/src/index.ts` (register route)

---

## 8. Data Schema

### Coverage Metrics Response

```typescript
interface CoverageMetrics {
  passed: boolean;
  timestamp: string;
  summary: {
    totalContracts: number;
    validContracts: number;
    warningContracts: number;
    errorContracts: number;
    totalHealthChecks: number;
    componentCoverage: number;  // Percentage
  };
  details: {
    errors: ContractDetail[];
    warnings: ContractDetail[];
    valid: ContractDetail[];
  };
}

interface ContractDetail {
  filePath: string;
  name: string;          // Component name
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  healthChecks: number;  // Count of critical checks
}
```

---

## Recommendations

### Architecture Decision: Backend API + Caching

**Rationale:**
1. **Consistency:** Aligns with existing HarmonyWorkbench pattern
2. **Flexibility:** Can add real-time updates via WebSocket later
3. **Performance:** Backend caches CI output, frontend caches API response
4. **Maintainability:** Single source of truth for validation logic

### Workbench Placement: Management Group

**Rationale:**
- Coverage is a meta-concern (like Harmony, PM, Archive)
- Not a direct development workspace
- Fits with "system health" theme of management group

### Data Freshness Strategy

1. **On-mount:** Fetch cached data from API (fast)
2. **User refresh:** Trigger new health check (slow, ~1-3s)
3. **Auto-refresh:** Every 5 minutes (background)
4. **WebSocket:** Listen for `contract:health:updated` events (future)

### UI/UX Pattern: Follow HarmonyWorkbench

**Similarities:**
- Header with score badge
- Main content with panels
- Sidebar with actions
- DiscussButton integration
- Manual trigger capability

**Differences:**
- Coverage shows component-level detail (not output-level)
- Health checks are actionable (can run automation scripts)
- Drift detection shows missing contracts (not format drift)

---

## Learnings

**Issue:** Analysis required understanding multiple interconnected systems (workbench registration, sidebar navigation, API patterns, health check CLI).

**Root Cause:** Contract Coverage Dashboard touches 3 architectural layers: frontend component system, backend API, and CLI validation tools.

**Suggestion:** When analyzing integration points, always map the full data flow: data source → backend → API → frontend hook → component rendering. Missing any link creates implementation gaps.

[FRESH EYE] The health check system already outputs machine-readable JSON (`health:check:ci`), which is perfect for backend consumption. The CLI was designed with API integration in mind.

---

**Report Complete**
