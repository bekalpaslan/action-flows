/**
 * StarBookmarkDialog Component
 *
 * Modal dialog asking "Why are you starring this?" with category selection,
 * explanation textarea, and optional tags input.
 *
 * SRD Section 3.4: Bookmark System
 */

import { useState, useCallback } from 'react';
import type { BookmarkCategory } from '@afw/shared';
import './StarBookmark.css';

interface StarBookmarkDialogProps {
  messageContent: string;
  onSubmit: (category: BookmarkCategory, explanation: string, tags: string[]) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const CATEGORIES: { value: BookmarkCategory; label: string; description: string }[] = [
  {
    value: 'useful-pattern',
    label: 'Useful Pattern',
    description: 'A pattern I want to reuse',
  },
  {
    value: 'good-output',
    label: 'Good Output',
    description: 'High-quality response to reference',
  },
  {
    value: 'want-to-automate',
    label: 'Want to Automate',
    description: 'Something I do repeatedly',
  },
  {
    value: 'reference-material',
    label: 'Reference',
    description: 'Helpful information to keep',
  },
  {
    value: 'other',
    label: 'Other',
    description: 'Other reason',
  },
];

const MAX_MESSAGE_PREVIEW = 200;

/**
 * Dialog asking "Why are you starring this?" with category selection,
 * explanation textarea, and optional tags input.
 */
export function StarBookmarkDialog({
  messageContent,
  onSubmit,
  onCancel,
  isLoading = false,
}: StarBookmarkDialogProps) {
  const [category, setCategory] = useState<BookmarkCategory>('useful-pattern');
  const [explanation, setExplanation] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  const handleAddTag = useCallback(() => {
    if (tagInput.trim()) {
      const newTag = tagInput.trim().toLowerCase();
      if (!tags.includes(newTag)) {
        setTags([...tags, newTag]);
      }
      setTagInput('');
    }
  }, [tagInput, tags]);

  const handleRemoveTag = useCallback(
    (tagToRemove: string) => {
      setTags(tags.filter((tag) => tag !== tagToRemove));
    },
    [tags]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAddTag();
      }
    },
    [handleAddTag]
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (explanation.trim()) {
        onSubmit(category, explanation, tags);
      }
    },
    [category, explanation, tags, onSubmit]
  );

  const messagePreview =
    messageContent.length > MAX_MESSAGE_PREVIEW
      ? messageContent.substring(0, MAX_MESSAGE_PREVIEW) + '...'
      : messageContent;

  return (
    <div className="star-bookmark-dialog-backdrop">
      <div className="star-bookmark-dialog">
        <div className="star-bookmark-dialog-header">
          <h3>★ Why are you starring this?</h3>
          <button
            className="close-button"
            onClick={onCancel}
            disabled={isLoading}
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        <div className="star-bookmark-dialog-body">
          <div className="message-preview">
            <p className="preview-label">Message Preview:</p>
            <div className="preview-content">{messagePreview}</div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Category</label>
              <div className="category-options">
                {CATEGORIES.map((cat) => (
                  <div key={cat.value} className="category-radio">
                    <input
                      type="radio"
                      id={`category-${cat.value}`}
                      name="category"
                      value={cat.value}
                      checked={category === cat.value}
                      onChange={(e) => setCategory(e.target.value as BookmarkCategory)}
                      disabled={isLoading}
                    />
                    <label htmlFor={`category-${cat.value}`}>
                      <div className="category-label">{cat.label}</div>
                      <div className="category-description">{cat.description}</div>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="explanation" className="form-label">
                Explanation (required)
              </label>
              <textarea
                id="explanation"
                className="explanation-input"
                placeholder="Tell us why you're starring this..."
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                disabled={isLoading}
                rows={4}
              />
            </div>

            <div className="form-group">
              <label htmlFor="tags" className="form-label">
                Tags (optional)
              </label>
              <div className="tags-input-wrapper">
                <input
                  id="tags"
                  type="text"
                  className="tags-input"
                  placeholder="Add tags (press Enter)"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="add-tag-button"
                  onClick={handleAddTag}
                  disabled={isLoading || !tagInput.trim()}
                  title="Add tag"
                >
                  +
                </button>
              </div>

              {tags.length > 0 && (
                <div className="tags-list">
                  {tags.map((tag) => (
                    <div key={tag} className="tag-chip">
                      <span>{tag}</span>
                      <button
                        type="button"
                        className="remove-tag"
                        onClick={() => handleRemoveTag(tag)}
                        disabled={isLoading}
                        title="Remove tag"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="star-bookmark-dialog-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isLoading || !explanation.trim()}
              >
                {isLoading ? 'Creating...' : 'Create Bookmark'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onCancel}
                disabled={isLoading}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
