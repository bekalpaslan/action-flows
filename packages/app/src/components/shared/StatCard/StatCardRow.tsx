import React from 'react';

export interface StatCardRowProps {
  children: React.ReactNode; // StatCard elements
}

/**
 * StatCardRow Component
 *
 * A flex container for laying out StatCard components in a responsive row.
 * Cards will wrap to multiple lines on smaller screens.
 *
 * @example
 * ```tsx
 * <StatCardRow>
 *   <StatCard label="Sessions" value={42} />
 *   <StatCard label="Chains" value={128} />
 *   <StatCard label="Steps" value={512} />
 * </StatCardRow>
 * ```
 */
export function StatCardRow({ children }: StatCardRowProps): JSX.Element {
  return (
    <div
      style={{
        display: 'flex',
        gap: '16px',
        flexWrap: 'wrap',
      }}
    >
      {React.Children.map(children, (child) => (
        <div style={{ flex: '1', minWidth: '180px' }}>{child}</div>
      ))}
    </div>
  );
}
