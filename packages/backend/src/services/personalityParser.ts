/**
 * Personality Parser Service
 *
 * Extracts agent personality metadata from agent.md files in the ActionFlows actions directory.
 * Part of Phase 1 Inspiration Roadmap — Thread 5 (Agent Personalities).
 */

import type { AgentPersonality, AgentMetadata, AgentTone, AgentSpeed, AgentRisk, AgentCommunicationStyle } from '@afw/shared';
import { DEFAULT_PERSONALITY } from '@afw/shared';
import { readFile, readdir } from 'fs/promises';
import { join, relative, sep } from 'path';

/**
 * Personality Parser Service
 *
 * Parses agent.md files to extract personality traits and metadata.
 * Caches results in memory for fast access.
 */
export class PersonalityParser {
  private cache: Map<string, AgentMetadata> = new Map();
  private actionsDir: string;

  constructor(actionsDir: string) {
    this.actionsDir = actionsDir;
  }

  /**
   * Parse all agent.md files in the actions directory
   * @returns Map of actionType to AgentMetadata
   */
  async parseAll(): Promise<Map<string, AgentMetadata>> {
    this.cache.clear();

    try {
      await this.scanDirectory(this.actionsDir);
      console.log(`[PersonalityParser] Parsed ${this.cache.size} agent.md files`);
    } catch (error) {
      console.error('[PersonalityParser] Error parsing agent files:', error instanceof Error ? error.message : String(error));
    }

    return this.cache;
  }

  /**
   * Recursively scan directory for agent.md files
   */
  private async scanDirectory(dir: string): Promise<void> {
    try {
      const entries = await readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(dir, entry.name);

        if (entry.isDirectory()) {
          // Skip _abstract and hidden directories
          if (entry.name.startsWith('_') || entry.name.startsWith('.')) {
            continue;
          }
          await this.scanDirectory(fullPath);
        } else if (entry.isFile() && entry.name === 'agent.md') {
          try {
            const metadata = await this.parseAgentFile(fullPath);
            this.cache.set(metadata.actionType, metadata);
          } catch (error) {
            console.warn(`[PersonalityParser] Failed to parse ${fullPath}:`, error instanceof Error ? error.message : String(error));
          }
        }
      }
    } catch (error) {
      console.warn(`[PersonalityParser] Failed to scan directory ${dir}:`, error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * Parse a single agent.md file
   * @param filePath Absolute path to the agent.md file
   * @returns AgentMetadata with personality and actionType
   */
  async parseAgentFile(filePath: string): Promise<AgentMetadata> {
    const content = await readFile(filePath, 'utf-8');
    const personality = this.parsePersonalitySection(content);

    // Extract actionType from file path
    // Example: .claude/actionflows/actions/code/backend/agent.md -> code/backend
    const actionType = this.extractActionType(filePath);

    return {
      actionType,
      personality,
    };
  }

  /**
   * Extract actionType from agent.md file path
   * @param filePath Absolute path to the agent.md file
   * @returns Action type (e.g., "code/backend", "review", "analyze")
   */
  private extractActionType(filePath: string): string {
    // Get relative path from actionsDir
    const rel = relative(this.actionsDir, filePath);

    // Remove agent.md from the end and normalize separators
    const parts = rel.split(sep).filter(p => p !== 'agent.md');

    // Join with forward slashes for consistency
    return parts.join('/');
  }

  /**
   * Extract personality from markdown content
   * @param content Full content of the agent.md file
   * @returns AgentPersonality with tone, speed, risk, and communication style
   */
  parsePersonalitySection(content: string): AgentPersonality {
    // Find the ## Personality section
    const personalityMatch = content.match(/^## Personality\s*$(.*?)(?=^##|\z)/ms);

    if (!personalityMatch || !personalityMatch[1]) {
      return DEFAULT_PERSONALITY;
    }

    const personalitySection = personalityMatch[1];

    // Extract each field with fallbacks to defaults
    const tone = (this.extractField(personalitySection, 'Tone', ['bold', 'cautious', 'curious', 'skeptical', 'decisive', 'balanced']) || DEFAULT_PERSONALITY.tone) as AgentTone;
    const speedPreference = (this.extractField(personalitySection, 'Speed Preference', ['fast', 'balanced', 'slow']) || DEFAULT_PERSONALITY.speedPreference) as AgentSpeed;
    const riskTolerance = (this.extractField(personalitySection, 'Risk Tolerance', ['high', 'medium', 'low']) || DEFAULT_PERSONALITY.riskTolerance) as AgentRisk;
    const communicationStyle = (this.extractField(personalitySection, 'Communication Style', ['terse', 'detailed', 'poetic']) || DEFAULT_PERSONALITY.communicationStyle) as AgentCommunicationStyle;

    return {
      tone,
      speedPreference,
      riskTolerance,
      communicationStyle,
    };
  }

  /**
   * Extract a single personality field from the personality section
   * @param section The personality section content
   * @param fieldName The field name to extract (e.g., "Tone", "Speed Preference")
   * @param validValues List of valid values for this field
   * @returns The extracted value (lowercase) or null if not found
   */
  private extractField(section: string, fieldName: string, validValues: string[]): string | null {
    // Match patterns like:
    // - **Tone:** Bold — ships working code with confidence
    // - **Speed Preference:** Fast — prioritize implementation velocity
    const regex = new RegExp(`\\*\\*${fieldName}:\\*\\*\\s+(\\w+)`, 'i');
    const match = section.match(regex);

    if (!match || !match[1]) {
      return null;
    }

    const value = match[1].toLowerCase();

    // Validate against allowed values
    if (validValues.includes(value)) {
      return value;
    }

    console.warn(`[PersonalityParser] Invalid value "${value}" for field "${fieldName}". Expected one of: ${validValues.join(', ')}`);
    return null;
  }

  /**
   * Get cached metadata for an action type
   * @param actionType The action type (e.g., "code/backend")
   * @returns AgentMetadata or undefined if not found
   */
  get(actionType: string): AgentMetadata | undefined {
    return this.cache.get(actionType);
  }

  /**
   * Get all cached metadata
   * @returns Array of all AgentMetadata
   */
  getAll(): AgentMetadata[] {
    return Array.from(this.cache.values());
  }

  /**
   * Clear cache and re-parse all files
   */
  async refresh(): Promise<void> {
    await this.parseAll();
  }
}

/**
 * Factory function to create a PersonalityParser instance
 * @param actionsDir Optional custom actions directory (defaults to .claude/actionflows/actions)
 * @returns PersonalityParser instance
 */
export function createPersonalityParser(actionsDir?: string): PersonalityParser {
  const baseDir = actionsDir || join(process.cwd(), '.claude', 'actionflows', 'actions');
  return new PersonalityParser(baseDir);
}
