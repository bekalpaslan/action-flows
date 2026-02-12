#!/usr/bin/env node
/**
 * Test: Chain Compilation Detection from Claude Code JSONL Logs
 *
 * Demonstrates how to:
 * 1. Read JSONL log file
 * 2. Filter for assistant messages with text content
 * 3. Detect chain compilation tables (Gate 4: Chain Compilation)
 * 4. Extract clean markdown for gate validation
 */

import * as fs from 'fs';
import * as readline from 'readline';

// JSONL Entry Type (simplified)
interface AssistantMessage {
  type: 'assistant';
  uuid: string;
  timestamp: string;
  sessionId: string;
  cwd: string;
  message: {
    role: 'assistant';
    content: Array<
      | { type: 'text'; text: string }
      | { type: 'thinking'; thinking: string }
      | { type: 'tool_use'; id: string; name: string; input: any }
    >;
  };
}

// Chain Compilation Detection Patterns
const CHAIN_PATTERNS = {
  // Header pattern: "## Chain: ..."
  header: /^##\s+Chain:\s+.+$/m,

  // Table header: "| # | Action | Model |"
  tableHeader: /^\|\s*#\s*\|\s*Action\s*\|\s*Model\s*\|/m,

  // Full table row: "| 1 | analyze/ | sonnet | ..."
  tableRow: /^\|\s*\d+\s*\|\s*[\w/]+\s*\|\s*\w+\s*\|/m,
};

/**
 * Detect if text contains chain compilation output (Gate 4)
 */
function isChainCompilation(text: string): boolean {
  return (
    CHAIN_PATTERNS.header.test(text) &&
    CHAIN_PATTERNS.tableHeader.test(text) &&
    CHAIN_PATTERNS.tableRow.test(text)
  );
}

/**
 * Extract chain compilation section from assistant output
 */
function extractChainCompilation(text: string): string | null {
  if (!isChainCompilation(text)) return null;

  // Find the "## Chain:" header
  const headerMatch = text.match(/^##\s+Chain:.+$/m);
  if (!headerMatch) return null;

  const startIndex = headerMatch.index!;

  // Extract from header to the end of the table
  // (table ends when we hit a blank line or next section)
  const lines = text.substring(startIndex).split('\n');
  const chainLines: string[] = [];

  let inTable = false;
  for (const line of lines) {
    chainLines.push(line);

    if (line.match(/^\|\s*#\s*\|/)) {
      inTable = true;
    } else if (inTable && line.trim() === '') {
      break; // End of table
    }
  }

  return chainLines.join('\n').trim();
}

/**
 * Process JSONL log file and detect chain compilations
 */
async function processLogFile(filePath: string) {
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let totalMessages = 0;
  let assistantMessages = 0;
  let chainsDetected = 0;

  console.log('📖 Processing JSONL log file...\n');

  for await (const line of rl) {
    totalMessages++;

    try {
      const entry = JSON.parse(line) as any;

      if (entry.type === 'assistant') {
        assistantMessages++;

        // Extract text blocks
        const textBlocks = entry.message?.content?.filter(
          (block: any) => block.type === 'text'
        );

        if (!textBlocks || textBlocks.length === 0) continue;

        for (const block of textBlocks) {
          const text = block.text;

          if (isChainCompilation(text)) {
            chainsDetected++;

            const chainMarkdown = extractChainCompilation(text);

            console.log('✅ CHAIN COMPILATION DETECTED');
            console.log('UUID:', entry.uuid);
            console.log('Timestamp:', entry.timestamp);
            console.log('Session:', entry.sessionId);
            console.log('\n--- Extracted Markdown ---');
            console.log(chainMarkdown);
            console.log('--- End ---\n');

            // This is where we'd call the gate validator:
            // await gateCheckpointService.recordTrace('gate-4-chain-compilation', {
            //   sessionId: entry.sessionId,
            //   timestamp: entry.timestamp,
            //   payload: chainMarkdown
            // });
          }
        }
      }
    } catch (err) {
      // Skip malformed lines
    }
  }

  console.log('\n📊 Summary:');
  console.log(`Total entries: ${totalMessages}`);
  console.log(`Assistant messages: ${assistantMessages}`);
  console.log(`Chain compilations detected: ${chainsDetected}`);
}

// Run test
const logFile = process.env.CLAUDE_LOG_FILE ||
  'C:\\Users\\alpas\\.claude\\projects\\D--ActionFlowsDashboard\\8f888585-a07e-4b71-9542-cae1a8de8e71.jsonl';

processLogFile(logFile).catch(console.error);
