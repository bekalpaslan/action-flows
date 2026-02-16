# Actions Registry

> Atomic building blocks. Orchestrator reads this to find actions for dynamic chaining.

## Abstract Actions

Abstract actions are **reusable behavior patterns** that agents are explicitly instructed to follow. They don't have agents — just instructions that define "how we do things."

| Abstract Action | Purpose | Used By |
|-----------------|---------|---------|
| `_abstract/agent-standards/` | Core behavioral standards for all agents | All agents |
| `_abstract/create-log-folder/` | Datetime folder creation | code, review, audit, analyze, test, plan |
| `_abstract/log-ownership/` | Log path ownership principle | All agents |

## Generic Actions

These are atomic verbs. They know HOW to do their job, but need WHAT to work on.

| Action | Purpose | Requires Input? | Required Inputs | Model | Contract Output? | Context Affinity | Capability Tags | Routing Hints |
|--------|---------|-----------------|-----------------|-------|------------------|------------------|-----------------|---------------|
| analyze/ | Codebase analysis | YES | aspect, scope | sonnet | YES (5.2) | explore, review, maintenance | metrics, pattern-detection, gap-analysis, drift-detection, inventory | `{"scope_preference": "multi-file", "min_confidence": "medium", "parallel_safe": true}` |
| audit/ | Comprehensive audits | YES | type, scope | opus | NO | review, maintenance | comprehensive-audit, security-audit, violation-detection, remediation | `{"scope_preference": "multi-package", "min_confidence": "high", "parallel_safe": false}` |
| brainstorm/ | Interactive ideation facilitation | YES | idea, classification, context | opus | YES (5.3) | work, explore | ideation, interactive-exploration, concept-generation, possibility-mapping | `{"scope_preference": "single-input", "min_confidence": "low", "parallel_safe": true}` |
| code/ | Implement code changes (generic) | YES | task, context | haiku | NO | work, maintenance | implementation, refactoring, bug-fixing, feature-development | `{"scope_preference": "multi-file", "min_confidence": "high", "parallel_safe": true}` |
| commit/ | Git commit + push | YES | summary, files | haiku | NO | work, maintenance | git-commit, version-control, change-recording | `{"scope_preference": "multi-package", "min_confidence": "medium", "parallel_safe": false}` |
| diagnose/ | Root cause analysis for violations | YES | gateId, violationPattern, gateTraces, severityLevel | sonnet | YES (5.4) | maintenance, explore | root-cause-analysis, violation-diagnosis, issue-detection | `{"scope_preference": "multi-file", "min_confidence": "high", "parallel_safe": true}` |
| docs-lookup/ | Query library documentation via Context7 | YES | library, query | haiku | NO | explore | documentation-query, library-reference, api-lookup, context7-integration | `{"scope_preference": "single-library", "min_confidence": "low", "parallel_safe": true}` |
| isolate/ | Quarantine management (add/remove/list) | YES | subcommand, targetType, targetId, reason | haiku | YES (5.6) | review, maintenance | quarantine-management, issue-isolation, remediation | `{"scope_preference": "single-file", "min_confidence": "high", "parallel_safe": false}` |
| narrate/ | Write poetic narrative chapters | YES | chapterNumber, analysisPath | opus | NO | explore | narrative-generation, documentation, storytelling, chapter-writing | `{"scope_preference": "multi-file", "min_confidence": "low", "parallel_safe": true}` |
| notify/ | Send Slack notifications for chain events | YES | message, channel, messageType | haiku | NO | work, maintenance | slack-notification, team-alert, chain-completion, event-notification | `{"scope_preference": "single-message", "min_confidence": "high", "parallel_safe": true}` |
| onboarding/ | Facilitate interactive onboarding questionnaire | NO | (none) | opus | NO | explore, settings | interactive-onboarding, questionnaire, user-education, setup-facilitation | `{"scope_preference": "input-only", "min_confidence": "low", "parallel_safe": true}` |
| plan/ | Implementation planning | YES | requirements, context | sonnet | NO | work, explore, maintenance | implementation-planning, requirements-analysis, design, architecture, task-breakdown | `{"scope_preference": "multi-file", "min_confidence": "high", "parallel_safe": true}` |
| review/ | Review anything | YES | scope, type | sonnet | YES (5.1) | review, work, maintenance | quality-check, bug-detection, style-validation, contract-compliance | `{"scope_preference": "multi-file", "min_confidence": "low", "parallel_safe": false}` |
| test/ | Execute tests | YES | scope, type | haiku | NO | work, maintenance, review | test-execution, test-suite-creation, coverage-analysis, test-debugging | `{"scope_preference": "multi-file", "min_confidence": "high", "parallel_safe": true}` |
| verify-healing/ | Post-healing validation | YES | healingChainId, targetGateId, expectedScore, preHealingScore | sonnet | YES (5.5) | review, maintenance | post-healing-validation, gate-verification, healing-assessment | `{"scope_preference": "multi-package", "min_confidence": "high", "parallel_safe": true}` |

