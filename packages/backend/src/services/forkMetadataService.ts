/**
 * ForkMetadataService — manages fork metadata lifecycle (create/list/merge/discard).
 *
 * Stores fork metadata in an internal Map (fork IDs are globally unique UUIDs).
 * Does NOT handle Agent SDK session forking — that's done by the route layer
 * calling sessionManager.forkSession() separately. This service only manages metadata.
 *
 * Per RESEARCH.md Pattern 5: Fork Metadata as Separate Entity.
 */
import { randomUUID } from 'crypto';
import type { ForkMetadata, ForkId, MergeResolution } from '@afw/shared';

export class ForkMetadataService {
  /**
   * In-memory storage for fork metadata.
   * Key format: `fork:${parentSessionId}:${forkId}`
   * Reverse index: `forkIndex:${forkId}` -> storage key for O(1) lookup.
   */
  private forkStore = new Map<string, ForkMetadata>();
  private forkIndex = new Map<string, string>();

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
    const storageKey = `fork:${opts.parentSessionId}:${id}`;

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

    this.forkStore.set(storageKey, metadata);
    this.forkIndex.set(id, storageKey);

    console.log(`[ForkMetadataService] Created fork ${id} for parent ${opts.parentSessionId}`);
    return metadata;
  }

  /**
   * List all non-abandoned forks for a parent session, sorted by createdAt ascending.
   */
  async listForks(parentSessionId: string): Promise<ForkMetadata[]> {
    const prefix = `fork:${parentSessionId}:`;
    const results: ForkMetadata[] = [];

    for (const [key, metadata] of this.forkStore) {
      if (key.startsWith(prefix) && metadata.status !== 'abandoned') {
        results.push(metadata);
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
    const storageKey = this.forkIndex.get(forkId);
    if (!storageKey) return null;
    return this.forkStore.get(storageKey) ?? null;
  }

  /**
   * Update fork description.
   * D-14: description cannot be empty.
   */
  async updateForkDescription(forkId: ForkId, description: string): Promise<ForkMetadata | null> {
    if (!description || description.trim().length === 0) {
      throw new Error('Fork description is required.');
    }

    const storageKey = this.forkIndex.get(forkId);
    if (!storageKey) return null;

    const metadata = this.forkStore.get(storageKey);
    if (!metadata) return null;

    metadata.description = description.trim();
    this.forkStore.set(storageKey, metadata);
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
    const storageKey = this.forkIndex.get(forkId);
    if (!storageKey) return null;

    const metadata = this.forkStore.get(storageKey);
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
    this.forkStore.set(storageKey, metadata);

    return metadata;
  }

  /**
   * Discard a fork by marking it as abandoned.
   */
  async discardFork(forkId: ForkId): Promise<boolean> {
    const storageKey = this.forkIndex.get(forkId);
    if (!storageKey) return false;

    const metadata = this.forkStore.get(storageKey);
    if (!metadata) return false;

    metadata.status = 'abandoned';
    this.forkStore.set(storageKey, metadata);

    console.log(`[ForkMetadataService] Discarded fork ${forkId}`);
    return true;
  }
}
