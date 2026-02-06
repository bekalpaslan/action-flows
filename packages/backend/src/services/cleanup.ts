import { filePersistence } from '../storage/file-persistence'

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
}

// Singleton instance
export const cleanupService = new CleanupService()
