/**
 * Registry Storage Service
 * File-based registry storage with memory caching.
 * Implements SRD Section 4.2: Registry Storage
 *
 * Storage locations:
 * - Core entries: data/registry/core.json (shipped with dashboard)
 * - Pack entries: data/registry/packs/{packId}.json
 * - Project overrides: data/registry/projects/{projectId}.json
 *
 * On startup: Load all JSON files into memory map.
 * On mutation: Write to file + update memory cache.
 * On query: Memory-first, file-fallback.
 */

import type {
  RegistryEntry,
  RegistryEntryId,
  BehaviorPack,
  BehaviorPackId,
  RegistryFilter,
  LayerSource,
  Timestamp,
  RegistryChangedEvent,
} from '@afw/shared';
import fs from 'fs/promises';
import path from 'path';

/** Callback type for broadcasting registry change events */
type RegistryEventBroadcaster = (event: RegistryChangedEvent) => void;

/**
 * Create a branded Timestamp from the current date
 */
function currentTimestamp(): Timestamp {
  return new Date().toISOString() as Timestamp;
}

const REGISTRY_BASE_PATH = 'data/registry';

/**
 * File-based registry storage with memory caching.
 */
export class RegistryStorage {
  private entries: Map<RegistryEntryId, RegistryEntry> = new Map();
  private packs: Map<BehaviorPackId, BehaviorPack> = new Map();
  private initialized = false;
  private basePath: string;
  private writeMutex: Promise<void> = Promise.resolve();
  private broadcastEvent: RegistryEventBroadcaster | null = null;

  constructor(basePath: string = REGISTRY_BASE_PATH) {
    this.basePath = basePath;
  }

  /**
   * Set the broadcast function for emitting RegistryChangedEvent
   * Called from index.ts after server initialization
   */
  setBroadcastFunction(broadcaster: RegistryEventBroadcaster): void {
    this.broadcastEvent = broadcaster;
    console.log('[RegistryStorage] Event broadcasting enabled');
  }

  /**
   * Emit a registry change event if broadcaster is configured
   */
  private emitEvent(
    entryId: RegistryEntryId,
    changeType: RegistryChangedEvent['changeType'],
    source: LayerSource,
    previousValue?: RegistryEntry,
    newValue?: RegistryEntry
  ): void {
    if (!this.broadcastEvent) return;

    const event: RegistryChangedEvent = {
      type: 'registry:changed',
      timestamp: currentTimestamp(),
      entryId,
      changeType,
      source,
      previousValue,
      newValue,
    };

    this.broadcastEvent(event);
    console.log(`[RegistryStorage] Emitted ${changeType} event for ${entryId}`);
  }

