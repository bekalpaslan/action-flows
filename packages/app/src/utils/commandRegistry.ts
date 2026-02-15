/**
 * Command Registry
 * Centralized registry for command palette commands with fuzzy search
 * Supports keyboard shortcuts, categories, and async command execution
 */

/**
 * Command categories for grouping related commands
 */
export type CommandCategory = 'export' | 'navigation' | 'file' | 'view' | 'general';

/**
 * Command definition interface
 */
export interface CommandDefinition {
  /** Unique command identifier */
  id: string;

  /** Display label for the command */
  label: string;

  /** Command category */
  category: CommandCategory;

  /** Optional keyboard shortcut (e.g., 'Ctrl+Shift+E') */
  shortcut?: string;

  /** Optional description text */
  description?: string;

  /** Command execution handler (can be async) */
  execute: () => void | Promise<void>;

  /** Optional icon/emoji */
  icon?: string;
}

/**
 * Search result with relevance score
 */
export interface CommandSearchResult {
  command: CommandDefinition;
  score: number;
  matchIndices: number[];
}

/**
 * Command Registry class for managing and searching commands
 */
export class CommandRegistry {
  private commands: Map<string, CommandDefinition> = new Map();
  private recentCommands: string[] = [];
  private maxRecentCommands = 5;

  /**
   * Register a new command
   */
  register(command: CommandDefinition): void {
    if (this.commands.has(command.id)) {
      console.warn(`Command "${command.id}" is already registered. Overwriting.`);
    }
    this.commands.set(command.id, command);
  }

  /**
   * Register multiple commands at once
   */
  registerAll(commands: CommandDefinition[]): void {
    commands.forEach((cmd) => this.register(cmd));
  }

  /**
   * Unregister a command by ID
   */
  unregister(commandId: string): boolean {
    return this.commands.delete(commandId);
  }

  /**
   * Get a command by ID
   */
  get(commandId: string): CommandDefinition | undefined {
    return this.commands.get(commandId);
  }

  /**
   * Get all registered commands
   */
  getAll(): CommandDefinition[] {
    return Array.from(this.commands.values());
  }

  /**
   * Get commands by category
   */
  getByCategory(category: CommandCategory): CommandDefinition[] {
    return Array.from(this.commands.values()).filter((cmd) => cmd.category === category);
  }

  /**
   * Search commands with fuzzy matching
   * Returns results sorted by relevance score
   */
  search(query: string): CommandSearchResult[] {
    if (!query.trim()) {
      // If no query, return recent commands first, then all commands
      const recent = this.recentCommands
        .map((id) => this.commands.get(id))
        .filter((cmd): cmd is CommandDefinition => cmd !== undefined)
        .map((cmd) => ({
          command: cmd,
          score: 1,
          matchIndices: [],
        }));

      const remaining = Array.from(this.commands.values())
        .filter((cmd) => !this.recentCommands.includes(cmd.id))
        .map((cmd) => ({
          command: cmd,
          score: 0,
          matchIndices: [],
        }));

      return [...recent, ...remaining];
    }

    const results: CommandSearchResult[] = [];
    const lowerQuery = query.toLowerCase();

    for (const command of this.commands.values()) {
      const result = this.fuzzyMatch(command, lowerQuery);
      if (result.score > 0) {
        results.push(result);
      }
    }

    // Sort by score (descending), then by label (ascending)
    return results.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.command.label.localeCompare(b.command.label);
    });
  }

  /**
   * Execute a command by ID
   * Adds to recent commands and handles async execution
   */
  async execute(commandId: string): Promise<void> {
    const command = this.commands.get(commandId);
    if (!command) {
      console.error(`Command "${commandId}" not found`);
      return;
    }

    // Add to recent commands
    this.addToRecent(commandId);

    // Execute command (handle both sync and async)
    try {
      await command.execute();
    } catch (error) {
      console.error(`Error executing command "${commandId}":`, error);
      throw error;
    }
  }

  /**
   * Get recent commands
   */
  getRecent(): CommandDefinition[] {
    return this.recentCommands
      .map((id) => this.commands.get(id))
      .filter((cmd): cmd is CommandDefinition => cmd !== undefined);
  }

  /**
   * Clear recent commands history
   */
  clearRecent(): void {
    this.recentCommands = [];
  }

  /**
   * Add command to recent history
   */
  private addToRecent(commandId: string): void {
    // Remove if already in recent
    this.recentCommands = this.recentCommands.filter((id) => id !== commandId);

    // Add to front
    this.recentCommands.unshift(commandId);

    // Trim to max length
    if (this.recentCommands.length > this.maxRecentCommands) {
      this.recentCommands = this.recentCommands.slice(0, this.maxRecentCommands);
    }
  }

  /**
   * Fuzzy match a command against a query
   * Returns score and match indices
   */
  private fuzzyMatch(command: CommandDefinition, lowerQuery: string): CommandSearchResult {
    const searchText = `${command.label} ${command.description || ''} ${command.category}`.toLowerCase();

    // Exact match gets highest score
    if (searchText.includes(lowerQuery)) {
      const index = searchText.indexOf(lowerQuery);
      return {
        command,
        score: 100,
        matchIndices: Array.from({ length: lowerQuery.length }, (_, i) => index + i),
      };
    }

    // Fuzzy match: check if all query characters appear in order
    const matchIndices: number[] = [];
    let searchIndex = 0;
    let queryIndex = 0;

    while (searchIndex < searchText.length && queryIndex < lowerQuery.length) {
      if (searchText[searchIndex] === lowerQuery[queryIndex]) {
        matchIndices.push(searchIndex);
        queryIndex++;
      }
      searchIndex++;
    }

    // If not all characters matched, no match
    if (queryIndex < lowerQuery.length) {
      return {
        command,
        score: 0,
        matchIndices: [],
      };
    }

    // Calculate score based on match density and position
    // Closer characters = higher score, earlier matches = higher score
    const matchSpread = matchIndices[matchIndices.length - 1] - matchIndices[0];
    const densityScore = Math.max(0, 50 - matchSpread);
    const positionScore = Math.max(0, 30 - matchIndices[0]);
    const totalScore = densityScore + positionScore;

    return {
      command,
      score: totalScore,
      matchIndices,
    };
  }
}

/**
 * Global command registry instance
 */
export const commandRegistry = new CommandRegistry();
