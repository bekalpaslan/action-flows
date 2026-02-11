/**
 * ConversationWatcher Service
 *
 * Monitors Claude Code JSONL conversation logs in real-time to detect orchestrator
 * gate passages and trigger gate validation. Enables automatic gate trace recording
 * during live Claude Code sessions without any orchestrator burden.
 *
 * Phase 1: Gate 4 (chain compilation) detection
 *
 * Architecture:
 * - LogDiscovery: Find Claude Code session JSONL file
 * - LogTailer: Watch file for new entries using chokidar
 * - ChainDetector: Pattern match chain compilation format
 * - GateIntegration: Call existing validateChainCompilation()
 */

import chokidar, { type FSWatcher } from 'chokidar';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as readline from 'readline';
import { validateChainCompilation } from './checkpoints/gate04-chain-compilation.js';
import { getGateCheckpoint, type GateCheckpoint } from './gateCheckpoint.js';
import type { ChainId } from '@afw/shared';
import { brandedTypes } from '@afw/shared';
import type { Storage } from '../storage/index.js';

// ============================================================================
// JSONL Schema Types
// ============================================================================

/**
 * JSONL message types based on Claude Code conversation log format
 */
interface AssistantMessage {
  type: 'assistant';
  uuid: string;
  timestamp: string;
  sessionId: string;
  cwd: string;
  gitBranch: string;
  version: string;
  message: {
    role: 'assistant';
    id: string;
    model: string;
    content: Array<
      | { type: 'thinking'; thinking: string }
      | { type: 'text'; text: string }
      | { type: 'tool_use'; id: string; name: string; input: any }
    >;
    stop_reason: string | null;
    usage: {
      input_tokens: number;
      output_tokens: number;
      cache_read_input_tokens?: number;
      cache_creation_input_tokens?: number;
    };
  };
  requestId: string;
  userType: 'external';
}

interface UserMessage {
  type: 'user';
  uuid: string;
  timestamp: string;
  sessionId: string;
  message: {
    role: 'user';
    content: string;
  };
}

interface ProgressEvent {
  type: 'progress';
  uuid: string;
  timestamp: string;
  sessionId: string;
  data: {
    type: 'hook_progress' | 'tool_progress';
    hookEvent?: string;
    hookName?: string;
    command?: string;
  };
}

type JSONLEntry = AssistantMessage | UserMessage | ProgressEvent;

// ============================================================================
// LogDiscovery Component
// ============================================================================

/**
 * Find Claude Code session JSONL file for current project
 */
export class LogDiscovery {
  private projectPath: string;

  constructor(projectPath: string) {
    this.projectPath = projectPath;
  }

  /**
   * Get Claude Code project directory
   * Returns: C:\Users\{username}\.claude\projects\{escaped-project-path}\
   */
  findClaudeProjectDir(): string | null {
    try {
      const homeDir = os.homedir();
      const escapedPath = this.escapeProjectPath();
      const claudeDir = path.join(homeDir, '.claude', 'projects', escapedPath);

      if (fs.existsSync(claudeDir)) {
        return claudeDir;
      }
      return null;
    } catch (error) {
      console.error('[ConversationWatcher] Error finding Claude project dir:', error);
      return null;
    }
  }

  /**
   * Get most recently modified .jsonl file in project directory
   * Returns: Full path to active session log, or null if not found
   */
  getCurrentSessionLog(): string | null {
    const projectDir = this.findClaudeProjectDir();
    if (!projectDir) return null;

    try {
      const files = fs.readdirSync(projectDir)
        .filter(f => f.endsWith('.jsonl') && !f.includes('/')) // Exclude subagent logs
        .map(f => {
          const fullPath = path.join(projectDir, f);
          const stats = fs.statSync(fullPath);
          return { path: fullPath, mtime: stats.mtime };
        })
        .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

      return files[0]?.path || null;
    } catch (error) {
      console.error('[ConversationWatcher] Error reading session logs:', error);
      return null;
    }
  }

  /**
   * Escape project path for Claude Code directory structure
   * Windows: D:\ActionFlowsDashboard → D--ActionFlowsDashboard
   * Unix: /home/user/project → -home-user-project
   */
  private escapeProjectPath(): string {
    return this.projectPath.replace(/[:\\\/]/g, '-');
  }
}

// ============================================================================
// LogTailer Component
// ============================================================================

/**
 * Watch JSONL file for new entries using chokidar
 */
export class LogTailer {
  private watcher: FSWatcher | null = null;
  private position: number = 0;
  private filePath: string;
  private onNewLine: (line: string) => void;

