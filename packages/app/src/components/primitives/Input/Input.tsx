import React, { forwardRef, useId, useState, useCallback, useRef, useEffect } from 'react';
import './Input.css';

// Base props shared by both input and textarea
interface BaseInputProps {
  variant?: 'text' | 'textarea' | 'password' | 'search' | 'email' | 'tel' | 'url' | 'number';
  size?: 'sm' | 'md' | 'lg';
  state?: 'default' | 'error' | 'success';
  label?: string;
  helperText?: string;
  errorText?: string;
  successText?: string;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  clearable?: boolean;
  onClear?: () => void;
  showCharacterCount?: boolean;
  maxLength?: number;
  hiddenLabel?: boolean;
  className?: string;
  id?: string;
  required?: boolean;
  optional?: boolean;
  fullWidth?: boolean;
}

// Input-specific props
export interface InputProps extends BaseInputProps, Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'prefix'> {
  variant?: 'text' | 'password' | 'search' | 'email' | 'tel' | 'url' | 'number';
}

// Textarea-specific props
export interface TextareaProps extends BaseInputProps, Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'prefix'> {
  variant: 'textarea';
  rows?: number;
  autoResize?: boolean;
  minRows?: number;
  maxRows?: number;
}

// Union type for discriminated props
export type UnifiedInputProps = InputProps | TextareaProps;

