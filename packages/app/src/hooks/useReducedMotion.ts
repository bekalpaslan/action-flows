/**
 * useReducedMotion - Hook to detect prefers-reduced-motion setting
 *
 * Detects the user's system preference for reduced motion and updates
 * reactively when the setting changes.
 *
 * @returns {boolean} - true if user prefers reduced motion, false otherwise
 */

import { useState, useEffect } from 'react';

export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const handleChange = () => {
      setPrefersReducedMotion(mediaQuery.matches);
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }

    // Legacy browsers (Safari < 14) - use deprecated methods if addEventListener not available
    return () => {}; // No cleanup needed for modern browsers
  }, []);

  return prefersReducedMotion;
}
