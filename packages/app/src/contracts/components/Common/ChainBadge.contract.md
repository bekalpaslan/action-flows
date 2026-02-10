# Component Contract: ChainBadge

**File:** `packages/app/src/components/ChainBadge/ChainBadge.tsx`
**Type:** widget
**Parent Group:** Common
**Contract Version:** 1.0.0
**Last Reviewed:** 2026-02-10

---

## Identity

- **Component Name:** ChainBadge
- **Introduced:** 2025-10-01
- **Description:** Displays a color-coded badge showing chain type (openspec, refactor, feature, etc.) with optional inferred indicator

---

## Render Location

**Mounts Under:**
- SessionPanel headers
- Chain list items
- FlowVisualization metadata sections

**Render Conditions:**
1. Returns null for metadata.type === 'generic'
2. Otherwise always renders

**Positioning:** inline-block
**Z-Index:** N/A

---

## Lifecycle

**Mount Triggers:**
- Parent component renders with chain metadata

**Key Effects:**
None — Pure presentation component

**Cleanup Actions:**
None

**Unmount Triggers:**
- Parent unmounts
- Chain type changes to 'generic'

---

## Props Contract

### Inputs
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| metadata | ChainMetadata | ✅ | N/A | Chain metadata with type, isExplicit, badge, changeId |
| onClick | () => void | ❌ | undefined | Optional click handler |
| className | string | ❌ | '' | Additional CSS classes |

### Callbacks Up (to parent)
| Callback | Signature | Description |
|----------|-----------|-------------|
| onClick | `() => void` | Called when badge is clicked |

### Callbacks Down (to children)
N/A

---

## State Ownership

### Local State
N/A — Stateless

### Context Consumption
N/A

### Derived State
| Name | Type | Dependencies | Computation |
|------|------|--------------|-------------|
| typeClass | string | `[metadata.type]` | Calls getChainTypeClass(metadata.type) for CSS class |
| classes | string | `[typeClass, className]` | Concatenates CSS classes |

### Custom Hooks
None

---

## Interactions

### Parent Communication
- **Mechanism:** prop-callback
- **Description:** Calls onClick if provided
- **Example:** `onClick={() => showChainTypeInfo()}`

### Child Communication
N/A

### Sibling Communication
N/A

### Context Interaction
N/A

---

## Side Effects

None — Pure presentation component

---

## Test Hooks

**CSS Selectors:**
- `.chain-badge`
- `.badge-label`
- `.badge-inferred`
- `.badge-change-id`

**Data Test IDs:**
N/A

**ARIA Labels:**
N/A — Uses title attribute for tooltip

**Visual Landmarks:**
1. Badge container (`.chain-badge`) — Colored pill with type-specific class
2. Inferred indicator (`.badge-inferred`) — Small "inferred" tag when type detected automatically
3. Change ID tag (`.badge-change-id`) — Shows `#changeId` for openspec chains

---

## Health Checks

### Critical Checks (Must Pass)

#### HC-CB-01: Badge Renders
- **Type:** render
- **Target:** Badge element
- **Condition:** `.chain-badge` exists with badge label
- **Failure Mode:** Badge not visible
- **Automation Script:**
```javascript
// Chrome MCP script
const badge = await page.$('.chain-badge');
console.assert(badge !== null, 'Chain badge not rendered');
const label = await badge.$eval('.badge-label', el => el.textContent);
console.assert(label.length > 0, 'Badge label empty');
```

#### HC-CB-02: Generic Type Returns Null
- **Type:** conditional-render
- **Target:** Component render
- **Condition:** Returns null when metadata.type === 'generic'
- **Failure Mode:** Badge shown for generic chains
- **Automation Script:**
```javascript
// Chrome MCP script
// Would require injecting component with generic metadata
// In E2E test: verify no badge for generic chains
```

### Warning Checks (Should Pass)

#### HC-CB-03: Inferred Indicator
- **Type:** conditional-render
- **Target:** `.badge-inferred` element
- **Condition:** Only shown when metadata.isExplicit === false
- **Failure Mode:** "inferred" tag shown for explicit types

### Performance Benchmarks

| Metric | Threshold | Unit | Description |
|--------|-----------|------|-------------|
| render-time | 5 | ms | Time to paint badge (micro-component) |

---

## Dependencies

**Required Contexts:**
None

**Required Hooks:**
None

**Child Components:**
None

**Required Props:**
- `metadata`

---

## Notes

- Returns null for generic chains (no badge displayed)
- Inferred indicator only shown when type was detected automatically (not explicit)
- Change ID only shown for openspec chains with changeId present
- Tooltip shows full metadata: type, explicit/inferred status, changeId
- Badge color and style determined by type-specific CSS classes
- onClick adds role="button" and tabIndex={0} for accessibility
- Utility function getChainTypeClass maps type to CSS class

---

**Contract Authored:** 2026-02-10
**Last Updated:** 2026-02-10
**Version:** 1.0.0
