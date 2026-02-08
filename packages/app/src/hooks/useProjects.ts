/**
 * useProjects hook
 * Manages project registry with CRUD operations
 */

import { useState, useEffect, useCallback } from 'react';
import { projectService, type CreateProjectRequest, type UpdateProjectRequest } from '../services/projectService';
import type { Project, ProjectId, ProjectAutoDetectionResult } from '@afw/shared';

export interface UseProjectsReturn {
  projects: Project[];
  loadProjects: () => Promise<void>;
  createProject: (data: CreateProjectRequest) => Promise<Project>;
  updateProject: (id: ProjectId, data: UpdateProjectRequest) => Promise<Project>;
  deleteProject: (id: ProjectId) => Promise<void>;
  detectProject: (cwd: string) => Promise<ProjectAutoDetectionResult>;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook for managing registered projects
 */
export function useProjects(): UseProjectsReturn {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Load all projects from backend
   * useCallback with empty deps to prevent recreation on every render
   */
  const loadProjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const loadedProjects = await projectService.listProjects();
      setProjects(loadedProjects);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load projects');
      setError(error);
      console.error('[useProjects] Error loading projects:', error);
    } finally {
      setIsLoading(false);
    }
  }, []); // Empty deps - function is stable across renders

  /**
   * Create a new project
   */
  const createProject = useCallback(async (data: CreateProjectRequest): Promise<Project> => {
    setIsLoading(true);
    setError(null);

    try {
      const newProject = await projectService.createProject(data);
      setProjects(prev => [newProject, ...prev]);
      return newProject;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create project');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Update an existing project
   */
  const updateProject = useCallback(async (id: ProjectId, data: UpdateProjectRequest): Promise<Project> => {
    setIsLoading(true);
    setError(null);

    try {
      const updated = await projectService.updateProject(id, data);
      setProjects(prev => prev.map(p => p.id === id ? updated : p));
      return updated;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update project');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Delete a project
   */
  const deleteProject = useCallback(async (id: ProjectId): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      await projectService.deleteProject(id);
      setProjects(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to delete project');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Auto-detect project metadata
   */
  const detectProject = useCallback(async (cwd: string): Promise<ProjectAutoDetectionResult> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await projectService.detectProject(cwd);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to detect project');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  return {
    projects,
    loadProjects,
    createProject,
    updateProject,
    deleteProject,
    detectProject,
    isLoading,
    error,
  };
}
