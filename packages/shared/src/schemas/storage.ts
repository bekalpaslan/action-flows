import { z } from 'zod';

/**
 * Comprehensive Zod validation schemas for storage layer
 * Eliminates 61+ manual assertions across redis.ts and memory.ts
 *
 * These schemas enforce data integrity at runtime:
 * - Session data structure validation
 * - Chain and step integrity
 * - Event type and field validation
 * - Domain object validation (bookmarks, patterns, reminders, errors, etc.)
 */

// ============================================================================
// Base Type Schemas (Branded Types)
// ============================================================================

export const sessionIdSchema = z.string().min(1).max(200);
export const chainIdSchema = z.string().min(1).max(200);
export const stepIdSchema = z.string().min(1).max(200);
export const userIdSchema = z.string().max(100);
export const projectIdSchema = z.string().max(200);
export const timestampSchema = z.string().datetime();
export const regionIdSchema = z.string().min(1).max(100);
export const edgeIdSchema = z.string().min(1).max(100);

// ============================================================================
// Session Schemas
// ============================================================================

export const sessionSchema = z.object({
  id: sessionIdSchema,
  user: userIdSchema.optional(),
  cwd: z.string().min(1),
  hostname: z.string().optional(),
  platform: z.string().optional(),
  chains: z.array(z.lazy(() => chainSchema)),
  currentChain: z.lazy(() => chainSchema).optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'failed', 'skipped']),
  conversationState: z.enum(['idle', 'awaiting_input', 'receiving_input', 'active']).optional(),
  lastPrompt: z.object({
    text: z.string(),
    type: z.string().optional(),
  }).optional(),
  startedAt: timestampSchema,
  endedAt: timestampSchema.optional(),
  lastActivityAt: timestampSchema.optional(),
  duration: z.number().optional(),
  metadata: z.record(z.unknown()).optional(),
  activityTtlExtensions: z.number().optional(),
  projectId: projectIdSchema.optional(),
});

export type ValidatedSession = z.infer<typeof sessionSchema>;

// ============================================================================
// Chain and Step Schemas
// ============================================================================

export const chainStepSchema = z.object({
  stepNumber: z.number().int().min(1),
  action: z.string().max(500),
  model: z.string().max(100),
  inputs: z.record(z.unknown()),
  waitsFor: z.array(z.number().int().min(1)),
  status: z.enum(['pending', 'in_progress', 'completed', 'failed', 'skipped']),
  description: z.string().max(2000).optional(),
  startedAt: timestampSchema.optional(),
  completedAt: timestampSchema.optional(),
  duration: z.number().int().min(0).optional(),
  result: z.unknown().optional(),
  error: z.string().max(2000).optional(),
  learning: z.string().max(5000).optional(),
});

export type ValidatedChainStep = z.infer<typeof chainStepSchema>;

export const chainSchema = z.object({
  id: chainIdSchema,
  sessionId: sessionIdSchema,
  userId: userIdSchema.optional(),
  title: z.string().min(1).max(500),
  steps: chainStepSchema.array(),
  source: z.string().max(100),
  ref: z.string().max(500).optional(),
  status: z.enum(['pending', 'compiled', 'in_progress', 'completed', 'failed', 'skipped']),
  compiledAt: timestampSchema,
  startedAt: timestampSchema.optional(),
  completedAt: timestampSchema.optional(),
  duration: z.number().int().min(0).optional(),
});

export type ValidatedChain = z.infer<typeof chainSchema>;

// ============================================================================
// Event Schemas
// ============================================================================

const baseEventSchema = z.object({
  id: z.string().min(1).max(200).optional(),
  sessionId: sessionIdSchema,
  timestamp: timestampSchema,
  type: z.string().max(100),
});

export const workspaceEventSchema = baseEventSchema.extend({
  type: z.enum([
    'session:started',
    'session:ended',
    'chain:compiled',
    'chain:started',
    'chain:completed',
    'chain:spark_traveling',
    'step:spawned',
    'step:started',
    'step:completed',
    'step:failed',
    'step:skipped',
    'interaction:awaiting-input',
    'interaction:input-received',
    'file:created',
    'file:modified',
    'file:deleted',
    'registry:line-updated',
    'registry:changed',
    'execution:log-created',
    'terminal:output',
    'claude-cli:started',
    'claude-cli:output',
    'claude-cli:exited',
    'chat:message',
    'chat:history',
    'error:occurred',
    'warning:occurred',
    'session:followed',
    'session:unfollowed',
    'quick-action:triggered',
    'flow-node:clicked',
    'pattern:detected',
    'frequency:updated',
    'bookmark:created',
    'harmony:check',
    'harmony:violation',
    'harmony:metrics-updated',
    'universe:initialized',
    'universe:region-discovered',
    'universe:evolution-tick',
    'universe:spark-traveling',
    'gate:updated',
  ]).describe('Event type - determines event structure'),
  payload: z.unknown().optional(),
  details: z.record(z.unknown()).optional(),
});

export type ValidatedWorkspaceEvent = z.infer<typeof workspaceEventSchema>;

