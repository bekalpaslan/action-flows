/**
 * Project Form
 * Form for creating/editing projects
 */

import React, { useState, useEffect } from 'react';
import type { Project, ProjectAutoDetectionResult } from '@afw/shared';
import type { CreateProjectRequest, UpdateProjectRequest } from '../../services/projectService';

interface ProjectFormProps {
  mode: 'create' | 'edit';
  initialData?: Partial<Project>;
  onSave: (data: CreateProjectRequest | UpdateProjectRequest) => Promise<void>;
  onCancel: () => void;
  onDetect?: (cwd: string) => Promise<ProjectAutoDetectionResult>;
  isLoading: boolean;
}

/**
 * Project Form Component
 * Form for creating or editing a project
 */
export function ProjectForm({
  mode,
  initialData,
  onSave,
  onCancel,
  onDetect,
  isLoading,
}: ProjectFormProps) {
  const [cwd, setCwd] = useState(initialData?.cwd || '');
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [defaultPromptTemplate, setDefaultPromptTemplate] = useState(initialData?.defaultPromptTemplate || '');
  const [mcpConfigPath, setMcpConfigPath] = useState(initialData?.mcpConfigPath || '');
  const [selectedFlags, setSelectedFlags] = useState<string[]>(initialData?.defaultCliFlags || []);
  const [detecting, setDetecting] = useState(false);
  const [detectionResult, setDetectionResult] = useState<ProjectAutoDetectionResult | null>(null);

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

  const handleDetect = async () => {
    if (!cwd.trim() || !onDetect) return;

    setDetecting(true);
    try {
      const result = await onDetect(cwd);
      setDetectionResult(result);

      // Auto-fill fields from detection
      if (result.name && !name) {
        setName(result.name);
      }
      if (result.mcpConfigPath) {
        setMcpConfigPath(result.mcpConfigPath);
      }
      if (result.suggestedFlags && result.suggestedFlags.length > 0) {
        // Add suggested flags (but don't override existing selection)
        setSelectedFlags(prev => {
          const newFlags = result.suggestedFlags.filter(f => !prev.includes(f));
          return [...prev, ...newFlags];
        });
      }
    } catch (err) {
      console.error('Detection failed:', err);
      alert(err instanceof Error ? err.message : 'Detection failed');
    } finally {
      setDetecting(false);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim() || !cwd.trim()) {
      alert('Name and working directory are required');
      return;
    }

    const data = {
      name,
      cwd,
      description: description || null,
      defaultPromptTemplate: defaultPromptTemplate || null,
      mcpConfigPath: mcpConfigPath || null,
      defaultCliFlags: selectedFlags,
      envVars: {},
      quickActionPresets: [],
    };

    await onSave(data);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1001,
    }}>
      <div style={{
        backgroundColor: '#1e1e1e',
        border: '1px solid #3e3e3e',
        borderRadius: '8px',
        padding: '24px',
        maxWidth: '700px',
        width: '100%',
        maxHeight: '80vh',
        overflow: 'auto',
      }}>
        <h2 style={{ margin: '0 0 16px 0', color: '#d4d4d4' }}>
          {mode === 'create' ? 'Add New Project' : 'Edit Project'}
        </h2>

        {/* Working Directory */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '4px', color: '#d4d4d4', fontSize: '14px' }}>
            Working Directory *
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={cwd}
              onChange={(e) => setCwd(e.target.value)}
              placeholder="/path/to/project"
              style={{
                flex: 1,
                padding: '8px',
                backgroundColor: '#2d2d2d',
                border: '1px solid #3e3e3e',
                borderRadius: '4px',
                color: '#d4d4d4',
                fontSize: '14px',
                fontFamily: 'Consolas, monospace',
              }}
            />
            {onDetect && (
              <button
                onClick={handleDetect}
                disabled={!cwd.trim() || detecting}
                style={{
                  padding: '8px 16px',
                  backgroundColor: detecting ? '#3c3c3c' : '#0e639c',
                  color: detecting ? '#858585' : 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: detecting || !cwd.trim() ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                }}
              >
                {detecting ? 'Detecting...' : 'Detect'}
              </button>
            )}
          </div>
        </div>

        {/* Detection Result Badge */}
        {detectionResult && (
          <div style={{
            marginBottom: '16px',
            padding: '8px',
            backgroundColor: '#2d2d2d',
            border: '1px solid #3e3e3e',
            borderRadius: '4px',
            fontSize: '12px',
            color: '#d4d4d4',
          }}>
            Detected: <strong>{detectionResult.projectType || 'unknown'}</strong>
            {detectionResult.actionflowsDetected && (
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
        )}

        {/* Project Name */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '4px', color: '#d4d4d4', fontSize: '14px' }}>
            Project Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Project"
            style={{
              width: '100%',
              padding: '8px',
              backgroundColor: '#2d2d2d',
              border: '1px solid #3e3e3e',
              borderRadius: '4px',
              color: '#d4d4d4',
              fontSize: '14px',
            }}
          />
        </div>

        {/* Description */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '4px', color: '#d4d4d4', fontSize: '14px' }}>
            Description (optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of this project"
            rows={2}
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

        {/* Default Prompt Template */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '4px', color: '#d4d4d4', fontSize: '14px' }}>
            Default Prompt Template (optional)
          </label>
          <textarea
            value={defaultPromptTemplate}
            onChange={(e) => setDefaultPromptTemplate(e.target.value)}
            placeholder="Default prompt to use when starting sessions"
            rows={3}
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

        {/* MCP Config Path */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '4px', color: '#d4d4d4', fontSize: '14px' }}>
            MCP Config Path (optional)
          </label>
          <input
            type="text"
            value={mcpConfigPath}
            onChange={(e) => setMcpConfigPath(e.target.value)}
            placeholder="/path/to/mcp-config.json"
            style={{
              width: '100%',
              padding: '8px',
              backgroundColor: '#2d2d2d',
              border: '1px solid #3e3e3e',
              borderRadius: '4px',
              color: '#d4d4d4',
              fontSize: '14px',
              fontFamily: 'Consolas, monospace',
            }}
          />
        </div>

        {/* CLI Flags */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: '#d4d4d4', fontSize: '14px' }}>
            Default CLI Flags (optional)
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

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
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
            onClick={handleSubmit}
            disabled={isLoading || !name.trim() || !cwd.trim()}
            style={{
              padding: '8px 16px',
              backgroundColor: isLoading || !name.trim() || !cwd.trim() ? '#3c3c3c' : '#0e639c',
              color: isLoading || !name.trim() || !cwd.trim() ? '#858585' : 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isLoading || !name.trim() || !cwd.trim() ? 'not-allowed' : 'pointer',
              fontSize: '14px',
            }}
          >
            {isLoading ? 'Saving...' : mode === 'create' ? 'Create Project' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
