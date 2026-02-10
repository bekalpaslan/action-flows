import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { brandedTypes, FogState } from '@afw/shared';
import type { UniverseGraph, RegionNode, LightBridge, Session } from '@afw/shared';
import { createTestServer, cleanup } from './helpers.js';

const TEST_CWD = process.cwd();

describe('Universe Graph Integration Tests', () => {
  let testServerUrl: string;

  beforeEach(async () => {
    const serverInfo = await createTestServer();
    testServerUrl = serverInfo.apiUrl;
  });

  afterEach(async () => {
    await cleanup();
  });

  describe('Region CRUD Operations', () => {
    it('should create and retrieve a region', async () => {
      const regionData = {
        id: 'region-test-1',
        workbenchId: 'work',
        label: 'Test Execution Region',
        description: 'A test region for execution tasks',
        position: { x: 100, y: 200 },
        layer: 'physics',
        fogState: FogState.HIDDEN,
      };

      // Create region
      const createRes = await fetch(`${testServerUrl}/api/universe/regions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regionData),
      });

      expect(createRes.status).toBe(201);
      const created = await createRes.json() as any;
      expect(created.id).toBe(regionData.id);
      expect(created.workbenchId).toBe(regionData.workbenchId);
      expect(created.label).toBe(regionData.label);

      // Retrieve region
      const getRes = await fetch(`${testServerUrl}/api/universe/regions/${regionData.id}`);
      expect(getRes.status).toBe(200);
      const retrieved = await getRes.json() as any;
      expect(retrieved.id).toBe(regionData.id);
      expect(retrieved.layer).toBe('physics');
      expect(retrieved.status).toBe('undiscovered');
    });

    it('should list all regions', async () => {
      // Create multiple regions
      const regions = [
        {
          id: 'region-1',
          workbenchId: 'work',
          label: 'Region One',
          position: { x: 0, y: 0 },
          layer: 'physics',
        },
        {
          id: 'region-2',
          workbenchId: 'explore',
          label: 'Region Two',
          position: { x: 100, y: 100 },
          layer: 'template',
        },
      ];

      for (const regionData of regions) {
        await fetch(`${testServerUrl}/api/universe/regions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(regionData),
        });
      }

      // List regions
      const listRes = await fetch(`${testServerUrl}/api/universe/regions`);
      expect(listRes.status).toBe(200);
      const { regions: listed, count } = await listRes.json() as any;

      expect(count).toBe(2);
      expect(listed).toHaveLength(2);
      expect(listed.map((r: any) => r.id)).toContain('region-1');
      expect(listed.map((r: any) => r.id)).toContain('region-2');
    });

    it('should update a region', async () => {
      // Create region
      const regionData = {
        id: 'region-update',
        workbenchId: 'work',
        label: 'Original Label',
        position: { x: 0, y: 0 },
        layer: 'physics',
      };

      await fetch(`${testServerUrl}/api/universe/regions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regionData),
      });

      // Update region
      const updateRes = await fetch(`${testServerUrl}/api/universe/regions/${regionData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: 'Updated Label',
          glowIntensity: 0.8,
        }),
      });

      expect(updateRes.status).toBe(200);
      const updated = await updateRes.json() as any;
      expect(updated.label).toBe('Updated Label');
      expect(updated.glowIntensity).toBe(0.8);
    });

    it('should delete a region', async () => {
      // Create region
      const regionData = {
        id: 'region-delete',
        workbenchId: 'work',
        label: 'To Be Deleted',
        position: { x: 0, y: 0 },
        layer: 'physics',
      };

      await fetch(`${testServerUrl}/api/universe/regions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regionData),
      });

      // Delete region
      const deleteRes = await fetch(`${testServerUrl}/api/universe/regions/${regionData.id}`, {
        method: 'DELETE',
      });

      expect(deleteRes.status).toBe(204);

      // Verify deletion
      const getRes = await fetch(`${testServerUrl}/api/universe/regions/${regionData.id}`);
      expect(getRes.status).toBe(404);
    });

    it('should return 404 for non-existent region', async () => {
      const res = await fetch(`${testServerUrl}/api/universe/regions/nonexistent`);
      expect(res.status).toBe(404);
      const error = await res.json() as any;
      expect(error.error).toBe('Region not found');
    });
  });

  describe('Bridge CRUD Operations', () => {
    it('should create and retrieve a bridge', async () => {
      // Create two regions first
      const region1 = {
        id: 'region-source',
        workbenchId: 'work',
        label: 'Source Region',
        position: { x: 0, y: 0 },
        layer: 'physics',
      };

      const region2 = {
        id: 'region-target',
        workbenchId: 'explore',
        label: 'Target Region',
        position: { x: 200, y: 0 },
        layer: 'template',
      };

      await fetch(`${testServerUrl}/api/universe/regions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(region1),
      });

      await fetch(`${testServerUrl}/api/universe/regions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(region2),
      });

      // Create bridge
      const bridgeData = {
        id: 'bridge-test-1',
        source: 'region-source',
        target: 'region-target',
        strength: 0.5,
      };

      const createRes = await fetch(`${testServerUrl}/api/universe/bridges`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bridgeData),
      });

      expect(createRes.status).toBe(201);
      const created = await createRes.json() as any;
      expect(created.id).toBe(bridgeData.id);
      expect(created.strength).toBe(0.5);
      expect(created.traversalCount).toBe(0);

      // Retrieve bridge
      const getRes = await fetch(`${testServerUrl}/api/universe/bridges/${bridgeData.id}`);
      expect(getRes.status).toBe(200);
      const retrieved = await getRes.json() as any;
      expect(retrieved.id).toBe(bridgeData.id);
      expect(retrieved.source).toBe('region-source');
      expect(retrieved.target).toBe('region-target');
    });

    it('should list all bridges', async () => {
      // Create regions
      await fetch(`${testServerUrl}/api/universe/regions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 'r1',
          workbenchId: 'work',
          label: 'R1',
          position: { x: 0, y: 0 },
          layer: 'physics',
        }),
      });

      await fetch(`${testServerUrl}/api/universe/regions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 'r2',
          workbenchId: 'explore',
          label: 'R2',
          position: { x: 100, y: 0 },
          layer: 'template',
        }),
      });

      // Create bridges
      await fetch(`${testServerUrl}/api/universe/bridges`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 'bridge-1',
          source: 'r1',
          target: 'r2',
          strength: 0.3,
        }),
      });

      // List bridges
      const listRes = await fetch(`${testServerUrl}/api/universe/bridges`);
      expect(listRes.status).toBe(200);
      const { bridges, count } = await listRes.json() as any;

      expect(count).toBeGreaterThan(0);
      expect(bridges.some((b: any) => b.id === 'bridge-1')).toBe(true);
    });

    it('should delete a bridge', async () => {
      // Create regions
      await fetch(`${testServerUrl}/api/universe/regions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 'r1',
          workbenchId: 'work',
          label: 'R1',
          position: { x: 0, y: 0 },
          layer: 'physics',
        }),
      });

      await fetch(`${testServerUrl}/api/universe/regions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 'r2',
          workbenchId: 'explore',
          label: 'R2',
          position: { x: 100, y: 0 },
          layer: 'template',
        }),
      });

      // Create bridge
      await fetch(`${testServerUrl}/api/universe/bridges`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 'bridge-delete',
          source: 'r1',
          target: 'r2',
        }),
      });

      // Delete bridge
      const deleteRes = await fetch(`${testServerUrl}/api/universe/bridges/bridge-delete`, {
        method: 'DELETE',
      });

      expect(deleteRes.status).toBe(204);

      // Verify deletion
      const getRes = await fetch(`${testServerUrl}/api/universe/bridges/bridge-delete`);
      expect(getRes.status).toBe(404);
    });
  });

  describe('Session-Region Mapping', () => {
    it('should map a session to a region', async () => {
      // Create session
      const sessionRes = await fetch(`${testServerUrl}/api/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cwd: TEST_CWD,
          hostname: 'test-machine',
        }),
      });

      const session = await sessionRes.json() as Session;
      expect(sessionRes.status).toBe(201);

      // Create region
      const regionData = {
        id: 'region-mapping',
        workbenchId: 'work',
        label: 'Mapping Test Region',
        position: { x: 0, y: 0 },
        layer: 'physics',
      };

      await fetch(`${testServerUrl}/api/universe/regions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regionData),
      });

      // Map session to region
      const mapRes = await fetch(`${testServerUrl}/api/universe/sessions/${session.id}/region`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ regionId: regionData.id }),
      });

      expect(mapRes.status).toBe(201);
      const mapped = await mapRes.json() as any;
      expect(mapped.success).toBe(true);
      expect(mapped.regionId).toBe(regionData.id);

      // Retrieve mapping
      const getRes = await fetch(`${testServerUrl}/api/universe/sessions/${session.id}/region`);
      expect(getRes.status).toBe(200);
      const mapping = await getRes.json() as any;
      expect(mapping.regionId).toBe(regionData.id);
    });

    it('should delete session-region mapping', async () => {
      // Create session
      const sessionRes = await fetch(`${testServerUrl}/api/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cwd: TEST_CWD }),
      });

      const session = await sessionRes.json() as Session;

      // Create region
      await fetch(`${testServerUrl}/api/universe/regions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 'region-map-delete',
          workbenchId: 'work',
          label: 'Test',
          position: { x: 0, y: 0 },
          layer: 'physics',
        }),
      });

      // Map session to region
      await fetch(`${testServerUrl}/api/universe/sessions/${session.id}/region`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ regionId: 'region-map-delete' }),
      });

      // Delete mapping
      const deleteRes = await fetch(`${testServerUrl}/api/universe/sessions/${session.id}/region`, {
        method: 'DELETE',
      });

      expect(deleteRes.status).toBe(204);

      // Verify deletion
      const getRes = await fetch(`${testServerUrl}/api/universe/sessions/${session.id}/region`);
      expect(getRes.status).toBe(404);
    });

    it('should reject mapping for non-existent session', async () => {
      const fakeSessionId = brandedTypes.sessionId('fake-session');

      const mapRes = await fetch(`${testServerUrl}/api/universe/sessions/${fakeSessionId}/region`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ regionId: 'some-region' }),
      });

      expect(mapRes.status).toBe(404);
      const error = await mapRes.json() as any;
      expect(error.error).toBe('Session not found');
    });

    it('should reject mapping for non-existent region', async () => {
      // Create session
      const sessionRes = await fetch(`${testServerUrl}/api/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cwd: TEST_CWD }),
      });

      const session = await sessionRes.json() as Session;

      const mapRes = await fetch(`${testServerUrl}/api/universe/sessions/${session.id}/region`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ regionId: 'nonexistent-region' }),
      });

      expect(mapRes.status).toBe(404);
      const error = await mapRes.json() as any;
      expect(error.error).toBe('Region not found');
    });
  });

  describe('Universe Graph Operations', () => {
    it('should set and retrieve universe graph', async () => {
      const graph: Partial<UniverseGraph> = {
        regions: [],
        bridges: [],
        discoveryTriggers: [],
        metadata: {
          createdAt: brandedTypes.currentTimestamp(),
          lastModifiedAt: brandedTypes.currentTimestamp(),
          evolutionHistory: [],
          totalInteractions: 0,
          discoveredRegionCount: 0,
          totalRegionCount: 0,
          mapBounds: { minX: 0, minY: 0, maxX: 1000, maxY: 1000 },
        },
      };

      // Set graph
      const setRes = await fetch(`${testServerUrl}/api/universe`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(graph),
      });

      expect(setRes.status).toBe(200);

      // Retrieve graph
      const getRes = await fetch(`${testServerUrl}/api/universe`);
      expect(getRes.status).toBe(200);
      const retrieved = await getRes.json() as any;
      expect(retrieved.metadata.totalInteractions).toBe(0);
    });

    it('should return 404 when universe graph not initialized', async () => {
      const res = await fetch(`${testServerUrl}/api/universe`);
      expect(res.status).toBe(404);
      const error = await res.json() as any;
      expect(error.error).toBe('Universe graph not initialized');
    });
  });

  describe('Region Discovery', () => {
    it('should discover a region (change fog state)', async () => {
      // Create session
      const sessionRes = await fetch(`${testServerUrl}/api/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cwd: TEST_CWD }),
      });

      const session = await sessionRes.json() as Session;

      // Create region with hidden fog state
      const regionData = {
        id: 'region-discover',
        workbenchId: 'work',
        label: 'Hidden Region',
        position: { x: 0, y: 0 },
        layer: 'physics',
        fogState: FogState.HIDDEN,
      };

      await fetch(`${testServerUrl}/api/universe/regions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regionData),
      });

      // Discover region
      const discoverRes = await fetch(`${testServerUrl}/api/universe/discover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          regionId: regionData.id,
          sessionId: session.id,
        }),
      });

      expect(discoverRes.status).toBe(200);
      const result = await discoverRes.json() as any;
      expect(result.success).toBe(true);
      expect(result.newFogState).toBe(FogState.REVEALED);

      // Verify fog state changed
      const getRes = await fetch(`${testServerUrl}/api/universe/regions/${regionData.id}`);
      const region = await getRes.json() as any;
      expect(region.fogState).toBe(FogState.REVEALED);
      expect(region.status).toBe('idle');
      expect(region.discoveredAt).toBeDefined();
    });
  });

  describe('Validation', () => {
    it('should reject invalid region data', async () => {
      const invalidRegion = {
        // Missing required fields
        label: 'Invalid',
      };

      const res = await fetch(`${testServerUrl}/api/universe/regions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidRegion),
      });

      expect(res.status).toBe(400);
    });

    it('should reject invalid bridge data', async () => {
      const invalidBridge = {
        // Missing source and target
        id: 'bridge-invalid',
      };

      const res = await fetch(`${testServerUrl}/api/universe/bridges`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidBridge),
      });

      expect(res.status).toBe(400);
    });
  });
});
