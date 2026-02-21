import React, { useState, useRef, useEffect, cloneElement } from 'react';
import './Tooltip.css';

export interface TooltipProps {
  content: React.ReactNode;
  position?: 'top' | 'right' | 'bottom' | 'left';
  delay?: number;
  children: React.ReactElement;
}

let tooltipIdCounter = 0;

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  position = 'top',
  delay = 200,
  children,
}) => {
  const [visible, setVisible] = useState(false);
  const [tooltipId] = useState(() => `afw-tooltip-${++tooltipIdCounter}`);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const showTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const tooltipClassName = [
    'afw-tooltip__bubble',
    `afw-tooltip__bubble--${position}`,
    visible && 'afw-tooltip__bubble--visible',
  ]
    .filter(Boolean)
    .join(' ');

  // Clone the child element to add event handlers
  const trigger = cloneElement(children, {
    onMouseEnter: (e: React.MouseEvent) => {
      showTooltip();
      children.props.onMouseEnter?.(e);
    },
    onMouseLeave: (e: React.MouseEvent) => {
      hideTooltip();
      children.props.onMouseLeave?.(e);
    },
    onFocus: (e: React.FocusEvent) => {
      showTooltip();
      children.props.onFocus?.(e);
    },
    onBlur: (e: React.FocusEvent) => {
      hideTooltip();
      children.props.onBlur?.(e);
    },
    'aria-describedby': visible ? tooltipId : undefined,
  });

  return (
    <div ref={wrapperRef} className="afw-tooltip">
      {trigger}
      <div
        id={tooltipId}
        role="tooltip"
        className={tooltipClassName}
        aria-hidden={!visible}
      >
        <div className="afw-tooltip__content">{content}</div>
        <div className="afw-tooltip__arrow" />
      </div>
    </div>
  );
};

Tooltip.displayName = 'Tooltip';
