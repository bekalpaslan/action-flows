import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AskUserRenderer } from '../AskUserRenderer';
import type { ParsedQuestion } from '@/lib/chat-types';

describe('AskUserRenderer', () => {
  const singleSelectQuestion: ParsedQuestion = {
    type: 'single_select',
    question: 'Which framework do you prefer?',
    options: [
      { value: 'react', label: 'React', description: 'A JavaScript library for building UIs' },
      { value: 'vue', label: 'Vue', description: 'The progressive framework' },
      { value: 'angular', label: 'Angular' },
    ],
  };

  const multiSelectQuestion: ParsedQuestion = {
    type: 'multi_select',
    question: 'Select your preferred languages:',
    options: [
      { value: 'typescript', label: 'TypeScript' },
      { value: 'python', label: 'Python' },
      { value: 'rust', label: 'Rust' },
    ],
  };

  const confirmationQuestion: ParsedQuestion = {
    type: 'confirmation',
    question: 'Are you sure you want to proceed?',
  };

  const freeTextQuestion: ParsedQuestion = {
    type: 'free_text',
    question: 'What is the project name?',
  };

  it('Test 1: single_select renders RadioGroup with options, onSubmit receives selected value', () => {
    const onSubmit = vi.fn();
    render(
      <AskUserRenderer
        question={singleSelectQuestion}
        onSubmit={onSubmit}
        submitted={false}
      />
    );

    // Question text should be displayed
    expect(screen.getByText('Which framework do you prefer?')).toBeInTheDocument();

    // All option labels should be visible
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('Vue')).toBeInTheDocument();
    expect(screen.getByText('Angular')).toBeInTheDocument();

    // Description should be visible for options that have one
    expect(screen.getByText('A JavaScript library for building UIs')).toBeInTheDocument();

    // Click on the Vue radio option
    fireEvent.click(screen.getByText('Vue'));

    // Click submit
    fireEvent.click(screen.getByText('Send Response'));

    expect(onSubmit).toHaveBeenCalledWith('vue');
  });

  it('Test 2: multi_select renders Checkboxes, onSubmit receives array of selected values', () => {
    const onSubmit = vi.fn();
    render(
      <AskUserRenderer
        question={multiSelectQuestion}
        onSubmit={onSubmit}
        submitted={false}
      />
    );

    expect(screen.getByText('Select your preferred languages:')).toBeInTheDocument();

    // Click TypeScript and Rust checkboxes
    fireEvent.click(screen.getByText('TypeScript'));
    fireEvent.click(screen.getByText('Rust'));

    // Click submit
    fireEvent.click(screen.getByText('Send Response'));

    expect(onSubmit).toHaveBeenCalledWith(['typescript', 'rust']);
  });

  it('Test 3: confirmation renders Yes/No buttons, onSubmit receives "yes" or "no"', () => {
    const onSubmit = vi.fn();
    render(
      <AskUserRenderer
        question={confirmationQuestion}
        onSubmit={onSubmit}
        submitted={false}
      />
    );

    expect(screen.getByText('Are you sure you want to proceed?')).toBeInTheDocument();

    // Should have Yes and No buttons
    const yesButton = screen.getByText('Yes');
    const noButton = screen.getByText('No');
    expect(yesButton).toBeInTheDocument();
    expect(noButton).toBeInTheDocument();

    // Click Yes
    fireEvent.click(yesButton);

    expect(onSubmit).toHaveBeenCalledWith('yes');
  });

  it('Test 4: free_text renders Input + submit, onSubmit receives typed text', () => {
    const onSubmit = vi.fn();
    render(
      <AskUserRenderer
        question={freeTextQuestion}
        onSubmit={onSubmit}
        submitted={false}
      />
    );

    expect(screen.getByText('What is the project name?')).toBeInTheDocument();

    // Type into the input
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'MyProject' } });

    // Click submit
    fireEvent.click(screen.getByText('Send Response'));

    expect(onSubmit).toHaveBeenCalledWith('MyProject');
  });

  it('Test 5: after submission (submitted=true), controls are disabled and "Submitted" badge shown', () => {
    const onSubmit = vi.fn();
    render(
      <AskUserRenderer
        question={singleSelectQuestion}
        onSubmit={onSubmit}
        submitted={true}
      />
    );

    // "Submitted" badge should be visible
    expect(screen.getByText('Submitted')).toBeInTheDocument();

    // Submit button should be disabled
    const submitButton = screen.getByText('Send Response');
    expect(submitButton).toBeDisabled();
  });

  it('Test 6: submit button disabled when no selection made', () => {
    const onSubmit = vi.fn();
    render(
      <AskUserRenderer
        question={singleSelectQuestion}
        onSubmit={onSubmit}
        submitted={false}
      />
    );

    // Submit button should be disabled when no selection
    const submitButton = screen.getByText('Send Response');
    expect(submitButton).toBeDisabled();
  });
});
