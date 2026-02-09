/**
 * CodeHealthMeterWidget Component
 *
 * Displays a code health score (0-100) with optional factor breakdown.
 */

import './widgets.css';

export interface CodeHealthMeterWidgetProps {
  data: {
    score: number;
    factors?: Array<{
      label: string;
      value: number;
    }>;
  };
  span: number;
}

/**
 * Meter showing code health score with circular progress and factor breakdown.
 */
export function CodeHealthMeterWidget({ data, span }: CodeHealthMeterWidgetProps) {
  const { score, factors } = data;

  const getScoreClass = () => {
    if (score >= 80) return 'widget-code-health__score--good';
    if (score >= 50) return 'widget-code-health__score--medium';
    return 'widget-code-health__score--poor';
  };

  const getScoreLabel = () => {
    if (score >= 80) return 'Good';
    if (score >= 50) return 'Fair';
    return 'Needs Improvement';
  };

  return (
    <div className="widget widget-code-health" style={{ gridColumn: `span ${span}` }}>
      <div className="widget-code-health__title">Code Health</div>
      <div className="widget-code-health__score-container">
        <div className={`widget-code-health__score ${getScoreClass()}`}>
          <div className="widget-code-health__score-value">{score}</div>
          <div className="widget-code-health__score-max">/100</div>
        </div>
        <div className="widget-code-health__score-label">{getScoreLabel()}</div>
      </div>

      {factors && factors.length > 0 && (
        <div className="widget-code-health__factors">
          {factors.map((factor, index) => (
            <div key={index} className="widget-code-health__factor">
              <div className="widget-code-health__factor-label">{factor.label}</div>
              <div className="widget-code-health__factor-bar">
                <div
                  className="widget-code-health__factor-fill"
                  style={{ width: `${factor.value}%` }}
                />
              </div>
              <div className="widget-code-health__factor-value">{factor.value}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
