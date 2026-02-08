/**
 * Project Selector
 * Dropdown for selecting registered projects
 */

import React from 'react';
import type { Project, ProjectId } from '@afw/shared';

interface ProjectSelectorProps {
  projects: Project[];
  selectedProjectId: ProjectId | null;
  onSelectProject: (project: Project | null) => void;
  onAddNewProject: () => void;
}

/**
 * Project Selector Component
 * Allows users to select from registered projects or add a new one
 */
export function ProjectSelector({
  projects,
  selectedProjectId,
  onSelectProject,
  onAddNewProject,
}: ProjectSelectorProps) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;

    if (value === '__add_new__') {
      onAddNewProject();
      return;
    }

    if (value === '') {
      onSelectProject(null);
      return;
    }

    const project = projects.find(p => p.id === value);
    if (project) {
      onSelectProject(project);
    }
  };

  return (
    <div>
      <label style={{ display: 'block', marginBottom: '4px', color: '#d4d4d4', fontSize: '14px' }}>
        Project *
      </label>
      <select
        value={selectedProjectId || ''}
        onChange={handleChange}
        style={{
          width: '100%',
          padding: '8px',
          backgroundColor: '#2d2d2d',
          border: '1px solid #3e3e3e',
          borderRadius: '4px',
          color: '#d4d4d4',
          fontSize: '14px',
          cursor: 'pointer',
        }}
      >
        <option value="">Select a project...</option>
        {projects.map(project => (
          <option key={project.id} value={project.id}>
            {project.name} ({project.cwd})
          </option>
        ))}
        <option value="__add_new__" style={{ fontWeight: 'bold', borderTop: '1px solid #3e3e3e' }}>
          + Add New Project
        </option>
      </select>

      {selectedProjectId && (
        <div style={{ marginTop: '8px', padding: '8px', backgroundColor: '#2d2d2d', borderRadius: '4px' }}>
          {(() => {
            const project = projects.find(p => p.id === selectedProjectId);
            if (!project) return null;

            return (
              <div>
                <div style={{ fontSize: '12px', color: '#858585', marginBottom: '4px' }}>
                  <strong style={{ color: '#d4d4d4' }}>{project.name}</strong>
                  {project.actionflowsDetected && (
                    <span style={{
                      marginLeft: '8px',
                      padding: '2px 6px',
                      backgroundColor: '#0e639c',
                      borderRadius: '3px',
                      fontSize: '10px',
                      color: 'white',
                    }}>
                      ActionFlows
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '12px', color: '#858585', fontFamily: 'Consolas, monospace' }}>
                  {project.cwd}
                </div>
                {project.description && (
                  <div style={{ fontSize: '12px', color: '#858585', marginTop: '4px' }}>
                    {project.description}
                  </div>
                )}
                <div style={{ fontSize: '11px', color: '#6e6e6e', marginTop: '4px' }}>
                  Last used: {new Date(project.lastUsedAt).toLocaleString()}
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
