import fs from 'fs/promises'
import path from 'path'
import type { Session, WorkspaceEvent } from '@afw/shared'

/**
 * File-based persistence for session history
 *
 * Features:
 * - Saves session data to JSON files organized by date
 * - Retains history for 7 days
 * - Supports querying sessions by date range
 * - Automatic cleanup of old files
 */

const STORAGE_DIR = path.join(process.cwd(), 'data', 'history')
const RETENTION_DAYS = 7

export interface SessionSnapshot {
  session: Session
  events: WorkspaceEvent[]
  savedAt: string
}

export class FilePersistence {
  private ensureDirectoryExists = async (dirPath: string): Promise<void> => {
    try {
      await fs.mkdir(dirPath, { recursive: true })
    } catch (error: any) {
      if (error.code !== 'EEXIST') {
        throw error
      }
    }
  }

  private getDatePath = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return path.join(STORAGE_DIR, `${year}-${month}-${day}`)
  }

  private getSessionFilePath = (sessionId: string, date: Date): string => {
    const datePath = this.getDatePath(date)
    return path.join(datePath, `${sessionId}.json`)
  }

  /**
   * Save session snapshot to file
   */
  async saveSession(sessionId: string, session: Session, events: WorkspaceEvent[]): Promise<void> {
    const now = new Date()
    const datePath = this.getDatePath(now)

    await this.ensureDirectoryExists(datePath)

    const snapshot: SessionSnapshot = {
      session,
      events,
      savedAt: now.toISOString(),
    }

    const filePath = this.getSessionFilePath(sessionId, now)
    await fs.writeFile(filePath, JSON.stringify(snapshot, null, 2), 'utf-8')
  }

  /**
   * Load session snapshot from file
   */
  async loadSession(sessionId: string, date?: Date): Promise<SessionSnapshot | null> {
    try {
      const targetDate = date || new Date()
      const filePath = this.getSessionFilePath(sessionId, targetDate)
      const content = await fs.readFile(filePath, 'utf-8')
      return JSON.parse(content) as SessionSnapshot
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return null
      }
      throw error
    }
  }

  /**
   * List all sessions for a specific date
   */
  async listSessionsByDate(date: Date): Promise<string[]> {
    try {
      const datePath = this.getDatePath(date)
      const files = await fs.readdir(datePath)
      return files
        .filter((file) => file.endsWith('.json'))
        .map((file) => file.replace('.json', ''))
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return []
      }
      throw error
    }
  }

  /**
   * List all available dates with session history
   */
  async listAvailableDates(): Promise<string[]> {
    try {
      await this.ensureDirectoryExists(STORAGE_DIR)
      const entries = await fs.readdir(STORAGE_DIR, { withFileTypes: true })
      return entries
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort()
        .reverse() // Most recent first
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return []
      }
      throw error
    }
  }

  /**
   * Clean up files older than retention period
   */
  async cleanupOldFiles(): Promise<number> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS)

    const dates = await this.listAvailableDates()
    let deletedCount = 0

    for (const dateStr of dates) {
      const date = new Date(dateStr)
      if (date < cutoffDate) {
        const datePath = path.join(STORAGE_DIR, dateStr)
        await fs.rm(datePath, { recursive: true, force: true })
        deletedCount++
      }
    }

    return deletedCount
  }

  /**
   * Get storage statistics
   */
  async getStats(): Promise<{
    totalDates: number
    totalSessions: number
    oldestDate: string | null
    newestDate: string | null
  }> {
    const dates = await this.listAvailableDates()

    let totalSessions = 0
    for (const date of dates) {
      const sessions = await this.listSessionsByDate(new Date(date))
      totalSessions += sessions.length
    }

    return {
      totalDates: dates.length,
      totalSessions,
      oldestDate: dates.length > 0 ? dates[dates.length - 1] : null,
      newestDate: dates.length > 0 ? dates[0] : null,
    }
  }
}

// Singleton instance
export const filePersistence = new FilePersistence()
