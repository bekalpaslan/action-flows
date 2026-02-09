/**
 * Widgets Barrel File + Widget Registry
 *
 * Exports all widget components and provides a registry for dynamic widget rendering.
 */

import React from 'react';
import { StatCardWidget } from './StatCardWidget';
import { InsightCardWidget } from './InsightCardWidget';
import { AlertPanelWidget } from './AlertPanelWidget';
import { CodeHealthMeterWidget } from './CodeHealthMeterWidget';
import { FileTreeWidget } from './FileTreeWidget';
import { SnippetPreviewWidget } from './SnippetPreviewWidget';
import { UnknownWidget } from './UnknownWidget';

// Export all widgets
export { StatCardWidget } from './StatCardWidget';
export { InsightCardWidget } from './InsightCardWidget';
export { AlertPanelWidget } from './AlertPanelWidget';
export { CodeHealthMeterWidget } from './CodeHealthMeterWidget';
export { FileTreeWidget } from './FileTreeWidget';
export { SnippetPreviewWidget } from './SnippetPreviewWidget';
export { UnknownWidget } from './UnknownWidget';

// Common widget props interface
export interface WidgetProps {
  data: Record<string, unknown>;
  span: number;
}

/**
 * Widget Registry
 *
 * Maps widget type strings to their corresponding React components.
 * Used for dynamic widget rendering based on dossier data.
 */
export const WIDGET_REGISTRY: Record<string, React.ComponentType<WidgetProps>> = {
  StatCard: StatCardWidget as React.ComponentType<WidgetProps>,
  InsightCard: InsightCardWidget as React.ComponentType<WidgetProps>,
  AlertPanel: AlertPanelWidget as React.ComponentType<WidgetProps>,
  CodeHealthMeter: CodeHealthMeterWidget as React.ComponentType<WidgetProps>,
  FileTree: FileTreeWidget as React.ComponentType<WidgetProps>,
  SnippetPreview: SnippetPreviewWidget as React.ComponentType<WidgetProps>,
};

/**
 * Fallback Widget for Unknown Types
 */
export { UnknownWidget as FallbackWidget };
