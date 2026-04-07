/**
 * Skill Service
 *
 * CRUD operations for per-workbench skills via Storage key-value pattern.
 * Skills are scoped to individual workbenches (D-06 scope isolation).
 */

import type { Storage } from '../storage/index.js';
import type { Skill, SkillId } from '@afw/shared';
import crypto from 'crypto';

/** Storage key prefix for skills */
const SKILL_KEY_PREFIX = 'skill:';

/**
 * Service for managing per-workbench skills.
 * Uses Storage key-value operations (set/get/keys/delete).
 */
export class SkillService {
  constructor(private storage: Storage) {}

  /**
   * Create a new skill for a workbench.
   * Generates UUID as SkillId, sets createdAt to ISO string.
   */
  async createSkill(
    workbenchId: string,
    data: Omit<Skill, 'id' | 'createdAt' | 'workbenchId'>
  ): Promise<Skill> {
    const id = crypto.randomUUID() as unknown as SkillId;
    const skill: Skill = {
      id,
      workbenchId,
      name: data.name,
      description: data.description,
      trigger: data.trigger,
      action: data.action,
      createdAt: new Date().toISOString(),
    };

    const key = `${SKILL_KEY_PREFIX}${workbenchId}:${skill.id}`;
    await Promise.resolve(this.storage.set!(key, JSON.stringify(skill)));

    console.log(`[SkillService] Created skill "${skill.name}" for workbench ${workbenchId}`);
    return skill;
  }

  /**
   * List all skills for a workbench, sorted by createdAt descending.
   */
  async listSkills(workbenchId: string): Promise<Skill[]> {
    const pattern = `${SKILL_KEY_PREFIX}${workbenchId}:*`;
    const keys = await Promise.resolve(this.storage.keys!(pattern));

    const skills: Skill[] = [];
    for (const key of keys) {
      const data = await Promise.resolve(this.storage.get!(key));
      if (data) {
        try {
          const skill = JSON.parse(data) as Skill;
          // Verify workbench scope isolation (D-06)
          if (skill.workbenchId === workbenchId) {
            skills.push(skill);
          }
        } catch (e) {
          console.warn(`[SkillService] Failed to parse skill from key ${key}:`, e);
        }
      }
    }

    // Sort by createdAt descending (newest first)
    skills.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return skills;
  }

  /**
   * Get a single skill by workbenchId and skillId.
   */
  async getSkill(workbenchId: string, skillId: SkillId): Promise<Skill | null> {
    const key = `${SKILL_KEY_PREFIX}${workbenchId}:${skillId}`;
    const data = await Promise.resolve(this.storage.get!(key));

    if (!data) {
      return null;
    }

    try {
      const skill = JSON.parse(data) as Skill;
      // Verify workbench scope isolation (D-06)
      if (skill.workbenchId !== workbenchId) {
        throw new Error(`Skill ${skillId} does not belong to workbench ${workbenchId}`);
      }
      return skill;
    } catch (e) {
      if (e instanceof SyntaxError) {
        console.warn(`[SkillService] Failed to parse skill ${skillId}:`, e);
        return null;
      }
      throw e;
    }
  }

  /**
   * Update an existing skill. Merges partial updates with existing data.
   * Validates workbench scope isolation before updating.
   */
  async updateSkill(
    workbenchId: string,
    skillId: SkillId,
    updates: Partial<Pick<Skill, 'name' | 'description' | 'trigger' | 'action'>>
  ): Promise<Skill | null> {
    const existing = await this.getSkill(workbenchId, skillId);
    if (!existing) {
      return null;
    }

    // Verify workbench scope isolation (D-06)
    if (existing.workbenchId !== workbenchId) {
      throw new Error(`Skill ${skillId} does not belong to workbench ${workbenchId}`);
    }

    const updated: Skill = {
      ...existing,
      ...updates,
    };

    const key = `${SKILL_KEY_PREFIX}${workbenchId}:${skillId}`;
    await Promise.resolve(this.storage.set!(key, JSON.stringify(updated)));

    console.log(`[SkillService] Updated skill "${updated.name}" for workbench ${workbenchId}`);
    return updated;
  }

  /**
   * Delete a skill. Validates workbench scope isolation before deleting.
   */
  async deleteSkill(workbenchId: string, skillId: SkillId): Promise<boolean> {
    // Verify the skill exists and belongs to this workbench (D-06)
    const existing = await this.getSkill(workbenchId, skillId);
    if (!existing) {
      return false;
    }

    if (existing.workbenchId !== workbenchId) {
      throw new Error(`Skill ${skillId} does not belong to workbench ${workbenchId}`);
    }

    const key = `${SKILL_KEY_PREFIX}${workbenchId}:${skillId}`;
    const result = await Promise.resolve(this.storage.delete!(key));

    console.log(`[SkillService] Deleted skill "${existing.name}" from workbench ${workbenchId}`);
    return result;
  }
}
