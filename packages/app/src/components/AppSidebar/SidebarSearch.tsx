/**
 * SidebarSearch Component
 * Search input for filtering workbenches
 */

import React from 'react';

export interface SidebarSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const SidebarSearch: React.FC<SidebarSearchProps> = ({
  value,
  onChange,
  placeholder = 'Search...',
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleClear = () => {
    onChange('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      handleClear();
    }
  };

  return (
    <div className="app-sidebar__search">
      <svg
        className="app-sidebar__search-icon"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input
        type="text"
        className="app-sidebar__search-input"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        aria-label="Search workbenches"
      />
      {value && (
        <button
          className="app-sidebar__search-clear"
          onClick={handleClear}
          aria-label="Clear search"
          title="Clear search"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </div>
  );
};
