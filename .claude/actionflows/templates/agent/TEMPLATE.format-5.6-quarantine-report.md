# Quarantine Operations Report Template

**Purpose:** Used by `isolate/` action agents to manage quarantined chains, sessions, or formats
**Contract Reference:** CONTRACT.md § Format 5.6 (Quarantine Operations Report) — P4 Priority
**Parser:** `parseQuarantineOperations` in `packages/shared/src/contract/parsers/actionParser.ts`
**Zod Schema:** `QuarantineOperationsSchema` in `packages/shared/src/contract/validation/schemas.ts`
**Producer:** See `.claude/actionflows/actions/isolate/agent.md`

---

## Note on Quarantine Data

This format is for the human-readable markdown report documenting quarantine operations. The actual quarantine data is stored in Redis as JSON (not parsed from this template). The report serves as an audit trail and human-readable documentation of quarantine actions.

---

## Template Structure: Quarantine (Add) Subcommand

```markdown
# Quarantine Record

**Subcommand:** quarantine
**Target Type:** {targetType}
**Target ID:** {targetId}
**Reason:** {reason}
**Quarantined At:** {ISO timestamp}
**Auto-Release:** {yes | no}
**TTL:** {7 days | 24 hours}

---

## Redis Record

**Key:** `quarantine:{targetType}:{targetId}`

**Payload:**
```json
{
  "targetType": "{targetType}",
  "targetId": "{targetId}",
  "reason": "{reason}",
  "quarantinedAt": "{ISO timestamp}",
  "autoRelease": {true | false},
  "ttl": {604800 | 86400},
  "suggestedFlow": "{flow-name}/"
}
```

---

## WebSocket Event

**Type:** QuarantineEvent
**Action:** add

**Payload:**
```json
{
  "type": "QuarantineEvent",
  "action": "add",
  "targetType": "{targetType}",
  "targetId": "{targetId}",
  "reason": "{reason}",
  "timestamp": "{ISO timestamp}"
}
```

---

## Impact

- **Execution Blocked:** New steps for this {targetType} will be blocked until released
- **Dashboard Badge:** Quarantine icon displayed in frontend
- **Suggested Action:** Run {suggestedFlow} to heal, then release quarantine

---

**Quarantine Active**

**Status:** {status description}
**Next Step:** {next action}
```

---

## Template Structure: Release Subcommand

```markdown
# Quarantine Release

**Subcommand:** release
**Target Type:** {targetType}
**Target ID:** {targetId}
**Released At:** {ISO timestamp}

---

## Redis Operation

**Key Deleted:** `quarantine:{targetType}:{targetId}`

---

## WebSocket Event

**Type:** QuarantineEvent
**Action:** remove

**Payload:**
```json
{
  "type": "QuarantineEvent",
  "action": "remove",
  "targetType": "{targetType}",
  "targetId": "{targetId}",
  "timestamp": "{ISO timestamp}"
}
```

---

## Impact

- **Execution Unblocked:** {targetType} can now execute new steps
- **Dashboard Updated:** Quarantine icon removed from frontend

---

**Quarantine Released**

**Status:** {status description}
```

---

## Template Structure: List Subcommand

```markdown
# Active Quarantines

**Subcommand:** list
**Executed At:** {ISO timestamp}
**Total Quarantines:** {count}

---

## Quarantine Records

| Target Type | Target ID | Reason | Quarantined At | TTL Remaining | Suggested Flow |
|-------------|-----------|--------|----------------|---------------|----------------|
| {type} | {id} | {reason} | {timestamp} | {ttl} | {flow} |
| {type} | {id} | {reason} | {timestamp} | {ttl} | {flow} |

---

**List Complete**

**Status:** {count} active quarantines found
```

---

## Field Descriptions

### Subcommand
- **Type:** Enum (`quarantine` | `release` | `list`)
- **Purpose:** Specifies the quarantine operation
  - **quarantine:** Add new quarantine record
  - **release:** Remove quarantine record
  - **list:** Show all active quarantines

### Target Type
- **Type:** Enum (`chain` | `session` | `format`)
- **Purpose:** What is being quarantined
  - **chain:** ChainId (e.g., "chain-abc123")
  - **session:** SessionId (e.g., "session-xyz789")
  - **format:** Format name (e.g., "Format 5.4")

### Target ID
- **Type:** String
- **Format:** ChainId, SessionId, or FormatName
- **Purpose:** Identifies the specific target
- **Example:** "chain-abc123def456" or "session-user-456"

### Reason
- **Type:** String (quarantine only)
- **Purpose:** Violation description or reason for quarantine
- **Length:** 1-2 sentences
- **Example:** "Gate 4 violations: missing Key Inputs column in 12 tables"

### Quarantined At / Released At
- **Type:** String (ISO 8601 timestamp)
- **Format:** `YYYY-MM-DDTHH:MM:SSZ`
- **Purpose:** When operation occurred

### Auto-Release
- **Type:** Enum (`yes` | `no`)
- **Purpose:** Whether TTL-based auto-release is enabled
  - **yes:** Will auto-release after TTL expires
  - **no:** Manual release required

### TTL
- **Type:** String
- **Values:** "7 days" or "24 hours"
- **Seconds:** 604800 (7 days) or 86400 (24 hours)
- **Purpose:** Time-to-live before auto-release (if enabled)