// ============================================================================
// Command Schemas
// ============================================================================

export const commandPayloadSchema = z.object({
  type: z.enum(['pause', 'resume', 'cancel', 'abort', 'retry', 'skip']),
  payload: z.record(z.unknown()).optional(),
  timestamp: timestampSchema,
  sessionId: sessionIdSchema,
});

export type ValidatedCommandPayload = z.infer<typeof commandPayloadSchema>;

// ============================================================================
// Session Window Config Schema
// ============================================================================

export const quickActionSchema = z.object({
  id: z.string().min(1).max(100),
  label: z.string().min(1).max(200),
  icon: z.string().min(1).max(50),
  value: z.string().min(1).max(5000),
  contextPatterns: z.array(z.string().max(500)).max(20).optional(),
  alwaysShow: z.boolean().optional(),
});

export const sessionWindowConfigSchema = z.object({
  sessionId: sessionIdSchema,
  autoExpand: z.boolean().optional(),
  autoAttachCli: z.boolean().optional(),
  enableAnimations: z.boolean().optional(),
  quickActions: quickActionSchema.array().max(50).optional(),
  autoArchiveDelaySeconds: z.number().int().min(0).max(3600).optional(),
  createdAt: timestampSchema.optional(),
  updatedAt: timestampSchema.optional(),
});

export type ValidatedSessionWindowConfig = z.infer<typeof sessionWindowConfigSchema>;

// ============================================================================
// Frequency and Activity Tracking Schemas
// ============================================================================

export const frequencyRecordSchema = z.object({
  actionType: z.string().max(200),
  projectId: projectIdSchema.optional(),
  userId: userIdSchema.optional(),
  count: z.number().int().min(1),
  firstSeen: timestampSchema,
  lastSeen: timestampSchema,
  dailyCounts: z.record(z.number().int().min(0)),
});

export type ValidatedFrequencyRecord = z.infer<typeof frequencyRecordSchema>;

// ============================================================================
// Bookmark Schema
// ============================================================================

export const bookmarkSchema = z.object({
  id: z.string().min(1).max(200),
  projectId: projectIdSchema,
  sessionId: sessionIdSchema.optional(),
  messageIndex: z.number().int().min(0),
  messageContent: z.string().min(1).max(50000),
  category: z.enum([
    'useful-pattern',
    'good-output',
    'want-to-automate',
    'reference-material',
    'other',
  ]),
  explanation: z.string().min(1).max(2000),
  tags: z.array(z.string().max(50)).max(20),
  userId: userIdSchema.optional(),
  timestamp: timestampSchema,
});

export type ValidatedBookmark = z.infer<typeof bookmarkSchema>;

// ============================================================================
// Pattern Schema
// ============================================================================

export const detectedPatternSchema = z.object({
  id: z.string().min(1).max(200),
  projectId: projectIdSchema,
  sessionId: sessionIdSchema.optional(),
  patternType: z.string().max(100),
  description: z.string().max(2000),
  confidence: z.number().min(0).max(1),
  detectedAt: timestampSchema,
  evidenceCount: z.number().int().min(0),
  lastSeen: timestampSchema,
});

export type ValidatedDetectedPattern = z.infer<typeof detectedPatternSchema>;

// ============================================================================
// Harmony Check Schema
// ============================================================================

export const harmonyCheckSchema = z.object({
  id: z.string().min(1).max(200),
  sessionId: sessionIdSchema.optional(),
  projectId: projectIdSchema.optional(),
  timestamp: timestampSchema,
  result: z.enum(['valid', 'degraded', 'violation']),
  parsedFormat: z.string().max(100).optional(),
  message: z.string().max(2000).optional(),
  details: z.record(z.unknown()).optional(),
});

export type ValidatedHarmonyCheck = z.infer<typeof harmonyCheckSchema>;

// ============================================================================
// Chat Message Schema
// ============================================================================

export const chatMessageSchema = z.object({
  id: z.string().min(1).max(200),
  sessionId: sessionIdSchema,
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().max(100000),
  timestamp: timestampSchema,
  metadata: z.record(z.unknown()).optional(),
});

export type ValidatedChatMessage = z.infer<typeof chatMessageSchema>;

// ============================================================================
// Freshness Metadata Schema
// ============================================================================

export const freshnessMetadataSchema = z.object({
  lastModifiedAt: timestampSchema,
  lastAccessedAt: timestampSchema,
  freshnessGrade: z.enum(['A', 'B', 'C', 'D', 'F']),
  ageMs: z.number().int().min(0),
});

export type ValidatedFreshnessMetadata = z.infer<typeof freshnessMetadataSchema>;

// ============================================================================
// Telemetry Entry Schema
// ============================================================================

