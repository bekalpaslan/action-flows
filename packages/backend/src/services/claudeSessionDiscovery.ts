/**
 * Claude Session Discovery Service
 * Scans ~/.claude/ide/ lock files to detect externally-running Claude Code sessions.
 * Optionally enriches with metadata from JSONL project files.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';
import type { DiscoveredClaudeSession, DiscoveredSessionEnrichment } from '@afw/shared';

interface LockFileContent {
  pid: number;
  workspaceFolders: string[];
  ideName: string;
  transport: string;
  [key: string]: unknown;
}

class ClaudeSessionDiscovery {
  private ideDir: string;
  private projectsDir: string;

  constructor() {
    const claudeHome = path.join(os.homedir(), '.claude');
    this.ideDir = path.join(claudeHome, 'ide');
    this.projectsDir = path.join(claudeHome, 'projects');
  }

  /**
   * Discover externally-running Claude Code sessions by scanning IDE lock files.
   */
  async discoverSessions(options?: {
    enrich?: boolean;
    aliveOnly?: boolean;
  }): Promise<DiscoveredClaudeSession[]> {
    const { enrich = false, aliveOnly = true } = options ?? {};

    // Check if IDE directory exists
    if (!fs.existsSync(this.ideDir)) {
      return [];
    }

    let files: string[];
    try {
      files = fs.readdirSync(this.ideDir).filter(f => f.endsWith('.lock'));
    } catch {
      console.warn('[Discovery] Could not read IDE lock directory:', this.ideDir);
      return [];
    }

    const sessions: DiscoveredClaudeSession[] = [];

    for (const file of files) {
      try {
        const session = await this.parseLockFile(file);
        if (!session) continue;
        if (aliveOnly && !session.pidAlive) continue;

        if (enrich) {
          session.enrichment = await this.enrichSession(session.primaryCwd);
        }

        sessions.push(session);
      } catch (err) {
        console.warn(`[Discovery] Error parsing lock file ${file}:`, err);
      }
    }

    return sessions;
  }

  private async parseLockFile(filename: string): Promise<DiscoveredClaudeSession | null> {
    const portMatch = filename.match(/^(\d+)\.lock$/);
    if (!portMatch) return null;

    const port = parseInt(portMatch[1], 10);
    const filePath = path.join(this.ideDir, filename);

    let content: string;
    try {
      content = fs.readFileSync(filePath, 'utf-8');
    } catch {
      return null;
    }

    let lock: LockFileContent;
    try {
      lock = JSON.parse(content);
    } catch {
      console.warn(`[Discovery] Invalid JSON in lock file: ${filename}`);
      return null;
    }

    if (!lock.pid || !Array.isArray(lock.workspaceFolders)) {
      return null;
    }

    const pidAlive = this.isPidAlive(lock.pid);
    const workspaceFolders = lock.workspaceFolders.map(f => path.normalize(f));
    const primaryCwd = workspaceFolders[0] || '';

    return {
      discoveryKey: `ide-${port}`,
      source: 'ide-lock',
      port,
      pid: lock.pid,
      pidAlive,
      workspaceFolders,
      primaryCwd,
      ideName: lock.ideName || 'Unknown IDE',
      transport: lock.transport || 'ws',
      lastSeenAt: new Date().toISOString(),
    };
  }

  private isPidAlive(pid: number): boolean {
    if (process.platform === 'win32') {
      try {
        const output = execSync(
          `tasklist /FI "PID eq ${pid}" /FO CSV /NH`,
          { encoding: 'utf-8', timeout: 3000, windowsHide: true }
        );
        return !output.includes('No tasks') && output.trim().length > 0;
      } catch {
        return false;
      }
    } else {
      // Unix: process.kill(pid, 0) checks existence without sending a signal
      try {
        process.kill(pid, 0);
        return true;
      } catch {
        return false;
      }
    }
  }

  private async enrichSession(cwd: string): Promise<DiscoveredSessionEnrichment> {
    const empty: DiscoveredSessionEnrichment = {
      latestSessionId: null,
      lastPrompt: null,
      gitBranch: null,
      lastActivityAt: null,
      totalSessionFiles: 0,
    };

    if (!cwd) return empty;

    const projectKey = this.cwdToProjectKey(cwd);
    const projectDir = this.resolveProjectDir(projectKey);

    if (!projectDir) return empty;

    let jsonlFiles: string[];
    try {
      jsonlFiles = fs.readdirSync(projectDir).filter(f => f.endsWith('.jsonl'));
    } catch {
      return empty;
    }

    if (jsonlFiles.length === 0) return empty;

    // Find most recently modified JSONL
    let latestFile = '';
    let latestMtime = 0;
    for (const f of jsonlFiles) {
      try {
        const stat = fs.statSync(path.join(projectDir, f));
        if (stat.mtimeMs > latestMtime) {
          latestMtime = stat.mtimeMs;
          latestFile = f;
        }
      } catch {
        // skip unreadable files
      }
    }

    if (!latestFile) return empty;

    const enrichment: DiscoveredSessionEnrichment = {
      latestSessionId: latestFile.replace('.jsonl', ''),
      lastPrompt: null,
      gitBranch: null,
      lastActivityAt: new Date(latestMtime).toISOString(),
      totalSessionFiles: jsonlFiles.length,
    };

    // Read first 4KB for metadata
    try {
      const fd = fs.openSync(path.join(projectDir, latestFile), 'r');
      const buf = Buffer.alloc(4096);
      const bytesRead = fs.readSync(fd, buf, 0, 4096, 0);
      fs.closeSync(fd);

      const chunk = buf.toString('utf-8', 0, bytesRead);
      const lines = chunk.split('\n').filter(Boolean);

      for (const line of lines) {
        try {
          const entry = JSON.parse(line);
          // Extract git branch from user entries
          if (entry.gitBranch && !enrichment.gitBranch) {
            enrichment.gitBranch = entry.gitBranch;
          }
          // Extract last prompt from user messages
          if (entry.type === 'user' && entry.message && !enrichment.lastPrompt) {
            const content = entry.message.content;
            const msg = typeof content === 'string'
              ? content
              : Array.isArray(content)
                ? content.find((c: { type?: string; text?: string }) => c.type === 'text')?.text
                : null;
            if (msg && typeof msg === 'string') {
              enrichment.lastPrompt = msg.length > 200 ? msg.slice(0, 200) + '...' : msg;
            }
          }
        } catch {
          // skip malformed lines
        }
      }
    } catch {
      // enrichment is optional, don't fail
    }

    return enrichment;
  }

  /**
   * Resolve the actual project directory, handling case-insensitive matching on Windows.
   * The lock file may report "d:\Foo" while Claude stored "D--Foo".
   */
  private resolveProjectDir(projectKey: string): string | null {
    const direct = path.join(this.projectsDir, projectKey);
    if (fs.existsSync(direct)) return direct;

    // Case-insensitive fallback (Windows drive letter casing mismatch)
    if (process.platform === 'win32' && fs.existsSync(this.projectsDir)) {
      try {
        const dirs = fs.readdirSync(this.projectsDir);
        const match = dirs.find(d => d.toLowerCase() === projectKey.toLowerCase());
        if (match) return path.join(this.projectsDir, match);
      } catch {
        // ignore
      }
    }

    return null;
  }

  /**
   * Convert a cwd path to the Claude project key format.
   * Claude replaces colons and path separators with dashes.
   * e.g. "D:\ActionFlowsDashboard" → "D--ActionFlowsDashboard"
   * e.g. "/home/user/project" → "-home-user-project"
   */
  private cwdToProjectKey(cwd: string): string {
    const normalized = path.normalize(cwd);
    // Replace colons and path separators with dashes (colon → dash, separator → dash)
    // On Windows: "D:\Foo" → "D--Foo"; on Unix: "/home/user" → "-home-user"
    return normalized
      .replace(/[:/\\]/g, '-')
      || 'unknown';
  }
}

export const claudeSessionDiscovery = new ClaudeSessionDiscovery();