### Redis Record
- **Key:** String `quarantine:{targetType}:{targetId}`
- **Payload:** JSON object with quarantine metadata
- **Storage:** Redis hash or JSON string

### WebSocket Event
- **Type:** String "QuarantineEvent"
- **Action:** String "add" or "remove"
- **Payload:** Event structure with target info and timestamp
- **Broadcast:** Sent to all connected clients for real-time UI update

### Impact
- **Execution Blocked:** Explanation of what's blocked
- **Dashboard Badge:** UI indicator
- **Suggested Action:** Recommended healing flow

### Total Quarantines
- **Type:** Number
- **Purpose:** Count of active quarantines
- **Scope:** At time of list command

### Quarantine Records Table (List)
- **Columns:** Target Type, Target ID, Reason, Quarantined At, TTL Remaining, Suggested Flow
- **Rows:** One per active quarantine
- **Sorting:** By quarantine date (oldest first)

---

## Examples

### Example 1: Quarantine a Chain

```markdown
# Quarantine Record

**Subcommand:** quarantine
**Target Type:** chain
**Target ID:** chain-abc123def456
**Reason:** Gate 4 violations: Missing Key Inputs column in 12 chain compilation tables
**Quarantined At:** 2026-02-21T14:30:45Z
**Auto-Release:** no
**TTL:** 7 days

---

## Redis Record

**Key:** `quarantine:chain:chain-abc123def456`

**Payload:**
```json
{
  "targetType": "chain",
  "targetId": "chain-abc123def456",
  "reason": "Gate 4 violations: Missing Key Inputs column in 12 chain compilation tables",
  "quarantinedAt": "2026-02-21T14:30:45Z",
  "autoRelease": false,
  "ttl": 604800,
  "suggestedFlow": "audit-and-fix/"
}
```

---

## WebSocket Event

**Type:** QuarantineEvent
**Action:** add

**Payload:**
```json
{
  "type": "QuarantineEvent",
  "action": "add",
  "targetType": "chain",
  "targetId": "chain-abc123def456",
  "reason": "Gate 4 violations: Missing Key Inputs column in 12 chain compilation tables",
  "timestamp": "2026-02-21T14:30:45Z"
}
```

---

## Impact

- **Execution Blocked:** This chain cannot spawn new steps until quarantine is released
- **Dashboard Badge:** Red quarantine icon shown in chain panel
- **Suggested Action:** Run audit-and-fix/ flow to diagnose and fix Gate 4 violations

---

**Quarantine Active**

**Status:** Chain is blocked. Gate 4 violations detected.
**Next Step:** Run diagnose/ flow to identify root cause, then audit-and-fix/ to remediate.
```

### Example 2: Release Quarantine

```markdown
# Quarantine Release

**Subcommand:** release
**Target Type:** chain
**Target ID:** chain-abc123def456
**Released At:** 2026-02-21T15:45:30Z

---

## Redis Operation

**Key Deleted:** `quarantine:chain:chain-abc123def456`

---

## WebSocket Event

**Type:** QuarantineEvent
**Action:** remove

**Payload:**
```json
{
  "type": "QuarantineEvent",
  "action": "remove",
  "targetType": "chain",
  "targetId": "chain-abc123def456",
  "timestamp": "2026-02-21T15:45:30Z"
}
```

---

## Impact

- **Execution Unblocked:** Chain can now spawn new steps
- **Dashboard Updated:** Quarantine icon removed from chain panel

---

**Quarantine Released**

**Status:** Chain is unblocked and can execute.
```

### Example 3: List Active Quarantines

```markdown
# Active Quarantines

**Subcommand:** list
**Executed At:** 2026-02-21T16:00:00Z
**Total Quarantines:** 3

---

## Quarantine Records

| Target Type | Target ID | Reason | Quarantined At | TTL Remaining | Suggested Flow |
|-------------|-----------|--------|----------------|---------------|----------------|
| chain | chain-abc123def456 | Gate 4 violations: Missing Key Inputs column | 2026-02-21T14:30:45Z | 6d 9h 29m | audit-and-fix/ |
| session | session-user-789 | Harmony score < 30% — auto-quarantine | 2026-02-20T09:15:00Z | 1d 7h 45m | diagnose/ |
| format | Format 5.1 | Parser implementation incomplete (66%) | 2026-02-19T16:00:00Z | 4d 8h 00m | code/format-5-1 |

---

**List Complete**

**Status:** 3 active quarantines found
```

---

## Validation

This format is validated at three layers:

1. **Specification Layer:** CONTRACT.md § Format 5.6
2. **Parser Layer:** `packages/shared/src/contract/parsers/actionParser.ts` — `parseQuarantineOperations()`
3. **Harmony Layer:** Backend validates Subcommand enum, Target Type enum, required sections

---

## Cross-References

- **Contract Specification:** `.claude/actionflows/CONTRACT.md` § Format 5.6 (Quarantine Operations Report)
- **Parser Implementation:** `packages/shared/src/contract/parsers/actionParser.ts`
- **Zod Schema:** `packages/shared/src/contract/validation/schemas.ts`
- **Agent Definition:** `.claude/actionflows/actions/isolate/agent.md`
- **Healing Workflow:** `verify-healing/` follows quarantine remediation