  constructor(filePath: string, onNewLine: (line: string) => void) {
    this.filePath = filePath;
    this.onNewLine = onNewLine;
  }

  /**
   * Start watching file
   * Initializes position to end of file (don't replay history)
   */
  async watch(): Promise<void> {
    // Initialize position to end of file (don't replay history)
    try {
      const stats = fs.statSync(this.filePath);
      this.position = stats.size;
    } catch (error) {
      console.error('[LogTailer] Error getting file size:', error);
      this.position = 0;
    }

    this.watcher = chokidar.watch(this.filePath, {
      persistent: true,
      usePolling: false,
      awaitWriteFinish: {
        stabilityThreshold: 50,  // Wait 50ms after last write
        pollInterval: 10,
      },
    });

    this.watcher.on('change', async () => {
      await this.readNewLines();
    });

    console.log(`[LogTailer] Watching ${this.filePath}`);
  }

  /**
   * Stop watching and cleanup
   */
  async stop(): Promise<void> {
    if (this.watcher) {
      await this.watcher.close();
      this.watcher = null;
      console.log('[LogTailer] Stopped watching');
    }
  }

  /**
   * Read new lines from current position
   * Internal - called on file change
   */
  private async readNewLines(): Promise<void> {
    try {
      const stream = fs.createReadStream(this.filePath, {
        start: this.position,
        encoding: 'utf8',
      });

      const rl = readline.createInterface({ input: stream });

      for await (const line of rl) {
        this.position += Buffer.byteLength(line, 'utf8') + 1; // +1 for newline
        this.onNewLine(line);
      }
    } catch (error) {
      console.error('[LogTailer] Error reading new lines:', error);
    }
  }
}

// ============================================================================
// ChainDetector Component
// ============================================================================

/**
 * Pattern matching for chain compilation format (Gate 4)
 */
export class ChainDetector {
  private static readonly PATTERNS = {
    // 1. Header: "## Chain: {name}"
    header: /^##\s+Chain:\s+.+$/m,

    // 2. Table header: "| # | Action | Model |"
    tableHeader: /^\|\s*#\s*\|\s*Action\s*\|\s*Model\s*\|/m,

    // 3. Table row: "| 1 | analyze/ | sonnet | ..."
    tableRow: /^\|\s*\d+\s*\|\s*[\w/]+\s*\|\s*\w+\s*\|/m,
  };

  /**
   * Check if text contains chain compilation table
   * Uses same patterns as CONTRACT.md validation
   */
  isChainCompilation(text: string): boolean {
    return (
      ChainDetector.PATTERNS.header.test(text) &&
      ChainDetector.PATTERNS.tableHeader.test(text) &&
      ChainDetector.PATTERNS.tableRow.test(text)
    );
  }

  /**
   * Extract clean chain compilation markdown
   * Returns: Markdown string starting from "## Chain:" header
   */
  extractChainCompilation(text: string): string | null {
    if (!this.isChainCompilation(text)) return null;

    // Find "## Chain:" header
    const headerMatch = text.match(ChainDetector.PATTERNS.header);
    if (!headerMatch) return null;

    const startIndex = headerMatch.index!;
    const lines = text.substring(startIndex).split('\n');
    const chainLines: string[] = [];

    let inTable = false;
    for (const line of lines) {
      chainLines.push(line);

      if (line.match(/^\|\s*#\s*\|/)) {
        inTable = true;
      } else if (inTable && line.trim() === '') {
        break; // End of table (blank line)
      }
    }

    return chainLines.join('\n').trim();
  }
}

// ============================================================================
// GateIntegration Component
// ============================================================================

/**
 * Bridge between ChainDetector and GateCheckpoint service
 */
export class GateIntegration {
  private gateCheckpoint: GateCheckpoint;

  constructor(gateCheckpoint: GateCheckpoint) {
    this.gateCheckpoint = gateCheckpoint;
  }

  /**
   * Process detected chain compilation
   * Calls validateChainCompilation() from gate04-chain-compilation.ts
   */
  async processChainCompilation(
    entry: AssistantMessage,
    chainMarkdown: string
  ): Promise<void> {
    try {
      // Generate ChainId from sessionId + timestamp
      const chainId = this.generateChainId(entry.sessionId, entry.timestamp);

      // Call existing gate validator (fire-and-forget)
      await validateChainCompilation(chainMarkdown, chainId);

      console.log(`[ConversationWatcher] Gate 4 validated for chain ${chainId}`);
    } catch (error) {
      console.error('[ConversationWatcher] Error validating chain compilation:', error);
      // Don't throw - validation errors are logged by GateCheckpoint
    }
  }

