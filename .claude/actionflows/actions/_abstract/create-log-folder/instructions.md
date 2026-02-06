# Create Log Folder

> Create a datetime-isolated folder for execution logs.

## Instructions

Create folder: `.claude/actionflows/logs/{action-type}/{description}_{YYYY-MM-DD-HH-MM-SS}/`

- `{action-type}` = action being executed (code, review, audit, analyze, etc.)
- `{description}` = brief kebab-case task description (e.g., `fix-auth-bug`)
- `{datetime}` = current datetime as YYYY-MM-DD-HH-MM-SS

Use `mkdir -p` to create. Write all outputs into this folder.

**Example:** `.claude/actionflows/logs/review/auth-changes_2026-02-06-14-30-45/`
