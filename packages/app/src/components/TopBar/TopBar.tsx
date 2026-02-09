import { useWebSocketContext } from '../../contexts/WebSocketContext';
import { useWorkbenchContext } from '../../contexts/WorkbenchContext';
import { WORKBENCH_IDS, DEFAULT_WORKBENCH_CONFIGS, WorkbenchId } from '@afw/shared';
import { WorkbenchTab } from './WorkbenchTab';
import { ThemeToggle } from '../ThemeToggle/ThemeToggle';
import './TopBar.css';

/**
 * TopBar component - Main navigation header with workbench tabs and status
 */
interface TopBarProps {
  /** Currently active workbench */
  activeWorkbench: WorkbenchId;
  /** Callback when workbench is changed */
  onWorkbenchChange: (workbenchId: WorkbenchId) => void;
}

export function TopBar({ activeWorkbench, onWorkbenchChange }: TopBarProps) {
  const { status, error } = useWebSocketContext();
  const { workbenchNotifications } = useWorkbenchContext();

  // Get status display text
  const getStatusText = (): string => {
    switch (status) {
      case 'connected':
        return 'Connected';
      case 'error':
        return 'Connection Error';
      case 'disconnected':
        return 'Disconnected';
      case 'connecting':
      default:
        return 'Connecting...';
    }
  };

  // Get status class for styling
  const getStatusClass = (): string => {
    switch (status) {
      case 'connected':
        return 'connected';
      case 'error':
        return 'error';
      case 'disconnected':
        return 'disconnected';
      case 'connecting':
      default:
        return 'connecting';
    }
  };

  return (
    <header className="top-bar">
      <div className="top-bar-tabs">
        {WORKBENCH_IDS.map((workbenchId) => {
          const config = DEFAULT_WORKBENCH_CONFIGS[workbenchId];
          const isActive = activeWorkbench === workbenchId;
          const notificationCount = workbenchNotifications.get(workbenchId) || 0;

          return (
            <WorkbenchTab
              key={workbenchId}
              config={config}
              isActive={isActive}
              onClick={() => onWorkbenchChange(workbenchId)}
              notificationCount={notificationCount}
            />
          );
        })}
      </div>

      <div className="top-bar-status">
        <ThemeToggle />
        <div className={`status ${getStatusClass()}`}>
          {getStatusText()}
          {error && ` - ${error.message}`}
        </div>
      </div>
    </header>
  );
}
