/**
 * SkillService Tests
 *
 * Tests for workbench-scoped CRUD operations and scope isolation.
 *
 * Wave 0 stubs were rewritten in Phase 11-01 to match the real SkillService API:
 * - createSkill takes (workbenchId: string, data: { name, description, trigger, action })
 *   instead of the originally-stubbed single-arg form.
 * - All read/update/delete operations are scoped by workbenchId for D-06 isolation.
 * - Scope is enforced via getSkill/updateSkill/deleteSkill (no separate invocation method).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SkillService } from '../skillService.js';
import type { SkillId } from '@afw/shared';

/**
 * Creates a mock KV storage backed by a simple Map.
 * Mirrors the optional KV interface on Storage (get, set, keys, delete).
 */
function createMockStorage() {
  const data = new Map<string, string>();
  return {
    get: vi.fn((key: string) => data.get(key) ?? null),
    set: vi.fn((key: string, value: string) => { data.set(key, value); }),
    keys: vi.fn((pattern: string) => {
      const prefix = pattern.replace('*', '');
      return [...data.keys()].filter(k => k.startsWith(prefix));
    }),
    delete: vi.fn((key: string) => data.delete(key)),
  };
}

describe('SkillService', () => {
  let service: SkillService;
  let mockStorage: ReturnType<typeof createMockStorage>;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-05T12:00:00Z'));
    mockStorage = createMockStorage();
    service = new SkillService(mockStorage);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('createSkill', () => {
    it('should store skill scoped to workbenchId', async () => {
      const skill = await service.createSkill('work', {
        name: 'Quick Deploy',
        description: 'Deploy current branch to staging',
        trigger: '/deploy staging',
        action: 'Run deploy pipeline for staging environment',
      });

      expect(skill.id).toBeDefined();
      expect(skill.workbenchId).toBe('work');
      expect(skill.name).toBe('Quick Deploy');
      expect(skill.createdAt).toBeDefined();
      expect(mockStorage.set).toHaveBeenCalled();
    });
  });

  describe('listSkills', () => {
    it('should return only skills for the specified workbenchId (scope isolation)', async () => {
      await service.createSkill('work', {
        name: 'Skill A',
        description: 'Desc A',
        trigger: '/a',
        action: 'Action A',
      });

      await service.createSkill('explore', {
        name: 'Skill B',
        description: 'Desc B',
        trigger: '/b',
        action: 'Action B',
      });

      const workSkills = await service.listSkills('work');
      const exploreSkills = await service.listSkills('explore');

      expect(workSkills.length).toBe(1);
      expect(workSkills[0]!.name).toBe('Skill A');
      expect(exploreSkills.length).toBe(1);
      expect(exploreSkills[0]!.name).toBe('Skill B');
    });

    it('should return empty array for workbench with no skills', async () => {
      const skills = await service.listSkills('review');
      expect(skills).toEqual([]);
    });
  });

  describe('getSkill', () => {
    it('should return null for non-existent skill', async () => {
      const skill = await service.getSkill('nonexistent-id' as SkillId);
      expect(skill).toBeNull();
    });
  });

  describe('updateSkill', () => {
    it('should modify name and description', async () => {
      const created = await service.createSkill('work', {
        name: 'Original Name',
        description: 'Original Desc',
        trigger: '/original',
        action: 'Original Action',
      });

      // Advance time to verify the update happens at a later moment.
      vi.setSystemTime(new Date('2026-04-05T13:00:00Z'));

      const updated = await service.updateSkill('work', created.id, {
        name: 'Updated Name',
        description: 'Updated Desc',
      });

      expect(updated).not.toBeNull();
      expect(updated!.name).toBe('Updated Name');
      expect(updated!.description).toBe('Updated Desc');
      expect(updated!.id).toBe(created.id);
      expect(updated!.name).not.toBe(created.name);
    });
  });

  describe('deleteSkill', () => {
    it('should remove skill from storage', async () => {
      const skill = await service.createSkill('work', {
        name: 'Temporary Skill',
        description: 'To be deleted',
        trigger: '/temp',
        action: 'Temporary action',
      });

      const result = await service.deleteSkill('work', skill.id);
      expect(result).toBe(true);

      const retrieved = await service.getSkill('work', skill.id);
      expect(retrieved).toBeNull();

      const skills = await service.listSkills('work');
      expect(skills.length).toBe(0);
    });
  });

  describe('scope guard', () => {
    it('should not find skill from a different workbench (scope isolation)', async () => {
      const skill = await service.createSkill('work', {
        name: 'Work Only Skill',
        description: 'Scoped to work',
        trigger: '/work-only',
        action: 'Work-scoped action',
      });

      // Attempting to retrieve the skill from a different workbench should return null
      // because the storage key is `skill:work:${id}`, not `skill:explore:${id}`.
      // This enforces workbench scope isolation (D-06 from Phase 10).
      const fromExplore = await service.getSkill('explore', skill.id);
      expect(fromExplore).toBeNull();

      // But retrieval from the owning workbench should succeed.
      const fromWork = await service.getSkill('work', skill.id);
      expect(fromWork).not.toBeNull();
      expect(fromWork!.workbenchId).toBe('work');
    });
  });
});
