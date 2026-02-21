import React, { forwardRef, useState, useRef, useEffect, useId } from 'react';
import './Select.css';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  error?: boolean;
  label?: string;
}

export const Select = forwardRef<HTMLDivElement, SelectProps>(
  (
    {
      options,
      value,
      onChange,
      placeholder = 'Select...',
      disabled = false,
      size = 'md',
      error = false,
      label,
      className,
      ...props
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const id = useId();

    const selectedOption = options.find((opt) => opt.value === value);

    useEffect(() => {
      if (!isOpen) return;

      const handleClickOutside = (e: MouseEvent) => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(e.target as Node) &&
          triggerRef.current &&
          !triggerRef.current.contains(e.target as Node)
        ) {
          setIsOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const handleToggle = () => {
      if (!disabled) {
        setIsOpen(!isOpen);
      }
    };

    const handleSelect = (optionValue: string) => {
      if (onChange) {
        onChange(optionValue);
      }
      setIsOpen(false);
      setActiveIndex(-1);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (disabled) return;

      switch (e.key) {
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (!isOpen) {
            setIsOpen(true);
          } else if (activeIndex >= 0 && !options[activeIndex].disabled) {
            handleSelect(options[activeIndex].value);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          setActiveIndex(-1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (!isOpen) {
            setIsOpen(true);
          } else {
            let nextIndex = activeIndex + 1;
            while (nextIndex < options.length && options[nextIndex].disabled) {
              nextIndex++;
            }
            if (nextIndex < options.length) {
              setActiveIndex(nextIndex);
            }
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (isOpen) {
            let prevIndex = activeIndex - 1;
            while (prevIndex >= 0 && options[prevIndex].disabled) {
              prevIndex--;
            }
            if (prevIndex >= 0) {
              setActiveIndex(prevIndex);
            }
          }
          break;
      }
    };

    return (
      <div ref={ref} className={`afw-select ${className || ''}`} {...props}>
        {label && (
          <label htmlFor={id} className="afw-select__label">
            {label}
          </label>
        )}
        <div className="afw-select__container">
          <button
            ref={triggerRef}
            id={id}
            type="button"
            disabled={disabled}
            onClick={handleToggle}
            onKeyDown={handleKeyDown}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            className="afw-select__trigger"
            data-size={size}
            data-error={error}
            data-open={isOpen}
          >
            <span className="afw-select__trigger-text">
              {selectedOption ? selectedOption.label : placeholder}
            </span>
            <svg
              className="afw-select__chevron"
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
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
          {isOpen && (
            <div
              ref={dropdownRef}
              role="listbox"
              className="afw-select__dropdown"
              aria-activedescendant={
                activeIndex >= 0 ? `${id}-option-${activeIndex}` : undefined
              }
            >
              {options.map((option, index) => (
                <div
                  key={option.value}
                  id={`${id}-option-${index}`}
                  role="option"
                  aria-selected={option.value === value}
                  aria-disabled={option.disabled}
                  className="afw-select__option"
                  data-selected={option.value === value}
                  data-active={index === activeIndex}
                  data-disabled={option.disabled}
                  onClick={() => !option.disabled && handleSelect(option.value)}
                  onMouseEnter={() => !option.disabled && setActiveIndex(index)}
                >
                  {option.label}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }
);

Select.displayName = 'Select';
