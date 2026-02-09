/**
 * AlertPanelWidget Component
 *
 * Displays a list of alerts with severity icons and messages.
 */

import './widgets.css';

export interface AlertPanelWidgetProps {
  data: {
    alerts: Array<{
      severity: 'info' | 'warn' | 'error';
      message: string;
    }>;
  };
  span: number;
}

/**
 * Panel showing a list of alerts with severity indicators.
 */
export function AlertPanelWidget({ data, span }: AlertPanelWidgetProps) {
  const { alerts } = data;

  const getSeverityIcon = (severity: 'info' | 'warn' | 'error') => {
    switch (severity) {
      case 'info':
        return 'ℹ️';
      case 'warn':
        return '⚠️';
      case 'error':
        return '🚨';
    }
  };

  const getSeverityClass = (severity: 'info' | 'warn' | 'error') => {
    return `widget-alert-panel__alert--${severity}`;
  };

  return (
    <div className="widget widget-alert-panel" style={{ gridColumn: `span ${span}` }}>
      <div className="widget-alert-panel__title">Alerts</div>
      <div className="widget-alert-panel__list">
        {alerts.map((alert, index) => (
          <div
            key={index}
            className={`widget-alert-panel__alert ${getSeverityClass(alert.severity)}`}
          >
            <span className="widget-alert-panel__icon">
              {getSeverityIcon(alert.severity)}
            </span>
            <span className="widget-alert-panel__message">{alert.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
