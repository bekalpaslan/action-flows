/**
 * CustomPromptDialog Component Tests
 *
 * Tests for the custom prompt button creation modal dialog.
 * Covers rendering, validation, context patterns parsing, and callbacks.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CustomPromptDialog } from './CustomPromptDialog';
import type { CustomPromptDialogProps } from './CustomPromptDialog';

describe('CustomPromptDialog', () => {
  const mockHandlers = {
    onSubmit: vi.fn(),
    onCancel: vi.fn(),
  };

  const defaultProps: CustomPromptDialogProps = {
    onSubmit: mockHandlers.onSubmit,
    onCancel: mockHandlers.onCancel,
    isLoading: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('Rendering', () => {
    it('should render dialog header with title and close button', () => {
      render(<CustomPromptDialog {...defaultProps} />);

      expect(screen.getByText('Create Custom Prompt Button')).toBeInTheDocument();
      expect(screen.getByLabelText('Close dialog')).toBeInTheDocument();
    });

    it('should render all form fields with correct labels', () => {
      render(<CustomPromptDialog {...defaultProps} />);

      expect(screen.getByLabelText(/alias \(required\)/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/prompt \(required\)/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/icon \(optional\)/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/context patterns \(optional\)/i)).toBeInTheDocument();
      expect(screen.getByText(/always show \(ignore context detection\)/i)).toBeInTheDocument();
    });

    it('should render form fields with placeholders', () => {
      render(<CustomPromptDialog {...defaultProps} />);

      const labelInput = screen.getByPlaceholderText(/e\.g\., Explain Code/i);
      expect(labelInput).toBeInTheDocument();

      const promptInput = screen.getByPlaceholderText(/Please explain this code/i);
      expect(promptInput).toBeInTheDocument();

      const iconInput = screen.getByPlaceholderText(/💬 or 🚀/i);
      expect(iconInput).toBeInTheDocument();
    });

    it('should render submit and cancel buttons', () => {
      render(<CustomPromptDialog {...defaultProps} />);

      expect(screen.getByRole('button', { name: /create button/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should show field hints for all inputs', () => {
      render(<CustomPromptDialog {...defaultProps} />);

      expect(screen.getByText(/this is the button label shown in the UI/i)).toBeInTheDocument();
      expect(screen.getByText(/emoji or icon name \(defaults to 💬 if empty\)/i)).toBeInTheDocument();
      expect(screen.getByText(/file path patterns that determine when this button appears/i)).toBeInTheDocument();
    });
  });

  describe('Required Field Validation', () => {
    it('should disable submit button when label is empty', () => {
      render(<CustomPromptDialog {...defaultProps} />);

      const submitButton = screen.getByRole('button', { name: /create button/i });
      expect(submitButton).toBeDisabled();
    });

    it('should disable submit button when prompt is empty', async () => {
      const user = userEvent.setup();
      render(<CustomPromptDialog {...defaultProps} />);

      const labelInput = screen.getByLabelText(/alias \(required\)/i);
      await user.type(labelInput, 'Test Label');

      const submitButton = screen.getByRole('button', { name: /create button/i });
      expect(submitButton).toBeDisabled();
    });

    it('should enable submit button when both label and prompt are filled', async () => {
      const user = userEvent.setup();
      render(<CustomPromptDialog {...defaultProps} />);

      const labelInput = screen.getByLabelText(/alias \(required\)/i);
      const promptInput = screen.getByLabelText(/prompt \(required\)/i);

      await user.type(labelInput, 'Test Label');
      await user.type(promptInput, 'Test prompt text');

      const submitButton = screen.getByRole('button', { name: /create button/i });
      expect(submitButton).not.toBeDisabled();
    });

    it('should disable submit button when label contains only whitespace', async () => {
      const user = userEvent.setup();
      render(<CustomPromptDialog {...defaultProps} />);

      const labelInput = screen.getByLabelText(/alias \(required\)/i);
      const promptInput = screen.getByLabelText(/prompt \(required\)/i);

      await user.type(labelInput, '   ');
      await user.type(promptInput, 'Test prompt');

      const submitButton = screen.getByRole('button', { name: /create button/i });
      expect(submitButton).toBeDisabled();
    });

    it('should disable submit button when prompt contains only whitespace', async () => {
      const user = userEvent.setup();
      render(<CustomPromptDialog {...defaultProps} />);

      const labelInput = screen.getByLabelText(/alias \(required\)/i);
      const promptInput = screen.getByLabelText(/prompt \(required\)/i);

      await user.type(labelInput, 'Test Label');
      await user.type(promptInput, '   ');

      const submitButton = screen.getByRole('button', { name: /create button/i });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Context Patterns Parsing', () => {
    it('should parse single context pattern correctly', async () => {
      const user = userEvent.setup();
      render(<CustomPromptDialog {...defaultProps} />);

      const labelInput = screen.getByLabelText(/alias \(required\)/i);
      const promptInput = screen.getByLabelText(/prompt \(required\)/i);
      const contextPatternsInput = screen.getByLabelText(/context patterns \(optional\)/i);

      await user.type(labelInput, 'Test Label');
      await user.type(promptInput, 'Test prompt');
      await user.type(contextPatternsInput, '.*\\.tsx$');

      await waitFor(() => {
        expect((screen.getByLabelText(/alias \(required\)/i) as HTMLInputElement).value).toBeTruthy();
      });

      const submitButton = screen.getByRole('button', { name: /create button/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockHandlers.onSubmit).toHaveBeenCalledWith(
          'Test Label',
          'Test prompt',
          undefined,
          ['.*\\.tsx$'],
          false
        );
      });
    });

    it('should parse multiple context patterns separated by newlines', async () => {
      render(<CustomPromptDialog {...defaultProps} />);

      const labelInput = screen.getByLabelText(/alias \(required\)/i);
      const promptInput = screen.getByLabelText(/prompt \(required\)/i);
      const contextPatternsInput = screen.getByLabelText(/context patterns \(optional\)/i);

      fireEvent.change(labelInput, { target: { value: 'Test Label' } });
      fireEvent.change(promptInput, { target: { value: 'Test prompt' } });
      fireEvent.change(contextPatternsInput, { target: { value: '.*\\.tsx$\n.*\\.ts$\n.*auth.*' } });

      const form = screen.getByRole('button', { name: /create button/i }).closest('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockHandlers.onSubmit).toHaveBeenCalledWith(
          'Test Label',
          'Test prompt',
          undefined,
          ['.*\\.tsx$', '.*\\.ts$', '.*auth.*'],
          false
        );
      });
    });

    it('should filter out empty lines in context patterns', async () => {
      render(<CustomPromptDialog {...defaultProps} />);

      fireEvent.change(screen.getByLabelText(/alias \(required\)/i), { target: { value: 'Test Label' } });
      fireEvent.change(screen.getByLabelText(/prompt \(required\)/i), { target: { value: 'Test prompt' } });
      fireEvent.change(screen.getByLabelText(/context patterns \(optional\)/i), { target: { value: '.*\\.tsx$\n\n.*\\.ts$\n   \n.*auth.*' } });

      const form = screen.getByRole('button', { name: /create button/i }).closest('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockHandlers.onSubmit).toHaveBeenCalledWith(
          'Test Label',
          'Test prompt',
          undefined,
          ['.*\\.tsx$', '.*\\.ts$', '.*auth.*'],
          false
        );
      });
    });

    it('should trim whitespace from context patterns', async () => {
      render(<CustomPromptDialog {...defaultProps} />);

      const labelInput = screen.getByLabelText(/alias \(required\)/i);
      const promptInput = screen.getByLabelText(/prompt \(required\)/i);
      const contextPatternsInput = screen.getByLabelText(/context patterns \(optional\)/i);

      fireEvent.change(labelInput, { target: { value: 'Test Label' } });
      fireEvent.change(promptInput, { target: { value: 'Test prompt' } });
      fireEvent.change(contextPatternsInput, { target: { value: '  .*\\.tsx$  \n  .*\\.ts$  ' } });

      const form = screen.getByRole('button', { name: /create button/i }).closest('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockHandlers.onSubmit).toHaveBeenCalledWith(
          'Test Label',
          'Test prompt',
          undefined,
          ['.*\\.tsx$', '.*\\.ts$'],
          false
        );
      });
    });

    it('should pass undefined when context patterns field is empty', async () => {
      render(<CustomPromptDialog {...defaultProps} />);

      fireEvent.change(screen.getByLabelText(/alias \(required\)/i), { target: { value: 'Test Label' } });
      fireEvent.change(screen.getByLabelText(/prompt \(required\)/i), { target: { value: 'Test prompt' } });

      const form = screen.getByRole('button', { name: /create button/i }).closest('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockHandlers.onSubmit).toHaveBeenCalledWith(
          'Test Label',
          'Test prompt',
          undefined,
          undefined,
          false
        );
      });
    });
  });

  describe('Submit Callback', () => {
    it('should call onSubmit with correct parameters', async () => {
      render(<CustomPromptDialog {...defaultProps} />);

      fireEvent.change(screen.getByLabelText(/alias \(required\)/i), { target: { value: 'My Custom Button' } });
      fireEvent.change(screen.getByLabelText(/prompt \(required\)/i), { target: { value: 'This is the prompt text' } });

      const form = screen.getByRole('button', { name: /create button/i }).closest('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockHandlers.onSubmit).toHaveBeenCalledWith(
          'My Custom Button',
          'This is the prompt text',
          undefined,
          undefined,
          false
        );
      });
    });

    it('should trim label and prompt before submitting', async () => {
      render(<CustomPromptDialog {...defaultProps} />);

      fireEvent.change(screen.getByLabelText(/alias \(required\)/i), { target: { value: '  My Custom Button  ' } });
      fireEvent.change(screen.getByLabelText(/prompt \(required\)/i), { target: { value: '  This is the prompt text  ' } });

      const form = screen.getByRole('button', { name: /create button/i }).closest('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockHandlers.onSubmit).toHaveBeenCalledWith(
          'My Custom Button',
          'This is the prompt text',
          undefined,
          undefined,
          false
        );
      });
    });

    it('should include icon when provided', async () => {
      render(<CustomPromptDialog {...defaultProps} />);

      fireEvent.change(screen.getByLabelText(/alias \(required\)/i), { target: { value: 'Test Label' } });
      fireEvent.change(screen.getByLabelText(/prompt \(required\)/i), { target: { value: 'Test prompt' } });
      fireEvent.change(screen.getByLabelText(/icon \(optional\)/i), { target: { value: '🚀' } });

      const form = screen.getByRole('button', { name: /create button/i }).closest('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockHandlers.onSubmit).toHaveBeenCalledWith(
          'Test Label',
          'Test prompt',
          '🚀',
          undefined,
          false
        );
      });
    });

    it('should pass undefined for icon when empty', async () => {
      render(<CustomPromptDialog {...defaultProps} />);

      fireEvent.change(screen.getByLabelText(/alias \(required\)/i), { target: { value: 'Test Label' } });
      fireEvent.change(screen.getByLabelText(/prompt \(required\)/i), { target: { value: 'Test prompt' } });

      const form = screen.getByRole('button', { name: /create button/i }).closest('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockHandlers.onSubmit).toHaveBeenCalledWith(
          'Test Label',
          'Test prompt',
          undefined,
          undefined,
          false
        );
      });
    });

    it('should include alwaysShow when checkbox is checked', async () => {
      render(<CustomPromptDialog {...defaultProps} />);

      fireEvent.change(screen.getByLabelText(/alias \(required\)/i), { target: { value: 'Test Label' } });
      fireEvent.change(screen.getByLabelText(/prompt \(required\)/i), { target: { value: 'Test prompt' } });
      fireEvent.click(screen.getByRole('checkbox'));

      const form = screen.getByRole('button', { name: /create button/i }).closest('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockHandlers.onSubmit).toHaveBeenCalledWith(
          'Test Label',
          'Test prompt',
          undefined,
          undefined,
          true
        );
      });
    });

    it('should include all parameters when all fields are filled', async () => {
      render(<CustomPromptDialog {...defaultProps} />);

      fireEvent.change(screen.getByLabelText(/alias \(required\)/i), { target: { value: 'Complete Button' } });
      fireEvent.change(screen.getByLabelText(/prompt \(required\)/i), { target: { value: 'Complete prompt' } });
      fireEvent.change(screen.getByLabelText(/icon \(optional\)/i), { target: { value: '⚡' } });
      fireEvent.change(screen.getByLabelText(/context patterns \(optional\)/i), { target: { value: '.*\\.tsx$\n.*auth.*' } });
      fireEvent.click(screen.getByRole('checkbox'));

      const form = screen.getByRole('button', { name: /create button/i }).closest('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockHandlers.onSubmit).toHaveBeenCalledWith(
          'Complete Button',
          'Complete prompt',
          '⚡',
          ['.*\\.tsx$', '.*auth.*'],
          true
        );
      });
    });

    it('should not call onSubmit when form is invalid', async () => {
      const user = userEvent.setup();
      render(<CustomPromptDialog {...defaultProps} />);

      const labelInput = screen.getByLabelText(/alias \(required\)/i);
      await user.type(labelInput, 'Only label');

      const submitButton = await screen.findByRole('button', { name: /create button/i });
      await user.click(submitButton);

      expect(mockHandlers.onSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Default Values', () => {
    it('should have empty strings for label, prompt, icon, and contextPatterns by default', () => {
      render(<CustomPromptDialog {...defaultProps} />);

      const labelInput = screen.getByLabelText(/alias \(required\)/i) as HTMLInputElement;
      const promptInput = screen.getByLabelText(/prompt \(required\)/i) as HTMLTextAreaElement;
      const iconInput = screen.getByLabelText(/icon \(optional\)/i) as HTMLInputElement;
      const contextPatternsInput = screen.getByLabelText(/context patterns \(optional\)/i) as HTMLTextAreaElement;

      expect(labelInput.value).toBe('');
      expect(promptInput.value).toBe('');
      expect(iconInput.value).toBe('');
      expect(contextPatternsInput.value).toBe('');
    });

    it('should have alwaysShow checkbox unchecked by default', () => {
      render(<CustomPromptDialog {...defaultProps} />);

      const alwaysShowCheckbox = screen.getByRole('checkbox') as HTMLInputElement;
      expect(alwaysShowCheckbox.checked).toBe(false);
    });

    it('should submit with alwaysShow=false when checkbox is not clicked', async () => {
      const user = userEvent.setup();
      render(<CustomPromptDialog {...defaultProps} />);

      const labelInput = screen.getByLabelText(/alias \(required\)/i);
      const promptInput = screen.getByLabelText(/prompt \(required\)/i);

      await user.type(labelInput, 'Test');
      await user.type(promptInput, 'Test');

      await waitFor(() => {
        expect((screen.getByLabelText(/alias \(required\)/i) as HTMLInputElement).value).toBeTruthy();
      });

      const submitButton = screen.getByRole('button', { name: /create button/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockHandlers.onSubmit).toHaveBeenCalledWith(
          'Test',
          'Test',
          undefined,
          undefined,
          false
        );
      });
    });
  });

  describe('Loading State', () => {
    it('should disable all inputs when isLoading is true', () => {
      render(<CustomPromptDialog {...defaultProps} isLoading={true} />);

      const labelInput = screen.getByLabelText(/alias \(required\)/i);
      const promptInput = screen.getByLabelText(/prompt \(required\)/i);
      const iconInput = screen.getByLabelText(/icon \(optional\)/i);
      const contextPatternsInput = screen.getByLabelText(/context patterns \(optional\)/i);
      const alwaysShowCheckbox = screen.getByRole('checkbox');

      expect(labelInput).toBeDisabled();
      expect(promptInput).toBeDisabled();
      expect(iconInput).toBeDisabled();
      expect(contextPatternsInput).toBeDisabled();
      expect(alwaysShowCheckbox).toBeDisabled();
    });

    it('should disable submit button when isLoading is true', () => {
      render(<CustomPromptDialog {...defaultProps} isLoading={true} />);

      const submitButton = screen.getByRole('button', { name: /creating\.\.\./i });
      expect(submitButton).toBeDisabled();
    });

    it('should disable cancel button when isLoading is true', () => {
      render(<CustomPromptDialog {...defaultProps} isLoading={true} />);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      expect(cancelButton).toBeDisabled();
    });

    it('should disable close button when isLoading is true', () => {
      render(<CustomPromptDialog {...defaultProps} isLoading={true} />);

      const closeButton = screen.getByLabelText('Close dialog');
      expect(closeButton).toBeDisabled();
    });

    it('should change submit button text to "Creating..." when loading', () => {
      render(<CustomPromptDialog {...defaultProps} isLoading={true} />);

      expect(screen.getByText('Creating...')).toBeInTheDocument();
    });

    it('should enable inputs when isLoading is false', () => {
      render(<CustomPromptDialog {...defaultProps} isLoading={false} />);

      const labelInput = screen.getByLabelText(/alias \(required\)/i);
      const promptInput = screen.getByLabelText(/prompt \(required\)/i);
      const iconInput = screen.getByLabelText(/icon \(optional\)/i);
      const contextPatternsInput = screen.getByLabelText(/context patterns \(optional\)/i);
      const alwaysShowCheckbox = screen.getByRole('checkbox');

      expect(labelInput).not.toBeDisabled();
      expect(promptInput).not.toBeDisabled();
      expect(iconInput).not.toBeDisabled();
      expect(contextPatternsInput).not.toBeDisabled();
      expect(alwaysShowCheckbox).not.toBeDisabled();
    });
  });

  describe('Close Callback', () => {
    it('should call onCancel when close button is clicked', async () => {
      const user = userEvent.setup();
      render(<CustomPromptDialog {...defaultProps} />);

      const closeButton = screen.getByLabelText('Close dialog');
      await user.click(closeButton);

      expect(mockHandlers.onCancel).toHaveBeenCalledTimes(1);
    });

    it('should call onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(<CustomPromptDialog {...defaultProps} />);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockHandlers.onCancel).toHaveBeenCalledTimes(1);
    });

    it('should not call onCancel when form is submitted', async () => {
      const user = userEvent.setup();
      render(<CustomPromptDialog {...defaultProps} />);

      const labelInput = screen.getByLabelText(/alias \(required\)/i);
      const promptInput = screen.getByLabelText(/prompt \(required\)/i);

      await user.type(labelInput, 'Test');
      await user.type(promptInput, 'Test');

      const submitButton = await screen.findByRole('button', { name: /create button/i });
      await user.click(submitButton);

      expect(mockHandlers.onCancel).not.toHaveBeenCalled();
    });
  });

  describe('Input Constraints', () => {
    it('should limit label input to 100 characters', () => {
      render(<CustomPromptDialog {...defaultProps} />);

      const labelInput = screen.getByLabelText(/alias \(required\)/i) as HTMLInputElement;
      expect(labelInput.maxLength).toBe(100);
    });

    it('should limit prompt input to 2000 characters', () => {
      render(<CustomPromptDialog {...defaultProps} />);

      const promptInput = screen.getByLabelText(/prompt \(required\)/i) as HTMLTextAreaElement;
      expect(promptInput.maxLength).toBe(2000);
    });

    it('should limit icon input to 10 characters', () => {
      render(<CustomPromptDialog {...defaultProps} />);

      const iconInput = screen.getByLabelText(/icon \(optional\)/i) as HTMLInputElement;
      expect(iconInput.maxLength).toBe(10);
    });

    it('should show character count for prompt field', () => {
      render(<CustomPromptDialog {...defaultProps} />);

      expect(screen.getByText(/\(0\/2000\)/i)).toBeInTheDocument();

      const promptInput = screen.getByLabelText(/prompt \(required\)/i);
      fireEvent.change(promptInput, { target: { value: 'Hello' } });

      expect(screen.getByText(/\(5\/2000\)/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA label on close button', () => {
      render(<CustomPromptDialog {...defaultProps} />);

      const closeButton = screen.getByLabelText('Close dialog');
      expect(closeButton).toHaveAttribute('aria-label', 'Close dialog');
    });

    it('should have form elements properly labeled', () => {
      render(<CustomPromptDialog {...defaultProps} />);

      const labelInput = screen.getByLabelText(/alias \(required\)/i);
      const promptInput = screen.getByLabelText(/prompt \(required\)/i);
      const iconInput = screen.getByLabelText(/icon \(optional\)/i);
      const contextPatternsInput = screen.getByLabelText(/context patterns \(optional\)/i);

      expect(labelInput).toHaveAttribute('id', 'label');
      expect(promptInput).toHaveAttribute('id', 'prompt');
      expect(iconInput).toHaveAttribute('id', 'icon');
      expect(contextPatternsInput).toHaveAttribute('id', 'contextPatterns');
    });
  });
});
