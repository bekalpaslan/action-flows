/**
 * Command Registry for ActionFlows Dashboard Command Palette
 *
 * Provides a centralized registry for all commands available in the command palette,
 * with support for fuzzy search, keyboard shortcuts, and recent command tracking.
 */

export type CommandCategory = 'navigation' | 'session' | 'flow' | 'system' | 'recent';

export interface Command {
  id: string;
  title: string;
  description?: string;
  category: CommandCategory;
  icon?: string;
  shortcut?: string;
  keywords?: string[];
  action: () => void | Promise<void>;
  enabled?: () => boolean;
}

interface FuzzyMatch {
  command: Command;
  score: number;
}

const RECENT_COMMANDS_KEY = 'actionflows:recent-commands';
const MAX_RECENT_COMMANDS = 5;

export class CommandRegistry {
  private commands: Map<string, Command> = new Map();
  private recentCommandIds: string[] = [];

  constructor() {
    this.loadRecentCommands();
    this.registerDefaultCommands();
  }

  /**
   * Register a new command
   */
  register(command: Command): void {
    this.commands.set(command.id, command);
  }

  /**
   * Unregister a command
   */
  unregister(commandId: string): void {
    this.commands.delete(commandId);
    this.recentCommandIds = this.recentCommandIds.filter(id => id !== commandId);
    this.saveRecentCommands();
  }

  /**
   * Get all registered commands
   */
  getAll(): Command[] {
    return Array.from(this.commands.values()).filter(cmd => {
      return cmd.enabled ? cmd.enabled() : true;
    });
  }

  /**
   * Get commands by category
   */
  getByCategory(category: CommandCategory): Command[] {
    return this.getAll().filter(cmd => cmd.category === category);
  }

  /**
   * Fuzzy search commands
   * Matches against title, description, and keywords
   * Returns results sorted by match quality
   */
  search(query: string): Command[] {
    if (!query.trim()) {
      return this.getAll();
    }

    const normalizedQuery = query.toLowerCase();
    const matches: FuzzyMatch[] = [];

    for (const command of this.commands.values()) {
      // Skip disabled commands
      if (command.enabled && !command.enabled()) {
        continue;
      }

      const score = this.calculateMatchScore(command, normalizedQuery);
      if (score > 0) {
        matches.push({ command, score });
      }
    }

    // Sort by score (highest first)
    matches.sort((a, b) => b.score - a.score);

    return matches.map(match => match.command);
  }

  /**
   * Execute a command by ID
   */
  async execute(commandId: string): Promise<void> {
    const command = this.commands.get(commandId);
    if (!command) {
      throw new Error(`Command not found: ${commandId}`);
    }

    if (command.enabled && !command.enabled()) {
      throw new Error(`Command is disabled: ${commandId}`);
    }

    // Track as recent command
    this.addToRecent(commandId);

    // Execute the command
    await command.action();
  }

  /**
   * Get recently executed commands
   */
  getRecent(): Command[] {
    const recentCommands: Command[] = [];

    for (const id of this.recentCommandIds) {
      const command = this.commands.get(id);
      if (command && (!command.enabled || command.enabled())) {
        recentCommands.push(command);
      }
    }

    return recentCommands;
  }

  /**
   * Calculate fuzzy match score for a command
   * Higher score = better match
   */
  private calculateMatchScore(command: Command, query: string): number {
    let score = 0;

    const title = command.title.toLowerCase();
    const description = command.description?.toLowerCase() || '';
    const keywords = command.keywords?.map(k => k.toLowerCase()) || [];

    // Exact title match: highest score
    if (title === query) {
      score += 1000;
    }
    // Title starts with query: high score
    else if (title.startsWith(query)) {
      score += 500;
    }
    // Title contains query: medium score
    else if (title.includes(query)) {
      score += 250;
    }
    // Title words start with query: medium score
    else if (this.wordStartsMatch(title, query)) {
      score += 200;
    }

    // Description contains query: lower score
    if (description.includes(query)) {
      score += 100;
    }

    // Keyword exact match: medium-high score
    for (const keyword of keywords) {
      if (keyword === query) {
        score += 300;
      } else if (keyword.includes(query)) {
        score += 50;
      }
    }

    // Acronym match (e.g., "gs" matches "Go to Settings")
    if (this.matchesAcronym(title, query)) {
      score += 150;
    }

    // Fuzzy character sequence match
    if (this.fuzzyMatch(title, query)) {
      score += 75;
    }

    return score;
  }

