# Brainstorm Session Transcript Template

**Purpose:** Used by `brainstorm/` action agents to produce structured brainstorm transcripts
**Contract Reference:** CONTRACT.md § Format 5.3 (Brainstorm Session Transcript) — P5 Priority
**Parser:** `parseBrainstormTranscript` in `packages/shared/src/contract/parsers/actionParser.ts`
**Producer:** See `.claude/actionflows/actions/brainstorm/agent.md`

---

## Required Sections

**Note:** Format 5.3 is recommended but NOT strictly enforced. Dashboard displays transcripts as read-only markdown.

These sections are recommended:

1. **Title** (H1) — Brainstorm topic
2. **Metadata** — Classification, date
3. **Transcript** — Question-answer style conversation
4. **Key Insights** — Main discoveries
5. **Next Steps** — Actionable follow-ups

---

## Optional Sections

- **Initial Context** — What prompted the brainstorm
- **Issues & Risks** — Potential problems identified
- **Open Questions** — Unresolved items
- **Metadata** — Participants, duration

---

## Template Structure

```markdown
# Brainstorm: {Idea Title}

**Classification:** {category}
**Date:** {YYYY-MM-DD}

## Initial Context

{What prompted this brainstorm?}

## Transcript

**Q:** {Question 1}

**A:** {Answer from agent with reasoning}

**Q:** {Follow-up question}

**A:** {Answer with depth}

[... more Q&A exchanges ...]

## Key Insights

- 💡 Insight 1
- 💡 Insight 2
- 💡 Insight 3

## Issues & Risks

- ⚠️ Risk 1: {description}
- ⚠️ Risk 2: {description}

## Next Steps

1. {Action 1} — {why}
2. {Action 2} — {why}

## Open Questions

- Question 1?
- Question 2?

## Metadata

- **Duration:** {minutes} minutes
- **Participants:** Human + Claude (brainstorm/)
- **Model:** {opus/sonnet}
```

---

## Field Descriptions

### Classification

- **Type:** String (extensible category)
- **Common Values:** feature, architecture, optimization, investigation, learning, planning
- **Purpose:** Tag for organizing brainstorm results

### Transcript

- **Format:** Question-answer style dialogue
- **Tone:** Conversational, exploratory
- **Depth:** Can include code samples, architecture sketches, detailed explanations
- **Structure:** Each Q&A forms a natural dialogue building toward insights

### Key Insights

- **Count:** 3-5 main discoveries
- **Format:** Bullet points with emoji
- **Purpose:** Distill the valuable takeaways
- **Audience:** Human review and future reference

### Issues & Risks

- **When to include:** Only if risks identified
- **Format:** Named risks with descriptions
- **Severity:** Mark with emoji (⚠️ caution, 🚨 critical)

### Next Steps

- **Actionable:** Each step should be executable
- **Rationale:** Explain why each step is recommended
- **Prioritization:** Order by importance/dependency

---

## Example

```markdown
# Brainstorm: WebSocket Reconnection Strategy

**Classification:** architecture
**Date:** 2026-02-21

## Initial Context

The dashboard currently disconnects from the backend WebSocket on network hiccups. We need a robust reconnection strategy that handles various failure modes (network down, backend restart, proxy timeout).

## Transcript

**Q:** What are the main causes of WebSocket disconnection in production?

**A:**
1. **Network failures** — Client network unavailable (mobile), ISP issues
2. **Backend restart** — Server updates, crash recovery
3. **Proxy timeout** — Load balancers drop idle connections (common at 30s/60s)
4. **Client-side bugs** — Uncaught exceptions in message handlers

**Q:** Should we use exponential backoff for reconnection?

**A:**
Yes, exponential backoff is standard and prevents thundering herd during backend outages. Recommended pattern:
- Start: 1 second delay
- Max: 60 seconds delay
- Formula: min(60, initialDelay * 2^attemptNumber)
- Jitter: ±10% to prevent synchronized retries

However, for WebSocket we should NOT retry indefinitely. After 10-15 failed attempts (roughly 10 minutes), show user notification and stop retrying. Let user manually reconnect.

**Q:** How do we distinguish "backend is updating" from "backend is down"?

**A:**
You can't reliably distinguish them. Best approach:
- Attempt 3-5 quick retries (assume temporary issue)
- Then exponential backoff for 10 minutes
- After 10 minutes, show user: "Unable to connect. Backend may be down."
- Provide manual "Reconnect Now" button

This UX is better than showing error immediately but worse than instant detection. Trade-off is acceptable.

**Q:** What about detecting backend restart completion?

**A:**
WebSocket auto-reconnect won't detect when backend becomes available again after restart. Options:
1. **Periodic health check** — Poll `/health` endpoint every 30s when disconnected
2. **User manual action** — Let user click "Reconnect Now"
3. **Service worker** — Background polling in browser (complex)

Recommended: Option 1 + 2. Use health polling as safety net, but also provide manual action for power users.

## Key Insights

- 💡 Exponential backoff is critical to avoid overwhelming recovering backend
- 💡 Can't distinguish "updating" from "down" — UX must accept this
- 💡 Need health check polling to detect when backend recovers
- 💡 10-minute timeout prevents infinite retry loops and user frustration
- 💡 Manual "Reconnect Now" button is essential for power users

## Issues & Risks

- ⚠️ **Race condition:** Health polling discovers recovery before WebSocket auto-reconnect. Need to coordinate handlers.
- ⚠️ **Mobile data:** Exponential backoff can get stuck for mobile users who temporarily go offline.

## Next Steps

1. Implement exponential backoff in frontend WebSocket manager — use standard formula
2. Add health polling when disconnected — check `/health` every 10 seconds
3. Add "Reconnect Now" button to connection status UI
4. Add 10-minute timeout before showing "Backend unreachable" message
5. Test with backend restart — verify reconnection works after server restart

## Open Questions

- Should we persist reconnection state to localStorage so user knows we're still trying to reconnect after page reload?
- What's the user expectation for "how long should I wait before investigating"?

## Metadata

- **Duration:** 25 minutes
- **Participants:** Human + Claude (brainstorm/)
- **Model:** opus
```

---

## Validation

Format 5.3 is **recommended but not strictly enforced** by the backend parser. The dashboard displays transcripts as read-only markdown without validation.

**For quality:**
- Use clear Q&A structure
- Make insights actionable
- Document next steps explicitly

---

## Cross-References

- **Contract Specification:** `.claude/actionflows/CONTRACT.md` § Format 5.3
- **Parser Implementation:** `packages/shared/src/contract/parsers/actionParser.ts` (permissive, free-form)
- **Agent Definition:** `.claude/actionflows/actions/brainstorm/agent.md`
- **Related Templates:** `TEMPLATE.report.md` (Analysis Report)
