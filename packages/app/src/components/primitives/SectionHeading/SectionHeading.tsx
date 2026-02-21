import React from 'react';
import './SectionHeading.css';

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export interface SectionHeadingProps extends React.HTMLAttributes<HTMLElement> {
  /** Heading level (determines HTML tag h1-h6) */
  level?: HeadingLevel;
  /** Visual size (can differ from semantic level) */
  size?: 'xl' | 'lg' | 'md' | 'sm' | 'xs';
  /** Color variant */
  color?: 'primary' | 'secondary' | 'accent' | 'muted';
  /** Optional subtitle below the heading */
  subtitle?: string;
  /** Subtitle color */
  subtitleColor?: 'primary' | 'secondary' | 'accent' | 'muted';
  /** Content */
  children: React.ReactNode;
}

export const SectionHeading = React.forwardRef<HTMLDivElement, SectionHeadingProps>(
  (
    {
      level = 2,
      size = 'md',
      color = 'primary',
      subtitle,
      subtitleColor = 'secondary',
      children,
      className,
      ...props
    },
    ref
  ) => {
    const headingClassName = [
      'afw-section-heading__title',
      `afw-section-heading__title--${size}`,
      `afw-section-heading__title--${color}`,
    ].join(' ');

    const headingElement = React.createElement(
      `h${level}`,
      { className: headingClassName },
      children
    );

    return (
      <div
        ref={ref}
        className={['afw-section-heading', className].filter(Boolean).join(' ')}
        {...props}
      >
        {headingElement}
        {subtitle && (
          <p
            className={[
              'afw-section-heading__subtitle',
              `afw-section-heading__subtitle--${subtitleColor}`,
            ].join(' ')}
          >
            {subtitle}
          </p>
        )}
      </div>
    );
  }
);

SectionHeading.displayName = 'SectionHeading';
