import React, { forwardRef, useState, useRef, useCallback, useEffect } from 'react';
import './Slider.css';

const COLOR_MAP = {
  blue: 'var(--system-blue)',
  green: 'var(--system-green)',
  orange: 'var(--system-orange)',
  red: 'var(--system-red)',
  accent: 'var(--accent)',
};

export interface SliderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  variant?: 'single' | 'range';
  min?: number;
  max?: number;
  step?: number;
  value?: number;
  rangeValue?: [number, number];
  onChange?: (value: number) => void;
  onRangeChange?: (value: [number, number]) => void;
  size?: 'sm' | 'md';
  label?: string;
  showValue?: boolean;
  disabled?: boolean;
  color?: 'blue' | 'green' | 'orange' | 'red' | 'accent';
}

export const Slider = forwardRef<HTMLDivElement, SliderProps>(
  (
    {
      variant = 'single',
      min = 0,
      max = 100,
      step = 1,
      value: controlledValue,
      rangeValue: controlledRangeValue,
      onChange,
      onRangeChange,
      size = 'md',
      label,
      showValue = true,
      disabled = false,
      color = 'blue',
      className,
      ...rest
    },
    ref
  ) => {
    // Internal state for uncontrolled mode
    const [internalValue, setInternalValue] = useState(controlledValue ?? min);
    const [internalRangeValue, setInternalRangeValue] = useState<[number, number]>(
      controlledRangeValue ?? [min, min + (max - min) / 4]
    );

    const value = controlledValue ?? internalValue;
    const rangeValue = controlledRangeValue ?? internalRangeValue;

    const trackRef = useRef<HTMLDivElement>(null);
    const draggingThumbRef = useRef<'single' | 'min' | 'max' | null>(null);

    // Clamp and snap to step
    const clampValue = useCallback(
      (val: number): number => {
        const clamped = Math.max(min, Math.min(max, val));
        const snapped = Math.round(clamped / step) * step;
        return snapped;
      },
      [min, max, step]
    );

    // Calculate percentage from value
    const valueToPercent = useCallback(
      (val: number): number => {
        return ((val - min) / (max - min)) * 100;
      },
      [min, max]
    );

    // Calculate value from mouse position
    const positionToValue = useCallback(
      (clientX: number): number => {
        if (!trackRef.current) return min;
        const rect = trackRef.current.getBoundingClientRect();
        const percent = (clientX - rect.left) / rect.width;
        const rawValue = min + percent * (max - min);
        return clampValue(rawValue);
      },
      [min, max, clampValue]
    );

    // Handle mouse down on thumb
    const handleThumbMouseDown = useCallback(
      (thumb: 'single' | 'min' | 'max') => (e: React.MouseEvent) => {
        if (disabled) return;
        e.preventDefault();
        draggingThumbRef.current = thumb;
      },
      [disabled]
    );

    // Handle mouse move (drag)
    const handleMouseMove = useCallback(
      (e: MouseEvent) => {
        if (!draggingThumbRef.current) return;
        const newValue = positionToValue(e.clientX);

        if (variant === 'single') {
          setInternalValue(newValue);
          onChange?.(newValue);
        } else {
          const [minVal, maxVal] = rangeValue;
          if (draggingThumbRef.current === 'min') {
            const constrainedMin = Math.min(newValue, maxVal);
            const newRange: [number, number] = [constrainedMin, maxVal];
            setInternalRangeValue(newRange);
            onRangeChange?.(newRange);
          } else if (draggingThumbRef.current === 'max') {
            const constrainedMax = Math.max(newValue, minVal);
            const newRange: [number, number] = [minVal, constrainedMax];
            setInternalRangeValue(newRange);
            onRangeChange?.(newRange);
          }
        }
      },
      [variant, rangeValue, positionToValue, onChange, onRangeChange]
    );

    // Handle mouse up (end drag)
    const handleMouseUp = useCallback(() => {
      draggingThumbRef.current = null;
    }, []);

    // Attach/detach window listeners during drag
    useEffect(() => {
      if (draggingThumbRef.current) {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
          window.removeEventListener('mousemove', handleMouseMove);
          window.removeEventListener('mouseup', handleMouseUp);
        };
      }
    }, [handleMouseMove, handleMouseUp]);

    // Handle track click
    const handleTrackClick = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (disabled) return;
        if ((e.target as HTMLElement).classList.contains('afw-slider__thumb')) return;

        const newValue = positionToValue(e.clientX);

        if (variant === 'single') {
          setInternalValue(newValue);
          onChange?.(newValue);
        } else {
          // Move nearest thumb
          const [minVal, maxVal] = rangeValue;
          const distToMin = Math.abs(newValue - minVal);
          const distToMax = Math.abs(newValue - maxVal);

          if (distToMin < distToMax) {
            const constrainedMin = Math.min(newValue, maxVal);
            const newRange: [number, number] = [constrainedMin, maxVal];
            setInternalRangeValue(newRange);
            onRangeChange?.(newRange);
          } else {
            const constrainedMax = Math.max(newValue, minVal);
            const newRange: [number, number] = [minVal, constrainedMax];
            setInternalRangeValue(newRange);
            onRangeChange?.(newRange);
          }
        }
      },
      [disabled, variant, rangeValue, positionToValue, onChange, onRangeChange]
    );

    // Handle keyboard
    const handleKeyDown = useCallback(
      (thumb: 'single' | 'min' | 'max') => (e: React.KeyboardEvent) => {
        if (disabled) return;

        let delta = 0;
        let jumpTo: number | null = null;

        switch (e.key) {
          case 'ArrowRight':
          case 'ArrowUp':
            delta = step;
            e.preventDefault();
            break;
          case 'ArrowLeft':
          case 'ArrowDown':
            delta = -step;
            e.preventDefault();
            break;
          case 'Home':
            jumpTo = min;
            e.preventDefault();
            break;
          case 'End':
            jumpTo = max;
            e.preventDefault();
            break;
          default:
            return;
        }

        if (variant === 'single') {
          const newValue = clampValue(jumpTo !== null ? jumpTo : value + delta);
          setInternalValue(newValue);
          onChange?.(newValue);
        } else {
          const [minVal, maxVal] = rangeValue;
          if (thumb === 'min') {
            const newMin = clampValue(jumpTo !== null ? jumpTo : minVal + delta);
            const constrainedMin = Math.min(newMin, maxVal);
            const newRange: [number, number] = [constrainedMin, maxVal];
            setInternalRangeValue(newRange);
            onRangeChange?.(newRange);
          } else if (thumb === 'max') {
            const newMax = clampValue(jumpTo !== null ? jumpTo : maxVal + delta);
            const constrainedMax = Math.max(newMax, minVal);
            const newRange: [number, number] = [minVal, constrainedMax];
            setInternalRangeValue(newRange);
            onRangeChange?.(newRange);
          }
        }
      },
      [disabled, variant, value, rangeValue, step, min, max, clampValue, onChange, onRangeChange]
    );

    // Render value display
    const renderValue = () => {
      if (!showValue) return null;
      if (variant === 'single') {
        return <span className="afw-slider__value">{value}</span>;
      } else {
        return (
          <span className="afw-slider__value">
            {rangeValue[0]} – {rangeValue[1]}
          </span>
        );
      }
    };

    // Calculate fill styles
    const fillStyle = (() => {
      const fillColor = COLOR_MAP[color];
      if (variant === 'single') {
        return {
          left: '0%',
          width: `${valueToPercent(value)}%`,
          backgroundColor: fillColor,
        };
      } else {
        const [minVal, maxVal] = rangeValue;
        return {
          left: `${valueToPercent(minVal)}%`,
          width: `${valueToPercent(maxVal) - valueToPercent(minVal)}%`,
          backgroundColor: fillColor,
        };
      }
    })();

    // Calculate thumb styles
    const singleThumbStyle = {
      left: `${valueToPercent(value)}%`,
      borderColor: COLOR_MAP[color],
    };

    const minThumbStyle = {
      left: `${valueToPercent(rangeValue[0])}%`,
      borderColor: COLOR_MAP[color],
    };

    const maxThumbStyle = {
      left: `${valueToPercent(rangeValue[1])}%`,
      borderColor: COLOR_MAP[color],
    };

    return (
      <div
        ref={ref}
        className={`afw-slider afw-slider--${variant} ${className || ''}`}
        data-size={size}
        data-disabled={disabled || undefined}
        {...rest}
      >
        {(label || showValue) && (
          <div className="afw-slider__header">
            {label && <span className="afw-slider__label">{label}</span>}
            {renderValue()}
          </div>
        )}

        <div
          ref={trackRef}
          className="afw-slider__track"
          onClick={handleTrackClick}
        >
          <div className="afw-slider__fill" style={fillStyle} />

          {variant === 'single' && (
            <div
              className="afw-slider__thumb"
              style={singleThumbStyle}
              role="slider"
              tabIndex={disabled ? -1 : 0}
              aria-valuenow={value}
              aria-valuemin={min}
              aria-valuemax={max}
              aria-label={label || 'Slider'}
              aria-disabled={disabled}
              onMouseDown={handleThumbMouseDown('single')}
              onKeyDown={handleKeyDown('single')}
            />
          )}

          {variant === 'range' && (
            <>
              <div
                className="afw-slider__thumb"
                style={minThumbStyle}
                role="slider"
                tabIndex={disabled ? -1 : 0}
                aria-valuenow={rangeValue[0]}
                aria-valuemin={min}
                aria-valuemax={max}
                aria-label="Minimum value"
                aria-disabled={disabled}
                onMouseDown={handleThumbMouseDown('min')}
                onKeyDown={handleKeyDown('min')}
              />
              <div
                className="afw-slider__thumb"
                style={maxThumbStyle}
                role="slider"
                tabIndex={disabled ? -1 : 0}
                aria-valuenow={rangeValue[1]}
                aria-valuemin={min}
                aria-valuemax={max}
                aria-label="Maximum value"
                aria-disabled={disabled}
                onMouseDown={handleThumbMouseDown('max')}
                onKeyDown={handleKeyDown('max')}
              />
            </>
          )}
        </div>
      </div>
    );
  }
);

Slider.displayName = 'Slider';
