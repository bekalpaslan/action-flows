# Implementation Plan: Second-Opinion System via Local Ollama Models

## Overview

Design and implement a "second-opinion" system that allows the ActionFlows orchestrator to optionally route action outputs to locally-running Ollama models for complementary analysis. The system adds a standalone Ollama client utility, a second-opinion runner, and orchestrator-facing configuration -- all without modifying existing agent.md files. The POC targets the `review/` action as the first integration point, using a Sequential (critique) pattern where Claude's output is passed to a local model for independent review commentary.

---

## Section 1: Second-Opinion Trigger Heuristic

### Which Actions Benefit

| Action | Benefit Level | Rationale |
|--------|--------------|-----------|
| review/ | HIGH | Code review is subjective; a second perspective catches blind spots. Different models notice different patterns. |
| audit/ | HIGH | Security/architecture audits benefit from diverse analysis angles. Local models may flag issues Claude normalizes. |
| analyze/ | MEDIUM | Quantitative analysis is less subjective, but pattern recognition varies by model. |
| plan/ | MEDIUM | Planning benefits from alternative architectural perspectives, but plans are validated by humans anyway. |
| code/ | LOW | Implementation is objective (it compiles or it doesn't). Second opinions add latency without proportional value. |
| test/ | NONE | Test execution is mechanical. No judgment to second-opinion. |
| commit/ | NONE | Git operations are purely mechanical. |

### Trigger Criteria

The system uses a **hybrid opt-in + automatic** model:

1. **Explicit Human Request (always honored):**
   - Human says "get a second opinion on this" or "run with local model too"
   - Orchestrator adds `second-opinion: true` to the action's spawn config

2. **Automatic Triggers (orchestrator decides):**
   - `review/` and `audit/` actions: **always** trigger second opinion when Ollama is available
   - `analyze/` and `plan/` actions: trigger when scope affects 5+ files or crosses 2+ packages
   - `code/` actions: trigger only on explicit human request

3. **Suppression:**
   - Human says "skip second opinion" or "fast mode"
   - Ollama health check fails (graceful degradation)
   - Action is in a time-sensitive chain and human has set `--no-second-opinion` flag

### Decision Flowchart

```
Action spawned by orchestrator
  |
  v
Is second-opinion explicitly requested by human?
  YES -> Enable second opinion
  NO  -> Is action in [review, audit]?
    YES -> Is Ollama reachable?
      YES -> Enable second opinion
      NO  -> Skip (log warning, continue with Claude-only)
    NO  -> Is action in [analyze, plan]?
      YES -> Does scope exceed threshold (5+ files OR 2+ packages)?
        YES -> Is Ollama reachable? -> Enable/Skip
        NO  -> Skip
      NO  -> Skip (code, test, commit never auto-trigger)
```

---

## Section 2: Model-to-Action Mapping

### Primary Mapping

| Action | Recommended Ollama Model | Rationale |
|--------|------------------------|-----------|
| review/ | qwen2.5-coder:32b | Best code understanding at 32B params. Strong at identifying patterns, anti-patterns, and suggesting improvements. Quality justifies the latency. |
| audit/ | qwen2.5-coder:32b | Deep analysis requires the largest model. Security pattern detection benefits from parameter count. |
| analyze/ | qwen2.5-coder:7b | Analysis is more structured/quantitative. 7B is fast enough with good quality for metric extraction. |
| plan/ | qwen2.5-coder:7b | Planning prompts are long but outputs are structured. 7B provides reasonable architectural perspective at acceptable speed. |
| code/ (if requested) | qwen2.5-coder:7b | Code review of implementation output. 7B is sufficient for "does this look right" checks. |

### Fallback Chain

If the primary model is unavailable (OOM, not pulled), fall back in order:

```
qwen2.5-coder:32b -> qwen2.5-coder:7b -> gemma3:4b -> skip (log warning)
```

For actions mapped to 7b:
```
qwen2.5-coder:7b -> gemma3:4b -> skip (log warning)
```

### Models That Should NEVER Be Used for Second Opinions

- `llama3.2:latest` (3.2B) -- Too small for meaningful code analysis. Would produce noise rather than signal.
- `gemma3:4b` -- Only as a last-resort fallback. Not a primary choice for any action.

### Configuration Structure

```typescript
interface SecondOpinionModelConfig {
  primary: string;        // e.g., "qwen2.5-coder:32b"
  fallbacks: string[];    // e.g., ["qwen2.5-coder:7b", "gemma3:4b"]
  maxTokens: number;      // Max response tokens
  temperature: number;    // Typically 0.3 for analytical tasks
  timeoutMs: number;      // Per-model timeout
}

const MODEL_CONFIGS: Record<string, SecondOpinionModelConfig> = {
  'review': {
    primary: 'qwen2.5-coder:32b',
    fallbacks: ['qwen2.5-coder:7b', 'gemma3:4b'],
    maxTokens: 4096,
    temperature: 0.3,
    timeoutMs: 120_000,    // 2 minutes (32B is slow)
  },
  'audit': {
    primary: 'qwen2.5-coder:32b',
    fallbacks: ['qwen2.5-coder:7b', 'gemma3:4b'],
    maxTokens: 4096,
    temperature: 0.2,
    timeoutMs: 180_000,    // 3 minutes (deep analysis)
  },
  'analyze': {
    primary: 'qwen2.5-coder:7b',
    fallbacks: ['gemma3:4b'],
    maxTokens: 2048,
    temperature: 0.3,
    timeoutMs: 60_000,     // 1 minute
  },
  'plan': {
    primary: 'qwen2.5-coder:7b',
    fallbacks: ['gemma3:4b'],
    maxTokens: 3072,
    temperature: 0.4,
    timeoutMs: 90_000,     // 1.5 minutes
  },
};
```

---

## Section 3: Integration Pattern

### Recommended Pattern: Sequential Critique (Option A)

**Pattern:** Run Claude agent first, then pass Claude's output to the local model for independent critique.

**Why Sequential Critique over Parallel or Challenger:**

| Pattern | Pros | Cons | Verdict |
|---------|------|------|---------|
| **Sequential (critique)** | Local model can reference Claude's specific output. Focused feedback. Lower total resource usage. Clear "primary + reviewer" hierarchy. | Adds latency after Claude finishes. | **CHOSEN** |
| Parallel | Lower wall-clock time. Independent perspectives. | Doubles resource usage. Requires synthesis logic. Both run blind to each other. Complex orchestration. | Too complex for POC. |
| Challenger | True independence. Good for measuring model quality. | Wasteful -- reruns the full analysis. Hard to compare structured outputs. No added value from seeing Claude's work. | Better for benchmarking, not production. |

### How It Works Mechanically

```
1. Orchestrator spawns Claude agent (normal flow)
2. Claude agent completes, writes output to log folder
3. Orchestrator checks: is second-opinion enabled for this action?
4. YES -> Orchestrator reads Claude's output from log folder
5. Orchestrator calls SecondOpinionRunner with:
   - action type (e.g., "review")
   - original input (what Claude was asked to review)
   - Claude's output (what Claude produced)
6. SecondOpinionRunner:
   a. Constructs a critique prompt (action-specific template)
   b. Calls Ollama API with the appropriate local model
   c. Returns structured critique
7. Orchestrator writes critique to same log folder as `second-opinion.md`
8. Orchestrator presents BOTH outputs to human in a unified format
```

### Critique Prompt Template (for review/ action)

```
You are a senior code reviewer providing an independent second opinion.

A previous reviewer analyzed the following code and produced findings.
Your job is to:
1. Identify any issues the previous reviewer MISSED
2. Note any findings you DISAGREE with (and why)
3. Highlight findings you STRONGLY AGREE with
4. Add any additional observations

## Code Under Review
{original_input_scope}

## Previous Review Findings
{claude_output}

## Your Independent Analysis

Respond in this format:

### Missed Issues
- [severity: HIGH/MEDIUM/LOW] description (file:line if applicable)

### Disagreements
- [finding: "original finding text"] Reason for disagreement

### Strong Agreements
- [finding: "original finding text"] Additional supporting evidence

### Additional Observations
- Any patterns, concerns, or suggestions not covered above

### Confidence Score
Rate your confidence in this second opinion: HIGH / MEDIUM / LOW
Explain briefly why.
```

---

## Section 4: Ollama Client Design

### Location

Create a new standalone utility package at:
```
packages/second-opinion/
  src/
    ollama-client.ts       # Low-level Ollama REST API wrapper
    second-opinion.ts      # High-level runner (action-aware)
    prompt-templates.ts    # Critique prompt templates per action type
    config.ts              # Model configs and defaults
    types.ts               # TypeScript interfaces
    index.ts               # Public API
    cli.ts                 # Standalone CLI for testing
  tsconfig.json
  package.json
```

**Rationale for a separate package:** This is a standalone utility (per requirements), not tied to the backend or frontend. It can be imported by the backend later but also runs independently via CLI for POC validation.

### Ollama Client (`ollama-client.ts`)

```typescript
/**
 * Low-level wrapper for Ollama REST API (localhost:11434)
 *
 * Ollama API reference:
 * - POST /api/generate  -- Generate a completion
 * - POST /api/chat      -- Chat completion
 * - GET  /api/tags      -- List available models
 * - POST /api/show      -- Show model info
 */

interface OllamaClientConfig {
  baseUrl: string;          // default: "http://localhost:11434"
  defaultTimeoutMs: number; // default: 120_000
}

interface OllamaGenerateRequest {
  model: string;
  prompt: string;
  system?: string;
  options?: {
    temperature?: number;
    num_predict?: number;     // max tokens
    top_p?: number;
    stop?: string[];
  };
  stream?: boolean;          // default: false for simplicity
}

interface OllamaGenerateResponse {
  model: string;
  response: string;
  done: boolean;
  total_duration: number;    // nanoseconds
  load_duration: number;
  prompt_eval_count: number;
  eval_count: number;
  eval_duration: number;
}

interface OllamaModel {
  name: string;
  size: number;
  digest: string;
  modified_at: string;
}

class OllamaClient {
  private baseUrl: string;
  private defaultTimeoutMs: number;

  constructor(config?: Partial<OllamaClientConfig>);

  /** Check if Ollama is running and reachable */
  async isAvailable(): Promise<boolean>;

  /** List all locally available models */
  async listModels(): Promise<OllamaModel[]>;

  /** Check if a specific model is available */
  async hasModel(modelName: string): Promise<boolean>;

  /** Generate a completion (non-streaming) */
  async generate(request: OllamaGenerateRequest, timeoutMs?: number): Promise<OllamaGenerateResponse>;

  /** Health check with model availability */
  async healthCheck(): Promise<{
    available: boolean;
    models: string[];
    latencyMs: number;
  }>;
}
```

### Key Design Decisions

1. **Non-streaming responses:** The POC uses `stream: false` for simplicity. Streaming adds complexity (SSE parsing, partial response handling) without POC value. Can be added later.

2. **Native `fetch` only:** Node 18+ has native `fetch`. No external HTTP dependencies needed. Keeps the package lightweight.

3. **Timeout via `AbortController`:** Standard pattern for fetch timeout.

```typescript
async generate(request: OllamaGenerateRequest, timeoutMs?: number): Promise<OllamaGenerateResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    timeoutMs ?? this.defaultTimeoutMs
  );

  try {
    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...request, stream: false }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new OllamaError(`Ollama returned ${response.status}: ${response.statusText}`);
    }

    return await response.json() as OllamaGenerateResponse;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new OllamaTimeoutError(
        `Ollama request timed out after ${timeoutMs ?? this.defaultTimeoutMs}ms`
      );
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
```

### Error Handling

```typescript
class OllamaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OllamaError';
  }
}

class OllamaUnavailableError extends OllamaError {
  constructor() {
    super('Ollama is not running or not reachable at the configured URL');
    this.name = 'OllamaUnavailableError';
  }
}

class OllamaTimeoutError extends OllamaError {
  constructor(message: string) {
    super(message);
    this.name = 'OllamaTimeoutError';
  }
}

class OllamaModelNotFoundError extends OllamaError {
  constructor(model: string, available: string[]) {
    super(
      `Model "${model}" not found. Available models: ${available.join(', ')}`
    );
    this.name = 'OllamaModelNotFoundError';
  }
}
```

### Graceful Degradation Flow

```
1. Check Ollama availability (GET /api/tags with 5s timeout)
   - FAIL -> Log warning, return { skipped: true, reason: "ollama_unavailable" }

2. Check model availability
   - Primary not found -> Try fallback chain
   - No fallbacks available -> Log warning, return { skipped: true, reason: "no_model_available" }

3. Send generation request
   - Timeout -> Log warning, return { skipped: true, reason: "timeout", partialResponse?: string }
   - Error -> Log warning, return { skipped: true, reason: "generation_error", error: string }

4. Success -> Return { skipped: false, response, metadata }
```

**Principle:** The second-opinion system NEVER blocks or fails the primary workflow. Every error path results in a graceful skip with a logged reason.

---

## Section 5: Orchestrator Integration

### New Fields in `instructions.md`

Add optional fields to action `instructions.md` files. These do NOT modify the `agent.md` (agents remain unaware of second opinions). The orchestrator reads these when deciding whether to invoke the second-opinion system.

```markdown
## Second Opinion

| Field | Value |
|-------|-------|
| eligible | true |
| auto-trigger | true |
| local-model | qwen2.5-coder:32b |
| fallback-models | qwen2.5-coder:7b, gemma3:4b |
| trigger-threshold | scope >= 1 file |
| timeout | 120000 |
```

For actions that should NOT get second opinions:
```markdown
## Second Opinion

| Field | Value |
|-------|-------|
| eligible | false |
```

### Proposed `instructions.md` Updates (POC Phase Only)

**Note:** For the POC, we do NOT modify any existing `instructions.md` files. Instead, the second-opinion config lives in a separate config file (`packages/second-opinion/src/config.ts`) that the orchestrator or CLI can import. Post-POC, if validated, these fields would be added to each action's `instructions.md`.

### New Response Format for Dual Outputs

When a second opinion is generated, the orchestrator presents both to the human:

```
## Step {N} Complete: review/ -- NEEDS_CHANGES (7 findings)

### Primary Review (Claude sonnet)
{Claude's full review output -- summary, findings table, verdict}

### Second Opinion (qwen2.5-coder:32b via Ollama)
{Local model's critique output}

#### Agreement Summary
| Metric | Value |
|--------|-------|
| Missed issues found | 2 |
| Disagreements | 1 |
| Strong agreements | 4 |
| Confidence | HIGH |

### Synthesis
The second opinion identified 2 additional issues not caught in the primary review:
1. {missed issue 1}
2. {missed issue 2}

One disagreement: {brief description}. Human judgment recommended.
```

### Handling Disagreements

When the local model disagrees with Claude:

1. **Do NOT auto-resolve.** Disagreements are flagged for human decision.
2. Present both perspectives side by side.
3. Tag disagreements with severity:
   - **Critical disagreement:** A finding rated CRITICAL by one model and dismissed by the other. Always surfaces to human.
   - **Minor disagreement:** Style or approach differences. Noted but not urgent.
4. The orchestrator does NOT attempt synthesis for disagreements -- it presents both views and asks the human.

### Orchestrator Behavior Change (Post-POC)

The orchestrator's chain execution would add a new implicit step after eligible actions:

```
Current:  spawn(review/) -> read output -> present to human
Proposed: spawn(review/) -> read output -> [second-opinion check] -> present combined output to human
```

This is transparent to the agents -- they don't know a second opinion exists. Only the orchestrator's presentation layer changes.

---

## Section 6: POC Scope

### Target Action: `review/`

**Why review/:**
- High-value action for second opinions (subjective, benefits from diverse perspectives)
- Structured output (findings table) makes comparison straightforward
- review/ is the most frequently used assessment action
- Easy to measure: did the local model find something Claude missed?

### POC Components

#### 1. `packages/second-opinion/` Package

Standalone TypeScript package with:

| File | Purpose | Priority |
|------|---------|----------|
| `src/types.ts` | All TypeScript interfaces | P0 |
| `src/ollama-client.ts` | Ollama REST API wrapper | P0 |
| `src/config.ts` | Model configs, action mappings, defaults | P0 |
| `src/prompt-templates.ts` | Critique prompt templates for review/ (and stubs for others) | P0 |
| `src/second-opinion.ts` | High-level runner: takes action output, calls Ollama, returns critique | P0 |
| `src/index.ts` | Public API exports | P0 |
| `src/cli.ts` | CLI entry point for standalone testing | P0 |
| `package.json` | Package config | P0 |
| `tsconfig.json` | TypeScript config | P0 |

#### 2. CLI Interface

```bash
# Run second opinion on a review output file
npx tsx packages/second-opinion/src/cli.ts \
  --action review \
  --input "packages/backend/src/routes/sessions.ts" \
  --claude-output ".claude/actionflows/logs/review/some-review_2026-02-08/review.md" \
  --model qwen2.5-coder:32b

# Health check
npx tsx packages/second-opinion/src/cli.ts --health

# List available models
npx tsx packages/second-opinion/src/cli.ts --list-models
```

#### 3. Test Input

Use an existing review log output as test data. If none exists, the CLI should also support a `--demo` mode that:
1. Generates a synthetic code review scenario (hardcoded sample)
2. Runs the second-opinion critique against it
3. Outputs the formatted result

### Success Criteria

| Criteria | Measurement | Target |
|---------|-------------|--------|
| **Connectivity** | CLI can reach Ollama and list models | Pass/Fail |
| **Model fallback** | When primary model is unavailable, falls back correctly | Pass/Fail |
| **Graceful failure** | When Ollama is down, returns skip result without crashing | Pass/Fail |
| **Critique quality** | Local model produces at least 1 finding not in Claude's review | Manual inspection |
| **Critique relevance** | Local model's critique references specific lines/issues from Claude's output | Manual inspection |
| **Latency** | Second opinion completes within configured timeout | < 120s for 32B model |
| **Output format** | Critique follows the structured template (missed issues, disagreements, agreements) | Manual inspection |
| **Type safety** | `pnpm type-check` passes with no errors in the new package | Pass/Fail |

### What to Measure

1. **Latency:** Time from request to response for each model size. Captured automatically from Ollama's `total_duration` field.
2. **Quality:** Subjective assessment of critique usefulness (manual review by human after POC run).
3. **Signal-to-noise ratio:** Of the findings in the second opinion, how many are genuinely useful vs. noise?
4. **Model comparison:** Run the same critique with both 32B and 7B models. Compare quality vs. latency tradeoff.

---

## Steps

### Step 1: Create Package Scaffold

- **Package:** packages/second-opinion/
- **Files:**
  - `packages/second-opinion/package.json` (create)
  - `packages/second-opinion/tsconfig.json` (create)
  - `packages/second-opinion/src/types.ts` (create)
  - `packages/second-opinion/src/index.ts` (create)
- **Changes:** Create new package with TypeScript interfaces for OllamaClient, SecondOpinionRunner, critique responses, config types. The `package.json` should use `"type": "module"`, target `@afw/second-opinion`, and have zero runtime dependencies (only `typescript` and `@types/node` as dev deps). The `tsconfig.json` extends `../../tsconfig.base.json`.
- **Depends on:** Nothing

### Step 2: Implement Ollama Client

- **Package:** packages/second-opinion/
- **Files:**
  - `packages/second-opinion/src/ollama-client.ts` (create)
- **Changes:** Implement the `OllamaClient` class with methods: `isAvailable()`, `listModels()`, `hasModel()`, `generate()`, `healthCheck()`. Use native `fetch` with `AbortController` for timeouts. Implement custom error classes (`OllamaError`, `OllamaUnavailableError`, `OllamaTimeoutError`, `OllamaModelNotFoundError`). All methods handle errors gracefully -- connection refused results in `OllamaUnavailableError`, not an unhandled crash.
- **Depends on:** Step 1

### Step 3: Implement Config and Prompt Templates

- **Package:** packages/second-opinion/
- **Files:**
  - `packages/second-opinion/src/config.ts` (create)
  - `packages/second-opinion/src/prompt-templates.ts` (create)
- **Changes:** Define `MODEL_CONFIGS` mapping action types to model preferences, fallbacks, timeouts, and temperature settings (as designed in Section 2). Create prompt template functions for each action type. The `review/` template is fully detailed (as shown in Section 3). Templates for `audit/`, `analyze/`, and `plan/` are stubs that return a generic critique prompt with a TODO comment for future customization.
- **Depends on:** Step 1

### Step 4: Implement Second Opinion Runner

- **Package:** packages/second-opinion/
- **Files:**
  - `packages/second-opinion/src/second-opinion.ts` (create)
- **Changes:** Implement `SecondOpinionRunner` class that orchestrates the full flow: check availability -> resolve model (with fallback) -> build prompt from template -> call Ollama -> parse and structure response -> return `SecondOpinionResult`. The result type is a discriminated union: `{ skipped: false, critique: StructuredCritique, metadata: RunMetadata }` or `{ skipped: true, reason: SkipReason }`. The runner never throws -- all errors are captured in the skip result.
- **Depends on:** Steps 2, 3

### Step 5: Implement CLI

- **Package:** packages/second-opinion/
- **Files:**
  - `packages/second-opinion/src/cli.ts` (create)
- **Changes:** Create CLI entry point that parses command-line arguments (`--action`, `--input`, `--claude-output`, `--model`, `--health`, `--list-models`, `--demo`). The `--demo` mode includes a hardcoded sample review scenario for immediate testing. The `--health` mode runs a health check and prints a formatted table of available models. The main mode reads a Claude review output file and runs the second-opinion critique, then prints the formatted result to stdout and optionally writes a `second-opinion.md` file alongside the original review output.
- **Depends on:** Step 4

### Step 6: Wire up Package and Verify

- **Package:** packages/second-opinion/, root
- **Files:**
  - `packages/second-opinion/src/index.ts` (update -- add all exports)
  - `pnpm-workspace.yaml` (verify packages/* pattern includes new package)
- **Changes:** Export all public APIs from index.ts. Verify the package is recognized by pnpm workspaces (the existing `packages/*` glob in workspace config should auto-include it). Run `pnpm install` to link the new package. Run `pnpm type-check` to verify no TypeScript errors. Test the CLI with `--health` and `--demo` modes.
- **Depends on:** Step 5

---

## Dependency Graph

```
Step 1 (scaffold + types) -> Step 2 (ollama client) -> Step 4 (runner) -> Step 5 (CLI) -> Step 6 (verify)
                          -> Step 3 (config + templates) -^
```

Steps 2 and 3 can run in parallel after Step 1 completes.
Step 4 depends on both Steps 2 and 3.
Steps 5 and 6 are sequential.

---

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Ollama 32B model is too slow for interactive use | Second opinion takes 3+ minutes, frustrating UX | Configurable timeouts per model. Fallback to 7B if 32B exceeds timeout. Log latency for tuning. |
| Local model produces low-quality critiques (noise) | Human loses trust in second-opinion feature, ignores it | POC measures signal-to-noise. If quality is poor, adjust prompts or restrict to 32B only. Include confidence score in output. |
| Ollama API changes between versions | Client breaks silently | Pin to documented Ollama API endpoints. Add version check in healthCheck(). |
| Large review outputs exceed local model context window | Truncated or incoherent critique | qwen2.5-coder:32b has ~32K context. Truncate Claude output to fit within 75% of context window, preserving findings table. |
| Native fetch not available in older Node versions | Build/runtime error | This project targets ES2022 + Node 18+. Native fetch is available. Add a runtime check with clear error message if missing. |
| pnpm workspace doesn't auto-detect new package | Package not linked, imports fail | Verify `pnpm-workspace.yaml` has `packages/*` glob. Run `pnpm install` after creating package. |
| Prompt template produces inconsistent output structure | Hard to parse or present critique | Use explicit format instructions in prompt. Accept free-text as fallback -- don't require strict parsing for POC. |

---

## Verification

- [ ] `packages/second-opinion/` exists with all listed files
- [ ] `pnpm type-check` passes across all packages (including new one)
- [ ] `npx tsx packages/second-opinion/src/cli.ts --health` successfully reports Ollama status
- [ ] `npx tsx packages/second-opinion/src/cli.ts --list-models` shows available models
- [ ] `npx tsx packages/second-opinion/src/cli.ts --demo` runs a full second-opinion cycle with sample data
- [ ] When Ollama is stopped, `--health` reports unavailable (no crash)
- [ ] When Ollama is stopped, `--demo` returns a graceful skip result (no crash)
- [ ] Critique output follows the structured template format
- [ ] No modifications to any existing `agent.md` or `instructions.md` files
- [ ] Package has zero runtime dependencies

---

## Future Work (Post-POC, Out of Scope)

These items are explicitly NOT part of the POC but inform the design:

1. **Orchestrator Integration:** Add `## Second Opinion` section to each action's `instructions.md`. Modify orchestrator chain execution to auto-invoke second opinion after eligible actions.
2. **Streaming Responses:** Add streaming support to the Ollama client for real-time progress feedback in the dashboard.
3. **Parallel Pattern:** After validating Sequential Critique works, experiment with Parallel mode for audit/ actions where independent analysis is more valuable.
4. **Quality Metrics Collection:** Track second-opinion quality over time. Did the human act on the local model's findings? Build a feedback loop.
5. **Dashboard Integration:** Show second-opinion results in the frontend alongside primary review results. Add a toggle for enabling/disabling second opinions per action.
6. **Model Auto-Selection:** Use scope analysis (file count, line count, language) to dynamically select the best local model rather than using static mappings.
7. **Multi-Model Ensemble:** For critical audits, run the same critique across multiple local models and synthesize agreement patterns.
