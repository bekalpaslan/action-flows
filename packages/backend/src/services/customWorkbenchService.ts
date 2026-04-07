import type { CustomWorkbench, CustomWorkbenchId } from '@afw/shared';
import { isDefaultWorkbench, toCustomWorkbenchId } from '@afw/shared';

/**
 * Service for managing custom workbenches (CRUD).
 *
 * Custom workbenches extend the 7 default workbenches with user-created
 * domains, each with its own session, pipeline, chat, and flows.
 *
 * Default workbenches are protected from modification/deletion (D-11).
 */
export class CustomWorkbenchService {
  /** In-memory store keyed by CustomWorkbenchId */
  private workbenches = new Map<CustomWorkbenchId, CustomWorkbench>();

  /**
   * Create a new custom workbench.
   * Generates an ID from the name slug. Validates name is non-empty,
   * generated ID is not a default workbench ID, and name is unique.
   */
  async createWorkbench(data: {
    name: string;
    iconName: string;
    greeting: string;
    tone: string;
    systemPromptSnippet: string;
  }): Promise<CustomWorkbench> {
    const trimmedName = data.name.trim();
    if (!trimmedName) {
      throw new Error('Workbench name is required');
    }

    // Generate slug-based ID
    const slug = trimmedName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const rawId = `custom-${slug}`;

    // Guard: generated ID must not collide with a default workbench
    if (isDefaultWorkbench(rawId)) {
      throw new Error('Generated workbench ID conflicts with a default workbench');
    }

    const id = toCustomWorkbenchId(rawId);

    // Check name uniqueness (case-insensitive)
    const existing = await this.listWorkbenches();
    const nameLower = trimmedName.toLowerCase();
    const duplicate = existing.find(
      (wb) => wb.name.toLowerCase() === nameLower
    );
    if (duplicate) {
      throw new Error('A workbench with this name already exists.');
    }

    const workbench: CustomWorkbench = {
      id,
      name: trimmedName,
      iconName: data.iconName,
      greeting: data.greeting,
      tone: data.tone,
      systemPromptSnippet: data.systemPromptSnippet,
      createdAt: new Date().toISOString(),
    };

    this.workbenches.set(id, workbench);
    return workbench;
  }

  /**
   * List all custom workbenches, sorted by createdAt ascending
   * (oldest first for stable sidebar order).
   */
  async listWorkbenches(): Promise<CustomWorkbench[]> {
    const all = Array.from(this.workbenches.values());
    return all.sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }

  /**
   * Get a single custom workbench by ID.
   */
  async getWorkbench(id: CustomWorkbenchId): Promise<CustomWorkbench | null> {
    return this.workbenches.get(id) ?? null;
  }

  /**
   * Update a custom workbench. Rejects modifications to default workbenches.
   */
  async updateWorkbench(
    id: CustomWorkbenchId,
    updates: Partial<Pick<CustomWorkbench, 'name' | 'iconName' | 'greeting' | 'tone' | 'systemPromptSnippet'>>
  ): Promise<CustomWorkbench | null> {
    // D-11 guard: Cannot modify default workbenches
    if (isDefaultWorkbench(id as string)) {
      throw new Error('Cannot modify default workbenches');
    }

    const existing = this.workbenches.get(id);
    if (!existing) {
      return null;
    }

    // If name is being updated, check uniqueness
    if (updates.name !== undefined) {
      const trimmedName = updates.name.trim();
      if (!trimmedName) {
        throw new Error('Workbench name is required');
      }
      const all = await this.listWorkbenches();
      const nameLower = trimmedName.toLowerCase();
      const duplicate = all.find(
        (wb) => wb.id !== id && wb.name.toLowerCase() === nameLower
      );
      if (duplicate) {
        throw new Error('A workbench with this name already exists.');
      }
      updates = { ...updates, name: trimmedName };
    }

    const updated: CustomWorkbench = { ...existing, ...updates };
    this.workbenches.set(id, updated);
    return updated;
  }

  /**
   * Delete a custom workbench. Rejects deletion of default workbenches.
   * Cascade deletes related data keys (future: skills, schedules).
   */
  async deleteWorkbench(id: CustomWorkbenchId): Promise<boolean> {
    // D-11 guard: Cannot delete default workbenches
    if (isDefaultWorkbench(id as string)) {
      throw new Error('Cannot modify default workbenches');
    }

    if (!this.workbenches.has(id)) {
      return false;
    }

    this.workbenches.delete(id);
    // Cascade delete would clean up skill:${id}:* and schedule:${id}:* keys
    // when those features are wired to storage
    return true;
  }
}
