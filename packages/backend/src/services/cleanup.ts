import { filePersistence } from '../storage/file-persistence.js';
import { summarizeTrace } from './gateTraceSummarizer.js';
import type { LearningsArchiver } from './learningsArchiver.js';
import type { LedgerEntry } from '@afw/shared';

// Forward type to avoid circular import — actual instance injected via setPruneDeps
interface PruneDeps {
  healthScoreCalculator: { prune(): any[] };
  ledgerService: { appendBatch(entries: LedgerEntry[]): void };
}

/**
 * Daily cleanup job that removes history files older than 7 days
 *
 * Features:
 * - Runs on a daily interval
 * - Removes date folders older than retention period
 * - Logs cleanup statistics
 * - Handles errors gracefully
 */

const CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000 // 24 hours

export class CleanupService {
  private intervalId: NodeJS.Timeout | null = null
  private pruneDeps: PruneDeps | null = null
  private learningsArchiver: LearningsArchiver | null = null

  setPruneDeps(deps: PruneDeps): void {
    this.pruneDeps = deps;
    console.log('[Cleanup] Prune dependencies wired (HealthScoreCalculator + LedgerService)');
  }

  setLearningsArchiver(archiver: LearningsArchiver): void {
    this.learningsArchiver = archiver;
    console.log('[Cleanup] LearningsArchiver wired');
  }

  /**
   * Start the cleanup service
   */
  start(): void {
    if (this.intervalId) {
      console.warn('[Cleanup] Service already running')
      return
    }

    console.log('[Cleanup] Starting cleanup service (runs daily)')

    // Run cleanup immediately on start
    this.runCleanup()

    // Schedule daily cleanup
    this.intervalId = setInterval(() => {
      this.runCleanup()
    }, CLEANUP_INTERVAL_MS)
  }

  /**
   * Stop the cleanup service
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
      console.log('[Cleanup] Cleanup service stopped')
    }
  }

  /**
   * Run cleanup manually
   */
  async runCleanup(): Promise<void> {
    try {
      console.log('[Cleanup] Running cleanup job...')
      const deletedCount = await filePersistence.cleanupOldFiles()

      if (deletedCount > 0) {
        console.log(`[Cleanup] Deleted ${deletedCount} old date folder(s)`)
      } else {
        console.log('[Cleanup] No old files to delete')
      }

      await this.pruneGateTraces();

      await this.archiveLearnings();

      // Log storage stats after cleanup
      const stats = await filePersistence.getStats()
      console.log('[Cleanup] Storage stats:', {
        totalDates: stats.totalDates,
        totalSessions: stats.totalSessions,
        dateRange: `${stats.oldestDate} to ${stats.newestDate}`,
      })
    } catch (error) {
      console.error('[Cleanup] Error during cleanup:', error)
    }
  }

  private async archiveLearnings(): Promise<void> {
    if (!this.learningsArchiver) {
      console.log('[Cleanup] archiveLearnings skipped — archiver not wired');
      return;
    }
    try {
      this.learningsArchiver.archiveIfNeeded();
    } catch (err) {
      console.error('[Cleanup] Learnings archive failed:', err);
    }
  }

  private async pruneGateTraces(): Promise<void> {
    if (!this.pruneDeps) {
      console.log('[Cleanup] pruneGateTraces skipped — deps not wired');
      return;
    }
    try {
      const pruned = this.pruneDeps.healthScoreCalculator.prune();
      let skipped = 0;
      const entries: LedgerEntry[] = [];
      for (const trace of pruned) {
        const entry = summarizeTrace(trace);
        if (entry) entries.push(entry);
        else skipped++;
      }
      this.pruneDeps.ledgerService.appendBatch(entries);
      console.log(`[Cleanup] Promoted ${entries.length} traces to ledger (${skipped} skipped malformed)`);
    } catch (err) {
      console.error('[Cleanup] pruneGateTraces failed:', err);
    }
  }
}

// Singleton instance
export const cleanupService = new CleanupService()
