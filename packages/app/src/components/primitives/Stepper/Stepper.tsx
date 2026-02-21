import React from 'react';
import './Stepper.css';

export interface StepperStep {
  id: string;
  title: string;
  description?: string;
}

export interface StepperProps extends React.HTMLAttributes<HTMLDivElement> {
  steps: StepperStep[];
  activeStep: number;
  orientation?: 'horizontal' | 'vertical';
  variant?: 'checked' | 'numbered';
  size?: 'sm' | 'md';
  color?: 'blue' | 'green' | 'orange' | 'red' | 'accent';
}

const COLOR_MAP = {
  blue: 'var(--system-blue)',
  green: 'var(--system-green)',
  orange: 'var(--system-orange)',
  red: 'var(--system-red)',
  accent: 'var(--accent)',
};

const CheckmarkIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path
      d="M2.5 7L5.5 10L11.5 4"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const Stepper = React.forwardRef<HTMLDivElement, StepperProps>(
  (
    {
      steps,
      activeStep,
      orientation = 'horizontal',
      variant = 'numbered',
      size = 'md',
      color = 'blue',
      className,
      ...props
    },
    ref
  ) => {
    const colorValue = COLOR_MAP[color];

    const getStepState = (index: number): 'completed' | 'active' | 'upcoming' => {
      if (index < activeStep) return 'completed';
      if (index === activeStep) return 'active';
      return 'upcoming';
    };

    const renderIndicator = (index: number, _state: 'completed' | 'active' | 'upcoming') => {
      if (variant === 'checked') {
        return <CheckmarkIcon />;
      }
      return <span className="afw-stepper__number">{index + 1}</span>;
    };

    const getAriaLabel = (step: StepperStep, index: number, state: string) => {
      const stepNumber = index + 1;
      if (state === 'completed') {
        return `Step ${stepNumber}: ${step.title} (completed)`;
      }
      return `Step ${stepNumber}: ${step.title}`;
    };

    return (
      <div
        ref={ref}
        className={`afw-stepper afw-stepper--${orientation} ${className || ''}`}
        data-size={size}
        role="navigation"
        aria-label="Progress"
        style={{ '--stepper-color': colorValue } as React.CSSProperties}
        {...props}
      >
        {steps.map((step, index) => {
          const state = getStepState(index);
          const isLast = index === steps.length - 1;

          return (
            <div
              key={step.id}
              className={`afw-stepper__step afw-stepper__step--${state}`}
            >
              {orientation === 'horizontal' ? (
                <>
                  <div className="afw-stepper__indicator-row">
                    <div
                      className="afw-stepper__indicator"
                      aria-current={state === 'active' ? 'step' : undefined}
                      aria-label={getAriaLabel(step, index, state)}
                    >
                      {renderIndicator(index, state)}
                    </div>
                    {!isLast && (
                      <div
                        className={`afw-stepper__connector ${
                          state === 'completed' || state === 'active'
                            ? 'afw-stepper__connector--completed'
                            : ''
                        }`}
                      />
                    )}
                  </div>
                  <div className="afw-stepper__label">
                    <span className="afw-stepper__title">{step.title}</span>
                    {step.description && (
                      <span className="afw-stepper__description">{step.description}</span>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="afw-stepper__indicator-col">
                    <div
                      className="afw-stepper__indicator"
                      aria-current={state === 'active' ? 'step' : undefined}
                      aria-label={getAriaLabel(step, index, state)}
                    >
                      {renderIndicator(index, state)}
                    </div>
                    {!isLast && (
                      <div
                        className={`afw-stepper__connector ${
                          state === 'completed' || state === 'active'
                            ? 'afw-stepper__connector--completed'
                            : ''
                        }`}
                      />
                    )}
                  </div>
                  <div className="afw-stepper__label">
                    <span className="afw-stepper__title">{step.title}</span>
                    {step.description && (
                      <span className="afw-stepper__description">{step.description}</span>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    );
  }
);

Stepper.displayName = 'Stepper';
