import React, { forwardRef, useId } from 'react';
import './Toggle.css';

export interface ToggleProps extends Omit<React.HTMLAttributes<HTMLButtonElement>, 'onChange'> {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  label?: string;
  labelPosition?: 'left' | 'right';
}

export const Toggle = forwardRef<HTMLButtonElement, ToggleProps>(
  (
    {
      checked = false,
      onChange,
      size = 'md',
      disabled = false,
      label,
      labelPosition = 'right',
      className,
      ...props
    },
    ref
  ) => {
    const id = useId();

    const handleClick = () => {
      if (!disabled && onChange) {
        onChange(!checked);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if ((e.key === ' ' || e.key === 'Enter') && !disabled && onChange) {
        e.preventDefault();
        onChange(!checked);
      }
    };

    const toggle = (
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label || 'Toggle'}
        disabled={disabled}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={`afw-toggle ${className || ''}`}
        data-size={size}
        data-checked={checked}
        {...props}
      >
        <span className="afw-toggle__track">
          <span className="afw-toggle__thumb" />
        </span>
      </button>
    );

    if (!label) {
      return toggle;
    }

    return (
      <label
        htmlFor={id}
        className="afw-toggle-wrapper"
        data-label-position={labelPosition}
      >
        {labelPosition === 'left' && (
          <span className="afw-toggle-wrapper__label">{label}</span>
        )}
        {toggle}
        {labelPosition === 'right' && (
          <span className="afw-toggle-wrapper__label">{label}</span>
        )}
      </label>
    );
  }
);

Toggle.displayName = 'Toggle';
