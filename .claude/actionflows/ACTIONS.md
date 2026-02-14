# Actions Registry

> Atomic building blocks. Orchestrator reads this to find actions for dynamic chaining.

## Abstract Actions

Abstract actions are **reusable behavior patterns** that agents are explicitly instructed to follow. They don't have agents — just instructions that define "how we do things."

| Abstract Action | Purpose | Used By |
|-----------------|---------|---------|
| `_abstract/agent-standards/` | Core behavioral standards for all agents | All agents |
| `_abstract/create-log-folder/` | Datetime folder creation | code, review, audit, analyze, test, plan |
| `_abstract/log-ownership/` | Log path ownership principle | All agents |
| `_abstract/post-completion/` | Post-implementation workflow (commit, registry update) | Orchestrator (post-completion flow) |
| `_abstract/update-queue/` | Queue.md status updates | code, review |

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
| isolate/ | Quarantine management (add/remove/list) | YES | subcommand, targetType, targetId, reason | haiku | YES (5.6) | review, maintenance | quarantine-management, issue-isolation, remediation | `{"scope_preference": "single-file", "min_confidence": "high", "parallel_safe": false}` |
| narrate/ | Write poetic narrative chapters | YES | chapterNumber, analysisPath | opus | NO | explore | narrative-generation, documentation, storytelling, chapter-writing | `{"scope_preference": "multi-file", "min_confidence": "low", "parallel_safe": true}` |
| onboarding/ | Facilitate interactive onboarding questionnaire | NO | (none) | opus | NO | explore, settings | interactive-onboarding, questionnaire, user-education, setup-facilitation | `{"scope_preference": "input-only", "min_confidence": "low", "parallel_safe": true}` |
| plan/ | Implementation planning | YES | requirements, context | sonnet | NO | work, explore, maintenance | implementation-planning, requirements-analysis, design, architecture, task-breakdown | `{"scope_preference": "multi-file", "min_confidence": "high", "parallel_safe": true}` |
| review/ | Review anything | YES | scope, type | sonnet | YES (5.1) | review, work, maintenance | quality-check, bug-detection, style-validation, contract-compliance | `{"scope_preference": "multi-file", "min_confidence": "low", "parallel_safe": false}` |
| test/ | Execute tests | YES | scope, type | haiku | NO | work, maintenance, review | test-execution, test-suite-creation, coverage-analysis, test-debugging | `{"scope_preference": "multi-file", "min_confidence": "high", "parallel_safe": true}` |
| verify-healing/ | Post-healing validation | YES | healingChainId, targetGateId, expectedScore, preHealingScore | sonnet | YES (5.5) | review, maintenance | post-healing-validation, gate-verification, healing-assessment | `{"scope_preference": "multi-package", "min_confidence": "high", "parallel_safe": true}` |

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

### Local Models (Eyes / Hybrid reasoning)

**Hardware:** RTX 5070 Ti — 16 GB GDDR7, 896 GB/s bandwidth
**Constraint:** Only models ≤14B fit fully in VRAM. Larger models spill to CPU RAM and tank speed.

**Installed models:**

| Ollama Model | Params | VRAM | Speed | Local Tier |
|-------------|--------|------|-------|------------|
| `qwen3:14b` | 14B | ~9 GB | ~20-35 tok/s | **opus** — deepest reasoning that fits in GPU |
| `qwen2.5-coder:7b` | 7B | ~4.7 GB | ~40-60 tok/s | **sonnet** — balanced code reasoning |
| `gemma3:4b` | 4B | ~3.3 GB | ~60-80 tok/s | **haiku** — fast general purpose |
| `llama3.2:latest` | 3B | ~2 GB | ~80+ tok/s | **haiku-alt** — fastest, lightweight |

**Tier mapping (used by orchestrator when local model override is active):**

| Claude Tier | Local Equivalent | When to Use |
|-------------|-----------------|-------------|
| opus | `ollama:qwen3:14b` | audit, brainstorm, deep analysis |
| sonnet | `ollama:qwen2.5-coder:7b` | review, analyze, plan, code reasoning |
| haiku | `ollama:gemma3:4b` | fast tasks, second-opinion, quick checks |

## Model Override

The human can override models at session level. When active, the override replaces the default Model column for all actions in the chain.

**Activation:** Human says "use haiku for everything", "all agents on sonnet", "point everything to ollama qwen2.5-coder:7b", etc.
**Scope:** Current session only. Does not persist across sessions.
**Deactivation:** Human says "reset models", "use default models", "back to normal", etc.

### Agent Capability Classes

Three agent execution patterns:

