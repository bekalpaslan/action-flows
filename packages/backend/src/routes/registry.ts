/**
 * Registry API Routes
 * Implements SRD Section 4.4: Registry API Endpoints
 *
 * Endpoints:
 * - GET /api/registry/entries - List all entries with optional filtering
 * - GET /api/registry/entries/:id - Get a single entry by ID
 * - POST /api/registry/entries - Create a new entry
 * - PATCH /api/registry/entries/:id - Update an entry
 * - DELETE /api/registry/entries/:id - Delete an entry
 * - GET /api/registry/packs - List installed behavior packs
 * - POST /api/registry/packs - Install behavior pack
 * - POST /api/registry/packs/:id/enable - Enable a pack
 * - POST /api/registry/packs/:id/disable - Disable a pack
 * - DELETE /api/registry/packs/:id - Uninstall behavior pack
 * - GET /api/registry/resolve/:entryId - Resolve a behavior
 * - GET /api/registry/conflicts/:entryId - Get conflicts for an entry
 * - GET /api/registry/stats - Get registry statistics
 */

import { Router } from 'express';
import { z } from 'zod';
import type {
  RegistryEntry,
  RegistryEntryId,
  BehaviorPack,
  BehaviorPackId,
  RegistryFilter,
  ProjectId,
  Timestamp,
} from '@afw/shared';
import { registryStorage } from '../services/registryStorage.js';
import { createLayerResolver } from '../services/layerResolver.js';
import {
  registryEntryQuerySchema,
  createRegistryEntrySchema,
  updateRegistryEntrySchema,
  behaviorPackSchema,
  modifierQuerySchema,
  applyModifierSchema,
} from '../schemas/api.js';
import fs from 'fs/promises';
import path from 'path';

const router = Router();
const layerResolver = createLayerResolver(registryStorage);

/**
 * Generate a unique registry entry ID
 */
function generateEntryId(): RegistryEntryId {
  return `entry-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` as RegistryEntryId;
}

/**
 * Get current timestamp as branded Timestamp
 */
function currentTimestamp(): Timestamp {
  return new Date().toISOString() as Timestamp;
}

// ============================================================================
// Entry Endpoints
// ============================================================================

/**
 * @swagger
 * /api/registry/entries:
 *   get:
 *     summary: List all registry entries
 *     description: List action registry entries with optional filtering by type, source, enabled state, or pack
 *     tags: [registry]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter by entry type
 *       - in: query
 *         name: source
 *         schema:
 *           type: string
 *         description: Filter by source (builtin, user, pack)
 *       - in: query
 *         name: enabled
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Filter by enabled state
 *       - in: query
 *         name: packId
 *         schema:
 *           type: string
 *         description: Filter by behavior pack ID
 *     responses:
 *       200:
 *         description: List of registry entries
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       400:
 *         description: Invalid query parameters
 *       500:
 *         description: Internal server error
 */
router.get('/entries', async (req, res) => {
  try {
    const query = registryEntryQuerySchema.parse(req.query);

    const filter: RegistryFilter = {
      type: query.type,
      source: query.source,
      enabled: query.enabled === 'true' ? true : query.enabled === 'false' ? false : undefined,
      packId: query.packId as BehaviorPackId | undefined,
    };

    const entries = await registryStorage.getEntries(filter);
    res.json(entries);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Invalid query parameters',
        details: error.errors,
      });
    } else {
      console.error('[Registry] Error listing entries:', error);
      res.status(500).json({ error: 'Failed to list entries' });
    }
  }
});

/**
 * GET /entries/:id - Get a single entry by ID
 */
router.get('/entries/:id', async (req, res) => {
  try {
    const entryId = req.params.id as RegistryEntryId;

    if (!entryId || entryId.length === 0) {
      return res.status(400).json({ error: 'Entry ID is required' });
    }

    const entry = await registryStorage.getEntry(entryId);
    if (!entry) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    res.json(entry);
  } catch (error) {
    console.error('[Registry] Error getting entry:', error);
    res.status(500).json({ error: 'Failed to get entry' });
  }
});

/**
 * POST /entries - Create a new registry entry
 * Body: RegistryEntry (without id, createdAt, updatedAt)
 */
