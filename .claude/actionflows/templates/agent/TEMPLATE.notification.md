# Notification Report Template

**Purpose:** Used by notification actions to announce important events
**Contract Reference:** Free-form — notification templates are guidance for agents (Format 6.1 Error Announcement and Format 6.2 Routing are orchestrator formats, not agent templates)
**Producer:** See `.claude/actionflows/actions/notify/agent.md`

---

## Required Sections

These sections should be present in notification reports:

1. **Title** (H1) — Notification type
2. **Metadata** — Agent, timestamp, severity
3. **Message** — Main notification text
4. **Details** — Context and specifics
5. **Action** — What user should do

---

## Optional Sections

- **Metadata** — Additional context
- **Recommendations** — Suggested actions
- **Learnings** — Related insights

---

## Template Structure

```markdown
# {Notification Type}

**Agent:** {agent-path}/
**Timestamp:** {ISO timestamp}
**Severity:** {info | warning | critical}

---

## Message

{Main notification text, 1-2 sentences}

---

## Details

{Expanded explanation}

**What Happened:**
{Event description}

**When:**
{Timestamp and context}

**Who:**
{Affected user/system}

---

## Action Required

{What user should do, if anything}

- [ ] Action 1
- [ ] Action 2
- [ ] Action 3

**Timeline:** {Urgency if applicable}

---

## Additional Context

{Any supporting information}

**Related:**
- Link 1
- Link 2
```

---

## Notification Types

### Severity: INFO

```markdown
# Execution Complete Notification

**Agent:** orchestrator/
**Timestamp:** 2026-02-21T15:30:45Z
**Severity:** info

---

## Message

Chain execution completed successfully. 4 steps executed, 2 files modified.

---

## Details

**What Happened:**
The code-and-review chain for backend authentication finished execution.

**When:**
2026-02-21 15:30:45 UTC (started 14:45, 45 minutes duration)

**Who:**
Session User-123

---

## Action Required

Review completed work:
- [ ] Check changes in the log: `.claude/actionflows/logs/code/auth-impl_2026-02-21-15-30/`
- [ ] Verify 2 files were modified as expected
- [ ] Push to git if satisfied with changes

**Timeline:** Optional, at your convenience
```

### Severity: WARNING

```markdown
# Performance Degradation Detected

**Agent:** health-monitor/
**Timestamp:** 2026-02-21T14:22:15Z
**Severity:** warning

---

## Message

Backend response time exceeded threshold. Average response time is 1200ms (threshold: 500ms).

---

## Details

**What Happened:**
Automated monitoring detected sustained high response times across multiple endpoints.

**When:**
Last 10 minutes (2026-02-21 14:12-14:22 UTC)

**Who:**
Affects all users on production backend

---

## Action Required

Investigate and resolve:
- [ ] Check database query times (see recommendations below)
- [ ] Review recent deployments (check if new code introduced regression)
- [ ] Monitor response times over next 30 minutes

**Timeline:** Investigate within 1 hour
```

### Severity: CRITICAL

```markdown
# Critical: Chain Execution Failed

**Agent:** orchestrator/
**Timestamp:** 2026-02-21T13:45:30Z
**Severity:** critical

---

## Message

A critical error occurred during code execution. Step 3 failed and cannot recover. Manual intervention required.

---

## Details

**What Happened:**
Step 3 (code/backend/) encountered a TypeScript compilation error. The error is blocking and code agent cannot proceed.

**Error:**
```
TS2339: Property 'sessionId' does not exist on type 'Request'
```

**When:**
2026-02-21 13:45:30 UTC (5 minutes ago)

**Who:**
Session User-456, chain: code-and-review

---

## Action Required

Immediate action needed:
- [ ] Review the error details in step logs
- [ ] Fix the type error (add sessionId to Request type)
- [ ] Retry step 3 or restart the chain

**Timeline:** Urgent - chain blocked, waiting for decision

**Logs:** `.claude/actionflows/logs/code/backend-fix_2026-02-21-13-45/`
```

---

## Notification Channels

Notifications can be delivered via:

1. **Dashboard** — Real-time in-app notification
2. **Email** — For critical/warning (if configured)
3. **Slack** — Automated channel posting (if MCP configured)
4. **Webhook** — Custom integration hooks

---

## Field Descriptions

### Severity Levels

- **info:** Normal operational event, no action required
- **warning:** Potential issue, should investigate soon
- **critical:** Urgent issue, action required immediately

### Timestamp

- **Format:** ISO 8601 (e.g., 2026-02-21T15:30:45Z)
- **Timezone:** Always UTC (Z suffix)

### Action Required

- **Checkbox format:** Use `- [ ]` for actionable items
- **Clarity:** Each action should be specific and concrete
- **Timeline:** State urgency (optional, at your convenience | within 1 hour | urgent)

---

## Example Implementations

### Slack Webhook Notification

```
📢 Execution Complete
Chain: code-and-review
Status: SUCCESS ✅
Duration: 45 minutes
Files: 2 modified
Log: .claude/actionflows/logs/code/auth-impl_2026-02-21-15-30/
```

### Email Notification

```
Subject: Chain Execution Complete - code-and-review

Your requested chain has completed successfully.

Status: SUCCESS
Duration: 45 minutes
Files Modified: 2

Next Steps:
1. Review changes in log folder
2. Push to git if satisfied
3. Create pull request if needed

Log Folder: .claude/actionflows/logs/code/auth-impl_2026-02-21-15-30/
```

---

## Cross-References

- **Contract Specification:** `.claude/actionflows/CONTRACT.md` § Format 6.1 (Error Announcement), Format 6.2 (Routing Announcement) — for reference
- **Agent Definition:** `.claude/actionflows/actions/notify/agent.md`
- **Dashboard Integration:** Notifications appear in real-time panel
- **Slack MCP:** Requires configuration in project settings
