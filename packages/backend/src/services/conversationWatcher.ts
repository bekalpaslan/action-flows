/**
 * ConversationWatcher Service
 *
 * Monitors Claude Code JSONL conversation logs in real-time to detect orchestrator
 * gate passages and trigger gate validation. Enables automatic gate trace recording
 * during live Claude Code sessions without any orchestrator burden.
 *
 * Detects gates: G2 (context routing), G4 (chain compilation), G6 (step boundary),
 * G8 (execution complete), G9 (agent spawn), G11 (registry update)
 *
 * Architecture:
 * - LogDiscovery: Find Claude Code session JSONL file
 * - LogTailer: Watch file for new entries using chokidar
 * - GateDetector: Pattern match all major gate events
 * - GateIntegration: Call gate validators
 */

import chokidar, { type FSWatcher } from 'chokidar';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as readline from 'readline';
import { validateChainCompilation } from './checkpoints/gate04-chain-compilation.js';
import { validateContextRouting } from './checkpoints/gate02-context-routing.js';
import { validateStepBoundary } from './checkpoints/gate06-step-boundary.js';
import { validateExecutionComplete } from './checkpoints/gate08-execution-complete.js';
import { validateRegistryUpdate } from './checkpoints/gate11-registry-update.js';
import { getGateCheckpoint, type GateCheckpoint } from './gateCheckpoint.js';
import type { ChainId, StepId } from '@afw/shared';
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
    // Match Claude Code's actual directory naming:
    // Windows: D:\ActionFlowsDashboard → D--ActionFlowsDashboard
    // Unix: /home/user/project → -home-user-project
    if (process.platform === 'win32') {
      // Windows: Drive colon becomes double dash, path separators become single dash
      return this.projectPath
        .replace(/^([A-Z]):\\/, '$1--')  // D:\ → D--
        .replace(/\\/g, '-');             // Other \ → -
    } else {
      // Unix: All slashes become dashes
      return this.projectPath.replace(/\//g, '-');
    }
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
// GateDetector Component
// ============================================================================

/**
 * Detected gate event
 */
interface GateEvent {
  gateId: 'gate-02' | 'gate-04' | 'gate-06' | 'gate-08' | 'gate-09' | 'gate-11';
  content: string;
  metadata?: Record<string, any>;
}

/**
 * Pattern matching for all major gate events
 */
export class GateDetector {
  private static readonly PATTERNS = {
    // Gate 2: Context Routing
    contextRouting: /(?:Routing to|Context:)\s+(\w+)/i,

    // Gate 4: Chain Compilation
    chainHeader: /^##\s+Chain:\s+.+$/m,
    chainTableHeader: /^\|\s*#\s*\|\s*Action\s*\|\s*Model\s*\|/m,
    chainTableRow: /^\|\s*\d+\s*\|\s*[\w/]+\s*\|\s*\w+\s*\|/m,

    // Gate 6: Step Boundary
    stepComplete: />>+\s*Step\s+\d+\s+complete:\s*/i,
    sixTriggers: /\[(?:SIGNAL|PATTERN|DEPENDENCY|QUALITY|REDESIGN|REUSE)\]/i,

    // Gate 8: Execution Complete
    executionComplete: /(?:COMPLETE|Execution Complete)/i,

    // Gate 11: Registry Update
    registryFile: /(?:INDEX|LEARNINGS|FLOWS|ACTIONS|CONTEXTS)\.md/i,
    updateConfirmation: /(?:Registry updated|Done\.|successfully|added|removed)/i,
  };

  /**
   * Detect all gate events in text content
   * Returns array of detected gate events
   */
  detectGates(text: string): GateEvent[] {
    const events: GateEvent[] = [];

    // G2: Context Routing
    if (GateDetector.PATTERNS.contextRouting.test(text)) {
      events.push({
        gateId: 'gate-02',
        content: text,
      });
    }

    // G4: Chain Compilation
    if (this.isChainCompilation(text)) {
      const chainMarkdown = this.extractChainCompilation(text);
      if (chainMarkdown) {
        events.push({
          gateId: 'gate-04',
          content: chainMarkdown,
        });
      }
    }

    // G6: Step Boundary
    if (GateDetector.PATTERNS.stepComplete.test(text)) {
      events.push({
        gateId: 'gate-06',
        content: text,
      });
    }

    // G8: Execution Complete
    if (this.isExecutionComplete(text)) {
      events.push({
        gateId: 'gate-08',
        content: text,
      });
    }

    // G11: Registry Update
    if (this.isRegistryUpdate(text)) {
      events.push({
        gateId: 'gate-11',
        content: text,
      });
    }

    return events;
  }

  /**
   * Detect agent spawn tool_use blocks
   * Returns G9 event if Task tool detected
   */
  detectAgentSpawn(toolUse: { type: 'tool_use'; id: string; name: string; input: any }): GateEvent | null {
    if (toolUse.name === 'Task') {
      return {
        gateId: 'gate-09',
        content: JSON.stringify(toolUse.input, null, 2),
        metadata: {
          toolId: toolUse.id,
          subagentType: toolUse.input.subagent_type,
          model: toolUse.input.model,
          prompt: toolUse.input.prompt?.substring(0, 500),
        },
      };
    }
    return null;
  }

  /**
   * Check if text contains chain compilation table
   */
  private isChainCompilation(text: string): boolean {
    return (
      GateDetector.PATTERNS.chainHeader.test(text) &&
      GateDetector.PATTERNS.chainTableHeader.test(text) &&
      GateDetector.PATTERNS.chainTableRow.test(text)
    );
  }

  /**
   * Extract clean chain compilation markdown
   */
  private extractChainCompilation(text: string): string | null {
    if (!this.isChainCompilation(text)) return null;

    const headerMatch = text.match(GateDetector.PATTERNS.chainHeader);
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
        break;
      }
    }

    return chainLines.join('\n').trim();
  }

  /**
   * Check if text is execution complete table
   */
  private isExecutionComplete(text: string): boolean {
    const hasCompleteMarker = GateDetector.PATTERNS.executionComplete.test(text);
    const hasTable = GateDetector.PATTERNS.chainTableHeader.test(text);
    return hasCompleteMarker && hasTable;
  }

  /**
   * Check if text is registry update
   */
  private isRegistryUpdate(text: string): boolean {
    const hasRegistryFile = GateDetector.PATTERNS.registryFile.test(text);
    const hasConfirmation = GateDetector.PATTERNS.updateConfirmation.test(text);
    return hasRegistryFile && hasConfirmation;
  }
}

