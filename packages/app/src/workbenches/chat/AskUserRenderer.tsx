import { useState } from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { ParsedQuestion } from '@/lib/chat-types';

export interface AskUserRendererProps {
  question: ParsedQuestion;
  onSubmit: (response: string | string[]) => void;
  submitted: boolean;
}

/**
 * Renders an interactive AskUserQuestion from the Agent SDK using design system
 * components. Supports single_select (RadioGroup), multi_select (Checkbox),
 * free_text (Input), and confirmation (Yes/No buttons).
 *
 * After submission, controls are disabled and a "Submitted" badge appears.
 */
export function AskUserRenderer({ question, onSubmit, submitted }: AskUserRendererProps) {
  const [singleValue, setSingleValue] = useState<string>('');
  const [multiValues, setMultiValues] = useState<string[]>([]);
  const [freeText, setFreeText] = useState<string>('');

  const handleSubmit = () => {
    if (submitted) return;

    switch (question.type) {
      case 'single_select':
        onSubmit(singleValue);
        break;
      case 'multi_select':
        onSubmit(multiValues);
        break;
      case 'free_text':
        onSubmit(freeText);
        break;
    }
  };

  const isSubmitDisabled = (): boolean => {
    if (submitted) return true;
    switch (question.type) {
      case 'single_select':
        return singleValue === '';
      case 'multi_select':
        return multiValues.length === 0;
      case 'free_text':
        return freeText.trim() === '';
      case 'confirmation':
        return false; // confirmation uses direct buttons
      default:
        return true;
    }
  };

  const renderContent = () => {
    switch (question.type) {
      case 'single_select':
        return renderSingleSelect();
      case 'multi_select':
        return renderMultiSelect();
      case 'free_text':
        return renderFreeText();
      case 'confirmation':
        return renderConfirmation();
      default:
        return renderFallback();
    }
  };

  const renderSingleSelect = () => (
    <RadioGroup
      value={singleValue}
      onValueChange={(value: string) => setSingleValue(value)}
      disabled={submitted}
      className="gap-3"
    >
      {question.options?.map((option) => (
        <label
          key={option.value}
          className={cn(
            'flex items-center gap-3 p-3 rounded-lg border border-border cursor-pointer transition-colors',
            !submitted && 'hover:border-border-strong',
            singleValue === option.value && 'border-accent bg-surface-3',
            submitted && 'cursor-default opacity-75'
          )}
        >
          <RadioGroupItem value={option.value} />
          <div className="flex flex-col">
            <span className="text-body">{option.label}</span>
            {option.description && (
              <span className="text-caption text-text-dim">{option.description}</span>
            )}
          </div>
        </label>
      ))}
    </RadioGroup>
  );

  const renderMultiSelect = () => (
    <div className="flex flex-col gap-3">
      {question.options?.map((option) => {
        const isChecked = multiValues.includes(option.value);
        return (
          <label
            key={option.value}
            className={cn(
              'flex items-center gap-3 p-3 rounded-lg border border-border cursor-pointer transition-colors',
              !submitted && 'hover:border-border-strong',
              isChecked && 'border-accent bg-surface-3',
              submitted && 'cursor-default opacity-75'
            )}
          >
            <Checkbox
              checked={isChecked}
              disabled={submitted}
              onCheckedChange={(checked) => {
                if (checked) {
                  setMultiValues((prev) => [...prev, option.value]);
                } else {
                  setMultiValues((prev) => prev.filter((v) => v !== option.value));
                }
              }}
            />
            <div className="flex flex-col">
              <span className="text-body">{option.label}</span>
              {option.description && (
                <span className="text-caption text-text-dim">{option.description}</span>
              )}
            </div>
          </label>
        );
      })}
    </div>
  );

  const renderFreeText = () => (
    <div className="flex gap-2">
      <Input
        inputSize="md"
        value={freeText}
        onChange={(e) => setFreeText(e.target.value)}
        disabled={submitted}
        placeholder="Type your response..."
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !isSubmitDisabled()) {
            handleSubmit();
          }
        }}
      />
    </div>
  );

  const renderConfirmation = () => (
    <div className="flex gap-3">
      <Button
        variant="primary"
        size="sm"
        disabled={submitted}
        onClick={() => onSubmit('yes')}
      >
        Yes
      </Button>
      <Button
        variant="ghost"
        size="sm"
        disabled={submitted}
        onClick={() => onSubmit('no')}
      >
        No
      </Button>
    </div>
  );

  const renderFallback = () => (
    <div>
      <p className="text-body mb-2">{question.question}</p>
      <pre className="bg-surface-2 rounded-md p-2 text-caption font-mono overflow-x-auto">
        {JSON.stringify(question, null, 2)}
      </pre>
    </div>
  );

  return (
    <div className="border-l-2 border-accent bg-surface-2 rounded-md p-3">
      <p className="text-body font-semibold mb-3">{question.question}</p>

      {renderContent()}

      {/* Submit section (not shown for confirmation - it has its own buttons) */}
      {question.type !== 'confirmation' && (
        <div className="flex items-center gap-2 mt-3">
          <Button
            variant="primary"
            size="sm"
            disabled={isSubmitDisabled()}
            onClick={handleSubmit}
          >
            Send Response
          </Button>
          {submitted && (
            <Badge variant="success" size="sm">
              Submitted
            </Badge>
          )}
        </div>
      )}

      {/* Show Submitted badge for confirmation too */}
      {question.type === 'confirmation' && submitted && (
        <div className="flex items-center gap-2 mt-3">
          <Button variant="primary" size="sm" disabled>
            Send Response
          </Button>
          <Badge variant="success" size="sm">
            Submitted
          </Badge>
        </div>
      )}
    </div>
  );
}
