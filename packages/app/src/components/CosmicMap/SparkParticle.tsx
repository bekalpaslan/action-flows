/**
 * SparkParticle - An executing agent visible on the cosmic map
 *
 * Placeholder component for Phase E.
 * Visual: Small glowing particle with pulse animation.
 * Future: Animated movement along bridges, progress indicators.
 */

import React from 'react';
import type { SparkParticle } from '@afw/shared';
import './SparkParticle.css';

interface SparkParticleProps {
  /** Spark data */
  spark: SparkParticle;

  /** Parent star position on the cosmic map */
  parentPosition: { x: number; y: number };
}

export const SparkParticleComponent: React.FC<SparkParticleProps> = ({ spark, parentPosition }) => {
  // Position near parent star (offset by status)
  const offsetX = spark.status === 'spawning' ? 0 : 20;
  const offsetY = spark.status === 'spawning' ? 0 : -20;
  const x = parentPosition.x + offsetX;
  const y = parentPosition.y + offsetY;

  return (
    <div
      className={`spark-particle spark-particle--${spark.status}`}
      style={{
        position: 'absolute',
        left: `${x}px`,
        top: `${y}px`,
        transform: 'translate(-50%, -50%)',
      }}
      role="presentation"
      aria-hidden="true"
      data-spark-id={spark.id}
      data-agent-type={spark.agentType}
      data-progress={spark.progress}
    >
      <div className="spark-particle__glow" role="presentation" aria-hidden="true" />
      <div className="spark-particle__core" role="presentation" aria-hidden="true" />
    </div>
  );
};