  /**
   * Initialize storage by loading all registry files
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    await this.ensureDirectories();
    await this.loadCoreEntries();
    await this.loadPackEntries();

    // Initialize core defaults if no entries exist
    if (this.entries.size === 0) {
      await this.initializeCoreDefaults();
    }

    this.initialized = true;
    console.log('[RegistryStorage] Initialized with stats:', this.getStats());
  }

  /**
   * Initialize core default entries when storage is empty
   * Creates essential buttons, patterns, and workflows for the dashboard
   */
  private async initializeCoreDefaults(): Promise<void> {
    console.log('[RegistryStorage] Initializing core defaults...');

    const now = currentTimestamp();
    const coreSource: LayerSource = { type: 'core' };

    // Core default button entries
    const coreEntries: RegistryEntry[] = [
      {
        id: 'core-btn-pause' as RegistryEntryId,
        name: 'Pause Execution',
        description: 'Pause the current chain execution',
        type: 'button',
        source: coreSource,
        version: '1.0.0',
        status: 'active',
        enabled: true,
        data: {
          type: 'button',
          definition: {
            id: 'btn-pause' as import('@afw/shared').ButtonId,
            label: 'Pause',
            icon: '⏸️',
            action: { type: 'command', commandType: 'pause' },
            contexts: ['general'],
            source: coreSource,
            priority: 10,
            enabled: true,
          },
        },
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'core-btn-resume' as RegistryEntryId,
        name: 'Resume Execution',
        description: 'Resume a paused chain execution',
        type: 'button',
        source: coreSource,
        version: '1.0.0',
        status: 'active',
        enabled: true,
        data: {
          type: 'button',
          definition: {
            id: 'btn-resume' as import('@afw/shared').ButtonId,
            label: 'Resume',
            icon: '▶️',
            action: { type: 'command', commandType: 'resume' },
            contexts: ['general'],
            source: coreSource,
            priority: 11,
            enabled: true,
          },
        },
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'core-btn-cancel' as RegistryEntryId,
        name: 'Cancel Execution',
        description: 'Cancel the current chain execution',
        type: 'button',
        source: coreSource,
        version: '1.0.0',
        status: 'active',
        enabled: true,
        data: {
          type: 'button',
          definition: {
            id: 'btn-cancel' as import('@afw/shared').ButtonId,
            label: 'Cancel',
            icon: '⛔',
            action: { type: 'command', commandType: 'cancel' },
            contexts: ['general'],
            source: coreSource,
            priority: 12,
            enabled: true,
          },
        },
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'core-btn-retry' as RegistryEntryId,
        name: 'Retry Step',
        description: 'Retry the last failed step',
        type: 'button',
        source: coreSource,
        version: '1.0.0',
        status: 'active',
        enabled: true,
        data: {
          type: 'button',
          definition: {
            id: 'btn-retry' as import('@afw/shared').ButtonId,
            label: 'Retry',
            icon: '🔄',
            action: { type: 'command', commandType: 'retry' },
            contexts: ['error-message'],
            source: coreSource,
            priority: 20,
            enabled: true,
          },
        },
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'core-btn-skip' as RegistryEntryId,
        name: 'Skip Step',
        description: 'Skip the current step and continue to next',
        type: 'button',
        source: coreSource,
        version: '1.0.0',
        status: 'active',
        enabled: true,
        data: {
          type: 'button',
          definition: {
            id: 'btn-skip' as import('@afw/shared').ButtonId,
            label: 'Skip',
            icon: '⏭️',
            action: { type: 'command', commandType: 'skip' },
            contexts: ['error-message', 'question-prompt'],
            source: coreSource,
            priority: 21,
            enabled: true,
          },
        },
        createdAt: now,
        updatedAt: now,
      },
    ];

    // Add all core entries to storage
    for (const entry of coreEntries) {
      this.entries.set(entry.id, entry);
    }

    // Persist core entries to disk
    await this.persistEntries();
    console.log(`[RegistryStorage] Initialized ${coreEntries.length} core default entries`);
  }

  /**
   * Ensure all required directories exist
   */
  private async ensureDirectories(): Promise<void> {
    try {
      await fs.mkdir(path.join(this.basePath, 'packs'), { recursive: true });
      await fs.mkdir(path.join(this.basePath, 'projects'), { recursive: true });
    } catch (error) {
      console.error('[RegistryStorage] Error creating directories:', error);
      throw error;
    }
  }

