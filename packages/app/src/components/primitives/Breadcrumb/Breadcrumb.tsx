import React, { forwardRef } from 'react';
import './Breadcrumb.css';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
}

export interface BreadcrumbProps extends React.HTMLAttributes<HTMLElement> {
  items: BreadcrumbItem[];
  separator?: React.ReactNode;
  maxItems?: number;
}

export const Breadcrumb = forwardRef<HTMLElement, BreadcrumbProps>(
  ({ items, separator = '/', maxItems, className = '', ...props }, ref) => {
    const renderItems = () => {
      if (!maxItems || items.length <= maxItems) {
        return items;
      }

      const firstItems = items.slice(0, Math.floor(maxItems / 2));
      const lastItems = items.slice(-(maxItems - Math.floor(maxItems / 2) - 1));

      return [
        ...firstItems,
        { label: '...', onClick: undefined, href: undefined } as BreadcrumbItem,
        ...lastItems,
      ];
    };

    const displayItems = renderItems();

    return (
      <nav
        ref={ref}
        aria-label="Breadcrumb"
        className={`afw-breadcrumb ${className}`}
        {...props}
      >
        <ol className="afw-breadcrumb__list">
          {displayItems.map((item, index) => {
            const isLast = index === displayItems.length - 1;
            const isEllipsis = item.label === '...';

            return (
              <li key={`${item.label}-${index}`} className="afw-breadcrumb__item">
                {isLast ? (
                  <span
                    className="afw-breadcrumb__current"
                    aria-current="page"
                  >
                    {item.label}
                  </span>
                ) : (
                  <>
                    {item.href ? (
                      <a
                        href={item.href}
                        className={`afw-breadcrumb__link ${isEllipsis ? 'afw-breadcrumb__ellipsis' : ''}`}
                        onClick={item.onClick}
                      >
                        {item.label}
                      </a>
                    ) : item.onClick ? (
                      <button
                        type="button"
                        className={`afw-breadcrumb__button ${isEllipsis ? 'afw-breadcrumb__ellipsis' : ''}`}
                        onClick={item.onClick}
                      >
                        {item.label}
                      </button>
                    ) : (
                      <span className={`afw-breadcrumb__text ${isEllipsis ? 'afw-breadcrumb__ellipsis' : ''}`}>
                        {item.label}
                      </span>
                    )}
                    <span className="afw-breadcrumb__separator" aria-hidden="true">
                      {separator}
                    </span>
                  </>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    );
  }
);

Breadcrumb.displayName = 'Breadcrumb';
