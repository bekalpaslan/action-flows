import React from 'react';
import './Skeleton.css';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  lines?: number;
  animate?: boolean;
}

export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  (
    {
      variant = 'text',
      width,
      height,
      lines = 1,
      animate = true,
      className,
      style,
      ...props
    },
    ref
  ) => {
    const baseClassName = 'afw-skeleton';
    const variantClassName = `afw-skeleton--${variant}`;
    const animateClassName = animate ? 'afw-skeleton--animate' : '';

    const combinedClassName = [
      baseClassName,
      variantClassName,
      animateClassName,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const inlineStyle: React.CSSProperties = {
      ...style,
      width: typeof width === 'number' ? `${width}px` : width,
      height: typeof height === 'number' ? `${height}px` : height,
    };

    // For text variant with multiple lines
    if (variant === 'text' && lines > 1) {
      return (
        <div
          ref={ref}
          className="afw-skeleton__text-group"
          aria-hidden="true"
          {...props}
        >
          {Array.from({ length: lines }, (_, index) => (
            <div
              key={index}
              className={combinedClassName}
              style={{
                ...inlineStyle,
                width:
                  index === lines - 1
                    ? '80%'
                    : typeof width === 'number'
                      ? `${width}px`
                      : width,
              }}
            />
          ))}
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={combinedClassName}
        style={inlineStyle}
        aria-hidden="true"
        {...props}
      />
    );
  }
);

Skeleton.displayName = 'Skeleton';
