/**
 * Checkpoint Service
 *
 * Git-based checkpoint operations for the neural validation safety layer.
 * Lists recent commits as checkpoints and supports reverting to any checkpoint
 * using git revert (creates a new commit, never uses reset --hard).
 */

import { execSync } from 'child_process';
import type { CheckpointData } from '@afw/shared';

/**
 * CheckpointService provides git-based checkpoint operations.
 * Uses git revert (not reset --hard) for safe rollback (D-08).
 */
export class CheckpointService {
  private readonly cwd: string;

  constructor(cwd?: string) {
    this.cwd = cwd ?? process.cwd();
  }

  /**
   * List recent commits as checkpoints.
   * Returns newest first.
   */
  async listCheckpoints(limit: number = 20): Promise<CheckpointData[]> {
    try {
      // Get commit list with hash, subject, and author date
      const output = execSync(
        `git log --format="%h|%s|%aI" -n ${limit}`,
        { encoding: 'utf-8', cwd: this.cwd }
      ).trim();

      if (!output) {
        return [];
      }

      const lines = output.split('\n').filter(Boolean);
      const checkpoints: CheckpointData[] = [];

      for (const line of lines) {
        const parts = line.split('|');
        if (parts.length < 3) continue;

        const commitHash = parts[0]!;
        const commitMessage = parts[1]!;
        const timestamp = parts[2]!;

        // Count files changed in this commit
        let filesChanged = 0;
        try {
          const diffOutput = execSync(
            `git diff-tree --no-commit-id --name-only -r ${commitHash}`,
            { encoding: 'utf-8', cwd: this.cwd }
          ).trim();
          filesChanged = diffOutput ? diffOutput.split('\n').filter(Boolean).length : 0;
        } catch {
          // If diff-tree fails (e.g., root commit), set to 0
          filesChanged = 0;
        }

        checkpoints.push({
          commitHash,
          commitMessage,
          timestamp,
          filesChanged,
        });
      }

      console.log(`[CheckpointService] Listed ${checkpoints.length} checkpoints`);
      return checkpoints;
    } catch (error) {
      console.error('[CheckpointService] Error listing checkpoints:', error);
      return [];
    }
  }

  /**
   * Revert to a specific checkpoint by creating a new revert commit.
   * Uses git revert (not reset --hard) per D-08.
   * Handles merge commits with -m 1 flag.
   */
  async revertToCheckpoint(commitHash: string): Promise<{ success: boolean; message: string }> {
    try {
      // Validate hash exists
      try {
        execSync(`git cat-file -t ${commitHash}`, { encoding: 'utf-8', cwd: this.cwd });
      } catch {
        return { success: false, message: `Commit ${commitHash} not found` };
      }

      // Check if it's a merge commit (has more than one parent)
      let isMerge = false;
      try {
        const commitInfo = execSync(`git cat-file -p ${commitHash}`, { encoding: 'utf-8', cwd: this.cwd });
        const parentLines = commitInfo.split('\n').filter(line => line.startsWith('parent '));
        isMerge = parentLines.length > 1;
      } catch {
        return { success: false, message: `Failed to inspect commit ${commitHash}` };
      }

      // Perform the revert
      const revertCmd = isMerge
        ? `git revert -m 1 --no-edit ${commitHash}`
        : `git revert --no-edit ${commitHash}`;

      const output = execSync(revertCmd, { encoding: 'utf-8', cwd: this.cwd });
      console.log(`[CheckpointService] Successfully reverted commit ${commitHash}`);

      return {
        success: true,
        message: `Successfully reverted commit ${commitHash}${isMerge ? ' (merge commit)' : ''}`,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[CheckpointService] Error reverting to ${commitHash}:`, errorMessage);
      return {
        success: false,
        message: `Failed to revert: ${errorMessage}`,
      };
    }
  }

  /**
   * Get checkpoint data for a single commit.
   * Returns null if commit doesn't exist.
   */
  async getCheckpointForCommit(hash: string): Promise<CheckpointData | null> {
    try {
      const output = execSync(
        `git log --format="%h|%s|%aI" -n 1 ${hash}`,
        { encoding: 'utf-8', cwd: this.cwd }
      ).trim();

      if (!output) {
        return null;
      }

      const parts = output.split('|');
      if (parts.length < 3) return null;

      let filesChanged = 0;
      try {
        const diffOutput = execSync(
          `git diff-tree --no-commit-id --name-only -r ${hash}`,
          { encoding: 'utf-8', cwd: this.cwd }
        ).trim();
        filesChanged = diffOutput ? diffOutput.split('\n').filter(Boolean).length : 0;
      } catch {
        filesChanged = 0;
      }

      return {
        commitHash: parts[0]!,
        commitMessage: parts[1]!,
        timestamp: parts[2]!,
        filesChanged,
      };
    } catch {
      console.warn(`[CheckpointService] Commit ${hash} not found`);
      return null;
    }
  }
}

/** Singleton instance for production use */
export const checkpointService = new CheckpointService();
