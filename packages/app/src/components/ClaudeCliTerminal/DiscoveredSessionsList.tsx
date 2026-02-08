/**
 * DiscoveredSessionsList
 * Displays externally-running Claude Code sessions detected via IDE lock files.
 * Each session shows a "Start Here" button to pre-fill the cwd in the start dialog.
 */

import type { DiscoveredClaudeSession } from '@afw/shared';

interface DiscoveredSessionsListProps {
  sessions: DiscoveredClaudeSession[];
  isLoading: boolean;
  onStartHere: (cwd: string) => void;
}

export function DiscoveredSessionsList({
  sessions,
  isLoading,
  onStartHere,
}: DiscoveredSessionsListProps) {
  if (isLoading || sessions.length === 0) {
    return null;
  }

  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{
        display: 'block',
        marginBottom: '8px',
        color: '#d4d4d4',
        fontSize: '14px',
        fontWeight: 600,
      }}>
        Detected Claude Code Sessions
      </label>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}>
        {sessions.map(session => (
          <div
            key={session.discoveryKey}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 12px',
              backgroundColor: '#252526',
              border: '1px solid #3e3e3e',
              borderRadius: '6px',
            }}
          >
            {/* Alive indicator */}
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: session.pidAlive ? '#4ec9b0' : '#6e6e6e',
              flexShrink: 0,
            }} />

            {/* Session info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                color: '#d4d4d4',
                fontSize: '13px',
                fontWeight: 500,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {folderName(session.primaryCwd)}
              </div>
              <div style={{
                color: '#858585',
                fontSize: '11px',
                fontFamily: 'Consolas, monospace',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {session.primaryCwd}
              </div>
              <div style={{
                display: 'flex',
                gap: '8px',
                marginTop: '2px',
                fontSize: '11px',
                color: '#858585',
              }}>
                <span>{session.ideName}</span>
                {session.enrichment?.gitBranch && (
                  <span style={{ color: '#569cd6' }}>
                    {session.enrichment.gitBranch}
                  </span>
                )}
                {session.enrichment?.lastPrompt && (
                  <span style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: '200px',
                    color: '#6a9955',
                  }}>
                    {session.enrichment.lastPrompt}
                  </span>
                )}
              </div>
            </div>

            {/* Start Here button */}
            <button
              onClick={() => onStartHere(session.primaryCwd)}
              style={{
                padding: '4px 10px',
                backgroundColor: '#0e639c',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 500,
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              Start Here
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Extract the last folder name from a path */
function folderName(cwdPath: string): string {
  if (!cwdPath) return 'Unknown';
  const parts = cwdPath.replace(/[\\/]+$/, '').split(/[\\/]/);
  return parts[parts.length - 1] || cwdPath;
}
