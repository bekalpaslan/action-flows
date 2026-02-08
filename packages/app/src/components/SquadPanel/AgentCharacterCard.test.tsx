/**
 * AgentCharacterCard & AgentAvatar Component Tests
 * Tests for character visual, hover effects, eye tracking, and click expansion
 */

import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AgentCharacterCard, AgentAvatar } from './index';
import type { AgentCharacter } from './types';

/**
 * Mock agent data for testing
 */
const mockAgent: AgentCharacter = {
  id: 'agent-1',
  role: 'orchestrator',
  name: 'Orchestrator',
  status: 'idle',
  logs: [],
  progress: 0,
  currentAction: undefined,
};

const mockSubagent: AgentCharacter = {
  id: 'agent-read',
  role: 'read',
  name: 'Reader',
  status: 'working',
  logs: [],
  progress: 65,
  currentAction: 'Reading file...',
};

describe('AgentCharacterCard', () => {
  const mockHandlers = {
    onHover: vi.fn(),
    onClick: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render agent name and archetype', () => {
      render(
        <AgentCharacterCard
          agent={mockAgent}
          size="orchestrator"
          isExpanded={false}
          onHover={mockHandlers.onHover}
          onClick={mockHandlers.onClick}
        />
      );

      expect(screen.getByText('Orchestrator')).toBeInTheDocument();
      expect(screen.getByText('Team Captain')).toBeInTheDocument();
    });

    it('should render AgentAvatar component', () => {
      const { container } = render(
        <AgentCharacterCard
          agent={mockAgent}
          size="subagent"
          isExpanded={false}
          onHover={mockHandlers.onHover}
          onClick={mockHandlers.onClick}
        />
      );

      const avatar = container.querySelector('.agent-avatar');
      expect(avatar).toBeInTheDocument();
    });

    it('should apply size variants correctly', () => {
      const { container: orchestratorContainer } = render(
        <AgentCharacterCard
          agent={mockAgent}
          size="orchestrator"
          isExpanded={false}
          onHover={mockHandlers.onHover}
          onClick={mockHandlers.onClick}
        />
      );

      const orchestratorCard = orchestratorContainer.querySelector('.size-orchestrator');
      expect(orchestratorCard).toBeInTheDocument();

      const { container: subagentContainer } = render(
        <AgentCharacterCard
          agent={mockAgent}
          size="subagent"
          isExpanded={false}
          onHover={mockHandlers.onHover}
          onClick={mockHandlers.onClick}
        />
      );

      const subagentCard = subagentContainer.querySelector('.size-subagent');
      expect(subagentCard).toBeInTheDocument();
    });
  });

  describe('Hover Interactions', () => {
    it('should call onHover on mouse enter', async () => {
      const { container } = render(
        <AgentCharacterCard
          agent={mockAgent}
          size="orchestrator"
          isExpanded={false}
          onHover={mockHandlers.onHover}
          onClick={mockHandlers.onClick}
        />
      );

      const card = container.querySelector('.agent-character-card');
      fireEvent.mouseEnter(card!);

      expect(mockHandlers.onHover).toHaveBeenCalledWith(true);
    });

    it('should call onHover with false on mouse leave', () => {
      const { container } = render(
        <AgentCharacterCard
          agent={mockAgent}
          size="orchestrator"
          isExpanded={false}
          onHover={mockHandlers.onHover}
          onClick={mockHandlers.onClick}
        />
      );

      const card = container.querySelector('.agent-character-card');
      fireEvent.mouseEnter(card!);
      fireEvent.mouseLeave(card!);

      expect(mockHandlers.onHover).toHaveBeenLastCalledWith(false);
    });

    it('should show status section on hover', async () => {
      const { container } = render(
        <AgentCharacterCard
          agent={mockSubagent}
          size="subagent"
          isExpanded={false}
          onHover={mockHandlers.onHover}
          onClick={mockHandlers.onClick}
        />
      );

      const card = container.querySelector('.agent-character-card');
      fireEvent.mouseEnter(card!);

      await waitFor(() => {
        const statusSection = container.querySelector('.card-status-section');
        expect(statusSection).toHaveStyle('opacity: 1');
      });
    });

    it('should show progress bar when working', async () => {
      const { container } = render(
        <AgentCharacterCard
          agent={mockSubagent}
          size="subagent"
          isExpanded={false}
          onHover={mockHandlers.onHover}
          onClick={mockHandlers.onClick}
        />
      );

      const card = container.querySelector('.agent-character-card');
      fireEvent.mouseEnter(card!);

      await waitFor(() => {
        const progressBar = container.querySelector('.progress-bar');
        expect(progressBar).toBeInTheDocument();
      });
    });

    it('should display current action in status badge', async () => {
      const { container } = render(
        <AgentCharacterCard
          agent={mockSubagent}
          size="subagent"
          isExpanded={false}
          onHover={mockHandlers.onHover}
          onClick={mockHandlers.onClick}
        />
      );

      const card = container.querySelector('.agent-character-card');
      fireEvent.mouseEnter(card!);

      await waitFor(() => {
        expect(screen.getByText('Reading file...')).toBeInTheDocument();
      });
    });
  });

  describe('Click Interactions', () => {
    it('should call onClick when card is clicked', () => {
      const { container } = render(
        <AgentCharacterCard
          agent={mockAgent}
          size="orchestrator"
          isExpanded={false}
          onHover={mockHandlers.onHover}
          onClick={mockHandlers.onClick}
        />
      );

      const card = container.querySelector('.agent-character-card');
      fireEvent.click(card!);

      expect(mockHandlers.onClick).toHaveBeenCalled();
    });

    it('should show is-expanded class when expanded', () => {
      const { container } = render(
        <AgentCharacterCard
          agent={mockAgent}
          size="orchestrator"
          isExpanded={true}
          onHover={mockHandlers.onHover}
          onClick={mockHandlers.onClick}
        />
      );

      const card = container.querySelector('.is-expanded');
      expect(card).toBeInTheDocument();
    });

    it('should keep status visible when expanded', () => {
      const { container } = render(
        <AgentCharacterCard
          agent={mockSubagent}
          size="subagent"
          isExpanded={true}
          onHover={mockHandlers.onHover}
          onClick={mockHandlers.onClick}
        />
      );

      const statusSection = container.querySelector('.card-status-section');
      expect(statusSection).toHaveStyle('opacity: 1');
    });
  });

  describe('Status States', () => {
    it('should apply status-idle class for idle agents', () => {
      const { container } = render(
        <AgentCharacterCard
          agent={mockAgent}
          size="orchestrator"
          isExpanded={false}
          onHover={mockHandlers.onHover}
          onClick={mockHandlers.onClick}
        />
      );

      const card = container.querySelector('.status-idle');
      expect(card).toBeInTheDocument();
    });

    it('should apply status-working class for working agents', () => {
      const { container } = render(
        <AgentCharacterCard
          agent={mockSubagent}
          size="subagent"
          isExpanded={false}
          onHover={mockHandlers.onHover}
          onClick={mockHandlers.onClick}
        />
      );

      const card = container.querySelector('.status-working');
      expect(card).toBeInTheDocument();
    });

    it('should display progress percentage', () => {
      const { container } = render(
        <AgentCharacterCard
          agent={mockSubagent}
          size="subagent"
          isExpanded={true}
          onHover={mockHandlers.onHover}
          onClick={mockHandlers.onClick}
        />
      );

      expect(screen.getByText('65%')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      const { container } = render(
        <AgentCharacterCard
          agent={mockAgent}
          size="orchestrator"
          isExpanded={false}
          onHover={mockHandlers.onHover}
          onClick={mockHandlers.onClick}
        />
      );

      const card = container.querySelector('[role="button"]');
      expect(card).toHaveAttribute('aria-label');
      expect(card).toHaveAttribute('aria-expanded');
    });

    it('should be keyboard accessible', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <AgentCharacterCard
          agent={mockAgent}
          size="orchestrator"
          isExpanded={false}
          onHover={mockHandlers.onHover}
          onClick={mockHandlers.onClick}
        />
      );

      const card = container.querySelector('[role="button"]');
      await user.tab();

      expect(card).toHaveFocus();
    });
  });
});

