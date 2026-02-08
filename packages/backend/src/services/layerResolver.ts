/**
 * Layer Resolver Service
 * Resolves the effective set of behaviors by merging layers.
 * Implements SRD Section 4.3: Layer Resolution Engine
 *
 * Resolution algorithm:
 * 1. Load all core entries (source.type === 'core')
 * 2. For each installed pack (in install order):
 *    a. Add new entries (no conflict)
 *    b. For entries with matching IDs: pack overrides core
 * 3. For each project override:
 *    a. Add new entries (no conflict)
 *    b. For entries with matching IDs: project overrides pack/core
 * 4. Return merged set with provenance tracking
 *
 * Conflict detection:
 * - Same ID, different sources: higher layer wins
 * - Same ID, same source: later version wins
 * - Pack-pack conflict: log warning, last-installed wins
 */

import type {
  RegistryEntry,
  RegistryEntryId,
  ResolvedBehavior,
  RegistryConflict,
  RegistryFilter,
  LayerSource,
  ProjectId,
  ButtonDefinition,
  PatternAction,
} from '@afw/shared';
import { registryStorage, RegistryStorage } from './registryStorage.js';

/**
 * Severity level for registry conflicts
 */
export type ConflictSeverity = 'info' | 'warning' | 'error';

/**
 * Extended conflict information with severity and resolution details
 */
export interface RegistryConflictWithSeverity extends RegistryConflict {
  severity: ConflictSeverity;
}

/**
 * Resolves the effective set of behaviors by merging layers.
 * Implements Core → Pack → Project precedence.
 */
export class LayerResolver {
  constructor(private storage: RegistryStorage = registryStorage) {}

  /**
   * Get layer priority (lower number = lower priority)
   * core (1) < pack (2) < project (3)
   */
  private layerPriority(source: LayerSource): number {
    switch (source.type) {
      case 'core':
        return 1;
      case 'pack':
        return 2;
      case 'project':
        return 3;
      default:
        return 0;
    }
  }

  /**
   * Compare two layer sources for equality
   */
  private sourcesEqual(a: LayerSource, b: LayerSource): boolean {
    if (a.type !== b.type) return false;
    if (a.type === 'pack' && b.type === 'pack') {
      return a.packId === b.packId;
    }
    if (a.type === 'project' && b.type === 'project') {
      return a.projectId === b.projectId;
    }
    return true; // both are 'core'
  }

  /**
   * Resolve a single entry by ID across all layers
   * Returns merged behavior with Core → Pack → Project precedence
   *
   * @param entryId - The registry entry ID to resolve
   * @param projectId - Optional project ID to filter project-level entries
   * @returns The resolved behavior with effective source and conflict list
   */
  async resolve(
    entryId: RegistryEntryId,
    projectId?: string
  ): Promise<ResolvedBehavior | undefined> {
    const allEntries = await this.storage.listEntries();

    // Find all entries with matching ID
    const matchingEntries = allEntries.filter((e) => {
      if (e.id !== entryId) return false;
      // Filter project entries if projectId specified
      if (e.source.type === 'project') {
        if (!projectId) return false;
        return e.source.projectId === (projectId as ProjectId);
      }
      return true;
    });

    if (matchingEntries.length === 0) {
      return undefined;
    }

    // Sort by layer priority (lower first, so we can iterate and override)
    matchingEntries.sort(
      (a, b) => this.layerPriority(a.source) - this.layerPriority(b.source)
    );

    // Build layers array and track conflicts
    const layers: Array<{ source: LayerSource; entry: RegistryEntry }> = [];
    const conflicts: string[] = [];
    let effectiveEntry: RegistryEntry = matchingEntries[0];
    let effectiveSource: LayerSource = matchingEntries[0].source;

    for (const entry of matchingEntries) {
      layers.push({ source: entry.source, entry });

      // If we already have an entry from a different source, record the conflict
      if (layers.length > 1) {
        const prevLayer = layers[layers.length - 2];
        conflicts.push(
          `${entry.source.type} layer overrides ${prevLayer.source.type} layer`
        );
      }

      // Higher priority layer wins
      effectiveEntry = entry;
      effectiveSource = entry.source;
    }

    // Build overriddenBy list (legacy field)
    const overriddenBy: LayerSource[] = [];
    if (layers.length > 1) {
      // The effective source overrides all previous layers
      for (let i = 0; i < layers.length - 1; i++) {
        overriddenBy.push(layers[i].source);
      }
    }

    return {
      entryId,
      entry: effectiveEntry,
      effectiveSource,
      layers,
      conflicts,
      overriddenBy: overriddenBy.length > 0 ? overriddenBy : undefined,
    };
  }

