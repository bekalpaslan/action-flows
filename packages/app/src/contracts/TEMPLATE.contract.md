# Component Contract: {ComponentName}

**File:** `{relative/path/to/Component.tsx}`
**Type:** {page | feature | widget | utility}
**Parent Group:** {directory group}
**Contract Version:** 1.0.0
**Last Reviewed:** {YYYY-MM-DD}

---

## Identity

- **Component Name:** {ComponentName}
- **Introduced:** {YYYY-MM-DD}
- **Description:** {Brief 1-2 sentence description}

---

## Render Location

**Mounts Under:**
- {ParentComponent1}
- {ParentComponent2}

**Render Conditions:**
1. {Condition description} (`{code expression}`)
2. {Another condition} (`{code expression}`)

**Positioning:** {fixed | relative | absolute | sticky | null}
**Z-Index:** {number or N/A}

---

## Lifecycle

**Mount Triggers:**
- {trigger 1}
- {trigger 2}

**Key Effects:**
1. **Dependencies:** `[dep1, dep2]`
   - **Side Effects:** {what it does}
   - **Cleanup:** {cleanup if any}
   - **Condition:** {when it runs}

**Cleanup Actions:**
- {cleanup 1}
- {cleanup 2}

**Unmount Triggers:**
- {trigger 1}

---

## Props Contract

### Inputs
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| {prop1} | {type} | ✅ / ❌ | {default or N/A} | {description} |

### Callbacks Up (to parent)
| Callback | Signature | Description |
|----------|-----------|-------------|
| {callback1} | `(arg: Type) => void` | {what it does} |

### Callbacks Down (to children)
| Callback | Signature | Passed To | Description |
|----------|-----------|-----------|-------------|
| {callback1} | `(arg: Type) => void` | {ChildComponent} | {what it does} |

---

## State Ownership

### Local State
| State | Type | Initial | Updated By |
|-------|------|---------|------------|
| {state1} | {type} | {initial} | {function1, function2} |

### Context Consumption
| Context | Values Used |
|---------|-------------|
| {ContextName} | {value1, value2} |

### Derived State
| Name | Type | Dependencies | Computation |
|------|------|--------------|-------------|
| {derived1} | {type} | `[dep1, dep2]` | {how computed} |

### Custom Hooks
- `{useHookName()}` — {description}

---

## Interactions

### Parent Communication
- **Mechanism:** {prop-callback | context | event}
- **Description:** {how it talks to parent}
- **Example:** {code snippet or flow}

### Child Communication
- **Child:** {ChildComponent}
- **Mechanism:** {props | context | ref}
- **Data Flow:** {what data is passed}

### Sibling Communication
- **Sibling:** {SiblingComponent}
- **Mechanism:** {context | parent-mediated | event}
- **Description:** {how coordination happens}

### Context Interaction
- **Context:** {ContextName}
- **Role:** {provider | consumer}
- **Operations:** {what it does}

---

## Side Effects

### API Calls
| Endpoint | Method | Trigger | Response Handling |
|----------|--------|---------|-------------------|
| `/api/{path}` | {GET/POST/etc} | {when called} | {what happens} |

### WebSocket Events
| Event Type | Trigger | Handler |
|------------|---------|---------|
| `{event:type}` | {when subscribed} | {what happens} |

### Timers
| Type | Duration | Purpose | Cleanup |
|------|----------|---------|---------|
| {timeout/interval} | {ms} | {why} | ✅ / ❌ |

### LocalStorage Operations
| Key | Operation | Trigger | Value |
|-----|-----------|---------|-------|
| `{key}` | {read/write} | {when} | {what value} |

### DOM Manipulation
| Target | Operation | Trigger |
|--------|-----------|---------|
| {element} | {what is done} | {when} |

### Electron IPC (if applicable)
| Channel | Direction | Purpose |
|---------|-----------|---------|
| `{channel}` | {send/receive} | {why} |

---

## Test Hooks

**CSS Selectors:**
- `.{class-name-1}`
- `.{class-name-2}`

**Data Test IDs:**
- `data-testid="{test-id}"`

**ARIA Labels:**
- `aria-label="{label}"`

**Visual Landmarks:**
1. {Description} (`.{css-class}`) — {unique feature}

---

## Health Checks

### Critical Checks (Must Pass)

#### HC-{ID}: {Check Name}
- **Type:** {render | connection | context-registration | etc}
- **Target:** {what to check}
- **Condition:** {success condition}
- **Failure Mode:** {what breaks}
- **Automation Script:**
```javascript
// Chrome MCP script
{script here}
```

### Warning Checks (Should Pass)

#### HC-{ID}: {Check Name}
- **Type:** {type}
- **Target:** {what to check}
- **Condition:** {success condition}
- **Failure Mode:** {degraded behavior}

### Performance Benchmarks

| Metric | Threshold | Unit | Description |
|--------|-----------|------|-------------|
| {render-time} | {100} | {ms} | {Time to first paint} |

---

## Dependencies

**Required Contexts:**
- {ContextName1}
- {ContextName2}

**Required Hooks:**
- `{useHookName()}`

**Child Components:**
- {ChildComponent1}
- {ChildComponent2}

**Required Props:**
- `{prop1}`
- `{prop2}`

---

## Notes

{Any freeform notes for developers}

---

**Contract Authored:** {YYYY-MM-DD}
**Last Updated:** {YYYY-MM-DD}
**Version:** {semver}
