/**
 * Project Service
 * Frontend API client for project management
 */

import type { Project, ProjectId, ProjectAutoDetectionResult } from '@afw/shared';

/**
 * Request types (matching backend schemas)
 */
export interface CreateProjectRequest {
  name: string;
  cwd: string;
  defaultCliFlags?: string[];
  defaultPromptTemplate?: string | null;
  mcpConfigPath?: string | null;
  envVars?: Record<string, string>;
  quickActionPresets?: Array<{
    id: string;
    label: string;
    icon: string;
    value: string;
    contextPatterns?: string[];
    alwaysShow?: boolean;
  }>;
  description?: string | null;
}

export interface UpdateProjectRequest {
  name?: string;
  cwd?: string;
  defaultCliFlags?: string[];
  defaultPromptTemplate?: string | null;
  mcpConfigPath?: string | null;
  envVars?: Record<string, string>;
  quickActionPresets?: Array<{
    id: string;
    label: string;
    icon: string;
    value: string;
    contextPatterns?: string[];
    alwaysShow?: boolean;
  }>;
  description?: string | null;
}

/**
 * Project Service
 * Provides API methods for managing registered projects
 */
export class ProjectService {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:3001') {
    this.baseUrl = baseUrl;
  }

  /**
   * List all projects
   */
  async listProjects(): Promise<Project[]> {
    const response = await fetch(`${this.baseUrl}/api/projects`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `Failed to list projects: ${response.statusText}`);
    }

    const data = await response.json();
    return data.projects;
  }

  /**
   * Get a single project by ID
   */
  async getProject(id: ProjectId): Promise<Project> {
    const response = await fetch(`${this.baseUrl}/api/projects/${id}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `Failed to get project: ${response.statusText}`);
    }

    const data = await response.json();
    return data.project;
  }

  /**
   * Create a new project
   */
  async createProject(data: CreateProjectRequest): Promise<Project> {
    const response = await fetch(`${this.baseUrl}/api/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `Failed to create project: ${response.statusText}`);
    }

    const result = await response.json();
    return result.project;
  }

  /**
   * Update an existing project
   */
  async updateProject(id: ProjectId, data: UpdateProjectRequest): Promise<Project> {
    const response = await fetch(`${this.baseUrl}/api/projects/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `Failed to update project: ${response.statusText}`);
    }

    const result = await response.json();
    return result.project;
  }

  /**
   * Delete a project
   */
  async deleteProject(id: ProjectId): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/projects/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `Failed to delete project: ${response.statusText}`);
    }
  }

  /**
   * Auto-detect project metadata from a working directory
   */
  async detectProject(cwd: string): Promise<ProjectAutoDetectionResult> {
    const response = await fetch(`${this.baseUrl}/api/projects/detect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cwd }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `Failed to detect project: ${response.statusText}`);
    }

    const result = await response.json();
    return result.detected;
  }
}

// Singleton instance
export const projectService = new ProjectService();