| Class | Model Types | Can Use Tools? | Can Edit Files? | Can Call Local Models? | Gate Traceable? | Receives Context Via |
|-------|-------------|----------------|-----------------|----------------------|-----------------|---------------------|
| **Hands** | Claude (haiku, sonnet, opus) | ✅ Read, Write, Edit, Grep, Glob, Bash | ✅ Yes | ✅ Yes (via Bash) | ✅ Yes | Reads files autonomously |
| **Eyes** | Local (ollama:*, local:*) | ❌ No tools | ❌ No | ❌ No (it IS the local model) | ❌ No | Orchestrator pre-injects all context into prompt |
| **Hybrid** | Claude + Local | ✅ All tools | ✅ Yes | ✅ Yes (mid-workflow) | ✅ Yes (Claude shell) | Reads files autonomously + delegates reasoning to local model |

**Hands agents** — Full autonomy. Read their own agent.md, explore the codebase, write code, run tests. Spawned via Task tool. Produce structured traces and log folders per their agent.md Trace Contract.

**Eyes agents** — Text-in, text-out. Receive a self-contained prompt with all necessary context pre-injected by the orchestrator. Return raw text only. Spawned via Bash (CLI). **Cannot produce gate traces.** They have no tool access, so they cannot create log folders, write trace files, or emit structured output in contract formats. Gates cannot track Eyes agents — their steps are invisible to the gate checkpoint system.

**Hybrid agents** — A Hands agent (Claude) that delegates specific reasoning to a local model mid-workflow. The Claude shell handles tool-heavy work (reading files, building context, applying edits) AND produces gate traces. The local model handles the thinking (analysis, critique, generation). Gate traceability is preserved because the Claude shell writes all trace output.

**Existing hybrid:** `second-opinion/` — A haiku agent that reads the original output, pipes it to Ollama qwen2.5-coder:7b for critique, then formats and returns the result.

### Observability Trade-offs

| Class | Log Folders | Contract Output | Gate Traces | Learnings | Cost |
|-------|:-----------:|:---------------:|:-----------:|:---------:|:----:|
| **Hands** | ✅ | ✅ | ✅ | ✅ | $$$  |
| **Eyes** | ❌ | ❌ | ❌ | ❌ | Free |
| **Hybrid** | ✅ | ✅ | ✅ | ✅ | $    |