  /**
   * Check if any word in the text starts with the query
   */
  private wordStartsMatch(text: string, query: string): boolean {
    const words = text.split(/\s+/);
    return words.some(word => word.startsWith(query));
  }

  /**
   * Check if query matches the acronym of the text
   * e.g., "gs" matches "Go to Settings"
   */
  private matchesAcronym(text: string, query: string): boolean {
    const words = text.split(/\s+/);
    const acronym = words.map(word => word[0]).join('').toLowerCase();
    return acronym.startsWith(query);
  }

  /**
   * Fuzzy match: check if all characters in query appear in order in text
   */
  private fuzzyMatch(text: string, query: string): boolean {
    let textIndex = 0;
    let queryIndex = 0;

    while (textIndex < text.length && queryIndex < query.length) {
      if (text[textIndex] === query[queryIndex]) {
        queryIndex++;
      }
      textIndex++;
    }

    return queryIndex === query.length;
  }

  /**
   * Add a command to recent history
   */
  private addToRecent(commandId: string): void {
    // Remove if already in recent
    this.recentCommandIds = this.recentCommandIds.filter(id => id !== commandId);

    // Add to front
    this.recentCommandIds.unshift(commandId);

    // Keep only MAX_RECENT_COMMANDS
    if (this.recentCommandIds.length > MAX_RECENT_COMMANDS) {
      this.recentCommandIds = this.recentCommandIds.slice(0, MAX_RECENT_COMMANDS);
    }

    this.saveRecentCommands();
  }

  /**
   * Save recent commands to localStorage
   */
  private saveRecentCommands(): void {
    try {
      localStorage.setItem(RECENT_COMMANDS_KEY, JSON.stringify(this.recentCommandIds));
    } catch (error) {
      console.warn('Failed to save recent commands:', error);
    }
  }

