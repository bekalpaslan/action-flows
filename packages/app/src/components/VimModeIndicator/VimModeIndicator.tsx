import React from 'react';
import { useVimContext } from '../../contexts/VimNavigationContext';
import './VimModeIndicator.css';

export const VimModeIndicator: React.FC = () => {
  const { mode, isEnabled, setIsEnabled } = useVimContext();

  if (!isEnabled) {
    return null;
  }

  const getModeColor = () => {
    switch (mode) {
      case 'normal':
        return '#4caf50';
      case 'insert':
        return '#2196f3';
      case 'visual':
        return '#9c27b0';
      case 'command':
        return '#ff9800';
      default:
        return '#4caf50';
    }
  };

  const handleToggle = () => {
    setIsEnabled(!isEnabled);
  };

  return (
    <div className="vim-mode-indicator">
      <div
        className="vim-mode-pill"
        role="status"
        aria-live="polite"
        aria-label={`Vim mode: ${mode}`}
        style={{
          backgroundColor: getModeColor(),
          boxShadow: `0 0 8px ${getModeColor()}40`
        }}
      >
        <span className="vim-mode-text">{mode.toUpperCase()}</span>
      </div>
      <button
        className="vim-toggle-button"
        onClick={handleToggle}
        title="Toggle Vim Mode"
        aria-label="Toggle Vim Mode"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="currentColor"
        >
          <path d="M8 0L0 4v8l8 4 8-4V4L8 0zm6 10.5l-6 3-6-3v-5l6-3 6 3v5z"/>
          <text x="8" y="11" fontSize="8" textAnchor="middle" fill="currentColor" fontFamily="monospace" fontWeight="bold">V</text>
        </svg>
      </button>
    </div>
  );
};
