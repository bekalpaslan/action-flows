/**
 * LiveSpatialMonitor Component
 * Main results area grouping check results by component type
 */

import React, { useMemo } from 'react';
import type { RespectCheckResult, RespectComponentType } from '@afw/shared';
import { CategorySection, type ComponentItem } from './CategorySection';

export interface LiveSpatialMonitorProps {
  /** Check result data */
  result: RespectCheckResult | null;
  /** Error message if check failed */
  error: string | null;
}

export function LiveSpatialMonitor({
  result,
  error,
}: LiveSpatialMonitorProps): React.ReactElement {
  // Group results by component type
  const groupedResults = useMemo(() => {
    if (!result) return new Map<RespectComponentType, ComponentItem[]>();

    const groups = new Map<RespectComponentType, ComponentItem[]>();

    // Add passing components
    result.clean.forEach((c) => {
      const list = groups.get(c.type) || [];
      list.push({
        selector: c.selector,
        status: 'pass',
      });
      groups.set(c.type, list);
    });

    // Add violated components
    result.violations.forEach((v) => {
      const list = groups.get(v.type) || [];
      const maxSeverity = v.violations.some((vv) => vv.severity === 'high')
        ? 'fail'
        : 'warn';
      list.push({
        selector: v.selector,
        status: maxSeverity,
        violations: v.violations,
        metrics: v.metrics,
      });
      groups.set(v.type, list);
    });

    return groups;
  }, [result]);

  // Category titles mapping
  const categoryTitles: Record<RespectComponentType, string> = {
    'layout-shell': 'Layout Shells',
    topbar: 'Top Bars',
    sidebar: 'Sidebars',
    panel: 'Panels',
    'content-area': 'Content Areas',
    input: 'Inputs',
    visualization: 'Visualizations',
    widget: 'Widgets',
    modal: 'Modals',
  };

  // Show error state
  if (error) {
    return (
      <div className="respect-monitor">
        <div className="respect-monitor__error">
          <span className="respect-monitor__error-icon">✗</span>
          <div className="respect-monitor__error-content">
            <div className="respect-monitor__error-title">Check Failed</div>
            <div className="respect-monitor__error-message">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  // Show empty state
  if (!result) {
    return (
      <div className="respect-monitor">
        <div className="respect-monitor__empty">
          <div className="respect-monitor__empty-icon">📊</div>
          <div className="respect-monitor__empty-title">No Results Yet</div>
          <div className="respect-monitor__empty-message">
            Click "Run Check" to perform a spatial boundary check
          </div>
        </div>
      </div>
    );
  }

  // Show results grouped by category
  const categoryOrder: RespectComponentType[] = [
    'layout-shell',
    'topbar',
    'sidebar',
    'panel',
    'content-area',
    'input',
    'visualization',
    'widget',
    'modal',
  ];

  return (
    <div className="respect-monitor">
      {categoryOrder.map((type) => {
        const components = groupedResults.get(type);
        if (!components || components.length === 0) return null;

        return (
          <CategorySection
            key={type}
            title={categoryTitles[type]}
            type={type}
            components={components}
          />
        );
      })}

      {groupedResults.size === 0 && (
        <div className="respect-monitor__empty">
          <div className="respect-monitor__empty-icon">✓</div>
          <div className="respect-monitor__empty-title">No Components Found</div>
          <div className="respect-monitor__empty-message">
            No checkable components detected in the current view
          </div>
        </div>
      )}
    </div>
  );
}