## Orchestrator-Executed Actions

These actions are executed directly by the orchestrator using its tool access, NOT spawned as separate agents.

| Action | Purpose | Execution Method | Required Inputs | Contract Output? | Context Affinity | Capability Tags | Routing Hints |
|--------|---------|-----------------|-----------------|------------------|------------------|-----------------|---------------|
| chrome-mcp-test | Execute browser E2E tests using Chrome DevTools MCP | Orchestrator uses Chrome DevTools MCP tools (navigate, snapshot, click, fill, wait_for, evaluate_script) | testSpec, targetUrl | NO (inline pass/fail) | review, work | browser-testing, e2e-testing, orchestrator-executed, chrome-devtools-protocol | `{"scope_preference": "single-test", "min_confidence": "high", "parallel_safe": false, "requires_chrome_mcp": true}` |

**Contract Output Column:**
- **YES (X.X)** — Action produces structured output defined in CONTRACT.md (format number shown)
- **NO** — Action output is not contract-defined (internal logs, working files)

Contract-defined outputs are parsed by the dashboard. Deviating from specification causes harmony violations (graceful degradation).

See `.claude/actionflows/CONTRACT.md` for format specifications.

## Stack-Specific Code Actions

**Prefer these over generic `code/` when the target stack is known.**

| Action | Stack | Required Inputs | Model | Context Affinity | Capability Tags | Routing Hints |
|--------|-------|-----------------|-------|------------------|-----------------|---------------|
| `code/backend/` | Express 4.18 + TypeScript + Zod | task, context | haiku | work, maintenance | implementation, refactoring, bug-fixing, backend-architecture | `{"scope_preference": "multi-file", "min_confidence": "high", "stack_specific": "backend"}` |
| `code/frontend/` | React 18.2 + Vite 5 + Electron 28 | task, context | haiku | work, maintenance | implementation, refactoring, bug-fixing, react-components | `{"scope_preference": "multi-file", "min_confidence": "high", "stack_specific": "frontend"}` |

## Stack-Specific Test Actions

**Prefer these over generic `test/` when the test framework is known.**

| Action | Stack | Required Inputs | Model | Context Affinity | Capability Tags | Routing Hints |
|--------|-------|-----------------|-------|------------------|-----------------|---------------|
| `test/playwright/` | Playwright E2E (browser tests) | target, mode, browser | sonnet | work, maintenance, review | browser-testing, e2e-testing, ui-testing, playwright-automation | `{"scope_preference": "multi-file", "min_confidence": "high", "stack_specific": "frontend"}` |

## Code-Backed Actions

**Code-backed actions have real TypeScript packages backing them.** Unlike generic actions where Claude IS the tool, these actions wrap existing code packages. Claude is a thin wrapper that runs the code and interprets results.

**Key distinction:**
- **Generic Actions:** Pure Claude instructions. Claude performs all logic and produces the output.
- **Code-Backed Actions:** Claude spawns and orchestrates code from packages/. The heavy lifting happens in the package.

| Action | Purpose | Code Package | Required Inputs | Model | Context Affinity | Capability Tags | Routing Hints |
|--------|---------|--------------|-----------------|-------|------------------|-----------------|---------------|
| second-opinion/ | Ollama critique of agent output | packages/second-opinion/ | actionType, claudeOutputPath, originalInput | haiku | review, explore | critique, quality-assessment, ollama-evaluation, alternative-perspective | `{"scope_preference": "single-input", "min_confidence": "low", "parallel_safe": true}` |

## Action Modes

Actions like review/, audit/, and analyze/ support a `mode` input that controls behavior:

| Action | Default Mode | Extended Mode | Behavior |
|--------|-------------|---------------|----------|
| review/ | review-only | review-and-fix | Reviews AND fixes bugs, doc errors |
| audit/ | audit-only | audit-and-remediate | Audits AND remediates CRITICAL/HIGH findings |
| analyze/ | analyze-only | analyze-and-correct | Analyzes AND corrects drift, mismatches |

Use extended mode when fixes are straightforward and don't require architecture decisions.

## Post-Action Steps

Certain actions automatically trigger follow-up steps:

| Trigger Action | Post-Action Step | Trigger Type | Can Suppress? |
|---------------|-----------------|--------------|---------------|
| review/ | second-opinion/ | Auto | Yes ("skip second opinions") |
| audit/ | second-opinion/ | Auto | Yes ("skip second opinions") |
| analyze/ | second-opinion/ | Opt-in (orchestrator flag) | N/A |
| plan/ | second-opinion/ | Opt-in (orchestrator flag) | N/A |

## Model Selection Guidelines

### Claude Models (Hands / Hybrid shell)