  /**
   * Load core entries from core.json
   */
  private async loadCoreEntries(): Promise<void> {
    try {
      const corePath = path.join(this.basePath, 'core.json');
      const data = await fs.readFile(corePath, 'utf-8');
      const entries = JSON.parse(data) as RegistryEntry[];
      let count = 0;
      for (const entry of entries) {
        this.entries.set(entry.id, entry);
        count++;
      }
      console.log(`[RegistryStorage] Loaded ${count} core entries`);
    } catch (error) {
      // Core file might not exist yet - that's OK
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        console.log('[RegistryStorage] No core.json found, starting fresh');
      } else {
        console.error('[RegistryStorage] Error loading core entries:', error);
      }
    }
  }

  /**
   * Load all behavior pack entries from packs/ directory
   */
  private async loadPackEntries(): Promise<void> {
    try {
      const packsDir = path.join(this.basePath, 'packs');
      const files = await fs.readdir(packsDir);

      let packCount = 0;
      let entryCount = 0;

      for (const file of files) {
        if (file.endsWith('.json')) {
          try {
            const data = await fs.readFile(path.join(packsDir, file), 'utf-8');
            const pack = JSON.parse(data) as BehaviorPack;
            this.packs.set(pack.id, pack);

            for (const entry of pack.entries) {
              this.entries.set(entry.id, entry);
              entryCount++;
            }
            packCount++;
          } catch (error) {
            console.error(`[RegistryStorage] Error loading pack file ${file}:`, error);
          }
        }
      }

      if (packCount > 0 || entryCount > 0) {
        console.log(
          `[RegistryStorage] Loaded ${packCount} packs with ${entryCount} entries`
        );
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        console.log('[RegistryStorage] No packs directory, starting fresh');
      } else {
        console.error('[RegistryStorage] Error loading pack entries:', error);
      }
    }
  }

  // ============================================================================
  // CRUD Operations
  // ============================================================================

  /**
   * Get a single registry entry by ID
   */
  async getEntry(id: RegistryEntryId): Promise<RegistryEntry | undefined> {
    return this.entries.get(id);
  }

  /**
   * List all registry entries, optionally filtered
   */
  async listEntries(filter?: RegistryFilter): Promise<RegistryEntry[]> {
    let results = Array.from(this.entries.values());

    if (filter?.type) {
      results = results.filter((e) => e.type === filter.type);
    }
    if (filter?.sourceType) {
      results = results.filter((e) => e.source.type === filter.sourceType);
    }
    if (filter?.source) {
      results = results.filter((e) => e.source.type === filter.source);
    }
    if (filter?.status) {
      results = results.filter((e) => e.status === filter.status);
    }
    if (filter?.enabled !== undefined) {
      results = results.filter((e) => e.enabled === filter.enabled);
    }
    if (filter?.packId) {
      results = results.filter(
        (e) => e.source.type === 'pack' && e.source.packId === filter.packId
      );
    }
    if (filter?.search) {
      const search = filter.search.toLowerCase();
      results = results.filter(
        (e) =>
          e.name.toLowerCase().includes(search) ||
          e.description.toLowerCase().includes(search)
      );
    }

    return results;
  }

  /**
   * Get all registry entries, optionally filtered (alias for listEntries)
   */
  async getEntries(filter?: RegistryFilter): Promise<RegistryEntry[]> {
    return this.listEntries(filter);
  }

  /**
   * Add a new registry entry
   */
  async addEntry(entry: RegistryEntry): Promise<void> {
    if (this.entries.has(entry.id)) {
      throw new Error(`Entry already exists: ${entry.id}`);
    }

    this.entries.set(entry.id, entry);
    await this.persistEntries();
    this.emitEvent(entry.id, 'added', entry.source, undefined, entry);
  }

  /**
   * Update an existing registry entry
   */
  async updateEntry(
    id: RegistryEntryId,
    updates: Partial<RegistryEntry>
  ): Promise<void> {
    const existing = this.entries.get(id);
    if (!existing) throw new Error(`Entry not found: ${id}`);

    const now = currentTimestamp();
    const updated = { ...existing, ...updates, updatedAt: now };
    this.entries.set(id, updated as RegistryEntry);
    await this.persistEntries();

    // Determine change type based on enabled field changes
    let changeType: RegistryChangedEvent['changeType'] = 'updated';
    if ('enabled' in updates) {
      changeType = updates.enabled ? 'enabled' : 'disabled';
    }
    this.emitEvent(id, changeType, updated.source, existing, updated as RegistryEntry);
  }

  /**
   * Remove a registry entry
   */
  async removeEntry(id: RegistryEntryId): Promise<void> {
    const existing = this.entries.get(id);
    this.entries.delete(id);
    await this.persistEntries();
    if (existing) {
      this.emitEvent(id, 'removed', existing.source, existing, undefined);
    }
  }

  // ============================================================================
  // Pack Operations
  // ============================================================================

  /**
   * Install a behavior pack (registers all its entries)
   */
  async installPack(pack: BehaviorPack): Promise<void> {
    if (this.packs.has(pack.id)) {
      throw new Error(`Pack already installed: ${pack.id}`);
    }

    this.packs.set(pack.id, pack);
    for (const entry of pack.entries) {
      if (this.entries.has(entry.id)) {
        throw new Error(`Entry conflict during pack installation: ${entry.id}`);
      }
      this.entries.set(entry.id, entry);
    }
    await this.persistPack(pack);
  }

  /**
   * Uninstall a behavior pack (removes all its entries)
   */
  async uninstallPack(packId: BehaviorPackId): Promise<void> {
    const pack = this.packs.get(packId);
    if (!pack) return;

    for (const entry of pack.entries) {
      this.entries.delete(entry.id);
    }
    this.packs.delete(packId);

    // Delete pack file
    const packPath = path.join(this.basePath, 'packs', `${packId}.json`);
    try {
      await fs.unlink(packPath);
      console.log(`[RegistryStorage] Uninstalled pack: ${packId}`);
    } catch (error) {
      // File might not exist
      console.warn(`[RegistryStorage] Could not delete pack file: ${packId}`, error);
    }
  }

  /**
   * Get all installed behavior packs
   */
  async getInstalledPacks(): Promise<BehaviorPack[]> {
    return Array.from(this.packs.values());
  }

  /**
   * Get a specific behavior pack by ID
   */
  async getPack(packId: BehaviorPackId): Promise<BehaviorPack | undefined> {
    return this.packs.get(packId);
  }

  /**
   * Enable a behavior pack and all its entries
   */
  async enablePack(packId: BehaviorPackId): Promise<void> {
    const pack = this.packs.get(packId);
    if (!pack) {
      throw new Error(`Pack not found: ${packId}`);
    }

    // Enable the pack
    pack.enabled = true;
    this.packs.set(packId, pack);

    // Enable all entries from this pack
    const now = currentTimestamp();
    for (const entry of pack.entries) {
      const existing = this.entries.get(entry.id);
      if (existing) {
        const updated = { ...existing, enabled: true, updatedAt: now };
        this.entries.set(entry.id, updated as RegistryEntry);
      }
    }

    await this.persistPack(pack);
    console.log(`[RegistryStorage] Enabled pack: ${packId} (${pack.entries.length} entries)`);
  }

  /**
   * Disable a behavior pack and all its entries
   */
  async disablePack(packId: BehaviorPackId): Promise<void> {
    const pack = this.packs.get(packId);
    if (!pack) {
      throw new Error(`Pack not found: ${packId}`);
    }

    // Disable the pack
    pack.enabled = false;
    this.packs.set(packId, pack);

    // Disable all entries from this pack
    const now = currentTimestamp();
    for (const entry of pack.entries) {
      const existing = this.entries.get(entry.id);
      if (existing) {
        const updated = { ...existing, enabled: false, updatedAt: now };
        this.entries.set(entry.id, updated as RegistryEntry);
      }
    }

    await this.persistPack(pack);
    console.log(`[RegistryStorage] Disabled pack: ${packId} (${pack.entries.length} entries)`);
  }

  // ============================================================================
  // Persistence (Internal)
  // ============================================================================

  /**
   * Persist all core entries to core.json
   */
  private async persistEntries(): Promise<void> {
    this.writeMutex = this.writeMutex.then(async () => {
      try {
        const coreEntries = Array.from(this.entries.values()).filter(
          (e) => e.source.type === 'core'
        );

        const corePath = path.join(this.basePath, 'core.json');
        const tempPath = `${corePath}.tmp`;

        // Ensure directory exists
        await fs.mkdir(path.dirname(corePath), { recursive: true });

        // Atomic write: write to temp file, then rename
        await fs.writeFile(tempPath, JSON.stringify(coreEntries, null, 2), 'utf-8');
        await fs.rename(tempPath, corePath);

        console.log(`[RegistryStorage] Persisted ${coreEntries.length} core entries`);
      } catch (error) {
        console.error('[RegistryStorage] Error persisting entries:', error);
        throw error;
      }
    });

    return this.writeMutex;
  }

  /**
   * Persist a behavior pack to packs/{packId}.json
   */
  private async persistPack(pack: BehaviorPack): Promise<void> {
    this.writeMutex = this.writeMutex.then(async () => {
      try {
        const packPath = path.join(this.basePath, 'packs', `${pack.id}.json`);
        const tempPath = `${packPath}.tmp`;

        // Ensure directory exists
        await fs.mkdir(path.dirname(packPath), { recursive: true });

        // Atomic write: write to temp file, then rename
        await fs.writeFile(tempPath, JSON.stringify(pack, null, 2), 'utf-8');
        await fs.rename(tempPath, packPath);

        console.log(`[RegistryStorage] Persisted pack: ${pack.id}`);
      } catch (error) {
        console.error('[RegistryStorage] Error persisting pack:', error);
        throw error;
      }
    });

    return this.writeMutex;
  }

  // ============================================================================
  // Utilities
  // ============================================================================

  /**
   * Get statistics about the registry
   */
  getStats(): {
    totalEntries: number;
    totalPacks: number;
    byType: Record<string, number>;
    bySource: Record<string, number>;
  } {
    const byType: Record<string, number> = {};
    const bySource: Record<string, number> = {};

    for (const entry of this.entries.values()) {
      byType[entry.type] = (byType[entry.type] || 0) + 1;

      const sourceKey =
        entry.source.type === 'pack'
          ? `pack:${entry.source.packId}`
          : entry.source.type === 'project'
            ? `project:${entry.source.projectId}`
            : 'core';
      bySource[sourceKey] = (bySource[sourceKey] || 0) + 1;
    }

    return {
      totalEntries: this.entries.size,
      totalPacks: this.packs.size,
      byType,
      bySource,
    };
  }

  /**
   * Check if storage is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}

// Singleton instance
export const registryStorage = new RegistryStorage();