  /**
   * Load recent commands from localStorage
   */
  private loadRecentCommands(): void {
    try {
      const stored = localStorage.getItem(RECENT_COMMANDS_KEY);
      if (stored) {
        this.recentCommandIds = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load recent commands:', error);
      this.recentCommandIds = [];
    }
  }

  /**
   * Register default commands
   */
  private registerDefaultCommands(): void {
    // Navigation commands - all 9 workbenches
    this.register({
      id: 'nav.work',
      title: 'Go to Work',
      description: 'Navigate to the Work workbench',
      category: 'navigation',
      icon: '💼',
      shortcut: 'Ctrl+1',
      keywords: ['work', 'main', 'home'],
      action: () => this.navigateTo('/work'),
    });

    this.register({
      id: 'nav.squad',
      title: 'Go to Squad',
      description: 'Navigate to the Squad workbench',
      category: 'navigation',
      icon: '👥',
      shortcut: 'Ctrl+2',
      keywords: ['squad', 'team', 'agents'],
      action: () => this.navigateTo('/squad'),
    });

    this.register({
      id: 'nav.flows',
      title: 'Go to Flows',
      description: 'Navigate to the Flows workbench',
      category: 'navigation',
      icon: '🔄',
      shortcut: 'Ctrl+3',
      keywords: ['flows', 'workflows', 'orchestration'],
      action: () => this.navigateTo('/flows'),
    });

    this.register({
      id: 'nav.actions',
      title: 'Go to Actions',
      description: 'Navigate to the Actions workbench',
      category: 'navigation',
      icon: '⚡',
      shortcut: 'Ctrl+4',
      keywords: ['actions', 'tasks', 'steps'],
      action: () => this.navigateTo('/actions'),
    });

    this.register({
      id: 'nav.logs',
      title: 'Go to Logs',
      description: 'Navigate to the Logs workbench',
      category: 'navigation',
      icon: '📋',
      shortcut: 'Ctrl+5',
      keywords: ['logs', 'history', 'output'],
      action: () => this.navigateTo('/logs'),
    });

    this.register({
      id: 'nav.harmony',
      title: 'Go to Harmony',
      description: 'Navigate to the Harmony workbench',
      category: 'navigation',
      icon: '🎵',
      shortcut: 'Ctrl+6',
      keywords: ['harmony', 'contracts', 'compatibility'],
      action: () => this.navigateTo('/harmony'),
    });

    this.register({
      id: 'nav.registry',
      title: 'Go to Registry',
      description: 'Navigate to the Registry workbench',
      category: 'navigation',
      icon: '📚',
      shortcut: 'Ctrl+7',
      keywords: ['registry', 'catalog', 'index'],
      action: () => this.navigateTo('/registry'),
    });

    this.register({
      id: 'nav.settings',
      title: 'Go to Settings',
      description: 'Navigate to the Settings workbench',
      category: 'navigation',
      icon: '⚙️',
      shortcut: 'Ctrl+8',
      keywords: ['settings', 'config', 'preferences'],
      action: () => this.navigateTo('/settings'),
    });

    this.register({
      id: 'nav.help',
      title: 'Go to Help',
      description: 'Navigate to the Help workbench',
      category: 'navigation',
      icon: '❓',
      shortcut: 'Ctrl+9',
      keywords: ['help', 'docs', 'documentation'],
      action: () => this.navigateTo('/help'),
    });

    // Session commands
    this.register({
      id: 'session.new',
      title: 'New Session',
      description: 'Create a new orchestration session',
      category: 'session',
      icon: '➕',
      shortcut: 'Ctrl+N',
      keywords: ['new', 'create', 'start'],
      action: async () => {
        // TODO: Implement session creation
        console.log('Creating new session...');
      },
    });

    this.register({
      id: 'session.close',
      title: 'Close Session',
      description: 'Close the current session',
      category: 'session',
      icon: '✖️',
      keywords: ['close', 'end', 'terminate'],
      action: async () => {
        // TODO: Implement session close
        console.log('Closing session...');
      },
      enabled: () => {
        // Only enabled if there's an active session
        // TODO: Check actual session state
        return false;
      },
    });

    this.register({
      id: 'session.attach',
      title: 'Attach Session',
      description: 'Attach to an existing session',
      category: 'session',
      icon: '🔗',
      keywords: ['attach', 'connect', 'join'],
      action: async () => {
        // TODO: Implement session attach
        console.log('Attaching to session...');
      },
    });

    // Flow commands
    this.register({
      id: 'flow.trigger',
      title: 'Trigger Flow',
      description: 'Start a new flow execution',
      category: 'flow',
      icon: '▶️',
      keywords: ['trigger', 'start', 'execute', 'run'],
      action: async () => {
        // TODO: Implement flow trigger
        console.log('Triggering flow...');
      },
    });

    this.register({
      id: 'flow.view-actions',
      title: 'View Actions',
      description: 'View all available actions',
      category: 'flow',
      icon: '👁️',
      keywords: ['view', 'actions', 'list'],
      action: () => this.navigateTo('/actions'),
    });

    // System commands
    this.register({
      id: 'system.toggle-theme',
      title: 'Toggle Theme',
      description: 'Switch between light and dark theme',
      category: 'system',
      icon: '🌓',
      shortcut: 'Ctrl+Shift+T',
      keywords: ['theme', 'dark', 'light', 'appearance'],
      action: () => {
        // TODO: Implement theme toggle
        console.log('Toggling theme...');
      },
    });

    this.register({
      id: 'system.settings',
      title: 'Open Settings',
      description: 'Open application settings',
      category: 'system',
      icon: '⚙️',
      shortcut: 'Ctrl+,',
      keywords: ['settings', 'preferences', 'config'],
      action: () => this.navigateTo('/settings'),
    });

    this.register({
      id: 'system.reload',
      title: 'Reload',
      description: 'Reload the application',
      category: 'system',
      icon: '🔄',
      shortcut: 'Ctrl+R',
      keywords: ['reload', 'refresh', 'restart'],
      action: () => {
        window.location.reload();
      },
    });
  }

  /**
   * Navigate to a route
   * TODO: Integrate with actual router
   */
  private navigateTo(path: string): void {
    console.log(`Navigating to ${path}`);
    // This will be implemented when integrating with the router
    window.location.hash = path;
  }
}

// Export singleton instance
export const commandRegistry = new CommandRegistry();
