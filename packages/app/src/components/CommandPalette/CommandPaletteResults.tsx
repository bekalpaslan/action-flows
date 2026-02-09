import React, { useEffect, useRef } from 'react';
import type { Command, CommandCategory } from '../../utils/commandRegistry';
import './CommandPaletteResults.css';

export interface CommandPaletteResultsProps {
  results: Command[];
  selectedIndex: number;
  onSelect: (command: Command) => void;
  onHover: (index: number) => void;
  emptyMessage?: string;
}

interface GroupedCommands {
  category: CommandCategory;
  commands: Command[];
}

const CATEGORY_LABELS: Record<CommandCategory, string> = {
  navigation: 'Navigation',
  session: 'Session',
  flow: 'Flow',
  system: 'System',
  recent: 'Recent',
};

const CATEGORY_ORDER: CommandCategory[] = ['recent', 'navigation', 'session', 'flow', 'system'];

export const CommandPaletteResults: React.FC<CommandPaletteResultsProps> = ({
  results,
  selectedIndex,
  onSelect,
  onHover,
  emptyMessage = 'No commands found',
}) => {
  const selectedItemRef = useRef<HTMLDivElement>(null);

  // Group results by category
  const groupedResults = React.useMemo(() => {
    const groups = new Map<CommandCategory, Command[]>();

    results.forEach((command) => {
      const existing = groups.get(command.category) || [];
      groups.set(command.category, [...existing, command]);
    });

    const grouped: GroupedCommands[] = [];
    CATEGORY_ORDER.forEach((category) => {
      const commands = groups.get(category);
      if (commands && commands.length > 0) {
        grouped.push({ category, commands });
      }
    });

    return grouped;
  }, [results]);

  // Calculate the flat index for each command (for selection tracking)
  const flatResults = React.useMemo(() => {
    return results;
  }, [results]);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedItemRef.current) {
      selectedItemRef.current.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      });
    }
  }, [selectedIndex]);

  if (results.length === 0) {
    return (
      <div id="command-palette-results" className="command-palette-results" role="listbox">
        <div className="command-palette-empty">{emptyMessage}</div>
      </div>
    );
  }

  let currentIndex = 0;

  return (
    <div id="command-palette-results" className="command-palette-results" role="listbox">
      {groupedResults.map((group) => (
        <div key={group.category} className="command-palette-group">
          <div className="command-palette-category-header">
            {CATEGORY_LABELS[group.category]}
          </div>
          {group.commands.map((command) => {
            const itemIndex = currentIndex++;
            const isSelected = itemIndex === selectedIndex;

            return (
              <div
                key={command.id}
                ref={isSelected ? selectedItemRef : null}
                className={`command-palette-item ${isSelected ? 'selected' : ''}`}
                role="option"
                aria-selected={isSelected}
                onClick={() => onSelect(command)}
                onMouseEnter={() => onHover(itemIndex)}
              >
                <div className="command-palette-item-left">
                  {command.icon && (
                    <span className="command-palette-item-icon">{command.icon}</span>
                  )}
                  <div className="command-palette-item-content">
                    <div className="command-palette-item-title">{command.title}</div>
                    {command.description && (
                      <div className="command-palette-item-description">
                        {command.description}
                      </div>
                    )}
                  </div>
                </div>
                {command.shortcut && (
                  <kbd className="command-palette-item-shortcut">{command.shortcut}</kbd>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};
