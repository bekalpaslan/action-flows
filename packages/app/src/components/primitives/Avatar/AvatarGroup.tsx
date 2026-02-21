import './AvatarGroup.css';
import React, { forwardRef } from 'react';

export interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Maximum visible avatars before overflow */
  max?: number;
  /** Size of all avatars in the group */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Overlap amount — proportion of avatar size */
  spacing?: 'tight' | 'normal' | 'loose';
  /** Children must be Avatar components */
  children: React.ReactNode;
}

const AVATAR_SIZES: Record<string, number> = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 56,
  xl: 96,
};

const SPACING_OVERLAP: Record<string, number> = {
  tight: 0.3,   // 30% overlap
  normal: 0.2,  // 20% overlap
  loose: 0.1,   // 10% overlap
};

const OVERFLOW_FONT_SIZES: Record<string, string> = {
  xs: '8px',
  sm: '10px',
  md: '12px',
  lg: '14px',
  xl: '18px',
};

export const AvatarGroup = forwardRef<HTMLDivElement, AvatarGroupProps>(
  (
    {
      max = 5,
      size = 'md',
      spacing = 'normal',
      children,
      className = '',
      style,
      ...rest
    },
    ref
  ) => {
    const childArray = React.Children.toArray(children);
    const totalCount = childArray.length;
    const visibleCount = Math.min(max, totalCount);
    const overflowCount = totalCount - visibleCount;

    const avatarSize = AVATAR_SIZES[size];
    const overlapRatio = SPACING_OVERLAP[spacing];
    const overlapPx = Math.round(avatarSize * overlapRatio);

    const visibleChildren = childArray.slice(0, visibleCount);

    const classNames = [
      'afw-avatar-group',
      `afw-avatar-group--${size}`,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const containerStyle: React.CSSProperties = {
      ...style,
      '--avatar-size': `${avatarSize}px`,
      '--avatar-overlap': `${overlapPx}px`,
      '--overflow-font-size': OVERFLOW_FONT_SIZES[size],
    } as React.CSSProperties;

    return (
      <div
        ref={ref}
        className={classNames}
        style={containerStyle}
        role="group"
        aria-label="User avatars"
        {...rest}
      >
        {visibleChildren.map((child, index) => (
          <div
            key={index}
            className="afw-avatar-group__item"
            style={{ zIndex: index + 1 }}
          >
            {React.isValidElement(child)
              ? React.cloneElement(child, { size } as any)
              : child}
          </div>
        ))}

        {overflowCount > 0 && (
          <div
            className="afw-avatar-group__overflow"
            style={{ zIndex: visibleCount + 1 }}
            aria-label={`${overflowCount} more`}
          >
            +{overflowCount}
          </div>
        )}
      </div>
    );
  }
);

AvatarGroup.displayName = 'AvatarGroup';
