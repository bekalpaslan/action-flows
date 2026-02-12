import { WorkbenchLayout } from './Workbench';

/**
 * Main app content component that displays the WorkbenchLayout
 */
export default function AppContent() {
  return (
    <div className="app-content" data-testid="app-content">
      <div className="content-area" data-testid="content-area" role="main">
        <WorkbenchLayout />
      </div>
    </div>
  );
}
