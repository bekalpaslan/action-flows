import { useWSStore } from '../stores/wsStore';
import './WebSocketStatus.css';

const STATUS_LABELS: Record<string, string> = {
  connected: 'Connected',
  reconnecting: 'Reconnecting...',
  disconnected: 'Disconnected',
  connecting: 'Connecting...',
};

export function WebSocketStatus() {
  const status = useWSStore((s) => s.status);
  return (
    <div className="ws-status">
      <span className={`ws-status__dot ws-status__dot--${status}`} />
      <span>{STATUS_LABELS[status] ?? status}</span>
    </div>
  );
}