  /**
   * Generate ChainId from sessionId + timestamp
   * Internal helper
   */
  private generateChainId(sessionId: string, timestamp: string): ChainId {
    // Format: chain-{first-8-chars}-{unix-timestamp}
    const sessionPrefix = sessionId.substring(0, 8);
    const unixTime = new Date(timestamp).getTime();
    return brandedTypes.chainId(`chain-${sessionPrefix}-${unixTime}`);
  }
}

// ============================================================================
// ConversationWatcher (Main Service)
// ============================================================================

/**
 * Main ConversationWatcher service
 * Coordinates all components for live gate detection
 */
export class ConversationWatcher {
  private storage: Storage;
  private gateCheckpoint: GateCheckpoint;
  private logDiscovery: LogDiscovery;
  private logTailer: LogTailer | null = null;
  private chainDetector: ChainDetector;
  private gateIntegration: GateIntegration;
  private currentLogPath: string | null = null;

  constructor(storage: Storage, gateCheckpoint: GateCheckpoint, projectPath: string) {
    this.storage = storage;
    this.gateCheckpoint = gateCheckpoint;
    this.logDiscovery = new LogDiscovery(projectPath);
    this.chainDetector = new ChainDetector();
    this.gateIntegration = new GateIntegration(gateCheckpoint);
  }

  /**
   * Start watching for Claude Code logs
   * Non-blocking - returns immediately
   */
  async start(): Promise<void> {
    console.log('[ConversationWatcher] Starting...');

    // Find current session log
    this.currentLogPath = this.logDiscovery.getCurrentSessionLog();

    if (!this.currentLogPath) {
      console.warn('[ConversationWatcher] No active Claude Code session found. Backend will function normally.');
      return;
    }

    console.log(`[ConversationWatcher] Found active session log: ${this.currentLogPath}`);

    // Start tailing
    this.logTailer = new LogTailer(this.currentLogPath, (line) => {
      this.processLine(line).catch(error => {
        console.error('[ConversationWatcher] Error processing line:', error);
      });
    });

    await this.logTailer.watch();
    console.log('[ConversationWatcher] Started successfully');
  }

  /**
   * Stop watching and cleanup
   */
  async stop(): Promise<void> {
    console.log('[ConversationWatcher] Stopping...');

    if (this.logTailer) {
      await this.logTailer.stop();
      this.logTailer = null;
    }

    this.currentLogPath = null;
    console.log('[ConversationWatcher] Stopped');
  }

  /**
   * Process new JSONL line
   * Internal - called by LogTailer
   */
  private async processLine(line: string): Promise<void> {
    if (!line.trim()) return;

    try {
      const entry: JSONLEntry = JSON.parse(line);

      // Only process assistant messages
      if (entry.type === 'assistant') {
        await this.processAssistantMessage(entry as AssistantMessage);
      }
    } catch (error) {
      console.warn('[ConversationWatcher] Failed to parse JSONL line:', error);
      // Continue processing other lines
    }
  }

  /**
   * Handle assistant message
   * Internal - extracts text blocks and runs chain detection
   */
  private async processAssistantMessage(entry: AssistantMessage): Promise<void> {
    // Extract text content blocks
    const textBlocks = entry.message.content
      .filter(block => block.type === 'text')
      .map(block => (block as { type: 'text'; text: string }).text);

    // Check each text block for chain compilation
    for (const text of textBlocks) {
      if (this.chainDetector.isChainCompilation(text)) {
        const chainMarkdown = this.chainDetector.extractChainCompilation(text);

        if (chainMarkdown) {
          console.log('[ConversationWatcher] Chain compilation detected');
          await this.gateIntegration.processChainCompilation(entry, chainMarkdown);
        }
      }
    }
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let conversationWatcher: ConversationWatcher | null = null;

/**
 * Initialize the ConversationWatcher singleton
 * Call this once during backend startup
 */
export function initConversationWatcher(storage: Storage, projectPath: string): ConversationWatcher {
  if (!conversationWatcher) {
    const gateCheckpoint = getGateCheckpoint();
    conversationWatcher = new ConversationWatcher(storage, gateCheckpoint, projectPath);
    console.log('[ConversationWatcher] Service initialized');
  }
  return conversationWatcher;
}

/**
 * Get the ConversationWatcher singleton instance
 * Returns null if not initialized (graceful degradation)
 */
export function getConversationWatcher(): ConversationWatcher | null {
  return conversationWatcher;
}
