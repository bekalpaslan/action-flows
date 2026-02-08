# ActionFlows Framework Bootstrap Template

This template is used during framework bootstrap to configure ActionFlows Workspace integration.

---

## Workspace Integration Questions

When bootstrapping a new project with ActionFlows, the orchestrator should ask these questions to configure Workspace integration:

### Question 1: Enable Workspace?

```
Would you like to enable ActionFlows Workspace integration?

The Workspace provides:
- Real-time chain visualization (DAG + Timeline views)
- Multi-session monitoring for team collaboration
- File explorer with integrated code editor
- Embedded terminal for agent output
- Control features (pause/resume/cancel chains)
- Dashboard conversation interface

Enable Workspace? (yes/no):
```

**If NO:** Skip all remaining Workspace questions. Create `.claude/settings.json` without workspace section.

**If YES:** Continue to Question 2.

---

### Question 2: Backend URL

```
What is the URL of your ActionFlows Workspace backend?

Common options:
- http://localhost:3001 (local development)
- http://192.168.1.X:3001 (team server on LAN)
- http://workspace.yourcompany.com (production)

Backend URL:
```

**Validation:**
- Must be a valid HTTP/HTTPS URL
- Should be reachable (optional ping check)
- Defaults to `http://localhost:3001` if empty

---

### Question 3: Username

```
What username should be used for session attribution?

This helps identify your sessions in the team Dashboard.

Username (leave blank to use system username):
```

**Defaults:**
- Use system username (`$USER`, `$USERNAME`, or `os.userInfo().username`)
- Can be any string (no validation)

---

### Question 4: Format Enforcement

```
Enable format enforcement for orchestrator output?

Format enforcement checks that chain compilations follow the standard format:
- ## Chain: {Title}
- Metadata fields (Request, Source, Type, Ref)
- Proper table structure with all columns
- Execution mode declaration

Violations will show as warnings but won't block execution.

Enable format enforcement? (yes/no, default: yes):
```

**Defaults to YES.**

---

### Question 5: Hook Selection (Optional Advanced)

```
All Workspace hooks are enabled by default. Would you like to customize which hooks are active?

Available hooks:
- formatCheck: Format enforcement warnings
- chainParse: Chain compilation parsing for visualization
- stepTracking: Step spawn/complete tracking
- controlCommands: Dashboard control (pause/cancel)
- inputInjection: Dashboard conversation interface
- terminalOutput: Terminal output streaming
- sessionLifecycle: Session start/end tracking

Customize hooks? (yes/no, default: no):
```

**If NO:** Enable all hooks (default).

**If YES:** Ask for each hook individually:

```
Enable {hookName}? (yes/no, default: yes):
```

---

## Generated Settings File

After collecting answers, the bootstrap script should create `.claude/settings.json`:

```json
{
  "workspace": {
    "enabled": true,
    "backendUrl": "http://localhost:3001",
    "user": "alice",
    "hooks": {
      "formatCheck": true,
      "chainParse": true,
      "stepTracking": true,
      "controlCommands": true,
      "inputInjection": true,
      "terminalOutput": true,
      "sessionLifecycle": true
    },
    "formatEnforcement": {
      "enabled": true,
      "warnOnly": true,
      "ignoreViolations": []
    },
    "polling": {
      "inputTimeoutMs": 30000,
      "commandCheckIntervalMs": 1000
    }
  }
}
```

---

## Hook Installation

After creating settings, the bootstrap script should:

1. **Create hooks directory:** `.claude/hooks/` (if not exists)
2. **Copy hook scripts:** From `D:/ActionFlowsDashboard/packages/hooks/src/` to `.claude/hooks/`
3. **Copy utils:** Copy `utils/` directory as well
4. **Make executable:** `chmod +x .claude/hooks/*.ts` (Unix) or ensure executable bit set
5. **Verify:** Check that all 8 hook scripts exist:
   - `afw-format-check.ts`
   - `afw-chain-parse.ts`
   - `afw-step-spawned.ts`
   - `afw-step-completed.ts`
   - `afw-control-check.ts`
   - `afw-input-inject.ts`
   - `afw-output-capture.ts`
   - `afw-session-start.ts`
   - `afw-session-end.ts`

---

## Hook Configuration

Hook scripts read configuration from:
1. `.claude/settings.json` (workspace section)
2. Environment variables (fallback):
   - `AFW_ENABLED` (true/false)
   - `AFW_BACKEND_URL` (backend URL)
   - `AFW_USER` (username)
   - `AFW_FORMAT_CHECK_ENABLED` (true/false)

---

## Verification Steps

After bootstrap completes:

1. **Check settings file:** `.claude/settings.json` exists and is valid JSON
2. **Check hooks:** All 9 hook scripts copied to `.claude/hooks/`
3. **Check backend:** Backend is reachable at configured URL (optional)
4. **Test session:** Start Claude Code session and verify:
   - Session appears in Dashboard
   - Hooks don't crash (check for error messages)

---

## Disable Workspace Later

To disable Workspace integration after bootstrap:

### Option 1: Edit settings
Set `workspace.enabled: false` in `.claude/settings.json`

### Option 2: Environment variable
Set `AFW_ENABLED=false` before starting Claude Code

### Option 3: Remove hooks
Delete `.claude/hooks/afw-*.ts` files

---

## Troubleshooting

### Backend unreachable
- All hooks use silent failure - orchestration continues even if backend is down
- Check backend is running: `curl http://localhost:3001/health`
- Check firewall settings if using team server

### Hooks not firing
- Verify hooks are in `.claude/hooks/` directory
- Verify hooks are executable (`chmod +x .claude/hooks/*.ts`)
- Check Claude Code version supports hook system
- Check for error messages in Claude Code output

### Format warnings too noisy
- Disable format check: Set `workspace.hooks.formatCheck: false`
- Or ignore specific violations: Add to `workspace.formatEnforcement.ignoreViolations`

---

## Examples

### Minimal Configuration (Workspace disabled)

```json
{
  "workspace": {
    "enabled": false,
    "backendUrl": "http://localhost:3001"
  }
}
```

### Full Configuration (All features enabled)

```json
{
  "workspace": {
    "enabled": true,
    "backendUrl": "http://192.168.1.100:3001",
    "user": "alice",
    "hooks": {
      "formatCheck": true,
      "chainParse": true,
      "stepTracking": true,
      "controlCommands": true,
      "inputInjection": true,
      "terminalOutput": true,
      "sessionLifecycle": true
    },
    "formatEnforcement": {
      "enabled": true,
      "warnOnly": true,
      "ignoreViolations": []
    },
    "polling": {
      "inputTimeoutMs": 30000,
      "commandCheckIntervalMs": 1000
    }
  }
}
```

### Selective Hooks (Only visualization, no control)

```json
{
  "workspace": {
    "enabled": true,
    "backendUrl": "http://localhost:3001",
    "user": "bob",
    "hooks": {
      "formatCheck": false,
      "chainParse": true,
      "stepTracking": true,
      "controlCommands": false,
      "inputInjection": false,
      "terminalOutput": true,
      "sessionLifecycle": true
    }
  }
}
```
