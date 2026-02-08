import { z } from 'zod';
import * as path from 'path';

/**
 * Zod Schemas for REST API Request Bodies
 *
 * These schemas validate all POST/PUT request bodies across routes.
 * They serve as both runtime validation and API documentation.
 */

// ============================================================================
// Session Schemas
// ============================================================================

export const createSessionSchema = z.object({
  cwd: z
    .string()
    .min(1, 'cwd is required')
    .max(500, 'cwd path too long')
    .refine(
      (p) => path.isAbsolute(p),
      'cwd must be an absolute path'
    ),
  hostname: z.string().max(255, 'hostname too long').optional(),
  platform: z
    .enum(['win32', 'darwin', 'linux', 'aix', 'freebsd', 'openbsd', 'sunos'])
    .optional(),
  userId: z.string().max(100, 'userId too long').optional(),
});

export type CreateSessionRequest = z.infer<typeof createSessionSchema>;

export const updateSessionSchema = z.object({
  status: z
    .enum(['pending', 'in_progress', 'completed', 'failed', 'skipped'])
    .optional(),
  summary: z.string().max(5000, 'summary too long').optional(),
  endReason: z.string().max(1000, 'endReason too long').optional(),
});

export type UpdateSessionRequest = z.infer<typeof updateSessionSchema>;

export const sessionInputSchema = z.object({
  input: z.unknown(),
  prompt: z.string().max(5000, 'prompt too long').optional(),
});

export type SessionInputRequest = z.infer<typeof sessionInputSchema>;

export const sessionAwaitingSchema = z.object({
  promptType: z
    .enum(['binary', 'text', 'chain_approval'])
    .optional(),
  promptText: z.string().max(5000, 'promptText too long').optional(),
  quickResponses: z
    .array(z.string().max(500, 'response too long'))
    .max(20, 'too many quick responses')
    .optional(),
});

export type SessionAwaitingRequest = z.infer<typeof sessionAwaitingSchema>;

export const quickActionSchema = z.object({
  id: z.string().min(1).max(100),
  label: z.string().min(1).max(200),
  icon: z.string().min(1).max(50),
  value: z.string().min(1).max(5000),
  contextPatterns: z.array(z.string().max(500)).max(20).optional(),
  alwaysShow: z.boolean().optional(),
});

export const sessionWindowConfigSchema = z.object({
  autoExpand: z.boolean().optional(),
  autoAttachCli: z.boolean().optional(),
  enableAnimations: z.boolean().optional(),
  quickActions: z.array(quickActionSchema).max(50).optional(),
  autoArchiveDelaySeconds: z.number().int().min(0).max(3600).optional(),
});

export type SessionWindowConfigRequest = z.infer<typeof sessionWindowConfigSchema>;

// ============================================================================
// Event Schemas
// ============================================================================

const VALID_EVENT_TYPES = [
  'session:started',
  'session:ended',
  'chain:compiled',
  'chain:started',
  'chain:completed',
  'step:spawned',
  'step:started',
  'step:completed',
  'step:failed',
  'interaction:awaiting-input',
  'interaction:input-received',
  'file:created',
  'file:modified',
  'file:deleted',
  'registry:line-updated',
  'execution:log-created',
  'terminal:output',
  'claude-cli:started',
  'claude-cli:output',
  'claude-cli:exited',
  'error:occurred',
  'warning:occurred',
] as const;

export const createEventSchema = z.object({
  sessionId: z.string().min(1, 'sessionId required').max(200, 'sessionId too long'),
  type: z.enum(VALID_EVENT_TYPES),
  timestamp: z.string().min(1, 'timestamp required').max(50, 'timestamp too long'),
}).passthrough(); // Allow additional event-specific fields

export type CreateEventRequest = z.infer<typeof createEventSchema>;

// ============================================================================
// Terminal Schemas
// ============================================================================

export const terminalOutputSchema = z.object({
  output: z.string().max(1_000_000, 'output too large (max 1MB)'),
  stream: z.enum(['stdout', 'stderr']),
  stepNumber: z.union([z.string(), z.number()]).optional(),
  action: z.string().max(200, 'action too long').optional(),
});

export type TerminalOutputRequest = z.infer<typeof terminalOutputSchema>;

