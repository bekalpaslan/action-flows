import React from 'react';
import type { SessionId, QuickCommand, QuickCommandAction, FlowAction } from '@afw/shared';
import { QuickCommandGrid } from './QuickCommandGrid';
import { HumanInputField } from './HumanInputField';
import { FlowActionPicker } from './FlowActionPicker';
import './BottomControlPanel.css';

export interface BottomControlPanelProps {
  sessionId?: SessionId;
  onSubmitInput: (value: string) => void;
  onExecuteCommand: (action: QuickCommandAction) => void;
  onSelectFlow: (item: FlowAction) => void;
  flows?: FlowAction[];
  actions?: FlowAction[];
  commands?: QuickCommand[];
  disabled?: boolean;
}

export const BottomControlPanel: React.FC<BottomControlPanelProps> = ({
  sessionId,
  onSubmitInput,
  onExecuteCommand,
  onSelectFlow,
  flows = [],
  actions = [],
  commands = [],
  disabled = false,
}) => {
  return (
    <div className="bottom-control-panel">
      <div className="bottom-control-panel__section bottom-control-panel__section--left">
        <QuickCommandGrid
          commands={commands}
          onExecute={onExecuteCommand}
          disabled={disabled}
        />
      </div>

      <div className="bottom-control-panel__section bottom-control-panel__section--center">
        <HumanInputField
          sessionId={sessionId}
          onSubmit={onSubmitInput}
          disabled={disabled}
        />
      </div>

      <div className="bottom-control-panel__section bottom-control-panel__section--right">
        <FlowActionPicker
          flows={flows}
          actions={actions}
          onSelect={onSelectFlow}
          disabled={disabled}
        />
      </div>
    </div>
  );
};
