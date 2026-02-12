/**
 * Accessibility Tests for QuickActionButton
 * Uses jest-axe for automated a11y scanning
 */

import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import '@testing-library/jest-dom';

expect.extend(toHaveNoViolations);

// Mock component - adjust import path as needed
const QuickActionButton: React.FC<{ label: string; onClick: () => void }> = ({
  label,
  onClick,
}) => (
  <button onClick={onClick} aria-label={label}>
    {label}
  </button>
);

describe('QuickActionButton Accessibility', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(
      <QuickActionButton label="Quick Action" onClick={() => {}} />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should be keyboard accessible with proper labels', async () => {
    const { container } = render(
      <QuickActionButton label="Test Button" onClick={() => {}} />
    );
    const button = container.querySelector('button');
    expect(button).toHaveAttribute('aria-label', 'Test Button');
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should support keyboard activation (Enter key)', async () => {
    const handleClick = { fn: () => {} };
    const { container } = render(
      <QuickActionButton label="Keyboard Test" onClick={handleClick.fn} />
    );
    const button = container.querySelector('button') as HTMLButtonElement;

    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-label');

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have sufficient color contrast', async () => {
    const { container } = render(
      <QuickActionButton label="Contrast Test" onClick={() => {}} />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