// ============================================================================
// Command Schemas
// ============================================================================

export const createCommandSchema = z.object({
  type: z.enum(['pause', 'resume', 'cancel', 'abort', 'retry', 'skip']),
  payload: z.record(z.unknown()).optional(),
});

export type CreateCommandRequest = z.infer<typeof createCommandSchema>;

export const ackCommandSchema = z.object({
  result: z.unknown().optional(),
  error: z.string().max(5000, 'error message too long').optional(),
});

export type AckCommandRequest = z.infer<typeof ackCommandSchema>;

// ============================================================================
// File Schemas
// ============================================================================

export const fileWriteSchema = z.object({
  content: z.string().max(10 * 1024 * 1024, 'file too large (max 10MB)'),
});

export type FileWriteRequest = z.infer<typeof fileWriteSchema>;

// ============================================================================
// Claude CLI Schemas
// ============================================================================

export const claudeCliStartSchema = z.object({
  sessionId: z.string().min(1, 'sessionId required').max(200, 'sessionId too long'),
  cwd: z
    .string()
    .min(1, 'cwd required')
    .max(500, 'cwd too long')
    .refine(
      (p) => path.isAbsolute(p),
      'cwd must be an absolute path'
    ),
  prompt: z.string().max(10000, 'prompt too long').optional(),
  flags: z.array(z.string().max(200, 'flag too long')).max(50, 'too many flags').optional(),
  projectId: z.string().optional(),
  envVars: z.record(z.string().max(1000)).optional(),
  mcpConfigPath: z.string().max(500).optional(),
  user: z.string().max(200).optional(),
});

export type ClaudeCliStartRequest = z.infer<typeof claudeCliStartSchema>;

export const claudeCliInputSchema = z.object({
  input: z.string().max(100000, 'input too large (max 100KB)'),
});

export type ClaudeCliInputRequest = z.infer<typeof claudeCliInputSchema>;

export const claudeCliStopSchema = z.object({
  signal: z.enum(['SIGTERM', 'SIGINT', 'SIGKILL']).optional(),
});

export type ClaudeCliStopRequest = z.infer<typeof claudeCliStopSchema>;

// ============================================================================
// Project Schemas
// ============================================================================

export const createProjectSchema = z.object({
  name: z.string().min(1, 'name required').max(200, 'name too long'),
  cwd: z
    .string()
    .min(1, 'cwd required')
    .max(500, 'cwd too long')
    .refine(
      (p) => path.isAbsolute(p),
      'cwd must be an absolute path'
    ),
  defaultCliFlags: z.array(z.string().max(200, 'flag too long')).max(50, 'too many flags').optional(),
  defaultPromptTemplate: z.string().max(10000, 'prompt template too long').optional().nullable(),
  mcpConfigPath: z.string().max(500, 'mcp config path too long').optional().nullable(),
  envVars: z.record(z.string().max(1000, 'env var value too long')).optional(),
  quickActionPresets: z.array(quickActionSchema).max(50, 'too many quick actions').optional(),
  description: z.string().max(2000, 'description too long').optional().nullable(),
});

export type CreateProjectRequest = z.infer<typeof createProjectSchema>;

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  cwd: z
    .string()
    .min(1)
    .max(500)
    .refine(
      (p) => path.isAbsolute(p),
      'cwd must be an absolute path'
    )
    .optional(),
  defaultCliFlags: z.array(z.string().max(200)).max(50).optional(),
  defaultPromptTemplate: z.string().max(10000).optional().nullable(),
  mcpConfigPath: z.string().max(500).optional().nullable(),
  envVars: z.record(z.string().max(1000)).optional(),
  quickActionPresets: z.array(quickActionSchema).max(50).optional(),
  description: z.string().max(2000).optional().nullable(),
});

export type UpdateProjectRequest = z.infer<typeof updateProjectSchema>;

export const autoDetectProjectSchema = z.object({
  cwd: z
    .string()
    .min(1, 'cwd required')
    .max(500, 'cwd too long')
    .refine(
      (p) => path.isAbsolute(p),
      'cwd must be an absolute path'
    ),
});

export type AutoDetectProjectRequest = z.infer<typeof autoDetectProjectSchema>;
