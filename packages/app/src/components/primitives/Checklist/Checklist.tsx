import React, { forwardRef } from 'react';
import './Checklist.css';

export interface ChecklistItem {
  id: string;
  label: string;
  checked?: boolean;
}

export interface ChecklistProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Variant: inline rows or card */
  variant?: 'inline' | 'card';
  /** Checklist title (card variant) */
  title?: string;
  /** Items */
  items: ChecklistItem[];
  /** Called when item is toggled */
  onToggle?: (id: string, checked: boolean) => void;
  /** Whether items are read-only */
  readOnly?: boolean;
}

const CheckIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 18 18"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M5 9L8 12L13 6"
      stroke="var(--text-bright, #fff)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const Checklist = forwardRef<HTMLDivElement, ChecklistProps>(
  (
    {
      variant = 'inline',
      title = 'Checklist',
      items,
      onToggle,
      readOnly = false,
      className,
      ...props
    },
    ref
  ) => {
    const handleToggle = (id: string, currentChecked: boolean) => {
      if (readOnly || !onToggle) return;
      onToggle(id, !currentChecked);
    };

    const handleKeyDown = (
      e: React.KeyboardEvent,
      id: string,
      currentChecked: boolean
    ) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleToggle(id, currentChecked);
      }
    };

    const renderRow = (item: ChecklistItem, includeStatus: boolean = true) => {
      const checked = item.checked ?? false;

      return (
        <div key={item.id} className="afw-checklist__row">
          <button
            type="button"
            role="checkbox"
            aria-checked={checked}
            aria-label={item.label}
            disabled={readOnly}
            className={`afw-checklist__checkbox ${
              checked ? 'afw-checklist__checkbox--checked' : ''
            }`}
            onClick={() => handleToggle(item.id, checked)}
            onKeyDown={(e) => handleKeyDown(e, item.id, checked)}
          >
            {checked && <CheckIcon />}
          </button>
          <span
            className={`afw-checklist__label ${
              checked ? 'afw-checklist__label--checked' : ''
            }`}
          >
            {item.label}
          </span>
          {includeStatus && variant === 'inline' && (
            <span
              className={`afw-checklist__status ${
                checked ? 'afw-checklist__status--done' : ''
              }`}
            >
              {checked ? 'Done' : 'To do'}
            </span>
          )}
        </div>
      );
    };

    if (variant === 'card') {
      return (
        <div
          ref={ref}
          className={`afw-checklist afw-checklist--card ${className || ''}`}
          {...props}
        >
          <div className="afw-checklist__header">{title}</div>
          <div className="afw-checklist__list">
            {items.map((item) => renderRow(item, false))}
          </div>
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={`afw-checklist afw-checklist--inline ${className || ''}`}
        {...props}
      >
        {items.map((item) => renderRow(item, true))}
      </div>
    );
  }
);

Checklist.displayName = 'Checklist';
