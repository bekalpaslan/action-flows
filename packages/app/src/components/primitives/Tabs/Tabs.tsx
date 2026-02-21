import React, { forwardRef, useRef, KeyboardEvent } from 'react';
import './Tabs.css';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (id: string) => void;
  variant?: 'underline' | 'pills' | 'enclosed';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const Tabs = forwardRef<HTMLDivElement, TabsProps>(
  (
    {
      tabs,
      activeTab,
      onTabChange,
      variant = 'underline',
      size = 'md',
      fullWidth = false,
      className,
      ...props
    },
    ref
  ) => {
    const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

    const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
      let targetIndex: number | null = null;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        targetIndex = currentIndex - 1;
        if (targetIndex < 0) targetIndex = tabs.length - 1;
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        targetIndex = currentIndex + 1;
        if (targetIndex >= tabs.length) targetIndex = 0;
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const tab = tabs[currentIndex];
        if (!tab.disabled) {
          onTabChange(tab.id);
        }
        return;
      }

      if (targetIndex !== null) {
        // Find next non-disabled tab
        let attempts = 0;
        while (attempts < tabs.length) {
          const targetTab = tabs[targetIndex];
          if (!targetTab.disabled) {
            const button = tabRefs.current.get(targetTab.id);
            button?.focus();
            break;
          }
          if (e.key === 'ArrowLeft') {
            targetIndex--;
            if (targetIndex < 0) targetIndex = tabs.length - 1;
          } else {
            targetIndex++;
            if (targetIndex >= tabs.length) targetIndex = 0;
          }
          attempts++;
        }
      }
    };

    const containerClassName = [
      'afw-tabs',
      `afw-tabs--${variant}`,
      `afw-tabs--${size}`,
      fullWidth && 'afw-tabs--full-width',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div ref={ref} className={containerClassName} role="tablist" {...props}>
        {tabs.map((tab, index) => {
          const isActive = tab.id === activeTab;
          const buttonClassName = [
            'afw-tabs__tab',
            isActive && 'afw-tabs__tab--active',
            tab.disabled && 'afw-tabs__tab--disabled',
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <button
              key={tab.id}
              ref={(el) => {
                if (el) {
                  tabRefs.current.set(tab.id, el);
                } else {
                  tabRefs.current.delete(tab.id);
                }
              }}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-disabled={tab.disabled}
              tabIndex={isActive ? 0 : -1}
              className={buttonClassName}
              onClick={() => !tab.disabled && onTabChange(tab.id)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              disabled={tab.disabled}
            >
              {tab.icon && <span className="afw-tabs__icon">{tab.icon}</span>}
              <span className="afw-tabs__label">{tab.label}</span>
            </button>
          );
        })}
      </div>
    );
  }
);

Tabs.displayName = 'Tabs';
