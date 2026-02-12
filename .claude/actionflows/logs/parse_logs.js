#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOG_DIR = 'C:/Users/alpas/.claude/projects/D--ActionFlowsDashboard';

async function parseLogFile(filePath) {
  const stats = fs.statSync(filePath);
  const fileName = path.basename(filePath);

  let userMessages = 0;
  let assistantMessages = 0;
  let firstUserMessage = null;
  let firstTimestamp = null;
  let lastTimestamp = null;
  let totalLines = 0;

  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    if (!line.trim()) continue;

    try {
      const entry = JSON.parse(line);
      totalLines++;

      // Extract timestamp from message
      if (entry.message && entry.message.timestamp) {
        const ts = new Date(entry.message.timestamp);
        if (!firstTimestamp || ts < firstTimestamp) firstTimestamp = ts;
        if (!lastTimestamp || ts > lastTimestamp) lastTimestamp = ts;
      }

      if (entry.type === 'user') {
        userMessages++;

        // Get first user message
        if (!firstUserMessage && entry.message && entry.message.content) {
          const content = entry.message.content;
          if (typeof content === 'string') {
            firstUserMessage = content.substring(0, 200);
          } else if (Array.isArray(content)) {
            const textBlock = content.find(b => b.type === 'text');
            if (textBlock && textBlock.text) {
              firstUserMessage = textBlock.text.substring(0, 200);
            }
          }
        }
      } else if (entry.type === 'assistant') {
        assistantMessages++;
      }
    } catch (e) {
      // Skip malformed lines
    }
  }

  return {
    fileName,
    fileSize: stats.size,
    fileSizeMB: (stats.size / (1024 * 1024)).toFixed(2),
    modifiedTime: stats.mtime,
    userMessages,
    assistantMessages,
    totalMessages: userMessages + assistantMessages,
    totalLines,
    firstUserMessage,
    firstTimestamp,
    lastTimestamp
  };
}

async function main() {
  const files = fs.readdirSync(LOG_DIR).filter(f => f.endsWith('.jsonl'));

  console.log(`Found ${files.length} log files`);

  const results = [];

  for (const file of files) {
    const filePath = path.join(LOG_DIR, file);
    try {
      const data = await parseLogFile(filePath);
      results.push(data);
    } catch (e) {
      console.error(`Error parsing ${file}: ${e.message}`);
    }
  }

  // Sort by modification time
  results.sort((a, b) => a.modifiedTime - b.modifiedTime);

  // Write results as JSON
  const outputPath = path.join(__dirname, 'log_inventory.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));

  console.log(`\nInventory written to: ${outputPath}`);

  // Print summary stats
  const totalMessages = results.reduce((sum, r) => sum + r.totalMessages, 0);
  const totalUserMessages = results.reduce((sum, r) => sum + r.userMessages, 0);
  const totalAssistantMessages = results.reduce((sum, r) => sum + r.assistantMessages, 0);
  const totalSize = results.reduce((sum, r) => sum + r.fileSize, 0);

  console.log('\n=== SUMMARY STATISTICS ===');
  console.log(`Total sessions: ${results.length}`);
  console.log(`Total messages: ${totalMessages}`);
  console.log(`  User messages: ${totalUserMessages}`);
  console.log(`  Assistant messages: ${totalAssistantMessages}`);
  console.log(`Total size: ${(totalSize / (1024 * 1024)).toFixed(2)} MB`);

  if (results.length > 0) {
    const firstSession = results[0];
    const lastSession = results[results.length - 1];
    console.log(`\nDate range:`);
    console.log(`  First session: ${firstSession.modifiedTime.toISOString()}`);
    console.log(`  Last session: ${lastSession.modifiedTime.toISOString()}`);
  }
}

main().catch(console.error);
