<!-- Format 3.1: Human Gate Presentation (P5) -->
<!-- Purpose: Present a decision point for human input during chain execution -->
<!-- Source: CONTRACT.md § Format 3.1 -->
<!-- TypeScript Type: HumanGateParsed -->
<!-- Parser: parseHumanGate(text: string) -->

---

## Required Fields

- `### Step {N}: HUMAN GATE` (heading) — Gate identifier
- Free-form content describing the decision needed

---

## Optional Fields

- **Question** — The specific decision being requested
- **Options** — List of available choices
- **Context** — Background information needed for decision
- **Deadline** — Any time constraints

---

## Validation Rules

- Must include the heading `### Step {N}: HUMAN GATE`
- Step number must be valid
- Content is free-form markdown (no strict structure enforced)
- Dashboard displays as read-only markdown

---

## Template Structure

```markdown
### Step {step_num}: HUMAN GATE

**Question:** {What decision is needed?}

**Context:**
{Background information}

**Options:**
- Option 1: {Description and implications}
- Option 2: {Description and implications}

**Deadline:** {If applicable}

**Next Steps:**
Once you decide, respond with your choice and the orchestrator will continue.
```

---

## Examples

**Architecture decision:**
```markdown
### Step 2: HUMAN GATE

**Question:** Should we refactor SessionManager to use Redis instead of memory storage?

**Context:**
Analysis completed. Performance testing shows current memory implementation reaches 80% saturation at 10k concurrent sessions. Production target is 50k concurrent sessions.

**Options:**
- Option 1: Migrate to Redis (2-3 days effort, unlimited scalability)
- Option 2: Optimize current memory storage (1 day effort, max 20k sessions)
- Option 3: Hybrid approach: memory for active, Redis for archived (1.5 days, up to 50k)

**Deadline:** Decision needed before starting implementation phase (tomorrow)

**Next Steps:**
Reply with your choice and the code implementation chain will proceed.
```

**Feature design review:**
```markdown
### Step 3: HUMAN GATE

**Question:** Review proposed API changes for the WebSocket protocol.

**Context:**
The implementation team has proposed changing from discriminated unions to a simpler array-based message format. This affects all connected clients.

**Suggested Review Points:**
- Backwards compatibility with existing clients
- Message parsing performance implications
- Frontend complexity changes

**Next Steps:**
Review the detailed proposal in the attached document and respond with approval or requested changes.
```

---

## Cross-References

- **CONTRACT.md:** § Format 3.1 — Human Gate Presentation
- **TypeScript Type:** `HumanGateParsed`
- **Parser:** `parseHumanGate(text: string)` in `packages/shared/src/contract/parsers.ts`
- **Pattern:** `/### Step (\d+): HUMAN GATE/m`
- **Dashboard:** Displays as read-only markdown, no structured parsing
