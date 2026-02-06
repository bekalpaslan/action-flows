# Chain Type Detection API Reference

## Core Module: chainTypeDetection.ts

### Types

#### ChainType
```typescript
type ChainType = 'openspec' | 'code-review' | 'audit' | 'test' | 'generic';
```
Supported chain type identifiers with semantic meaning for each workflow.

#### ChainMetadata
```typescript
interface ChainMetadata {
  type: ChainType;           // Detected/explicit type
  isExplicit: boolean;       // true = explicit Type field, false = inferred
  badge: string;             // Display badge (emoji + label)
  changeId?: string;         // Change ID (openspec chains)
}
```
Result object containing all type detection information.

### Functions

#### detectChainType(chain: Chain): ChainMetadata
**Purpose:** Primary function for chain type detection

**Parameters:**
- chain: Chain - Chain object from @afw/shared

**Returns:** ChainMetadata object with detected type and metadata

**Algorithm:**
1. Check first step for explicit Type field in inputs
2. If found and valid, return immediately with isExplicit: true
3. Otherwise, infer type from action patterns
4. Extract change ID from any step
5. Return with isExplicit: false if inferred

#### inferTypeFromActions(steps: ChainStep[]): ChainType
**Purpose:** Infer chain type from action patterns (used by detectChainType)

**Parameters:**
- steps: ChainStep[] - Array of chain steps

**Returns:** ChainType (never returns undefined, defaults to generic)

**Detection Rules (in order):**
1. **OpenSpec** - Any step with openspec-propose or openspec-apply
2. **Code Review** - code followed by review in sequence
3. **Audit** - audit as primary action, ≤3 steps, no review
4. **Test** - test or coverage actions ≥50% of total steps
5. **Generic** - Default fallback (always matches)

#### extractChangeId(chain: Chain): string | undefined
**Purpose:** Extract change identifier from chain for openspec tracking

**Parameters:**
- chain: Chain - Chain object

**Returns:** Change ID string or undefined if not found

**Search Order:**
1. First step: inputs.changeId field
2. Any step: inputs.proposal_id field
3. Chain ref: Regex pattern change-\d+ (case insensitive)
4. Return undefined if not found

#### getChainBadge(type: ChainType): string
**Purpose:** Get display badge label with emoji

**Parameters:**
- type: ChainType - Chain type identifier

**Returns:** Badge string (emoji + text) or empty string for generic

**Mapping:**
- openspec → "📋 OpenSpec"
- code-review → "💻 Code Review"
- audit → "🔍 Audit"
- test → "🧪 Test"
- generic → "" (empty)

#### getChainTypeClass(type: ChainType): string
**Purpose:** Get CSS class for type-specific styling

**Parameters:**
- type: ChainType - Chain type identifier

**Returns:** CSS class string for styling

**Mapping:**
- openspec → chain-type-openspec
- code-review → chain-type-code-review
- audit → chain-type-audit
- test → chain-type-test
- generic → chain-type-generic

## Component Module: ChainBadge.tsx

### ChainBadgeProps Interface
```typescript
interface ChainBadgeProps {
  metadata: ChainMetadata;    // Required: detection result
  onClick?: () => void;        // Optional: click handler
  className?: string;          // Optional: additional CSS classes
}
```

### ChainBadge Component
**Purpose:** React component for displaying chain type badge

**Props:**
- metadata (required): ChainMetadata from detectChainType()
- onClick (optional): Handler function when badge is clicked
- className (optional): Additional CSS classes to apply

**Behavior:**
- Hidden for type === generic (returns null)
- Shows badge label (emoji + text)
- Shows "(inferred)" indicator if not explicit
- Shows "#{changeId}" for openspec chains
- Keyboard accessible (tabIndex, role="button")

## CSS Classes

### Badge Classes

#### .chain-badge
Base badge container with flexbox layout, padding, border radius, and smooth transitions.

#### Type-Specific Classes
- .chain-type-openspec - Blue background
- .chain-type-code-review - Purple background
- .chain-type-audit - Orange background
- .chain-type-test - Green background

#### Subclasses
- .badge-label - Badge text with emoji
- .badge-inferred - "inferred" indicator
- .badge-change-id - Change ID display

### Dark Mode
Use @media (prefers-color-scheme: dark) for automatic dark mode support.

### Responsive
- Desktop: Full badge with all indicators
- Mobile: Simplified, inferred text hidden

## Integration with ChainDAG

### Required Changes
1. Import ChainBadge and detectChainType
2. Call detectChainType in useMemo hook
3. Display badge in header
4. Update header CSS layout

## Type Field Usage

### Explicit Type Detection
Add Type field to first step inputs:

```typescript
const chain = {
  steps: [
    {
      action: 'openspec-propose',
      inputs: {
        Type: 'openspec',
        proposal: 'New feature',
        changeId: 'CHANGE-2847'
      }
    }
  ]
};
```

### Valid Type Values
- openspec - OpenSpec workflow
- code-review - Code review workflow
- audit - Audit workflow
- test - Testing workflow
- generic - Generic workflow (no badge shown)

## Performance Considerations

### Complexity
- Detection: O(n) where n = number of steps
- Inference: O(m) where m = number of unique actions
- Change ID extraction: O(n) worst case, typically O(1)

### Optimization
- Use memoization in React components
- Detection result is immutable
- No external API calls
- Minimal memory footprint

### Recommendations
- Cache detection results at parent level
- Dont call detectChainType in render
- Use useMemo for repeated detection
- Update only when chain object changes

## Examples

### Basic Usage
```typescript
import { detectChainType } from './utils/chainTypeDetection';

const chain = {
  id: 'chain-001',
  steps: [
    { action: 'code' },
    { action: 'review' }
  ]
};

const metadata = detectChainType(chain);
console.log(metadata.type);      // code-review
console.log(metadata.isExplicit); // false (inferred)
console.log(metadata.badge);      // 💻 Code Review
```

### Explicit Type with Change ID
```typescript
const openspecChain = {
  id: 'chain-002',
  steps: [
    {
      action: 'openspec-propose',
      inputs: {
        Type: 'openspec',
        proposal_id: 'CHANGE-2847'
      }
    }
  ]
};

const metadata = detectChainType(openspecChain);
console.log(metadata.type);      // openspec
console.log(metadata.isExplicit); // true
console.log(metadata.changeId);   // CHANGE-2847
console.log(metadata.badge);      // 📋 OpenSpec
```

## Testing

### Unit Test Template
```typescript
describe('chainTypeDetection', () => {
  test('detects explicit code-review type', () => {
    const chain = {
      steps: [{ inputs: { Type: 'code-review' } }]
    };
    const metadata = detectChainType(chain as Chain);
    expect(metadata.type).toBe('code-review');
    expect(metadata.isExplicit).toBe(true);
  });

  test('infers test type from actions', () => {
    const chain = {
      steps: [
        { action: 'test' },
        { action: 'test' },
        { action: 'code' }
      ]
    };
    const metadata = detectChainType(chain as Chain);
    expect(metadata.type).toBe('test');
    expect(metadata.isExplicit).toBe(false);
  });

  test('extracts change ID', () => {
    const chain = {
      steps: [{ inputs: { changeId: 'CHANGE-123' } }]
    };
    const changeId = extractChangeId(chain as Chain);
    expect(changeId).toBe('CHANGE-123');
  });
});
```

---

**Version:** 1.0
**Last Updated:** 2026-02-06
**Status:** Complete
