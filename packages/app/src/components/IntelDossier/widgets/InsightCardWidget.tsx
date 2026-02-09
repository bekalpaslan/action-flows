/**
 * InsightCardWidget Component
 *
 * Displays natural language insight text with optional confidence score and category.
 */

import './widgets.css';

export interface InsightCardWidgetProps {
  data: {
    text: string;
    confidence?: number;
    category?: string;
  };
  span: number;
}

/**
 * Card showing natural language insight with confidence bar.
 */
export function InsightCardWidget({ data, span }: InsightCardWidgetProps) {
  const { text, confidence, category } = data;

  return (
    <div className="widget widget-insight-card" style={{ gridColumn: `span ${span}` }}>
      {category && (
        <div className="widget-insight-card__category">{category}</div>
      )}
      <div className="widget-insight-card__text">{text}</div>
      {confidence !== undefined && (
        <div className="widget-insight-card__confidence">
          <div className="widget-insight-card__confidence-bar">
            <div
              className="widget-insight-card__confidence-fill"
              style={{ width: `${confidence}%` }}
            />
          </div>
          <div className="widget-insight-card__confidence-label">
            {confidence}% confidence
          </div>
        </div>
      )}
    </div>
  );
}
