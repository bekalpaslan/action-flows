import { z } from 'zod';
import * as path from 'path';
import { STAR_IDS } from '@afw/shared';

/** Cross-platform absolute path check (POSIX + Windows drive letters in Linux containers) */
function isAbsolutePath(p: string): boolean {
  return path.isAbsolute(p) || /^[A-Za-z]:[/\\]/.test(p);
}

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
      (p) => isAbsolutePath(p),
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
  'chain:spark_traveling',
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
  'universe:region_discovered',
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
      (p) => isAbsolutePath(p),
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
      (p) => isAbsolutePath(p),
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
      (p) => isAbsolutePath(p),
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
      (p) => isAbsolutePath(p),
      'cwd must be an absolute path'
    ),
});

export type AutoDetectProjectRequest = z.infer<typeof autoDetectProjectSchema>;

// ============================================================================
// Toolbar Schemas
// ============================================================================

export const toolbarSlotSchema = z.object({
  buttonId: z.string().min(1, 'buttonId required').max(100, 'buttonId too long'),
  pinned: z.boolean().default(false),
  position: z.number().int().min(0).max(1000),
  usageCount: z.number().int().min(0).default(0),
  lastUsed: z.string().datetime({ message: 'lastUsed must be ISO 8601 timestamp' }),
});

export type ToolbarSlotRequest = z.infer<typeof toolbarSlotSchema>;

export const toolbarConfigSchema = z.object({
  maxSlots: z.number().int().min(1).max(50).default(10),
  slots: z.array(toolbarSlotSchema).default([]),
  autoLearn: z.boolean().default(true),
  showUsageCount: z.boolean().default(false),
});

export type ToolbarConfigRequest = z.infer<typeof toolbarConfigSchema>;

export const trackButtonUsageSchema = z.object({
  buttonId: z.string().min(1, 'buttonId required').max(100, 'buttonId too long'),
  sessionId: z.string().min(1, 'sessionId required').max(200, 'sessionId too long'),
});

export type TrackButtonUsageRequest = z.infer<typeof trackButtonUsageSchema>;

// ============================================================================
// Pattern & Bookmark Schemas
// ============================================================================

export const createBookmarkSchema = z.object({
  sessionId: z.string().min(1, 'sessionId required').max(200, 'sessionId too long'),
  messageIndex: z.number().int().min(0, 'messageIndex must be >= 0'),
  messageContent: z.string().min(1, 'messageContent required').max(50000, 'messageContent too long'),
  category: z.enum([
    'useful-pattern',
    'good-output',
    'want-to-automate',
    'reference-material',
    'other',
  ]),
  explanation: z.string().min(1, 'explanation required').max(2000, 'explanation too long'),
  tags: z.array(z.string().max(50, 'tag too long')).max(20, 'too many tags').default([]),
  userId: z.string().max(100, 'userId too long').optional(),
  projectId: z.string().max(200, 'projectId too long').optional(),
});

export type CreateBookmarkRequest = z.infer<typeof createBookmarkSchema>;

export const analyzePatternSchema = z.object({
  force: z.boolean().optional().default(false),
});

export type AnalyzePatternRequest = z.infer<typeof analyzePatternSchema>;

// ============================================================================
// Registry Schemas
// ============================================================================

/**
 * Query schema for listing registry entries
 * GET /api/registry/entries?type=button&source=core&enabled=true&packId=xyz&projectId=abc
 */
export const registryEntryQuerySchema = z.object({
  type: z.enum(['button', 'pattern', 'workflow', 'shortcut', 'custom-prompt', 'modifier', 'pack', 'reminder']).optional(),
  source: z.enum(['core', 'pack', 'project']).optional(),
  enabled: z.string().optional(), // "true" or "false" as query param
  packId: z.string().max(100).optional(),
  projectId: z.string().max(200).optional(),
});

export type RegistryEntryQueryRequest = z.infer<typeof registryEntryQuerySchema>;

/**
 * Layer source schema for registry entries
 */
const layerSourceSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('core') }),
  z.object({ type: z.literal('pack'), packId: z.string().min(1).max(100) }),
  z.object({ type: z.literal('project'), projectId: z.string().min(1).max(200) }),
]);

/**
 * Custom prompt definition schema
 */
const customPromptDefinitionSchema = z.object({
  label: z.string().min(1, 'label required').max(100, 'label too long'),
  prompt: z.string().min(1, 'prompt required').max(2000, 'prompt too long'),
  icon: z.string().max(50, 'icon too long').optional(),
  contextPatterns: z.array(z.string().max(500, 'context pattern too long')).max(20, 'too many context patterns').optional(),
  alwaysShow: z.boolean().optional(),
});

