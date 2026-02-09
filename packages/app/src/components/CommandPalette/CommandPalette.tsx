import React, { useEffect, useRef } from 'react';
import { useCommandPalette } from '../../hooks/useCommandPalette';
import { CommandPaletteInput } from './CommandPaletteInput';
import { CommandPaletteResults } from './CommandPaletteResults';
import './CommandPalette.css';

export const CommandPalette: React.FC = () => {
  const {
    isOpen,
    close,
    query,
    setQuery,
    results,
    selectedIndex,
    setSelectedIndex,
    executeCommand,
  } = useCommandPalette();
  const modalRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  // Close on backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current) {
      close();
    }
  };

  // Focus trap (Escape is handled by useCommandPalette hook)
  useEffect(() => {
    if (!isOpen) return;

    const modal = modalRef.current;
    if (!modal) return;

    // Focus the first focusable element (input)
    const focusableElements = modal.querySelectorAll<HTMLElement>(
      'input, button, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (firstElement) {
      firstElement.focus();
    }

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    modal.addEventListener('keydown', handleTab);
    return () => modal.removeEventListener('keydown', handleTab);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      ref={backdropRef}
      className="command-palette-backdrop"
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div
        ref={modalRef}
        className="command-palette-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
      >
        <CommandPaletteInput
          value={query}
          onChange={setQuery}
          autoFocus
        />
        <CommandPaletteResults
          results={results}
          selectedIndex={selectedIndex}
          onSelect={(cmd) => executeCommand(cmd.id)}
          onHover={setSelectedIndex}
          emptyMessage="No commands found"
        />
      </div>
    </div>
  );
};
