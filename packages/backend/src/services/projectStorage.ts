/**
 * Project Storage Service
 * File-based JSON storage for registered projects
 */

import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import type { Project, ProjectId, Timestamp } from '@afw/shared';

/**
 * Project Storage
 * Manages persistent storage of registered projects
 */
export class ProjectStorage {
  private projects: Map<ProjectId, Project> = new Map();
  private storagePath: string;
  private writeMutex: Promise<void> = Promise.resolve();
  private loaded: boolean = false;

  constructor() {
    // Determine storage path based on platform
    const homeDir = process.env.HOME || process.env.USERPROFILE || '/tmp';
    const appDataDir = process.env.APPDATA || path.join(homeDir, '.config');

    // Windows: %APPDATA%/actionflows/projects.json
    // macOS/Linux: ~/.actionflows/projects.json
    if (process.platform === 'win32' && process.env.APPDATA) {
      this.storagePath = path.join(process.env.APPDATA, 'actionflows', 'projects.json');
    } else {
      this.storagePath = path.join(homeDir, '.actionflows', 'projects.json');
    }

    // Allow override via environment variable
    if (process.env.AFW_PROJECT_CONFIG_PATH) {
      this.storagePath = process.env.AFW_PROJECT_CONFIG_PATH;
    }

    console.log(`[ProjectStorage] Storage path: ${this.storagePath}`);
  }

  /**
   * Initialize storage (load from file)
   */
  async initialize(): Promise<void> {
    if (this.loaded) {
      return;
    }

    try {
      await this.loadFromFile();
      this.loaded = true;
      console.log(`[ProjectStorage] Loaded ${this.projects.size} projects`);
    } catch (error) {
      console.error('[ProjectStorage] Error loading projects:', error);
      // Continue with empty map
      this.loaded = true;
    }
  }

  /**
   * Load projects from file
   */
  private async loadFromFile(): Promise<void> {
    try {
      // Ensure directory exists
      const dir = path.dirname(this.storagePath);
      await fs.mkdir(dir, { recursive: true });

      // Check if file exists
      try {
        await fs.access(this.storagePath);
      } catch {
        // File doesn't exist yet - that's okay
        console.log('[ProjectStorage] No existing projects file, starting fresh');
        return;
      }

      // Read and parse file
      const content = await fs.readFile(this.storagePath, 'utf-8');
      const data = JSON.parse(content);

      // Validate structure
      if (!Array.isArray(data.projects)) {
        throw new Error('Invalid projects file format');
      }

      // Load into map
      this.projects.clear();
      for (const project of data.projects) {
        this.projects.set(project.id as ProjectId, project);
      }

      console.log(`[ProjectStorage] Loaded ${this.projects.size} projects from file`);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        // File doesn't exist - that's okay
        return;
      }
      throw error;
    }
  }

  /**
   * Save projects to file (atomic write)
   */
  private async saveToFile(): Promise<void> {
    // Serialize the write operation to prevent concurrent writes
    this.writeMutex = this.writeMutex.then(async () => {
      const tempPath = `${this.storagePath}.tmp`;
      try {
        // Ensure directory exists
        const dir = path.dirname(this.storagePath);
        await fs.mkdir(dir, { recursive: true });

        // Convert map to array
        const projects = Array.from(this.projects.values());

        // Prepare data
        const data = {
          version: 1,
          projects,
          lastModified: new Date().toISOString(),
        };

        // Atomic write: write to temp file, then rename
        await fs.writeFile(tempPath, JSON.stringify(data, null, 2), 'utf-8');
        await fs.rename(tempPath, this.storagePath);

        console.log(`[ProjectStorage] Saved ${projects.length} projects to file`);
      } catch (error) {
        console.error('[ProjectStorage] Error saving projects:', error);

        // Cleanup temp file if rename failed
        try {
          await fs.unlink(tempPath);
        } catch {
          // Temp file might not exist - that's okay
        }

        throw error;
      }
    });

    return this.writeMutex;
  }

  /**
   * Get all projects (sorted by lastUsedAt desc)
   */
  async getAllProjects(): Promise<Project[]> {
    await this.initialize();

    const projects = Array.from(this.projects.values());
    // Sort by lastUsedAt descending (most recent first)
    projects.sort((a, b) => {
      const aTime = new Date(a.lastUsedAt).getTime();
      const bTime = new Date(b.lastUsedAt).getTime();
      return bTime - aTime;
    });

    return projects;
  }

  /**
   * Get a single project by ID
   */
  async getProject(id: ProjectId): Promise<Project | null> {
    await this.initialize();
    return this.projects.get(id) || null;
  }

  /**
   * Create a new project
   */
  async createProject(
    data: Omit<Project, 'id' | 'createdAt' | 'lastUsedAt'>
  ): Promise<Project> {
    await this.initialize();

    const now = new Date().toISOString() as Timestamp;
    const project: Project = {
      ...data,
      id: randomUUID() as ProjectId,
      createdAt: now,
      lastUsedAt: now,
    };

    this.projects.set(project.id, project);
    await this.saveToFile();

    console.log(`[ProjectStorage] Created project: ${project.name} (${project.id})`);
    return project;
  }

  /**
   * Update an existing project
   */
  async updateProject(
    id: ProjectId,
    data: Partial<Omit<Project, 'id' | 'createdAt' | 'lastUsedAt'>>
  ): Promise<Project> {
    await this.initialize();

    const existing = this.projects.get(id);
    if (!existing) {
      throw new Error(`Project not found: ${id}`);
    }

    const updated: Project = {
      ...existing,
      ...data,
      id: existing.id, // Never change ID
      createdAt: existing.createdAt, // Never change creation time
    };

    this.projects.set(id, updated);
    await this.saveToFile();

    console.log(`[ProjectStorage] Updated project: ${updated.name} (${id})`);
    return updated;
  }

  /**
   * Delete a project
   */
  async deleteProject(id: ProjectId): Promise<boolean> {
    await this.initialize();

    const existed = this.projects.delete(id);
    if (existed) {
      await this.saveToFile();
      console.log(`[ProjectStorage] Deleted project: ${id}`);
    }

    return existed;
  }

  /**
   * Update lastUsedAt timestamp for a project
   */
  async updateLastUsed(id: ProjectId): Promise<void> {
    await this.initialize();

    const project = this.projects.get(id);
    if (!project) {
      console.warn(`[ProjectStorage] Cannot update lastUsedAt for non-existent project: ${id}`);
      return;
    }

    project.lastUsedAt = new Date().toISOString() as Timestamp;
    this.projects.set(id, project);

    // Fire-and-forget save (don't block session start)
    this.saveToFile().catch(error => {
      console.error('[ProjectStorage] Error updating lastUsedAt:', error);
    });
  }
}

// Singleton instance
export const projectStorage = new ProjectStorage();