  /**
   * Resolve all entries matching a filter across all layers
   * Groups by entryId and merges each group
   *
   * @param filter - Optional filter to apply to entries
   * @param projectId - Optional project ID to filter project-level entries
   * @returns Array of resolved behaviors
   */
  async resolveAll(
    filter?: RegistryFilter,
    projectId?: string
  ): Promise<ResolvedBehavior[]> {
    const allEntries = await this.storage.listEntries(filter);

    // Group entries by ID
    const entriesById = new Map<RegistryEntryId, RegistryEntry[]>();

    for (const entry of allEntries) {
      // Filter project entries if projectId specified
      if (entry.source.type === 'project') {
        if (!projectId) continue;
        if (entry.source.projectId !== (projectId as ProjectId)) continue;
      }

      const existing = entriesById.get(entry.id) || [];
      existing.push(entry);
      entriesById.set(entry.id, existing);
    }

    // Resolve each group
    const results: ResolvedBehavior[] = [];

    for (const [entryId, entries] of entriesById) {
      // Sort by layer priority
      entries.sort(
        (a, b) => this.layerPriority(a.source) - this.layerPriority(b.source)
      );

      // Build resolved behavior
      const layers: Array<{ source: LayerSource; entry: RegistryEntry }> = [];
      const conflicts: string[] = [];

      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        layers.push({ source: entry.source, entry });

        if (i > 0) {
          const prevEntry = entries[i - 1];
          conflicts.push(
            `${entry.source.type} layer overrides ${prevEntry.source.type} layer`
          );
        }
      }

      const effectiveEntry = entries[entries.length - 1];
      const overriddenBy: LayerSource[] = layers
        .slice(0, -1)
        .map((l) => l.source);

      results.push({
        entryId,
        entry: effectiveEntry,
        effectiveSource: effectiveEntry.source,
        layers,
        conflicts,
        overriddenBy: overriddenBy.length > 0 ? overriddenBy : undefined,
      });
    }