export const Input = forwardRef<HTMLInputElement | HTMLTextAreaElement, UnifiedInputProps>(
  (props, ref) => {
    const {
      variant = 'text',
      size = 'md',
      state = 'default',
      label,
      helperText,
      errorText,
      successText,
      prefix,
      suffix,
      clearable = variant === 'search',
      onClear,
      showCharacterCount = false,
      maxLength,
      hiddenLabel = false,
      className,
      id: providedId,
      required = false,
      optional = false,
      fullWidth = false,
      disabled = false,
      readOnly = false,
      value,
      onChange,
      onKeyDown,
      ...restProps
    } = props;

    const autoId = useId();
    const id = providedId || autoId;
    const helperId = `${id}-helper`;
    const errorId = `${id}-error`;
    const successId = `${id}-success`;

    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    // Textarea auto-resize
    useEffect(() => {
      if (variant === 'textarea' && (props as TextareaProps).autoResize && textareaRef.current) {
        const textarea = textareaRef.current;
        const minRows = (props as TextareaProps).minRows || 1;
        const maxRows = (props as TextareaProps).maxRows;

        // Reset height to auto to get the correct scrollHeight
        textarea.style.height = 'auto';

        const lineHeight = parseInt(window.getComputedStyle(textarea).lineHeight) || 24;
        const minHeight = minRows * lineHeight;
        const maxHeight = maxRows ? maxRows * lineHeight : Infinity;

        const newHeight = Math.min(Math.max(textarea.scrollHeight, minHeight), maxHeight);
        textarea.style.height = `${newHeight}px`;
      }
    }, [variant, value, props]);

    const handleClear = useCallback(() => {
      if (onClear) {
        onClear();
      }
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, [onClear]);

    const handlePasswordToggle = useCallback(() => {
      setShowPassword(prev => !prev);
    }, []);

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (variant === 'search' && e.key === 'Escape' && value) {
        handleClear();
      }
      if (onKeyDown) {
        onKeyDown(e as any);
      }
    }, [variant, value, handleClear, onKeyDown]);

    const handleRef = useCallback((node: HTMLInputElement | HTMLTextAreaElement | null) => {
      inputRef.current = node;
      if (variant === 'textarea') {
        textareaRef.current = node as HTMLTextAreaElement;
      }

      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        (ref as React.MutableRefObject<HTMLInputElement | HTMLTextAreaElement | null>).current = node;
      }
    }, [ref, variant]);

    // Determine the actual input type
    const inputType = variant === 'password'
      ? (showPassword ? 'text' : 'password')
      : variant === 'search'
      ? 'text'
      : variant === 'textarea'
      ? undefined
      : variant;

    // Determine which state-specific text to show
    const displayText = state === 'error' && errorText
      ? errorText
      : state === 'success' && successText
      ? successText
      : helperText;

    const displayTextId = state === 'error' && errorText
      ? errorId
      : state === 'success' && successText
      ? successId
      : helperId;

    // Character count (for textarea)
    const currentLength = typeof value === 'string' ? value.length : 0;
    const isOverLimit = maxLength !== undefined && currentLength > maxLength;

    // Container classes
    const containerClasses = [
      'afw-input',
      fullWidth && 'afw-input--full-width',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    // Wrapper classes
    const wrapperClasses = [
      'afw-input__wrapper',
      `afw-input__wrapper--${size}`,
      `afw-input__wrapper--${state}`,
      variant === 'textarea' && 'afw-input__wrapper--textarea',
      disabled && 'afw-input__wrapper--disabled',
      readOnly && 'afw-input__wrapper--readonly',
      isFocused && 'afw-input__wrapper--focused',
    ]
      .filter(Boolean)
      .join(' ');

    // SVG Icons
    const SearchIcon = () => (
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
        <line x1="10.5" y1="10.5" x2="13.5" y2="13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );

    const ClearIcon = () => (
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <line x1="4" y1="4" x2="12" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="12" y1="4" x2="4" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );

    const EyeOpenIcon = () => (
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M1 8C1 8 3.5 3 8 3C12.5 3 15 8 15 8C15 8 12.5 13 8 13C3.5 13 1 8 1 8Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    );

    const EyeClosedIcon = () => (
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M1 8C1 8 3.5 3 8 3C12.5 3 15 8 15 8C15 8 12.5 13 8 13C3.5 13 1 8 1 8Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.5" />
        <line x1="2" y1="2" x2="14" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );

    // Render prefix
    const renderPrefix = () => {
      if (variant === 'search') {
        return (
          <span className="afw-input__prefix">
            <SearchIcon />
          </span>
        );
      }
      if (prefix) {
        return <span className="afw-input__prefix">{prefix}</span>;
      }
      return null;
    };

    // Render actions (clear, password toggle, custom suffix)
    const renderActions = () => {
      const hasActions = clearable || variant === 'password' || suffix;
      if (!hasActions) return null;

      return (
        <span className="afw-input__actions">
          {clearable && value && !disabled && !readOnly && (
            <button
              type="button"
              className="afw-input__clear-btn"
              onClick={handleClear}
              aria-label="Clear input"
              tabIndex={-1}
            >
              <ClearIcon />
            </button>
          )}
          {variant === 'password' && !disabled && (
            <button
              type="button"
              className="afw-input__password-toggle"
              onClick={handlePasswordToggle}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
              tabIndex={-1}
            >
              {showPassword ? <EyeClosedIcon /> : <EyeOpenIcon />}
            </button>
          )}
          {suffix && <span className="afw-input__suffix">{suffix}</span>}
        </span>
      );
    };

    // Common field props
    const commonFieldProps = {
      id,
      disabled,
      readOnly,
      required,
      maxLength,
      value,
      onChange,
      onKeyDown: handleKeyDown,
      onFocus: () => setIsFocused(true),
      onBlur: () => setIsFocused(false),
      'aria-invalid': state === 'error',
      'aria-describedby': displayText ? displayTextId : undefined,
      'aria-required': required,
    };

    return (
      <div className={containerClasses}>
        {label && (
          <label
            htmlFor={id}
            className={[
              'afw-input__label',
              hiddenLabel && 'afw-input__label--hidden',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {label}
            {required && (
              <span className="afw-input__label-required" aria-label="required">
                {' '}*
              </span>
            )}
            {optional && !required && (
              <span className="afw-input__label-optional"> (optional)</span>
            )}
          </label>
        )}

        <div className={wrapperClasses}>
          {renderPrefix()}

          {variant === 'textarea' ? (
            <textarea
              ref={handleRef as React.Ref<HTMLTextAreaElement>}
              className="afw-input__field afw-input__field--textarea"
              rows={(props as TextareaProps).rows}
              {...commonFieldProps}
              {...(restProps as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
            />
          ) : (
            <input
              ref={handleRef as React.Ref<HTMLInputElement>}
              type={inputType}
              className="afw-input__field"
              {...commonFieldProps}
              {...(restProps as React.InputHTMLAttributes<HTMLInputElement>)}
            />
          )}

          {renderActions()}
        </div>

        {displayText && (
          <div
            id={displayTextId}
            className={[
              'afw-input__helper',
              state === 'error' && 'afw-input__helper--error',
              state === 'success' && 'afw-input__helper--success',
            ]
              .filter(Boolean)
              .join(' ')}
            role={state === 'error' ? 'alert' : undefined}
            aria-live={state !== 'default' ? 'polite' : undefined}
          >
            {displayText}
          </div>
        )}

        {variant === 'textarea' && showCharacterCount && maxLength !== undefined && (
          <div
            className={[
              'afw-input__char-count',
              isOverLimit && 'afw-input__char-count--over',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {currentLength}/{maxLength}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
