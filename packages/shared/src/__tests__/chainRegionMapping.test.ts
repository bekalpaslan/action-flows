/**
 * Chain-to-Region Mapping Tests
 */

import { describe, it, expect, vi } from 'vitest';
import {
  mapActionToRegion,
  mapChainToBridges,
  getChainRegions,
  validateMapping,
  ACTION_TO_REGION_MAP,
  DEFAULT_REGION,
} from '../chainRegionMapping.js';
import type { RegionId } from '../universeTypes.js';

describe('chainRegionMapping', () => {
  describe('mapActionToRegion', () => {
    it('should map direct actions correctly', () => {
      expect(mapActionToRegion('code')).toBe('region-work' as RegionId);
      expect(mapActionToRegion('review')).toBe('region-review' as RegionId);
      expect(mapActionToRegion('analyze')).toBe('region-explore' as RegionId);
      expect(mapActionToRegion('fix')).toBe('region-maintenance' as RegionId);
      expect(mapActionToRegion('plan')).toBe('region-pm' as RegionId);
      expect(mapActionToRegion('configure')).toBe('region-settings' as RegionId);
      expect(mapActionToRegion('intel')).toBe('region-intel' as RegionId);
    });

    it('should handle prefix matching for nested actions', () => {
      expect(mapActionToRegion('code/backend')).toBe('region-work' as RegionId);
      expect(mapActionToRegion('code/frontend')).toBe('region-work' as RegionId);
      expect(mapActionToRegion('code/backend/api')).toBe('region-work' as RegionId);
      expect(mapActionToRegion('code/shared/types')).toBe('region-work' as RegionId);
    });

    it('should normalize actions (lowercase + trailing slash removal)', () => {
      expect(mapActionToRegion('CODE')).toBe('region-work' as RegionId);
      expect(mapActionToRegion('Review/')).toBe('region-review' as RegionId);
      expect(mapActionToRegion('ANALYZE/')).toBe('region-explore' as RegionId);
      expect(mapActionToRegion('Code/Backend/')).toBe('region-work' as RegionId);
    });

    it('should fallback to default region for unmapped actions', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      expect(mapActionToRegion('unknown-action')).toBe(DEFAULT_REGION);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Unmapped action "unknown-action"')
      );

      expect(mapActionToRegion('xyz123')).toBe(DEFAULT_REGION);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Unmapped action "xyz123"')
      );

      consoleWarnSpy.mockRestore();
    });

    it('should map all CONTEXTS.md work triggers to region-work', () => {
      const workActions = ['code', 'implement', 'build', 'create', 'develop', 'write'];
      workActions.forEach((action) => {
        expect(mapActionToRegion(action)).toBe('region-work' as RegionId);
      });
    });

    it('should map all CONTEXTS.md maintenance triggers to region-maintenance', () => {
      const maintenanceActions = ['fix', 'refactor', 'optimize', 'cleanup', 'debug'];
      maintenanceActions.forEach((action) => {
        expect(mapActionToRegion(action)).toBe('region-maintenance' as RegionId);
      });
    });

    it('should map all CONTEXTS.md explore triggers to region-explore', () => {
      const exploreActions = ['analyze', 'research', 'investigate', 'explore', 'learn'];
      exploreActions.forEach((action) => {
        expect(mapActionToRegion(action)).toBe('region-explore' as RegionId);
      });
    });

    it('should map all CONTEXTS.md review triggers to region-review', () => {
      const reviewActions = ['review', 'audit', 'second-opinion', 'inspect', 'validate'];
      reviewActions.forEach((action) => {
        expect(mapActionToRegion(action)).toBe('region-review' as RegionId);
      });
    });
  });

  describe('mapChainToBridges', () => {
    it('should create bridge transitions for multi-step chains', () => {
      const actions = ['analyze', 'plan', 'code', 'review'];
      const bridges = mapChainToBridges(actions);

      expect(bridges).toEqual([
        ['region-explore' as RegionId, 'region-pm' as RegionId],
        ['region-pm' as RegionId, 'region-work' as RegionId],
        ['region-work' as RegionId, 'region-review' as RegionId],
      ]);
    });

    it('should filter out self-loops (consecutive same regions)', () => {
      const actions = ['code', 'code', 'review'];
      const bridges = mapChainToBridges(actions);

      expect(bridges).toEqual([['region-work' as RegionId, 'region-review' as RegionId]]);
    });

    it('should handle empty chains', () => {
      expect(mapChainToBridges([])).toEqual([]);
    });

    it('should handle single-step chains', () => {
      expect(mapChainToBridges(['code'])).toEqual([]);
    });

    it('should handle chains with all same regions', () => {
      const actions = ['code', 'code/backend', 'code/frontend'];
      const bridges = mapChainToBridges(actions);

      expect(bridges).toEqual([]);
    });

    it('should create multiple transitions for complex chains', () => {
      const actions = [
        'analyze',
        'plan',
        'code/backend',
        'code/frontend',
        'test',
        'review',
        'second-opinion',
        'commit',
      ];
      const bridges = mapChainToBridges(actions);

      expect(bridges).toEqual([
        ['region-explore' as RegionId, 'region-pm' as RegionId],
        ['region-pm' as RegionId, 'region-work' as RegionId],
        // 'code/backend' and 'code/frontend' filtered (both region-work)
        ['region-work' as RegionId, 'region-test' as RegionId],
        ['region-test' as RegionId, 'region-review' as RegionId],
        // 'second-opinion' filtered (same region-review)
        ['region-review' as RegionId, 'region-archive' as RegionId],
      ]);
    });
  });

  describe('getChainRegions', () => {
    it('should return unique regions from chain actions', () => {
      const actions = ['analyze', 'code', 'code', 'review'];
      const regions = getChainRegions(actions);

      expect(regions).toEqual(
        new Set([
          'region-explore' as RegionId,
          'region-work' as RegionId,
          'region-review' as RegionId,
        ])
      );
      expect(regions.size).toBe(3);
    });

    it('should handle single-action chains', () => {
      const regions = getChainRegions(['code']);

      expect(regions).toEqual(new Set(['region-work' as RegionId]));
      expect(regions.size).toBe(1);
    });

    it('should handle empty chains', () => {
      const regions = getChainRegions([]);

      expect(regions).toEqual(new Set());
      expect(regions.size).toBe(0);
    });

    it('should deduplicate consecutive same actions', () => {
      const actions = ['code', 'code', 'code'];
      const regions = getChainRegions(actions);

      expect(regions).toEqual(new Set(['region-work' as RegionId]));
      expect(regions.size).toBe(1);
    });
  });

  describe('validateMapping', () => {
    it('should validate correct mappings', () => {
      expect(validateMapping('code', 'region-work' as RegionId)).toBe(true);
      expect(validateMapping('review', 'region-review' as RegionId)).toBe(true);
      expect(validateMapping('analyze', 'region-explore' as RegionId)).toBe(true);
    });

    it('should reject incorrect mappings', () => {
      expect(validateMapping('code', 'region-review' as RegionId)).toBe(false);
      expect(validateMapping('review', 'region-work' as RegionId)).toBe(false);
    });

    it('should validate normalized mappings', () => {
      expect(validateMapping('CODE/', 'region-work' as RegionId)).toBe(true);
      expect(validateMapping('Review/', 'region-review' as RegionId)).toBe(true);
    });
  });

  describe('ACTION_TO_REGION_MAP', () => {
    it('should have all required context mappings', () => {
      // Verify work context
      expect(ACTION_TO_REGION_MAP['code']).toBe('region-work' as RegionId);
      expect(ACTION_TO_REGION_MAP['code/backend']).toBe('region-work' as RegionId);
      expect(ACTION_TO_REGION_MAP['code/frontend']).toBe('region-work' as RegionId);

      // Verify maintenance context
      expect(ACTION_TO_REGION_MAP['fix']).toBe('region-maintenance' as RegionId);
      expect(ACTION_TO_REGION_MAP['refactor']).toBe('region-maintenance' as RegionId);

      // Verify explore context
      expect(ACTION_TO_REGION_MAP['analyze']).toBe('region-explore' as RegionId);
      expect(ACTION_TO_REGION_MAP['research']).toBe('region-explore' as RegionId);

      // Verify review context
      expect(ACTION_TO_REGION_MAP['review']).toBe('region-review' as RegionId);
      expect(ACTION_TO_REGION_MAP['audit']).toBe('region-review' as RegionId);

      // Verify settings context
      expect(ACTION_TO_REGION_MAP['configure']).toBe('region-settings' as RegionId);
      expect(ACTION_TO_REGION_MAP['setup']).toBe('region-settings' as RegionId);

      // Verify pm context
      expect(ACTION_TO_REGION_MAP['plan']).toBe('region-pm' as RegionId);
      expect(ACTION_TO_REGION_MAP['brainstorm']).toBe('region-pm' as RegionId);

      // Verify intel context
      expect(ACTION_TO_REGION_MAP['intel']).toBe('region-intel' as RegionId);
      expect(ACTION_TO_REGION_MAP['dossier']).toBe('region-intel' as RegionId);
    });

    it('should have all special action mappings', () => {
      expect(ACTION_TO_REGION_MAP['test']).toBe('region-test' as RegionId);
      expect(ACTION_TO_REGION_MAP['commit']).toBe('region-archive' as RegionId);
      expect(ACTION_TO_REGION_MAP['deploy']).toBe('region-deploy' as RegionId);
    });
  });

  describe('DEFAULT_REGION', () => {
    it('should be region-work', () => {
      expect(DEFAULT_REGION).toBe('region-work' as RegionId);
    });
  });
});
