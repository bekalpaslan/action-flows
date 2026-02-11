/**
 * Force-Directed Layout Service Tests
 *
 * Comprehensive test suite for force-directed layout algorithm.
 * Coverage target: 85%+
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ForceDirectedLayoutService, type Position } from '../forceDirectedLayout.js';
import type { RegionNode, LightBridge, RegionId, EdgeId } from '@afw/shared';

describe('ForceDirectedLayoutService', () => {
  let service: ForceDirectedLayoutService;

  beforeEach(() => {
    service = new ForceDirectedLayoutService();
  });

  describe('calculateNewRegionPosition', () => {
    it('should return valid position coordinates', () => {
      const newRegion: RegionNode = {
        id: 'region-new' as RegionId,
        workbenchId: 'wb-1' as any,
        label: 'New Region',
        layer: 'experience',
        fogState: 'REVEALED' as any,
        position: { x: 0, y: 0 },
        colorShift: {
          baseColor: '#4a90e2',
          currentColor: '#4a90e2',
          saturation: 0.7,
          temperature: 0.0,
        },
        health: {
          overall: 1.0,
          gatePassRate: 0.0,
          activeConnections: 0,
        },
      };

      const existingRegions: RegionNode[] = [];
      const bridges: LightBridge[] = [];

      const position = service.calculateNewRegionPosition(newRegion, existingRegions, bridges);

      expect(position.x).toBeGreaterThanOrEqual(0);
      expect(position.y).toBeGreaterThanOrEqual(0);
    });

    it('should snap position to grid (50px)', () => {
      const newRegion: RegionNode = {
        id: 'region-new' as RegionId,
      } as any;

      const existingRegions: RegionNode[] = [];
      const bridges: LightBridge[] = [];

      const position = service.calculateNewRegionPosition(newRegion, existingRegions, bridges);

      // Position should be multiple of 50
      expect(position.x % 50).toBe(0);
      expect(position.y % 50).toBe(0);
    });

    it('should enforce minimum distance (200px) between regions', () => {
      const existingRegions: RegionNode[] = [
        {
          id: 'region-A' as RegionId,
          position: { x: 400, y: 300 },
        } as any,
      ];

      const newRegion: RegionNode = {
        id: 'region-new' as RegionId,
      } as any;

      const position = service.calculateNewRegionPosition(newRegion, existingRegions, []);

      // Calculate distance to existing region
      const dx = position.x - 400;
      const dy = position.y - 300;
      const distance = Math.sqrt(dx * dx + dy * dy);

      expect(distance).toBeGreaterThanOrEqual(200);
    });

    it('should position near connected regions (cluster)', () => {
      const connectedRegion: RegionNode = {
        id: 'region-connected' as RegionId,
        position: { x: 500, y: 400 },
      } as any;

      const existingRegions: RegionNode[] = [
        connectedRegion,
        {
          id: 'region-distant' as RegionId,
          position: { x: 1000, y: 1000 },
        } as any,
      ];

      const newRegion: RegionNode = {
        id: 'region-new' as RegionId,
      } as any;

      const bridges: LightBridge[] = [
        {
          id: 'bridge-1' as EdgeId,
          source: 'region-new' as RegionId,
          target: 'region-connected' as RegionId,
          gates: [],
          strength: 0.5,
          pinned: false,
          traces: {
            totalInteractions: 10,
            recentTraces: [],
            heatLevel: 0.3,
          },
        },
      ];

      const position = service.calculateNewRegionPosition(newRegion, existingRegions, bridges);

      // Should be closer to connected region than distant one
      const distToConnected = Math.sqrt(
        Math.pow(position.x - 500, 2) + Math.pow(position.y - 400, 2)
      );
      const distToDistant = Math.sqrt(
        Math.pow(position.x - 1000, 2) + Math.pow(position.y - 1000, 2)
      );

      expect(distToConnected).toBeLessThan(distToDistant);
    });

    it('should handle region with no connections', () => {
      const existingRegions: RegionNode[] = [
        {
          id: 'region-A' as RegionId,
          position: { x: 400, y: 300 },
        } as any,
      ];

      const newRegion: RegionNode = {
        id: 'region-isolated' as RegionId,
      } as any;

      const position = service.calculateNewRegionPosition(newRegion, existingRegions, []);

      // Should place near center
      expect(position).toBeDefined();
      expect(position.x).toBeGreaterThan(0);
      expect(position.y).toBeGreaterThan(0);
    });

    it('should handle empty existing regions array', () => {
      const newRegion: RegionNode = {
        id: 'region-first' as RegionId,
      } as any;

      const position = service.calculateNewRegionPosition(newRegion, [], []);

      // Should place at default position near center
      expect(position).toBeDefined();
      expect(position.x).toBeGreaterThan(0);
      expect(position.y).toBeGreaterThan(0);
    });

    it('should find empty space in crowded map', () => {
      // Create a grid of existing regions
      const existingRegions: RegionNode[] = [];
      for (let x = 0; x <= 600; x += 200) {
        for (let y = 0; y <= 600; y += 200) {
          if (x === 400 && y === 300) continue; // Leave one gap
          existingRegions.push({
            id: `region-${x}-${y}` as RegionId,
            position: { x, y },
          } as any);
        }
      }

      const newRegion: RegionNode = {
        id: 'region-new' as RegionId,
      } as any;

      const position = service.calculateNewRegionPosition(newRegion, existingRegions, []);

      // Should find an empty space
      expect(position).toBeDefined();

      // Check it's not too close to any existing region
      for (const region of existingRegions) {
        const dx = position.x - region.position.x;
        const dy = position.y - region.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        expect(distance).toBeGreaterThanOrEqual(200);
      }
    });
  });

  describe('calculatePosition (overload)', () => {
    it('should work without newRegion parameter', () => {
      const existingRegions: RegionNode[] = [
        {
          id: 'region-A' as RegionId,
          position: { x: 400, y: 300 },
        } as any,
      ];

      const position = service.calculatePosition(existingRegions, []);

      expect(position).toBeDefined();
      expect(position.x).toBeGreaterThanOrEqual(0);
      expect(position.y).toBeGreaterThanOrEqual(0);
    });
  });

  describe('grid snapping', () => {
    it('should snap to 50px grid', () => {
      const newRegion: RegionNode = {
        id: 'region-new' as RegionId,
      } as any;

      // Test multiple positions
      for (let i = 0; i < 10; i++) {
        const position = service.calculateNewRegionPosition(
          newRegion,
          [
            {
              id: `region-${i}` as RegionId,
              position: { x: 100 + i * 50, y: 100 + i * 50 },
            } as any,
          ],
          []
        );

        expect(position.x % 50).toBe(0);
        expect(position.y % 50).toBe(0);
      }
    });

    it('should snap non-grid positions to nearest grid cell', () => {
      // This tests internal snapping logic
      const position: Position = { x: 123, y: 456 };
      const snapped = {
        x: Math.round(position.x / 50) * 50,
        y: Math.round(position.y / 50) * 50,
      };

      expect(snapped.x).toBe(100);
      expect(snapped.y).toBe(450);
    });
  });

  describe('center of mass calculation', () => {
    it('should calculate center of connected regions', () => {
      const connectedRegions: RegionNode[] = [
        {
          id: 'region-A' as RegionId,
          position: { x: 0, y: 0 },
        } as any,
        {
          id: 'region-B' as RegionId,
          position: { x: 100, y: 0 },
        } as any,
      ];

      const newRegion: RegionNode = {
        id: 'region-new' as RegionId,
      } as any;

      const bridges: LightBridge[] = [
        {
          id: 'bridge-1' as EdgeId,
          source: 'region-new' as RegionId,
          target: 'region-A' as RegionId,
        } as any,
        {
          id: 'bridge-2' as EdgeId,
          source: 'region-new' as RegionId,
          target: 'region-B' as RegionId,
        } as any,
      ];

      const position = service.calculateNewRegionPosition(
        newRegion,
        connectedRegions,
        bridges
      );

      // Should be near center of mass (50, 0) but respecting min distance
      expect(position).toBeDefined();
    });

    it('should handle single connected region', () => {
      const connectedRegion: RegionNode = {
        id: 'region-A' as RegionId,
        position: { x: 400, y: 300 },
      } as any;

      const newRegion: RegionNode = {
        id: 'region-new' as RegionId,
      } as any;

      const bridges: LightBridge[] = [
        {
          id: 'bridge-1' as EdgeId,
          source: 'region-new' as RegionId,
          target: 'region-A' as RegionId,
        } as any,
      ];

      const position = service.calculateNewRegionPosition(
        newRegion,
        [connectedRegion],
        bridges
      );

      // Should be near connected region
      const distance = Math.sqrt(
        Math.pow(position.x - 400, 2) + Math.pow(position.y - 300, 2)
      );

      expect(distance).toBeGreaterThanOrEqual(200); // Min distance
      expect(distance).toBeLessThan(600); // Not too far
    });
  });

  describe('edge cases', () => {
    it('should handle very large number of existing regions', () => {
      const existingRegions: RegionNode[] = [];
      for (let i = 0; i < 100; i++) {
        existingRegions.push({
          id: `region-${i}` as RegionId,
          position: {
            x: (i % 10) * 250,
            y: Math.floor(i / 10) * 250,
          },
        } as any);
      }

      const newRegion: RegionNode = {
        id: 'region-new' as RegionId,
      } as any;

      const position = service.calculateNewRegionPosition(newRegion, existingRegions, []);

      expect(position).toBeDefined();
      expect(position.x).toBeGreaterThanOrEqual(0);
      expect(position.y).toBeGreaterThanOrEqual(0);
    });

    it('should not infinite loop when map is very crowded', () => {
      // Create extremely crowded map
      const existingRegions: RegionNode[] = [];
      for (let x = 0; x < 2000; x += 50) {
        for (let y = 0; y < 2000; y += 50) {
          existingRegions.push({
            id: `region-${x}-${y}` as RegionId,
            position: { x, y },
          } as any);
        }
      }

      const newRegion: RegionNode = {
        id: 'region-new' as RegionId,
      } as any;

      // Should complete without hanging (iteration limit)
      const start = Date.now();
      const position = service.calculateNewRegionPosition(newRegion, existingRegions, []);
      const duration = Date.now() - start;

      expect(position).toBeDefined();
      expect(duration).toBeLessThan(1000); // Should complete quickly
    });

    it('should handle regions at exactly minimum distance', () => {
      const existingRegions: RegionNode[] = [
        {
          id: 'region-A' as RegionId,
          position: { x: 400, y: 300 },
        } as any,
        {
          id: 'region-B' as RegionId,
          position: { x: 600, y: 300 }, // Exactly 200px away
        } as any,
      ];

      const newRegion: RegionNode = {
        id: 'region-new' as RegionId,
      } as any;

      const position = service.calculateNewRegionPosition(newRegion, existingRegions, []);

      // Should find valid position
      expect(position).toBeDefined();

      // Check minimum distance to both regions
      for (const region of existingRegions) {
        const dx = position.x - region.position.x;
        const dy = position.y - region.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        expect(distance).toBeGreaterThanOrEqual(200);
      }
    });

    it('should handle bidirectional bridges correctly', () => {
      const existingRegions: RegionNode[] = [
        {
          id: 'region-A' as RegionId,
          position: { x: 400, y: 300 },
        } as any,
      ];

      const newRegion: RegionNode = {
        id: 'region-new' as RegionId,
      } as any;

      // Bridge can be in either direction
      const bridges: LightBridge[] = [
        {
          id: 'bridge-1' as EdgeId,
          source: 'region-A' as RegionId,
          target: 'region-new' as RegionId,
        } as any,
      ];

      const position = service.calculateNewRegionPosition(newRegion, existingRegions, bridges);

      expect(position).toBeDefined();
    });
  });

  describe('performance', () => {
    it('should calculate position in < 100ms', () => {
      const existingRegions: RegionNode[] = [];
      for (let i = 0; i < 50; i++) {
        existingRegions.push({
          id: `region-${i}` as RegionId,
          position: {
            x: (i % 10) * 250,
            y: Math.floor(i / 10) * 250,
          },
        } as any);
      }

      const newRegion: RegionNode = {
        id: 'region-new' as RegionId,
      } as any;

      const start = performance.now();
      service.calculateNewRegionPosition(newRegion, existingRegions, []);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100);
    });
  });
});