router.post('/entries', async (req, res) => {
  try {
    const entryData = createRegistryEntrySchema.parse(req.body);
    const now = currentTimestamp();

    // Transform source with proper branded types
    let source: RegistryEntry['source'];
    if (entryData.source.type === 'core') {
      source = { type: 'core' };
    } else if (entryData.source.type === 'pack') {
      source = { type: 'pack', packId: entryData.source.packId as BehaviorPackId };
    } else {
      source = { type: 'project', projectId: entryData.source.projectId as ProjectId };
    }

    const entry: RegistryEntry = {
      id: generateEntryId(),
      name: entryData.name,
      description: entryData.description,
      type: entryData.type,
      source,
      version: entryData.version,
      status: entryData.status ?? 'active',
      enabled: entryData.enabled ?? true,
      data: entryData.data as unknown as RegistryEntry['data'],
      createdAt: now,
      updatedAt: now,
      metadata: entryData.metadata,
    };

    await registryStorage.addEntry(entry);

    console.log(`[Registry] Created entry: ${entry.name} (${entry.id})`);
    res.status(201).json(entry);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Invalid entry data',
        details: error.errors,
      });
    } else if (error instanceof Error && error.message.includes('already exists')) {
      res.status(409).json({ error: error.message });
    } else {
      console.error('[Registry] Error creating entry:', error);
      res.status(500).json({ error: 'Failed to create entry' });
    }
  }
});

/**
 * PATCH /entries/:id - Update an existing entry
 * Body: Partial<RegistryEntry>
 */
router.patch('/entries/:id', async (req, res) => {
  try {
    const entryId = req.params.id as RegistryEntryId;

    if (!entryId || entryId.length === 0) {
      return res.status(400).json({ error: 'Entry ID is required' });
    }

    const existing = await registryStorage.getEntry(entryId);
    if (!existing) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    const rawUpdates = updateRegistryEntrySchema.parse(req.body);

    // Transform source with proper branded types if present
    const updates: Partial<RegistryEntry> = { ...rawUpdates } as Partial<RegistryEntry>;
    if (rawUpdates.source) {
      if (rawUpdates.source.type === 'core') {
        updates.source = { type: 'core' };
      } else if (rawUpdates.source.type === 'pack') {
        updates.source = { type: 'pack', packId: rawUpdates.source.packId as BehaviorPackId };
      } else {
        updates.source = { type: 'project', projectId: rawUpdates.source.projectId as ProjectId };
      }
    }
    if (rawUpdates.data) {
      updates.data = rawUpdates.data as unknown as RegistryEntry['data'];
    }

    await registryStorage.updateEntry(entryId, updates);

    const updated = await registryStorage.getEntry(entryId);
    console.log(`[Registry] Updated entry: ${entryId}`);
    res.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Invalid update data',
        details: error.errors,
      });
    } else {
      console.error('[Registry] Error updating entry:', error);
      res.status(500).json({ error: 'Failed to update entry' });
    }
  }
});

/**
 * DELETE /entries/:id - Remove a registry entry
 */
router.delete('/entries/:id', async (req, res) => {
  try {
    const entryId = req.params.id as RegistryEntryId;

    if (!entryId || entryId.length === 0) {
      return res.status(400).json({ error: 'Entry ID is required' });
    }

    const existing = await registryStorage.getEntry(entryId);
    if (!existing) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    await registryStorage.removeEntry(entryId);

    console.log(`[Registry] Deleted entry: ${entryId}`);
    res.status(204).send();
  } catch (error) {
    console.error('[Registry] Error deleting entry:', error);
    res.status(500).json({ error: 'Failed to delete entry' });
  }
});

// ============================================================================
// Pack Endpoints
// ============================================================================

/**
 * GET /packs - List installed behavior packs
 */
router.get('/packs', async (req, res) => {
  try {
    const packs = await registryStorage.getInstalledPacks();
    res.json(packs);
  } catch (error) {
    console.error('[Registry] Error listing packs:', error);
    res.status(500).json({ error: 'Failed to list packs' });
  }
});

