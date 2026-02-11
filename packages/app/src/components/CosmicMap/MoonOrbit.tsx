/**
 * MoonOrbit - A data source orbiting a star
 *
 * Placeholder component for Phase E.
 * Visual: Small circle with label, positioned around parent star.
 * Future: Animated orbital motion.
 */

import React from 'react';
import type { MoonOrbit } from '@afw/shared';
import './MoonOrbit.css';

interface MoonOrbitProps {
  /** Moon data */
  moon: MoonOrbit;

  /** Parent star position on the cosmic map */
  parentPosition: { x: number; y: number };
}

export const MoonOrbitComponent: React.FC<MoonOrbitProps> = ({ moon, parentPosition }) => {
  // Calculate static position (orbit animation will come later)
  const angle = 0; // TODO: Calculate based on time and orbitSpeed
  const x = parentPosition.x + moon.orbitRadius * Math.cos(angle);
  const y = parentPosition.y + moon.orbitRadius * Math.sin(angle);

  return (
    <div
      className={`moon-orbit moon-orbit--${moon.status}`}
      style={{
        position: 'absolute',
        left: `${x}px`,
        top: `${y}px`,
        transform: 'translate(-50%, -50%)',
      }}
      role="img"
      aria-label={`${moon.label} embedded in parent region`}
      data-moon-id={moon.id}
      data-data-source-type={moon.dataSourceType}
    >
      <div className="moon-orbit__core" />
      <div className="moon-orbit__label">{moon.label}</div>
    </div>
  );
};
