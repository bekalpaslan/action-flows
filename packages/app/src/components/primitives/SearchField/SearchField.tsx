import React, { forwardRef, useId, useState, useCallback, useRef, useEffect } from 'react';
import { Input } from '../Input';
import './SearchField.css';

export interface SearchFieldSuggestion {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
}

export interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  suggestions?: SearchFieldSuggestion[];
  onSelect?: (suggestion: SearchFieldSuggestion) => void;
  onSubmit?: (value: string) => void;
  placeholder?: string;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  noResultsText?: string;
  className?: string;
  id?: string;
  fullWidth?: boolean;
  maxDropdownHeight?: number;
}

export const SearchField = forwardRef<HTMLInputElement, SearchFieldProps>(
  (
    {
      value,
      onChange,
      suggestions = [],
      onSelect,
      onSubmit,
      placeholder = 'Search...',
      label,
      size = 'md',
      disabled = false,
      loading = false,
      noResultsText = 'No results found',
      className,
      id: providedId,
      fullWidth = false,
      maxDropdownHeight = 300,
    },
    ref
  ) => {
    const autoId = useId();
    const id = providedId || autoId;
    const dropdownId = `${id}-dropdown`;

    const [isFocused, setIsFocused] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const itemRefs = useRef<Map<number, HTMLDivElement>>(new Map());
    const blurTimeoutRef = useRef<number | null>(null);

    // Dropdown should show when focused AND (has suggestions OR loading)
    const showDropdown = isFocused && (suggestions.length > 0 || loading);

    // Clear blur timeout on unmount
    useEffect(() => {
      return () => {
        if (blurTimeoutRef.current !== null) {
          window.clearTimeout(blurTimeoutRef.current);
        }
      };
    }, []);

    // Scroll highlighted item into view
    useEffect(() => {
      if (highlightedIndex >= 0 && itemRefs.current.has(highlightedIndex)) {
        const item = itemRefs.current.get(highlightedIndex);
        if (item && dropdownRef.current) {
          const dropdownRect = dropdownRef.current.getBoundingClientRect();
          const itemRect = item.getBoundingClientRect();

          if (itemRect.bottom > dropdownRect.bottom) {
            item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
          } else if (itemRect.top < dropdownRect.top) {
            item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
          }
        }
      }
    }, [highlightedIndex]);

    const handleFocus = useCallback(() => {
      if (blurTimeoutRef.current !== null) {
        window.clearTimeout(blurTimeoutRef.current);
        blurTimeoutRef.current = null;
      }
      setIsFocused(true);
    }, []);

    const handleBlur = useCallback(() => {
      // Delay closing dropdown so click on item can register
      blurTimeoutRef.current = window.setTimeout(() => {
        setIsFocused(false);
        setHighlightedIndex(-1);
      }, 200);
    }, []);

    const handleSelect = useCallback(
      (suggestion: SearchFieldSuggestion) => {
        if (onSelect) {
          onSelect(suggestion);
        }
        onChange(suggestion.label);
        setIsFocused(false);
        setHighlightedIndex(-1);
      },
      [onSelect, onChange]
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!showDropdown) {
          if (e.key === 'Enter' && onSubmit) {
            e.preventDefault();
            onSubmit(value);
          }
          return;
        }

        switch (e.key) {
          case 'ArrowDown':
            e.preventDefault();
            setHighlightedIndex((prev) =>
              prev < suggestions.length - 1 ? prev + 1 : prev
            );
            break;

          case 'ArrowUp':
            e.preventDefault();
            setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
            break;

          case 'Enter':
            e.preventDefault();
            if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
              handleSelect(suggestions[highlightedIndex]);
            } else if (onSubmit) {
              onSubmit(value);
            }
            break;

          case 'Escape':
            e.preventDefault();
            setIsFocused(false);
            setHighlightedIndex(-1);
            break;

          default:
            break;
        }
      },
      [showDropdown, suggestions, highlightedIndex, value, onSubmit, handleSelect]
    );

    const handleItemClick = useCallback(
      (suggestion: SearchFieldSuggestion) => {
        handleSelect(suggestion);
      },
      [handleSelect]
    );

    // SVG Icon
    const SearchIcon = () => (
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
        <line x1="10.5" y1="10.5" x2="13.5" y2="13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );

    // Render suffix for Input
    const renderSuffix = () => {
      if (!value) return undefined;

      return (
        <>
          <span className="afw-search-field__divider" />
          <button
            type="button"
            className="afw-search-field__search-btn"
            onClick={() => onSubmit && onSubmit(value)}
            aria-label="Search"
            tabIndex={-1}
          >
            <SearchIcon />
          </button>
        </>
      );
    };

    const containerClasses = [
      'afw-search-field',
      fullWidth && 'afw-search-field--full-width',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={containerClasses}>
        <Input
          ref={ref}
          id={id}
          variant="search"
          size={size}
          label={label}
          value={value}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          clearable
          onClear={() => onChange('')}
          fullWidth={fullWidth}
          suffix={renderSuffix()}
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls={showDropdown ? dropdownId : undefined}
          aria-activedescendant={
            highlightedIndex >= 0 && suggestions[highlightedIndex]
              ? `${dropdownId}-item-${suggestions[highlightedIndex].id}`
              : undefined
          }
          aria-autocomplete="list"
        />

        {showDropdown && (
          <div
            ref={dropdownRef}
            id={dropdownId}
            className="afw-search-field__dropdown afw-search-field__dropdown--open"
            role="listbox"
            style={{ maxHeight: `${maxDropdownHeight}px` }}
          >
            {loading ? (
              <div className="afw-search-field__loading">
                <span className="afw-search-field__loading-spinner" />
                Loading...
              </div>
            ) : suggestions.length > 0 ? (
              suggestions.map((suggestion, index) => {
                const isHighlighted = index === highlightedIndex;
                const itemId = `${dropdownId}-item-${suggestion.id}`;

                return (
                  <div
                    key={suggestion.id}
                    ref={(el) => {
                      if (el) {
                        itemRefs.current.set(index, el);
                      } else {
                        itemRefs.current.delete(index);
                      }
                    }}
                    id={itemId}
                    className={[
                      'afw-search-field__item',
                      isHighlighted && 'afw-search-field__item--highlighted',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    role="option"
                    aria-selected={isHighlighted}
                    onClick={() => handleItemClick(suggestion)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                  >
                    {suggestion.icon && (
                      <span className="afw-search-field__item-icon">
                        {suggestion.icon}
                      </span>
                    )}
                    <div className="afw-search-field__item-content">
                      <div className="afw-search-field__item-label">
                        {suggestion.label}
                      </div>
                      {suggestion.description && (
                        <div className="afw-search-field__item-description">
                          {suggestion.description}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="afw-search-field__no-results">{noResultsText}</div>
            )}
          </div>
        )}
      </div>
    );
  }
);

SearchField.displayName = 'SearchField';

export default SearchField;
