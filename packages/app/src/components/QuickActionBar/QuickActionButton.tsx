import { useState } from 'react';

export interface QuickActionButtonProps {
  /** Display label */
  label: string;

  /** Icon name (mapped to SVG icons) */
  icon: string;

  /** Input value to send when clicked */
  value: string;

  /** Click handler */
  onClick: (value: string) => void;

  /** Disabled state */
  disabled?: boolean;
}

/**
 * QuickActionButton - individual quick action button
 *
 * Displays icon + label, sends input value on click
 */
export function QuickActionButton({
  label,
  icon,
  value,
  onClick,
  disabled = false,
}: QuickActionButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    if (disabled || isLoading) return;

    setIsLoading(true);
    try {
      onClick(value);
    } finally {
      // Reset loading state after a short delay
      setTimeout(() => setIsLoading(false), 500);
    }
  };

  // Icon mapping
  const getIconSvg = (iconName: string) => {
    switch (iconName) {
      case 'check':
        return (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M11.6667 3.5L5.25 9.91667L2.33333 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      case 'x':
        return (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      case 'skip':
        return (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3.5 7H10.5M10.5 7L7 3.5M10.5 7L7 10.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      case 'number':
        return (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <text x="7" y="11" fontSize="10" fontWeight="bold" textAnchor="middle" fill="currentColor">{value}</text>
          </svg>
        );
      case 'folder':
        return (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12.25 10.5C12.25 10.9142 11.9142 11.25 11.5 11.25H2.5C2.08579 11.25 1.75 10.9142 1.75 10.5V3.5C1.75 3.08579 2.08579 2.75 2.5 2.75H5.25L6.125 4.25H11.5C11.9142 4.25 12.25 4.58579 12.25 5V10.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      case 'edit':
        return (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7 11.6667H11.6667M2.33333 11.6667H3.56667L9.91667 5.31667L8.68333 4.08333L2.33333 10.4333V11.6667Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      default:
        return (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
        );
    }
  };

  return (
    <button
      className={`quick-action-btn ${isLoading ? 'loading' : ''}`}
      onClick={handleClick}
      disabled={disabled || isLoading}
      title={`${label} - Sends: ${value}`}
    >
      <span className="quick-action-icon">
        {isLoading ? (
          <svg className="spinner" width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="2" strokeDasharray="8 4" strokeLinecap="round">
              <animateTransform attributeName="transform" type="rotate" from="0 7 7" to="360 7 7" dur="1s" repeatCount="indefinite"/>
            </circle>
          </svg>
        ) : (
          getIconSvg(icon)
        )}
      </span>
      <span className="quick-action-label">{label}</span>
    </button>
  );
}
