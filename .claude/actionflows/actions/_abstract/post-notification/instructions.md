# Post Notification

> Standardized notification for action completion.

## Instructions

Post using the project's configured communication tool.

The action's `agent.md` specifies the exact tool name and channel ID.
**Current status: Not configured** — No Slack/Discord MCP is available for this project.

If notification tool is not configured, note "Notification skipped — not configured" in output and continue.

### Formats

**Completion:**
```
{emoji} **{Action}: {Title}**
**Summary:** {What was done}
**Report:** {path}
```

**Verdict:**
```
{emoji} **{Action}: {Scope}**
**Verdict:** {APPROVED/NEEDS_CHANGES}
**Score:** {X}%
**Key Findings:** {top items}
```

**Alert:**
```
{emoji} **{Action}: {Title}**
**Status:** {FAILED/BLOCKED}
**Reason:** {why}
**Next:** {what should happen}
```

If notification tool fails or is not configured, document and continue.
