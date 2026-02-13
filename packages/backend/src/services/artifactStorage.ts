import type { Artifact, ArtifactId, StoredArtifact, ArtifactStatus } from '@afw/shared';
import { toArtifactId } from '@afw/shared';
import { randomBytes } from 'crypto';

/**
 * In-memory artifact storage service
 *
 * Manages lifecycle of agent-generated artifacts with metadata tracking.
 * Thread 4: Live Canvas — Phase 2 backend implementation
 */
class ArtifactStorage {
  private artifacts: Map<string, StoredArtifact> = new Map();

  /**
   * Store a new artifact, returns assigned ID
   */
  create(artifact: Omit<Artifact, 'id'>): StoredArtifact {
    const id = toArtifactId(`art_${randomBytes(16).toString('hex')}`);
    const now = new Date().toISOString();

    const storedArtifact: StoredArtifact = {
      ...artifact,
      id,
      status: 'active',
      renderCount: 0,
      createdAt: artifact.createdAt || now,
      updatedAt: artifact.updatedAt || now,
    };

    this.artifacts.set(id, storedArtifact);
    return storedArtifact;
  }

  /**
   * Get artifact by ID
   */
  get(id: ArtifactId): StoredArtifact | undefined {
    return this.artifacts.get(id);
  }

  /**
   * Update artifact data (for live bindings)
   */
  updateData(id: ArtifactId, data: Record<string, unknown>): StoredArtifact | undefined {
    const artifact = this.artifacts.get(id);
    if (!artifact) {
      return undefined;
    }

    const updated: StoredArtifact = {
      ...artifact,
      data: { ...artifact.data, ...data },
      updatedAt: new Date().toISOString(),
    };

    this.artifacts.set(id, updated);
    return updated;
  }

  /**
   * List artifacts for a session
   */
  listBySession(sessionId: string): StoredArtifact[] {
    return Array.from(this.artifacts.values())
      .filter(a => a.sessionId === sessionId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * List artifacts for a chain
   */
  listByChain(sessionId: string, chainId: string): StoredArtifact[] {
    return Array.from(this.artifacts.values())
      .filter(a => a.sessionId === sessionId && a.chainId === chainId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Archive an artifact
   */
  archive(id: ArtifactId): void {
    const artifact = this.artifacts.get(id);
    if (artifact) {
      artifact.status = 'archived';
      artifact.updatedAt = new Date().toISOString();
    }
  }

  /**
   * Delete all artifacts for a session
   */
  deleteBySession(sessionId: string): number {
    const toDelete = Array.from(this.artifacts.values())
      .filter(a => a.sessionId === sessionId)
      .map(a => a.id);

    toDelete.forEach(id => this.artifacts.delete(id));
    return toDelete.length;
  }

  /**
   * Get stats
   */
  getStats(): {
    total: number;
    active: number;
    archived: number;
    byType: Record<string, number>;
  } {
    const all = Array.from(this.artifacts.values());
    const byType: Record<string, number> = {};

    all.forEach(a => {
      byType[a.type] = (byType[a.type] || 0) + 1;
    });

    return {
      total: all.length,
      active: all.filter(a => a.status === 'active').length,
      archived: all.filter(a => a.status === 'archived').length,
      byType,
    };
  }
}

export const artifactStorage = new ArtifactStorage();
