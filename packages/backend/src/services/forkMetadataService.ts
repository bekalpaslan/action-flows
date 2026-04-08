/**
 * ForkMetadataService — manages fork metadata lifecycle (create/list/merge/discard).
 *
 * Stores fork metadata via Storage key-value interface for persistence across
 * server restarts. Fork IDs are globally unique UUIDs.
 *
 * Does NOT handle Agent SDK session forking — that's done by the route layer
 * calling sessionManager.forkSession() separately. This service only manages metadata.
 *
 * Per RESEARCH.md Pattern 5: Fork Metadata as Separate Entity.
 */
import { randomUUID } from 'crypto';
import type { ForkMetadata, ForkId, MergeResolution } from '@afw/shared';
import type { Storage } from '../storage/index.js';

/** Storage key prefix for fork metadata */
const FORK_KEY_PREFIX = 'fork:';

/** Storage key prefix for fork reverse index (forkId -> storage key) */
const FORK_INDEX_PREFIX = 'forkIndex:';

export class ForkMetadataService {
  constructor(private storage: Storage) {}

  /**
   * Create fork metadata for a new fork.
   * D-14: description is required — throws if empty.
   */
  async createFork(opts: {
    parentSessionId: string;
    forkSessionId: string;
    workbenchId: string;
    description: string;
    forkPointMessageId?: string;
  }): Promise<ForkMetadata> {
    if (!opts.description || opts.description.trim().length === 0) {
      throw new Error('Fork description is required.');
    }

    const id = randomUUID() as ForkId;
    const storageKey = `${FORK_KEY_PREFIX}${opts.parentSessionId}:${id}`;

    const metadata: ForkMetadata = {
      id,
      parentSessionId: opts.parentSessionId,
      forkSessionId: opts.forkSessionId,
      workbenchId: opts.workbenchId,
      description: opts.description.trim(),
      createdAt: new Date().toISOString(),
      status: 'active',
      forkPointMessageId: opts.forkPointMessageId,
    };

    await Promise.resolve(this.storage.set!(storageKey, JSON.stringify(metadata)));
    await Promise.resolve(this.storage.set!(`${FORK_INDEX_PREFIX}${id}`, storageKey));

    console.log(`[ForkMetadataService] Created fork ${id} for parent ${opts.parentSessionId}`);
    return metadata;
  }

  /**
   * List all non-abandoned forks for a parent session, sorted by createdAt ascending.
   */
  async listForks(parentSessionId: string): Promise<ForkMetadata[]> {
    const pattern = `${FORK_KEY_PREFIX}${parentSessionId}:*`;
    const keys = await Promise.resolve(this.storage.keys!(pattern));
    const results: ForkMetadata[] = [];

    for (const key of keys) {
      const raw = await Promise.resolve(this.storage.get!(key));
      if (raw) {
        try {
          const metadata = JSON.parse(raw) as ForkMetadata;
          if (metadata.status !== 'abandoned') {
            results.push(metadata);
          }
        } catch {
          console.warn(`[ForkMetadataService] Failed to parse fork from key ${key}`);
        }
      }
    }

    results.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    return results;
  }

  /**
   * Get a fork by its globally unique ForkId.
   * Uses reverse index for O(1) lookup.
   */
  async getFork(forkId: ForkId): Promise<ForkMetadata | null> {
    const storageKey = this.storage.get
      ? await Promise.resolve(this.storage.get(`${FORK_INDEX_PREFIX}${forkId}`))
      : null;
    if (!storageKey) return null;

    const raw = await Promise.resolve(this.storage.get!(storageKey));
    return raw ? JSON.parse(raw) as ForkMetadata : null;
  }

  /**
   * Update fork description.
   * D-14: description cannot be empty.
   */
  async updateForkDescription(forkId: ForkId, description: string): Promise<ForkMetadata | null> {
    if (!description || description.trim().length === 0) {
      throw new Error('Fork description is required.');
    }

    const metadata = await this.getFork(forkId);
    if (!metadata) return null;

    metadata.description = description.trim();

    const storageKey = await Promise.resolve(this.storage.get!(`${FORK_INDEX_PREFIX}${forkId}`));
    if (storageKey) {
      await Promise.resolve(this.storage.set!(storageKey, JSON.stringify(metadata)));
    }
    return metadata;
  }

  /**
   * Merge a fork back to its parent.
   * D-13: v1 implementation with three resolution strategies.
   *
   * Resolution handling:
   * - 'theirs': Mark fork as merged; conceptually parent adopts fork's session content
   * - 'parent': Keep parent unchanged, mark fork as merged (discard fork changes)
   * - 'manual': Same as 'parent' but with annotation (v1 simplification per RESEARCH.md Open Question 3)
   */
  async mergeFork(
    forkId: ForkId,
    resolution: MergeResolution,
    manualContent?: string,
  ): Promise<ForkMetadata | null> {
    const metadata = await this.getFork(forkId);
    if (!metadata) return null;

    if (metadata.status !== 'active') {
      throw new Error(`Cannot merge fork with status '${metadata.status}'. Only active forks can be merged.`);
    }

    // Apply resolution strategy
    switch (resolution) {
      case 'theirs':
        // Mark fork as merged; parent session now conceptually points to fork content
        console.log(`[ForkMetadataService] Merge (theirs): fork ${forkId} content replaces parent`);
        break;
      case 'parent':
        // Keep parent unchanged, discard fork changes
        console.log(`[ForkMetadataService] Merge (parent): fork ${forkId} changes discarded`);
        break;
      case 'manual':
        // Same as parent but with annotation
        console.log(`[ForkMetadataService] Merge (manual): fork ${forkId} manual resolution`);
        if (manualContent) {
          (metadata as ForkMetadata & { mergeNote?: string }).mergeNote = manualContent;
        }
        break;
    }

    metadata.status = 'merged';
    (metadata as ForkMetadata & { resolvedAt?: string }).resolvedAt = new Date().toISOString();

    const storageKey = await Promise.resolve(this.storage.get!(`${FORK_INDEX_PREFIX}${forkId}`));
    if (storageKey) {
      await Promise.resolve(this.storage.set!(storageKey, JSON.stringify(metadata)));
    }

    return metadata;
  }

  /**
   * Discard a fork by marking it as abandoned.
   */
  async discardFork(forkId: ForkId): Promise<boolean> {
    const metadata = await this.getFork(forkId);
    if (!metadata) return false;

    metadata.status = 'abandoned';

    const storageKey = await Promise.resolve(this.storage.get!(`${FORK_INDEX_PREFIX}${forkId}`));
    if (storageKey) {
      await Promise.resolve(this.storage.set!(storageKey, JSON.stringify(metadata)));
    }

    console.log(`[ForkMetadataService] Discarded fork ${forkId}`);
    return true;
  }
}