// ============================================================================
// GateIntegration Component
// ============================================================================

/**
 * Bridge between GateDetector and GateCheckpoint service
 */
export class GateIntegration {
  private gateCheckpoint: GateCheckpoint;
  private currentStepCounter: number = 0;

  constructor(gateCheckpoint: GateCheckpoint) {
    this.gateCheckpoint = gateCheckpoint;
  }

  /**
   * Process detected gate event
   * Routes to appropriate validator based on gateId
   */
  async processGateEvent(
    entry: AssistantMessage,
    event: GateEvent
  ): Promise<void> {
    try {
      const chainId = this.generateChainId(entry.sessionId, entry.timestamp);

      switch (event.gateId) {
        case 'gate-02':
          await validateContextRouting(event.content, chainId);
          console.log(`[ConversationWatcher] Gate 2 (Context Routing) detected for chain ${chainId}`);
          break;

        case 'gate-04':
          await validateChainCompilation(event.content, chainId);
          console.log(`[ConversationWatcher] Gate 4 (Chain Compilation) detected for chain ${chainId}`);
          break;

        case 'gate-06':
          const stepId = this.generateStepId(chainId);
          await validateStepBoundary(event.content, chainId, stepId);
          console.log(`[ConversationWatcher] Gate 6 (Step Boundary) detected for chain ${chainId}`);
          break;

        case 'gate-08':
          await validateExecutionComplete(event.content, chainId);
          console.log(`[ConversationWatcher] Gate 8 (Execution Complete) detected for chain ${chainId}`);
          break;

        case 'gate-09':
          // G9 is detected from tool_use blocks, not text
          // This case handled separately in processAgentSpawn
          break;

        case 'gate-11':
          await validateRegistryUpdate(event.content, chainId);
          console.log(`[ConversationWatcher] Gate 11 (Registry Update) detected for chain ${chainId}`);
          break;
      }
    } catch (error) {
      console.error(`[ConversationWatcher] Error validating ${event.gateId}:`, error);
      // Don't throw - validation errors are logged by GateCheckpoint
    }
  }

  /**
   * Process agent spawn event (Gate 9)
   * Special handling for tool_use blocks
   */
  async processAgentSpawn(
    entry: AssistantMessage,
    event: GateEvent
  ): Promise<void> {
    try {
      const chainId = this.generateChainId(entry.sessionId, entry.timestamp);

      // Gate 9 validator expects actionType and outputPath
      // For now, we'll skip full validation since we don't have the output path yet
      // The validator will be called when the agent completes
      console.log(`[ConversationWatcher] Gate 9 (Agent Spawn) detected for chain ${chainId}`);

      // Note: Full G9 validation happens after agent completes and writes output
      // This is just spawn detection
    } catch (error) {
      console.error('[ConversationWatcher] Error processing agent spawn:', error);
    }
  }

  /**
   * Generate ChainId from sessionId + timestamp
   */
  private generateChainId(sessionId: string, timestamp: string): ChainId {
    const sessionPrefix = sessionId.substring(0, 8);
    const unixTime = new Date(timestamp).getTime();
    return brandedTypes.chainId(`chain-${sessionPrefix}-${unixTime}`);
  }

  /**
   * Generate StepId for step boundary validation
   */
  private generateStepId(chainId: ChainId): StepId {
    this.currentStepCounter++;
    return brandedTypes.stepId(`${chainId}-step-${this.currentStepCounter}`);
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
  private gateDetector: GateDetector;
  private gateIntegration: GateIntegration;
  private currentLogPath: string | null = null;

  constructor(storage: Storage, gateCheckpoint: GateCheckpoint, projectPath: string) {
    this.storage = storage;
    this.gateCheckpoint = gateCheckpoint;
    this.logDiscovery = new LogDiscovery(projectPath);
    this.gateDetector = new GateDetector();
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
   * Internal - extracts content blocks and runs gate detection
   */
  private async processAssistantMessage(entry: AssistantMessage): Promise<void> {
    // Process text blocks for text-based gates (G2, G4, G6, G8, G11)
    const textBlocks = entry.message.content
      .filter(block => block.type === 'text')
      .map(block => (block as { type: 'text'; text: string }).text);

    for (const text of textBlocks) {
      const gateEvents = this.gateDetector.detectGates(text);

      for (const event of gateEvents) {
        await this.gateIntegration.processGateEvent(entry, event);
      }
    }

    // Process tool_use blocks for agent spawn detection (G9)
    const toolUseBlocks = entry.message.content
      .filter(block => block.type === 'tool_use')
      .map(block => block as { type: 'tool_use'; id: string; name: string; input: any });

    for (const toolUse of toolUseBlocks) {
      const spawnEvent = this.gateDetector.detectAgentSpawn(toolUse);
      if (spawnEvent) {
        await this.gateIntegration.processAgentSpawn(entry, spawnEvent);
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
