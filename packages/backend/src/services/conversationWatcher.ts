/**
 * ConversationWatcher Service
 *
 * Monitors Claude Code JSONL conversation logs in real-time to detect orchestrator
 * gate passages and trigger gate validation. Enables automatic gate trace recording
 * during live Claude Code sessions without any orchestrator burden.
 *
 * Detects gates: G1 (user message), G2 (context routing), G3 (special work),
 * G4 (chain compilation), G5 (present chain), G6 (step boundary),
 * G8 (execution complete), G9 (agent spawn), G11 (registry update),
 * G12 (archive indexing), G14 (flow candidate)
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
import { validateUserMessage } from './checkpoints/gate01-user-message.js';
import { validateContextRouting } from './checkpoints/gate02-context-routing.js';
import { validateSpecialWork } from './checkpoints/gate03-special-work.js';
import { validateChainCompilation } from './checkpoints/gate04-chain-compilation.js';
import { validateStepBoundary } from './checkpoints/gate06-step-boundary.js';
import { validateExecutionComplete } from './checkpoints/gate08-execution-complete.js';
import { validateRegistryUpdate } from './checkpoints/gate11-registry-update.js';
import { validateArchiveIndexing } from './checkpoints/gate12-archive-indexing.js';
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
  gateId: 'gate-01' | 'gate-02' | 'gate-03' | 'gate-04' | 'gate-05' | 'gate-06' | 'gate-08' | 'gate-09' | 'gate-11' | 'gate-12' | 'gate-14';
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

    // Gate 3: Special Work Detection
    specialWork: /format.*work|contract.*update|harmony.*check|flow.*creation|registry.*edit|CONTRACT\.md|FLOWS\.md|INDEX\.md|LEARNINGS\.md|ACTIONS\.md/i,

    // Gate 4: Chain Compilation
    chainHeader: /^##\s+Chain:\s+.+$/m,
    chainTableHeader: /^\|\s*#\s*\|\s*Action\s*\|\s*Model\s*\|/m,
    chainTableRow: /^\|\s*\d+\s*\|\s*[\w/]+\s*\|\s*\w+\s*\|/m,

    // Gate 5: Present Chain (same as chain compilation header)
    chainPresentation: /^##\s+Chain:\s+.+$/m,

    // Gate 6: Step Boundary
    stepComplete: />>+\s*Step\s+\d+\s+complete:\s*/i,
    sixTriggers: /\[(?:SIGNAL|PATTERN|DEPENDENCY|QUALITY|REDESIGN|REUSE)\]/i,

    // Gate 8: Execution Complete
    executionComplete: /(?:COMPLETE|Execution Complete)/i,

    // Gate 11: Registry Update
    registryFile: /(?:INDEX|LEARNINGS|FLOWS|ACTIONS|CONTEXTS)\.md/i,
    updateConfirmation: /(?:Registry updated|Done\.|successfully|added|removed)/i,

    // Gate 12: Archive Indexing
    archiveIndexing: /INDEX\.md.*updated|Added to INDEX|logs\/INDEX|Chain.*archived|Execution.*logged|log.*folder|## Chain Complete/i,

    // Gate 14: Flow Candidate Evaluation
    flowCandidate: /flow\.candidate|reusable\.pattern|register\.as\.flow/i,
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

    // G3: Special Work Detection
    if (GateDetector.PATTERNS.specialWork.test(text)) {
      events.push({
        gateId: 'gate-03',
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

    // G5: Present Chain (same detection as G4, but validates presentation format)
    if (GateDetector.PATTERNS.chainPresentation.test(text) && this.isChainCompilation(text)) {
      const chainMarkdown = this.extractChainCompilation(text);
      if (chainMarkdown) {
        events.push({
          gateId: 'gate-05',
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

    // G12: Archive Indexing
    if (GateDetector.PATTERNS.archiveIndexing.test(text)) {
      events.push({
        gateId: 'gate-12',
        content: text,
      });
    }

    // G14: Flow Candidate Evaluation
    if (GateDetector.PATTERNS.flowCandidate.test(text)) {
      events.push({
        gateId: 'gate-14',
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
   * Captures header, table, and execution metadata (e.g., **Execution:** Sequential)
   */
  private extractChainCompilation(text: string): string | null {
    if (!this.isChainCompilation(text)) return null;

    const headerMatch = text.match(GateDetector.PATTERNS.chainHeader);
    if (!headerMatch) return null;

    const startIndex = headerMatch.index!;
    const lines = text.substring(startIndex).split('\n');
    const chainLines: string[] = [];

    let inTable = false;
    let tableEnded = false;
    for (const line of lines) {
      // After table ends, check boundary BEFORE adding
      if (tableEnded) {
        // Stop at another section header or blank line
        if (line.match(/^##\s+/) || line.trim() === '') {
          break;
        }
        // Capture execution metadata like **Execution:** Sequential
      }

      chainLines.push(line);

      // Detect table start
      if (line.match(/^\|\s*#\s*\|/)) {
        inTable = true;
      }
      // Table ended when we hit a blank line after being in the table
      else if (inTable && line.trim() === '') {
        tableEnded = true;
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
        case 'gate-01':
          // G1 is detected from user messages, handled separately in processUserMessage
          break;

        case 'gate-02':
          await validateContextRouting(event.content, chainId);
          console.log(`[ConversationWatcher] Gate 2 (Context Routing) detected for chain ${chainId}`);
          break;

        case 'gate-03':
          await validateSpecialWork(event.content, chainId);
          console.log(`[ConversationWatcher] Gate 3 (Special Work) detected for chain ${chainId}`);
          break;

        case 'gate-04':
          await validateChainCompilation(event.content, chainId);
          console.log(`[ConversationWatcher] Gate 4 (Chain Compilation) detected for chain ${chainId}`);
          break;

        case 'gate-05':
          await this.gateCheckpoint.validateGate5(chainId, event.content);
          console.log(`[ConversationWatcher] Gate 5 (Present Chain) detected for chain ${chainId}`);
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

        case 'gate-12':
          await validateArchiveIndexing(event.content, chainId);
          console.log(`[ConversationWatcher] Gate 12 (Archive Indexing) detected for chain ${chainId}`);
          break;

        case 'gate-14':
          await this.gateCheckpoint.validateGate14(chainId, event.content);
          console.log(`[ConversationWatcher] Gate 14 (Flow Candidate) detected for chain ${chainId}`);
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

      // Process user messages for Gate 1
      if (entry.type === 'user') {
        await this.processUserMessage(entry as UserMessage);
      }

      // Process assistant messages for other gates
      if (entry.type === 'assistant') {
        await this.processAssistantMessage(entry as AssistantMessage);
      }
    } catch (error) {
      console.warn('[ConversationWatcher] Failed to parse JSONL line:', error);
      // Continue processing other lines
    }
  }

  /**
   * Handle user message (Gate 1)
   * Internal - validates user message reception
   */
  private async processUserMessage(entry: UserMessage): Promise<void> {
    try {
      // Generate chain ID from session + timestamp
      const sessionPrefix = entry.sessionId.substring(0, 8);
      const unixTime = new Date(entry.timestamp).getTime();
      const chainId = brandedTypes.chainId(`chain-${sessionPrefix}-${unixTime}`);
      const userMessage = entry.message.content;

      // Call Gate 1 validator
      await validateUserMessage(userMessage, chainId);
      console.log(`[ConversationWatcher] Gate 1 (User Message) detected for chain ${chainId}`);
    } catch (error) {
      console.error('[ConversationWatcher] Error processing user message:', error);
    }
  }

  /**
   * Handle assistant message
   * Internal - extracts content blocks and runs gate detection
   */
  private async processAssistantMessage(entry: AssistantMessage): Promise<void> {
    // Process text blocks for text-based gates (G2, G4, G6, G8, G11)
    // CRITICAL: Concatenate all text blocks before gate detection to handle
    // chain tables that span multiple content blocks (e.g., header in block 1, rows in block 2)
    const fullText = entry.message.content
      .filter(block => block.type === 'text')
      .map(block => (block as { type: 'text'; text: string }).text)
      .join('\n');

    if (fullText.trim()) {
      const gateEvents = this.gateDetector.detectGates(fullText);
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