/**
 * Schema for creating a new registry entry
 * POST /api/registry/entries
 */
export const createRegistryEntrySchema = z.object({
  name: z.string().min(1, 'name required').max(200, 'name too long'),
  description: z.string().max(2000, 'description too long'),
  type: z.enum(['button', 'pattern', 'workflow', 'shortcut', 'custom-prompt', 'modifier', 'pack', 'reminder']),
  source: layerSourceSchema,
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Version must be in semver format (X.Y.Z)'),
  status: z.enum(['active', 'inactive']).optional().default('active'),
  enabled: z.boolean().optional().default(true),
  data: z.union([
    z.object({
      type: z.literal('button'),
      definition: z.record(z.unknown()),
    }),
    z.object({
      type: z.literal('pattern'),
      definition: z.record(z.unknown()),
    }),
    z.object({
      type: z.literal('workflow'),
      definition: z.record(z.unknown()),
    }),
    z.object({
      type: z.literal('shortcut'),
      definition: z.record(z.unknown()),
    }),
    z.object({
      type: z.literal('custom-prompt'),
      definition: customPromptDefinitionSchema,
    }),
    z.object({
      type: z.literal('modifier'),
      definition: z.record(z.unknown()),
    }),
    z.object({
      type: z.literal('reminder'),
      definition: z.record(z.unknown()),
    }),
  ]),
  metadata: z.record(z.unknown()).optional(),
});

export type CreateRegistryEntryRequest = z.infer<typeof createRegistryEntrySchema>;

/**
 * Schema for updating a registry entry
 * PATCH /api/registry/entries/:id
 */
export const updateRegistryEntrySchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  type: z.enum(['button', 'pattern', 'workflow', 'shortcut', 'custom-prompt', 'modifier', 'pack', 'reminder']).optional(),
  source: layerSourceSchema.optional(),
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Version must be in semver format').optional(),
  status: z.enum(['active', 'inactive']).optional(),
  enabled: z.boolean().optional(),
  data: z.union([
    z.object({
      type: z.literal('button'),
      definition: z.record(z.unknown()),
    }),
    z.object({
      type: z.literal('pattern'),
      definition: z.record(z.unknown()),
    }),
    z.object({
      type: z.literal('workflow'),
      definition: z.record(z.unknown()),
    }),
    z.object({
      type: z.literal('shortcut'),
      definition: z.record(z.unknown()),
    }),
    z.object({
      type: z.literal('custom-prompt'),
      definition: customPromptDefinitionSchema,
    }),
    z.object({
      type: z.literal('modifier'),
      definition: z.record(z.unknown()),
    }),
  ]).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type UpdateRegistryEntryRequest = z.infer<typeof updateRegistryEntrySchema>;

/**
 * Schema for behavior pack installation
 * POST /api/registry/packs
 */
export const behaviorPackSchema = z.object({
  id: z.string().min(1, 'id required').max(100, 'id too long'),
  name: z.string().min(1, 'name required').max(200, 'name too long'),
  description: z.string().max(2000, 'description too long'),
  author: z.string().min(1, 'author required').max(100, 'author too long'),
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Version must be in semver format (X.Y.Z)'),
  tags: z.array(z.string().max(50, 'tag too long')).max(20, 'too many tags').optional(),
  compatibility: z.object({
    minDashboardVersion: z.string().min(1, 'minDashboardVersion required'),
    projectTypes: z.array(z.string().max(50)).max(20).optional(),
  }),
  entries: z.array(z.any()).optional(), // Array of RegistryEntry objects
  dependencies: z.array(z.string().max(100)).max(50).optional(),
  enabled: z.boolean().optional().default(true),
});

export type BehaviorPackRequest = z.infer<typeof behaviorPackSchema>;

// ============================================================================
// Modifier Schemas (Self-Modification Endpoints)
// ============================================================================

/**
 * Query schema for listing modifiers
 * GET /api/registry/modifiers?status=active&tier=minor
 */
export const modifierQuerySchema = z.object({
  status: z.enum(['active', 'inactive']).optional(),
  tier: z.enum(['minor', 'moderate', 'major']).optional(),
});

export type ModifierQueryRequest = z.infer<typeof modifierQuerySchema>;

/**
 * Schema for applying a modifier
 * POST /api/registry/modifiers/:id/apply
 */