export const telemetryEntrySchema = z.object({
  id: z.string().min(1).max(200),
  timestamp: timestampSchema,
  level: z.enum(['debug', 'info', 'warn', 'error']),
  source: z.string().max(100),
  message: z.string().max(5000),
  sessionId: sessionIdSchema.optional(),
  chainId: chainIdSchema.optional(),
  stepId: stepIdSchema.optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type ValidatedTelemetryEntry = z.infer<typeof telemetryEntrySchema>;

// ============================================================================
// Reminder Instance Schema
// ============================================================================

export const reminderInstanceSchema = z.object({
  id: z.string().min(1).max(200),
  reminderId: z.string().min(1).max(200),
  sessionId: sessionIdSchema,
  chainId: chainIdSchema.nullable(),
  reminderText: z.string().min(1).max(5000),
  createdAt: timestampSchema,
  addressed: z.boolean(),
  metadata: z.record(z.unknown()).optional(),
});

export type ValidatedReminderInstance = z.infer<typeof reminderInstanceSchema>;

// ============================================================================
// Error Instance Schema
// ============================================================================

export const errorInstanceSchema = z.object({
  id: z.string().min(1).max(200),
  title: z.string().min(1).max(500),
  message: z.string().max(5000),
  context: z.string().max(5000),
  stackTrace: z.string().max(10000).nullable().optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  stepNumber: z.number().int().min(1).nullable().optional(),
  action: z.string().max(200).nullable().optional(),
  sessionId: sessionIdSchema,
  chainId: chainIdSchema.nullable().optional(),
  createdAt: timestampSchema,
  recoveryOptions: z.array(z.enum(['retry', 'skip', 'cancel'])),
  dismissed: z.boolean(),
  metadata: z.record(z.unknown()).optional(),
});

export type ValidatedErrorInstance = z.infer<typeof errorInstanceSchema>;

// ============================================================================
// Intel Dossier Schema
// ============================================================================

export const dossierHistoryEntrySchema = z.object({
  timestamp: timestampSchema,
  action: z.string().max(100),
  details: z.record(z.unknown()).optional(),
});

export const intelDossierSchema = z.object({
  id: z.string().min(1).max(200),
  name: z.string().min(1).max(200),
  targets: z.array(z.string().min(1).max(500)).min(1).max(50),
  context: z.string().max(5000).optional(),
  status: z.enum(['pending', 'analyzing', 'complete', 'failed']),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
  history: dossierHistoryEntrySchema.array(),
});

export type ValidatedIntelDossier = z.infer<typeof intelDossierSchema>;

// ============================================================================
// Widget Suggestion Schema
// ============================================================================

export const suggestionEntrySchema = z.object({
  id: z.string().min(1).max(200),
  dossierId: z.string().min(1).max(200),
  needed: z.string().min(1).max(100),
  reason: z.string().max(2000),
  fallback: z.object({
    type: z.enum(['raw', 'markdown']),
    content: z.string().min(1),
  }),
  frequency: z.number().int().min(0),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export type ValidatedSuggestionEntry = z.infer<typeof suggestionEntrySchema>;

// ============================================================================
// Universe Graph Schemas
// ============================================================================

export const regionNodeSchema = z.object({
  id: regionIdSchema,
  label: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  position: z.object({ x: z.number(), y: z.number() }),
  layer: z.enum(['platform', 'template', 'philosophy', 'physics', 'experience']),
  fogState: z.enum(['hidden', 'faint', 'revealed']),
  discoveredAt: timestampSchema.optional(),
});

export type ValidatedRegionNode = z.infer<typeof regionNodeSchema>;

export const lightBridgeSchema = z.object({
  id: edgeIdSchema,
  source: regionIdSchema,
  target: regionIdSchema,
  strength: z.number().min(0).max(1),
  createdAt: timestampSchema,
});

export type ValidatedLightBridge = z.infer<typeof lightBridgeSchema>;

export const universeGraphSchema = z.object({
  regions: z.map(regionIdSchema, regionNodeSchema),
  bridges: z.map(edgeIdSchema, lightBridgeSchema),
  metadata: z.object({
    createdAt: timestampSchema,
    updatedAt: timestampSchema,
    discoveredRegionCount: z.number().int().min(0),
  }),
});

export type ValidatedUniverseGraph = z.infer<typeof universeGraphSchema>;

// ============================================================================
// Validation Helper Functions
// ============================================================================

/**
 * Safely validate data against a schema, logging errors
 * Used throughout storage layer to validate before store/after retrieve
 */
export function validateStorageData<T>(
  data: unknown,
  schema: z.ZodSchema<T>,
  context: string
): T | null {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error(
        `[Storage Validation] Failed to validate ${context}:`,
        error.issues.map((i) => `${i.path.join('.')} - ${i.message}`)
      );
    } else {
      console.error(`[Storage Validation] Error validating ${context}:`, error);
    }
    return null;
  }
}

/**
 * Safely validate with fallback to default value
 */
export function validateStorageDataOrDefault<T>(
  data: unknown,
  schema: z.ZodSchema<T>,
  defaultValue: T,
  context: string
): T {
  try {
    return schema.parse(data);
  } catch (error) {
    console.warn(
      `[Storage Validation] Failed to validate ${context}, using default:`,
      error instanceof z.ZodError ? error.issues : error
    );
    return defaultValue;
  }
}
