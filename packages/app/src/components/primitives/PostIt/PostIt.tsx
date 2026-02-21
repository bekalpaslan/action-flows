import React, { forwardRef } from 'react';
import './PostIt.css';

export interface PostItProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Color variant */
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'neutral';
  /** Whether the post-it is editable */
  editable?: boolean;
  /** Placeholder text when empty */
  placeholder?: string;
  /** Content */
  children?: React.ReactNode;
}

export const PostIt = forwardRef<HTMLDivElement, PostItProps>(
  (
    {
      color = 'yellow',
      editable = false,
      placeholder = 'Add text',
      children,
      className = '',
      ...props
    },
    ref
  ) => {
    const [content, setContent] = React.useState('');
    const contentRef = React.useRef<HTMLDivElement>(null);

    const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
      setContent(e.currentTarget.textContent || '');
    };

    const showPlaceholder = editable && !content && !children;

    return (
      <div
        ref={ref}
        className={`afw-post-it afw-post-it--${color} ${className}`}
        {...props}
      >
        {editable ? (
          <>
            <div
              ref={contentRef}
              className="afw-post-it__content"
              contentEditable
              onInput={handleInput}
              suppressContentEditableWarning
              aria-label="Editable post-it note"
              role="textbox"
            >
              {children}
            </div>
            {showPlaceholder && (
              <div className="afw-post-it__placeholder" aria-hidden="true">
                {placeholder}
              </div>
            )}
          </>
        ) : (
          <div className="afw-post-it__content">{children}</div>
        )}
      </div>
    );
  }
);

PostIt.displayName = 'PostIt';