**Eyes are dark to the system.** When using Eyes agents, the orchestrator should be aware:
- No log folder is created for the step
- No contract-defined output is produced (dashboard cannot parse it)
- No gate checkpoint is emitted (gate health scores won't reflect this step)
- No learnings are surfaced (the local model doesn't follow the learnings template)
- The orchestrator receives raw text and must decide what to do with it

**Hybrid preserves full observability** at reduced cost — the Claude shell (haiku) is cheap but still produces all structured output that gates and the dashboard expect.

### When to Use Each Class

| Scenario | Class | Why |
|----------|-------|-----|
| Agent needs to explore codebase and write code | **Hands** | Requires Read/Write/Edit tools |
| Agent needs to analyze pre-known files and return text | **Eyes** | Cheaper, no Claude cost, text-in/text-out sufficient |
| Agent needs tools AND wants local model reasoning | **Hybrid** | Best of both — tools for access, local model for thinking |
| Cost optimization on analysis-heavy chains | **Eyes** | Run analyze/review/plan on local models, save Claude tokens |
| Code generation where agent must find + edit files | **Hands** | Eyes can't navigate the codebase |
| Code generation with known files, orchestrator applies edits | **Eyes** ⚠️ | Orchestrator pre-reads, Eyes returns code, orchestrator applies |

### Action Compatibility

Not all actions work with both classes:

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

**⚠️ Eyes code actions:** Eyes agent returns code blocks as text. The orchestrator applies edits using its own Edit/Write tools.

**Hybrid unlocks:** `isolate/` and `test/` become local-model-compatible via Hybrid — the Claude wrapper handles tool operations while the local model handles reasoning.

### Model Types

| Type | Examples | Execution Path | Agent Class |
|------|----------|----------------|-------------|
| **Claude** | haiku, sonnet, opus | Task tool with `model="{model}"` | Hands |
| **Local (Ollama)** | ollama:qwen2.5-coder:7b, ollama:codellama:13b | Bash: `ollama run {model}` | Eyes |
| **Local (other)** | local:{command} | Bash: `{command}` | Eyes |
| **Claude + Local** | haiku+ollama:qwen2.5-coder:7b | Task tool (Claude shell) + Bash (local reasoning) | Hybrid |

### Override Modes

| Mode | Syntax (human) | Effect |
|------|----------------|--------|
| Blanket | "use haiku for everything" | All actions use specified model |
| Blanket local | "point everything to ollama qwen2.5-coder:7b" | All compatible actions use local model (Eyes) |
| Blanket hybrid | "use hybrid with ollama qwen2.5-coder:7b" | All actions run as Hybrid (haiku shell + local reasoning) |
| Selective | "use haiku for code, ollama for review" | Named actions use specified models, rest use defaults |
| Reset | "reset models" / "default models" | Clear override, return to defaults |

**Blanket local safety:** When human requests blanket local (Eyes) override, incompatible actions (❌ in table) automatically fall back to their default Claude model. The orchestrator notes this in the chain compilation: `**Fallback:** commit/, onboarding/ remain on {default} (requires tools)`.

**Blanket hybrid advantage:** Hybrid mode has only 2 incompatible actions (commit/, onboarding/) vs 4 for Eyes. Use hybrid when you want local model reasoning everywhere but still need tool access.

### Eyes Agent Execution

When an Eyes agent is spawned, the orchestrator:

1. **Pre-reads all context** — Reads agent.md, relevant source files, config — everything the agent would need
2. **Constructs self-contained prompt** — Pastes all context + agent instructions + inputs into a single prompt
3. **Executes via CLI:**
   ```bash
   ollama run {model} < /tmp/af-agent-prompt-{stepN}.txt
   ```
4. **Captures output** — Reads stdout as the agent's response
5. **Post-processes if needed** — For ⚠️ actions (code/), applies returned edits using Edit/Write tools

### Hybrid Agent Execution

A Hybrid agent is a Claude subagent (Hands) whose agent.md instructs it to delegate reasoning to a local model. The orchestrator:

1. **Spawns via Task tool** — Normal Hands spawn with `model="haiku"` (or specified Claude shell model)
2. **Injects local model target** — Adds `localModel: {ollama model}` to the spawn prompt inputs
3. **Agent workflow:**
   - Agent reads files, gathers context using tools (Read, Grep, Glob)
   - Agent constructs a reasoning prompt with gathered context
   - Agent calls `ollama run {localModel} < /tmp/reasoning-prompt.txt` via Bash
   - Agent reads Ollama's response
   - Agent acts on the response (applies edits, writes output, runs tests)
4. **Result** — Claude handles the tool plumbing, local model handles the thinking

**Hybrid spawn template addition:**
```
Input:
- task: {what to do}
- scope: {files, modules, or areas}
- context: {any additional context}
- localModel: ollama:qwen2.5-coder:7b   # <- NEW: delegate reasoning to this model
```

**Agent.md awareness:** For an action to support Hybrid mode, its agent.md should include a "Local Model Delegation" section describing when and how to call the local model. If the agent.md has no such section, the agent runs as pure Hands (ignores localModel input).

### Orchestrator Behavior When Override Is Active

- Chain compilation table shows the OVERRIDDEN model (not the default)
- Model column shows `ollama:model` or `local:command` for local models
- Agent class shown in chain header: `**Agent Class:** Hands` or `**Agent Class:** Eyes`
- Incompatible actions auto-fallback with note
- Spawn uses Task tool (Hands) or Bash (Eyes) based on resolved model type
- Header includes: `**Model Override:** {mode} → {model}`

## Input Requirement Types

### Requires Input = YES
Orchestrator MUST provide inputs. Without them, agent cannot do its job.

```
Read your definition in .claude/actionflows/actions/code/agent.md

Input:
- task: Fix login validation bug      <- REQUIRED
- context: packages/backend/src/routes/sessions.ts    <- REQUIRED
```

### Requires Input = NO
Agent is autonomous. Orchestrator just spawns it.

```
Read your definition in .claude/actionflows/actions/{action}/agent.md
```

## Spawning Pattern

```python
Task(
  subagent_type="general-purpose",
  model="{from action's instructions.md}",
  run_in_background=True,
  prompt="""
Read your definition in .claude/actionflows/actions/{action}/agent.md

IMPORTANT: You are a spawned subagent executor.
Do NOT read .claude/actionflows/ORCHESTRATOR.md — it is not for you.
Do NOT delegate work or compile chains. Execute your agent.md directly.

Project Context:
- Name: ActionFlows Dashboard
- Backend: Express 4.18 + TypeScript + ws 8.14.2 + ioredis 5.3 + Zod
- Frontend: React 18.2 + Vite 5 + Electron 28 + ReactFlow + Monaco + xterm
- Shared: Branded types, discriminated unions, ES modules
- Paths: backend=packages/backend/, frontend=packages/app/, shared=packages/shared/
- Ports: backend=3001, vite=5173

Input:
- {input}: {value}
"""
)
```