/**
 * POST /packs - Install a behavior pack
 * Body: BehaviorPack
 */
router.post('/packs', async (req, res) => {
  try {
    const packData = behaviorPackSchema.parse(req.body);

    const pack: BehaviorPack = {
      id: packData.id as BehaviorPackId,
      name: packData.name,
      description: packData.description,
      author: packData.author,
      version: packData.version,
      tags: packData.tags ?? [],
      compatibility: packData.compatibility,
      entries: (packData.entries ?? []) as RegistryEntry[],
      dependencies: packData.dependencies as BehaviorPackId[] | undefined,
      enabled: packData.enabled ?? true,
    };

    await registryStorage.installPack(pack);

    console.log(`[Registry] Installed pack: ${pack.name} (${pack.id})`);
    res.status(201).json(pack);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Invalid pack data',
        details: error.errors,
      });
    } else if (error instanceof Error && error.message.includes('already installed')) {
      res.status(409).json({ error: error.message });
    } else if (error instanceof Error && error.message.includes('conflict')) {
      res.status(409).json({ error: error.message });
    } else {
      console.error('[Registry] Error installing pack:', error);
      res.status(500).json({ error: 'Failed to install pack' });
    }
  }
});

/**
 * POST /packs/:id/enable - Enable a pack and its entries
 */
router.post('/packs/:id/enable', async (req, res) => {
  try {
    const packId = req.params.id as BehaviorPackId;

    if (!packId || packId.length === 0) {
      return res.status(400).json({ error: 'Pack ID is required' });
    }

    const pack = await registryStorage.getPack(packId);
    if (!pack) {
      return res.status(404).json({ error: 'Pack not found' });
    }

    await registryStorage.enablePack(packId);

    console.log(`[Registry] Enabled pack: ${packId}`);
    res.status(200).json({ enabled: true, packId });
  } catch (error) {
    console.error('[Registry] Error enabling pack:', error);
    res.status(500).json({ error: 'Failed to enable pack' });
  }
});

/**
 * POST /packs/:id/disable - Disable a pack and its entries
 */
router.post('/packs/:id/disable', async (req, res) => {
  try {
    const packId = req.params.id as BehaviorPackId;

    if (!packId || packId.length === 0) {
      return res.status(400).json({ error: 'Pack ID is required' });
    }

    const pack = await registryStorage.getPack(packId);
    if (!pack) {
      return res.status(404).json({ error: 'Pack not found' });
    }

    await registryStorage.disablePack(packId);

    console.log(`[Registry] Disabled pack: ${packId}`);
    res.status(200).json({ disabled: true, packId });
  } catch (error) {
    console.error('[Registry] Error disabling pack:', error);
    res.status(500).json({ error: 'Failed to disable pack' });
  }
});

/**
 * DELETE /packs/:id - Uninstall a behavior pack
 */
router.delete('/packs/:id', async (req, res) => {
  try {
    const packId = req.params.id as BehaviorPackId;

    if (!packId || packId.length === 0) {
      return res.status(400).json({ error: 'Pack ID is required' });
    }

    const pack = await registryStorage.getPack(packId);
    if (!pack) {
      return res.status(404).json({ error: 'Pack not found' });
    }

    await registryStorage.uninstallPack(packId);

    console.log(`[Registry] Uninstalled pack: ${packId}`);
    res.status(204).send();
  } catch (error) {
    console.error('[Registry] Error uninstalling pack:', error);
    res.status(500).json({ error: 'Failed to uninstall pack' });
  }
});

// ============================================================================
// Resolution Endpoints
// ============================================================================

/**
 * GET /resolve/:entryId - Resolve a behavior with layer precedence
 * Query: projectId?
 */
router.get('/resolve/:entryId', async (req, res) => {
  try {
    const entryId = req.params.entryId as RegistryEntryId;
    const projectId = req.query.projectId as string | undefined;

    if (!entryId || entryId.length === 0) {
      return res.status(400).json({ error: 'Entry ID is required' });
    }

    // Use the resolve method which takes entryId and optional projectId
    const resolved = await layerResolver.resolve(entryId, projectId);

    if (!resolved) {
      return res.status(404).json({ error: 'Entry not found or not resolved' });
    }

    res.json(resolved);
  } catch (error) {
    console.error('[Registry] Error resolving behavior:', error);
    res.status(500).json({ error: 'Failed to resolve behavior' });
  }
});

