import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-sm font-semibold text-caption',
  {
    variants: {
      variant: {
        default: 'bg-[rgba(138,138,138,0.15)] text-text-dim',
        success: 'bg-[rgba(126,153,213,0.15)] text-success',
        warning: 'bg-[rgba(252,163,17,0.15)] text-warning',
        error: 'bg-[rgba(214,133,2,0.15)] text-destructive',
        info: 'bg-[rgba(62,103,191,0.15)] text-info',
        accent: 'bg-[rgba(62,103,191,0.15)] text-accent',
      },
      size: {
        sm: 'px-1.5 py-0.5',
        md: 'px-2 py-0.5',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <span
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { badgeVariants };
