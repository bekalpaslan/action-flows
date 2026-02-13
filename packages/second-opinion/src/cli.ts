#!/usr/bin/env node
/**
 * CLI entry point for second-opinion system
 * Supports: health checks, model listing, demo mode, and real critiques
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { OllamaClient } from './ollama-client.js';
import { SecondOpinionRunner } from './second-opinion.js';
import type { ActionType, SecondOpinionResult } from './types.js';

// ============================================================================
// CLI Argument Parsing
// ============================================================================

interface CLIArgs {
  mode: 'health' | 'list-models' | 'demo' | 'critique';
  actionType: ActionType;
  input?: string;
  claudeOutputPath?: string;
  modelOverride?: string;
  outputPath?: string;
}

function parseArgs(): CLIArgs {
  const args = process.argv.slice(2);
  const result: CLIArgs = {
    mode: 'critique',
    actionType: 'review',
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--health':
        result.mode = 'health';
        break;
      case '--list-models':
        result.mode = 'list-models';
        break;
      case '--demo':
        result.mode = 'demo';
        break;
      case '--action':
        result.actionType = args[++i] as ActionType;
        break;
      case '--input':
        result.input = args[++i];
        break;
      case '--claude-output':
        result.claudeOutputPath = args[++i];
        break;
      case '--model':
        result.modelOverride = args[++i];
        break;
      case '--output':
        result.outputPath = args[++i];
        break;
      case '--help':
        printHelp();
        process.exit(0);
        break;
    }
  }

  return result;
}

function printHelp(): void {
  console.log(`
Second Opinion CLI

Usage:
  tsx src/cli.ts --health                           # Check Ollama health and list models
  tsx src/cli.ts --list-models                      # List available Ollama models
  tsx src/cli.ts --demo                             # Run demo with sample data
  tsx src/cli.ts --action <type> --input <desc> --claude-output <path> [options]

Options:
  --action <type>         Action type (review, audit, analyze, plan, code)
  --input <desc>          Description of what was reviewed/analyzed
  --claude-output <path>  Path to Claude's output file
  --model <name>          Override model selection (e.g., qwen2.5-coder:7b)
  --output <path>         Write result to file (default: stdout)
  --health                Run health check
  --list-models           List available Ollama models
  --demo                  Run demo with hardcoded sample data
  --help                  Show this help message

Examples:
  tsx src/cli.ts --health
  tsx src/cli.ts --demo
  tsx src/cli.ts --action review --input "packages/backend/src/routes/sessions.ts" --claude-output ./review.md
`);
}

// ============================================================================
// Demo Data
// ============================================================================

const DEMO_INPUT = `packages/backend/src/routes/sessions.ts

A TypeScript Express route handler for managing user sessions.`;

const DEMO_CLAUDE_OUTPUT = `# Code Review: Session Route Handler

## Summary
Reviewed the session management route handler in \`packages/backend/src/routes/sessions.ts\`. Found 5 findings: 2 HIGH, 2 MEDIUM, 1 LOW severity.

## Findings

| Severity | Category | Finding | Location |
|----------|----------|---------|----------|
| HIGH | Security | Session IDs are predictable - using sequential integers. Should use cryptographically random UUIDs. | sessions.ts:45 |
| HIGH | Security | No rate limiting on session creation endpoint. Vulnerable to DoS attacks. | sessions.ts:23 |
| MEDIUM | Error Handling | Database errors are logged but return generic 500. Should differentiate between client/server errors. | sessions.ts:78 |
| MEDIUM | Performance | Session lookup iterates full session array. Should use Map for O(1) lookup. | sessions.ts:112 |
| LOW | Code Style | Magic number 3600000 for session timeout. Should be a named constant. | sessions.ts:56 |

## Recommendations

1. **Immediate**: Replace sequential session IDs with \`crypto.randomUUID()\`
2. **Immediate**: Add express-rate-limit middleware to session creation route
3. **Soon**: Refactor error responses to distinguish 4xx vs 5xx appropriately
4. **Soon**: Replace session array with Map<SessionId, Session> for faster lookups
5. **Low Priority**: Extract magic numbers to named constants at top of file

## Verdict
**NEEDS_CHANGES** - Two HIGH severity security issues must be addressed before merge.`;

// ============================================================================
// Mode Handlers
// ============================================================================

async function handleHealth(): Promise<void> {
  console.log('🏥 Running Ollama health check...\n');

  const client = new OllamaClient();
  const health = await client.healthCheck();

  if (!health.available) {
    console.log('❌ Ollama is NOT available');
    console.log(`   Latency: ${health.latencyMs}ms`);
    console.log('\n💡 Make sure Ollama is running: ollama serve');
    process.exit(1);
  }

  console.log('✅ Ollama is available');
  console.log(`   Latency: ${health.latencyMs}ms`);
  console.log(`   Models: ${health.models.length} available\n`);

  if (health.models.length > 0) {
    console.log('Available Models:');
    console.log('─'.repeat(60));
    for (const model of health.models) {
      console.log(`  • ${model}`);
    }
  } else {
    console.log('⚠️  No models found. Pull models with: ollama pull <model-name>');
  }
}

async function handleListModels(): Promise<void> {
  console.log('📋 Listing Ollama models...\n');

  const client = new OllamaClient();
  try {
    const models = await client.listModels();

    if (models.length === 0) {
      console.log('⚠️  No models found.');
      console.log('\n💡 Pull models with: ollama pull qwen2.5-coder:32b');
      return;
    }

    console.log(`Found ${models.length} model(s):\n`);
    console.log('Name'.padEnd(30) + 'Size'.padEnd(15) + 'Modified');
    console.log('─'.repeat(60));

    for (const model of models) {
      const sizeGB = (model.size / 1024 / 1024 / 1024).toFixed(2);
      const modified = new Date(model.modified_at).toLocaleDateString();
      console.log(`${model.name.padEnd(30)}${(sizeGB + ' GB').padEnd(15)}${modified}`);
    }
  } catch (error) {
    console.error('❌ Failed to list models:', error);
    process.exit(1);
  }
}

async function handleDemo(args?: CLIArgs): Promise<void> {
  console.log('🎭 Running second-opinion demo...\n');
  console.log('Input: ' + DEMO_INPUT);
  console.log('\n' + '─'.repeat(80) + '\n');

  const runner = new SecondOpinionRunner();
  const result = await runner.run({
    actionType: 'review',
    originalInput: DEMO_INPUT,
    claudeOutput: DEMO_CLAUDE_OUTPUT,
    modelOverride: args?.modelOverride,
  });

  console.log('\n' + '─'.repeat(80) + '\n');
  formatResult(result);
}

async function handleCritique(args: CLIArgs): Promise<void> {
  if (!args.input) {
    console.error('❌ --input is required for critique mode');
    process.exit(1);
  }

  if (!args.claudeOutputPath) {
    console.error('❌ --claude-output is required for critique mode');
    process.exit(1);
  }

  console.log(`🔍 Running second opinion on ${args.actionType} action...\n`);

  // Read Claude's output
  let claudeOutput: string;
  try {
    claudeOutput = await readFile(args.claudeOutputPath, 'utf-8');
  } catch (error) {
    console.error(`❌ Failed to read Claude output file: ${args.claudeOutputPath}`);
    console.error(error);
    process.exit(1);
  }

  const runner = new SecondOpinionRunner();
  const result = await runner.run({
    actionType: args.actionType,
    originalInput: args.input,
    claudeOutput,
    modelOverride: args.modelOverride,
  });

  formatResult(result);

  // Write to file if requested
  if (args.outputPath) {
    const output = formatResultAsMarkdown(result);
    await mkdir(dirname(args.outputPath), { recursive: true });
    await writeFile(args.outputPath, output, 'utf-8');
    console.log(`\n💾 Written to: ${args.outputPath}`);
  }
}

// ============================================================================
// Formatting
// ============================================================================

function formatResult(result: SecondOpinionResult): void {
  if (result.skipped) {
    console.log('⏭️  Second opinion SKIPPED');
    console.log(`   Reason: ${result.reason}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
    return;
  }

  const { critique, metadata } = result;

  console.log('✅ Second Opinion Complete\n');
  console.log('Metadata:');
  console.log('─'.repeat(60));
  console.log(`  Model: ${metadata.modelUsed}`);
  console.log(`  Latency: ${metadata.latencyMs}ms`);
  console.log(`  Tokens: ${metadata.promptTokens} prompt + ${metadata.responseTokens} response`);
  console.log(`  Fallback used: ${metadata.fallbackUsed ? 'Yes' : 'No'}`);
  console.log(`  Timestamp: ${metadata.timestamp}\n`);

  console.log('Critique Summary:');
  console.log('─'.repeat(60));
  console.log(`  Confidence: ${critique.confidenceScore}`);
  console.log(`  Reason: ${critique.confidenceReason}`);
  console.log(`  Missed issues: ${critique.missedIssues.length}`);
  console.log(`  Disagreements: ${critique.disagreements.length}`);
  console.log(`  Strong agreements: ${critique.strongAgreements.length}`);
  console.log(`  Additional observations: ${critique.additionalObservations.length}\n`);

  if (critique.missedIssues.length > 0) {
    console.log('Missed Issues:');
    console.log('─'.repeat(60));
    for (const issue of critique.missedIssues) {
      console.log(`  [${issue.severity}] ${issue.description}`);
      if (issue.location) {
        console.log(`         Location: ${issue.location}`);
      }
    }
    console.log('');
  }

  if (critique.disagreements.length > 0) {
    console.log('Disagreements:');
    console.log('─'.repeat(60));
    for (const disagreement of critique.disagreements) {
      console.log(`  Finding: "${disagreement.originalFinding}"`);
      console.log(`  Reason: ${disagreement.reason}\n`);
    }
  }

  if (critique.strongAgreements.length > 0) {
    console.log('Strong Agreements:');
    console.log('─'.repeat(60));
    for (const agreement of critique.strongAgreements) {
      console.log(`  Finding: "${agreement.originalFinding}"`);
      console.log(`  Evidence: ${agreement.additionalEvidence}\n`);
    }
  }

  if (critique.additionalObservations.length > 0) {
    console.log('Additional Observations:');
    console.log('─'.repeat(60));
    for (const observation of critique.additionalObservations) {
      console.log(`  • ${observation}`);
    }
    console.log('');
  }

  console.log('Raw Response Preview:');
  console.log('─'.repeat(60));
  const preview = critique.rawResponse.slice(0, 500);
  console.log(preview + (critique.rawResponse.length > 500 ? '...' : ''));
}

function formatResultAsMarkdown(result: SecondOpinionResult): string {
  if (result.skipped) {
    return `# Second Opinion - SKIPPED

**Reason:** ${result.reason}

${result.error ? `**Error:** ${result.error}` : ''}
`;
  }

  const { critique, metadata } = result;

  let md = `# Second Opinion

## Metadata

| Field | Value |
|-------|-------|
| Model | ${metadata.modelUsed} |
| Latency | ${metadata.latencyMs}ms |
| Prompt Tokens | ${metadata.promptTokens} |
| Response Tokens | ${metadata.responseTokens} |
| Fallback Used | ${metadata.fallbackUsed ? 'Yes' : 'No'} |
| Timestamp | ${metadata.timestamp} |

## Critique Summary

| Metric | Value |
|--------|-------|
| Confidence | ${critique.confidenceScore} |
| Missed Issues | ${critique.missedIssues.length} |
| Disagreements | ${critique.disagreements.length} |
| Strong Agreements | ${critique.strongAgreements.length} |
| Additional Observations | ${critique.additionalObservations.length} |

**Confidence Reason:** ${critique.confidenceReason}

`;

  if (critique.missedIssues.length > 0) {
    md += `## Missed Issues\n\n`;
    for (const issue of critique.missedIssues) {
      md += `- **[${issue.severity}]** ${issue.description}`;
      if (issue.location) {
        md += ` (${issue.location})`;
      }
      md += '\n';
    }
    md += '\n';
  }

  if (critique.disagreements.length > 0) {
    md += `## Disagreements\n\n`;
    for (const disagreement of critique.disagreements) {
      md += `- **Finding:** "${disagreement.originalFinding}"\n`;
      md += `  **Reason:** ${disagreement.reason}\n\n`;
    }
  }

  if (critique.strongAgreements.length > 0) {
    md += `## Strong Agreements\n\n`;
    for (const agreement of critique.strongAgreements) {
      md += `- **Finding:** "${agreement.originalFinding}"\n`;
      md += `  **Evidence:** ${agreement.additionalEvidence}\n\n`;
    }
  }

  if (critique.additionalObservations.length > 0) {
    md += `## Additional Observations\n\n`;
    for (const observation of critique.additionalObservations) {
      md += `- ${observation}\n`;
    }
    md += '\n';
  }

  md += `## Raw Response\n\n\`\`\`\n${critique.rawResponse}\n\`\`\`\n`;

  return md;
}

// ============================================================================
// Main
// ============================================================================

async function main(): Promise<void> {
  const args = parseArgs();

  try {
    switch (args.mode) {
      case 'health':
        await handleHealth();
        break;
      case 'list-models':
        await handleListModels();
        break;
      case 'demo':
        await handleDemo(args);
        break;
      case 'critique':
        await handleCritique(args);
        break;
    }
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

main();