/**
 * GET /conflicts/:entryId - Get conflicts for a specific entry
 */
router.get('/conflicts/:entryId', async (req, res) => {
  try {
    const entryId = req.params.entryId as RegistryEntryId;

    if (!entryId || entryId.length === 0) {
      return res.status(400).json({ error: 'Entry ID is required' });
    }

    // Use detectConflicts which returns conflicts for a specific entry
    const conflicts = await layerResolver.detectConflicts(entryId);

    res.json(conflicts);
  } catch (error) {
    console.error('[Registry] Error getting conflicts:', error);
    res.status(500).json({ error: 'Failed to get conflicts' });
  }
});

// ============================================================================
// Stats Endpoint
// ============================================================================

/**
 * GET /stats - Get registry statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = registryStorage.getStats();
    res.json(stats);
  } catch (error) {
    console.error('[Registry] Error getting stats:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// ============================================================================
// Modifier Endpoints (Self-Modification)
// ============================================================================

/** Type for change preview data */
interface ChangePreviewData {
  filePath: string;
  changeType: 'create' | 'modify' | 'delete';
  package: string;
  preview?: string;
  lineCount?: number;
}

/** Type for modifier data in registry entries */
interface ModifierData {
  type: 'modifier';
  definition: {
    description: string;
    targetTier: 'minor' | 'moderate' | 'major';
    fileChangeTemplates: Array<{
      filePath: string;
      changeType: 'create' | 'modify' | 'delete';
      template?: string;
      package: 'shared' | 'backend' | 'app' | 'mcp-server' | 'hooks';
    }>;
    validation: {
      typeCheck: boolean;
      lint: boolean;
      test: boolean;
    };
  };
}

/** Type for applied modifier tracking */
interface AppliedModifierMeta {
  appliedAt: string;
  backupPaths?: string[];
}

/** In-memory store for file backups (keyed by modifier ID) */
const modifierBackups: Map<string, Map<string, string>> = new Map();

/**
 * Check if a registry entry is a modifier
 */
function isModifierEntry(entry: RegistryEntry): entry is RegistryEntry & { data: ModifierData } {
  return entry.type === 'modifier' && entry.data?.type === 'modifier';
}

/**
 * GET /modifiers - List all modifier entries
 * Query params: status (active/inactive), tier (minor/moderate/major)
 */
router.get('/modifiers', async (req, res) => {
  try {
    const query = modifierQuerySchema.parse(req.query);

    // Get all modifier entries
    const allModifiers = await registryStorage.getEntries({ type: 'modifier' });

    // Apply additional filters
    let results = allModifiers;

    if (query.status) {
      results = results.filter((e) => e.status === query.status);
    }

    if (query.tier && results.length > 0) {
      results = results.filter((e) => {
        if (isModifierEntry(e)) {
          return e.data.definition.targetTier === query.tier;
        }
        return false;
      });
    }

    console.log(`[SelfMod] Listed ${results.length} modifiers (filter: status=${query.status}, tier=${query.tier})`);
    res.json(results);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Invalid query parameters',
        details: error.errors,
      });
    } else {
      console.error('[SelfMod] Error listing modifiers:', error);
      res.status(500).json({ error: 'Failed to list modifiers' });
    }
  }
});

/**
 * GET /modifiers/:id - Get a specific modifier by ID
 */
router.get('/modifiers/:id', async (req, res) => {
  try {
    const modifierId = req.params.id as RegistryEntryId;

    if (!modifierId || modifierId.length === 0) {
      return res.status(400).json({ error: 'Modifier ID is required' });
    }

    const entry = await registryStorage.getEntry(modifierId);

    if (!entry) {
      return res.status(404).json({ error: 'Modifier not found' });
    }

    if (entry.type !== 'modifier') {
      return res.status(404).json({ error: 'Entry is not a modifier' });
    }

    console.log(`[SelfMod] Retrieved modifier: ${modifierId}`);
    res.json(entry);
  } catch (error) {
    console.error('[SelfMod] Error getting modifier:', error);
    res.status(500).json({ error: 'Failed to get modifier' });
  }
});

