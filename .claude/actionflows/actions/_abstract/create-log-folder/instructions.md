# Create Log Folder

> Create a datetime-isolated folder for execution logs.

## Instructions

Create folder: `.claude/actionflows/logs/{action-type}/{description}_{YYYY-MM-DD-HH-MM-SS}/`

- `{action-type}` = action being executed (code, review, audit, analyze, etc.)
- `{description}` = brief kebab-case task description (e.g., `fix-auth-bug`)
- `{datetime}` = current datetime as YYYY-MM-DD-HH-MM-SS

**Example:** `.claude/actionflows/logs/review/auth-changes_2026-02-05-14-30-45/`

## Critical Execution Order

**IMPORTANT:** Execute these steps in EXACTLY this order:

1. **First:** Derive description from the task (kebab-case, no spaces)
2. **Second:** Get current datetime (YYYY-MM-DD-HH-MM-SS format)
3. **Third:** Construct the FULL path string with all variables substituted
4. **Fourth:** Pass the completed string to mkdir -p

**Shell Substitution Warning:**

**WRONG — This fails:**
```bash
mkdir -p ".claude/actionflows/logs/review/auth-changes_$(date +%Y-%m-%d-%H-%M-%S)/"
```
The `$(date)` inside the string causes shell substitution errors.

**CORRECT — Do this:**
```bash
description="auth-changes"
datetime=$(date +%Y-%m-%d-%H-%M-%S)
folder=".claude/actionflows/logs/review/${description}_${datetime}"
mkdir -p "$folder"
```

Substitute ALL variables BEFORE constructing the path string.

Use `mkdir -p` to create. Write all outputs into this folder.

## Critical Warnings

**Windows Shell Substitution Failures:**
- On Windows (Git Bash, MinGW), the `$()` syntax may fail or behave unpredictably
- Always pre-compute values into variables first
- Test your path construction before using mkdir
- Use forward slashes `/` in paths, not backslashes

**Missing Description Pitfalls:**
- Empty or missing description field — folder looks unnamed and is hard to find
- Description with spaces — breaks path structure (use kebab-case instead)
- Description with special chars (#, @, !, etc.) — shell escaping errors
- Non-descriptive names (like "temp", "log", "output") — impossible to identify what executed

**Correct pattern:** Derive description from task name. For task "Fix auth bug in login endpoint", use `fix-auth-login-bug`.

---

## Contract Contributions

This abstract extends all agent contracts with:

**Output Contract additions:**
- Primary output location: `.claude/actionflows/logs/{action-type}/{description}_{datetime}/`
- Folder naming: `{description}` = kebab-case summary, `{datetime}` = YYYY-MM-DD-HH-MM-SS

**Trace Contract additions:**
- All trace files written within the agent's log folder
- Log file format: JSON Lines (see `LOGGING_STANDARDS_CATALOG.md` § Part 6)
