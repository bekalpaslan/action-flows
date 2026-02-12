/**
 * LoadingSpinner - Minimal loading indicator for Suspense boundaries
 *
 * Used by lazy-loaded components to show a lightweight loading state
 * while the component bundle is being fetched and parsed.
 */

import React from 'react';
import './LoadingSpinner.css';

export interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Loading...',
  size = 'md',
}) => {
  return (
    <div className={`loading-spinner loading-spinner--${size}`}>
      <div className="loading-spinner__spinner" />
      {message && <p className="loading-spinner__message">{message}</p>}
    </div>
  );
};

export default LoadingSpinner;
