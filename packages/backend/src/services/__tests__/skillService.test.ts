/**
 * SkillService Tests
 *
 * Tests for workbench-scoped CRUD operations and invocation guard.
 * RED phase: These tests will fail until Plan 02 creates the SkillService.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SkillService } from '../skillService.js';
import type { SkillId, Skill } from '@afw/shared';

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
      const skill = await service.createSkill({
        workbenchId: 'work',
        name: 'Quick Deploy',
        description: 'Deploy current branch to staging',
        triggerPattern: '/deploy staging',
        actionDescription: 'Run deploy pipeline for staging environment',
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
      await service.createSkill({
        workbenchId: 'work',
        name: 'Skill A',
        description: 'Desc A',
        triggerPattern: '/a',
        actionDescription: 'Action A',
      });

      await service.createSkill({
        workbenchId: 'explore',
        name: 'Skill B',
        description: 'Desc B',
        triggerPattern: '/b',
        actionDescription: 'Action B',
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
    it('should modify name/description and update updatedAt', async () => {
      const created = await service.createSkill({
        workbenchId: 'work',
        name: 'Original Name',
        description: 'Original Desc',
        triggerPattern: '/original',
        actionDescription: 'Original Action',
      });

      // Advance time to verify updatedAt changes
      vi.setSystemTime(new Date('2026-04-05T13:00:00Z'));

      const updated = await service.updateSkill(created.id, {
        name: 'Updated Name',
        description: 'Updated Desc',
      });

      expect(updated).not.toBeNull();
      expect(updated!.name).toBe('Updated Name');
      expect(updated!.description).toBe('Updated Desc');
      expect(updated!.updatedAt).not.toBe(created.createdAt);
    });
  });

  describe('deleteSkill', () => {
    it('should remove skill from storage', async () => {
      const skill = await service.createSkill({
        workbenchId: 'work',
        name: 'Temporary Skill',
        description: 'To be deleted',
        triggerPattern: '/temp',
        actionDescription: 'Temporary action',
      });

      await service.deleteSkill(skill.id);

      const retrieved = await service.getSkill(skill.id);
      expect(retrieved).toBeNull();

      const skills = await service.listSkills('work');
      expect(skills.length).toBe(0);
    });
  });

  describe('scope guard', () => {
    it('should not allow invoking skill from a different workbench', async () => {
      const skill = await service.createSkill({
        workbenchId: 'work',
        name: 'Work Only Skill',
        description: 'Scoped to work',
        triggerPattern: '/work-only',
        actionDescription: 'Work-scoped action',
      });

      // Attempt to invoke from a different workbench should be rejected
      await expect(
        service.invokeSkill(skill.id, 'explore')
      ).rejects.toThrow();
    });
  });
});
