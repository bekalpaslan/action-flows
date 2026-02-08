/**
 * SquadPanelDemo - Visual test component for SquadPanel
 *
 * Demonstrates SquadPanel usage in both real and demo modes.
 * Use this file to verify visual appearance and interactions.
 *
 * Usage:
 * ```tsx
 * import { SquadPanelDemo } from './components/SquadPanel/SquadPanelDemo';
 *
 * function App() {
 *   return <SquadPanelDemo mode="demo" />;
 * }
 * ```
 */

import { useState } from 'react';
import { SquadPanel } from './SquadPanel';
import type { SessionId } from '@afw/shared';

interface SquadPanelDemoProps {
  /** Mode: 'demo' uses null sessionId, 'real' expects WebSocket events */
  mode?: 'demo' | 'real';

  /** Session ID for real mode (ignored in demo mode) */
  sessionId?: SessionId;
}

export function SquadPanelDemo({ mode = 'demo', sessionId }: SquadPanelDemoProps) {
  const [placement, setPlacement] = useState<'left' | 'right' | 'bottom'>('left');
  const [audioEnabled, setAudioEnabled] = useState(false);

  // Demo mode: pass null sessionId
  // Real mode: pass provided sessionId
  const activeSessionId = mode === 'demo' ? null : (sessionId ?? null);

  const handleAgentClick = (agentId: string) => {
    console.log('[SquadPanelDemo] Agent clicked:', agentId);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        padding: '24px',
        minHeight: '100vh',
        backgroundColor: '#0a0a0a',
        color: '#e0e0e0',
      }}
    >
      {/* Controls */}
      <div
        style={{
          display: 'flex',
          gap: '16px',
          padding: '16px',
          backgroundColor: '#1a1a1a',
          borderRadius: '8px',
          border: '1px solid #3c3c3c',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '14px', fontWeight: '600' }}>Mode</label>
          <div style={{ fontSize: '12px', color: '#888' }}>
            {mode === 'demo' ? '🎭 Demo (auto-updating)' : '🔌 Real (WebSocket)'}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '14px', fontWeight: '600' }}>Placement</label>
          <select
            value={placement}
            onChange={(e) => setPlacement(e.target.value as 'left' | 'right' | 'bottom')}
            style={{
              padding: '8px 12px',
              backgroundColor: '#2a2a2a',
              color: '#e0e0e0',
              border: '1px solid #3c3c3c',
              borderRadius: '4px',
              fontSize: '14px',
            }}
          >
            <option value="left">Left</option>
            <option value="right">Right</option>
            <option value="bottom">Bottom</option>
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '14px', fontWeight: '600' }}>Audio Cues</label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={audioEnabled}
              onChange={(e) => setAudioEnabled(e.target.checked)}
              style={{ width: '18px', height: '18px' }}
            />
            <span style={{ fontSize: '14px' }}>
              {audioEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </label>
        </div>
      </div>

      {/* Info Box */}
      <div
        style={{
          padding: '16px',
          backgroundColor: '#1a1a1a',
          borderRadius: '8px',
          border: '1px solid #3c3c3c',
        }}
      >
        <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600' }}>
          Phase 1: Core Structure
        </h3>
        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', lineHeight: '1.6' }}>
          <li>✅ Types, hooks, and components implemented</li>
          <li>✅ WebSocket event integration (real mode)</li>
          <li>✅ Demo mode with auto-updating agents</li>
          <li>✅ Placeholder visuals (SVG + emoji)</li>
          <li>✅ Hover effects and click interactions</li>
          <li>✅ Expandable log panels</li>
          <li>⏳ Phase 3: Animations (keyframes, aura pulses)</li>
          <li>⏳ Phase 4: Responsive layout (AgentRow)</li>
          <li>⏳ Phase 5: SVG artwork (63 expression variants)</li>
        </ul>
      </div>

      {/* SquadPanel */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '24px',
          backgroundColor: '#0a0a0a',
          borderRadius: '12px',
          border: '2px dashed #3c3c3c',
        }}
      >
        <SquadPanel
          sessionId={activeSessionId}
          placement={placement}
          audioEnabled={audioEnabled}
          onAgentClick={handleAgentClick}
        />
      </div>

      {/* Instructions */}
      <div
        style={{
          padding: '16px',
          backgroundColor: '#1a1a1a',
          borderRadius: '8px',
          border: '1px solid #3c3c3c',
          fontSize: '14px',
          lineHeight: '1.6',
        }}
      >
        <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600' }}>
          Interactions:
        </h4>
        <ul style={{ margin: 0, paddingLeft: '20px' }}>
          <li>
            <strong>Hover</strong> over an agent → Status bar appears, eyes track cursor
          </li>
          <li>
            <strong>Click</strong> an agent → Log panel expands/collapses inline
          </li>
          <li>
            <strong>Demo mode</strong> → Agents auto-update every 5 seconds (new logs, status
            changes)
          </li>
        </ul>
      </div>
    </div>
  );
}
