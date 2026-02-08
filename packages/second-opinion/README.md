# Second Opinion System

A standalone TypeScript utility for getting second opinions from local Ollama models on ActionFlows agent outputs.

## Overview

The second-opinion system allows ActionFlows to optionally route action outputs to locally-running Ollama models for complementary analysis. This POC targets code review actions using a Sequential Critique pattern where Claude's output is passed to a local model for independent review commentary.

## Features

- **Zero Runtime Dependencies** - Uses only Node.js built-ins
- **Graceful Degradation** - Never blocks the primary workflow; all errors handled gracefully
- **Model Fallback Chain** - Automatically falls back to smaller/faster models if primary is unavailable
- **Structured Critique Parsing** - Extracts missed issues, disagreements, agreements, and observations
- **CLI Interface** - Health checks, model listing, demo mode, and real critique processing
- **Type-Safe** - 100% TypeScript with strict mode and discriminated unions

## Quick Start

### Install Dependencies

```bash
cd packages/second-opinion
pnpm install
```

### Check Ollama Health

```bash
pnpm health
```

Output:
```
✅ Ollama is available
   Latency: 48ms
   Models: 5 available
```

### Run Demo

```bash
pnpm demo --model gemma3:4b
```

This runs a complete second-opinion cycle with hardcoded sample review data.

### List Available Models

```bash
pnpm list-models
```

## Usage

### CLI

```bash
# Health check
npx tsx src/cli.ts --health

# List models
npx tsx src/cli.ts --list-models

# Run demo with default model (qwen2.5-coder:32b)
npx tsx src/cli.ts --demo

# Run demo with specific model
npx tsx src/cli.ts --demo --model gemma3:4b

# Process real review output
npx tsx src/cli.ts \
  --action review \
  --input "packages/backend/src/routes/sessions.ts" \
  --claude-output "./path/to/review.md" \
  --output "./second-opinion.md"
```

### Programmatic API

```typescript
import { OllamaClient, SecondOpinionRunner } from '@afw/second-opinion';

// Create runner
const runner = new SecondOpinionRunner();

// Run second opinion
const result = await runner.run({
  actionType: 'review',
  originalInput: 'Code file description',
  claudeOutput: 'Claude\'s review findings...',
  modelOverride: 'qwen2.5-coder:7b', // optional
});

if (!result.skipped) {
  console.log('Missed issues:', result.critique.missedIssues);
  console.log('Disagreements:', result.critique.disagreements);
  console.log('Model used:', result.metadata.modelUsed);
  console.log('Latency:', result.metadata.latencyMs, 'ms');
}
```

## Configuration

Model configurations are defined in `src/config.ts`:

| Action | Primary Model | Fallbacks | Timeout |
|--------|--------------|-----------|---------|
| review | qwen2.5-coder:32b | qwen2.5-coder:7b, gemma3:4b | 120s |
| audit | qwen2.5-coder:32b | qwen2.5-coder:7b, gemma3:4b | 180s |
| analyze | qwen2.5-coder:7b | gemma3:4b | 60s |
| plan | qwen2.5-coder:7b | gemma3:4b | 90s |
| code | qwen2.5-coder:7b | gemma3:4b | 60s |

## Architecture

### Components

- **types.ts** - TypeScript interfaces for entire system
- **ollama-client.ts** - Low-level Ollama REST API wrapper
- **config.ts** - Model configurations and action mappings
- **prompt-templates.ts** - Action-specific critique prompts
- **second-opinion.ts** - High-level orchestration runner
- **cli.ts** - Command-line interface
- **index.ts** - Public API exports

### Error Handling

The system uses a **never-throw** philosophy:

```typescript
type SecondOpinionResult =
  | { skipped: false; critique: StructuredCritique; metadata: RunMetadata }
  | { skipped: true; reason: SkipReason; error?: string };
```

All errors result in a graceful skip with detailed reason:
- `ollama_unavailable` - Ollama not running or unreachable
- `no_model_available` - None of configured models are available
- `timeout` - Model response exceeded configured timeout
- `generation_error` - Error during generation
- `ineligible_action` - Action type not eligible for second opinions

### Model Selection

The system attempts models in fallback order:

1. **Primary Model** (e.g., qwen2.5-coder:32b for review)
2. **First Fallback** (e.g., qwen2.5-coder:7b)
3. **Second Fallback** (e.g., gemma3:4b)
4. **Skip** - Logs warning, returns skipped result

The `fallbackUsed` field in metadata tracks whether a fallback was needed.

## Critique Format

Second opinions follow a structured format:

### Missed Issues
Issues the original reviewer didn't catch:
```
- [severity: HIGH] Description (file:line)
```

### Disagreements
Findings the second opinion disagrees with:
```
- [finding: "original text"] Reason for disagreement
```

### Strong Agreements
Validation of original findings:
```
- [finding: "original text"] Additional supporting evidence
```

### Additional Observations
New insights not covered in original review:
```
- Pattern or concern description
```

### Confidence Score
Self-assessment of critique quality:
```
HIGH / MEDIUM / LOW with brief explanation
```

## Performance

Based on demo runs:

| Model | Latency | Quality | Use Case |
|-------|---------|---------|----------|
| gemma3:4b | ~18s | Good | Fast feedback, development |
| qwen2.5-coder:7b | ~30-60s | Better | Balanced quality/speed |
| qwen2.5-coder:32b | >120s | Best | Critical audits only |

**Recommendation:** Use gemma3:4b or qwen2.5-coder:7b for most cases. Reserve 32B for high-stakes audits with extended timeout.

## Future Enhancements

### Post-Action Hook Pattern

The system is designed for future generalization into a framework-level hook system:

```typescript
interface PostActionHook {
  name: string;
  shouldRun(context: PostActionHookContext): boolean;
  run(context: PostActionHookContext): Promise<PostActionHookResult>;
}
```

See `types.ts` for detailed design notes.

### Planned Improvements

- **Streaming Responses** - Real-time progress feedback
- **Multi-Model Ensemble** - Run multiple models and synthesize results
- **Quality Metrics** - Track second-opinion quality over time
- **Dashboard Integration** - Visualize dual outputs side-by-side
- **Orchestrator Integration** - Auto-trigger on eligible actions

## Testing

### Type Check
```bash
pnpm type-check
```

### Manual Testing
```bash
# Test health check
pnpm health

# Test with smallest model (fastest)
npx tsx src/cli.ts --demo --model gemma3:4b

# Test with 7B model
npx tsx src/cli.ts --demo --model qwen2.5-coder:7b
```

## Requirements

- **Node.js** 18+ (for native fetch)
- **Ollama** running at localhost:11434
- **TypeScript** 5.3+

## License

MIT

## Author

ActionFlows Team
