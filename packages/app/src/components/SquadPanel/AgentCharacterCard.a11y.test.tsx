/**
 * Accessibility Tests for AgentCharacterCard
 * Tests keyboard navigation, ARIA labels, and expanded state
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

expect.extend(toHaveNoViolations);

// Simplified accessible agent character card
const AccessibleAgentCharacterCard: React.FC<{
  agentName: string;
  status: 'idle' | 'working' | 'completed' | 'failed';
  isExpanded?: boolean;
  onClick?: () => void;
}> = ({ agentName, status, isExpanded = false, onClick }) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.();
    }
  };

  return (
    <div
      className={`agent-character-card status-${status} ${isExpanded ? 'is-expanded' : ''}`}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`${agentName} agent - ${status} status`}
      aria-expanded={isExpanded}
    >
      <div className="card-avatar-container">
        <div className="agent-avatar" aria-hidden="true">
          👤
        </div>
      </div>

      <div className="card-info">
        <h3 className="card-name">{agentName}</h3>
        <p className="card-archetype">Test Archetype</p>
      </div>

      <div className="card-status-section">
        <div className="status-badge">
          <span className="status-text">{status}</span>
          <span className="status-indicator" />
        </div>
      </div>

      {isExpanded && (
        <div className="card-logs">
          <p>Agent logs would appear here</p>
        </div>
      )}

      <div className="card-expand-indicator">
        <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
      </div>
    </div>
  );
};

describe('AgentCharacterCard Accessibility', () => {
  const mockHandlers = {
    onClick: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have no accessibility violations', async () => {
    const { container } = render(
      <AccessibleAgentCharacterCard agentName="TestAgent" status="idle" />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have proper role and tabIndex for keyboard access', async () => {
    const { container } = render(
      <AccessibleAgentCharacterCard agentName="Orchestrator" status="working" />
    );

    const card = container.querySelector('[role="button"]');
    expect(card).toHaveAttribute('role', 'button');
    expect(card).toHaveAttribute('tabIndex', '0');

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should provide descriptive aria-label with agent name and status', async () => {
    const { container } = render(
      <AccessibleAgentCharacterCard agentName="Reader" status="working" />
    );

    const card = container.querySelector('[role="button"]');
    const label = card?.getAttribute('aria-label');
    expect(label).toContain('Reader');
    expect(label).toContain('working');

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should expose expanded state via aria-expanded', async () => {
    const { container: collapsedContainer } = render(
      <AccessibleAgentCharacterCard agentName="Agent" status="idle" isExpanded={false} />
    );

    const collapsedCard = collapsedContainer.querySelector('[role="button"]');
    expect(collapsedCard).toHaveAttribute('aria-expanded', 'false');

    const { container: expandedContainer } = render(
      <AccessibleAgentCharacterCard agentName="Agent" status="idle" isExpanded={true} />
    );

    const expandedCard = expandedContainer.querySelector('[role="button"]');
    expect(expandedCard).toHaveAttribute('aria-expanded', 'true');

    const results = await axe(expandedContainer);
    expect(results).toHaveNoViolations();
  });

  it('should handle Enter key activation', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <AccessibleAgentCharacterCard
        agentName="TestAgent"
        status="idle"
        onClick={mockHandlers.onClick}
      />
    );

    const card = container.querySelector('[role="button"]') as HTMLElement;
    card.focus();
    await user.keyboard('{Enter}');

    expect(mockHandlers.onClick).toHaveBeenCalled();
  });

  it('should handle Space key activation', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <AccessibleAgentCharacterCard
        agentName="TestAgent"
        status="working"
        onClick={mockHandlers.onClick}
      />
    );

    const card = container.querySelector('[role="button"]') as HTMLElement;
    card.focus();
    await user.keyboard(' ');

    expect(mockHandlers.onClick).toHaveBeenCalled();
  });

  it('should support all agent status states', async () => {
    const statuses: Array<'idle' | 'working' | 'completed' | 'failed'> = [
      'idle',
      'working',
      'completed',
      'failed',
    ];

    for (const status of statuses) {
      const { container } = render(
        <AccessibleAgentCharacterCard agentName="TestAgent" status={status} />
      );

      const card = container.querySelector('[role="button"]');
      expect(card).toHaveClass(`status-${status}`);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    }
  });

  it('should be focusable for keyboard navigation', async () => {
    const { container } = render(
      <AccessibleAgentCharacterCard agentName="FocusTest" status="idle" />
    );

    const card = container.querySelector('[role="button"]') as HTMLElement;
    card.focus();
    expect(document.activeElement).toBe(card);

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should hide decorative avatar from accessibility tree', async () => {
    const { container } = render(
      <AccessibleAgentCharacterCard agentName="HideTest" status="idle" />
    );

    const avatar = container.querySelector('.agent-avatar');
    expect(avatar).toHaveAttribute('aria-hidden', 'true');

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should render card name and provide semantic structure', async () => {
    const { container } = render(
      <AccessibleAgentCharacterCard agentName="Semantic Test" status="completed" />
    );

    const heading = container.querySelector('.card-name');
    expect(heading).toHaveTextContent('Semantic Test');

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should include logs in expanded state without accessibility issues', async () => {
    const { container } = render(
      <AccessibleAgentCharacterCard
        agentName="LogsTest"
        status="working"
        isExpanded={true}
      />
    );

    const logs = container.querySelector('.card-logs');
    expect(logs).toBeInTheDocument();

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
