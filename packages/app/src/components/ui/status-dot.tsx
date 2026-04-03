import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const statusDotVariants = cva(
  'inline-block rounded-full shrink-0',
  {
    variants: {
      status: {
        running: 'bg-accent',
        idle: 'bg-success',
        suspended: 'bg-text-muted',
        error: 'bg-destructive',
        connecting: 'bg-warning',
        stopped: 'bg-text-muted',
      },
      size: {
        sm: 'w-1.5 h-1.5',
        md: 'w-2 h-2',
      },
      pulse: {
        true: 'motion-safe:animate-[session-pulse_1500ms_ease-in-out_infinite]',
        false: '',
      },
    },
    defaultVariants: {
      status: 'stopped',
      size: 'md',
      pulse: false,
    },
  }
);

export interface StatusDotProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusDotVariants> {}

export function StatusDot({ className, status, size, pulse, ...props }: StatusDotProps) {
  const shouldPulse = pulse ?? (status === 'running' || status === 'connecting');
  return (
    <span
      className={cn(statusDotVariants({ status, size, pulse: shouldPulse }), className)}
      role="presentation"
      aria-hidden="true"
      {...props}
    />
  );
}

export { statusDotVariants };
