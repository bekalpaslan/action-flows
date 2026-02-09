import React from 'react';
import type { QuickCommand, QuickCommandAction } from '@afw/shared';
import './QuickCommandGrid.css';

export interface QuickCommandGridProps {
  commands?: QuickCommand[];
  onExecute: (action: QuickCommandAction) => void;
  maxVisible?: number;
  disabled?: boolean;
}

export const QuickCommandGrid: React.FC<QuickCommandGridProps> = ({
  commands = [],
  onExecute,
  maxVisible = 8,
  disabled = false,
}) => {
  // Sort by frequency (most used first) and limit to maxVisible
  const sortedCommands = React.useMemo(() => {
    return [...commands]
      .sort((a, b) => (b.frequency || 0) - (a.frequency || 0))
      .slice(0, maxVisible);
  }, [commands, maxVisible]);

  const handleClick = (action: QuickCommandAction) => {
    if (!disabled) {
      onExecute(action);
    }
  };

  if (sortedCommands.length === 0) {
    return null;
  }

  return (
    <div className="quick-command-grid">
      {sortedCommands.map((command) => (
        <button
          key={command.id}
          className="quick-command-button"
          onClick={() => handleClick(command.action)}
          disabled={disabled}
          title={command.label}
        >
          {command.icon && <span className="quick-command-icon">{command.icon}</span>}
          <span className="quick-command-label">{command.label}</span>
        </button>
      ))}
    </div>
  );
};