/**
 * GET /modifiers/:id/preview - Preview what changes a modifier would make
 * Returns ChangePreviewData[] without applying changes
 */
router.get('/modifiers/:id/preview', async (req, res) => {
  try {
    const modifierId = req.params.id as RegistryEntryId;

    if (!modifierId || modifierId.length === 0) {
      return res.status(400).json({ error: 'Modifier ID is required' });
    }

    const entry = await registryStorage.getEntry(modifierId);

    if (!entry) {
      return res.status(404).json({ error: 'Modifier not found' });
    }

    if (!isModifierEntry(entry)) {
      return res.status(400).json({ error: 'Entry is not a modifier' });
    }

    const { fileChangeTemplates } = entry.data.definition;
    const changes: ChangePreviewData[] = [];

    for (const template of fileChangeTemplates) {
      const change: ChangePreviewData = {
        filePath: template.filePath,
        changeType: template.changeType,
        package: template.package,
      };

      // Add preview content if template exists
      if (template.template) {
        change.preview = template.template.substring(0, 500) + (template.template.length > 500 ? '...' : '');
        change.lineCount = template.template.split('\n').length;
      }

      changes.push(change);
    }

    console.log(`[SelfMod] Preview generated for modifier: ${modifierId} (${changes.length} changes)`);
    res.json(changes);
  } catch (error) {
    console.error('[SelfMod] Error previewing modifier:', error);
    res.status(500).json({ error: 'Failed to preview modifier' });
  }
});

/**
 * POST /modifiers/:id/apply - Apply a modifier's changes
 * Body: { dryRun?: boolean, force?: boolean }
 */
router.post('/modifiers/:id/apply', async (req, res) => {
  try {
    const modifierId = req.params.id as RegistryEntryId;
    const body = applyModifierSchema.parse(req.body);
    const { dryRun, force } = body;

    if (!modifierId || modifierId.length === 0) {
      return res.status(400).json({ error: 'Modifier ID is required' });
    }

    const entry = await registryStorage.getEntry(modifierId);

    if (!entry) {
      return res.status(404).json({ error: 'Modifier not found' });
    }

    if (!isModifierEntry(entry)) {
      return res.status(400).json({ error: 'Entry is not a modifier' });
    }

    const { definition } = entry.data;
    const { fileChangeTemplates, targetTier, validation } = definition;

    // Validation check: major tier requires confirmation (force flag)
    if (!force && targetTier === 'major') {
      return res.status(400).json({
        error: 'Major tier modifier requires confirmation',
        message: 'Set force=true to apply major changes',
        tier: targetTier,
      });
    }

    const changes: ChangePreviewData[] = [];
    const errors: string[] = [];
    const backups = new Map<string, string>();

    // Process each file change template
    for (const template of fileChangeTemplates) {
      const packagePath = path.join(process.cwd(), 'packages', template.package);
      const fullPath = path.join(packagePath, template.filePath);

      const change: ChangePreviewData = {
        filePath: template.filePath,
        changeType: template.changeType,
        package: template.package,
      };

      if (template.template) {
        change.preview = template.template.substring(0, 200) + (template.template.length > 200 ? '...' : '');
        change.lineCount = template.template.split('\n').length;
      }

      changes.push(change);

      // If dry run, skip actual file operations
      if (dryRun) {
        continue;
      }

      try {
        // Backup existing file before modification
        if (template.changeType === 'modify' || template.changeType === 'delete') {
          try {
            const existingContent = await fs.readFile(fullPath, 'utf-8');
            backups.set(fullPath, existingContent);
            console.log(`[SelfMod] Backed up: ${fullPath}`);
          } catch (readErr) {
            if ((readErr as NodeJS.ErrnoException).code !== 'ENOENT') {
              throw readErr;
            }
            // File doesn't exist, no backup needed
          }
        }

        // Apply the change
        switch (template.changeType) {
          case 'create':
          case 'modify':
            if (template.template) {
              await fs.mkdir(path.dirname(fullPath), { recursive: true });
              await fs.writeFile(fullPath, template.template, 'utf-8');
              console.log(`[SelfMod] ${template.changeType === 'create' ? 'Created' : 'Modified'}: ${fullPath}`);
            }
            break;

          case 'delete':
            await fs.unlink(fullPath);
            console.log(`[SelfMod] Deleted: ${fullPath}`);
            break;
        }
      } catch (fileErr) {
        const errMsg = fileErr instanceof Error ? fileErr.message : String(fileErr);
        errors.push(`Failed to ${template.changeType} ${template.filePath}: ${errMsg}`);
        console.error(`[SelfMod] Error applying change to ${fullPath}:`, fileErr);
      }
    }

    // Store backups for potential rollback (only if not dry run)
    if (!dryRun && backups.size > 0) {
      modifierBackups.set(modifierId, backups);
    }

    // Update registry entry to mark as applied (only if not dry run and no errors)
    if (!dryRun && errors.length === 0) {
      const appliedMeta: AppliedModifierMeta = {
        appliedAt: new Date().toISOString(),
        backupPaths: Array.from(backups.keys()),
      };

      await registryStorage.updateEntry(modifierId, {
        metadata: {
          ...entry.metadata,
          applied: appliedMeta,
        },
      });

      console.log(`[SelfMod] Modifier applied successfully: ${modifierId}`);
    }

    const result = {
      success: errors.length === 0,
      dryRun,
      changes,
      ...(errors.length > 0 && { errors }),
      validation: dryRun ? undefined : validation,
    };

    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Invalid request body',
        details: error.errors,
      });
    } else {
      console.error('[SelfMod] Error applying modifier:', error);
      res.status(500).json({ error: 'Failed to apply modifier' });
    }
  }
});

