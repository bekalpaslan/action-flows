import React, { forwardRef, useState } from 'react';
import './Accordion.css';

export interface AccordionItem {
  id: string;
  title: string;
  content: React.ReactNode;
  disabled?: boolean;
  defaultOpen?: boolean;
}

export interface AccordionProps extends React.HTMLAttributes<HTMLDivElement> {
  items: AccordionItem[];
  allowMultiple?: boolean;
  variant?: 'default' | 'bordered' | 'ghost';
}

export const Accordion = forwardRef<HTMLDivElement, AccordionProps>(
  ({ items, allowMultiple = false, variant = 'default', className = '', ...props }, ref) => {
    const [openItems, setOpenItems] = useState<Set<string>>(() => {
      const initialOpen = new Set<string>();
      items.forEach((item) => {
        if (item.defaultOpen && !item.disabled) {
          initialOpen.add(item.id);
        }
      });
      return initialOpen;
    });

    const toggleItem = (itemId: string) => {
      setOpenItems((prev) => {
        const next = new Set(prev);
        if (next.has(itemId)) {
          next.delete(itemId);
        } else {
          if (!allowMultiple) {
            next.clear();
          }
          next.add(itemId);
        }
        return next;
      });
    };

    const handleKeyDown = (event: React.KeyboardEvent, itemId: string) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        toggleItem(itemId);
      }
    };

    const classNames = [
      'afw-accordion',
      `afw-accordion--${variant}`,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div ref={ref} className={classNames} {...props}>
        {items.map((item) => {
          const isOpen = openItems.has(item.id);
          const contentId = `accordion-content-${item.id}`;
          const headerId = `accordion-header-${item.id}`;

          return (
            <div
              key={item.id}
              className={`afw-accordion__item ${isOpen ? 'afw-accordion__item--open' : ''} ${
                item.disabled ? 'afw-accordion__item--disabled' : ''
              }`}
            >
              <h3 className="afw-accordion__heading">
                <button
                  id={headerId}
                  type="button"
                  className="afw-accordion__header"
                  aria-expanded={isOpen}
                  aria-controls={contentId}
                  disabled={item.disabled}
                  onClick={() => !item.disabled && toggleItem(item.id)}
                  onKeyDown={(e) => !item.disabled && handleKeyDown(e, item.id)}
                >
                  <span className="afw-accordion__title">{item.title}</span>
                  <svg
                    className="afw-accordion__chevron"
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      d="M4 6L8 10L12 6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </h3>
              <div
                className={`afw-accordion__content-wrapper ${
                  isOpen ? 'afw-accordion__content-wrapper--open' : ''
                }`}
              >
                <div
                  id={contentId}
                  role="region"
                  aria-labelledby={headerId}
                  className="afw-accordion__content"
                >
                  {item.content}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }
);

Accordion.displayName = 'Accordion';
