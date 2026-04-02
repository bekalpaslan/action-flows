import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary:
          'bg-[rgba(62,103,191,0.95)] text-white hover:bg-accent active:bg-prussian-700 shadow-glow-default hover:shadow-glow-hover',
        secondary:
          'bg-[rgba(138,138,138,0.36)] text-text hover:bg-[rgba(138,138,138,0.42)]',
        ghost: 'bg-transparent text-text hover:bg-[rgba(255,255,255,0.08)]',
        destructive:
          'bg-[rgba(214,133,2,0.95)] text-white hover:bg-orange-400',
        outline:
          'border border-border bg-transparent text-text hover:border-border-strong',
      },
      size: {
        sm: 'h-8 px-3 text-caption',
        md: 'h-10 px-4 text-body',
        lg: 'h-12 px-6 text-body',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