/**
 * POST /modifiers/:id/rollback - Rollback a previously applied modifier
 * Restores files to their previous state if backup exists
 */
router.post('/modifiers/:id/rollback', async (req, res) => {
  try {
    const modifierId = req.params.id as RegistryEntryId;

    if (!modifierId || modifierId.length === 0) {
      return res.status(400).json({ error: 'Modifier ID is required' });
    }

    const entry = await registryStorage.getEntry(modifierId);

    if (!entry) {
      return res.status(404).json({ error: 'Modifier not found' });
    }

    if (!isModifierEntry(entry)) {
      return res.status(400).json({ error: 'Entry is not a modifier' });
    }

    // Check if we have backups for this modifier
    const backups = modifierBackups.get(modifierId);

    if (!backups || backups.size === 0) {
      return res.status(400).json({
        error: 'No backup available for rollback',
        message: 'Modifier was not applied or backups have been cleared',
      });
    }

    const restoredFiles: string[] = [];
    const errors: string[] = [];

    // Restore each backed up file
    for (const [filePath, content] of backups) {
      try {
        await fs.writeFile(filePath, content, 'utf-8');
        restoredFiles.push(filePath);
        console.log(`[SelfMod] Restored: ${filePath}`);
      } catch (restoreErr) {
        const errMsg = restoreErr instanceof Error ? restoreErr.message : String(restoreErr);
        errors.push(`Failed to restore ${filePath}: ${errMsg}`);
        console.error(`[SelfMod] Error restoring ${filePath}:`, restoreErr);
      }
    }

    // Clear backups after rollback
    modifierBackups.delete(modifierId);

    // Update registry entry to remove applied metadata
    if (entry.metadata?.applied) {
      const { applied: _removed, ...restMetadata } = entry.metadata as Record<string, unknown>;
      await registryStorage.updateEntry(modifierId, {
        metadata: Object.keys(restMetadata).length > 0 ? restMetadata : undefined,
      });
    }

    console.log(`[SelfMod] Rollback complete for modifier: ${modifierId} (${restoredFiles.length} files restored)`);

    res.json({
      success: errors.length === 0,
      restoredFiles,
      ...(errors.length > 0 && { errors }),
    });
  } catch (error) {
    console.error('[SelfMod] Error rolling back modifier:', error);
    res.status(500).json({ error: 'Failed to rollback modifier' });
  }
});

export default router;