    return results;
  }

  /**
   * Detect conflicts for a specific entry across all layers
   * Returns list of conflicts with severity and resolution information
   *
   * @param entryId - The registry entry ID to check for conflicts
   * @returns Array of conflicts found
   */
  async detectConflicts(
    entryId: RegistryEntryId
  ): Promise<RegistryConflictWithSeverity[]> {
    const allEntries = await this.storage.listEntries();

    // Find all entries with matching ID
    const matchingEntries = allEntries.filter((e) => e.id === entryId);

    if (matchingEntries.length <= 1) {
      return []; // No conflicts if 0 or 1 entry
    }

    // Sort by priority (highest first for resolution determination)
    matchingEntries.sort(
      (a, b) => this.layerPriority(b.source) - this.layerPriority(a.source)
    );

    const winner = matchingEntries[0];
    const conflicts: RegistryConflictWithSeverity[] = [];

    // Check for pack-pack conflicts (same priority level)
    const packEntries = matchingEntries.filter((e) => e.source.type === 'pack');
    if (packEntries.length > 1) {
      conflicts.push({
        entryId,
        entryName: winner.name,
        sources: packEntries.map((e) => e.source),
        resolution: packEntries[0].source, // First pack (by install order) wins
        reason: 'Multiple packs define the same entry; last-installed wins',
        severity: 'warning',
      });
    }

    // Check for cross-layer conflicts
    const layerTypes = new Set(matchingEntries.map((e) => e.source.type));
    if (layerTypes.size > 1) {
      conflicts.push({
        entryId,
        entryName: winner.name,
        sources: matchingEntries.map((e) => e.source),
        resolution: winner.source,
        reason: `${winner.source.type} layer has highest priority`,
        severity: 'info', // Normal precedence is informational
      });
    }

    return conflicts;
  }

  /**
   * Get the effective (final merged) entry after layer resolution
   * Shorthand for resolve().entry
   *
   * @param entryId - The registry entry ID to get
   * @param projectId - Optional project ID for project-level resolution
   * @returns The effective entry or undefined if not found
   */
  async getEffectiveValue(
    entryId: RegistryEntryId,
    projectId?: string
  ): Promise<RegistryEntry | undefined> {
    const resolved = await this.resolve(entryId, projectId);
    return resolved?.entry;
  }

  // ============================================================================
  // Legacy/Compatibility Methods (from original implementation)
  // ============================================================================

  /**
   * Resolve all behaviors for a project (legacy API)
   * Returns entries with provenance tracking
   */
  async resolveForProject(projectId: ProjectId): Promise<ResolvedBehavior[]> {
    return this.resolveAll(undefined, projectId as string);
  }

  /**
   * Resolve only button definitions for a project
   */
  async resolveButtons(projectId: ProjectId): Promise<ButtonDefinition[]> {
    const resolved = await this.resolveAll({ type: 'button' }, projectId as string);
    return resolved
      .filter(
        (r) =>
          r.entry.type === 'button' && r.entry.data.type === 'button'
      )
      .map(
        (r) =>
          (r.entry.data as { type: 'button'; definition: ButtonDefinition })
            .definition
      );
  }

  /**
   * Resolve only pattern definitions for a project
   */
  async resolvePatterns(projectId: ProjectId): Promise<PatternAction[]> {
    const resolved = await this.resolveAll({ type: 'pattern' }, projectId as string);
    return resolved
      .filter(
        (r) =>
          r.entry.type === 'pattern' && r.entry.data.type === 'pattern'
      )
      .map(
        (r) =>
          (r.entry.data as { type: 'pattern'; definition: PatternAction })
            .definition
      );
  }

  /**
   * Get all detected conflicts for a project (legacy API)
   */
  async getConflicts(projectId: ProjectId): Promise<RegistryConflict[]> {
    const allEntries = await this.storage.listEntries();
    const conflicts: RegistryConflict[] = [];
    const entriesById = new Map<string, RegistryEntry[]>();

    // Group entries by ID
    for (const entry of allEntries) {
      if (
        entry.source.type === 'project' &&
        entry.source.projectId !== projectId
      ) {
        continue;
      }

      const existing = entriesById.get(entry.id) || [];
      existing.push(entry);
      entriesById.set(entry.id, existing);
    }

    // Find conflicts (entries with same ID from different sources)
    for (const [_id, entries] of entriesById) {
      if (entries.length > 1) {
        // Sort by priority, highest wins
        entries.sort(
          (a, b) => this.layerPriority(b.source) - this.layerPriority(a.source)
        );
        const winner = entries[0];

        conflicts.push({
          entryId: winner.id,
          entryName: winner.name,
          sources: entries.map((e) => e.source),
          resolution: winner.source,
          reason: `${winner.source.type} layer has highest priority`,
        });
      }
    }

    return conflicts;
  }

  /**
   * Check if an entry is overridden by a higher layer
   */
  async isOverridden(
    entryId: RegistryEntryId,
    projectId: ProjectId
  ): Promise<boolean> {
    const conflicts = await this.getConflicts(projectId);
    const conflict = conflicts.find((c) => c.entryId === entryId);
    if (!conflict) return false;

    // Check if this entry is NOT the winner
    const entry = await this.storage.getEntry(entryId);
    if (!entry) return false;

    return !this.sourcesEqual(conflict.resolution, entry.source);
  }
}

/**
 * Create layer resolver instance
 */
export function createLayerResolver(storage?: RegistryStorage): LayerResolver {
  return new LayerResolver(storage);
}

// Singleton instance
export const layerResolver = new LayerResolver();
