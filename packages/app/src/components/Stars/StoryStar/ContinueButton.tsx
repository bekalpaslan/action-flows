import { useState } from 'react';
import './ContinueButton.css';

interface ContinueButtonProps {
  onClick: () => Promise<void>;
  disabled?: boolean;
}

/**
 * ContinueButton Component
 * Prominent button with cosmic glow effect to trigger next chapter creation
 */
export function ContinueButton({ onClick, disabled = false }: ContinueButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    try {
      await onClick();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      className={`continue-button ${isLoading ? 'loading' : ''} ${disabled ? 'disabled' : ''}`}
      onClick={handleClick}
      disabled={disabled || isLoading}
      type="button"
      title="Continue to the next chapter"
    >
      <span className="continue-button__text">
        {isLoading ? 'Writing next chapter...' : 'Continue to Chapter →'}
      </span>
      {isLoading && <span className="continue-button__spinner" />}
    </button>
  );
}