describe('AgentAvatar', () => {
  describe('Rendering', () => {
    it('should render avatar container', () => {
      const { container } = render(
        <AgentAvatar
          role="orchestrator"
          status="idle"
          isHovered={false}
          eyeTarget={null}
          size="orchestrator"
        />
      );

      const avatar = container.querySelector('.agent-avatar');
      expect(avatar).toBeInTheDocument();
    });

    it('should apply size variants', () => {
      const { container: orchestratorContainer } = render(
        <AgentAvatar
          role="orchestrator"
          status="idle"
          isHovered={false}
          eyeTarget={null}
          size="orchestrator"
        />
      );

      expect(orchestratorContainer.querySelector('.size-orchestrator')).toBeInTheDocument();

      const { container: subagentContainer } = render(
        <AgentAvatar
          role="read"
          status="idle"
          isHovered={false}
          eyeTarget={null}
          size="subagent"
        />
      );

      expect(subagentContainer.querySelector('.size-subagent')).toBeInTheDocument();
    });

    it('should render SVG face elements', () => {
      const { container } = render(
        <AgentAvatar
          role="orchestrator"
          status="idle"
          isHovered={false}
          eyeTarget={null}
          size="orchestrator"
        />
      );

      const svg = container.querySelector('svg.avatar-svg');
      expect(svg).toBeInTheDocument();

      // Check for key face elements
      const circles = svg?.querySelectorAll('circle');
      expect(circles?.length).toBeGreaterThan(4); // Body, head, 2 eyes minimum
    });
  });

  describe('Expression States', () => {
    const expressions = ['idle', 'thinking', 'working', 'error', 'success', 'waiting', 'spawning'];

    expressions.forEach((expression) => {
      it(`should apply expression-${expression} class`, () => {
        const { container } = render(
          <AgentAvatar
            role="orchestrator"
            status={expression as any}
            isHovered={false}
            eyeTarget={null}
            size="orchestrator"
          />
        );

        const avatar = container.querySelector(`.expression-${expression}`);
        expect(avatar).toBeInTheDocument();
      });
    });
  });

  describe('Aura Effects', () => {
    it('should have aura element', () => {
      const { container } = render(
        <AgentAvatar
          role="orchestrator"
          status="idle"
          isHovered={false}
          eyeTarget={null}
          size="orchestrator"
        />
      );

      const aura = container.querySelector('.avatar-aura');
      expect(aura).toBeInTheDocument();
    });

    it('should apply different aura states', () => {
      const statuses = ['idle', 'thinking', 'working', 'error'];

      statuses.forEach((status) => {
        const { container } = render(
          <AgentAvatar
            role="orchestrator"
            status={status as any}
            isHovered={false}
            eyeTarget={null}
            size="orchestrator"
          />
        );

        const aura = container.querySelector(`.aura-${status}`);
        expect(aura).toBeInTheDocument();
      });
    });
  });

  describe('Eye Tracking', () => {
    it('should update eyes based on eyeTarget', () => {
      const { container, rerender } = render(
        <AgentAvatar
          role="orchestrator"
          status="idle"
          isHovered={false}
          eyeTarget={null}
          size="orchestrator"
        />
      );

      const eyeCircle = container.querySelector('circle[cx="35"][cy="35"]');
      expect(eyeCircle).toBeInTheDocument();

      // Rerender with eye target
      rerender(
        <AgentAvatar
          role="orchestrator"
          status="idle"
          isHovered={true}
          eyeTarget={{ x: 0.3, y: -0.2 }}
          size="orchestrator"
        />
      );

      // Eyes should be updated (positions change)
      // This would be more specific with actual coordinate testing
      const updatedEye = container.querySelector('circle[cx*="35"]');
      expect(updatedEye).toBeInTheDocument();
    });

    it('should track cursor on hover', () => {
      const { container } = render(
        <AgentAvatar
          role="orchestrator"
          status="idle"
          isHovered={true}
          eyeTarget={{ x: 0.2, y: 0.1 }}
          size="orchestrator"
        />
      );

      const avatar = container.querySelector('.is-hovered');
      expect(avatar).toBeInTheDocument();
    });
  });

  describe('Role-based Styling', () => {
    const roles = ['orchestrator', 'explore', 'plan', 'bash', 'read', 'write', 'edit', 'grep', 'glob'];

    roles.forEach((role) => {
      it(`should render ${role} agent with appropriate styling`, () => {
        const { container } = render(
          <AgentAvatar
            role={role as any}
            status="idle"
            isHovered={false}
            eyeTarget={null}
            size="orchestrator"
          />
        );

        const avatar = container.querySelector('.agent-avatar');
        expect(avatar).toBeInTheDocument();

        // Should have aura with color
        const aura = container.querySelector('.avatar-aura');
        expect(aura).toHaveAttribute('style');
      });
    });
  });

  describe('Status Indicator', () => {
    it('should render status dot', () => {
      const { container } = render(
        <AgentAvatar
          role="orchestrator"
          status="idle"
          isHovered={false}
          eyeTarget={null}
          size="orchestrator"
        />
      );

      const statusDot = container.querySelector('.avatar-status-dot');
      expect(statusDot).toBeInTheDocument();
    });
  });
});
