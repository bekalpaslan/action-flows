# Update Queue

> Track action status in queue.md files.

## Instructions

If `queue.md` exists in the log folder, update with current status.

Status progression: `PENDING` → `IN_PROGRESS` → `IMPLEMENTED` → `REVIEW_READY` → `APPROVED` / `NEEDS_CHANGES`

Format:
```markdown
## Queue Entry
**Status:** {status}
**Updated:** {YYYY-MM-DD HH:MM:SS}
**Agent:** {action type}
**Notes:** {brief note}
```

---

## Contract Contributions

This abstract extends agent contracts with:

**Trace Contract additions:**
- Queue status transitions logged: PENDING → IN_PROGRESS → IMPLEMENTED → REVIEW_READY → APPROVED/NEEDS_CHANGES
- Status updates written to queue.md files in log folder
