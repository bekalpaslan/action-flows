/**
 * FlowHub REST API Routes
 * Implements REST endpoints for flow browsing, installation, and publishing
 * Part of Phase 3A: Inspiration Roadmap — Public Flow Registry (Thread 3)
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import { flowInstaller } from '../services/flowInstaller.js';
import { flowPublisher } from '../services/flowPublisher.js';
import { flowHubClient } from '../services/flowHubClient.js';
import type { FlowHubFlowId, FlowPublishRequest, FlowSource } from '@afw/shared';
import { toFlowHubFlowId } from '@afw/shared';

const router = Router();

/**
 * GET /api/flow-hub/flows
 * Browse flows from local registry + FlowHub
 *
 * Query params:
 *   - category?: string — Filter by category
 *   - tag?: string — Filter by tag
 *   - source?: FlowSource — Filter by source (local, flow-hub, community)
 *
 * Returns: { flows: FlowHubEntry[] }
 */
router.get('/flows', async (req: Request, res: Response) => {
  try {
    const { category, tag, source } = req.query;

    console.log('[FlowHub API] Fetching flows:', { category, tag, source });

    // Fetch flows from FlowHub
    const hubFlows = await flowHubClient.fetchFlows();

    // Apply filters
    let filteredFlows = hubFlows;

    if (category && typeof category === 'string') {
      filteredFlows = filteredFlows.filter(f => f.categories.includes(category));
    }

    if (tag && typeof tag === 'string') {
      filteredFlows = filteredFlows.filter(f => f.tags.includes(tag));
    }

    if (source && typeof source === 'string') {
      filteredFlows = filteredFlows.filter(f => f.source === source);
    }

    // Mark installed status using flowInstaller
    const flowsWithStatus = await Promise.all(
      filteredFlows.map(async (flow) => {
        const installed = await flowInstaller.isFlowInstalled(flow.flowId);
        return {
          ...flow,
          installed,
        };
      })
    );

    console.log(`[FlowHub API] Returning ${flowsWithStatus.length} flows`);

    res.json({ flows: flowsWithStatus });
  } catch (error) {
    console.error('[FlowHub API] Error listing flows:', error);
    res.status(500).json({
      error: 'Failed to list flows',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * GET /api/flow-hub/flows/:flowId
 * Get flow details by ID
 *
 * Params: flowId (FlowHubFlowId)
 * Returns: FlowHubEntry with full details | 404
 */
router.get('/flows/:flowId', async (req: Request, res: Response) => {
  try {
    const flowIdParam = req.params.flowId;
    if (!flowIdParam) {
      res.status(400).json({ error: 'Missing flowId parameter' });
      return;
    }

    const flowId = toFlowHubFlowId(flowIdParam);

    console.log(`[FlowHub API] Fetching flow details: ${flowId}`);

    // Fetch all flows and find the requested one
    const flows = await flowHubClient.fetchFlows();
    const flow = flows.find(f => f.flowId === flowId);

    if (!flow) {
      res.status(404).json({
        error: 'Flow not found',
        flowId,
      });
      return;
    }

    // Check if installed
    const installed = await flowInstaller.isFlowInstalled(flowId);

    res.json({
      ...flow,
      installed,
    });
  } catch (error) {
    console.error('[FlowHub API] Error fetching flow details:', error);
    res.status(500).json({
      error: 'Failed to fetch flow details',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * POST /api/flow-hub/flows/:flowId/install
 * Install flow from FlowHub
 *
 * Params: flowId (FlowHubFlowId)
 * Body: { overrideExisting?: boolean }
 * Returns: FlowInstallResult
 */
router.post('/flows/:flowId/install', async (req: Request, res: Response) => {
  try {
    const flowIdParam = req.params.flowId;
    if (!flowIdParam) {
      res.status(400).json({ error: 'Missing flowId parameter' });
      return;
    }

    const flowId = toFlowHubFlowId(flowIdParam);
    const { overrideExisting = false } = req.body;

    console.log(`[FlowHub API] Installing flow: ${flowId} (override: ${overrideExisting})`);

    // Check if already installed
    const alreadyInstalled = await flowInstaller.isFlowInstalled(flowId);
    if (alreadyInstalled && !overrideExisting) {
      res.status(400).json({
        error: 'Flow already installed',
        message: 'Use overrideExisting: true to reinstall',
        flowId,
      });
      return;
    }

    // Fetch manifest from FlowHub
    const manifest = await flowHubClient.fetchFlowManifest(flowId);

    if (!manifest) {
      res.status(404).json({
        error: 'Flow manifest not found',
        flowId,
      });
      return;
    }

    // Install flow
    const result = await flowInstaller.installFlow(manifest, { overrideExisting });

    if (!result.success) {
      res.status(500).json({
        error: 'Flow installation failed',
        flowId,
        errors: result.errors,
      });
      return;
    }

    console.log(`[FlowHub API] Flow installed successfully: ${flowId}`);

    res.json(result);
  } catch (error) {
    console.error('[FlowHub API] Error installing flow:', error);
    res.status(500).json({
      error: 'Failed to install flow',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * POST /api/flow-hub/flows/publish
 * Publish local flow to FlowHub
 *
 * Body: FlowPublishRequest (flowId, manifestUrl?, apiKey?)
 * Returns: { success: boolean, flowId: FlowHubFlowId, manifestUrl?: string }
 */
router.post('/flows/publish', async (req: Request, res: Response) => {
  try {
    const publishRequest = req.body as FlowPublishRequest;

    if (!publishRequest.flowId) {
      res.status(400).json({ error: 'Missing required field: flowId' });
      return;
    }

    const flowId = toFlowHubFlowId(publishRequest.flowId);

    console.log(`[FlowHub API] Publishing flow: ${flowId}`);

    // Package flow
    const manifest = await flowPublisher.publishFlow(flowId);

    if (!manifest) {
      res.status(404).json({
        error: 'Flow not found in local registry',
        flowId,
      });
      return;
    }

    // Publish to FlowHub
    const manifestUrl = publishRequest.manifestUrl || await flowPublisher.generateManifestUrl(manifest);
    const apiKey = publishRequest.apiKey;

    const published = await flowHubClient.publishToHub(manifest, apiKey);

    if (!published) {
      res.status(500).json({
        error: 'Failed to publish flow to FlowHub',
        flowId,
      });
      return;
    }

    console.log(`[FlowHub API] Flow published successfully: ${flowId}`);

    res.json({
      success: true,
      flowId,
      manifestUrl,
    });
  } catch (error) {
    console.error('[FlowHub API] Error publishing flow:', error);
    res.status(500).json({
      error: 'Failed to publish flow',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * DELETE /api/flow-hub/flows/:flowId
 * Uninstall a flow
 *
 * Params: flowId (FlowHubFlowId)
 * Returns: FlowUninstallResult { success, removedFromRegistry, agentFilesRemoved, warnings? }
 */
router.delete('/flows/:flowId', async (req: Request, res: Response) => {
  try {
    const flowIdParam = req.params.flowId;
    if (!flowIdParam) {
      res.status(400).json({ error: 'Missing flowId parameter' });
      return;
    }

    const flowId = toFlowHubFlowId(flowIdParam);

    console.log(`[FlowHub API] Uninstalling flow: ${flowId}`);

    const result = await flowInstaller.uninstallFlow(flowId);

    if (!result.success) {
      res.status(500).json({
        error: 'Uninstall failed',
        flowId,
        errors: result.errors,
      });
      return;
    }

    console.log(`[FlowHub API] Flow uninstalled: ${flowId}`);
    res.json(result);
  } catch (error) {
    console.error('[FlowHub API] Error uninstalling flow:', error);
    res.status(500).json({
      error: 'Failed to uninstall flow',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * GET /api/flow-hub/stats
 * Get FlowHub statistics
 *
 * Returns: FlowHubStats (totalFlows, installedFlows, availableFlows)
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    console.log('[FlowHub API] Fetching FlowHub stats');

    // Fetch all flows
    const flows = await flowHubClient.fetchFlows();

    // Count installed flows
    let installedCount = 0;
    for (const flow of flows) {
      const installed = await flowInstaller.isFlowInstalled(flow.flowId);
      if (installed) {
        installedCount++;
      }
    }

    const stats = {
      totalFlows: flows.length,
      installedFlows: installedCount,
      availableFlows: flows.length - installedCount,
    };

    res.json(stats);
  } catch (error) {
    console.error('[FlowHub API] Error fetching stats:', error);
    res.status(500).json({
      error: 'Failed to fetch stats',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;