| Action Type | Default Model | Why |
|-------------|---------------|-----|
| code, code/backend, code/frontend, test, commit | haiku | Fast, simple execution |
| review, analyze, plan | sonnet | Needs judgment |
| audit, brainstorm, onboarding | opus | Deep analysis or interactive teaching needed |
| second-opinion | haiku | Lightweight CLI wrapper |

### Local Models

**Hardware:** RTX 5070 Ti (16GB GDDR7) — Models >14B spill to CPU RAM (slow)

| Ollama Model | Params | VRAM | Speed | Claude Tier | Use Cases |
|-------------|--------|------|-------|-------------|-----------|
| `qwen3:14b` | 14B | 9GB | 20-35 tok/s | opus | audit, brainstorm, deep analysis |
| `qwen2.5-coder:7b` | 7B | 4.7GB | 40-60 tok/s | sonnet | review, analyze, plan, code reasoning |
| `gemma3:4b` | 4B | 3.3GB | 60-80 tok/s | haiku | fast tasks, second-opinion, quick checks |
| `llama3.2:latest` | 3B | 2GB | 80+ tok/s | haiku-alt | fastest, lightweight tasks |

## Model Override

The human can override models at session level. When active, the override replaces the default Model column for all actions in the chain.

**Activation:** Human says "use haiku for everything", "all agents on sonnet", "point everything to ollama qwen2.5-coder:7b", etc.
**Scope:** Current session only. Does not persist across sessions.
**Deactivation:** Human says "reset models", "use default models", "back to normal", etc.

### Agent Capability Classes

| Class | Model Types | Tools? | Edit Files? | Gate Traceable? | Spawned Via |
|-------|-------------|--------|-------------|-----------------|-------------|
| **Hands** | Claude (haiku, sonnet, opus) | ✅ | ✅ | ✅ | Task tool |
| **Eyes** | Local (ollama:*, local:*) | ❌ | ❌ | ❌ | Bash (CLI) |
| **Hybrid** | Claude + Local | ✅ | ✅ | ✅ | Task tool |

- **Hands:** Full autonomy, reads agent.md, produces log folders + contract outputs + gate traces
- **Eyes:** Text-in/text-out, orchestrator pre-injects context, NO logs/traces/learnings (dark to system)
- **Hybrid:** Hands shell + local reasoning, full observability at reduced cost (e.g., `second-opinion/`)

### Action Compatibility

| Action | Hands | Eyes | Hybrid | Notes |
|--------|:-----:|:----:|:------:|-------|
| analyze/ | ✅ | ✅ | ✅ | Hybrid: Claude reads files, local model reasons about them |
| audit/ | ✅ | ✅ | ✅ | Hybrid: Claude gathers evidence, local model evaluates |
| brainstorm/ | ✅ | ✅ | ✅ | Hybrid: Claude fetches context, local model generates ideas |
| code/ | ✅ | ⚠️ | ✅ | Hybrid: Claude navigates codebase, local model generates code, Claude applies |
| code/backend/ | ✅ | ⚠️ | ✅ | Same as code/ |
| code/frontend/ | ✅ | ⚠️ | ✅ | Same as code/ |
| commit/ | ✅ | ❌ | ❌ | Requires git commands — Hands only |
| diagnose/ | ✅ | ✅ | ✅ | Hybrid: Claude reads traces, local model diagnoses |
| isolate/ | ✅ | ❌ | ✅ | Hybrid: local model decides, Claude applies quarantine edits |
| narrate/ | ✅ | ✅ | ✅ | Pure text generation — all classes work |
| onboarding/ | ✅ | ❌ | ❌ | Requires interactive tool use (AskUserQuestion) — Hands only |
| plan/ | ✅ | ✅ | ✅ | Hybrid: Claude reads codebase, local model designs plan |
| review/ | ✅ | ✅ | ✅ | Hybrid: Claude reads files, local model reviews |
| second-opinion/ | ✅ | ✅ | ✅ | Already a Hybrid (haiku wrapper + Ollama reasoning) |
| test/ | ✅ | ❌ | ✅ | Hybrid: local model generates test code, Claude runs tests |
| verify-healing/ | ✅ | ✅ | ✅ | Hybrid: Claude reads data, local model validates |

**Legend:** ✅ = native support | ⚠️ = works with orchestrator assist | ❌ = incompatible

### Model Types

| Type | Examples | Execution Path | Agent Class |
|------|----------|----------------|-------------|
| **Claude** | haiku, sonnet, opus | Task tool with `model="{model}"` | Hands |
| **Local (Ollama)** | ollama:qwen2.5-coder:7b, ollama:codellama:13b | Bash: `ollama run {model}` | Eyes |
| **Local (other)** | local:{command} | Bash: `{command}` | Eyes |
| **Claude + Local** | haiku+ollama:qwen2.5-coder:7b | Task tool (Claude shell) + Bash (local reasoning) | Hybrid |
