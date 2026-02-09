import React, { useState, useRef, KeyboardEvent } from 'react';
import './HumanInputField.css';

export interface HumanInputFieldProps {
  placeholder?: string;
  onSubmit: (value: string) => void;
  disabled?: boolean;
  sessionId?: string;
}

export const HumanInputField: React.FC<HumanInputFieldProps> = ({
  placeholder = "Type a message...",
  onSubmit,
  disabled = false,
  sessionId,
}) => {
  const [value, setValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    if (!value.trim() || disabled || isLoading) {
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit(value.trim());
      setValue('');
      inputRef.current?.focus();
    } catch (error) {
      console.error('Failed to submit input:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="human-input-field-container">
      {sessionId && (
        <div className="session-indicator" title={`Sending to session: ${sessionId}`}>
          <span className="session-dot"></span>
          <span className="session-id">{sessionId.slice(0, 8)}</span>
        </div>
      )}

      <div className={`human-input-field ${isFocused ? 'focused' : ''} ${disabled ? 'disabled' : ''}`}>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          disabled={disabled || isLoading}
          aria-label="Human input message"
          className="input-text"
        />

        <button
          onClick={handleSubmit}
          disabled={!value.trim() || disabled || isLoading}
          aria-label="Send message"
          className="send-button"
          title="Send message (Enter)"
        >
          {isLoading ? (
            <div className="loading-spinner" />
          ) : (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M22 2L11 13"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M22 2L15 22L11 13L2 9L22 2Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
};
