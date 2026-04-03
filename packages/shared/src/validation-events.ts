/**
 * Validation Event Types for Neural Validation Layer
 *
 * Shared types for violation signals, approval requests,
 * checkpoint data, and autonomy levels.
 */

export type ViolationSeverity = 'critical' | 'warning' | 'info';

export interface ViolationSignal {
  id: string;
  severity: ViolationSeverity;
  rule: string;              // "no-raw-hex" | "no-inline-style" | etc.
  description: string;       // "Raw hex color #fff found"
  filePath: string;
  line: number;
  timestamp: string;         // ISO timestamp
  resolved: boolean;
}

export type ApprovalStatus = 'pending' | 'approved' | 'denied' | 'timed_out';
export type AutonomyLevel = 'full' | 'supervised' | 'restricted';

export interface ApprovalRequest {
  id: string;
  action: string;           // "delete_files" | "force_push" | "drop_table"
  description: string;      // "Delete 3 files from packages/app/"
  files?: string[];
  workbenchId: string;
  autonomyLevel: AutonomyLevel;
  status: ApprovalStatus;
  expiresAt: string;         // ISO timestamp, 120s from creation
  resolvedAt?: string;
  sessionId: string;
}

export interface CheckpointData {
  commitHash: string;        // Short hash (7 chars)
  commitMessage: string;     // First line of commit message
  timestamp: string;         // ISO timestamp
  filesChanged: number;
}

/** Default autonomy levels per workbench (per D-12) */
export const DEFAULT_AUTONOMY_LEVELS: Record<string, AutonomyLevel> = {
  work: 'supervised',
  explore: 'supervised',
  review: 'restricted',
  pm: 'supervised',
  settings: 'full',
  archive: 'restricted',
  studio: 'full',
};
