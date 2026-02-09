import React, { useState, useRef, useEffect, useMemo } from 'react';
import type { FlowAction } from '@afw/shared';
import type { ChecklistItem, HumanPromptItem, PromptLibraryTab } from './types';
import './SmartPromptLibrary.css';

export interface SmartPromptLibraryProps {
  flows: FlowAction[];
  actions: FlowAction[];
  checklists?: ChecklistItem[];
  humanPrompts?: HumanPromptItem[];
  onSelectFlow: (item: FlowAction) => void;
  onSelectChecklist?: (item: ChecklistItem) => void;
  onSelectPrompt?: (item: HumanPromptItem) => void;
  height?: number | string;
}

export const SmartPromptLibrary: React.FC<SmartPromptLibraryProps> = ({
  flows,
  actions,
  checklists = [],
  humanPrompts = [],
  onSelectFlow,
  onSelectChecklist,
  onSelectPrompt,
  height = 180,
}) => {
  const [activeTab, setActiveTab] = useState<PromptLibraryTab>('flows');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [recentItems, setRecentItems] = useState<string[]>([]);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // Load recent items from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('smart-prompt-library-recent');
    if (stored) {
      try {
        setRecentItems(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse recent items:', e);
      }
    }
  }, []);

  // Save recent items when updated
  const addToRecent = (itemId: string) => {
    const updated = [itemId, ...recentItems.filter((id) => id !== itemId)].slice(0, 10);
    setRecentItems(updated);
    localStorage.setItem('smart-prompt-library-recent', JSON.stringify(updated));
  };

  // Get all items for current tab
  const currentItems = useMemo(() => {
    switch (activeTab) {
      case 'flows':
        return flows;
      case 'actions':
        return actions;
      case 'checklists':
        return checklists;
      case 'prompts':
        return humanPrompts;
      default:
        return [];
    }
  }, [activeTab, flows, actions, checklists, humanPrompts]);

  // Filter items based on search query
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return currentItems;

    const query = searchQuery.toLowerCase();
    return currentItems.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query)
    );
  }, [currentItems, searchQuery]);

  const getCategoryLabel = (item: FlowAction | ChecklistItem | HumanPromptItem): string => {
    if ('category' in item) {
      if (activeTab === 'flows' || activeTab === 'actions') {
        return item.category === 'flow' ? 'Flows' : 'Actions';
      }
      return item.category.charAt(0).toUpperCase() + item.category.slice(1);
    }
    return 'Other';
  };

  // Group items by category
  const groupedItems = useMemo(() => {
    const groups = new Map<string, Array<FlowAction | ChecklistItem | HumanPromptItem>>();

    // Add recent section if applicable
    if (!searchQuery && (activeTab === 'flows' || activeTab === 'actions')) {
      const recentFlowActions = filteredItems.filter((item) =>
        recentItems.includes(item.id)
      );
      if (recentFlowActions.length > 0) {
        groups.set('Recent', recentFlowActions);
      }
    }

    // Group by category
    filteredItems.forEach((item) => {
      const category = getCategoryLabel(item);
      if (!groups.has(category)) {
        groups.set(category, []);
      }
      groups.get(category)!.push(item);
    });

    return Array.from(groups.entries());
  }, [filteredItems, searchQuery, activeTab, recentItems]);

  // Flatten for keyboard navigation
  const allFlatItems = useMemo(() => {
    return groupedItems.flatMap(([, items]) => items);
  }, [groupedItems]);

  // Reset selected index when items change
  useEffect(() => {
    setSelectedIndex(0);
  }, [allFlatItems]);

  const handleSelect = (item: FlowAction | ChecklistItem | HumanPromptItem) => {
    addToRecent(item.id);

    if (activeTab === 'flows' || activeTab === 'actions') {
      onSelectFlow(item as FlowAction);
    } else if (activeTab === 'checklists' && onSelectChecklist) {
      onSelectChecklist(item as ChecklistItem);
    } else if (activeTab === 'prompts' && onSelectPrompt) {
      onSelectPrompt(item as HumanPromptItem);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        setSearchQuery('');
        searchInputRef.current?.blur();
        break;

      case 'ArrowDown':
        event.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % allFlatItems.length);
        break;

      case 'ArrowUp':
        event.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + allFlatItems.length) % allFlatItems.length);
        break;

      case 'Enter':
        event.preventDefault();
        if (allFlatItems[selectedIndex]) {
          handleSelect(allFlatItems[selectedIndex]);
        }
        break;

      case 'Home':
        event.preventDefault();
        setSelectedIndex(0);
        break;

      case 'End':
        event.preventDefault();
        setSelectedIndex(allFlatItems.length - 1);
        break;
    }
  };

  const renderButton = (item: FlowAction | ChecklistItem | HumanPromptItem, globalIndex: number) => {
    const isSelected = globalIndex === selectedIndex;
    const isFavorite = recentItems.includes(item.id);

    return (
      <button
        key={item.id}
        className={`smart-prompt-library__button ${
          isSelected ? 'smart-prompt-library__button--selected' : ''
        } ${isFavorite ? 'smart-prompt-library__button--favorite' : ''}`}
        onClick={() => handleSelect(item)}
        onMouseEnter={() => setSelectedIndex(globalIndex)}
        aria-label={`${item.name}${item.description ? `: ${item.description}` : ''}`}
        title={item.description}
      >
        {item.icon && (
          <span className="smart-prompt-library__button-icon">{item.icon}</span>
        )}
        <span className="smart-prompt-library__button-label">{item.name}</span>
        {isFavorite && (
          <span className="smart-prompt-library__button-star">★</span>
        )}
      </button>
    );
  };

  const renderContent = () => {
    if (checklists.length === 0 && activeTab === 'checklists') {
      return (
        <div className="smart-prompt-library__placeholder">
          <div className="smart-prompt-library__placeholder-icon">📋</div>
          <div className="smart-prompt-library__placeholder-text">
            Checklists coming soon
          </div>
        </div>
      );
    }

    if (humanPrompts.length === 0 && activeTab === 'prompts') {
      return (
        <div className="smart-prompt-library__placeholder">
          <div className="smart-prompt-library__placeholder-icon">💬</div>
          <div className="smart-prompt-library__placeholder-text">
            Custom prompts coming soon
          </div>
        </div>
      );
    }

    if (filteredItems.length === 0) {
      return (
        <div className="smart-prompt-library__empty">
          No items match &quot;{searchQuery}&quot;
        </div>
      );
    }

    let globalIndex = 0;
    return groupedItems.map(([category, items]) => (
      <div key={category} className="smart-prompt-library__category">
        <div className="smart-prompt-library__category-header">{category}</div>
        <div className="smart-prompt-library__category-buttons">
          {items.map((item) => {
            const button = renderButton(item, globalIndex);
            globalIndex++;
            return button;
          })}
        </div>
      </div>
    ));
  };

  const containerStyle: React.CSSProperties = {
    height: typeof height === 'number' ? `${height}px` : height,
  };

  return (
    <div className="smart-prompt-library" style={containerStyle}>
      <div className="smart-prompt-library__header">
        <button
          className="smart-prompt-library__collapse-button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label={isCollapsed ? 'Expand prompt library' : 'Collapse prompt library'}
          title={isCollapsed ? 'Expand' : 'Collapse'}
        >
          {isCollapsed ? '▶' : '▼'}
        </button>
        <h3 className="smart-prompt-library__title">Prompt Library</h3>
      </div>

      {!isCollapsed && (
        <>
          <div className="smart-prompt-library__tabs">
            <button
              className={`smart-prompt-library__tab ${
                activeTab === 'flows' ? 'smart-prompt-library__tab--active' : ''
              }`}
              onClick={() => setActiveTab('flows')}
              aria-label="Flows"
            >
              Flows
              {flows.length > 0 && (
                <span className="smart-prompt-library__tab-count">{flows.length}</span>
              )}
            </button>
            <button
              className={`smart-prompt-library__tab ${
                activeTab === 'actions' ? 'smart-prompt-library__tab--active' : ''
              }`}
              onClick={() => setActiveTab('actions')}
              aria-label="Actions"
            >
              Actions
              {actions.length > 0 && (
                <span className="smart-prompt-library__tab-count">{actions.length}</span>
              )}
            </button>
            <button
              className={`smart-prompt-library__tab ${
                activeTab === 'checklists' ? 'smart-prompt-library__tab--active' : ''
              }`}
              onClick={() => setActiveTab('checklists')}
              aria-label="Checklists"
            >
              Checklists
              {checklists.length > 0 && (
                <span className="smart-prompt-library__tab-count">{checklists.length}</span>
              )}
            </button>
            <button
              className={`smart-prompt-library__tab ${
                activeTab === 'prompts' ? 'smart-prompt-library__tab--active' : ''
              }`}
              onClick={() => setActiveTab('prompts')}
              aria-label="Prompts"
            >
              Prompts
              {humanPrompts.length > 0 && (
                <span className="smart-prompt-library__tab-count">{humanPrompts.length}</span>
              )}
            </button>
          </div>

          <div className="smart-prompt-library__search">
            <input
              ref={searchInputRef}
              type="text"
              className="smart-prompt-library__search-input"
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              aria-label={`Search ${activeTab}`}
            />
          </div>

          <div ref={gridRef} className="smart-prompt-library__grid">
            {renderContent()}
          </div>
        </>
      )}
    </div>
  );
};
