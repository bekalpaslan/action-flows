/**
 * GlowIndicator Component
 *
 * Animated glow wrapper component for notifications and status indicators.
 * Provides subtle pulsing glow effects with support for different severity levels.
 */

import React, { ReactNode } from 'react';
import './GlowIndicator.css';

export type GlowLevel = 'info' | 'success' | 'warning' | 'error';

export interface GlowIndicatorProps {
  /** Whether the glow effect is active */
  active: boolean;
  /** Glow color level */
  level: GlowLevel;
  /** Glow intensity from 0 to 1 (default: 1) */
  intensity?: number;
  /** Whether to animate the glow with a pulse effect (default: true) */
  pulse?: boolean;
  /** Content to wrap with the glow effect */
  children: ReactNode;
  /** Additional CSS class name */
  className?: string;
}

/**
 * GlowIndicator wraps content with an animated glow effect.
 *
 * @example
 * ```tsx
 * <GlowIndicator active={hasNotification} level="warning" pulse>
 *   <NotificationBell />
 * </GlowIndicator>
 * ```
 */
export const GlowIndicator: React.FC<GlowIndicatorProps> = ({
  active,
  level,
  intensity = 1,
  pulse = true,
  children,
  className = '',
}) => {
  // Clamp intensity to valid range
  const clampedIntensity = Math.max(0, Math.min(1, intensity));

  const classes = [
    'glow-indicator',
    active && 'glow-indicator--active',
    active && `glow-indicator--${level}`,
    active && pulse && 'glow-indicator--pulse',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={classes}
      style={
        active
          ? ({ '--glow-intensity': clampedIntensity } as React.CSSProperties)
          : undefined
      }
      role={active ? 'status' : undefined}
      aria-live={active ? 'polite' : undefined}
      aria-label={active ? `${level} notification` : undefined}
    >
      {children}
    </div>
  );
};

export default GlowIndicator;