export const applyModifierSchema = z.object({
  dryRun: z.boolean().optional().default(false),
  force: z.boolean().optional().default(false),
});

export type ApplyModifierRequest = z.infer<typeof applyModifierSchema>;

// ============================================================================
// Intel Dossier Schemas
// ============================================================================

/**
 * Schema for creating a new dossier
 * POST /api/intel/dossiers
 */
export const createDossierSchema = z.object({
  name: z.string().min(1, 'name required').max(200, 'name too long'),
  targets: z
    .array(z.string().min(1, 'target cannot be empty').max(500, 'target too long'))
    .min(1, 'at least one target required')
    .max(50, 'too many targets'),
  context: z.string().max(5000, 'context too long').optional().default(''),
});

export type CreateDossierRequest = z.infer<typeof createDossierSchema>;

/**
 * Schema for updating a dossier
 * PATCH /api/intel/dossiers/:id
 */
export const updateDossierSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  targets: z
    .array(z.string().min(1).max(500))
    .min(1)
    .max(50)
    .optional(),
  context: z.string().max(5000).optional(),
});

export type UpdateDossierRequest = z.infer<typeof updateDossierSchema>;

/**
 * Schema for triggering dossier analysis
 * POST /api/intel/dossiers/:id/analyze
 */
export const triggerAnalysisSchema = z.object({
  force: z.boolean().optional().default(false),
});

export type TriggerAnalysisRequest = z.infer<typeof triggerAnalysisSchema>;

/**
 * Schema for creating a widget suggestion
 * POST /api/intel/suggestions
 */
export const createSuggestionSchema = z.object({
  dossierId: z.string().min(1, 'dossierId required'),
  needed: z.string().min(1, 'needed widget type required'),
  reason: z.string().min(1, 'reason required'),
  fallback: z.object({
    type: z.enum(['raw', 'markdown']),
    content: z.string().min(1, 'fallback content required'),
  }),
});

export type CreateSuggestionRequest = z.infer<typeof createSuggestionSchema>;

// ============================================================================
// Universe Graph Schemas
// ============================================================================

export const fogStateSchema = z.enum(['hidden', 'faint', 'revealed']);
export const regionStatusSchema = z.enum(['idle', 'active', 'waiting', 'undiscovered']);
export const layerSchema = z.enum(['platform', 'template', 'philosophy', 'physics', 'experience']);
export const gateStatusSchema = z.enum(['clear', 'warning', 'violation']);

// StarId validation - regions can only be created for stars, not tools or harmony
export const starIdSchema = z.enum(STAR_IDS as any as [string, ...string[]]);

export const createRegionSchema = z.object({
  id: z.string().min(1).max(100),
  workbenchId: starIdSchema,
  label: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  position: z.object({ x: z.number(), y: z.number() }),
  layer: layerSchema,
  fogState: fogStateSchema.default('hidden'),
});
export type CreateRegionRequest = z.infer<typeof createRegionSchema>;

export const createBridgeSchema = z.object({
  id: z.string().min(1).max(100),
  source: z.string().min(1).max(100),
  target: z.string().min(1).max(100),
  strength: z.number().min(0).max(1).default(0),
});
export type CreateBridgeRequest = z.infer<typeof createBridgeSchema>;

export const discoverRegionSchema = z.object({
  regionId: z.string().min(1).max(100),
  sessionId: z.string().min(1).max(200),
});
export type DiscoverRegionRequest = z.infer<typeof discoverRegionSchema>;

export const sessionRegionMappingSchema = z.object({
  regionId: z.string().min(1).max(100),
});
export type SessionRegionMappingRequest = z.infer<typeof sessionRegionMappingSchema>;

// ============================================================================
// Discovery System Schemas (Phase 3)
// ============================================================================

export const recordActivitySchema = z.object({
  sessionId: z.string().min(1).max(200),
  activityType: z.enum(['interaction', 'chain_completed', 'error']),
  context: z.string().max(500).optional(),
  chainId: z.string().max(200).optional(),
});
export type RecordActivityRequest = z.infer<typeof recordActivitySchema>;

export const revealRegionSchema = z.object({
  sessionId: z.string().min(1).max(200),
});
export type RevealRegionRequest = z.infer<typeof revealRegionSchema>;

export const revealAllRegionsSchema = z.object({
  sessionId: z.string().min(1).max(200),
});
export type RevealAllRegionsRequest = z.infer<typeof revealAllRegionsSchema>;
