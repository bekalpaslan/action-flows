/**
 * Snapshot Service for MemoryStorage Persistence
 * Serializes MemoryStorage state to disk and restores on startup
 *
 * Features:
 * - Periodic snapshots (default: every 5 minutes)
 * - Snapshot on graceful shutdown
 * - Gzip compression
 * - MD5 checksum validation
 * - Snapshot rotation (keep last N snapshots)
 * - Graceful error handling (failed snapshot never crashes server)
 */

import { promises as fs } from 'fs';
import { createReadStream, createWriteStream } from 'fs';
import path from 'path';
import { promisify } from 'util';
import { gzip, gunzip } from 'zlib';
import { createHash } from 'crypto';
import type { Storage } from '../storage/index.js';
import { telemetry } from './telemetry.js';

const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);

interface SnapshotServiceOptions {
  snapshotDir?: string;
  intervalMs?: number;
  maxSnapshots?: number;
}

export class SnapshotService {
  private snapshotDir: string;
  private intervalMs: number;
  private maxSnapshots: number;
  private intervalId: NodeJS.Timeout | null = null;
  private storage: Storage;

  constructor(storage: Storage, options: SnapshotServiceOptions = {}) {
    this.storage = storage;
    this.snapshotDir = options.snapshotDir || '.actionflows-snapshot';
    this.intervalMs = options.intervalMs || 5 * 60 * 1000; // 5 minutes default
    this.maxSnapshots = options.maxSnapshots || 3;
  }

  /**
   * Start periodic snapshot intervals
   */
  start(): void {
    if (this.intervalId) {
      telemetry.log('warn', 'SnapshotService', 'Snapshot service already running');
      return;
    }

    telemetry.log('info', 'SnapshotService', `Starting snapshot service (interval: ${this.intervalMs}ms, dir: ${this.snapshotDir})`);

    this.intervalId = setInterval(async () => {
      try {
        await this.saveSnapshot();
      } catch (error) {
        telemetry.log('error', 'SnapshotService', 'Periodic snapshot failed', { error: error instanceof Error ? error.message : String(error) });
      }
    }, this.intervalMs);
  }

  /**
   * Stop periodic snapshots
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      telemetry.log('info', 'SnapshotService', 'Snapshot service stopped');
    }
  }

  /**
   * Save a snapshot to disk
   * Returns the filepath of the saved snapshot
   */
  async saveSnapshot(): Promise<string> {
    if (!this.storage.snapshot) {
      throw new Error('Storage does not support snapshots');
    }

    const startTime = Date.now();
    telemetry.log('info', 'SnapshotService', 'Creating snapshot...');

    try {
      // Create snapshot directory if it doesn't exist
      await fs.mkdir(this.snapshotDir, { recursive: true });

      // Get snapshot from storage
      const snapshot = this.storage.snapshot();

      // Serialize and compress
      const serialized = JSON.stringify(snapshot);
      const compressed = await gzipAsync(Buffer.from(serialized, 'utf-8'));

      // Generate filename with ISO timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `snapshot-${timestamp}.json.gz`;
      const filepath = path.join(this.snapshotDir, filename);

      // Write to disk
      await fs.writeFile(filepath, compressed);

      // Rotate old snapshots
      await this.rotateSnapshots();

      const duration = Date.now() - startTime;
      const sizeKb = (compressed.length / 1024).toFixed(2);
      telemetry.log('info', 'SnapshotService', `Snapshot saved successfully`, {
        filepath,
        sizeKb,
        durationMs: duration
      });

      return filepath;
    } catch (error) {
      telemetry.log('error', 'SnapshotService', 'Failed to save snapshot', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Load the latest valid snapshot from disk
   * Returns true if snapshot was loaded successfully, false otherwise
   */
  async loadLatestSnapshot(): Promise<boolean> {
    if (!this.storage.restore) {
      telemetry.log('warn', 'SnapshotService', 'Storage does not support restore');
      return false;
    }

    try {
      // Check if snapshot directory exists
      try {
        await fs.access(this.snapshotDir);
      } catch {
        telemetry.log('info', 'SnapshotService', 'No snapshot directory found, starting fresh');
        return false;
      }

      // List all snapshot files
      const files = await fs.readdir(this.snapshotDir);
      const snapshotFiles = files
        .filter(f => f.startsWith('snapshot-') && f.endsWith('.json.gz'))
        .sort()
        .reverse(); // Newest first

      if (snapshotFiles.length === 0) {
        telemetry.log('info', 'SnapshotService', 'No snapshots found, starting fresh');
        return false;
      }

      // Try to load snapshots in order (newest first)
      for (const filename of snapshotFiles) {
        const filepath = path.join(this.snapshotDir, filename);

        try {
          telemetry.log('info', 'SnapshotService', `Attempting to load snapshot: ${filename}`);

          const snapshot = await this.readSnapshotFile(filepath);

          if (snapshot) {
            this.storage.restore(snapshot);
            telemetry.log('info', 'SnapshotService', `Successfully loaded snapshot: ${filename}`, {
              timestamp: snapshot.timestamp,
              version: snapshot.version
            });
            return true;
          }
        } catch (error) {
          telemetry.log('warn', 'SnapshotService', `Failed to load snapshot ${filename}, trying next`, {
            error: error instanceof Error ? error.message : String(error)
          });
          // Continue to next snapshot
        }
      }

      telemetry.log('warn', 'SnapshotService', 'No valid snapshots could be loaded');
      return false;
    } catch (error) {
      telemetry.log('error', 'SnapshotService', 'Error loading snapshot', {
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }

  /**
   * Read and decompress a snapshot file
   */
  private async readSnapshotFile(filepath: string): Promise<any | null> {
    try {
      const compressed = await fs.readFile(filepath);
      const decompressed = await gunzipAsync(compressed);
      const snapshot = JSON.parse(decompressed.toString('utf-8'));

      // Validate checksum
      const serialized = JSON.stringify(snapshot.data);
      const computedChecksum = createHash('md5').update(serialized).digest('hex');

      if (computedChecksum !== snapshot.checksum) {
        telemetry.log('warn', 'SnapshotService', `Checksum mismatch in ${filepath}`);
        return null;
      }

      return snapshot;
    } catch (error) {
      telemetry.log('error', 'SnapshotService', `Error reading snapshot file ${filepath}`, {
        error: error instanceof Error ? error.message : String(error)
      });
      return null;
    }
  }

  /**
   * Rotate snapshots, keeping only the most recent N files
   */
  private async rotateSnapshots(): Promise<void> {
    try {
      const files = await fs.readdir(this.snapshotDir);
      const snapshotFiles = files
        .filter(f => f.startsWith('snapshot-') && f.endsWith('.json.gz'))
        .sort()
        .reverse(); // Newest first

      // Delete old snapshots beyond maxSnapshots limit
      const filesToDelete = snapshotFiles.slice(this.maxSnapshots);

      for (const filename of filesToDelete) {
        const filepath = path.join(this.snapshotDir, filename);
        await fs.unlink(filepath);
        telemetry.log('info', 'SnapshotService', `Deleted old snapshot: ${filename}`);
      }
    } catch (error) {
      telemetry.log('error', 'SnapshotService', 'Error rotating snapshots', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
}
