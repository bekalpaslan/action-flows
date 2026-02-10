/**
 * CategorySection Component
 * Collapsible category group displaying components by type
 */

import React, { useState } from 'react';
import type { RespectComponentType, RespectViolation } from '@afw/shared';
import { ComponentHealthCard } from './ComponentHealthCard';

export interface ComponentItem {
  selector: string;
  status: 'pass' | 'warn' | 'fail';
  violations?: RespectViolation[];
  metrics?: {
    width: number;
    height: number;
    scrollWidth: number;
    scrollHeight: number;
    clientWidth: number;
    clientHeight: number;
  };
}

export interface CategorySectionProps {
  /** Category title */
  title: string;
  /** Component type */
  type: RespectComponentType;
  /** Components in this category */
  components: ComponentItem[];
  /** Whether to expand by default */
  defaultExpanded?: boolean;
}

export function CategorySection({
  title,
  type: _type,
  components,
  defaultExpanded,
}: CategorySectionProps): React.ReactElement {
  // Auto-expand if any violations exist
  const hasViolations = components.some((c) => c.status !== 'pass');
  const [expanded, setExpanded] = useState(defaultExpanded ?? hasViolations);

  // Determine status dot color
  const getStatusDotClass = (): string => {
    const hasFailures = components.some((c) => c.status === 'fail');
    const hasWarnings = components.some((c) => c.status === 'warn');

    if (hasFailures) return 'respect-category__status-dot--fail';
    if (hasWarnings) return 'respect-category__status-dot--warn';
    return 'respect-category__status-dot--pass';
  };

  return (
    <div className="respect-category">
      <div
        className="respect-category__header"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="respect-category__expand-icon">
          {expanded ? '▼' : '▶'}
        </span>
        <span className={`respect-category__status-dot ${getStatusDotClass()}`} />
        <span className="respect-category__title">{title}</span>
        <span className="respect-category__count">({components.length})</span>
      </div>

      {expanded && (
        <div className="respect-category__body">
          {components.map((component) => (
            <ComponentHealthCard
              key={component.selector}
              selector={component.selector}
              status={component.status}
              violations={component.violations}
              metrics={component.metrics}
            />
          ))}
        </div>
      )}
    </div>
  );
}
