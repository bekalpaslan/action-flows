import React, { forwardRef } from 'react';
import './Grid.css';

interface ResponsiveConfig {
  colSpan?: number | 'full';
  rowSpan?: number | 'full';
  colStart?: number;
  rowStart?: number;
}

export interface GridItemProps extends React.HTMLAttributes<HTMLDivElement> {
  colSpan?: number | 'full';
  rowSpan?: number | 'full';
  colStart?: number;
  rowStart?: number;
  responsive?: {
    mobile?: ResponsiveConfig;
    tablet?: ResponsiveConfig;
    desktop?: ResponsiveConfig;
    wide?: ResponsiveConfig;
  };
  alignSelf?: 'start' | 'end' | 'center' | 'stretch';
  justifySelf?: 'start' | 'end' | 'center' | 'stretch';
  className?: string;
  children: React.ReactNode;
}

export const GridItem = forwardRef<HTMLDivElement, GridItemProps>(
  (
    {
      colSpan,
      rowSpan,
      colStart,
      rowStart,
      responsive,
      alignSelf,
      justifySelf,
      className = '',
      children,
      style,
      ...rest
    },
    ref
  ) => {
    const classes = [
      'afw-grid__item',
      colSpan === 'full' && 'afw-grid__item--col-full',
      rowSpan === 'full' && 'afw-grid__item--row-full',
      responsive?.mobile?.colSpan === 'full' && 'afw-grid__item--mobile-full',
      responsive?.tablet?.colSpan === 'full' && 'afw-grid__item--tablet-full',
      responsive?.desktop?.colSpan === 'full' && 'afw-grid__item--desktop-full',
      responsive?.wide?.colSpan === 'full' && 'afw-grid__item--wide-full',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const customProps: Record<string, string | number> = {};

    // Base responsive values
    if (typeof colSpan === 'number') {
      customProps['--col-span'] = colSpan;
    }
    if (typeof rowSpan === 'number') {
      customProps['--row-span'] = rowSpan;
    }
    if (colStart !== undefined) {
      customProps['--col-start'] = colStart;
    }
    if (rowStart !== undefined) {
      customProps['--row-start'] = rowStart;
    }

    // Responsive overrides
    if (responsive?.mobile) {
      const { colSpan: mColSpan, rowSpan: mRowSpan, colStart: mColStart, rowStart: mRowStart } = responsive.mobile;
      if (typeof mColSpan === 'number') customProps['--col-span-mobile'] = mColSpan;
      // 'full' handled by class modifier
      if (typeof mRowSpan === 'number') customProps['--row-span-mobile'] = mRowSpan;
      // 'full' handled by class modifier
      if (mColStart !== undefined) customProps['--col-start-mobile'] = mColStart;
      if (mRowStart !== undefined) customProps['--row-start-mobile'] = mRowStart;
    }

    if (responsive?.tablet) {
      const { colSpan: tColSpan, rowSpan: tRowSpan, colStart: tColStart, rowStart: tRowStart } = responsive.tablet;
      if (typeof tColSpan === 'number') customProps['--col-span-tablet'] = tColSpan;
      // 'full' handled by class modifier
      if (typeof tRowSpan === 'number') customProps['--row-span-tablet'] = tRowSpan;
      // 'full' handled by class modifier
      if (tColStart !== undefined) customProps['--col-start-tablet'] = tColStart;
      if (tRowStart !== undefined) customProps['--row-start-tablet'] = tRowStart;
    }

    if (responsive?.desktop) {
      const { colSpan: dColSpan, rowSpan: dRowSpan, colStart: dColStart, rowStart: dRowStart } = responsive.desktop;
      if (typeof dColSpan === 'number') customProps['--col-span-desktop'] = dColSpan;
      // 'full' handled by class modifier
      if (typeof dRowSpan === 'number') customProps['--row-span-desktop'] = dRowSpan;
      // 'full' handled by class modifier
      if (dColStart !== undefined) customProps['--col-start-desktop'] = dColStart;
      if (dRowStart !== undefined) customProps['--row-start-desktop'] = dRowStart;
    }

    if (responsive?.wide) {
      const { colSpan: wColSpan, rowSpan: wRowSpan, colStart: wColStart, rowStart: wRowStart } = responsive.wide;
      if (typeof wColSpan === 'number') customProps['--col-span-wide'] = wColSpan;
      // 'full' handled by class modifier
      if (typeof wRowSpan === 'number') customProps['--row-span-wide'] = wRowSpan;
      // 'full' handled by class modifier
      if (wColStart !== undefined) customProps['--col-start-wide'] = wColStart;
      if (wRowStart !== undefined) customProps['--row-start-wide'] = wRowStart;
    }

    const inlineStyle: React.CSSProperties = {
      ...style,
      ...(customProps as React.CSSProperties),
      ...(alignSelf && { alignSelf }),
      ...(justifySelf && { justifySelf }),
    };

    return (
      <div ref={ref} className={classes} style={inlineStyle} {...rest}>
        {children}
      </div>
    );
  }
);

GridItem.displayName = 'GridItem';
