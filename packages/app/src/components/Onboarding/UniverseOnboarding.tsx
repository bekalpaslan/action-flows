/**
 * UniverseOnboarding - Guided 3-step tooltip sequence for cosmic map
 *
 * First-run experience that introduces users to the living universe navigation.
 * Shows welcome → command center → discovery tooltips positioned around key UI.
 *
 * Features:
 * - Dismissible at any time (Skip button)
 * - Progress indicator (step N/3)
 * - Persisted to localStorage to only show once
 * - Reset via Settings → General
 */

import React, { useState, useEffect } from 'react';
import './UniverseOnboarding.css';

interface TooltipStep {
  id: string;
  target: string; // CSS selector for positioning hint
  title: string;
  content: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

const ONBOARDING_STEPS: TooltipStep[] = [
  {
    id: 'welcome',
    target: '.cosmic-map',
    title: 'Welcome to Your Universe',
    content: 'This is your living universe. It grows with you as you explore.',
    position: 'top',
  },
  {
    id: 'command-center',
    target: '.command-center',
    title: 'Command Center',
    content: 'Send messages here to interact with your universe. Try saying hello!',
    position: 'top',
  },
  {
    id: 'discovery',
    target: '.region-star[data-fog-state="faint"]',
    title: 'Discovery',
    content: 'Some regions are hidden. Interact with the universe to reveal them.',
    position: 'right',
  },
];

export function UniverseOnboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem('afw-onboarding-completed') === 'true';
    } catch (e) {
      // localStorage unavailable (private mode)
      console.warn('[UniverseOnboarding] localStorage unavailable');
      return false;
    }
  });

  const handleDismiss = () => {
    try {
      localStorage.setItem('afw-onboarding-completed', 'true');
    } catch (e) {
      console.warn('[UniverseOnboarding] Failed to persist dismissal');
    }
    setDismissed(true);
  };

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleDismiss();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Skip keyboard handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleDismiss();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (dismissed) return null;

  const step = ONBOARDING_STEPS[currentStep];

  return (
    <>
      <div className="onboarding-overlay" onClick={handleDismiss} />
      <div
        className={`onboarding-tooltip tooltip-${step.position}`}
        data-step={step.id}
        role="dialog"
        aria-labelledby="onboarding-title"
        aria-describedby="onboarding-content"
      >
        <button
          className="tooltip-close"
          onClick={handleDismiss}
          aria-label="Close onboarding"
        >
          ×
        </button>
        <h3 id="onboarding-title">{step.title}</h3>
        <p id="onboarding-content">{step.content}</p>
        <div className="onboarding-controls">
          <button onClick={handleDismiss} className="btn-skip">
            Skip
          </button>
          <span className="step-indicator" aria-live="polite">
            {currentStep + 1} / {ONBOARDING_STEPS.length}
          </span>
          <div className="nav-buttons">
            {currentStep > 0 && (
              <button onClick={handlePrev} className="btn-prev">
                Previous
              </button>
            )}
            <button onClick={handleNext} className="btn-next">
              {currentStep === ONBOARDING_STEPS.length - 1 ? 'Done' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
