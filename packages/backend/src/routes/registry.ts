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
} from '../schemas/api.js';

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
 * GET /entries - List all entries with optional filtering
 * Query params: type?, source?, enabled?, packId?, projectId?
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

export default router;
