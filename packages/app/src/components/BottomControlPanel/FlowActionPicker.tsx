import React, { useState, useRef, useEffect, useMemo } from 'react';
import type { FlowAction } from '@afw/shared';
import './FlowActionPicker.css';

export interface FlowActionPickerProps {
  flows: FlowAction[];
  actions: FlowAction[];
  recentItems?: FlowAction[];
  onSelect: (item: FlowAction) => void;
  disabled?: boolean;
}

export const FlowActionPicker: React.FC<FlowActionPickerProps> = ({
  flows,
  actions,
  recentItems = [],
  onSelect,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedItem, setSelectedItem] = useState<FlowAction | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filter and organize items based on search query
  const filteredItems = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    const filterByQuery = (items: FlowAction[]) => {
      if (!query) return items;
      return items.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.description?.toLowerCase().includes(query)
      );
    };

    return {
      recent: filterByQuery(recentItems),
      flows: filterByQuery(flows),
      actions: filterByQuery(actions),
    };
  }, [flows, actions, recentItems, searchQuery]);

  // Flatten all items for keyboard navigation
  const allItems = useMemo(() => {
    const items: FlowAction[] = [];
    if (filteredItems.recent.length > 0) items.push(...filteredItems.recent);
    if (filteredItems.flows.length > 0) items.push(...filteredItems.flows);
    if (filteredItems.actions.length > 0) items.push(...filteredItems.actions);
    return items;
  }, [filteredItems]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Reset selected index when items change
  useEffect(() => {
    setSelectedIndex(0);
  }, [allItems]);

  const handleToggle = () => {
    if (disabled) return;
    setIsOpen(!isOpen);
    if (!isOpen) {
      setSearchQuery('');
      setSelectedIndex(0);
    }
  };

  const handleSelect = (item: FlowAction) => {
    setSelectedItem(item);
    onSelect(item);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!isOpen) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleToggle();
      }
      return;
    }

    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        setIsOpen(false);
        buttonRef.current?.focus();
        break;

      case 'ArrowDown':
        event.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % allItems.length);
        break;

      case 'ArrowUp':
        event.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + allItems.length) % allItems.length);
        break;

      case 'Enter':
        event.preventDefault();
        if (allItems[selectedIndex]) {
          handleSelect(allItems[selectedIndex]);
        }
        break;

      case 'Home':
        event.preventDefault();
        setSelectedIndex(0);
        break;

      case 'End':
        event.preventDefault();
        setSelectedIndex(allItems.length - 1);
        break;
    }
  };

  const renderSection = (
    title: string,
    items: FlowAction[],
    startIndex: number
  ) => {
    if (items.length === 0) return null;

    return (
      <div className="flow-action-picker__section">
        <div className="flow-action-picker__section-header">{title}</div>
        <div className="flow-action-picker__section-items">
          {items.map((item, index) => {
            const globalIndex = startIndex + index;
            const isSelected = globalIndex === selectedIndex;

            return (
              <div
                key={item.id}
                className={`flow-action-picker__item ${
                  isSelected ? 'flow-action-picker__item--selected' : ''
                }`}
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(item)}
                onMouseEnter={() => setSelectedIndex(globalIndex)}
              >
                {item.icon && (
                  <span className="flow-action-picker__item-icon">{item.icon}</span>
                )}
                <div className="flow-action-picker__item-content">
                  <div className="flow-action-picker__item-name">{item.name}</div>
                  {item.description && (
                    <div className="flow-action-picker__item-description">
                      {item.description}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const buttonLabel = selectedItem ? selectedItem.name : 'Flows';

  return (
    <div className="flow-action-picker">
      <button
        ref={buttonRef}
        className="flow-action-picker__button"
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Select flow or action"
      >
        {selectedItem?.icon && (
          <span className="flow-action-picker__button-icon">{selectedItem.icon}</span>
        )}
        <span className="flow-action-picker__button-label">{buttonLabel}</span>
        <span className="flow-action-picker__button-arrow">▼</span>
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          className="flow-action-picker__dropdown"
          role="listbox"
          aria-label="Available flows and actions"
        >
          <div className="flow-action-picker__search">
            <input
              ref={searchInputRef}
              type="text"
              className="flow-action-picker__search-input"
              placeholder="Search flows and actions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              aria-label="Search flows and actions"
            />
          </div>

          <div className="flow-action-picker__sections">
            {allItems.length === 0 ? (
              <div className="flow-action-picker__empty">No matching items found</div>
            ) : (
              <>
                {renderSection('Recent', filteredItems.recent, 0)}
                {renderSection(
                  'Flows',
                  filteredItems.flows,
                  filteredItems.recent.length
                )}
                {renderSection(
                  'Actions',
                  filteredItems.actions,
                  filteredItems.recent.length + filteredItems.flows.length
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
