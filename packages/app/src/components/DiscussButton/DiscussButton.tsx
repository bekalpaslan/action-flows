/**
 * DiscussButton Component
 *
 * A compact button that opens a dialog for discussing a specific UI component.
 * Appears as a full button with label by default, or icon-only when size="small".
 */

import React from 'react';
import './DiscussButton.css';

export interface DiscussButtonProps {
  /** Name of the component this button refers to */
  componentName: string;
  /** Callback when button is clicked */
  onClick: () => void;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Size variant: medium (default) shows label, small shows icon only */
  size?: 'small' | 'medium';
  /** Additional CSS classes */
  className?: string;
}

/**
 * DiscussButton - Opens a modal to discuss a specific component
 */
export function DiscussButton({
  componentName,
  onClick,
  disabled = false,
  size = 'medium',
  className = '',
}: DiscussButtonProps): React.ReactElement {
  const buttonClasses = [
    'discuss-button',
    `discuss-button--${size}`,
    disabled ? 'discuss-button--disabled' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      className={buttonClasses}
      onClick={onClick}
      disabled={disabled}
      aria-label={`Discuss ${componentName}`}
      title={size === 'small' ? `Discuss ${componentName}` : undefined}
    >
      <svg
        className="discuss-button__icon"
        width="14"
        height="14"
        viewBox="0 0 16 16"
        fill="currentColor"
        aria-hidden="true"
      >
        {/* Speech bubble icon */}
        <path d="M14 1a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H4.414a1 1 0 0 0-.707.293L2 13v-1a1 1 0 0 0-1-1V2a1 1 0 0 1 1-1h12zm0-1H2a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h.5v3.5a.5.5 0 0 0 .854.354l3.853-3.854H14a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2z" />
      </svg>
      {size === 'medium' && (
        <span className="discuss-button__label">Let's Discuss</span>
      )}
    </button>
  );
}
