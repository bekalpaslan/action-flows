import './Avatar.css';
import React, { forwardRef, useState } from 'react';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Image source URL */
  src?: string;
  /** Alt text for image */
  alt?: string;
  /** Initials to show when no image (1-2 chars) */
  initials?: string;
  /** Fallback icon (ReactNode) when no image or initials */
  icon?: React.ReactNode;
  /** Size variant */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Status indicator */
  status?: 'online' | 'offline' | 'busy' | 'away';
  /** Color for initials background (maps to system palette) */
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'orange' | 'purple' | 'pink' | 'teal' | 'neutral';
  /** Whether avatar is interactive (clickable) */
  interactive?: boolean;
  /** Click handler */
  onClick?: () => void;
}

const DefaultPersonIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    aria-hidden="true"
  >
    <circle cx="12" cy="8" r="4" fill="currentColor" />
    <path
      d="M4 20c0-4.418 3.582-8 8-8s8 3.582 8 8"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  (
    {
      src,
      alt = '',
      initials,
      icon,
      size = 'md',
      status,
      color = 'neutral',
      interactive = false,
      onClick,
      className = '',
      ...rest
    },
    ref
  ) => {
    const [imageError, setImageError] = useState(false);

    const handleImageError = () => {
      setImageError(true);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick?.();
      }
    };

    const hasValidImage = src && !imageError;
    const showInitials = !hasValidImage && initials;
    const showIcon = !hasValidImage && !initials;

    const classNames = [
      'afw-avatar',
      `afw-avatar--${size}`,
      interactive && 'afw-avatar--interactive',
      showInitials && `afw-avatar--${color}`,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div
        ref={ref}
        className={classNames}
        onClick={interactive ? onClick : undefined}
        onKeyDown={interactive ? handleKeyDown : undefined}
        role={interactive ? 'button' : undefined}
        tabIndex={interactive ? 0 : undefined}
        {...rest}
      >
        {hasValidImage && (
          <img
            src={src}
            alt={alt}
            className="afw-avatar__image"
            onError={handleImageError}
          />
        )}

        {showInitials && (
          <span className="afw-avatar__initials" aria-label={alt || initials}>
            {initials.slice(0, 2).toUpperCase()}
          </span>
        )}

        {showIcon && (
          <div className="afw-avatar__icon">
            {icon || <DefaultPersonIcon />}
          </div>
        )}

        {status && (
          <span
            className={`afw-avatar__status afw-avatar__status--${status}`}
            aria-label={`Status: ${status}`}
          />
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';
