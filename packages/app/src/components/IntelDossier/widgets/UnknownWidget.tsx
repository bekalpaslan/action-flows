/**
 * UnknownWidget Component
 *
 * Fallback widget for unrecognized widget types. Displays type name and raw data.
 */

import './widgets.css';

export interface UnknownWidgetProps {
  type: string;
  data: Record<string, unknown>;
  span: number;
}

/**
 * Fallback widget showing type name and formatted JSON data.
 */
export function UnknownWidget({ type, data, span }: UnknownWidgetProps) {
  return (
    <div className="widget widget-unknown" style={{ gridColumn: `span ${span}` }}>
      <div className="widget-unknown__header">
        <span className="widget-unknown__type">Unknown Widget: {type}</span>
      </div>
      <pre className="widget-unknown__data">
        <code>{JSON.stringify(data, null, 2)}</code>
      </pre>
    </div>
  );
}
