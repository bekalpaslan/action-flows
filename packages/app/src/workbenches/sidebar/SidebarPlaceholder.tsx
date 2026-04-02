import { useUIStore } from '@/stores/uiStore';
import { WORKBENCHES } from '@/lib/types';
import { WebSocketStatus } from '@/status/WebSocketStatus';
import './SidebarPlaceholder.css';

export function SidebarPlaceholder() {
  const activeWorkbench = useUIStore((s) => s.activeWorkbench);
  const setActiveWorkbench = useUIStore((s) => s.setActiveWorkbench);

  return (
    <nav className="sidebar">
      <h2 className="sidebar__title">Workbenches</h2>
      <ul className="sidebar__list">
        {WORKBENCHES.map((wb) => (
          <li
            key={wb.id}
            className={`sidebar__item${wb.id === activeWorkbench ? ' sidebar__item--active' : ''}`}
            onClick={() => setActiveWorkbench(wb.id)}
          >
            {wb.label}
          </li>
        ))}
      </ul>
      <div className="sidebar__status">
        <WebSocketStatus />
      </div>
    </nav>
  );
}
