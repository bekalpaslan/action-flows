/**
 * WidgetRenderer Component
 *
 * Renders a layout of widgets based on a LayoutDescriptor.
 * Supports CSS Grid layouts: grid-2col, grid-3col, stack.
 */

import type { LayoutDescriptor } from '@afw/shared';
import { WIDGET_REGISTRY, UnknownWidget, type WidgetProps } from './widgets';
import './WidgetRenderer.css';

export interface WidgetRendererProps {
  /** Layout descriptor containing layout type and widgets */
  layoutDescriptor: LayoutDescriptor;
}

/**
 * Renders a grid of widgets based on the layout descriptor.
 * Falls back to UnknownWidget for unrecognized widget types.
 */
export function WidgetRenderer({ layoutDescriptor }: WidgetRendererProps) {
  const { layout, widgets } = layoutDescriptor;

  // Map layout type to CSS class
  const layoutClass = `widget-layout widget-layout--${layout}`;

  return (
    <div className={layoutClass}>
      {widgets.map((widget, index) => {
        // Look up widget component from registry
        const WidgetComponent = WIDGET_REGISTRY[widget.type];

        if (WidgetComponent) {
          // Render known widget with correct props
          return (
            <WidgetComponent
              key={`${widget.type}-${index}`}
              data={widget.data}
              span={widget.span}
            />
          );
        } else {
          // Fallback to UnknownWidget for unrecognized types
          return (
            <UnknownWidget
              key={`unknown-${index}`}
              type={widget.type}
              data={widget.data}
              span={widget.span}
            />
          );
        }
      })}
    </div>
  );
}
