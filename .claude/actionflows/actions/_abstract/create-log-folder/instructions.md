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
5. **Fifth:** Immediately after `mkdir -p` succeeds, create an `INDEX.md` file inside the new folder with the required fields below (D-11, D-12).

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

### Step 5: Create INDEX.md (REQUIRED)

Per phase 999.1 (D-11, D-12), every new log session directory MUST contain an `INDEX.md` written immediately after the folder is created. This is non-optional. Old directories without an INDEX.md are accepted as legacy and are NOT backfilled.

**Minimum required fields:**

1. **Session dir name** — the folder name from step 3 (e.g., `auth-changes_2026-02-05-14-30-45`)
2. **Action type** — the action being executed (e.g., `code`, `review`, `audit`, `analyze`, `plan`)
3. **Timestamp** — ISO 8601 datetime (e.g., `2026-02-05T14:30:45Z`)
4. **Description** — one-line summary derived from the task input (the same kebab-case text used in step 1, expanded into a sentence)

**Bash recipe (extends the variables already defined above):**

```bash
# Variables description, datetime, folder are already set from steps 1-3
action_type="review"   # set per the action being executed
iso_timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)
one_line_desc="Review of auth changes for login endpoint"

cat > "$folder/INDEX.md" <<EOF
# ${description}

- **Session dir:** ${description}_${datetime}
- **Action type:** ${action_type}
- **Timestamp:** ${iso_timestamp}
- **Description:** ${one_line_desc}
EOF
```

**Verification:** After writing, `ls "$folder/INDEX.md"` must succeed. If it does not, the action MUST abort and surface the failure — this is a contract gate, not a soft warning.

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
- Required artifact: `{folder}/INDEX.md` with fields {session-dir, action-type, ISO-timestamp, one-line description} per D-11/D-12

**Trace Contract additions:**
- All trace files written within the agent's log folder
- Log file format: JSON Lines (see `LOGGING_STANDARDS_CATALOG.md` § Part 6)
