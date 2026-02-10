/**
 * Claude CLI Start Dialog
 * Dialog for starting a new Claude CLI session
 */

import { useState } from 'react';
import type { SessionId, Project } from '@afw/shared';
import { useClaudeCliSessions } from '../../hooks/useClaudeCliSessions';
import { useProjects } from '../../hooks/useProjects';
import { useDiscoveredSessions } from '../../hooks/useDiscoveredSessions';
import { ProjectSelector } from './ProjectSelector';
import { ProjectForm } from './ProjectForm';
import { DiscoveredSessionsList } from './DiscoveredSessionsList';

interface ClaudeCliStartDialogProps {
  onClose: () => void;
  onSessionStarted?: (sessionId: SessionId) => void;
}

/**
 * Claude CLI Start Dialog
 * Form for configuring and starting a new Claude CLI session
 */
export function ClaudeCliStartDialog({ onClose, onSessionStarted }: ClaudeCliStartDialogProps) {
  // Safely get current working directory (Electron context)
  const initialCwd = typeof process !== 'undefined' && process.cwd ? process.cwd() : '';

  // Mode state: select-project | add-project | edit-project
  const [mode, setMode] = useState<'select-project' | 'add-project' | 'edit-project'>('select-project');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Form state (for manual mode or when project not selected)
  const [cwd, setCwd] = useState(initialCwd);
  const [prompt, setPrompt] = useState('');
  const [selectedFlags, setSelectedFlags] = useState<string[]>([]);

  const { startSession, isLoading, error } = useClaudeCliSessions();
  const {
    projects,
    createProject,
    updateProject,
    detectProject,
    isLoading: projectsLoading,
    error: projectsError,
  } = useProjects();
  const { sessions: discoveredSessions, isLoading: discoveryLoading } = useDiscoveredSessions();

  const handleStartFromDiscovery = (discoveryCwd: string) => {
    setSelectedProject(null);
    setCwd(discoveryCwd);
  };

  const availableFlags = [
    { value: '--debug', label: 'Debug Mode', description: 'Enable debug output' },
    { value: '--no-session-persistence', label: 'No Persistence', description: 'Ephemeral session (no state saved)' },
    { value: '--print', label: 'Print Mode', description: 'Non-interactive mode' },
  ];

  const handleFlagToggle = (flag: string) => {
    setSelectedFlags(prev =>
      prev.includes(flag)
        ? prev.filter(f => f !== flag)
        : [...prev, flag]
    );
  };

  const handleProjectSelect = (project: Project | null) => {
    setSelectedProject(project);
    if (project) {
      setCwd(project.cwd);
      setPrompt(project.defaultPromptTemplate || '');
      setSelectedFlags(project.defaultCliFlags || []);
    }
  };

  const handleAddNewProject = () => {
    setMode('add-project');
  };

  const handleSaveProject = async (data: any) => {
    try {
      if (mode === 'add-project') {
        const newProject = await createProject(data);
        setSelectedProject(newProject);
        setCwd(newProject.cwd);
        setPrompt(newProject.defaultPromptTemplate || '');
        setSelectedFlags(newProject.defaultCliFlags || []);
      } else if (mode === 'edit-project' && selectedProject) {
        const updated = await updateProject(selectedProject.id, data);
        setSelectedProject(updated);
        setCwd(updated.cwd);
        setPrompt(updated.defaultPromptTemplate || '');
        setSelectedFlags(updated.defaultCliFlags || []);
      }
      setMode('select-project');
    } catch (err) {
      console.error('Failed to save project:', err);
      alert(err instanceof Error ? err.message : 'Failed to save project');
    }
  };

  const handleCancelProjectForm = () => {
    setMode('select-project');
  };

  const handleEditProject = () => {
    if (selectedProject) {
      setMode('edit-project');
    }
  };

  const handleStart = async () => {
    if (!cwd.trim()) {
      alert('Working directory is required');
      return;
    }

    try {
      const sessionId = crypto.randomUUID() as SessionId;
      await startSession(
        sessionId,
        cwd,
        prompt || undefined,
        selectedFlags.length > 0 ? selectedFlags : undefined,
        selectedProject?.id,
        selectedProject?.envVars,
        selectedProject?.mcpConfigPath || undefined
      );
      onSessionStarted?.(sessionId);
      onClose();
    } catch (err) {
      console.error('Failed to start Claude CLI session:', err);
      // Error is already set by the hook
    }
  };

  // Show project form if in add/edit mode
  if (mode === 'add-project' || mode === 'edit-project') {
    return (
      <ProjectForm
        mode={mode === 'add-project' ? 'create' : 'edit'}
        initialData={mode === 'edit-project' ? selectedProject || undefined : undefined}
        onSave={handleSaveProject}
        onCancel={handleCancelProjectForm}
        onDetect={detectProject}
        isLoading={projectsLoading}
      />
    );
  }

  return (
    <div
      className="claude-cli-start-dialog"
      role="presentation"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="claude-cli-start-dialog-title"
        style={{
          backgroundColor: '#1e1e1e',
          border: '1px solid #3e3e3e',
          borderRadius: '8px',
          padding: '24px',
          maxWidth: '600px',
          width: '100%',
          maxHeight: '80vh',
          overflow: 'auto',
        }}
      >
        <h2 id="claude-cli-start-dialog-title" style={{ margin: '0 0 16px 0', color: '#d4d4d4' }}>Start Claude CLI Session</h2>

        {(error || projectsError) && (
          <div style={{
            padding: '12px',
            backgroundColor: '#5a1d1d',
            border: '1px solid #c93c37',
            borderRadius: '4px',
            marginBottom: '16px',
            color: '#f48771',
            fontSize: '14px',
          }}>
            {error?.message || projectsError?.message}
          </div>
        )}

        {/* Discovered Sessions */}
        <DiscoveredSessionsList
          sessions={discoveredSessions}
          isLoading={discoveryLoading}
          onStartHere={handleStartFromDiscovery}
        />

        {/* Project Selector */}
        <div style={{ marginBottom: '16px' }}>
          <ProjectSelector
            projects={projects}
            selectedProjectId={selectedProject?.id || null}
            onSelectProject={handleProjectSelect}
            onAddNewProject={handleAddNewProject}
          />
        </div>

        {/* Edit Project Button */}
        {selectedProject && (
          <div style={{ marginBottom: '16px' }}>
            <button
              onClick={handleEditProject}
              style={{
                padding: '6px 12px',
                backgroundColor: '#3c3c3c',
                color: '#d4d4d4',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              Edit Project Settings
            </button>
          </div>
        )}

        {/* Working Directory (read-only if project selected, editable otherwise) */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '4px', color: '#d4d4d4', fontSize: '14px' }}>
            Working Directory *
          </label>
          <input
            type="text"
            value={cwd}
            onChange={(e) => setCwd(e.target.value)}
            placeholder="/path/to/project"
            readOnly={!!selectedProject}
            style={{
              width: '100%',
              padding: '8px',
              backgroundColor: selectedProject ? '#1e1e1e' : '#2d2d2d',
              border: '1px solid #3e3e3e',
              borderRadius: '4px',
              color: selectedProject ? '#858585' : '#d4d4d4',
              fontSize: '14px',
              fontFamily: 'Consolas, monospace',
              cursor: selectedProject ? 'not-allowed' : 'text',
            }}
          />
          {!selectedProject && (
            <small style={{ color: '#858585', fontSize: '12px' }}>
              Absolute path to the directory where Claude CLI will run
            </small>
          )}
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '4px', color: '#d4d4d4', fontSize: '14px' }}>
            Initial Prompt (optional)
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="What would you like Claude to help you with?"
            rows={4}
            style={{
              width: '100%',
              padding: '8px',
              backgroundColor: '#2d2d2d',
              border: '1px solid #3e3e3e',
              borderRadius: '4px',
              color: '#d4d4d4',
              fontSize: '14px',
              resize: 'vertical',
            }}
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: '#d4d4d4', fontSize: '14px' }}>
            Flags (optional)
          </label>
          {availableFlags.map(flag => (
            <div key={flag.value} style={{ marginBottom: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={selectedFlags.includes(flag.value)}
                  onChange={() => handleFlagToggle(flag.value)}
                  style={{ marginTop: '2px', marginRight: '8px' }}
                />
                <div>
                  <div style={{ color: '#d4d4d4', fontSize: '14px' }}>{flag.label}</div>
                  <div style={{ color: '#858585', fontSize: '12px' }}>{flag.description}</div>
                </div>
              </label>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            disabled={isLoading}
            style={{
              padding: '8px 16px',
              backgroundColor: '#3c3c3c',
              color: '#d4d4d4',
              border: 'none',
              borderRadius: '4px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleStart}
            disabled={isLoading || !cwd.trim()}
            style={{
              padding: '8px 16px',
              backgroundColor: isLoading || !cwd.trim() ? '#3c3c3c' : '#0e639c',
              color: isLoading || !cwd.trim() ? '#858585' : 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isLoading || !cwd.trim() ? 'not-allowed' : 'pointer',
              fontSize: '14px',
            }}
          >
            {isLoading ? 'Starting...' : 'Start Session'}
          </button>
        </div>
      </div>
    </div>
  );
}
