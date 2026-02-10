# Quick Reference: Contract Coverage Dashboard

## 5-Step Integration

### Step 1: Add WorkbenchId
**File:** `packages/shared/src/workbenchTypes.ts`
```typescript
export type WorkbenchId = ... | 'coverage';
```

### Step 2: Add Config
**File:** `packages/shared/src/workbenchTypes.ts`
```typescript
DEFAULT_WORKBENCH_CONFIGS = {
  ...
  coverage: {
    id: 'coverage',
    label: 'Coverage',
    icon: '✓',
    hasNotifications: true,
    glowColor: '#00bcd4',
    tooltip: 'Contract coverage and component health monitoring',
    routable: false,
  }
}
```

### Step 3: Add to Sidebar
**File:** `packages/app/src/components/AppSidebar/AppSidebar.tsx`
```typescript
management: {
  workbenches: ['pm', 'archive', 'harmony', 'respect', 'coverage'],
}
```

### Step 4: Create Component
**File:** `packages/app/src/components/Workbench/CoverageWorkbench.tsx`
- Use HarmonyWorkbench.tsx as template
- Hook: `useCoverageMetrics()`
- DiscussButton integration

### Step 5: Register
**File:** `packages/app/src/components/Workbench/WorkbenchLayout.tsx`
```typescript
case 'coverage':
  return <CoverageWorkbench />;
```

## Backend API

**Route:** `/api/contracts/health`
**Implementation:** Execute `pnpm run health:check:ci`, parse JSON, cache, return

## Data Hook

```typescript
export function useCoverageMetrics() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch from /api/contracts/health
  // Return { metrics, loading, error, refresh }
}
```

## UI Components

```
CoverageWorkbench
  ├── Header (title + actions)
  ├── SummaryCards (4 metrics)
  ├── ContractsList (with filters)
  └── DriftPanel (missing contracts)
```

## References

- Pattern: HarmonyWorkbench (`packages/app/src/components/Workbench/HarmonyWorkbench.tsx`)
- Contract: HarmonyWorkbench.contract.md
- Data source: `scripts/health-check-ci.ts`
- Shared validation: `packages/shared/src/contracts/`
